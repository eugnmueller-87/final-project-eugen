# POC screenshots — what to capture

Drop PNGs here after importing the `*.workflow.json` files into n8n
(**Workflows → Import from File**). Set `ANTHROPIC_API_KEY` first (workflow 4 needs no key).

Suggested shots (rename to match):

**Workflow 1 — Procurement copilot**
1. `01-copilot-overview.png` — full canvas (Trigger → Signals → Claude → Gate → IF → 2 branches).
2. `02-copilot-stage.png` — a run on the **default** values → **STAGE/ESCALATE** (€31k > €25k cap).
   *The safety money-shot.*
3. `03-copilot-autoplace.png` — lower `unit_price`/`net_need`, re-run → **AUTO-PLACE**.

**Workflow 2 — Demand forecast → dynamic reorder**
4. `04-forecast-overview.png` — full canvas.
5. `05-forecast-output.png` — the *Forecast + Reorder Point* node output: safety stock, reorder
   point, status (+ the AI reliability note in the final node).

**Workflow 3 — Should-cost gap**
6. `06-shouldcost-output.png` — the *Clean-Sheet Should-Cost* node: floor, target, **gap to quote**
   (+ the AI negotiation line).

**Workflow 4 — Capacity over-order guard**
7. `07-capacity-clamp.png` — default request (150 > 96 free) → **CLAMP** (the FALSE branch).
8. `08-capacity-ok.png` — set `requested_units` to 50, re-run → **OK** (the TRUE branch).

> Minimum strong set: the 4 overview shots + shots 2 and 7 (the two safety-refusal behaviours).
