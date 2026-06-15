# EU AI Act Compliance — Aushang

**System:** AI-assisted digitization of a paper notice board (OCR + local PII redaction + LLM
structured extraction, with human confirmation before publishing)
**Regulation:** Regulation (EU) 2024/1689 (EU AI Act) · **Assessment date:** 2026-06

---

## 1. Risk classification

> **Classification: LIMITED RISK** (with elements that are Minimal risk).
> **Not** Unacceptable. **Not** High-risk.

## 2. Classification reasoning (step by step)

**Step 1 — Is it an AI system under Art. 3?** Yes. It uses (a) an OCR perception step, (b) an
ML-based PII classifier (Microsoft Presidio + spaCy NER), and (c) an LLM that generates a structured
inference (a suggested content type + extracted dates/fields). So the Act applies.

**Step 2 — Is it a prohibited (Unacceptable) practice (Art. 5)?** No. It does no social scoring, no
biometric categorisation, no emotion recognition, no subliminal manipulation, no real-time remote
biometric identification. It reads a photographed notice and *suggests structure for an admin to
confirm.* → **Not Unacceptable.**

**Step 3 — Is it High-risk (Art. 6 + Annex III)?** No. High-risk requires either (a) being a safety
component of a regulated product, or (b) falling in an Annex III area: biometrics, critical
infrastructure *safety*, education/vocational training (access, evaluation), employment, essential
private/public services (incl. creditworthiness, benefits), law enforcement, migration, justice,
democratic processes.

- **It is not a safety component** of any regulated product.
- **It makes no decision *about a person*.** It classifies *a notice* (meal plan / event / health
  notice / info) and extracts *dates and text*. It does not evaluate, score, admit, or rank any
  individual.
- **The "education" Annex III item does not apply.** That item covers AI used to *determine access
  to education, evaluate learning outcomes, or score exams* — decisions about learners. Aushang is
  used at a Kita as a **communication tool for parents**; it does not assess any child, decide
  admission, or evaluate a learner. It digitizes a hallway board.
- **The PII-detection step reduces, not creates, risk.** The NER classifier exists to *mask* names
  before any external call — it is a privacy control, not a profiling system; its output is
  placeholders, never a judgment about the person.
- → **Not High-risk.**

**Step 4 — Does it trigger transparency obligations (Art. 50 — Limited risk)?** Partially, and we
meet them by design. The LLM produces *suggested* content (a content-type label, extracted text)
that a human then sees. Art. 50 chiefly targets natural-person-facing chatbots and synthetic-media
labelling; **we adopt its transparency spirit**: the admin review screen explicitly labels the
content type as an **AI suggestion to confirm or correct** ("tap to correct"), and AI-extracted
fields are presented as drafts for review, never silently published as fact. → **Limited risk
(transparency obligations apply / adopted).**

**Step 5 — Otherwise Minimal risk.** The deterministic parts — OpenCV deskew, the regex PII pack,
the JSON-schema validation, the routing/publish RPC — are conventional software, not regulated AI
obligations.

**Net:** the system is **Limited risk**: lawful, low obligation, with transparency duties we meet.
The most consequential design facts — *(1) the LLM only suggests; a human confirms before anything
is published, and (2) PII is masked locally before any external AI call ever happens* — are exactly
what keep it out of the High-risk tier and make the residual AI risk auditable.

## 3. Mandatory requirements (Limited-risk obligations + voluntarily adopted High-risk-style controls)

Although Limited-risk, we apply several High-risk-style controls as good practice — appropriate
given the **sensitive population** (a Kita: notices can name children/parents). They also de-risk a
future reclassification if the use expands.

| Area | Obligation | How the design addresses it |
|---|---|---|
| **Transparency (Art. 50)** | Users know content is AI-generated / AI-suggested | The review screen labels the content type as an **AI suggestion to confirm** (pre-filled, "tap to correct"); extracted fields are shown as editable drafts. Members never see an AI label because **members never see un-confirmed AI output** — only what an admin confirmed and published. |
| **Human oversight (Art. 14 style)** | A human can understand, override, and not over-rely | **Human-in-the-loop by construction:** *no* post reaches a member without an admin confirming the content type and pressing publish. Routing reads only the **admin-confirmed** `content_type` (NULL until confirmed), never the LLM's `content_type_suggested`. The admin can edit every field or reject. |
| **Data & data governance (Art. 10 style)** | Relevant, documented data; minimisation | The LLM receives **only locally-redacted text** (PII masked to `[NAME_x]`); raw images and un-redacted PII never reach it. The system processes **only what the org already published on its own board** — no scraping, no new collection. See [GDPR doc](gdpr_documentation.md). |
| **Accuracy & robustness (Art. 15 style)** | Stated behaviour, tested, degrades safely | LLM output is **schema-validated** (strict JSON, `additionalProperties:false`); validation failure → the **manual path** (admin types it), **never an auto-publish**. The system **fails closed**: an unresolvable date goes to `ambiguous_dates[]` (not invented); the meal-plan Nutri-Score is schema-forced to `nutri_is_estimate: true` so the model *cannot* claim an official rating. |
| **Cybersecurity (Art. 15 style)** | Protect against misuse/attack | Four-layer security model (deny-by-default middleware → server auth helpers → security-definer RPCs → RLS + column grants); PII columns `REVOKE`'d from members; service-role key is server-only (compile-time `import "server-only"` boundary + a CI source-secret scan that **blocks the build** if a secret leaks); the build was put through **multi-agent adversarial security reviews** (recorded in `SECURITY.md`). |

## 4. Conformity Assessment Summary

> *(Formal-style summary — 1–2 pages.)*

**System name:** Aushang — AI-assisted notice-board digitization.

**What it does:** An admin photographs the organization's physical paper notice board. The system
deskews the image (OpenCV), reads the German text (Tesseract OCR), **detects and masks PII locally**
(Presidio + spaCy + a German regex pack, fail-closed), and sends **only the redacted text** to an
LLM, which **suggests** a content type (meal plan / reflection / health notice / event / info) and
extracts dates and structured fields into a strict schema. The admin **reviews** the suggestion,
corrects the type if needed, edits the text, and **publishes** — the only path to member visibility.
Published posts are routed by the **admin-confirmed** type to a private feed, a shared calendar with
an ICS subscription, per-category libraries, and an email/push digest.

**Risk class & basis:** **Limited risk.** It is a communication-support tool with a human in the
loop for every published item; it is not a prohibited practice, not a safety component, and falls in
no Annex III high-risk area (it makes no decision *about a person* — not education access, not
employment, not essential services). Transparency obligations (Art. 50) apply and are met.

**Applicable obligations and how addressed:**
1. *Transparency* — the AI's content-type suggestion and extracted fields are labelled as drafts to
   confirm/correct; nothing AI-produced reaches a member un-confirmed. ✔
2. *Human oversight* — every member-visible post is human-confirmed; routing uses only the confirmed
   type; the admin can edit or reject. ✔
3. *Accuracy & robustness* — schema-validated output; fail-closed to the manual path; no invented
   dates; estimate-flagged scores. ✔
4. *Data governance* — only redacted text leaves the box; processes only already-published board
   content; no PII to the LLM. ✔
5. *Cybersecurity* — four-layer auth, column-level PII revokes, server-only secrets with a
   build-blocking scan, adversarial review. ✔

**Gaps (not yet addressed) & resolution before scale:**
- *Formal model card* for the extraction LLM (model id, prompt contract, fail-closed behaviour) —
  the substance exists in code/docs; to be packaged as a card before multi-org scale.
- *Redaction recall metric* — over-/under-masking is tuned empirically with the admin as backstop; a
  documented recall test on a labelled notice set is a pre-scale to-do.
- *Logging/retention policy* — deletion + audit-purge flows exist (migrations `0012`/`0014`); a
  written retention schedule to be finalised with the DPIA (see GDPR doc).
- *AI-incident runbook* (what to do if a redaction miss is discovered) — to be written before scale.

**Conclusion:** As a Limited-risk system with human-in-the-loop confirmation and
privacy-by-construction redaction, Aushang meets its applicable obligations. The listed gaps are
documentation/process items, not architectural changes, and are resolvable before multi-org scale.

## 5. Technical Documentation Outline

> *(Table of contents / skeleton of the full technical-documentation package — Annex IV style. Not
> all written; outlined as required.)*

1. **System overview** — purpose, intended use (org communication), users (admin/members),
   out-of-scope uses (no public feed, no decisions about people)
2. **Architecture** — the capture → OCR → redaction → extraction → review → publish pipeline; the
   web app, the worker, the four-layer security model
3. **Data**
   3.1 Source (only the org's own published board) · 3.2 The redaction step (Presidio + spaCy +
   regex, thresholds, `LOCATION` exclusion) · 3.3 What reaches the LLM (redacted text only) ·
   3.4 Data quality / OCR limits
4. **Models**
   4.1 OCR (Tesseract, German) · 4.2 PII NER (Presidio + spaCy `de_core_news_lg`, per-entity
   thresholds, fail-closed) · 4.3 Extraction LLM (`claude-haiku-4-5`, prompt, strict-schema output
   contract, validation + fail-closed) · 4.4 Model cards (per model)
5. **The confirmation gate** — `content_type_suggested` (LLM) vs confirmed `content_type` (admin);
   the `publish_post` RPC as the sole path to member visibility
6. **Accuracy & evaluation** — schema-validation pass rate, redaction tuning findings, the
   manual-path fallback
7. **Human oversight** — the review screen, what the admin sees, confirm/correct/edit/reject paths
8. **Robustness & safety** — fail-closed behaviours (validation failure, ambiguous dates,
   estimate-flagged scores), the manual path
9. **Cybersecurity** — the four layers, column-level PII revokes, server-only secret boundary, CI
   secret scans, adversarial review (`SECURITY.md`)
10. **Logging & traceability** — what is logged, deletion + audit-purge flows, retention
11. **Risk management** — the risk matrix (see ROI/risk doc), residual risks
12. **Change management & versioning** — migrations `0001`…`0021`, CI gates, deploy process
13. **Limitations & known issues** — OCR quality on bad photos, redaction recall caveat, US-hosted
    LLM (mitigated by upstream redaction; EU-swap is a one-module change)
