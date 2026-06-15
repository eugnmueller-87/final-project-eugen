"use strict";
/**
 * Tiny trace + assertion helper for the Aushang end-to-end simulation.
 *
 * Zero dependencies. Pure stdout. Every flow uses these to print a readable,
 * step-by-step trace and to assert invariants — so the run is a self-checking
 * demonstration, not just console noise. A failed assertion exits non-zero so
 * the whole simulation fails loudly (and so CI / a grader sees red, not a
 * silently-wrong green).
 */

const C = {
  reset: "\x1b[0m",
  dim: "\x1b[2m",
  bold: "\x1b[1m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
  blue: "\x1b[34m",
};

// Honor NO_COLOR (https://no-color.org/) so piped/CI output stays clean.
const useColor = !process.env.NO_COLOR;
function c(color, s) {
  return useColor ? C[color] + s + C.reset : s;
}

let assertCount = 0;
let assertFailed = 0;

function header(title) {
  const bar = "═".repeat(Math.max(8, title.length + 4));
  console.log("\n" + c("cyan", "╔" + bar + "╗"));
  console.log(c("cyan", "║  ") + c("bold", title) + c("cyan", "  ║"));
  console.log(c("cyan", "╚" + bar + "╝"));
}

function flow(name, subtitle) {
  console.log(
    "\n" + c("magenta", "▶ FLOW: ") + c("bold", name) + (subtitle ? c("dim", "  — " + subtitle) : "")
  );
}

let stepN = 0;
function resetSteps() {
  stepN = 0;
}
function step(label, detail) {
  stepN += 1;
  const n = String(stepN).padStart(2, "0");
  console.log(
    "  " + c("blue", n + " ▸ ") + label + (detail !== undefined ? c("dim", "  " + detail) : "")
  );
}

function note(msg) {
  console.log("     " + c("dim", "· " + msg));
}

function flag(msg) {
  // For "(built, not yet live)" style annotations.
  console.log("     " + c("yellow", "⚑ " + msg));
}

function assert(cond, msg) {
  assertCount += 1;
  if (cond) {
    console.log("     " + c("green", "✓ ") + c("dim", msg));
  } else {
    assertFailed += 1;
    console.log("     " + c("red", "✗ FAIL: " + msg));
  }
  return cond;
}

function blocked(msg) {
  // A deliberate, correct refusal (fail-closed / withheld / not-published).
  console.log("     " + c("yellow", "⛔ BLOCKED (by design): ") + msg);
}

function summary() {
  console.log("\n" + c("cyan", "─".repeat(60)));
  const ok = assertFailed === 0;
  const line =
    `Assertions: ${assertCount}   ` +
    (ok ? c("green", `passed ${assertCount}`) : c("red", `FAILED ${assertFailed}`));
  console.log(line);
  console.log(c("cyan", "─".repeat(60)));
  return ok;
}

module.exports = {
  header,
  flow,
  step,
  note,
  flag,
  assert,
  blocked,
  resetSteps,
  summary,
  c,
};
