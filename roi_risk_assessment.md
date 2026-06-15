# ROI & Risk Assessment — Aushang (Notice-Board Digitization)

**Organization:** small community orgs (Kitas, Vereine, Kirchengemeinden) · **Operating model:**
one operator (you) runs a **multi-tenant** SaaS serving many such orgs.
All figures are **planning estimates in EUR**, assumptions stated. Because the customer is a small
non-profit org, the ROI is framed **two ways**: (A) the *org's* return on adopting it, and (B) the
*operator's* return on building/running it as a product.

---

## Part A — ROI Analysis

### A.1 Upfront cost (build, already largely sunk)

The MVP **already exists and is live** — this is validation/rollout cost, not a greenfield build.
Figured here as what the build *would* cost to reproduce, so the ROI is honest about the investment.

| Item | Assumption | EUR |
|---|---|---|
| Full-stack build (web app) | 1 FTE × ~8 wk × €600/day | 24,000 |
| OCR/redaction worker (Python ML) | included in the above 8 wk (heaviest module) | — |
| Security hardening + adversarial review | ~1 wk | 3,000 |
| Compliance docs (GDPR one-pager, AVV, Datenschutz) | ~0.5 wk | 1,500 |
| Design (the "Tafel" mobile redesign) | ~0.5 wk | 1,500 |
| Domain + initial infra setup | one-off | 200 |
| Contingency (~15%) | | 4,500 |
| **Build total** | | **≈ 35,000** (range €28k–€45k) |

*Why lean:* solo build, off-the-shelf managed infra (Supabase EU + Vercel), and an open-source ML
stack (Tesseract + Presidio + spaCy) — no licensed forecasting/ML platform.

### A.2 Ongoing cost (per year, at small scale — e.g. 5–20 orgs)

| Item | Assumption | EUR/yr |
|---|---|---|
| Vercel (web hosting) | Pro tier | 240 |
| Supabase EU (DB/auth/storage) | Pro tier | 300 |
| VPS for the OCR/redaction worker | ~€10–15/mo (the ML stack is heavy) | 180 |
| Resend (transactional email) | low volume | 240 |
| Domain | kita-connect.cloud | 15 |
| **LLM extraction (Claude Haiku)** | gated (only on capture), redacted text only, cheap model | ~60 |
| Maintenance / support | ~0.1 FTE owner time (informal at this scale) | 6,000 |
| Contingency (~15%) | | 1,100 |
| **Year-1 ongoing total** | | **≈ 8,300** (dominated by owner time; cash infra ≈ €1,300/yr) |

\* **LLM spend is tiny by design:** the model is called **once per captured notice** (not on every
page view), on **short redacted text**, with the cheap `claude-haiku-4-5`. Even at hundreds of
captures/month this is low single-digit euros — the cost driver is owner time, not AI.

**Cash infrastructure cost ≈ €1,300/yr** regardless of org count at this scale; the per-org
marginal cost is dominated by a few extra LLM calls (cents).

### A.3 Business value estimate (two lenses, deliberately conservative)

**Lens 1 — value to the adopting org (the buyer's ROI).** The org's "cost" today is *missed
communication* and *admin time*, not cash:

- **Admin time saved:** the alternative to Aushang is either (a) do nothing (paper only), or (b)
  maintain a second system — retyping notices into a newsletter/app. Aushang replaces (b)'s data
  entry with *photograph + confirm*. Conservatively **~30–60 min/week** of admin retyping avoided
  per org → at a notional €20/hr that is **~€500–1,000/yr** of admin time per org, plus the far
  larger un-priced value of *parents no longer missing closures and events.*
- **Avoided "second system":** the org does not buy/maintain a separate portal or newsletter tool
  (typical small-org tools run €5–20/user/mo) — Aushang is one capture habit, not a new process.

**Lens 2 — value to the operator (the product's ROI).** A multi-tenant SaaS at a modest per-org
price. Conservative model: **€15/org/month** (a small Kita budget line, well under a per-seat app).

- 10 orgs → €1,800/yr revenue; 20 orgs → €3,600/yr; 50 orgs → €9,000/yr.
- Cash infra cost stays ~€1,300/yr until well into the dozens of orgs (managed infra scales
  cheaply; LLM is cents/org).

**Conservative modelled benefit (operator lens):** at **20 orgs × €15/mo = €3,600/yr revenue**
against **~€1,300/yr cash infra**, the product is **cash-positive on infra by ~15 orgs** — owner
time is the real investment, recovered as the org count grows. *To be validated by the pilot
converting to a paying org, not promised.*

### A.4 ROI calculation

`ROI = (Net Benefit / Total Cost) × 100`

Two scenarios, both honest. **Owner time is the dominant cost**, so ROI is shown on the **cash**
basis (the decision a bootstrapped operator actually faces) and noted on the all-in basis.

**Operator, 12-month horizon (cash basis, 20 orgs):**
- Cash cost (infra) = €1,300
- Revenue (20 orgs × €15/mo) = €3,600
- Net benefit = €3,600 − €1,300 = **€2,300**
- **ROI₁₂ (cash) = (2,300 / 1,300) × 100 ≈ +177%**

**Operator, 36-month horizon (all-in, incl. the €35k build + owner time):**
- Total cost = €35,000 build + 3 × €8,300 ongoing = €59,900
- Revenue (ramp 10 → 20 → 35 orgs) ≈ €1,800 + €3,600 + €6,300 = €11,700
- Net = **−€48,200** → **ROI₃₆ (all-in) ≈ −80%** at this price/scale.

**The honest read:** at a €15/org price and tens of orgs, Aushang is **cash-positive to run** but
does **not** repay a full-cost solo build inside 3 years on subscription alone. It pays back as
either (a) **scale** (hundreds of orgs — the build cost amortizes; at 200 orgs revenue ≈ €36k/yr
against ~€3k infra), or (b) a **higher-value channel** (sold *through* a Kita-association / Träger
or a municipality as a bundled offering), or (c) treated as a **portfolio/credential project** whose
return is the live, compliant reference build, not the subscription line.

*Sensitivity:* the decisive lever is **price × org count via a channel**, not single-org self-serve.
At €25/org/mo through an association reselling to 150 Kitas, revenue ≈ €45k/yr → the build repays
inside year 1 of that channel.

### A.5 Assumptions table

| # | Assumption | Value | Justification |
|---|---|---|---|
| 1 | Solo build day rate | €600 | DACH freelance full-stack, blended |
| 2 | MVP already exists | true | Live at kita-connect.cloud; this is validation/rollout, not greenfield |
| 3 | ML stack is open-source | €0 licence | Tesseract + Presidio + spaCy; no licensed OCR/NLP platform |
| 4 | Managed infra | ~€1.3k/yr | Vercel Pro + Supabase Pro EU + small VPS + Resend at low volume |
| 5 | LLM gated + cheap | ~€60/yr | `claude-haiku-4-5`, **once per capture**, on short **redacted** text only |
| 6 | Per-org price | €15/mo | A plausible small-org budget line; well under a per-seat app |
| 7 | Owner time | 0.1 FTE / €6k/yr | Informal solo maintenance at small scale; the dominant cost |
| 8 | Scale lever | channel sale | Association/Träger/municipality reselling many orgs is the path to full payback |
| 9 | Per-org marginal cost | cents | A few extra LLM calls; managed infra absorbs the rest |

### A.6 Break-even

**On cash infra: ~15 paying orgs.** At €15/org/mo, 15 orgs ≈ €2,700/yr revenue covers the ~€1,300
cash infra plus headroom. **On the full build cost: only at scale or via a channel** — ~200
self-serve orgs, or a single association deal. The honest verdict: *Aushang is cheap to run and the
core feature is proven; the open question is distribution, not technology or cost.*

---

## Part B — Risk Assessment Matrix

Likelihood (1 very unlikely → 5 very likely) × Impact (1 negligible → 5 severe) = Risk level.

| # | Category | Risk | L | I | Level | Mitigation |
|---|---|---|---|---|---|---|
| R1 | **Regulatory / Privacy** | **PII leak** — a child's/parent's name or contact reaches the external LLM or a member who shouldn't see it | 3 | 5 | **15** | **Privacy by construction:** PII redacted **locally** (Presidio + spaCy + German regex, **fail-closed**) *before* the only external AI call — raw images/PII never leave the box; PII columns (`ocr_text_raw`, `source_image_path`, …) are **column-`REVOKE`'d** from members at the DB; clear-photo release is **double-gated** (member opt-in × admin release) and served only via short-TTL signed URLs. Backstopped by RLS + a source-secret CI scan. See [GDPR doc](compliance/gdpr_documentation.md) |
| R2 | **Technical / AI** | LLM hallucinates structure — invents a date, mis-classifies a notice, claims an official Nutri-Score | 4 | 3 | **12** | **"LLM advises, code decides":** output is **schema-validated** (strict JSON, `additionalProperties:false`); validation failure → **manual path, never auto-publish**; the admin **confirms** the content type (routing reads only the *confirmed* value, NULL until then); dates the model can't resolve go to `ambiguous_dates[]` not invented; Nutri-Score is schema-forced to `nutri_is_estimate: true` — the model cannot claim an official rating |
| R3 | **Technical / AI** | Over-redaction mangles ordinary notices (town names, festival names masked as "names") | 4 | 2 | **8** | Per-entity confidence thresholds raised for fuzzy types (PERSON 0.6+), `LOCATION` **excluded entirely** (on a public board the "locations" are the org's own name/town, not PII), deterministic PII still caught at 1.0; the **admin review is the backstop** — un-mask is one tap. Tuned during real-world testing |
| R4 | **Operational** | **Low adoption / distribution** — small orgs are hard to reach and slow to change; the build doesn't repay on self-serve subscription | 4 | 4 | **16** | The product is *built around* the adoption blocker (no process change — just photograph the board); pilot with a real Kita first for a reference; pursue a **channel** (Kita-association / Träger / municipality) rather than one-Kita-at-a-time self-serve (see ROI A.4 and [strategic plan](strategic_plan.md)) |
| R5 | **Technical** | Worker/infra failure — captures upload but stay `processing` (no worker), or OCR quality is poor on a bad photo | 3 | 3 | **9** | The web app **runs without the worker** (captures queue as `processing`, the app is otherwise fully functional); OpenCV deskew + capture-time compression improve OCR; a poor extraction degrades to the **manual path** (admin types it) — never a hard failure or a wrong publish |
| R6 | **Ethical** | Surveillance creep / consent — photographing a board that names children; pushing children's data into an app | 2 | 4 | **8** | The tool processes **only what the org already published** to its own board (no new collection); **no public surface**, invite-only; clear-photo of a person is **double-gated** opt-in; the design sends **no un-redacted PII** anywhere and gives members deletion/erasure flows. Purpose-limited to the org's own communication |
| R7 | **Regulatory** | EU AI Act misclassification / non-compliance | 2 | 4 | **8** | System classifies as **Limited risk** (decision-support, human-in-the-loop, no Annex III area — see [EU AI Act doc](compliance/eu_ai_act_compliance.md)); transparency met (AI suggestions are labelled, admin confirms); GDPR DPIA done; the most consequential control — *local redaction + human confirmation* — is exactly what keeps it out of High-risk |
| R8 | **Regulatory / Commercial** | LLM data-residency — extraction currently uses **Claude (Anthropic, US-hosted)**, an EU↔US transfer | 2 | 3 | **6** | **Only locally-redacted text** (PII already masked to `[NAME_x]`) crosses the boundary — **no personal data and no raw image**; the Anthropic key lives **on the worker only**, never in the web app. If strict EU residency is required, the worker's `extraction` module swaps to an **EU LLM (Mistral)** as a **one-module change** — nothing else in the pipeline moves |

**Highest residual risks:** **R4 (adoption/distribution)** and **R1 (PII leak)**. R1 is the most
thoroughly engineered-against — it is the project's core thesis, enforced at the architecture/DB
layer and adversarially reviewed, not promised in policy. **R4 is the real make-or-break:** the
technology and privacy story are strong; whether the product reaches enough orgs to repay a full
build depends on distribution (a channel), which is an execution/go-to-market question, not a
technical one.
