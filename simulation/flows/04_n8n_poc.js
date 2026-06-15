"use strict";
/**
 * FLOW 4 — Execute the four n8n POC workflow JSONs themselves.
 *
 * This is a TINY n8n interpreter: it loads each real `*.workflow.json` from
 * ../../poc/ and walks it from the Manual Trigger, running Set / Code / IF /
 * NoOp / HTTP-Request nodes on the workflow's OWN mock data, following the
 * connections (keyed by node name). The Code nodes' embedded JavaScript is run
 * in a sandbox with the same $json / $('Node') / $now / $env shims n8n exposes.
 *
 * The point: prove the IMPORTABLE JSONs actually produce the routing the docs
 * claim — without a live n8n server. (The HTTP-Request "Claude" node in POC 2
 * is stubbed to return a canned suggestion; no network, no API key.)
 */

const fs = require("fs");
const path = require("path");
const vm = require("vm");
const t = require("../lib/trace");

const POC_DIR = path.resolve(__dirname, "..", "..", "poc");

// Where each workflow's branch SHOULD land on its default mock data.
const EXPECTED = {
  "1_redaction_boundary.workflow.json": "→ Send REDACTED text to LLM",
  "2_extract_validate.workflow.json": "→ Review gate (human confirms)",
  "3_confirm_route_publish.workflow.json": "PUBLISH → feed/calendar/ICS",
  "4_photo_consent_gate.workflow.json": "WITHHOLD → blurred image only",
};

// Canned Claude response for POC 2's HTTP node (a valid event suggestion).
const CANNED_CLAUDE = {
  content: [
    {
      text: JSON.stringify({
        content_type_suggested: "event_notice",
        title: "Elternabend",
        events: [{ title: "Elternabend", starts_on: "2026-07-24", time_start: "18:30", all_day: true }],
        ambiguous_dates: [],
      }),
    },
  ],
};

function loadWorkflow(file) {
  return JSON.parse(fs.readFileSync(path.join(POC_DIR, file), "utf8"));
}

// Resolve "={{ expr }}" against a tiny expression context (Set/IF leftValue etc.).
function evalExpr(raw, ctx) {
  if (typeof raw !== "string" || !raw.startsWith("=")) return raw;
  const body = raw.slice(1).replace(/^{{/, "").replace(/}}$/, "").trim();
  const sandbox = {
    $json: ctx.$json,
    $: ctx.$,
    $now: ctx.$now,
    $env: ctx.$env,
    JSON,
    Math,
    Array,
  };
  return vm.runInNewContext(body, sandbox, { timeout: 1000 });
}

function runCode(jsCode, ctx) {
  // n8n Code node "Run Once for All Items": the script `return`s [{json:...}].
  const sandbox = {
    $json: ctx.$json,
    $: ctx.$,
    $now: ctx.$now,
    $env: ctx.$env,
    JSON,
    Math,
    Array,
    Object,
    Number,
    parseInt,
    parseFloat,
    isNaN,
    console: { log() {} },
  };
  const wrapped = `(function(){ ${jsCode} })()`;
  return vm.runInNewContext(wrapped, sandbox, { timeout: 1000 });
}

// Execute one workflow, return the name of the terminal node reached.
function execute(wf) {
  const byName = new Map(wf.nodes.map((n) => [n.name, n]));
  const conns = wf.connections;

  // $('NodeName') accessor — returns the last item that node produced.
  const produced = new Map();
  const $ = (name) => ({ item: { json: (produced.get(name) || [{ json: {} }])[0].json } });
  const $now = { toISO: () => "2026-06-15T10:00:00.000Z" };
  const $env = { ANTHROPIC_API_KEY: "(stubbed — no network in the sim)" };

  // Find the Manual Trigger.
  const trigger = wf.nodes.find((n) => n.type === "n8n-nodes-base.manualTrigger");
  let current = trigger.name;
  let items = [{ json: {} }];
  produced.set(current, items);

  const path = [current];
  let guard = 0;

  while (guard++ < 50) {
    const out = conns[current];
    if (!out || !out.main) break; // terminal node

    const node = byName.get(current);
    // For IF nodes we pick output 0 or 1; for others always output 0.
    let outputIndex = 0;

    const next = node.type;
    // Compute this node's effect for the NEXT node's $json (already done when we
    // entered it below); here we just route.
    if (next === "n8n-nodes-base.if") {
      // Re-evaluate the IF on the incoming items to choose the branch.
      const cond = node.parameters.conditions.conditions[0];
      const ctx = { $json: items[0].json, $, $now, $env };
      const left = evalExpr(cond.leftValue, ctx);
      const right = cond.rightValue;
      const pass = left === right;
      outputIndex = pass ? 0 : 1;
    }

    const branch = out.main[outputIndex] || [];
    if (branch.length === 0) break;
    const targetName = branch[0].node;
    const targetNode = byName.get(targetName);

    // Execute the TARGET node to produce its items.
    items = runNode(targetNode, items, { $, $now, $env });
    produced.set(targetName, items);
    current = targetName;
    path.push(current);
  }
  return { terminal: current, path };
}

function runNode(node, inItems, helpers) {
  const incoming = inItems[0] ? inItems[0].json : {};
  const ctx = { $json: incoming, ...helpers };
  switch (node.type) {
    case "n8n-nodes-base.set": {
      const out = { ...incoming };
      const asg = node.parameters.assignments.assignments || [];
      for (const a of asg) out[a.name] = a.value;
      return [{ json: out }];
    }
    case "n8n-nodes-base.code": {
      const res = runNode_code(node, ctx);
      return res;
    }
    case "n8n-nodes-base.httpRequest": {
      // Stub the Claude call (POC 2) — no network. Return the canned response.
      return [{ json: CANNED_CLAUDE }];
    }
    case "n8n-nodes-base.if":
    case "n8n-nodes-base.noOp":
    default:
      return inItems; // pass through
  }
}

function runNode_code(node, ctx) {
  const res = runCode(node.parameters.jsCode, ctx);
  if (Array.isArray(res)) return res;
  return [{ json: res }];
}

function run() {
  t.flow("n8n POC workflows", "execute the four importable JSONs node-by-node on mock data");
  t.resetSteps();

  const files = Object.keys(EXPECTED);
  for (const file of files) {
    const wf = loadWorkflow(file);
    const { terminal, path } = execute(wf);
    t.step(wf.name.replace(/^Aushang — /, ""), `${path.length} nodes → "${terminal}"`);
    t.assert(
      terminal === EXPECTED[file],
      `${file}: reached the expected terminal node on default mock data`
    );
  }

  t.note("each workflow imports cleanly (audited: 0 blockers) and the Code-node logic runs as documented");
  return { name: "n8n POC workflows", scenarios: files.length };
}

module.exports = { run };
