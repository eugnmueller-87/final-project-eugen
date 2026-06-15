#!/usr/bin/env node
"use strict";
/**
 * Aushang — end-to-end simulation of ALL project workflows, on mock data, with
 * NO live infrastructure (no Supabase, no worker, no real LLM, no n8n server).
 *
 * Run:  node simulation/run.js        (from the final-project repo root)
 *  or:  node run.js                   (from inside simulation/)
 *
 * It executes every workflow the project defines and asserts the invariants that
 * make the project what it is — "the LLM advises, deterministic code decides" and
 * "privacy by construction" — then prints a single PASS/FAIL summary and exits
 * non-zero on any failed assertion (so CI / a grader sees red, not silent green).
 *
 * Flows that are BUILT but NOT YET LIVE (native FCM push, AI cover images) are
 * simulated too and clearly flagged ⚑ — the sim proves their logic regardless of
 * deployment status.
 */

const t = require("./lib/trace");

const flows = [
  require("./flows/01_core_pipeline"),
  require("./flows/02_auth_onboarding"),
  require("./flows/03_delivery_and_privacy"),
  require("./flows/04_n8n_poc"),
];

function main() {
  t.header("AUSHANG — END-TO-END WORKFLOW SIMULATION (mock data, no live infra)");
  console.log(
    t.c("dim", "  Principles under test: ") +
      "LLM advises · code + a human decide   |   privacy by construction"
  );
  console.log(t.c("dim", "  ⚑ = built, not yet live (logic simulated anyway)"));

  const results = [];
  for (const f of flows) {
    results.push(f.run());
  }

  // Roll-up.
  t.header("RESULT");
  for (const r of results) {
    console.log("  " + t.c("green", "✓ ") + r.name + t.c("dim", `  (${r.scenarios} scenario${r.scenarios === 1 ? "" : "s"})`));
  }
  const ok = t.summary();
  if (ok) {
    console.log("\n" + t.c("green", t.c("bold", "● ALL WORKFLOWS SIMULATED GREEN — end to end.")));
    console.log(t.c("dim", "  No PII ever crossed to the LLM; nothing published without a human; orgs stayed isolated."));
  } else {
    console.log("\n" + t.c("red", t.c("bold", "● SIMULATION FAILED — see ✗ above.")));
  }
  process.exit(ok ? 0 : 1);
}

main();
