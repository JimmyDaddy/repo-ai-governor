import { test } from "vitest";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  CONFIG_ENV_PREFIX,
  buildCliConfigOverride,
  loadResolvedConfig
} from "../../src/config/load-config.js";
import { ConfigurationConflictError, ConfigurationError } from "../../src/config/errors.js";

function createTempRepo() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "repo-ai-governor-config-"));
}

function writeFile(filePath: string, content: string) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, "utf8");
}

test("buildCliConfigOverride maps supported CLI options to config fields", () => {
  const override = buildCliConfigOverride({
    project: "mvp",
    sprint: "sprint-001",
    locale: "en-US",
    language: "typescript",
    preset: "official/base",
    adapter: ["codex", "claude-code"]
  });

  assert.deepEqual(override, {
    execution: {
      currentProject: "mvp",
      currentSprint: "sprint-001"
    },
    standards: {
      locales: {
        default: "en-US"
      },
      preset: "official/base"
    },
    project: {
      language: "typescript"
    },
    adapters: {
      enabled: ["codex", "claude-code"]
    }
  });
});

test("loadResolvedConfig merges defaults repository env and cli overrides", () => {
  const cwd = createTempRepo();

  writeFile(
    path.join(cwd, ".repo-ai-governor/governor.yaml"),
    [
      'schemaVersion: "1"',
      "project:",
      "  name: demo-repo",
      "  language: javascript",
      "execution:",
      "  currentProject: core",
      "  currentSprint: sprint-001",
      "slots:",
      "  enabled:",
      "    - security-review",
      "adapters:",
      "  enabled:",
      "    - codex"
    ].join("\n")
  );

  writeFile(
    path.join(cwd, ".repo-ai-governor/slots/security-review.yaml"),
    [
      "id: security-review",
      'version: "1"',
      "kind: governance-slot",
      "meta:",
      "  owner: platform",
      "  name:",
      '    zh-CN: 安全审查',
      '    en-US: Security Review'
    ].join("\n")
  );

  writeFile(
    path.join(cwd, ".repo-ai-governor/adapters/codex.yaml"),
    [
      "id: codex",
      'version: "1"',
      "type: ide-or-cli"
    ].join("\n")
  );

  const result = loadResolvedConfig({
    cwd,
    environment: {
      [`${CONFIG_ENV_PREFIX}PROJECT__FRAMEWORK`]: "react",
      [`${CONFIG_ENV_PREFIX}REPORTING__FORMATS`]: '["json"]'
    },
    cliOverrides: {
      project: "mvp",
      sprint: "sprint-002",
      locale: "en-US",
      adapter: ["codex"]
    }
  });

  assert.equal(result.config.project.name, "demo-repo");
  assert.equal(result.config.project.language, "javascript");
  assert.equal(result.config.project.framework, "react");
  assert.equal(result.config.execution.currentProject, "mvp");
  assert.equal(result.config.execution.currentSprint, "sprint-002");
  assert.equal(result.config.standards.locales?.default, "en-US");
  assert.deepEqual(result.config.reporting.formats, ["json"]);
  assert.equal(result.slotDefinitions[0].id, "security-review");
  assert.equal(result.adapterDefinitions[0].id, "codex");
  assert.deepEqual(
    result.layers.map((layer) => layer.name),
    ["defaults", "repository", "slots", "adapters", "environment", "cli"]
  );
});

test("loadResolvedConfig works without repository config file by applying defaults", () => {
  const cwd = createTempRepo();
  const result = loadResolvedConfig({
    cwd,
    cliOverrides: {
      project: "mvp",
      sprint: "sprint-001"
    }
  });

  assert.equal(result.config.schemaVersion, "1");
  assert.equal(result.config.execution.currentProject, "mvp");
  assert.equal(result.config.execution.currentSprint, "sprint-001");
  assert.equal(result.paths.configFile, path.join(cwd, ".repo-ai-governor/governor.yaml"));
  assert.deepEqual(result.slotDefinitions, []);
  assert.deepEqual(result.adapterDefinitions, []);
});

test("loadResolvedConfig rejects duplicate slot ids", () => {
  const cwd = createTempRepo();

  writeFile(
    path.join(cwd, ".repo-ai-governor/slots/security-review.yaml"),
    [
      "id: security-review",
      'version: "1"',
      "kind: governance-slot"
    ].join("\n")
  );
  writeFile(
    path.join(cwd, ".repo-ai-governor/slots/security-review-copy.yaml"),
    [
      "id: security-review",
      'version: "1"',
      "kind: governance-slot"
    ].join("\n")
  );

  assert.throws(() => loadResolvedConfig({ cwd }), ConfigurationConflictError);
});

test("loadResolvedConfig rejects enabled definitions that are missing on disk", () => {
  const cwd = createTempRepo();

  writeFile(
    path.join(cwd, ".repo-ai-governor/governor.yaml"),
    [
      'schemaVersion: "1"',
      "adapters:",
      "  enabled:",
      "    - codex"
    ].join("\n")
  );

  assert.throws(() => loadResolvedConfig({ cwd }), ConfigurationError);
});

test("loadResolvedConfig rejects duplicate script extension ids within a slot definition", () => {
  const cwd = createTempRepo();

  writeFile(
    path.join(cwd, ".repo-ai-governor/slots/docs-output.yaml"),
    [
      "id: docs-output",
      'version: "1"',
      "kind: governance-slot",
      "extensions:",
      "  scripts:",
      "    - id: shared-hook",
      "      runtime:",
      "        kind: command",
      "        entry: node ./scripts/docs-output.js",
      "    - id: shared-hook",
      "      runtime:",
      "        kind: command",
      "        entry: node ./scripts/docs-output-2.js"
    ].join("\n")
  );

  assert.throws(() => loadResolvedConfig({ cwd }), ConfigurationError);
});
