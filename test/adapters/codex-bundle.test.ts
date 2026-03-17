import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "vitest";
import YAML from "yaml";
import {
  buildCodexAdapterBundle,
  renderCodexAdapterBundle,
} from "../../src/adapters/codex-bundle.js";
import { runCli } from "../../src/cli/index.js";
import { EXIT_CODES } from "../../src/cli/runtime/exit-codes.js";

type BufferedStream = {
  isTTY: boolean;
  write: (chunk: unknown) => boolean;
  toString: () => string;
};

function createTempRepo() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "repo-ai-governor-codex-"));
}

function createBufferedStream(): BufferedStream {
  const chunks: string[] = [];

  return {
    isTTY: false,
    write(chunk: unknown) {
      chunks.push(String(chunk));
      return true;
    },
    toString() {
      return chunks.join("");
    },
  };
}

async function runCommand(argv: string[]) {
  const stdout = createBufferedStream();
  const stderr = createBufferedStream();
  const exitCode = await runCli(argv, { stdout, stderr });

  return {
    exitCode,
    stdout: stdout.toString(),
    stderr: stderr.toString(),
  };
}

async function bootstrapRepo(cwd: string) {
  const initResult = await runCommand([
    "init",
    "--cwd",
    cwd,
    "--project",
    "demo",
    "--sprint",
    "sprint-001",
    "--adapter",
    "codex",
    "--format",
    "json",
  ]);

  assert.equal(initResult.exitCode, EXIT_CODES.success);

  const planResult = await runCommand([
    "plan",
    "--cwd",
    cwd,
    "--project",
    "demo",
    "--sprint",
    "sprint-001",
    "--title",
    "Render Codex adapter bundle",
    "--format",
    "json",
  ]);

  assert.equal(planResult.exitCode, EXIT_CODES.success);
}

test("Codex bundle renders workflow standards and entry files for the current sprint", async () => {
  const cwd = createTempRepo();
  await bootstrapRepo(cwd);

  const configFilePath = path.join(cwd, ".repo-ai-governor/governor.yaml");
  const config = YAML.parse(fs.readFileSync(configFilePath, "utf8"));
  config.slots.enabled = ["docs-slot"];
  fs.writeFileSync(configFilePath, YAML.stringify(config), "utf8");

  fs.mkdirSync(path.join(cwd, ".repo-ai-governor/slots"), { recursive: true });
  fs.writeFileSync(
    path.join(cwd, ".repo-ai-governor/slots/docs-slot.yaml"),
    [
      "id: docs-slot",
      'version: "1"',
      "kind: governance-slot",
      "meta:",
      "  owner: platform",
      "  source: official",
      "  slotType: documentation-output",
      "  name:",
      "    zh-CN: 文档插槽",
      "    en-US: Documentation Slot",
      "trigger:",
      "  match: all",
      "  when:",
      "    stages:",
      "      - plan",
      "    commands:",
      "      - plan",
      "behavior:",
      "  priority: 180",
      "  conflictPolicy: merge",
      "  inject:",
      "    ai:",
      "      promptKey: documentation-output-checklist",
    ].join("\n"),
    "utf8",
  );

  const bundle = buildCodexAdapterBundle({
    cwd,
    project: "demo",
    sprint: "sprint-001",
    command: "plan",
    stageId: "plan",
  });

  assert.equal(bundle.adapter.id, "codex");
  assert.deepEqual(bundle.adapter.products, ["codex", "codex-cli"]);
  assert.equal(bundle.runtime.project, "demo");
  const entry = bundle.entry;
  assert.ok(entry);
  assert.equal(entry.agentEntry.path, "AGENTS.md");
  assert.equal(entry.currentContext.path, ".repo-ai-governor/context/current-context.md");
  assert.ok(bundle.workflow.selectedStages.includes("plan"));
  assert.ok(bundle.standards.rules.length > 0);
  assert.deepEqual(
    bundle.slots.active.map((slot) => slot.id),
    ["docs-slot"],
  );

  const markdown = renderCodexAdapterBundle(bundle, "markdown");
  assert.match(markdown, /# Codex Governance Bundle/);
  assert.match(markdown, /Products: `codex, codex-cli`/);
  assert.match(markdown, /AGENTS: `AGENTS.md`/);
  assert.match(markdown, /Current Context: `.repo-ai-governor\/context\/current-context.md`/);
  assert.match(markdown, /documentation-output-checklist/);
});

test("Codex bundle rendering script prints markdown for a bootstrapped repository", async () => {
  const cwd = createTempRepo();
  await bootstrapRepo(cwd);

  const output = execFileSync(
    process.execPath,
    [
      "./scripts/examples/render-codex-adapter-bundle.js",
      "--cwd",
      cwd,
      "--project",
      "demo",
      "--sprint",
      "sprint-001",
      "--command",
      "plan",
      "--stage",
      "plan",
    ],
    {
      cwd: path.resolve("."),
      encoding: "utf8",
    },
  );

  assert.match(output, /# Codex Governance Bundle/);
  assert.match(output, /Adapter: `codex`/);
  assert.match(output, /Project: `demo`/);
});

test("Codex adapter example assets document the integration and acceptance path", () => {
  const exampleRoot = path.resolve("examples", "adapters", "codex");
  const readme = fs.readFileSync(path.join(exampleRoot, "README.md"), "utf8");
  const acceptance = fs.readFileSync(path.join(exampleRoot, "acceptance.md"), "utf8");

  assert.match(readme, /render-codex-adapter-bundle\.js/);
  assert.match(readme, /AGENTS\.md/);
  assert.match(acceptance, /Codex Adapter Acceptance/);
  assert.match(acceptance, /--adapter codex/);
});
