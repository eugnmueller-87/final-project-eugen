# Presentation Outline — Aushang

> The slide deck ([`presentation.html`](presentation.html)) follows this structure — 11 slides,
> ~10 min + Q&A. Export to `presentation.pdf` (browser → Print → Save as PDF) if a PDF is required.

---

**1. Title** — Aushang: digitizing the paper notice board *without changing the process*. Name, the
consultant→builder framing, the live URL (kita-connect.cloud), the "live & in real-world testing"
badge.

**2. The problem (30s)** — Small orgs (Kitas, clubs, churches) run on a paper board. Three traps:
information is trapped (miss the board → miss the closure/trip/lice notice); digitizing normally
means changing the process (a second system the admin won't maintain); the data is sensitive
(children, parents, phones). The orgs least able to adopt software are the ones whose members most
need reachable information.

**3. The core idea — "the LLM advises, PII is masked first, a human decides"** — the slide that
carries the project. Two principles, enforced by architecture not policy: (1) **privacy by
construction** — PII masked *locally before any external call*, raw photos never leave our infra;
(2) **advises, doesn't decide** — the LLM *suggests*; output is schema-validated; an admin *confirms*
before publish; routing reads only the confirmed value. *This is the trust story, and what keeps it
out of EU AI Act High-risk.*

**4. The pipeline** — photograph → OCR (Tesseract) → **local redact** (Presidio) → Claude *suggests*
→ schema-validate → **admin confirms** → `publish_post` routes → feed/calendar/ICS/digest. The only
text that crosses to the AI is redacted; the only path to a member's screen is an admin publish.

**5. POC demo (no-code) — 2–3 min** — the four n8n workflows: (1) redaction boundary + fail-closed
assert, (2) extract → schema-validate, (3) confirm → route → publish (correct the type live), (4)
double-gated consent. Each runs on mock data; a Code node owns every decision, Claude only advises.
Flip a value to show a safety branch route. (Recorded fallback ready.)

**6. Privacy, proven** — no raw image, no un-redacted PII anywhere external. Local fail-closed
redaction; DB column REVOKE (even an admin's browser can't read raw PII); double-gated photo consent
via signed URL; a build-blocking secret scan. This is the deliverable that distinguishes Aushang.

**7. MVP demo (stretch) — 1–2 min** — the live system: `/aufnahme` photograph → a `processing` post
→ the worker OCRs/redacts/extracts → `/review` confirm-and-publish → members see it on `/feed`,
`/bereiche` (with "new since last visit"), `/kalender`, the ICS subscription, the email digest.
Invite-only by design — a provisioned demo account on request.

**8. ROI & break-even** — honest framing. MVP already live (validation, not greenfield). ~€1.3k/yr
cash infra; break-even on infra at ~15 orgs; LLM is cents/org (called once per capture, cheap model,
redacted text). At €15/org/mo, tens of orgs are cash-positive but don't repay a full solo build
alone — the lever is a **channel** (association/Träger: one sale, many orgs). Payback is a
distribution question, not a technology one.

**9. Risk matrix (top 3)** — R4 adoption/distribution (16 → built around the blocker + a channel),
R1 PII leak (15 → local fail-closed redaction + column REVOKEs + adversarial review), R2 LLM
hallucination (12 → schema-validate + manual path + human confirm + estimate-flagged scores). Full
8-risk matrix in the ROI/risk doc.

**10. Compliance summary** — EU AI Act: **Limited risk** (walks the tree: not prohibited, not a
safety component, no Annex III area — it makes no decision *about a person*; the Kita context is
communication, not education-access; transparency + human oversight met). GDPR: processes real
personal data, so the design carries it — raw photos stay in EU infra, **redacted text only** to the
LLM, PII columns REVOKE'd, DPIA done, residual LOW–MED, self-service erasure.

**11. Strategic plan & close** — Build ✅ → POC ✅ → Pilot (live) → Multi-org → Channel.
Commercialisation: per-org SaaS via an association channel, self-serve as proof. Verdict: 🟢 ship &
validate, then pursue the channel. One line: *AI advises, PII is masked first, a human decides —
proven on a live, GDPR-by-construction build.* Q&A prep below.

---

## Q&A preparation (anticipated questions)

- **"Does a child's name get sent to the AI?"** → No. PII is masked **locally, fail-closed, before**
  the only external call — the LLM sees `[NAME_1]`, never the name. Show the data-flow map and the
  redaction boundary workflow.
- **"Why Limited risk, not High?"** → Walk Step 3: not a safety component, no Annex III area, it
  makes **no decision about a person** (not education-access — it's a parent communication tool,
  doesn't assess any child), human-in-the-loop.
- **"What if the AI mis-reads the notice?"** → Schema validation catches malformed output → manual
  path; the admin confirms every type before publish; bad dates go to `ambiguous_dates[]`, never
  invented. Nothing wrong auto-publishes.
- **"The LLM is US-hosted — isn't that a GDPR problem?"** → Only **redacted** text crosses (no PII,
  no raw image), and the key lives on the worker only. For strict EU residency, the extraction module
  swaps to an EU LLM (Mistral) — a one-module change; nothing else moves.
- **"Will small Kitas actually adopt this?"** → It's built around that exact blocker: **no process
  change** — they keep their paper board, one admin photographs it. The honest risk is distribution,
  answered by a channel (association/Träger), not by single-Kita self-serve.
- **"Is it really live?"** → Yes — kita-connect.cloud, a first Kita testing it; invite-only by design
  because it handles real data. Provisioned demo account on request.
