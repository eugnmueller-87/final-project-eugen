# Strategic Deployment & Commercialisation Plan — SCM Master

**Company:** Cloud/hosting enterprise (~5,000 employees) · **Investment verdict:** 🟡 **Run a pilot**
(not "invest at full scale," not "wait") — the magnitude is unproven on our SKUs, but the pain is
acute now and a working PoC already exists.

---

## 1. Deployment phases

| Phase | What | State |
|---|---|---|
| **0 — Foundation** | Data model, services, dashboard, agent-safety harness | ✅ Done (the MVP) |
| **1 — POC** | No-code n8n workflow proving the AI-advises/code-decides pattern | ✅ Done (see POC doc) |
| **2 — Pilot** | Validate on **real SKUs**, one worst category first (Networking), walk-forward holdout, named model owner | ▶ Next |
| **3 — Full deployment** | All categories, integrated with ERP/P2P, production hardening, rollout to the procurement team | Planned |
| **4 — Scale / expansion** | Supplier-risk monitoring, GenAI copilot, multi-site, productise externally | Optional |

## 2. Timeline & milestones

| Phase | Duration | Milestones | Gate to proceed |
|---|---|---|---|
| **2 — Pilot** | ~10 weeks | Data wired for 1–2 categories · backtest holdout run · service-level safety stock live · buyer approval loop in use · **accuracy result vs. spreadsheet baseline** | Holdout shows error reduction (target 30–50% band; min: beats baseline) **and** a named model owner |
| **3 — Full deployment** | ~6 months | Extend to all categories · ERP/P2P sync (Coupa/SAP) · forge-locked prod · team trained · monitoring/alerting | Adoption ≥ target; no stockouts on volatile SKUs; finance signs off on working-capital effect |
| **4 — Scale** | 6–12 months | Supplier-risk module · copilot rollout · additional sites / business units | Sustained ROI; exec demand for expansion |

**Decision points are explicit:** the pilot can return "stop" (accuracy ≤ baseline or data too poor
to fix economically) — that is a successful, cheap outcome, not a failure.

## 3. Go-to-market strategy

This is framed two ways, because the system can be **an internal capability** *or* **a product.**

**Primary (internal capability — the pilot's purpose):**
- **Target buyers:** the company's own CFO/CPO (the investment decision); users are procurement +
  planning.
- **Channel:** internal — sponsored by the procurement function, validated by finance.
- **Pricing/value model:** cost-avoidance + working-capital release (internal ROI), not a price tag.
- **Differentiator:** it's *theirs*, tuned to their SKUs and lead-time reality, no per-seat platform
  fee, no vendor lock-in.

**Secondary (productised — Phase 4 optional):**
- **Target buyers:** mid-to-large hardware-heavy operators (cloud/hosting, datacenter, MSPs) facing
  the same chip-lead-time volatility.
- **Channel:** direct (founder-led/consulting-led), later a marketplace listing (Railway/cloud) or
  partner via ERP integrators.
- **Pricing model:** **SaaS** (tiered by SKU/spend volume) with an **implementation/consulting**
  attach for the data wiring — the high-value, defensible part.
- **Key differentiator vs. alternatives:** the big platforms (o9, ToolsGroup, Oracle) cost
  €50k–250k+/yr and are heavy; this is lean, **demand-pattern-aware** (routes lumpy SKUs correctly),
  and built on the auditable **"LLM advises, deterministic code decides"** boundary — a trust story
  enterprises actually need for AI on money.

## 4. Stakeholder communication plan

| Stakeholder | What they need to hear | Who communicates | When |
|---|---|---|---|
| **CEO / CFO** | The 🟡 pilot recommendation, the ~€43k pilot cost, break-even inside year 1, and the explicit "can say stop" gate | Project sponsor / consultant | Kickoff + pilot-gate review |
| **Head of Procurement** | This augments, doesn't replace them; human keeps the pen; quick win on the worst category | Project lead | Kickoff + weekly during pilot |
| **Planners (users)** | How to read the forecast, the "why it missed" diagnostic, the approval workflow | Project lead + champion | Training before pilot use |
| **Finance** | Working-capital mechanism, conservative benefit framing, the audit trail | Consultant + finance partner | Pilot design + gate review |
| **Legal / DPO** | Limited-risk EU AI Act classification, GDPR DPIA, no PII to the LLM | Consultant | Before pilot go-live |
| **IT / Security** | Forge-lock, role-gating, SAST/CVE gates, hosting region | Engineer | Before pilot go-live |
| **Datacenter ops** | Fewer capacity gaps; what changes in their inbound visibility | Project lead | Phase 3 rollout |

## 5. KPIs per phase

| Phase | KPI | Target |
|---|---|---|
| **Pilot** | Forecast error (WMAPE) vs. spreadsheet baseline | ↓ meaningfully (30–50% band ideal; ≥ beat baseline to proceed) |
| **Pilot** | Stockouts on volatile SKUs | 0 over the window |
| **Pilot** | Buyer approval-loop usage | ≥ 80% of proposals reviewed in-tool |
| **Pilot** | Gate safety | 100% of money-moving advice passes the deterministic gate (harness green) |
| **Full** | Adoption | ≥ 70% of planners using it as the primary tool |
| **Full** | Working-capital release | quantified €, validated by finance |
| **Full** | Over-order incidents | 0 (capacity guard enforced) |
| **Scale** | Sustained ROI | ≥ the year-1 base case, growing |

## 6. Commercialisation model

**Choice: start as an internal tool; optionally productise as SaaS + consulting in Phase 4.**

**Justification:** The honest, evidence-based path is *prove it internally first* — ~64% of full AI
bets stall in pilot, so betting on a product before the value is proven on real SKUs would repeat
that mistake. The internal pilot is cheap (~€43k), de-risks the geopolitical lead-time problem now,
and produces the one thing a product needs: a **real accuracy number on real data**, not "85% on
synthetic." If the pilot validates, the same system — already built, already compliant, already
safety-tested — becomes a credible **SaaS + implementation-consulting** offering for the many
hardware-heavy operators with the identical problem, differentiated by being lean, demand-pattern-
aware, and trustworthy-by-architecture. Productising is the upside; the internal capability is the
base case that pays for itself.
