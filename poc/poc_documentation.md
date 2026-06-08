# POC Documentation — No-Code Procurement Copilot

**Deliverable 2 — No-/Low-Code Proof of Concept**

This POC proves the **core AI capability** of the solution — *an AI judges a buying decision and a
human approves it* — using a **no-code n8n workflow**, with **zero application code**. The full
coded system is documented separately as the optional **MVP stretch** ([../mvp/mvp_documentation.md](../mvp/mvp_documentation.md));
this document is the rubric's primary no-/low-code POC.

> **Why two artefacts?** The rubric asks the POC to be no-/low-code (n8n/Make/Zapier) and the MVP
> (stretch) to be a working coded product. Rather than blur them, this POC is a set of genuine n8n
> workflows anyone can import and run; the MVP shows the same ideas productionised. Doing both is
> the consultant→builder arc the project rewards.

## 0. The four workflows (each an importable JSON)

The POC mirrors SCM Master's decision layer as **four** small, self-contained n8n workflows.
Import each via **Workflows → Import from File**; each runs end-to-end on included mock data
(no backend, no personal data). The 2–3 in/out of each demonstrates the same principle —
**deterministic code owns the numbers/decision; the LLM only advises.**

| File | Mirrors | Core demonstration |
|---|---|---|
| [`1_procurement_copilot.workflow.json`](1_procurement_copilot.workflow.json) | the agent (`app/agent/`) | AI judges a buy → a deterministic gate (spend cap, confidence floor) decides **auto-place vs. approval** |
| [`2_demand_forecast_reorder.workflow.json`](2_demand_forecast_reorder.workflow.json) | planning (`planning.py`/`forecasting.py`) | service-level **safety stock + dynamic reorder point** computed in code; AI adds a one-line reliability flag |
| [`3_should_cost_gap.workflow.json`](3_should_cost_gap.workflow.json) | costing (`costing.py`) | clean-sheet **should-cost floor/target** from commodity-indexed BOM → **gap to a vendor quote**; AI drafts the negotiation line |
| [`4_capacity_guard.workflow.json`](4_capacity_guard.workflow.json) | the over-order guard (`planning.check_order_capacity`) | an order over warehouse free-to-order is **refused/clamped** — the "never over-order" safety invariant |

Workflows 1 and 4 branch (IF node) to show the safety routing visibly; 2 and 3 show "code computes,
AI narrates over it." Together they cover the system's real breadth without any application code.

## 0a. Workflow gallery — the running POCs

Each screenshot is the imported workflow running in n8n. Every one shows the same boundary: a
**Code** node owns the numbers/decision; the **Claude** node only advises.

### 1 · Procurement copilot
![Procurement copilot workflow](poc_screenshots/procurement%20copilot.png)
The agent in miniature: mock demand signals → **Claude advises** (confidence/decision/rationale) →
a **deterministic gate** computes the quantity (net-need/MOQ) and applies the spend cap + confidence
floor → **IF** routes to *auto-place* or *stage for approval*. The AI never sets supplier, quantity,
or price; on the default values the buy exceeds the spend cap and is **staged for a human** — the
safety behaviour, visible.

### 2 · Demand forecast → dynamic reorder
![Demand forecast and dynamic reorder workflow](poc_screenshots/demand%20forecast%20.png)
The chosen primary use case: usage signals → a **deterministic** node computes service-level
**safety stock** (`z × σ` over the lead time) and a **dynamic reorder point** that moves with lead
time and demand variability → **Claude** adds a one-line reliability flag *over* the computed number.
This is the upgrade from a static `burn × lead ÷ 2` rule to real inventory science — the exact
failure mode (reorder points breaking when chip lead times jump) the project targets.

### 3 · Should-cost gap
![Should-cost gap workflow](poc_screenshots/should%20cost%20gap.png)
A vendor quote + a bill of materials → a **deterministic** clean-sheet teardown (commodity-indexed
material → +overhead → +SG&A → +margin) produces a **cost floor** and a fair **target price** → the
**gap to the quote** is the addressable negotiation saving → **Claude** drafts the opening
negotiation line *over* the computed gap. The numbers a buyer takes into the room are code's, never
the model's.

### 4 · Capacity over-order guard
![Capacity over-order guard workflow](poc_screenshots/capacity%20over%20order%20guard.png)
The "never over-order" invariant: an order request against warehouse capacity, where **inbound is
reserved** capacity → a **deterministic** guard computes free-to-order (`capacity − on-hand −
inbound`) → **IF** routes to *place* or **refuse/clamp**. On the default values the 150-unit request
exceeds the 96 free and is **clamped** — the same server-side refusal the MVP returns as HTTP 422.
(No AI in this one — it's a pure enforcement gate.)

---

## 1. Tools used and why

| Tool | Role | Why |
|---|---|---|
| **n8n** (low-code) | Orchestrates the workflow visually | Self-hostable, JSON-exportable, the rubric's accepted tool; shows the flow without a dev team |
| **Anthropic Claude** (HTTP node) | The AI that judges each buy | Strong structured-output + reasoning; the same model the MVP uses |
| **HTTP Request / Webhook nodes** | Pull demand signals, post the decision | Standard no-code integration; talks to any backend/spreadsheet/ERP export |
| **Set / IF nodes** | The deterministic gate (no AI) | Enforces "advice ≠ decision" inside the no-code tool itself |

## 2. What the POC does — step by step

The workflow models **one weekly purchasing decision**:

1. **Trigger** — a **Schedule** node fires weekly (or a manual/webhook trigger for the demo).
2. **Gather signals** — an **HTTP Request** node pulls a small JSON of demand signals for one SKU
   (recent usage rate, on-hand, on-order, lead time, the candidate supplier's contract price/MOQ).
   In the demo this reads a published Google Sheet / a mock JSON endpoint — no personal data.
3. **AI judges (advice only)** — an **HTTP Request** node calls Claude with a system prompt that
   forces a JSON reply: `{ confidence: 0–1, decision: act|recommend|escalate, rationale }`. The
   model is told it may **only advise** — it does not output a supplier, quantity, or price.
4. **Deterministic gate (no AI)** — **Set + IF** nodes apply the rule the AI cannot override:
   - quantity = `max(net_need, MOQ)` rounded up — computed, not from the model;
   - if `confidence ≥ 0.8` **and** `bundle_total ≤ spend_cap` **and** a contracted source exists →
     route to **AUTO-PLACE**; else → **STAGE FOR APPROVAL**; a hard blocker → **ESCALATE**.
5. **Output** —
   - **Auto-place branch:** POST a purchase-requisition payload to the backend / append a row to a
     "POs to place" sheet.
   - **Approval branch:** send the buyer an email/Slack with the proposal + the AI's rationale and a
     one-click approve link.
6. **Audit** — every run appends `{ timestamp, SKU, AI confidence/decision, gate verdict, actor }`
   to a log sheet, so the decision trail is reproducible.

## 3. What AI capability is demonstrated

- **Reasoning over live signals → a structured, bounded recommendation** (confidence + decision +
  rationale), not free text.
- **The safety boundary made visible in no-code:** the AI's recommendation passes through IF/Set
  nodes that *recompute the real numbers and enforce the caps* — so the workflow demonstrably
  "advises, then deterministic logic decides." A reviewer can see exactly where AI stops and rules
  begin.
- **Human-in-the-loop:** anything that doesn't clear the bar is routed to a person with the AI's
  reasoning attached.

## 4. Known limitations of the POC vs. a production system

| POC (n8n) | Production (the MVP) |
|---|---|
| One SKU per run, mock/sheet signals | All SKUs, live DB with provenance to the PO line |
| Gate is a few IF/Set nodes | Tested service with spend caps, MOQ rounding, storage-headroom guard, calibrated confidence bar |
| Forecast = the usage rate passed in | Syntetos–Boylan routing → run-rate/TSB, service-level safety stock, ABC, walk-forward backtest |
| No persistence/roles | Postgres, JWT role-gating, forge-locked production stack |
| "Trust me" on safety | A 29-scenario **agent-safety harness** regression-tests the gate against hostile advice |
| Manual demo trigger | Scheduled, observable, CI-gated deploys |

The POC proves *feasibility and the safety pattern*; the MVP proves *production-readiness*.

## 5. How to reproduce / run it yourself

1. Install n8n (`npx n8n` or Docker) — or use n8n Cloud.
2. Set an **`ANTHROPIC_API_KEY`** environment variable (the AI nodes read `{{ $env.ANTHROPIC_API_KEY }}`),
   or paste a key into each Claude node's `x-api-key` header. Workflow 4 needs no key (pure gate).
3. **Import** each `*.workflow.json` (Workflows → Import from File) — start with
   [`1_procurement_copilot.workflow.json`](1_procurement_copilot.workflow.json).
4. Open the **Manual Trigger** → **Execute Workflow**. Each runs on its included mock data.
5. Watch the run end to end. For the branching ones:
   - **Workflow 1:** default values (H100, €31k > €25k cap) route to **STAGE/ESCALATE** — the gate
     refusing. Lower `unit_price`/`net_need` in *Mock Demand Signals* and re-run → **AUTO-PLACE**.
   - **Workflow 4:** default request (150 > 96 free) **CLAMPS**; set `requested_units` to 50 → **OK**.
6. The "code decides, AI advises" boundary is visible in every workflow: the **Code** node owns the
   numbers/verdict; the **Claude** node only adds advice/narration.

## 6. Demo recording

> **Screen recording (2–5 min):** _[link to be added — Loom/YouTube unlisted]_
> Shows: trigger → signal pull → Claude's JSON advice → the IF/Set gate → an auto-place vs. an
> approval route when a threshold is breached.

(Annotated screenshots are in [`poc_screenshots/`](poc_screenshots/); the four importable flows are
the `*.workflow.json` files in this folder.)
