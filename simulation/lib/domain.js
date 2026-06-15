"use strict";
/**
 * Shared domain logic for the Aushang simulation — the deterministic parts that
 * several flows reuse. These mirror the REAL codebase (DIGITNEWS), not invented
 * behaviour:
 *
 *   - CONTENT_TYPES + ROUTING  ← src/lib/content/types.ts
 *   - redact()                 ← worker/src/aushang_worker/redaction.py (regex pack,
 *                                fail-closed, LOCATION excluded)
 *   - validateExtraction()     ← src/lib/content/extraction-schema.ts (strict, no
 *                                invented dates, nutri_is_estimate const true)
 *   - publishPost()            ← supabase publish_post RPC + migration 0020/0023
 *
 * Everything here is pure functions over plain objects — no network, no DB, no
 * real LLM. "The LLM advises, deterministic code decides": the only non-deterministic
 * step (the LLM) is mocked as `fakeLLM`, and EVERYTHING that gates publishing /
 * privacy is deterministic and lives here.
 */

// --- Content taxonomy + routing (mirrors src/lib/content/types.ts) -----------

const CONTENT_TYPES = ["meal_plan", "reflection", "health_notice", "event_notice", "info"];

const CONTENT_TYPE_LABELS = {
  meal_plan: "Speiseplan",
  reflection: "Rückblick",
  health_notice: "Gesundheits-Hinweis",
  event_notice: "Termin",
  info: "Info",
};

// Verbatim from src/lib/content/types.ts ROUTING.
const ROUTING = {
  meal_plan: { section: true, usesPostDetails: true, createsEvents: false },
  reflection: { section: true, usesPostDetails: true, createsEvents: false },
  health_notice: { section: true, usesPostDetails: false, createsEvents: false },
  event_notice: { section: false, usesPostDetails: false, createsEvents: true },
  info: { section: false, usesPostDetails: false, createsEvents: false },
};

// Which library a published post lands in (besides the Pinnwand, which gets all).
const SECTION_FOR = {
  meal_plan: "Essensplan",
  reflection: "Rückblick",
  health_notice: "Gesundheit (top-of-feed alert by severity)",
  event_notice: "Termine (+ calendar + ICS)",
  info: "Infos / general feed",
};

// --- Local PII redaction (mirrors worker/redaction.py regex pack) ------------
// Deterministic PII at confidence 1.0. LOCATION deliberately NOT masked (on a
// public board the "locations" are the org's own name/town). Fail-closed: a
// boundary assert downstream re-checks that nothing slipped through.

function redact(rawText) {
  const found = [];
  const counters = { NAME: 0, TEL: 0, MAIL: 0, IBAN: 0, GEBURT: 0 };
  let text = rawText;

  function mask(re, kind) {
    text = text.replace(re, () => {
      counters[kind] += 1;
      const ph = `[${kind}_${counters[kind]}]`;
      found.push({ kind, placeholder: ph });
      return ph;
    });
  }

  // Order matters: mask the HIGH-SPECIFICITY structured patterns (email, IBAN,
  // birthdate) BEFORE the looser phone pattern, so a greedy phone match can't
  // eat the tail of an IBAN and leave "DE89" behind. (This ordering subtlety is
  // real — the worker's regex pack is ordered for the same reason.)
  mask(/[\w.+-]+@[\w-]+\.[\w.-]+/g, "MAIL");
  mask(/\bDE\d{2}(?:\s?\d{2,4}){3,}\b/g, "IBAN");
  mask(/geb\.?\s*\d{1,2}\.\d{1,2}\.\d{2,4}/gi, "GEBURT");
  mask(/\b(?:\+49|0)[\d\s/-]{6,}\d/g, "TEL");
  // Name heuristic (stand-in for Presidio+spaCy NER, fail-closed).
  mask(/\b(Frau|Herr)\s+[A-ZÄÖÜ][a-zäöüß]+/g, "NAME");
  mask(/\b[A-ZÄÖÜ][a-zäöüß]+\s+[A-ZÄÖÜ][a-zäöüß]+(?=,)/g, "NAME");

  return { redactedText: text, redactions: found };
}

// The fail-closed boundary assert: re-scan the redacted text. If ANY raw PII
// pattern survived, the text is NOT safe to send to the external LLM.
function boundaryOk(redactedText) {
  const leaks = [];
  if (/[\w.+-]+@[\w-]+\.[\w.-]+/.test(redactedText)) leaks.push("email");
  if (/\b(?:\+49|0)[\d\s/-]{6,}\d/.test(redactedText)) leaks.push("phone");
  if (/\bDE\d{2}\d/.test(redactedText)) leaks.push("iban");
  if (/geb\.?\s*\d/.test(redactedText)) leaks.push("birthdate");
  return { ok: leaks.length === 0, leaks };
}

// --- Strict schema validation (mirrors extraction-schema.ts) -----------------
// Validation FAILURE => the post goes to the manual path; NEVER auto-published.

const ISO = /^\d{4}-\d{2}-\d{2}$/;
const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

function validateExtraction(suggestion) {
  const errors = [];
  if (!suggestion || typeof suggestion !== "object") {
    return { ok: false, errors: ["no object"] };
  }
  if (!CONTENT_TYPES.includes(suggestion.content_type_suggested)) {
    errors.push("content_type_suggested not in taxonomy");
  }
  if (typeof suggestion.title !== "string" || !suggestion.title.trim()) {
    errors.push("title missing");
  }
  const events = Array.isArray(suggestion.events) ? suggestion.events : [];
  events.forEach((e, i) => {
    if (!ISO.test(e.starts_on || "")) errors.push(`events[${i}].starts_on not ISO`);
    if (e.time_start && !HHMM.test(e.time_start)) errors.push(`events[${i}].time_start invalid`);
    if (typeof e.all_day !== "boolean") errors.push(`events[${i}].all_day not boolean`);
  });
  if (!Array.isArray(suggestion.ambiguous_dates)) {
    errors.push("ambiguous_dates not an array");
  }
  // Nutri-Score may never be claimed as official.
  if (suggestion.meal_plan && suggestion.meal_plan.nutri_is_estimate !== true) {
    errors.push("nutri_is_estimate must be const true");
  }
  return { ok: errors.length === 0, errors };
}

// --- Publish (mirrors publish_post RPC + migrations 0020/0023) ---------------
// Routing reads ONLY the admin-CONFIRMED content_type, never the suggestion.
// Reflections: original photo deleted at publish; clear_photo_allowed forced false.

function publishPost(draft, adminDecision) {
  const confirmed = (adminDecision.confirmedType || "").trim();
  const blockers = [];
  if (!CONTENT_TYPES.includes(confirmed)) {
    blockers.push("content_type not confirmed (NULL = unconfirmed) — cannot route");
  }
  if (!adminDecision.pressedPublish) {
    blockers.push("admin has not pressed publish — stays draft");
  }
  if (blockers.length > 0) {
    return { published: false, blockers, post: null };
  }

  const route = ROUTING[confirmed];
  const destinations = ["Pinnwand (every published post)"];
  if (route.section) destinations.push(SECTION_FOR[confirmed]);
  if (route.createsEvents) destinations.push("events table + ICS feeds");

  // Migration 0023: reflection originals deleted at publish; consent forced off.
  let rawPhotoDeleted = false;
  let clearPhotoAllowed = !!adminDecision.releaseOriginal;
  if (confirmed === "reflection") {
    rawPhotoDeleted = true; // raw original removed from the bucket
    clearPhotoAllowed = false; // forced false — consent path cannot release a deleted file
  }

  return {
    published: true,
    blockers: [],
    post: {
      id: draft.id,
      status: "published",
      contentType: confirmed, // CONFIRMED, not the suggestion
      usedSuggestion: draft.suggestion ? draft.suggestion.content_type_suggested : null,
      title: adminDecision.editedTitle || draft.title,
      destinations,
      createsEvents: route.createsEvents,
      rawPhotoDeleted,
      clearPhotoAllowed,
      sourceImagePath: rawPhotoDeleted ? null : draft.sourceImagePath,
    },
  };
}

// --- Double-gated clear-photo consent (mirrors migration 0020 + photo.ts) ----
// Original released to a member ONLY if member opted in AND admin released this
// post — both default OFF, decided server-side, served via signed URL only.

function resolvePhotoForMember(post, member, attempt) {
  // attempt.clientTriedToSetRelease is always ignored — the column is not client-writable.
  const memberOptedIn = member.photoConsent === true;
  const adminReleased = post.clearPhotoAllowed === true;
  const allow = memberOptedIn && adminReleased && !post.rawPhotoDeleted;
  return {
    allowOriginal: allow,
    clientReleaseIgnored: !!(attempt && attempt.clientTriedToSetRelease),
    delivery: allow ? "short-TTL signed URL to the ORIGINAL" : "blurred/redacted image only",
  };
}

// --- A deterministic stand-in for the LLM (the only "AI" call) ----------------
// In the real worker this is Claude on the REDACTED text. Here it's a canned
// suggestion keyed off the redacted text, so the sim is reproducible. The point
// of the sim is the DETERMINISTIC gates around it, not the model itself.

function fakeLLM(redactedText, captureDate, canned) {
  // `canned` lets a flow inject a specific (or deliberately broken) suggestion.
  if (canned) return canned;
  // A trivial classifier for the default happy path.
  if (/speiseplan/i.test(redactedText)) {
    return {
      content_type_suggested: "meal_plan",
      title: "Speiseplan",
      events: [],
      ambiguous_dates: [],
      meal_plan: { nutri_is_estimate: true },
    };
  }
  if (/elternabend|fest|ausflug|geschlossen/i.test(redactedText)) {
    return {
      content_type_suggested: "event_notice",
      title: "Termin",
      events: [{ title: "Elternabend", starts_on: "2026-07-24", time_start: "18:30", all_day: false }],
      ambiguous_dates: [],
    };
  }
  return { content_type_suggested: "info", title: "Info", events: [], ambiguous_dates: [] };
}

module.exports = {
  CONTENT_TYPES,
  CONTENT_TYPE_LABELS,
  ROUTING,
  SECTION_FOR,
  redact,
  boundaryOk,
  validateExtraction,
  publishPost,
  resolvePhotoForMember,
  fakeLLM,
};
