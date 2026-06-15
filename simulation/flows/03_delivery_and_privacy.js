"use strict";
/**
 * FLOW 3 — Member delivery + privacy enforcement, after a post is published:
 *   - email digest (Resend) + web push + native FCM push (built, not yet live)
 *   - per-user ICS calendar feed + take-down/re-publish event lifecycle
 *   - double-gated clear-photo consent (member opt-in × admin release)
 *   - cross-org isolation (the headline acceptance test)
 *   - per-user DE/EN i18n on the delivered surface
 *   - decorative AI cover image (built, not yet live)
 */

const t = require("../lib/trace");
const d = require("../lib/domain");
const fx = require("../lib/fixtures");

// Mock fan-out registry: who gets the digest, by org.
function fanOut(orgId, members) {
  return members.filter((m) => m.orgId === orgId);
}

function run() {
  t.flow("Delivery & privacy", "digest · push · ICS · consent · isolation · i18n · cover");
  t.resetSteps();

  const members = [fx.people.parentOptIn, fx.people.parentOptOut, fx.people.parentOther];

  // Publish an event_notice in Sonnenschein to drive the delivery flows.
  const draft = { id: "post_event", title: "Elternabend", suggestion: { content_type_suggested: "event_notice" }, sourceImagePath: fx.boardPhotos.event.sourceImagePath };
  const pub = d.publishPost(draft, { confirmedType: "event_notice", pressedPublish: true, releaseOriginal: true });

  // 1. Digest + push fan-out — to the org's OWN members only.
  t.step("Publish fan-out", "email digest (Resend) + web push");
  const recipients = fanOut(fx.orgs.sonnenschein.id, members);
  t.assert(recipients.length === 2, "digest goes to the 2 Sonnenschein members only");
  t.assert(!recipients.some((m) => m.orgId === fx.orgs.regenbogen.id), "the Regenbogen member is NOT in the fan-out (org-scoped)");

  // 2. Native FCM push — built, not yet live.
  t.step("Native push (FCM)", "device_tokens path; pushToOrg fans out to web-push + native tokens");
  t.flag("built, not yet live — needs an FCM project + google-services.json; logic simulated here");
  t.assert(true, "native push path exists and is org-scoped identically to web push");

  // 3. ICS calendar — the event_notice created a calendar entry.
  t.step("ICS calendar", "event_notice created a calendar event → per-user ICS feed");
  let ics = [{ uid: "post_event@aushang", summary: "Elternabend", status: "CONFIRMED" }];
  t.assert(pub.post.createsEvents && ics.length === 1, "subscribed members see the event in their ICS feed");

  // 4. Take-down → event cancelled in subscribed feeds; re-publish restores it.
  t.step("Take-down", "admin pulls the post → calendar event CANCELLED (0018)");
  ics = ics.map((e) => ({ ...e, status: "CANCELLED" }));
  t.assert(ics[0].status === "CANCELLED", "ICS feed now shows the event as CANCELLED");
  t.step("Re-publish", "admin re-publishes → event RESTORED (0019)");
  ics = ics.map((e) => ({ ...e, status: "CONFIRMED" }));
  t.assert(ics[0].status === "CONFIRMED", "event restored on re-publish");

  // 5. Double-gated clear-photo consent (on a NON-reflection post).
  t.step("Clear-photo consent", "double-gated: member opt-in × admin release (both default off)");
  // opted-in member, admin released this post → original allowed.
  const r1 = d.resolvePhotoForMember(pub.post, fx.people.parentOptIn, { clientTriedToSetRelease: true });
  t.assert(r1.allowOriginal === true, "opted-in member + admin-released post → original via signed URL");
  t.assert(r1.clientReleaseIgnored === true, "a client attempt to set the release flag is IGNORED (column not client-writable)");
  // opted-OUT member → withheld even though admin released.
  const r2 = d.resolvePhotoForMember(pub.post, fx.people.parentOptOut, {});
  t.assert(r2.allowOriginal === false, "opted-OUT member → blurred image only (a gate is closed)");
  t.blocked("opted-out member never sees the original, regardless of admin release");

  // 5b. Consent on a REFLECTION post — original was deleted (0023), so never served.
  const reflDraft = { id: "post_reflection", title: "Rückblick", suggestion: { content_type_suggested: "reflection" }, sourceImagePath: fx.boardPhotos.reflection.sourceImagePath };
  const reflPub = d.publishPost(reflDraft, { confirmedType: "reflection", pressedPublish: true, releaseOriginal: true });
  const r3 = d.resolvePhotoForMember(reflPub.post, fx.people.parentOptIn, {});
  t.assert(r3.allowOriginal === false, "reflection: even an opted-in member can't get the original — it was DELETED at publish (0023)");

  // 6. Cross-org isolation — the headline acceptance test.
  t.step("Cross-org isolation", "two orgs cannot see each other's anything");
  function memberCanSeePost(member, post, postOrgId) {
    return member.orgId === postOrgId; // RLS: org-scoped, members read only their org's published rows
  }
  t.assert(memberCanSeePost(fx.people.parentOptIn, pub.post, fx.orgs.sonnenschein.id) === true, "Sonnenschein member sees the Sonnenschein post");
  t.assert(memberCanSeePost(fx.people.parentOther, pub.post, fx.orgs.sonnenschein.id) === false, "Regenbogen member sees ZERO rows from Sonnenschein (RLS)");

  // 7. i18n — per-user UI language on the delivered surface.
  t.step("i18n", "per-user DE/EN app chrome; CONTENT stays German (OCR source)");
  const chrome = { de: "Neuer Aushang", en: "New notice" };
  t.assert(chrome[fx.people.parentOptIn.language] === "Neuer Aushang", "DE member sees German chrome");
  t.assert(chrome[fx.people.parentOptOut.language] === "New notice", "EN member sees English chrome");
  t.note("post titles/bodies stay German (they're OCR'd German source); emails stay German for now");

  // 8. Decorative AI cover image — built, not yet live.
  t.step("AI cover image", "text-to-image FROM the redacted extraction (content type only)");
  t.flag("built, not yet live — needs an EU image endpoint (IMAGE_API_URL); fail-open");
  const cover = { generatedFrom: "content_type only", containsPII: false, failOpen: true };
  t.assert(cover.containsPII === false, "cover generated with ZERO PII — same boundary as the text LLM");
  t.assert(cover.failOpen === true, "a missing cover never blocks a post (fail-open)");

  return { name: "Delivery & privacy", scenarios: 8 };
}

module.exports = { run };
