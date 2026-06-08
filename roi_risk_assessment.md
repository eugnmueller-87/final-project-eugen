# ROI & Risk Assessment — AI Demand Forecasting & Procurement Copilot

**Company:** Cloud/hosting enterprise (~5,000 employees, IONOS-scale) · **Managed spend:** ~€640M/yr
All figures are **planning estimates in EUR**, assumptions stated. Sourced from the project's
cost analysis and market research (see [strategic_plan.md](strategic_plan.md) for citations).

---

## Part A — ROI Analysis

### A.1 Upfront cost (Pilot, Phases 0–3, ~9–10 weeks)

| Item | Assumption | EUR |
|---|---|---|
| Data/ML engineer | 0.8 FTE × 9 wk × €700/day | 25,000 |
| Procurement SME | 0.3 FTE × 9 wk × €700/day | 9,500 |
| Exec sponsor + finance | light, ~3 days total | 2,000 |
| Cloud compute (pilot scale) | small VM + storage, ~€300/mo × 3 | 900 |
| Forecasting tooling | open-source (Prophet / statsforecast / sklearn) | 0 |
| BI licences | Power BI Pro, 3 seats × €10/mo × 3 | 90 |
| API hosting | existing Railway-style host | 60 |
| Team training (pilot) | workshops, docs | included below |
| Contingency (~15%) | | 5,500 |
| **Pilot total** | | **≈ 43,000** (range €35k–€55k) |

*Why lean:* the PoC, data model, metrics and dashboard **already exist** — the pilot is validation,
not greenfield build.

### A.2 Ongoing cost (Year-1 rollout, Phases 4–5)

| Item | Assumption | EUR/yr |
|---|---|---|
| Model owner | 0.5 FTE (drift/retrain) | 45,000 |
| Engineering — extend to all categories | ~6 wk one-off | 18,000 |
| Cloud compute (production) | €500–900/mo | 8,000 |
| BI licences | ~15 seats Power BI Pro | 1,800 |
| Monitoring / alerting | lightweight | 1,200 |
| Training & change management | workshops, docs | 6,000 |
| LLM API fees (copilot/commentary) | gated, on-demand, prompt-cached* | ~1,000 |
| Contingency (~15%) | | 12,000 |
| **Year-1 rollout total** | | **≈ 92,000** (range €75k–€115k) |

\* The agent calls are gated (not on every refresh) and prompt-cached, keeping LLM spend in the low
hundreds–€1k/yr range, not a runaway cost.

**Year-1 all-in ≈ €135,000. Year-2+ run-rate ≈ €60,000/yr** (owner + infra + licences).

### A.3 Business value estimate (deliberately conservative)

The case rests on **risk reduction + working capital**, not a heroic cost-out number.

- **Evidence band:** AI forecasting cuts error 30–50%, inventory 20–50%, stockout lost-sales up to
  65% (vendor — treat as upper bound). Academic base case: most real supply-chain AI savings are
  **<10%** — **use <10% as the base case.**
- **Mechanism 1 — working capital:** even a **2–3% reduction** in inventory carrying cost on the
  hardware portion of a €640M operation frees **single-digit €M** in cash; a conservative
  attributable benefit of **~€150k/yr** is a tiny fraction of that.
- **Mechanism 2 — avoided stockouts:** one avoided GPU-capacity stockout on a volatile lead time
  protects customer revenue far exceeding the program cost.

**Conservative modelled benefit: ~€150,000/yr** (working capital + avoided stockout), explicitly
**to be validated by the pilot holdout, not promised.**

### A.4 ROI calculation

`ROI = (Net Benefit / Total Cost) × 100`

**12-month horizon:**
- Total cost (year-1 all-in) = €135,000
- Benefit (conservative) = €150,000
- Net benefit = €150,000 − €135,000 = **€15,000**
- **ROI₁₂ = (15,000 / 135,000) × 100 ≈ +11%**

**36-month horizon:**
- Total cost = €135,000 + 2 × €60,000 = €255,000
- Benefit = 3 × €150,000 = €450,000
- Net benefit = €450,000 − €255,000 = **€195,000**
- **ROI₃₆ = (195,000 / 255,000) × 100 ≈ +76%**

*Sensitivity:* at the literature's mid-band (not the conservative floor), benefit ≥ €400k/yr →
ROI₁₂ jumps to **+196%**. The base case is positive even before any upside.

### A.5 Assumptions table

| # | Assumption | Value | Justification |
|---|---|---|---|
| 1 | Internal blended day rate | €700 | ≈€90k loaded annual / ~130 productive days per half-year (DACH) |
| 2 | Contractor day rate | €1,000 | Typical DACH senior data/ML contractor |
| 3 | PoC already exists | true | The system is built — pilot is validation, removing greenfield cost |
| 4 | Forecasting is open-source | €0 licence | Prophet/statsforecast/sklearn; avoids €50k–250k+/yr platform fee (R8) |
| 5 | Conservative benefit | €150k/yr | <10% academic base case applied to a fraction of carrying cost / avoided stockout on €640M |
| 6 | Managed spend | €640M/yr | Sector/size profile (IONOS-scale cloud enterprise) |
| 7 | LLM fees gated + cached | ~€1k/yr | Copilot calls are on-demand + prompt-cached, not per-refresh |
| 8 | Year-2+ run-rate | €60k/yr | Model owner (0.5 FTE) + infra + licences only |
| 9 | Hardware excluded | n/a | Net-new DC hardware is the spend being optimised, not a project cost |

### A.6 Break-even

**Inside year 1.** At the conservative €150k/yr benefit vs. €135k all-in, the program breaks even
at **~10.8 months**. At the evidence mid-band it breaks even in **~4 months**. The decisive driver
is *one avoided stockout* on a volatile chip lead time — a single such event can pay for the year.

---

## Part B — Risk Assessment Matrix

Likelihood (1 very unlikely → 5 very likely) × Impact (1 negligible → 5 severe) = Risk level.

| # | Category | Risk | L | I | Level | Mitigation |
|---|---|---|---|---|---|---|
| R1 | **Technical** | Model drift / accuracy decays; forecast no better than the spreadsheet | 3 | 4 | **12** | Named model owner (0.5 FTE); walk-forward backtest as the gate; **Syntetos–Boylan routing** sends lumpy SKUs to the right method; auto-retrain + drift alerts; **pilot can say "stop"** if accuracy ≤ baseline |
| R2 | **Technical** | LLM hallucination / bad advice on a money-moving decision | 4 | 5 | **20** | **"LLM advises, deterministic code decides"** — supplier/qty/price are computed, never model-generated; a deterministic gate (spend cap, confidence floor, approved-source, storage-headroom) decides; **29-scenario agent-safety harness** regression-tests the gate against hostile advice (unapproved supplier, over-cap, prompt injection, garbage JSON) |
| R3 | **Technical** | Integration failure with ERP/P2P (Coupa/SAP) | 3 | 3 | **9** | Hexagonal adapter layer; idempotent sync (re-import never duplicates); runs *alongside* the ERP, proposes requisitions back rather than replacing it; Postgres dialect proven in CI |
| R4 | **Regulatory** | EU AI Act / GDPR non-compliance; data breach | 2 | 5 | **10** | System classifies as **Limited/Minimal risk** (decision-support with human-in-the-loop — see [EU AI Act doc](compliance/eu_ai_act_compliance.md)); GDPR DPIA done ([GDPR doc](compliance/gdpr_documentation.md)); no real personal data processed; forge-locked prod (no weak admin, no seed, persistent storage only), SAST + dependency-audit in CI |
| R5 | **Ethical** | Bias / unfair supplier treatment; over-automation removing human judgment | 2 | 4 | **8** | Sourcing is rule-based (preference rank, lead time, price) and auditable — not a black-box model picking winners; every material buy is human-approved; full decision trail logged; the AI cannot exclude a supplier |
| R6 | **Operational** | Low user adoption / change-management failure (planners distrust or bypass it) | 4 | 4 | **16** | Decision-support not replacement (human keeps the pen); the cockpit *explains* every number (click-to-drill formula); "why the forecast missed" diagnostic builds trust; phased rollout starts with the worst category for a quick visible win; training + champion |
| R7 | **Operational** | Over-ordering past warehouse capacity (working-capital / space blowout) | 3 | 3 | **9** | **Server-side over-order guard** — an order that exceeds free-to-order warehouse capacity is refused/clamped (enforced, not advisory); live capacity-flow metric (committed vs free, coverage, depletion) shown before ordering |
| R8 | **Regulatory/Commercial** | Vendor lock-in to a commercial forecasting platform | 2 | 3 | **6** | Open-source forecasting in the pilot; commercial platform (€50k–250k+/yr) explicitly out of scope until value is proven on our data |

**Highest residual risks:** R2 (LLM on money) and R6 (adoption). R2 is the one most thoroughly
engineered against — it's the project's core thesis and is regression-tested. R6 is addressed by
design (human-in-the-loop, explainability, phased rollout) but ultimately depends on execution and
is the real make-or-break of the rollout.
