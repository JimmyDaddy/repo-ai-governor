#!/usr/bin/env node

/**
 * Runs repo-global governance gates independently from build.
 *
 * These gates only read markdown / yaml / csv / json files and do not
 * require TypeScript build output. They can run in parallel with build
 * and package-level gates.
 *
 * Usage:
 *   node ./scripts/ci/run-repo-global-gates.js [--group governance|docs|all] [--output json]
 */

import { spawn } from "node:child_process";

/** @typedef {{ name: string; script: string; group: string }} GateEntry */

const JSON_STDERR_PREVIEW_LIMIT = 2000;

/** @type {GateEntry[]} */
const REPO_GLOBAL_GATES = [
  {
    name: "code-standards",
    script: "gate:code-standards",
    group: "governance",
  },
  {
    name: "docs-triad-sync",
    script: "gate:docs-triad-sync",
    group: "docs",
  },
  {
    name: "technical-solution-module-graph",
    script: "gate:technical-solution-module-graph",
    group: "docs",
  },
  {
    name: "technical-solution-lifecycle-registry",
    script: "gate:technical-solution-lifecycle-registry",
    group: "docs",
  },
  {
    name: "technical-solution-delivery-registry",
    script: "gate:technical-solution-delivery-registry",
    group: "docs",
  },
  {
    name: "task-ledger-sync",
    script: "gate:task-ledger-sync",
    group: "governance",
  },
  {
    name: "sprint-plan-status-sync",
    script: "gate:sprint-plan-status-sync",
    group: "governance",
  },
  {
    name: "code-review-status-sync",
    script: "gate:code-review-status-sync",
    group: "governance",
  },
  {
    name: "worktree-review-target",
    script: "gate:worktree-review-target",
    group: "governance",
  },
  {
    name: "artifact-lifecycle",
    script: "gate:artifact-lifecycle",
    group: "governance",
  },
  {
    name: "normative-loading-manifest",
    script: "gate:normative-loading-manifest",
    group: "docs",
  },
];

/**
 * Runs a single gate script via pnpm and returns timing/status info.
 * @param {GateEntry} gate
 * @returns {Promise<{ name: string; group: string; status: string; elapsed: number; error?: string }>}
 */
function runGate(gate) {
  return new Promise((resolve) => {
    const startMs = Date.now();
    const child = spawn("pnpm", ["run", gate.script], {
      stdio: ["ignore", "pipe", "pipe"],
    });

    /** @type {string[]} */
    const stderrChunks = [];

    child.stderr.on("data", (chunk) => {
      stderrChunks.push(chunk.toString("utf8"));
    });

    child.on("error", (err) => {
      resolve({
        name: gate.name,
        group: gate.group,
        status: "error",
        elapsed: Date.now() - startMs,
        error: err.message,
      });
    });

    child.on("close", (code) => {
      resolve({
        name: gate.name,
        group: gate.group,
        status: code === 0 ? "passed" : "failed",
        elapsed: Date.now() - startMs,
        error: code !== 0 ? stderrChunks.join("").slice(0, JSON_STDERR_PREVIEW_LIMIT) : undefined,
      });
    });
  });
}

// --- CLI argument parsing ---

const args = process.argv.slice(2);
const groupIndex = args.indexOf("--group");
const groupFilter = groupIndex !== -1 && args[groupIndex + 1] ? args[groupIndex + 1] : "all";
const outputIndex = args.indexOf("--output");
const outputMode = outputIndex !== -1 && args[outputIndex + 1] ? args[outputIndex + 1] : "pretty";
const jsonOutput = outputMode === "json";

const gates =
  groupFilter === "all"
    ? REPO_GLOBAL_GATES
    : REPO_GLOBAL_GATES.filter((g) => g.group === groupFilter);

if (gates.length === 0) {
  console.error(
    `[repo-global-gates] No gates found for group "${groupFilter}". Available groups: governance, docs, all`,
  );
  process.exit(1);
}

// --- Execute all gates in parallel ---

const overallStart = Date.now();
if (!jsonOutput) {
  console.info(
    `[repo-global-gates] Running ${gates.length} gates (group=${groupFilter}) started at ${new Date(overallStart).toISOString()}`,
  );
}

const results = await Promise.all(gates.map(runGate));

const overallElapsed = ((Date.now() - overallStart) / 1000).toFixed(1);
const passed = results.filter((r) => r.status === "passed").length;
const failed = results.filter((r) => r.status !== "passed").length;

if (jsonOutput) {
  const summary = {
    profile: "repo-global",
    group: groupFilter,
    total: results.length,
    passed,
    failed,
    elapsed_seconds: Number.parseFloat(overallElapsed),
    gates: results.map((r) => ({
      name: r.name,
      group: r.group,
      status: r.status,
      elapsed_ms: r.elapsed,
      ...(r.error ? { error: r.error } : {}),
    })),
  };
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
} else {
  console.info("");
  console.info("─── Repo-Global Gate Results ───");
  for (const r of results) {
    const icon = r.status === "passed" ? "✓" : "✗";
    const timeStr = (r.elapsed / 1000).toFixed(1);
    console.info(`  ${icon} ${r.name} (${r.group}) — ${timeStr}s`);
    if (r.error) {
      const firstLine = r.error.split("\n")[0];
      console.info(`    └─ ${firstLine}`);
    }
  }
  console.info("");
  console.info(
    `[repo-global-gates] ${passed}/${results.length} passed, elapsed=${overallElapsed}s`,
  );
}

process.exit(failed > 0 ? 1 : 0);
