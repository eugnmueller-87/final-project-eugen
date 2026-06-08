# Use Case Definition — AI Demand Forecasting & Autonomous Procurement

**Project:** SCM Master — an AI decision layer for datacenter hardware procurement
**Author:** Eugen Müller · **Role framing:** AI consultant → builder
**Live system:** [demo](https://scm-master-production.up.railway.app) · [analytics cockpit](https://scm-power-bi-production.up.railway.app) · [code](https://github.com/eugnmueller-87/SCM-Master)

---

## 1. Business problem statement

**The problem:** A cloud/hosting enterprise must get compute capacity (servers, GPUs, memory,
storage, networking) into its datacenters *before* customers need it — while buying from a chip
supply chain whose lead times swing unpredictably (memory recently spiked ~4×; advanced-chip
geopolitics adds shock risk). Two failure modes follow:

- **Static reorder points break.** A reorder rule tuned for a 14-day lead time stocks out when the
  lead time jumps to 45. A late GPU shipment = unservable customer demand = lost revenue.
- **Over-correcting ties up cash.** Buying early "to be safe" across a ~€640M/year spend base locks
  up working capital and warehouse space.

The team plans in spreadsheets with no view of *why* a forecast missed, no defensible "what should
this part actually cost," and no way to see committed warehouse capacity before ordering more.

**For whom:** the procurement function of a **large cloud/hosting enterprise (~5,000 employees,
IONOS-scale, DACH)** — and specifically the procurement lead, demand/capacity planner, finance, and
datacenter ops.

## 2. Company profile

| | |
|---|---|
| **Industry** | Cloud / hosting & datacenter infrastructure (DACH, Microsoft-365 ecosystem) |
| **Size** | Large enterprise — ~5,000 employees |
| **Spend profile** | ~€640M/year managed spend; IT/cloud-heavy (servers, processors, memory, storage, networking, power) |
| **Current state** | Spreadsheet forecasts; static reorder points; ERP/P2P (e.g. Coupa/SAP) for transactions but no demand intelligence; no should-cost capability; planning disconnected from live warehouse capacity |

## 3. Proposed AI solution

A **decision layer** on top of the operational system that follows one rule end-to-end —
**"the LLM advises, deterministic code decides."**

| Component | AI system type | What the AI does | What deterministic code does |
|---|---|---|---|
| **Demand forecasting** | Time-series **prediction** + a per-SKU **classifier** | Classifies each SKU's demand pattern (Syntetos–Boylan) and routes it to the right estimator | Computes run-rate / TSB forecast, service-level safety stock, reorder point |
| **Procurement copilot** | LLM **automation** + reasoning | Reads live signals, proposes a confidence/decision/rationale per buy | Decides supplier, quantity, price, and place/stage/escalate via a tested gate |
| **Should-cost engine** | Deterministic **recommendation** | (Optional) reads a quote PDF into a BOM | Rebuilds cost from commodity-indexed components → defensible cost floor |
| **Analytics cockpit** | **Generation** (narrative) over deterministic facts | Narrates a short read *over* already-computed findings, on demand | Computes the findings (concentration/HHI, weeks-of-cover, TCO inversion) |

The **AI part** is the demand model + reliability scoring + advisory copilot; the **automation part**
is the reorder arithmetic, sourcing, and approval workflow. The system is explicit about which is
which — the LLM never moves money on its own.

## 4. Key stakeholders

| Stakeholder | Affected / decides / uses | Interest |
|---|---|---|
| **CEO (sponsor)** | Decides the investment | A defensible yes/no — hype vs. value, no science project |
| **Head of Procurement** | Primary user | Buy the right parts at the right time despite moving lead times |
| **Demand / capacity planner** | Primary user | Trustworthy demand numbers + *why* a forecast missed |
| **Finance** | Affected / approves spend | Protect working capital and margin; avoid over-ordering and stockouts |
| **Datacenter ops** | Affected (downstream) | No capacity gaps — parts land before customer demand |
| **Suppliers** | Affected | Fair, contract-based sourcing; not bypassed by a black-box model |

## 5. Success criteria (measurable)

1. **Forecast accuracy** — reduce per-SKU forecast error (WMAPE) on the worst categories by a
   meaningful margin vs. the current spreadsheet baseline, **measured on a walk-forward backtest
   holdout** (target: the 30–50% error-reduction band the literature reports; base case <10%).
2. **Stockout avoidance** — zero stockouts on lead-time-volatile SKUs over the pilot window, with
   service-level safety stock sized to the chosen service level (default 95%).
3. **Working-capital / cost discipline (secondary)** — no over-ordering past committed warehouse
   capacity (enforced by a server-side guard), and a quantified should-cost gap surfaced on costed
   products as negotiation headroom.
4. **Trust / safety** — 100% of money-moving AI advice passes a deterministic gate; proven by a
   regression test suite (the agent-safety harness) that the gate refuses hostile advice.

## 6. Out-of-scope boundaries

The solution explicitly does **not**:

- **Place orders autonomously without a human** above defined confidence/spend thresholds — every
  material buy is staged for approval.
- **Replace the ERP/P2P system** (Coupa/SAP) — it runs *alongside* as the intelligence layer and
  proposes requisitions back, rather than owning invoicing/payment.
- **Let the LLM decide supplier, price, or quantity** — those are deterministic; the LLM only advises.
- **Forecast genuinely intermittent/project-batch demand as a point forecast** — those SKUs are
  managed by safety stock, not by pretending to predict the spike.
- **Process real personal data** — the system handles procurement/asset data; user PII is limited to
  internal login accounts (see [GDPR documentation](compliance/gdpr_documentation.md)).
- **Use a commercial forecasting platform** (o9/ToolsGroup/Oracle) in the pilot — open-source only,
  to avoid vendor lock-in and keep the pilot lean.
