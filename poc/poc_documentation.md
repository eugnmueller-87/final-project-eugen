# POC Documentation — No-Code Procurement Copilot

**Deliverable 2 — No-/Low-Code Proof of Concept**

This POC proves the **core AI capability** of the solution — *an AI judges a buying decision and a
human approves it* — using a **no-code n8n workflow**, with **zero application code**. The full
coded system is documented separately as the optional **MVP stretch** ([../mvp/mvp_documentation.md](../mvp/mvp_documentation.md));
this document is the rubric's primary no-/low-code POC.

> **Why two artefacts?** The rubric asks the POC to be no-/low-code (n8n/Make/Zapier) and the MVP
> (stretch) to be a working coded product. Rather than blur them, this POC is a genuine n8n
> workflow anyone can import and run; the MVP shows the same idea productionised. Doing both is the
> consultant→builder arc the project rewards.

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
2. **Import** [`poc_workflow.json`](poc_workflow.json) (Workflows → Import from File).
3. Set two credentials: an **Anthropic API key** (HTTP header `x-api-key`) and the **signals URL**
   (a published sheet or the mock endpoint in the workflow's Set node).
4. Open the **Schedule/Manual trigger** node → **Execute Workflow**.
5. Watch the run: signals → Claude advice (JSON) → IF/Set gate → AUTO-PLACE or APPROVAL output.
6. Flip an input (e.g. push confidence < 0.8, or total over the cap) and re-run to see the gate
   **route to approval / escalate** instead of auto-placing — the core safety behaviour.

## 6. Demo recording

> **Screen recording (2–5 min):** _[link to be added — Loom/YouTube unlisted]_
> Shows: trigger → signal pull → Claude's JSON advice → the IF/Set gate → an auto-place vs. an
> approval route when a threshold is breached.

(Annotated screenshots of each node are in [`poc_screenshots/`](poc_screenshots/); the importable
flow is [`poc_workflow.json`](poc_workflow.json).)
