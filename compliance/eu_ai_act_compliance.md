# EU AI Act Compliance — SCM Master

**System:** AI demand forecasting + procurement copilot for datacenter hardware
**Regulation:** Regulation (EU) 2024/1689 (EU AI Act) · **Assessment date:** 2026-06

---

## 1. Risk classification

> **Classification: LIMITED RISK** (with elements that are Minimal risk).
> **Not** Unacceptable. **Not** High-risk.

## 2. Classification reasoning (step by step)

**Step 1 — Is it an AI system under Art. 3?** Yes. It uses an ML demand-forecasting model and an
LLM that generates recommendations/inferences. So the Act applies.

**Step 2 — Is it a prohibited (Unacceptable) practice (Art. 5)?** No. It does no social scoring, no
biometric categorisation, no subliminal manipulation, no real-time remote biometric ID. It forecasts
demand and advises on purchasing. → **Not Unacceptable.**

**Step 3 — Is it High-risk (Art. 6 + Annex III)?** No. High-risk requires either (a) a safety
component of a regulated product, or (b) falling in an Annex III area: biometrics, critical
infrastructure *safety*, education, employment, essential services, law enforcement, migration,
justice, democratic processes.
- The system is **internal B2B procurement decision-support.** It is not a safety component, does not
  decide access to essential services for individuals, makes no decisions about people (no hiring,
  credit, benefits, policing).
- "Critical infrastructure" in Annex III means AI as a **safety component of digital
  infrastructure** (e.g. traffic/water/energy supply management). This system optimises a company's
  *procurement of hardware* — a business/financial decision, not a real-time safety control of
  infrastructure. → **Not High-risk.**

**Step 4 — Does it trigger transparency obligations (Art. 50 — Limited risk)?** Partially, by design
choice. The system has an LLM copilot/commentary that produces text for users. While Art. 50 mainly
targets chatbots facing natural persons and synthetic-media labelling, **we voluntarily adopt its
transparency spirit**: users are always told when output is AI-generated vs. computed. → **Limited
risk (transparency obligations apply / adopted).**

**Step 5 — Otherwise Minimal risk.** The deterministic forecasting/reorder math and the rule-based
gate are conventional software, not regulated AI obligations — Minimal risk, no mandatory duties
beyond good practice.

**Net:** the system is **Limited risk**: lawful, low obligation, with transparency duties we meet.
The most consequential design fact — *the LLM only advises; deterministic, tested code makes every
money-moving decision* — is precisely what keeps it out of the High-risk tier and makes the residual
AI risk auditable.

## 3. Mandatory requirements (Limited-risk obligations + voluntarily adopted High-risk-style controls)

Although Limited-risk, we apply several High-risk-style controls as good practice (they also
de-risk a future reclassification if the use expands).

| Area | Obligation | How the design addresses it |
|---|---|---|
| **Transparency (Art. 50)** | Users know they're interacting with AI / AI-generated content | The cockpit labels insights "deterministic · auditable" vs. an explicit "AI commentary" button; the copilot is clearly the agent. AI-generated text is never passed off as a computed fact. |
| **Human oversight** | A human can understand, override, and not over-rely | **Human-in-the-loop by design:** every material buy is *staged for approval*; the AI's confidence + rationale are shown; a human approves/edits/rejects. The agent cannot place above thresholds alone. |
| **Data & data governance** | Representative, relevant data; documented | Forecasts trained on the company's own dated usage history; demand-pattern classification documented; no personal data in the model (procurement/asset data only — see GDPR doc). |
| **Accuracy & robustness** | Stated accuracy, tested, degrades safely | Forecast accuracy is **measured on a walk-forward backtest** (WMAPE/bias) and reported, not asserted; the system **fails closed** — unparseable/hostile AI advice → escalate, never auto-place. |
| **Cybersecurity** | Protect against misuse/attack | JWT role-gating; forge-locked production (refuses weak admin, refuses to seed, persistent storage only); SAST (bandit) + dependency-CVE audit (pip-audit) in CI; the **agent-safety harness** tests resistance to prompt-injection and poisoned inputs. |

## 4. Conformity Assessment Summary

> *(Formal-style summary — 1–2 pages.)*

**System name:** SCM Master — AI demand forecasting & procurement copilot.

**What it does:** Forecasts per-SKU hardware demand from usage history, classifies each SKU's demand
pattern and routes it to an appropriate estimator, computes service-level safety stock and a dynamic
reorder point, and runs an LLM copilot that *advises* on each purchasing decision. A deterministic
gate (spend caps, confidence floor, approved-source check, warehouse-capacity guard) decides whether
a buy auto-places, is staged for human approval, or is escalated. An analytics cockpit presents the
results; a should-cost engine produces a defensible cost floor for negotiation.

**Risk class & basis:** **Limited risk.** It is internal B2B procurement decision-support with a
human in the loop; it is not a prohibited practice, not a safety component, and falls in no Annex III
high-risk area. Transparency obligations (Art. 50) apply and are met.

**Applicable obligations and how addressed:**
1. *Transparency* — AI-generated content is labelled and separated from computed facts. ✔
2. *Human oversight* — every material decision is human-approved; AI advice is bounded
   (confidence/decision/rationale only) and cannot set supplier/qty/price. ✔
3. *Accuracy & robustness* — accuracy measured on a holdout backtest; the system fails closed on bad
   AI output. ✔ (Provenance: the **29-scenario agent-safety harness** is the regression-test that
   proves the gate refuses hostile advice.)
4. *Data governance* — own historical data; no personal data in the model. ✔
5. *Cybersecurity* — role-gating, forge-lock, SAST + CVE audit, injection tests. ✔

**Gaps (not yet addressed) & resolution before deployment:**
- *Formal model card per model* — outline exists (§5); to be completed before rollout.
- *Bias evaluation* — supplier-selection is rule-based (low bias surface), but a documented
  Giskard/fairness check on the forecast across categories is a pre-rollout to-do.
- *Logging retention policy* — decision logs exist; a formal retention/erasure policy is to be
  finalised with the DPIA (see GDPR doc).
- *Incident-response runbook* for AI failure — to be written before production.

**Conclusion:** As a Limited-risk system with human-in-the-loop and a regression-tested decision
gate, SCM Master meets its applicable obligations. The listed gaps are documentation/process items,
not architectural changes, and are resolvable within the pilot→rollout phase.

## 5. Technical Documentation Outline

> *(Table of contents / skeleton of the full technical-documentation package — Annex IV style. Not
> all written; outlined as required.)*

1. **System overview** — purpose, intended use, users, out-of-scope uses
2. **Architecture** — data model, services, the agent layer, the decision gate, deployment topology
3. **Data**
   3.1 Sources & lineage · 3.2 Demand-pattern classification · 3.3 Preprocessing · 3.4 Data quality
4. **Models**
   4.1 Forecasting (run-rate / TSB) — method, parameters, routing rule
   4.2 LLM copilot — model id, prompts, structured-output contract, retry/fail-closed behaviour
   4.3 Model cards (per model)
5. **The decision gate** — spend caps, confidence floor, MOQ, approved-source, capacity guard;
   confirm-recompute-from-live behaviour
6. **Accuracy & evaluation** — walk-forward backtest methodology, WMAPE/bias, per-category results,
   the lumpy-demand finding
7. **Human oversight** — approval workflow, what the human sees, override paths
8. **Robustness & safety** — the agent-safety harness (scenarios, adversarial cases, results)
9. **Cybersecurity** — auth/roles, forge-lock, SAST/CVE audit, injection resistance
10. **Logging & traceability** — what is logged, retention, audit trail
11. **Risk management** — the risk matrix (see ROI/risk doc), residual risks
12. **Change management & versioning** — CI gates, migrations, deploy/promotion process
13. **Limitations & known issues** — intermittent-demand caveat, scope boundaries
