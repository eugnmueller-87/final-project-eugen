# Use Case Definition — Aushang: Digitizing the Paper Notice Board

**Project:** Aushang — a digitization layer for old-school organizations that keep using paper.
**Author:** Eugen Müller · **Role framing:** AI consultant → builder
**Live system:** [kita-connect.cloud](https://kita-connect.cloud) (live, in real-world testing) · [code](https://github.com/eugnmueller-87/DIGITNEWS)

---

## 1. Business problem statement

**The problem:** A whole class of small, low-tech organizations — Kitas (daycares), Vereine
(clubs), Kirchengemeinden (church congregations), Kleingartenkolonien (allotment associations) —
still run their communication on a **physical paper notice board**. A weekly meal plan, an event
flyer, a lice warning, a closure notice gets pinned to a cork board in the hallway. This works for
the people who walk past it every day and fails everyone else:

- **Parents who didn't see the board miss things** — the trip on Thursday, the Kita is closed
  Friday, the lice notice. There is no feed, no calendar, no reminder.
- **Digitizing normally means changing the org's process.** The off-the-shelf answer is "adopt an
  app / a portal / a newsletter tool" — which means the staff now maintain a second system, retype
  everything, and learn software. Small orgs with one overworked admin **won't** do this, so they
  stay on paper.
- **The information is sensitive and local.** Notices name children, parents, phone numbers, dates.
  Pushing photos of a Kita's board into a generic cloud tool is a privacy problem these orgs are
  (rightly) nervous about.

The result is a digital divide: the organizations least able to adopt software are the ones whose
members most need the information to be reachable.

**The one idea:** *the LLM advises, deterministic code decides.* An AI reads a photograph of the
board and **proposes** structure (what kind of notice, the dates, the meal plan); a human admin
**confirms** before anything is published; tested code does the routing, the calendar, the
privacy enforcement. The AI never publishes on its own.

**For whom:** the **administration and members of a small, low-tech organization** — concretely, in
the live pilot, a **Kita**: the Kita lead/admin (who photographs the board), and the parents and
staff (who get a private feed, calendar, and digest). The design generalizes to any org with a
physical board.

## 2. Company / organization profile

| | |
|---|---|
| **Sector** | Small community organizations — Kitas, Vereine, Kirchengemeinden, Kleingärten, small businesses (DACH, German-language) |
| **Size** | Very small — typically one admin and tens-to-low-hundreds of members per org; the tool is **multi-tenant** so one operator serves many such orgs |
| **Current state** | A **physical paper notice board**. No feed, no calendar, no digest. Communication is "walk past the board." Any digitization attempt has so far meant changing the process (a portal/app the staff must maintain), which these orgs resist |
| **Constraint that defines the product** | The org's process **must not change.** They keep pinning paper to the board; the only new action is *one admin photographing it from inside the tool.* "Digitalisierung ohne Prozessänderung." |
| **Privacy sensitivity** | High — notices contain children's names, parents' contacts, dates. EU/DACH data-protection expectations are strict and the orgs are privacy-anxious by nature |

## 3. Proposed AI solution

A **capture → review → publish pipeline** built on one rule end-to-end — **"the LLM advises,
deterministic code decides."** The admin photographs the board; the system turns the photo into a
private, structured, privacy-safe digital feed *that the admin confirms before anyone sees it.*

| Component | AI system type | What the AI does | What deterministic code does |
|---|---|---|---|
| **OCR** | **Perception** (vision → text) | Tesseract reads the German text off the deskewed photo | Deterministic preprocessing (OpenCV deskew), language-pinned OCR |
| **PII redaction** | **Classification / NER** (local, on-device) | Presidio + spaCy detect names/contacts as candidate PII | A German regex pack catches phone/email/IBAN/birthdate at confidence 1.0; **fail-closed** masking to `[NAME_1]` placeholders; the only text that leaves the box is redacted |
| **Content extraction** | LLM **structured extraction** | Reads the *redacted* text, **suggests** a content type and pulls dates / a meal plan / events into a schema | Validates the LLM output against a strict JSON schema; on failure routes to the manual path — **never auto-publishes** |
| **Routing & publish** | *(no AI)* deterministic | — | The admin **confirms** the content type; a security-definer RPC routes by the *confirmed* value to feed / calendar / ICS / category library and flips the post to `published` |

The **AI part** is the perception (OCR), the local PII classification, and the advisory extraction;
the **decision part** is the schema validation, the human confirmation gate, and the deterministic
routing/privacy enforcement. The system is explicit about which is which — **the LLM never makes a
notice visible to a member on its own, and never sees a raw photo or un-redacted PII.**

## 4. Key stakeholders

| Stakeholder | Affected / decides / uses | Interest |
|---|---|---|
| **Operator (you)** | Decides the product; provisions orgs | A privacy-defensible tool small orgs will actually adopt without changing their process |
| **Kita admin / org lead** | Primary user | Get the board's information to every parent in minutes, by *photographing it* — no retyping, no second system to maintain |
| **Parents / members** | Primary beneficiaries | A private feed, a shared calendar (ICS), an email digest, "new since last visit" — never miss a closure or a trip again |
| **Staff** | Affected | Their notices reach families reliably; less "didn't you see the board?" |
| **The data subjects on the notices** (children, named parents) | Affected (privacy) | Their PII is masked **locally before any AI call** and never published unredacted |
| **Data Protection Officer / parent council** | Affected / approves | A design where raw photos never leave the org's infra and no un-redacted PII reaches any external AI |

## 5. Success criteria (measurable)

1. **Process unchanged, time-to-publish low** — an admin turns a photographed notice into a
   published, structured post in **a single review pass** (confirm the type, tap to correct, edit,
   publish). Target: the admin's only new habit is *photograph the board*; everything else is
   confirmation, not data entry.
2. **Privacy by construction holds** — **0 raw photos** and **0 un-redacted PII** ever reach the
   external LLM, enforced by the architecture (local redaction upstream of the call; PII columns
   `REVOKE`'d from members at the DB layer), not by policy. Verified by the data-flow boundary and
   the column-grant tests.
3. **Nothing publishes without a human** — **100%** of member-visible posts pass through explicit
   admin confirmation; routing reads only the admin-confirmed `content_type` (NULL until
   confirmed), never the LLM's suggestion. Proven by the `publish_post` RPC being the sole path to
   member visibility.
4. **Reach** — members get the information through channels the board never had: a private feed,
   a subscribable calendar (ICS), an email-on-publish digest, web push, and per-category "new since
   last visit" counts. Target in the pilot: parents report they *stop missing* closures/events.

## 6. Out-of-scope boundaries

The solution explicitly does **not**:

- **Publish anything autonomously.** No notice becomes member-visible without an admin confirming
  the content type and pressing publish. The LLM's suggestion is a pre-fill, never a decision.
- **Send raw images or un-redacted PII to any external service.** PII is detected and masked
  **locally** before the only external AI call; raw photos never leave the org's infrastructure.
  There is deliberately **no code path** that would send a raw image anywhere.
- **Replace the org's process.** It does not ask the org to stop using its paper board, retype
  notices, or maintain a second system. The board stays; one admin photographs it.
- **Offer public signup or a public surface.** It is **invite-only / operator-provisioned** —
  accounts are created by an operator/admin, not self-service. No public feed.
- **Act as a news/RSS reader** despite the repo's legacy name (`DIGITNEWS`). It processes **only
  what the org already pinned to its own board** — not the open internet.
- **Claim official ratings.** Where the AI estimates (e.g. a meal plan's Nutri-Score), the value is
  schema-forced to be flagged an **estimate**, never presented as an official score.
