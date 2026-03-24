#!/usr/bin/env node

import { spawnSync } from "node:child_process";

import { gateFail, gateInfo, gatePass } from "../governance/gate-output.js";

const GATE_NAME = "resilience-regression";

const SCENARIOS = [
  {
    scenarioId: "restricted-network-local-fallback",
    purpose:
      "Verify route dispatch can keep flow progress through local fallback when external network surfaces are unavailable.",
    command: [
      "pnpm",
      "exec",
      "vitest",
      "run",
      "--config",
      "vitest.packages.config.ts",
      "packages/adapter-sdk/test/agent-route-runner.smoke.test.ts",
      "--testNamePattern",
      "restricted network",
    ],
  },
  {
    scenarioId: "offline-degrade-integration-routing",
    purpose:
      "Verify cross-package adapter routing still yields deterministic fallback behavior in restricted mode.",
    command: [
      "pnpm",
      "run",
      "test:integration",
      "--",
      "test/first-batch-adapters-route.integration.test.ts",
      "--maxWorkers=1",
      "--maxConcurrency=1",
    ],
  },
  {
    scenarioId: "cli-restricted-network-rehearsal",
    purpose:
      "Verify CLI run diagnostics capture restricted-network local fallback takeover semantics.",
    command: [
      "pnpm",
      "run",
      "test:integration",
      "--",
      "apps/cli/test/cli-governance-runtime.integration.test.ts",
      "--testNamePattern",
      "restricted-network local fallback rehearsal",
      "--maxWorkers=1",
      "--maxConcurrency=1",
    ],
  },
  {
    scenarioId: "task-ledger-sync",
    purpose:
      "Verify task ledger synchronization gate remains green after degraded-mode regression runs.",
    command: ["pnpm", "run", "check:task-ledger-sync"],
  },
  {
    scenarioId: "sprint-status-sync",
    purpose:
      "Verify sprint-level status aggregation stays consistent with current execution records.",
    command: ["pnpm", "run", "check:sprint-plan-status-sync"],
  },
  {
    scenarioId: "artifact-lifecycle-integrity",
    purpose:
      "Verify artifact lifecycle and dependency links remain consumable in resilience baseline.",
    command: ["pnpm", "run", "check:artifact-lifecycle"],
  },
];

/**
 * Runs one resilience regression scenario command.
 * @param {{scenarioId: string; purpose: string; command: string[]}} scenario Scenario definition.
 */
function runScenario(scenario) {
  gateInfo(GATE_NAME, `${scenario.scenarioId}: ${scenario.purpose}`);
  gateInfo(GATE_NAME, `command=${scenario.command.join(" ")}`);

  const [bin, ...args] = scenario.command;
  const result = spawnSync(bin, args, {
    stdio: "inherit",
    env: process.env,
  });

  if (result.status !== 0) {
    gateFail(
      GATE_NAME,
      `${scenario.scenarioId} failed with exit code ${result.status ?? "unknown"}.`,
    );
    process.exit(result.status ?? 1);
  }
}

gateInfo(GATE_NAME, `running ${SCENARIOS.length} resilience scenarios...`);
for (const scenario of SCENARIOS) {
  runScenario(scenario);
}
gatePass(GATE_NAME, "restricted-network and offline-degrade regression baseline passed.");
