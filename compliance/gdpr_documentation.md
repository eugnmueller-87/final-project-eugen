# GDPR Documentation — Aushang

**System:** AI-assisted notice-board digitization · **Regulation:** Regulation (EU) 2016/679 (GDPR)

> **Key fact up front:** Unlike a B2B procurement tool, Aushang **does** process personal data — a
> photographed Kita notice can name children, parents, and staff. The entire architecture is built
> around that reality. The single most important property of the design: **no raw image and no
> un-redacted personal data is ever sent to the external LLM.** PII is detected and masked
> **locally, on our own worker, before any external call** — and the original photo and raw
> PII columns are withheld from members at the database layer. GDPR compliance here is not a policy
> bolted on; it is *enforced by the data-flow boundary and the column grants.*

---

## 1. Data flow map

```
            PHOTOGRAPHED NOTICE (may contain PERSONAL DATA)              ACCOUNT DATA
  ┌──────────────────────────────────────────────────────┐   ┌─────────────────────────────┐
  │ Raw board photo: meal plans, events, health notices,  │   │ Member/admin accounts:       │
  │ possibly children's / parents' / staff names,         │   │  • email, name, role, org    │
  │ phone numbers, dates ("Max, geb. 12.3.")              │   │  • hashed password (Supabase)│
  └───────────────────────────┬───────────────────────────┘   │  • photo-consent flag        │
                              │ (signed-URL upload, raw)        └──────────────┬──────────────┘
                              ▼                                                │
        ┌──────────────────────────────────────────────────────────┐         │ collected on
        │  PRIVATE raw-photos bucket (Supabase EU) — never public    │         │ provision/login
        └───────────────────────────┬──────────────────────────────┘         │
                                    │ short-TTL signed URL                    │
                                    ▼                                          │
        ┌──────────────────────────────────────────────────────────┐         │
        │  OCR / REDACTION WORKER (our VPS — runs ENTIRELY locally)  │         │
        │  OpenCV deskew → Tesseract OCR (de) →                      │         │
        │  ★ LOCAL PII REDACTION (Presidio + spaCy + regex,          │         │
        │     FAIL-CLOSED): names/phones/emails/IBAN/birthdates      │         │
        │     → masked to [NAME_1], [TEL_1], … ; blur image regions  │         │
        └───────────────────────────┬──────────────────────────────┘         │
              ONLY REDACTED TEXT     │  (no raw image, no un-redacted PII)     │
              crosses this line ─────┼──────────────────────────────►         │
                                    ▼                                          ▼
        ┌───────────────────────────────────┐         ┌──────────────────────────────────────┐
        │ Claude API (Anthropic, US-hosted)  │         │  App + DB (Supabase EU, Vercel)       │
        │  receives: REDACTED TEXT only      │         │  • RLS per org; members read only     │
        │  ([NAME_1]-masked) → suggests type │         │    published/confirmed rows           │
        │  + extracts dates/fields           │         │  • PII columns REVOKE'd from members:  │
        │  NEVER receives raw image or PII    │         │    ocr_text_raw, ocr_text_redacted,   │
        └───────────────────────────────────┘         │    redactions, source_image_path       │
                                                       │  • admin confirms → publish (server)   │
                                                       └──────────────────────────────────────┘
```

**The critical boundary:** the **only** text that leaves the worker for the external LLM is the
**locally-redacted** text — PII already replaced with `[NAME_x]`-style placeholders. **Raw images
never leave our infrastructure** (private bucket + worker only). **Un-redacted PII never reaches the
LLM.** Within the app, raw-PII columns are **column-level `REVOKE`'d** from members, so even an
admin's *browser* client cannot read them — admin PII access is server-only by construction.

## 2. Processing activities register

| # | Data | Purpose | Legal basis | Retention | Third-party recipients |
|---|---|---|---|---|---|
| 1 | **Account** (email, name, role, org, hashed pw, photo-consent flag) | Authenticate; enforce org/role access; honour photo-consent | **Contract** (Art. 6(1)(b)) — providing the service the org/member signed up for; legitimate interest for security | Until account deletion (self-service flow) + audit-purge window | Supabase (EU, processor) |
| 2 | **Raw board photo** (may contain PII) | Source for OCR → structured post | **Legitimate interest** (Art. 6(1)(f)) of the org — digitizing its *own already-published* board for its members; processes only what the org posted publicly itself | Stored in a **private** bucket; raw is **not** shown to members unless **double-gated** consent (§ photo-consent); deletable | **None external** — raw never leaves our infra |
| 3 | **Redacted OCR text** ([NAME_x]-masked) | LLM suggests content type + extracts dates/fields | **Legitimate interest** (Art. 6(1)(f)) — structuring the notice; **no personal data** (PII already masked) | Stored as a draft; PII columns REVOKE'd from members | **Anthropic** (Claude API) — **redacted text only, no PII** |
| 4 | **Published post** (confirmed type, edited text, dates) | Show members the feed / calendar / digest | **Legitimate interest / contract** | Until take-down/deletion | Resend (email digest — to the org's own members), Web Push |
| 5 | **Member-facing photo (optional clear original)** | Let an opted-in member see the unblurred original of a specific post | **Consent** (Art. 6(1)(a)) — **double-gated**: member opt-in × admin per-post release; both default OFF | Released per-post; served only via short-TTL signed URL | None (signed URL from our EU storage) |

Activity #3 (the only data sent to a non-EU processor) involves **no personal data** — PII is masked
before it is sent. The genuinely personal-data processing is #1 (accounts), #2 (raw photo, kept
in-house), and #5 (consented clear-photo). Each is minimised and purpose-bound.

## 3. DPIA — highest-risk processing activity

**Selected activity: #2 — capturing and processing a raw board photo that may contain children's
and parents' personal data** (a Kita context → potentially data of minors). This is the highest-risk
processing because it can involve **data of children** and is image data that, un-handled, could leak
PII to an external AI or to the wrong members. It is exactly the activity the whole architecture is
designed to de-risk.

**Description of the processing:** An admin photographs the org's physical notice board from inside
the tool. The raw image is uploaded to a **private** bucket and processed by our worker: deskew →
OCR → **local PII redaction (fail-closed)** → image-region blur → only the **redacted text** is sent
to the LLM for structuring. A human admin then reviews and publishes. Members see the *redacted*
result; the raw original is shown only under double-gated consent.

**Necessity & proportionality:** Necessary — the org's purpose is to get its *own already-published*
board content to its members; photographing the board is the minimum-friction way that doesn't change
the org's process (it would otherwise retype it). Proportionate — the system processes **only what
the org already pinned publicly to its own board** (no new or covert collection), masks PII
**locally before any external call**, withholds raw PII from members at the DB layer, and requires a
human to publish. No profiling, no automated decision about any person, no special-category
inference.

**Risks to data subjects:**
| Risk | Likelihood | Impact |
|---|---|---|
| PII (a child's/parent's name) reaches the external LLM | **Low** (redaction is upstream + fail-closed) | High if it occurred → engineered to ~zero |
| Under-redaction leaves a name visible to members | Low–Med (admin review is the backstop) | Med |
| A member sees the raw original who shouldn't | **Very low** (double-gated consent + signed URL + column REVOKE) | Med |
| Excessive retention of raw photos | Med | Med |
| Data of minors processed without adequate safeguard | Low | High |

**Mitigation measures:**
- **Local PII redaction, fail-closed,** before any external call — the single most important control;
  deterministic PII (phone/email/IBAN/birthdate) caught at confidence 1.0, ML guesses masked above
  threshold.
- **The LLM never receives a raw image or un-redacted PII** — enforced by the data-flow boundary, not
  policy.
- **Column-level `REVOKE`** of `ocr_text_raw`, `ocr_text_redacted`, `redactions`,
  `source_image_path` from members (migration `0004`) — a member cannot read raw PII columns even by
  querying the base table directly.
- **Reflection originals deleted at publish** (migration `0023`) — a *Rückblick* is the content type
  most likely to depict identifiable children, so on publish its raw original is **deleted** from the
  bucket and `source_image_path` nulled; `publish_post` **forces** `clear_photo_allowed = false` for
  reflections so the consent path can never release a now-deleted original. This is **data
  minimisation by design** applied to the highest-risk image type — directly lowering the "excessive
  retention" and "data of minors" risks above. A failed delete is surfaced to the admin, never
  silently swallowed.
- **Human-in-the-loop publish** — no notice is member-visible without an admin confirming and
  publishing; the admin review is the redaction backstop (un-mask/re-mask is one tap).
- **Double-gated clear-photo consent** (migration `0020`) — the raw original is shown to a member only
  when the member opted in *and* the admin released that specific post, both default OFF, served only
  via a short-TTL signed URL; the client can never set the release flag.
- **EU hosting** of the DB/storage (Supabase EU); **no public surface** (invite-only); deletion +
  audit-purge flows (migrations `0012`/`0014`).
- **Data of minors:** processed only as the *org's own published board content*, redacted and
  human-gated; no profiling; org/parents control what goes on the board.

**Residual risk rating: LOW–MEDIUM.** Higher than a B2B tool because real (and possibly children's)
personal data is in scope — but the processing is minimised, redacted locally before any external
call, withheld from members by DB grants, human-gated, and EU-hosted. With these controls the
residual risk is acceptable; a labelled-recall test on the redaction step and a written retention
schedule (the DPIA's pre-scale to-dos) would lower it further. No high residual risk requiring prior
consultation with a supervisory authority is present.

## 4. Data subject rights — how the system supports them

| Right (Art.) | Support |
|---|---|
| **Access (15)** | A user's account + their posts/activity are queryable by email/org; an SAR can be fulfilled from the EU Postgres. |
| **Rectification (16)** | Account fields are editable by an admin; a published post's text is editable/correctable by an admin via the review/take-down flow. |
| **Erasure (17)** | **Self-service account deletion** is built in (member settings → delete), plus admin removal and scheduled **audit purges** (migrations `0012`/`0014`); a post can be **taken down** (its calendar events cancelled and removed from subscribed ICS feeds, migrations `0018`/`0019`); raw photos are deletable. |
| **Portability (20)** | Account + post data is structured (Postgres/JSON) and exportable. |
| **Restriction / Objection (21)** | A member can opt out of the digest/push, withdraw photo-consent (default OFF anyway), and request restriction; processing rests on contract/legitimate-interest for the org's own communication. |
| **Consent withdrawal (7)** | The clear-photo consent is **opt-in and withdrawable** at any time in settings; withdrawal stops the raw original being served. |
| **No solely-automated decisions (22)** | The system makes **no automated decision with legal/significant effect on a person.** The LLM only *suggests* structure for a notice; a **human admin confirms and publishes** every member-visible post. |

## 5. Third-party data transfers

| Service | Data sent | Personal data? | Legal mechanism | Where stored |
|---|---|---|---|---|
| **Supabase** (DB / Auth / Storage) | Accounts, raw photos (private bucket), posts | **Yes** | DPA + **EU region** (Ireland/Frankfurt) | EU |
| **Anthropic** (Claude API — extraction) | **Redacted** OCR text ([NAME_x]-masked) only | **No personal data** (masked before sending) | Anthropic DPA / SCCs cover the EU↔US transfer *if invoked*; **not strictly needed here since no PII is sent.** Key lives on the worker only | Not retained by the model (stateless call) |
| **Vercel** (web hosting) | The app (no raw PII; PII columns server-side only) | Limited | DPA; EU/edge config | Edge / EU |
| **Resend** (email) | Digest emails to the org's **own members** | Yes (member email + post content) | DPA | EU-configurable |

**Transfer principle:** all genuinely personal data (accounts, raw photos) stays within **EU-hosted**
infrastructure under DPAs. The **only** transfer to a non-EU processor is the extraction call to
Anthropic, and it carries **no personal data and no raw image** — only locally-redacted text. This
is the single most important GDPR property of the design, and it is enforced by the §1 data-flow
boundary, the worker-side redaction, and the column-level grants — not by a promise.

> **Residency note (honest):** the extraction LLM is currently **Claude (Anthropic), US-hosted**.
> The privacy guarantee holds because redaction is **upstream** of that call (no PII crosses). The
> public `/datenschutz` page states this truthfully — DB/storage/email and the local PII masking run
> in the EU and raw photos never leave our infra, while the structure-extraction step sends **only
> the already-masked text** to a sub-processor that currently processes outside the EU, **with a
> stated intent to move that step into the EU too.** If an org requires strict EU residency for the
> AI step now, the worker's `extraction` module swaps to an **EU LLM (Mistral)** as a **one-module
> change** — the rest of the pipeline is unchanged.
>
> **Cover images (built, dormant):** the optional decorative cover image is generated from the
> **redacted extraction (content type only)** — same zero-PII boundary — and is wired
> **provider-agnostically** (`IMAGE_API_URL`/`IMAGE_API_KEY`) so the deployment points at an
> **EU-hosted** image endpoint. No personal data and no raw photo reaches it.
