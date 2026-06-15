# Aushang — end-to-end workflow simulation

A self-contained, zero-dependency Node.js harness that **simulates every workflow
the project defines, end to end, on mock data** — with **no live infrastructure**
(no Supabase, no OCR/redaction worker, no real LLM, no n8n server, no network).

It exists for **completeness and proof**: it demonstrates that every flow's logic
runs green and that the project's two non-negotiable principles hold — *"the LLM
advises, deterministic code + a human decide"* and *"privacy by construction"* —
**without having to deploy or operate anything**. Flows that are **built but not
yet live** (native FCM push, AI cover images) are simulated too and clearly
flagged `⚑`.

## Run it

```bash
# from the final-project repo root
node simulation/run.js

# or from inside this folder
cd simulation && node run.js

# plain output (no ANSI colour), e.g. for CI logs
NO_COLOR=1 node simulation/run.js
```

Exit code is **0** only if **every assertion passes**; any failure prints `✗` and
exits non-zero (so a grader / CI sees red, not a silently-wrong green). The latest
run: **52 assertions, all passing.**

## What it simulates

| Flow | File | Covers |
|---|---|---|
| **Core pipeline** | `flows/01_core_pipeline.js` | capture → OCR → **local redaction (fail-closed)** → boundary assert → LLM **suggests** (redacted text only) → **schema-validate** → admin **confirms/corrects** → `publish_post` routes by the **confirmed** type. 5 scenarios incl. the happy path, the AI-correction ("tap to correct"), the **fail-closed leak** (nothing sent to the LLM), the **schema-fail → manual path** (never auto-published), and **reflection-photo deletion at publish** (migration `0023`). |
| **Auth & onboarding** | `flows/02_auth_onboarding.js` | operator-provisioned, **invite-only** (no public signup): `create_org` / `add_person` / set-password link, plus every **deny-by-default** guardrail (admin can't cross orgs, can't mint an admin; members can't provision). |
| **Delivery & privacy** | `flows/03_delivery_and_privacy.js` | email digest + web push + **native FCM push ⚑**, per-user **ICS** feed, **take-down → cancel / re-publish → restore** (`0018`/`0019`), **double-gated clear-photo consent** (`0020`), **cross-org isolation** (the headline acceptance test), per-user **DE/EN i18n**, and the decorative **AI cover image ⚑**. |
| **n8n POC workflows** | `flows/04_n8n_poc.js` | a tiny n8n interpreter that **loads the four real `../poc/*.workflow.json` files and executes them node-by-node** (Set / Code / IF / NoOp; the Claude HTTP node is stubbed — no network) on their own mock data, asserting each reaches its documented terminal branch. |

## How it's built

- `lib/domain.js` — the deterministic logic the flows share, mirroring the **real
  codebase** (DIGITNEWS): the `ROUTING` table (`src/lib/content/types.ts`), the
  fail-closed redaction regex pack (`worker/redaction.py`), strict schema
  validation (`src/lib/content/extraction-schema.ts`), and the publish + consent
  rules (`publish_post` RPC, migrations `0020`/`0023`). The **only** non-deterministic
  step — the LLM — is a deterministic stub (`fakeLLM`); everything that gates
  publishing or privacy is real, deterministic code.
- `lib/fixtures.js` — two orgs (for the isolation test), an operator/admins/members,
  and board photos that exercise every content type and every failure mode. All
  synthetic — **no real PII**.
- `lib/trace.js` — a small trace + assertion printer (honours `NO_COLOR`).
- `run.js` — runs all flows and prints the PASS/FAIL roll-up.

## What it does *not* do

It does not call any real service or prove the production deployment works — it
proves the **logic** of every workflow end to end. The live system itself is the
MVP at **kita-connect.cloud** (source: `github.com/eugnmueller-87/DIGITNEWS`); this
harness is the paper-trail companion that runs anywhere `node` does.

> `⚑ built, not yet live` — the flow's code exists in the repo but its external
> dependency isn't deployed yet (an FCM project for native push; an EU image
> endpoint for cover images). The simulation runs the logic regardless, so the
> end-to-end picture is complete.
