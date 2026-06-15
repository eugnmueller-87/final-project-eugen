# MVP Documentation — Aushang (Stretch Deliverable)

**This is the optional stretch:** a fully working, deployed AI system that extends the no-code POC
into a production-grade product. It is **live and in real-world testing**, not a mockup.

- **Live app:** https://kita-connect.cloud (invite-only — accounts are operator/admin-provisioned;
  there is deliberately **no public signup**)
- **Source code:** https://github.com/eugnmueller-87/DIGITNEWS
- **Status:** Phases 1–5 built; the full capture → publish pipeline runs end-to-end in production; a
  first Kita is testing it. Post-launch the app gained per-user **English/German** UI, decorative
  **AI cover images** (built, dormant until an EU image endpoint is deployed), a stronger
  **reflection-photo deletion** privacy rule, and a **Capacitor Android native shell** (remote-URL
  mode) that builds a Play-ready AAB in CI — see §9.

> **Access for review:** the app is invite-only by design (it handles a real Kita's data). For a
> grading walkthrough, request a provisioned demo account, or see the architecture + screenshots in
> the source repo's `docs/` and `README.md`. The privacy model (no public surface) is itself a
> deliverable, so an open-login demo is intentionally not provided.

---

## 1. Architecture overview

```
                ┌──────────────────────── Aushang web app (Next.js 16 · React 19 · TS · Vercel) ───────────────────────┐
 Capture     →  │  /aufnahme — admin photographs the board; browser compresses (HEIC→JPEG, ≤600KB) → signed-URL       │
                │             upload to the PRIVATE raw-photos bucket → finalizeCapture creates a 'processing' post     │
                │                                       │ short-TTL signed URL                                          │
                └───────────────────────────────────────┼──────────────────────────────────────────────────────────────┘
                                                        ▼
                ┌──────────────────────── OCR / redaction worker (FastAPI · Python · VPS · Docker) ─────────────────────┐
 Perceive    →  │  OpenCV deskew → Tesseract OCR (de)                                                                   │
 Redact      →  │  ★ LOCAL PII redaction (Presidio + spaCy de_core_news_lg + German regex pack, FAIL-CLOSED)           │
                │     → mask to [NAME_1]/[TEL_1]/… → blur image regions                                                 │
 Advise (AI) →  │  Claude (claude-haiku-4-5) on the REDACTED TEXT ONLY → SUGGESTS content_type + extracts dates/fields │
 Validate    →  │  schema-validate (shared contract) → callback (shared-secret, constant-time)                         │
                └───────────────────────────────────────┬──────────────────────────────────────────────────────────────┘
                                                        ▼  /api/worker/callback writes a DRAFT
                ┌──────────────────────── Review & publish (server, human-in-the-loop) ─────────────────────────────────┐
 Decide      →  │  /review — admin CONFIRMS content_type (pre-filled to the suggestion, tap to correct), edits, may     │
   (human)      │            release the original photo, and PUBLISHES → publish_post RPC: sets the CONFIRMED type,     │
                │            flips status to 'published', creates calendar events, fans out ICS + email + web push      │
                └───────────────────────────────────────┬──────────────────────────────────────────────────────────────┘
                                                        ▼  governed by RLS + column grants (Supabase EU)
                  Members: /feed (Pinnwand) · /bereiche (category hub + "new since last visit") · per-category
                  libraries (Essensplan/Rückblick/Termine/Infos/Gesundheit) · /kalender + per-user ICS · email digest
```

**The thesis, in code:** the LLM is reached **only** from the worker's `extraction.py`, **only with
locally-redacted text**, and returns a `content_type_suggested` + extracted fields. The admin
**confirms** `content_type`; the `publish_post` RPC routes on the **confirmed** value (NULL until
confirmed) — never the LLM's suggestion. Nothing is member-visible without an explicit admin publish.

## 2. Core AI capability demonstrated (the AI actually runs)

- **OCR** — OpenCV deskew → Tesseract (German) reads the photographed notice.
- **Local PII redaction** — Microsoft Presidio + spaCy `de_core_news_lg` + a German regex pack
  detect and mask PII **fail-closed**, *before* any external call; deterministic PII (phone/email/
  IBAN/birthdate) at confidence 1.0, fuzzy ML guesses above per-entity thresholds, `LOCATION`
  excluded so ordinary town/festival names aren't over-masked.
- **LLM structured extraction** — Claude (`claude-haiku-4-5`) reads the **redacted** text, **suggests**
  a content type, and pulls dates/meal-plans/events into a strict schema; relative dates resolved
  against the capture date (Europe/Berlin), unresolved ones declared in `ambiguous_dates[]`.
- **Deterministic routing** — by **confirmed** content type: meal plan → Essensplan, reflection →
  Rückblick, event → calendar + ICS + Termine, health → top-of-feed alert by severity, info →
  general feed; everything also appears on the Pinnwand.

## 3. Basic error handling (fails gracefully)

- **PII never leaks to the AI** — redaction is upstream and fail-closed; only redacted text is sent.
- **LLM output is schema-validated** — validation failure → the post goes to the **manual path**
  (`status 'failed'`/admin types it), **never auto-published**.
- **No invented dates** — anything the model can't resolve is listed in `ambiguous_dates[]`, not
  guessed; the meal-plan Nutri-Score is schema-forced to `nutri_is_estimate: true` (cannot claim an
  official rating).
- **No publish without a human** — routing reads only the admin-confirmed `content_type`.
- **Runs without the worker** — until the worker is deployed, captures upload and create a post but
  stay `processing`; the rest of the app is fully functional (the core feature is inert, not broken).
- **Privacy enforced at the DB** — PII columns are column-`REVOKE`'d from members; the clear-photo
  original is double-gated and signed-URL only.
- **Reflection originals are deleted at publish** (migration `0023`) — a *Rückblick* is the content
  type most likely to depict identifiable children, so on publish its raw original is deleted from
  the `raw-photos` bucket and `source_image_path` is nulled; `publish_post` **forces**
  `clear_photo_allowed = false` for reflections so the consent path can never release a now-deleted
  original. A failed delete is surfaced to the admin, never silently swallowed.

## 4. Setup & installation

```bash
# Web app (from the repo root)
cp .env.example .env.local          # fill NEXT_PUBLIC_SUPABASE_URL, ANON_KEY, SERVICE_ROLE_KEY, SITE_URL
npm install
# Apply supabase/migrations/0001…0023 in order (SQL editor or `supabase db push`)
npm run dev                          # http://localhost:3000
npm run verify                       # typecheck + lint + format + build + secret scans

# Worker (from worker/) — needs a VPS; the ML stack is heavy
docker build -t aushang-worker .
docker run -d --restart unless-stopped -p 8000:8000 \
  -e WORKER_SHARED_SECRET="<same as the app>" \
  -e APP_CALLBACK_URL="https://kita-connect.cloud" \
  -e ANTHROPIC_API_KEY="<key — lives on the worker ONLY>" \
  aushang-worker
```

`.env.example` documents the config. The **Anthropic key lives on the worker only** — the web app
never sees raw PII and never calls the LLM. `SUPABASE_SERVICE_ROLE_KEY` is server-only (bypasses
RLS); a CI/pre-commit secret scan **blocks the build** if any secret reaches the client bundle or
tracked source.

## 5. How to run / use it

- **Capture (admin):** `/aufnahme` → photograph the board → it uploads and creates a `processing`
  post → the worker OCRs/redacts/extracts → a draft appears for review.
- **Review & publish (admin):** `/review` → confirm the content type (tap to correct), edit the
  text, optionally release the original photo, **publish**.
- **Members:** `/feed` (the Pinnwand), `/bereiche` (category hub with "new since last visit"), the
  per-category libraries, `/kalender`, subscribe to the per-user **ICS** feed, get the email digest
  and web push.
- **Operator (you):** `/operator` to create orgs and admins; **admin** uses `/admin/mitglieder` to
  add members.

## 6. Known limitations & what production needs

- **OCR quality** depends on the photo; a poor read degrades to the manual path (admin types it).
- **Redaction recall** is tuned empirically with the admin review as backstop; a labelled-recall
  test is a pre-scale to-do.
- **LLM residency** — extraction uses **Claude (Anthropic, US-hosted)** on redacted text; the
  privacy guarantee holds via upstream redaction. Strict EU residency = swap the worker's
  `extraction` module to an **EU LLM (Mistral)**, a **one-module change**.
- **For production scale:** worker behind HTTPS (a `worker.` subdomain), regenerate
  `src/lib/database.types.ts` from the live schema, a per-model card, and a written retention
  schedule (tracked in the EU AI Act doc's gap list).

## 7. How it extends the POC

| No-code POC (n8n) | This MVP (live) |
|---|---|
| Regex redaction in a Code node, mock OCR | **Presidio + spaCy + regex**, fail-closed, on real Tesseract OCR in the worker |
| A few-field schema check | A strict shared **JSON Schema**; failure → manual path |
| Routing as a Code-node map | The `publish_post` **security-definer RPC** + RLS + per-category libraries + ICS/email/push |
| Consent = a boolean AND | DB **column-REVOKE** + server-minted **signed URL** + client-unwritable release flag |
| Mock data, manual trigger | A live **multi-tenant** app on Vercel + a VPS worker, a real Kita testing it |
| Proves the pipeline + safety patterns | Proves **production-readiness** |

## 8. Post-launch capabilities (built during real-world testing)

The same human-confirm gate and privacy boundary carry every one of these:

- **Per-user English/German UI** (`src/lib/i18n/`) — the whole app chrome translates; the *content*
  (OCR'd German post text) and emails stay German. The dictionaries are compile-checked: a missing
  or mismatched translation key is a **build error**, not a runtime gap.
- **Decorative AI cover images** (text-to-image, FLUX.1 [schnell]) — generated **from the redacted
  extraction (content type only)**, so the same zero-PII boundary as the text LLM call; no-people /
  decorative guardrails; **fail-open** (a missing cover never blocks a post); provider-agnostic via
  `IMAGE_API_URL`/`IMAGE_API_KEY` so the deployment points at an **EU-hosted** endpoint. The admin
  sees the cover in `/review` and can drop it before publishing. **Built, dormant** until the worker
  + an EU image endpoint are deployed.
- **Reflection-photo deletion at publish** (migration `0023`) — see §3; the strongest of the
  privacy rules, applied to the content type most likely to show children.
- **Honest data-residency disclosure** — the public `/datenschutz` page states truthfully that DB /
  storage / email and the **local PII masking** run in the EU and raw photos never leave our infra,
  while the structure-extraction step sends **only the already-masked text** to a specialised AI
  sub-processor that currently processes **outside the EU** (never raw photos / unmasked PII), with
  a stated intent to move that step into the EU too. Mirrors `docs/STORE_PRIVACY.md §1`.

## 9. Native app — Capacitor Android shell (toward app-store presence)

A **Capacitor** native shell wraps the live app for the Google Play Store — the route to
credibility and discoverability for the Kita channel.

- **Architecture: remote-URL mode** — the shell loads the live hosted app (`server.url` =
  kita-connect.cloud) rather than a static export, so all server components / middleware auth / API
  routes keep working unchanged. The right choice for a Next.js App-Router app.
- **Native camera** — `/aufnahme` swaps the web `<input capture>` for `@capacitor/camera` inside the
  native shell (`src/app/(app)/aufnahme/native-camera.ts`); the photo flows through the **exact same**
  compress → hash → upload → finalize pipeline, so the privacy/redaction path is unchanged. The
  bridge is dynamically imported so `@capacitor/*` never weighs on the web bundle.
- **Branded launcher icons + splash** generated from the sun mark; `appId` `app.aushang`.
- **Cloud AAB build** — `.github/workflows/android.yml` builds an installable `app-debug.aab` on
  demand (and a signed `app-release.aab` once the four `ANDROID_*` signing secrets are set), so no
  local JDK/Android SDK is needed.
- **Remaining native work** (tracked in `docs/NATIVE_TODO.md`): a signed release AAB, Android App
  Links (so invite/set-password open the app), native **FCM push** alongside the existing web push,
  the Play **closed test** (the launch long-pole), and a later **iOS** phase. `docs/STORE_PRIVACY.md`
  already holds the Play Data-Safety answers and German permission strings.

## 10. Repository

GitHub: **https://github.com/eugnmueller-87/DIGITNEWS** — organised `src/app/` (the authenticated
shell + capture/review/feed/calendar/operator routes), `src/lib/` (Supabase clients, content
routing, the extraction schema, the photo signed-URL decision, the four-layer auth, the `i18n/`
dictionaries), `worker/` (FastAPI OCR + Presidio redaction + Claude extraction + the dormant cover
generator), `android/` (the Capacitor native shell), `supabase/migrations/` (`0001`…`0023`),
`docs/` (ARCHITECTURE, GO_LIVE_CHECKLIST, STORE_PRIVACY, PLAY_LAUNCH, NATIVE_TODO, CAPACITOR),
`SECURITY.md` (adversarial-review findings), web/worker + Android CI workflows, and a commit history
across Phases 1–5 plus extensive post-launch work. Branding is single-source in
`src/config/brand.ts` (a rename is a one-file change).
