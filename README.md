# Final Project — AI Solution with Compliance & Strategic Implementation

**Author:** Eugen Müller
**Use case / industry:** AI demand forecasting + autonomous procurement for a **cloud/hosting
enterprise** (~5,000 employees, IONOS-scale; ~€640M/yr managed hardware spend).
**The one idea:** *the LLM advises, deterministic code decides* — an AI proposes each buying
decision; tested deterministic code makes every money-moving call, proven by a 29-scenario
agent-safety harness.

**Live:** [demo](https://scm-master-production.up.railway.app) ·
[analytics cockpit](https://scm-power-bi-production.up.railway.app) ·
[MVP source](https://github.com/eugnmueller-87/SCM-Master)
· **Presentation:** [`presentation.html`](presentation.html) (open in a browser)

---

## Core deliverables (1–7)

### 1. Use Case Definition — ✅ done
[`use_case_definition.md`](use_case_definition.md)
Business problem · company profile · AI solution (with system types) · stakeholders · 4 measurable
success criteria · out-of-scope boundaries.

### 2. No-/Low-Code POC — ✅ done
[`poc/poc_documentation.md`](poc/poc_documentation.md)
**Four importable n8n workflows** mirroring SCM Master's decision layer — each runs end-to-end on
mock data, no application code:

1. Procurement copilot — AI judges → gate decides
2. Demand forecast → dynamic reorder
3. Should-cost gap
4. Capacity over-order guard

**→ [See all workflows + screenshots](poc/poc_screenshots/)** — the running n8n flows, as pictures.
Every workflow shows the boundary: a **Code** node owns the numbers/decision; **Claude** only advises.
*(Optional: a 2–5 min screen recording link can be added to the doc.)*

### 3. ROI & Risk Assessment — ✅ done
[`roi_risk_assessment.md`](roi_risk_assessment.md)
Upfront (€43k) + ongoing (€92k/yr) costs · conservative €150k/yr benefit · **ROI₁₂ +11% · ROI₃₆ +76%**
· 9-row assumptions table · break-even inside year 1 · **8-risk matrix** (regulatory/technical/
ethical/operational) with L×I scores + mitigations.

### 4. EU AI Act Compliance — ✅ done
[`compliance/eu_ai_act_compliance.md`](compliance/eu_ai_act_compliance.md)
Classification (**Limited risk**) · step-by-step reasoning · mandatory-requirements summary ·
1–2 page **Conformity Assessment Summary** · **Technical Documentation Outline** (Annex-IV skeleton).

### 5. GDPR Documentation — ✅ done
[`compliance/gdpr_documentation.md`](compliance/gdpr_documentation.md)
Data-flow map · processing-activities register · **DPIA** on the highest-risk activity · data-subject
rights · third-party transfers. Key property: **no personal data is sent to the LLM.**

### 6. Strategic Deployment & Commercialisation — ✅ done
[`strategic_plan.md`](strategic_plan.md)
Phases (POC → Pilot → Full → Scale) · timeline + milestones + gates · go-to-market · stakeholder
communication plan · KPIs per phase · commercialisation model (internal-first, optional SaaS).

### 7. Presentation — 🟡 HTML done; PDF export pending
[`presentation.html`](presentation.html) — 10-slide self-contained deck (keyboard/swipe nav),
also outlined in [`presentation_outline.md`](presentation_outline.md) with Q&A prep.
- 🟡 **You add:** export to `presentation.pdf` (browser → Print → Save as PDF) if a PDF is required.

## Stretch deliverable (8)

### 8. Working MVP — ✅ done (live)
[`mvp/mvp_documentation.md`](mvp/mvp_documentation.md) · **live** + [code](https://github.com/eugnmueller-87/SCM-Master)
A deployed, working AI system (not a mockup): the AI runs, fails closed, 298 tests, a 29-scenario
agent-safety harness, 6-job CI, forge-locked production. Architecture · setup · run · limitations ·
how it extends the POC.

---

## Submission checklist (mirrors the rubric)

**Core**
- [x] `use_case_definition.md`
- [x] POC: 4 n8n workflows + screenshots + documentation (optional: demo recording link)
- [x] `roi_risk_assessment.md`
- [x] `compliance/eu_ai_act_compliance.md`
- [x] `compliance/gdpr_documentation.md`
- [x] `strategic_plan.md`
- [~] Presentation: `presentation.html` ✅ · `presentation.pdf` export 🟡

**Stretch**
- [x] `mvp/mvp_documentation.md`
- [x] GitHub repository (MVP): https://github.com/eugnmueller-87/SCM-Master

---

## Repository structure

```
final-project-eugen/
├── README.md
├── presentation.html              # 10-slide deck (→ export presentation.pdf)
├── presentation_outline.md
├── use_case_definition.md         # 1
├── poc/                           # 2
│   ├── poc_documentation.md
│   ├── 1_procurement_copilot.workflow.json  # + 3 more n8n workflows
│   └── poc_screenshots/
├── roi_risk_assessment.md         # 3
├── compliance/
│   ├── eu_ai_act_compliance.md    # 4
│   └── gdpr_documentation.md      # 5
├── strategic_plan.md              # 6
└── mvp/                           # 8 (stretch — code lives at SCM-Master)
    └── mvp_documentation.md
```

## What makes this submission strong

1. **Core is complete and grounded** — every cost/ROI/risk number traces to a documented assumption
   on a real €640M cloud-enterprise profile, not invented figures.
2. **POC is genuinely no-code** — an importable n8n workflow showing the advises/decides pattern,
   distinct from the MVP (the rubric wants no-/low-code for the POC).
3. **The stretch MVP is live and real** — the AI runs, fails closed, and is regression-tested.
4. **Compliance is argued, not asserted** — the EU AI Act classification walks the decision tree;
   the GDPR design sends **no PII to the LLM**.
