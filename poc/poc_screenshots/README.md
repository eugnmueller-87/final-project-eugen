# POC workflow screenshots

Annotated screenshots of the four n8n POC workflows **running** — referenced by
[`../poc_documentation.md`](../poc_documentation.md) (the "Workflow gallery" section).

## How to capture them

1. Open n8n (`npx n8n`, Docker, or n8n Cloud).
2. Import each `../*.workflow.json` (**Workflows → Import from File**). Only
   workflow 2 needs an `ANTHROPIC_API_KEY`; 1, 3, 4 run with no key.
3. Open the **Manual Trigger** → **Execute Workflow** so the run shows green
   node states, then screenshot the canvas.
4. To show the safety branches, flip a mock value and re-run (see
   `../poc_documentation.md` §5), and capture both routes if you like.
5. Save the PNGs here with these exact names so the doc's image links resolve:

| File to save here | Workflow |
|---|---|
| `1_redaction_boundary.png` | POC 1 · Local redaction boundary → "send REDACTED text to LLM" |
| `2_extract_validate.png` | POC 2 · LLM extract → schema-validate → "review gate" |
| `3_confirm_route_publish.png` | POC 3 · Human confirm → route → "PUBLISH → feed/calendar/ICS" |
| `4_photo_consent_gate.png` | POC 4 · Double-gated consent → "WITHHOLD → blurred image only" |

> The four importable `*.workflow.json` files are the actual deliverable and run
> as-is; these screenshots are the visual record of them running. (An end-to-end
> simulation that executes the same JSONs node-by-node lives in
> [`../../simulation/`](../../simulation/) — run `node simulation/run.js`.)
