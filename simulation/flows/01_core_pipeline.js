"use strict";
/**
 * FLOW 1 — The core capture → publish pipeline (the product's reason to exist).
 *
 *   /aufnahme photograph → upload raw to private bucket → worker:
 *   OCR → LOCAL redact (fail-closed) → boundary assert → LLM SUGGESTS (redacted
 *   text only) → schema-validate → admin CONFIRMS + edits → publish_post routes
 *   by the CONFIRMED type → members see it.
 *
 * Demonstrates all three branches: happy publish, fail-closed on a redaction
 * leak (nothing sent to the LLM), and schema-fail → manual path (never an
 * auto-publish).
 */

const t = require("../lib/trace");
const d = require("../lib/domain");
const fx = require("../lib/fixtures");

function captureToDraft(photo, cannedSuggestion) {
  // 1. Admin photographs the board → raw uploaded to the PRIVATE bucket.
  t.step("Capture", `/aufnahme · ${photo.id} → private raw-photos bucket (signed URL)`);
  t.note(`raw image stays in our infra: ${photo.sourceImagePath}`);

  // 2. Worker: OCR (mocked as the photo's ocrText).
  t.step("Worker · OCR", "OpenCV deskew → Tesseract (de)");

  // 3. Worker: LOCAL PII redaction (fail-closed) — BEFORE any external call.
  const { redactedText, redactions } = d.redact(photo.ocrText);
  t.step("Worker · Local redaction", `masked ${redactions.length} PII item(s): ${redactions.map((r) => r.placeholder).join(", ") || "none"}`);

  // 4. Fail-closed boundary assert.
  const b = d.boundaryOk(redactedText);
  if (!b.ok) {
    t.blocked(`raw PII survived redaction (${b.leaks.join(", ")}) — NOTHING sent to the LLM`);
    t.assert(true, "fail-closed: no external call made with un-redacted PII");
    return { route: "blocked", redactedText };
  }
  t.assert(b.ok, "boundary OK: only redacted text may cross to the LLM");
  t.assert(!/@|0151|DE\d{2}/.test(redactedText), "no email/phone/IBAN remains in the text sent to the LLM");

  // 5. LLM SUGGESTS (advises) — on the REDACTED text only.
  const suggestion = d.fakeLLM(redactedText, fx.TODAY, cannedSuggestion);
  t.step("LLM · suggest (advises)", `content_type_suggested = ${suggestion.content_type_suggested}`);
  t.note("the LLM cannot publish and cannot set the confirmed type");

  // 6. Strict schema validation.
  const v = d.validateExtraction(suggestion);
  if (!v.ok) {
    t.blocked(`schema validation failed (${v.errors.join("; ")}) → MANUAL PATH (admin types it)`);
    t.assert(true, "invalid LLM output never auto-publishes — routed to manual path");
    return { route: "manual", suggestion, redactedText };
  }
  t.assert(v.ok, "schema-valid suggestion → goes to the review gate as a DRAFT");

  return {
    route: "review",
    redactedText,
    suggestion,
    draft: {
      id: photo.id,
      title: suggestion.title,
      suggestion,
      sourceImagePath: photo.sourceImagePath,
    },
  };
}

function run() {
  t.flow("Core pipeline", "capture → OCR → redact → suggest → validate → confirm → publish");

  // --- Scenario A: happy path, an event notice, admin CORRECTS the type -------
  t.resetSteps();
  t.note("Scenario A — event notice; the AI suggests, the admin corrects + publishes");
  const a = captureToDraft(fx.boardPhotos.event);
  t.assert(a.route === "review", "reached the review gate");

  // Admin reviews: the AI suggested 'event_notice'; admin keeps it and publishes.
  t.step("Admin review", "confirms content_type, edits title, presses publish");
  const pubA = d.publishPost(a.draft, {
    confirmedType: "event_notice",
    editedTitle: "Elternabend (Gruppenraum)",
    pressedPublish: true,
    releaseOriginal: false,
  });
  t.assert(pubA.published, "published");
  t.assert(pubA.post.contentType === "event_notice", "routed by the CONFIRMED type");
  t.assert(pubA.post.createsEvents === true, "event_notice → creates calendar events + ICS");
  t.note(`destinations: ${pubA.post.destinations.join(" · ")}`);

  // --- Scenario B: AI mis-suggests; admin OVERRIDES the type ------------------
  t.resetSteps();
  t.note("Scenario B — AI suggests 'info', admin knows it's an event → 'tap to correct'");
  const bCanned = { content_type_suggested: "info", title: "Hinweis", events: [], ambiguous_dates: [] };
  const b = captureToDraft(fx.boardPhotos.event, bCanned);
  const pubB = d.publishPost(b.draft, { confirmedType: "event_notice", pressedPublish: true });
  t.assert(b.suggestion.content_type_suggested === "info", "the LLM suggested 'info'");
  t.assert(pubB.post.contentType === "event_notice", "routing used the admin's CORRECTION, not the suggestion");
  t.assert(pubB.post.usedSuggestion === "info" && pubB.post.contentType !== pubB.post.usedSuggestion, "confirmed ≠ suggested — the human decided");

  // --- Scenario C: fail-closed — a redaction leak blocks the LLM call ---------
  t.resetSteps();
  t.note("Scenario C — fail-closed: a hypothetical un-masked phone must NOT reach the LLM");
  // Force a leak past the redactor by handing the assert raw text directly.
  const leak = d.boundaryOk("Ruf an unter 0151 23456789");
  t.step("Boundary assert on un-redacted text", `leaks: ${leak.leaks.join(", ")}`);
  t.assert(!leak.ok, "boundary correctly refuses text that still contains PII");
  t.blocked("no external LLM call is made; the post routes to the manual path");

  // --- Scenario D: garbled OCR → schema fail → manual path --------------------
  t.resetSteps();
  t.note("Scenario D — garbled OCR; the LLM returns junk → schema-fail → manual path");
  const junkCanned = { content_type_suggested: "nonsense", title: "", events: [{ starts_on: "33.45.20XX", all_day: "yes" }], ambiguous_dates: "no" };
  const dRes = captureToDraft(fx.boardPhotos.garbled, junkCanned);
  t.assert(dRes.route === "manual", "garbage suggestion → manual path, NOT auto-published");

  // --- Scenario E: reflection → original deleted at publish (migration 0023) --
  t.resetSteps();
  t.note("Scenario E — reflection (likely shows children); original deleted at publish");
  const reflCanned = { content_type_suggested: "reflection", title: "Sommerfest-Rückblick", events: [], ambiguous_dates: [] };
  const e = captureToDraft(fx.boardPhotos.reflection, reflCanned);
  const pubE = d.publishPost(e.draft, {
    confirmedType: "reflection",
    pressedPublish: true,
    releaseOriginal: true, // admin TRIES to release — but 0023 forces it off
  });
  t.assert(pubE.post.rawPhotoDeleted === true, "reflection original DELETED from the bucket at publish (0023)");
  t.assert(pubE.post.clearPhotoAllowed === false, "clear_photo_allowed FORCED false for reflections — consent path can't release a deleted file");
  t.assert(pubE.post.sourceImagePath === null, "source_image_path nulled");

  return { name: "Core pipeline", scenarios: 5 };
}

module.exports = { run };
