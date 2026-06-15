# Strategic Deployment & Commercialisation Plan — Aushang

**Customer:** small community organizations (Kitas, Vereine, Kirchengemeinden) · **Status verdict:**
🟢 **Ship & validate the pilot, then pursue a channel.** The MVP is **already live** at
[kita-connect.cloud](https://kita-connect.cloud) with a first Kita in real-world testing — the
technology and privacy story are proven; the open question is **distribution**, not whether it works.

---

## 1. Deployment phases

| Phase | What | State |
|---|---|---|
| **0 — Build** | Schema + RLS, auth, the capture → OCR → redaction → LLM → review → publish pipeline, calendar/ICS, email/push, PWA, GDPR/deletion flows | ✅ Done (the MVP, Phases 1–5) |
| **1 — POC** | No-code n8n workflows proving the "AI suggests / code & human decide" pattern + the privacy boundary | ✅ Done (see POC doc) |
| **2 — Pilot** | One real Kita using it on its real board; tune redaction, validate the review flow, confirm parents stop missing things | ▶ In progress (live now) |
| **3 — Hardening & multi-org** | Worker behind HTTPS, regenerated DB types, redaction-recall test, model card, retention schedule; onboard a handful of orgs | Next |
| **4 — Channel scale** | Sell *through* a Kita-association / Träger / municipality; native shell (Capacitor) for app stores; productise self-serve onboarding | Planned |

## 2. Timeline & milestones

| Phase | Duration | Milestones | Gate to proceed |
|---|---|---|---|
| **2 — Pilot** | ~4–6 weeks (live) | Real board captured weekly · redaction tuned on real notices · review flow used by the real admin · parents subscribed to feed/ICS/digest | The admin uses it unprompted; **parents report they stop missing closures/events**; no PII-leak incident |
| **3 — Hardening & multi-org** | ~6–8 weeks | Worker fronted with TLS (a `worker.` subdomain) · redaction-recall test on a labelled notice set · per-model card + retention schedule · 3–5 orgs onboarded | Onboarding a new org is self-serve enough for the operator to do in <1 hr; clean security re-review |
| **4 — Channel scale** | 3–6 months | A signed association/Träger/municipality channel reselling to many orgs · native app shells in the stores · pricing validated | A channel partner committed; per-org marginal cost stays ~cents; CAC via the channel beats self-serve |

**Decision points are explicit:** the pilot can return "stop/redesign" — if the real admin won't
adopt the *photograph-the-board* habit, or redaction proves unreliable on real notices, that is a
cheap, early answer (the MVP is already built; the cost of learning this is near-zero).

## 3. Go-to-market strategy

This is framed two ways, because the honest finding from the ROI is that **single-org self-serve
does not repay a full build** — the value unlock is a *channel.*

**Primary (channel-led — the path to payback):**
- **Target buyers:** **Kita-associations / Träger (operators of many Kitas), church districts,
  municipalities, allotment federations** — entities that each represent *dozens to hundreds* of
  small orgs with the identical problem.
- **Channel:** sell the multi-tenant product to the umbrella body; they roll it out to their member
  orgs. One sale = many orgs onboarded.
- **Pricing/value model:** per-org SaaS (€15–25/org/mo) bundled into the association's offering, or a
  flat per-association licence. The build cost amortizes across the channel's org count.
- **Differentiator:** **privacy by construction** (no PII to any external AI; raw photos never leave
  EU infra) is exactly the property a Kita-association's DPO needs to say yes — and **no process
  change** (just photograph the board) is exactly what overworked Kita admins need to actually adopt.

**Secondary (direct self-serve — proof + early revenue, not the payback engine):**
- **Target buyers:** individual Kitas/Vereine that find it directly.
- **Channel:** direct sign-up, operator-provisioned.
- **Pricing model:** €15/org/mo. Useful for the reference story and early cash, but the ROI shows
  this alone won't repay a full build at small org counts — it feeds the channel pitch.

## 4. Stakeholder communication plan

| Stakeholder | What they need to hear | Who communicates | When |
|---|---|---|---|
| **Kita admin (pilot user)** | "Nothing about your process changes — you photograph the board, confirm what the AI suggests, publish. No retyping, no second system." | Operator | Onboarding + weekly during pilot |
| **Parents / members** | "A private feed, a shared calendar you can subscribe to, an email when something new is posted — you'll stop missing closures." | The Kita admin + the app's onboarding | At invite |
| **Kita association / Träger (channel buyer)** | The privacy-by-construction story (DPO-ready), the no-process-change adoption story, the per-org economics, the live reference Kita | Operator (founder-led sale) | Channel pitch |
| **DPO / parent council** | No raw photos leave EU infra; **no PII to the external AI** (redacted locally first); double-gated photo consent; deletion/erasure flows; EU AI Act = Limited risk | Operator | Before a channel go-live |
| **Operator (you)** | The honest ROI: cheap to run, proven feature, payback depends on a channel | — | Continuous |

## 5. KPIs per phase

| Phase | KPI | Target |
|---|---|---|
| **Pilot** | Admin adoption | The real admin captures the board unprompted, weekly |
| **Pilot** | Member benefit | Parents report they stop missing closures/events (qualitative) |
| **Pilot** | Privacy | **0** PII-leak incidents; redaction tuned so ordinary notices aren't over-masked |
| **Hardening** | Onboarding effort | A new org live in **< 1 hr** of operator time |
| **Hardening** | Robustness | Schema-validation pass rate measured; manual-path fallback never blocks |
| **Channel** | Distribution | ≥ 1 association/Träger channel signed |
| **Channel** | Unit economics | Per-org marginal cost ~cents; channel CAC < self-serve CAC |

## 6. Commercialisation model

**Choice: run the live pilot to a clean reference, then commercialise through a channel
(association/Träger/municipality), with direct self-serve as a secondary funnel.**

**Justification:** The ROI is honest that **self-serve single-Kita subscription does not repay a
full solo build at small scale** — managed infra is cheap (~€1.3k/yr cash) and the feature is proven
and live, but tens of €15/mo orgs don't amortize a €35k build. The leverage is **distribution**: a
single Kita-association or Träger represents dozens-to-hundreds of orgs with the *identical* problem,
the *identical* privacy anxiety the design already answers, and the *identical* "won't change our
process" adoption blocker the design is built around. Selling the multi-tenant product *through* that
umbrella turns one sale into many orgs and amortizes the build across the channel. The live pilot is
cheap and produces the one thing a channel pitch needs: a **real Kita using it on a real board, with
a real DPO-ready privacy story** — not a mockup. If no channel materialises, the product still stands
as a live, compliant, reference build whose return is the credential and the option value, with
self-serve covering its cash cost. Productising the channel is the upside; the live, privacy-correct
pilot is the proof that earns it.
