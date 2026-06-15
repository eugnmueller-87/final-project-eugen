# POC Documentation — No-Code Capture-to-Publish Pipeline

**Deliverable 2 — No-/Low-Code Proof of Concept**

This POC proves the **core capabilities** of Aushang — *an AI reads a photographed notice and
**suggests** structure; PII is masked **before** any AI call; a human **confirms** before anything
is published* — using **no-code n8n workflows**, with **zero application code**. The full coded
system is documented separately as the optional **MVP stretch**
([../mvp/mvp_documentation.md](../mvp/mvp_documentation.md)); this document is the rubric's primary
no-/low-code POC.

> **Why two artefacts?** The rubric asks the POC to be no-/low-code (n8n/Make/Zapier) and the MVP
> (stretch) to be a working coded product. Rather than blur them, this POC is a set of genuine n8n
> workflows anyone can import and run; the MVP shows the same ideas productionised and live. Doing
> both is the consultant→builder arc the project rewards.

## 0. The four workflows (each an importable JSON)

The POC mirrors Aushang's pipeline as **four** small, self-contained n8n workflows. Import each via
**Workflows → Import from File**; each runs end-to-end on included mock data (no backend, no real
personal data). Together they make the two non-negotiable principles **visible in no-code**:
**(1) privacy by construction** — PII is masked locally *before* any external call; and **(2) the
LLM advises, deterministic code + a human decide** — nothing publishes itself.

| File | Mirrors (in the MVP) | Core demonstration |
|---|---|---|
| [`1_redaction_boundary.workflow.json`](1_redaction_boundary.workflow.json) | the worker's local redaction (`worker/redaction.py`) | Raw OCR text → **local PII masking** → a **fail-closed boundary assert** → only **redacted** text is allowed to cross to the LLM. Raw PII never leaves the box. |
| [`2_extract_validate.workflow.json`](2_extract_validate.workflow.json) | the worker's extraction (`worker/extraction.py`) + the schema (`src/lib/content/extraction-schema.ts`) | The LLM **suggests** a content type + extracts dates on **redacted text only** → a deterministic **schema validator** accepts it or routes to the **manual path**. The AI advises; it cannot publish. |
| [`3_confirm_route_publish.workflow.json`](3_confirm_route_publish.workflow.json) | the review gate + `publish_post` RPC (`src/lib/content/types.ts` ROUTING) | The admin **corrects** the suggested type and **presses publish** → routing reads the **confirmed** type (never the suggestion) → publishes to feed/calendar/ICS. No human, no publish. |
| [`4_photo_consent_gate.workflow.json`](4_photo_consent_gate.workflow.json) | the double-gated clear-photo consent (migration `0020`, `src/lib/photo.ts`) | The original photo is released to a member **only** if the member opted in **AND** an admin released that post — both default OFF, server-side, signed-URL only. A pure privacy enforcement gate. |

Workflows 1, 3, and 4 branch (IF node) to show the safety routing visibly; 2 shows "AI suggests,
code validates." Together they cover the system's real breadth — *the privacy boundary, the
advise-vs-decide split, and the human-in-the-loop publish* — without any application code.

> **The boundary is visible in every workflow:** a **Code** node owns the redaction / validation /
> routing / consent decision; the **Claude** node (in workflow 2) only *advises*. A reviewer can see
> exactly where AI stops and deterministic rules begin.

## 0a. Workflow gallery — the running POCs

> **Screenshots:** capture each imported workflow running in n8n and drop the PNGs into a
> `poc_screenshots/` folder, then reference them here. _(Placeholder — to be added from a real n8n
> run; the four importable `*.workflow.json` files are the deliverable and run as-is.)_

### 1 · Local redaction boundary
Raw OCR text containing a name, phone, email, and a child's birthdate → a **Code** node masks each to
`[NAME_1]`, `[TEL_1]`, `[MAIL_1]`, `[GEBURT_1]` → a **fail-closed assert** re-checks that no PII
pattern survived → **IF** routes to *"send REDACTED text to LLM"* or, if anything leaked, *"BLOCK"*.
On the default data every PII item is masked and the boundary passes — **only redacted text is ever
allowed to cross to the AI.** This is *privacy by construction*, in no-code.

### 2 · LLM extract → schema-validate
The **redacted** text (`[NAME_1]` preserved verbatim) → **Claude** returns a **suggested**
`content_type` + extracted events with ISO dates and an `ambiguous_dates[]` list of anything it
**couldn't** resolve (it must declare, not invent) → a deterministic **schema validator** checks the
closed taxonomy, ISO dates, valid times → **IF** routes to *"review gate"* (valid) or *"manual path"*
(invalid). The AI **advises**; a malformed suggestion **can never auto-publish**.

### 3 · Human confirm → route → publish
The draft carries the AI's suggestion (`info`) **and** the admin's correction (`event_notice` — the
"tap to correct" of the real review screen) → a **Code** node routes by the **confirmed** type, never
the suggestion, and only if the admin **pressed publish** → **IF** routes to *"PUBLISH →
feed/calendar/ICS"* or *"STAYS DRAFT"*. On the defaults it publishes an event to the calendar + ICS +
Termine library + the Pinnwand — **because a human confirmed it.** This is *deterministic code & a
human decide.*

### 4 · Double-gated clear-photo consent
Two independent flags, both default OFF → a **Code** node releases the **original** photo **only** if
`member_opted_in AND admin_released`; a client attempt to set the release is **ignored** → **IF**
routes to *"signed URL to original"* or *"blurred image only"*. On the defaults (consent yes, release
**no**) the member sees **only the blurred image** — the safe default. The same server-side,
double-gated, signed-URL-only rule the MVP enforces. (No AI in this one — a pure enforcement gate.)

---

## 1. Tools used and why

| Tool | Role | Why |
|---|---|---|
| **n8n** (low-code) | Orchestrates each workflow visually | Self-hostable, JSON-exportable, the rubric's accepted tool; shows the flow without a dev team |
| **Anthropic Claude** (HTTP node) | The AI that *suggests* structure (workflow 2) | Strong structured-output; the same model the MVP's worker uses (`claude-haiku-4-5`) |
| **Code nodes (no AI)** | Redaction, schema-validation, routing, consent | Enforce "PII masked first" and "advice ≠ decision" inside the no-code tool itself |
| **Set / IF nodes** | Mock inputs + the visible safety branches | Make the privacy boundary and the human-in-the-loop routing *visible* |

## 2. What the POC does — step by step (the pipeline, end to end)

The four workflows are the real pipeline, in order:

1. **Capture → OCR** *(assumed; the MVP's worker does OpenCV deskew + Tesseract)* produces raw text.
2. **Redact (workflow 1)** — a Code node masks deterministic PII (phone/email/IBAN/birthdate) to
   placeholders and **asserts** nothing leaked. **Only redacted text proceeds.**
3. **Extract + validate (workflow 2)** — Claude **suggests** a content type and extracts dates from
   the *redacted* text; a Code node **schema-validates**. Invalid → the manual path, never a publish.
4. **Confirm + route + publish (workflow 3)** — the admin **corrects** the type if needed and
   **publishes**; routing uses the **confirmed** type to send the post to feed / calendar / ICS /
   library.
5. **Consent gate (workflow 4)** — independently, the **original** photo is released to a member only
   under **double-gated** consent, server-side, signed-URL only.

## 3. What AI capability is demonstrated

- **Structured extraction over redacted text → a bounded suggestion** (content type + ISO dates +
  declared ambiguity), not free text.
- **The privacy boundary made visible in no-code:** the AI is reached *only* with locally-redacted
  text; a Code node enforces and asserts it. A reviewer sees exactly where raw PII stops.
- **The advise/decide split made visible:** the AI's suggestion passes through a schema validator and
  a human confirmation; routing reads the *confirmed* value, never the model's. The workflow
  demonstrably "advises, then deterministic logic + a human decide."
- **Human-in-the-loop:** nothing reaches a member without an admin confirming and publishing.

## 4. Known limitations of the POC vs. a production system

| POC (n8n) | Production (the MVP, live) |
|---|---|
| Redaction is a small regex pack in a Code node | **Presidio + spaCy `de_core_news_lg` + a German regex pack**, fail-closed, per-entity thresholds, `LOCATION` excluded |
| OCR is assumed (mock text) | OpenCV deskew → **Tesseract** (German) on the compressed photo, in the worker |
| Schema check is a few field asserts | A strict **JSON Schema** (`additionalProperties:false`, nullable unions, `const true` for the estimate flag) shared with the worker |
| Routing is a Code-node map | The `publish_post` **security-definer RPC**, RLS, per-category libraries, ICS + email/push fan-out |
| Consent is a boolean AND | DB **column-`REVOKE`** of PII, a **server-minted signed URL**, a client-unwritable release flag (migration `0020`) |
| Mock data, manual trigger | Live multi-tenant app on Vercel + a VPS worker; real Kita testing it |

The POC proves *the pipeline and the two safety patterns*; the MVP proves *production-readiness*.

## 5. How to reproduce / run it yourself

1. Install n8n (`npx n8n` or Docker) — or use n8n Cloud.
2. For **workflow 2** only, set an **`ANTHROPIC_API_KEY`** environment variable (the Claude node reads
   `{{ $env.ANTHROPIC_API_KEY }}`), or paste a key into the node's `x-api-key` header. **Workflows 1,
   3, and 4 need no key** (pure Code/IF logic).
3. **Import** each `*.workflow.json` (Workflows → Import from File). Start with
   [`1_redaction_boundary.workflow.json`](1_redaction_boundary.workflow.json).
4. Open the **Manual Trigger** → **Execute Workflow**. Each runs on its included mock data.
5. Watch the run end to end. To see the safety branches flip:
   - **Workflow 1:** the default text is fully masked → **boundary OK → send to LLM**. Add a raw
     phone/email to *Mock OCR Text* that the regex misses to see **BLOCK** (fail-closed).
   - **Workflow 2:** default → **valid → review gate**. Break a date in *Redacted Text* (e.g.
     `24.07.` instead of ISO) to see the validator route to the **manual path**.
   - **Workflow 3:** default (admin confirmed `event_notice`, pressed publish) → **PUBLISH**. Set
     `admin_pressed_publish` to `false`, or blank `admin_confirmed_type`, to see **STAYS DRAFT**.
   - **Workflow 4:** default (consent yes, release **no**) → **blurred only**. Set
     `admin_released_this_post` to `true` to see **RELEASE original**.
6. The boundary is visible in every workflow: the **Code** node owns the redaction/validation/
   routing/consent decision; the **Claude** node (workflow 2) only advises.

## 6. Demo recording

> **Screen recording (2–5 min):** _[link to be added — Loom/YouTube unlisted]_
> Shows: raw text → redaction + boundary assert → Claude's suggestion on redacted text → schema
> validate → the admin correcting the type and publishing → the consent gate withholding the
> original.

(The four importable flows are the `*.workflow.json` files in this folder; annotated screenshots go
in `poc_screenshots/` once captured.)