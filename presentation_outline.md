# Presentation Outline — SCM Master

> The final slide deck (`presentation.pdf` / `.pptx`) follows this structure. This outline is the
> speaker plan; export to slides for submission. ~10–12 slides, ~10 min + Q&A.

---

**1. Title** — SCM Master: an AI decision layer for datacenter hardware procurement.
Name, the consultant→builder framing, the two live URLs.

**2. The problem (30s)** — Cloud/hosting enterprise (~5,000 staff, €640M spend). Chip lead times
swing; static reorder points break → stockouts; over-ordering ties up cash. Spreadsheets, no "why."

**3. The use case & who it's for** — AI demand forecasting + a procurement copilot with a dynamic
reorder point. Stakeholders: CEO (decides), procurement + planners (use), finance + ops (affected).

**4. The core idea — "the LLM advises, deterministic code decides"** — the one slide that carries
the whole project. AI proposes confidence/decision/rationale; tested code decides supplier, qty,
price, place/stage/escalate. *This is the trust story.*

**5. POC demo (no-code) — 2–3 min** — the n8n workflow: signal → Claude advice (JSON) → IF/Set gate
→ auto-place vs. approval. Flip a threshold live to show the gate route to approval. (Recorded
fallback ready.)

**6. MVP demo (stretch) — 1–2 min** — the live system: run the agent, see staged requisitions with
rationale; the cockpit (Overview/Spend/Forecast with year filters, capacity tile); the New-Order
flow with the over-order guard refusing (422).

**7. Trust, proven — the agent-safety harness** — 29 scenarios feed the gate *hostile* advice
(unapproved supplier, over-cap, prompt injection, garbage JSON) and assert it refuses. Teeth-verified.
This is what makes "advises/decides" a guarantee, not a slogan.

**8. ROI & break-even** — Pilot €43k, year-1 all-in €135k; conservative benefit €150k/yr →
ROI₁₂ ≈ +11%, ROI₃₆ ≈ +76%; **break-even inside year 1**, driven by one avoided stockout. Honest
framing: risk reduction + working capital, validated by the pilot, not promised.

**9. Risk matrix (top 3)** — R2 LLM-on-money (20 → mitigated by the gate + harness), R6 adoption
(16 → human-in-the-loop + explainability), R1 drift (12 → owner + backtest + can-say-stop).

**10. Compliance summary** — EU AI Act: **Limited risk** (decision-support, human-in-the-loop, no
Annex III) + transparency met. GDPR: B2B data, **no PII to the LLM**; only internal accounts + audit
stamps; DPIA done, residual risk LOW.

**11. Strategic plan** — Phases: POC ✅ → Pilot (10 wk, gated) → Full → Scale. Commercialisation:
internal capability first (base case that pays for itself), optional SaaS + consulting upside.
Verdict: 🟡 **run the pilot.**

**12. Close + Q&A** — One line: *a system that lets AI advise and tested code decide — proven on a
live, compliant, regression-tested build.* Q&A prep below.

---

## Q&A preparation (anticipated questions)

- **"Why not let the AI just place orders?"** → It's untrustworthy with money; the gate + harness
  exist precisely so it can't. Show the over-order 422 / escalate-on-garbage.
- **"Is 57% forecast accuracy good?"** → It's the all-SKU blend incl. unforecastable lumpy items;
  the point is *routing* + safety stock, and the honest lumpy-demand finding. Per-category/year is
  better; the pilot validates on real SKUs.
- **"Why Limited risk, not High?"** → Walk Step 3: no Annex III area, not a safety component,
  decisions are about purchases not people, human-in-the-loop.
- **"What about data sent to Anthropic?"** → Procurement signals only — no personal data crosses
  that boundary; show the data-flow map.
- **"What if the pilot fails?"** → That's a valid, cheap outcome — the gate to proceed is explicit;
  €43k buys a real answer.
