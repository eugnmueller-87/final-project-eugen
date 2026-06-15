"use strict";
/**
 * Mock data for the simulation. Two orgs (the headline isolation test), an
 * operator, admins, members, and a set of board photos that exercise every
 * content type + every failure mode. All synthetic — no real PII.
 */

const orgs = {
  sonnenschein: { id: "org_sonnenschein", name: "Kita Sonnenschein", town: "Musterstadt" },
  regenbogen: { id: "org_regenbogen", name: "Kita Regenbogen", town: "Andernort" },
};

const people = {
  operator: { id: "u_op", email: "operator@aushang.app", role: "superadmin", orgId: "org_operator" },
  adminS: { id: "u_adminS", email: "leitung@sonnenschein.de", role: "admin", orgId: orgs.sonnenschein.id },
  adminR: { id: "u_adminR", email: "leitung@regenbogen.de", role: "admin", orgId: orgs.regenbogen.id },
  // Member who opted IN to clear photos.
  parentOptIn: {
    id: "u_p1",
    email: "anna@example.de",
    role: "member",
    orgId: orgs.sonnenschein.id,
    photoConsent: true,
    language: "de",
  },
  // Member who did NOT opt in.
  parentOptOut: {
    id: "u_p2",
    email: "ben@example.de",
    role: "member",
    orgId: orgs.sonnenschein.id,
    photoConsent: false,
    language: "en",
  },
  // A member of the OTHER org (for the cross-org isolation test).
  parentOther: {
    id: "u_p3",
    email: "carla@example.de",
    role: "member",
    orgId: orgs.regenbogen.id,
    photoConsent: true,
    language: "de",
  },
};

// Board photos = raw OCR text the worker would read. Each carries PII to prove
// the redaction boundary, and a `kind` so flows can pick the right scenario.
const boardPhotos = {
  mealPlan: {
    id: "post_meal",
    kind: "meal_plan",
    sourceImagePath: "raw-photos/org_sonnenschein/meal.jpg",
    ocrText:
      "Speiseplan KW 30\nMo: Nudeln mit Tomatensauce\nDi: Kartoffelsuppe\n" +
      "Aushang vom Elternbeirat. Bei Fragen: Frau Meier, Tel. 0151 23456789, anna.meier@example.de",
  },
  event: {
    id: "post_event",
    kind: "event_notice",
    sourceImagePath: "raw-photos/org_sonnenschein/event.jpg",
    ocrText:
      "Elternabend am 24.07.2026 um 18:30 Uhr im Gruppenraum.\n" +
      "Anmeldung bei Frau Schulz, IBAN DE89 3704 0044 0532 0130 00 fuer den Beitrag.",
  },
  reflection: {
    id: "post_reflection",
    kind: "reflection",
    sourceImagePath: "raw-photos/org_sonnenschein/rueckblick.jpg",
    // A Rückblick — most likely to depict children (drives the 0023 delete rule).
    ocrText:
      "Rückblick: Unser Sommerfest war ein voller Erfolg!\n" +
      "Max Mustermann, geb. 12.03.2020, hat beim Sackhüpfen gewonnen.",
  },
  health: {
    id: "post_health",
    kind: "health_notice",
    sourceImagePath: "raw-photos/org_sonnenschein/laeuse.jpg",
    ocrText: "Achtung: In der Gruppe Marienkäfer wurden Läuse festgestellt. Bitte Kinder kontrollieren.",
  },
  // Deliberately garbled — drives the manual-path (schema-fail) scenario.
  garbled: {
    id: "post_garbled",
    kind: "broken",
    sourceImagePath: "raw-photos/org_sonnenschein/blurry.jpg",
    ocrText: "?? unleserlich ??? 33.45.20XX  ###",
  },
};

const SCHEDULE_LINK = "https://kita-connect.cloud/auth/callback?token_hash=MOCK&type=invite";
const TODAY = "2026-06-15"; // fixed capture date so relative dates resolve reproducibly

module.exports = { orgs, people, boardPhotos, SCHEDULE_LINK, TODAY };
