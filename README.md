# Final Project — AI Solution with Compliance & Strategic Implementation

**Author:** Eugen Müller
**Use case / industry:** AI demand forecasting + autonomous procurement for a **cloud/hosting
enterprise** (~5,000 employees, IONOS-scale; ~€640M/yr managed hardware spend).

**The one idea:** *the LLM advises, deterministic code decides* — an AI proposes each buying
decision; tested, deterministic code makes every money-moving call, proven by a 29-scenario
agent-safety harness.

**Live:** [demo](https://scm-master-production.up.railway.app) ·
[analytics cockpit](https://scm-power-bi-production.up.railway.app) ·
[MVP source](https://github.com/eugnmueller-87/SCM-Master)

---

## Deliverables (rubric mapping)

| # | Deliverable | File |
|---|---|---|
| 1 | Use Case Definition | [`use_case_definition.md`](use_case_definition.md) |
| 2 | No-/Low-Code POC | [`poc/poc_documentation.md`](poc/poc_documentation.md) · [`poc/poc_workflow.json`](poc/poc_workflow.json) · [`poc/poc_screenshots/`](poc/poc_screenshots/) |
| 3 | ROI & Risk Assessment | [`roi_risk_assessment.md`](roi_risk_assessment.md) |
| 4 | EU AI Act Compliance | [`compliance/eu_ai_act_compliance.md`](compliance/eu_ai_act_compliance.md) |
| 5 | GDPR Documentation | [`compliance/gdpr_documentation.md`](compliance/gdpr_documentation.md) |
| 6 | Strategic Deployment & Commercialisation | [`strategic_plan.md`](strategic_plan.md) |
| 7 | Presentation | [`presentation_outline.md`](presentation_outline.md) → export to `presentation.pdf` |
| 8 | **Stretch — Working MVP** | [`mvp/mvp_documentation.md`](mvp/mvp_documentation.md) · live + [code](https://github.com/eugnmueller-87/SCM-Master) |

## What makes this submission strong

- **Core is complete and grounded** — every cost/ROI/risk figure traces to documented assumptions
  (a real €640M-spend cloud-enterprise profile), not invented numbers.
- **POC is genuinely no-code** — an importable n8n workflow that demonstrates the AI-advises /
  code-decides pattern inside the no-code tool, distinct from the MVP.
- **The stretch MVP is live and real** — not a mockup: the AI runs, fails closed, and is
  regression-tested by a 29-scenario agent-safety harness.
- **Compliance is argued, not asserted** — the EU AI Act classification walks the decision tree to
  *Limited risk*; the GDPR doc's key property is that **no personal data is sent to the LLM**.

## Submission structure

```
final-project-eugen/
├── README.md
├── use_case_definition.md
├── poc/
│   ├── poc_documentation.md
│   ├── poc_workflow.json
│   └── poc_screenshots/
├── roi_risk_assessment.md
├── compliance/
│   ├── eu_ai_act_compliance.md
│   └── gdpr_documentation.md
├── strategic_plan.md
├── presentation_outline.md      (→ export presentation.pdf)
└── mvp/
    └── mvp_documentation.md      (MVP code lives at the SCM-Master repo)
```
