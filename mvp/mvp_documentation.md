# MVP Documentation — SCM Master (Stretch Deliverable)

**This is the optional stretch:** a fully working, deployed AI system that extends the no-code POC
into a production-grade product. It is **live**, not a mockup.

- **Live demo:** https://scm-master-production.up.railway.app (log in `admin` / `admin`)
- **Analytics cockpit:** https://scm-power-bi-production.up.railway.app
- **Source code:** https://github.com/eugnmueller-87/SCM-Master

---

## 1. Architecture overview

```
                ┌────────────────────────── SCM Master (FastAPI + SQLAlchemy 2.0 + Postgres) ─────────────────────────┐
 Operations  →  │  models/ (catalog · procurement · flow · requisition · costing · tco · ordering)                   │
                │  services/ (lifecycle · sourcing · planning · forecasting · calibration · costing · tco · ordering) │
                │                                                                                                     │
 Decision    →  │  agent/  ── copilot ──► call_claude ──► Anthropic (ADVISES: confidence/decision/rationale)         │
   layer        │            │                                                                                       │
                │            ▼  DETERMINISTIC GATE (DECIDES): supplier ← sourcing · qty ← demand+MOQ ·                │
                │               price ← contract · place/stage/escalate ← spend cap + confidence floor +             │
                │               approved-source + capacity guard                                                     │
                │                                                                                                     │
 API         →  │  api/v1/ (auth · catalog · procurement · flow · planning · agent · costing · tco · requisitions)   │
                └───────────────┬─────────────────────────────────────────────────────────────┬───────────────────┘
                                │ JWT, role-gated                                              │ /api/data (server-side)
                                ▼                                                              ▼
                  Operations UI (served at /)                              Analytics cockpit (Node + Chart.js)
                  asset board · inventory · orders · New-Order modal       Overview · Spend · Forecast · Should-Cost · TCO
```

**The thesis, in code:** the LLM is reached only through `agent/copilot.py`; it returns
`confidence/decision/rationale` strings. Supplier, quantity, price, and the place/stage/escalate
disposition are computed by deterministic services. A **29-scenario agent-safety harness**
(`tests/agent_eval/`) regression-tests that the gate refuses hostile advice.

## 2. Core AI capability demonstrated (the AI actually runs)

- **Demand forecasting** — Syntetos–Boylan classifier routes each SKU to run-rate or **TSB**;
  service-level safety stock (`z × σ` over lead-time buckets); ABC classification; **walk-forward
  backtest** scores accuracy (WMAPE/bias).
- **Procurement copilot** — Claude judges each supplier bundle; the deterministic gate decides.
- **Should-cost engine** — commodity-indexed clean-sheet teardown → defensible cost floor + target.
- **TCO** — per-asset whole-life cost rollup to a SCOR/APQC TSCMC ratio.
- **Cockpit insights** — a deterministic rules engine (concentration/HHI, weeks-of-cover, TCO
  inversion) with optional on-demand AI commentary that narrates *over* the computed facts.

## 3. Basic error handling (fails gracefully)

- LLM failure / unparseable / hostile output → `AgentError` → the bundle degrades to **escalate**,
  never auto-places (fail-closed). Verified by the agent-safety harness.
- Over-order beyond warehouse capacity → server-side guard **refuses (422)**.
- Non-EUR / currency-mix in TCO → fails loud rather than silently mixing.
- Cockpit: a per-tab `try/catch` means one chart error can't blank the board; AI commentary
  degrades to "unavailable" if the API has no credit.
- Production is **forge-locked**: refuses to seed, refuses demo accounts, refuses a weak admin,
  refuses non-persistent storage.

## 4. Setup & installation

```bash
# Backend (from backend/)
python -m venv .venv
.venv\Scripts\pip install -r requirements.txt
.venv\Scripts\alembic upgrade head          # create/upgrade schema
.venv\Scripts\python -m app.seed_demo        # demo dataset (every screen populated)
.venv\Scripts\uvicorn app.main:app --reload  # serves API + operations UI at /
```

`.env.example` documents the config (`DATABASE_URL`, `SECRET_KEY`, `SCM_ENV`, `ANTHROPIC_API_KEY`,
`ADMIN_PASSWORD`). Never commit real keys. SQLite by default; point `DATABASE_URL` at Postgres for
production (driver auto-pinned).

## 5. How to run it

- Open `/` → log in (`admin`/`admin` on the demo) → asset board, inventory, orders.
- **New order:** Orders → "New order" → pick a product or package → see live capacity → stage.
- **Run the agent:** Requisitions → "Run agent" → see staged/auto-placed with rationale.
- **Cockpit:** open the analytics URL → Overview/Spend/Forecast/Should-Cost/TCO, with year filters.
- **Tests:** `pytest -q` (298 passing) · `pytest -m agent_eval` (29 safety scenarios).

## 6. Known limitations & what production needs

- **Demand:** genuinely intermittent/project-batch SKUs are managed by safety stock, not point
  forecasts (documented, by design).
- **Quotes:** should-cost quotes are seeded today; a quote-intake path (API / LLM PDF extraction) is
  the next feature.
- **Live AI:** requires Anthropic API credit; the cockpit degrades gracefully without it.
- **For production:** finalise per-model cards, a bias check on the forecast, a logging-retention
  policy (per the DPIA), and an AI-incident runbook (tracked in the EU AI Act doc's gap list).

## 7. How it extends the POC

| No-code POC (n8n) | This MVP |
|---|---|
| One SKU, mock signals, IF/Set gate | All SKUs, live Postgres with provenance, a tested decision service |
| Manual trigger | Scheduled + on-demand, observable, CI-gated, two live stacks |
| "Advises/decides" shown in nodes | The same boundary, **regression-tested** by 29 adversarial scenarios |
| Proves feasibility | Proves production-readiness |

## 8. Repository

GitHub: **https://github.com/eugnmueller-87/SCM-Master** — organised `backend/app/{models,services,
agent,api,schemas}`, `frontend/`, `tests/` (incl. `tests/agent_eval/`), `alembic/` migrations,
`requirements.txt`, `.env.example`, 6-job CI (`.github/workflows/ci.yml`), and a meaningful commit
history across Phases 0–10.
