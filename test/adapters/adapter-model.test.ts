import { test } from "vitest";
import assert from "node:assert/strict";
import {
  ADAPTER_INPUT_SOURCES,
  ADAPTER_OUTPUT_ARTIFACTS,
  ADAPTER_PRESETS,
  MAINSTREAM_ADAPTER_IDS,
  getAdapterInputSources,
  listAdapterTargets,
  supportsAdapterCapability
} from "../../src/adapters/adapter-model.js";

test("adapter model exposes mainstream presets and shared contracts", () => {
  assert.deepEqual(MAINSTREAM_ADAPTER_IDS, ["codex", "github-copilot", "claude-code"]);
  assert.ok(ADAPTER_INPUT_SOURCES.includes("workflow"));
  assert.ok(ADAPTER_OUTPUT_ARTIFACTS.includes("review-report"));
  assert.deepEqual(Object.keys(ADAPTER_PRESETS), MAINSTREAM_ADAPTER_IDS);
});

test("adapter presets expose products entrypoints and input sources", () => {
  const codexTargets = listAdapterTargets(ADAPTER_PRESETS.codex);
  const copilotSources = getAdapterInputSources(ADAPTER_PRESETS["github-copilot"]);

  assert.deepEqual(codexTargets.products, ["codex", "codex-cli"]);
  assert.ok(codexTargets.entrypoints.includes("cli"));
  assert.deepEqual(copilotSources, ["workflow", "standards", "slots", "artifacts"]);
});

test("adapter capability queries reflect tool differences", () => {
  assert.equal(supportsAdapterCapability(ADAPTER_PRESETS.codex, "patchEditing"), true);
  assert.equal(supportsAdapterCapability(ADAPTER_PRESETS["github-copilot"], "patchEditing"), false);
  assert.equal(supportsAdapterCapability(ADAPTER_PRESETS["claude-code"], "approvalControl"), true);
});
