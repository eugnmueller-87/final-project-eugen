# POC screenshots — the four workflows running in n8n

Each image is the imported workflow executing on mock data. The boundary is visible in every one:
a **Code** node owns the numbers/decision; the **Claude** node only advises.

## 1 · Procurement copilot
AI judges the buy → a deterministic gate (spend cap + confidence floor) decides **auto-place vs.
stage for approval**.

![Procurement copilot workflow](procurement%20copilot.png)

## 2 · Demand forecast → dynamic reorder
Code computes service-level **safety stock + a dynamic reorder point**; Claude adds a one-line
reliability note over the number.

![Demand forecast and dynamic reorder workflow](demand%20forecast%20.png)

## 3 · Should-cost gap
Commodity-indexed clean-sheet teardown → **cost floor / target / gap to the quote**; Claude drafts
the negotiation line over the computed gap.

![Should-cost gap workflow](should%20cost%20gap.png)

## 4 · Capacity over-order guard
Free-to-order math (`capacity − on-hand − inbound`) → **refuse / clamp** an over-order. No AI — a
pure enforcement gate (the HTTP-422 invariant in the MVP).

![Capacity over-order guard workflow](capacity%20over%20order%20guard.png)
