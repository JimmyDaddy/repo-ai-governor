import { test } from "vitest";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import YAML from "yaml";
import { runCli } from "../../src/cli/index.js";
import { EXIT_CODES } from "../../src/cli/runtime/exit-codes.js";
import {
  buildGitHubCopilotAdapterBundle,
  renderGitHubCopilotAdapterBundle
} from "../../src/adapters/github-copilot-bundle.js";

type BufferedStream = {
  isTTY: boolean;
  write: (chunk: unknown) => boolean;
  toString: () => string;
};

function createTempRepo() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "repo-ai-governor-copilot-"));
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
    }
  };
}

async function runCommand(argv: string[]) {
  const stdout = createBufferedStream();
  const stderr = createBufferedStream();
  const exitCode = await runCli(argv, { stdout, stderr });

  return {
    exitCode,
    stdout: stdout.toString(),
    stderr: stderr.toString()
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
    "github-copilot",
    "--format",
    "json"
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
    "Render GitHub Copilot adapter bundle",
    "--format",
    "json"
  ]);

  assert.equal(planResult.exitCode, EXIT_CODES.success);
}

test("GitHub Copilot bundle renders instructions and CLI prompt for the current sprint", async () => {
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
      '    zh-CN: 文档插槽',
      '    en-US: Documentation Slot',
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
      "      promptKey: documentation-output-checklist"
    ].join("\n"),
    "utf8"
  );

  const bundle = buildGitHubCopilotAdapterBundle({
    cwd,
    project: "demo",
    sprint: "sprint-001",
    command: "plan",
    stageId: "plan"
  });

  assert.equal(bundle.adapter.id, "github-copilot");
  assert.deepEqual(bundle.adapter.products, ["github-copilot", "github-copilot-cli"]);
  const references = bundle.references;
  assert.ok(references);
  assert.equal(references.agentEntryPath, "AGENTS.md");
  assert.equal(references.currentContextPath, ".repo-ai-governor/context/current-context.md");
  assert.equal(bundle.files.ideInstructions.path, ".github/copilot-instructions.md");
  assert.equal(bundle.files.cliPrompt.path, ".repo-ai-governor/templates/github-copilot-cli.prompt.md");
  assert.ok(bundle.standards.rules.length > 0);
  assert.deepEqual(bundle.slots.active.map((slot) => slot.id), ["docs-slot"]);

  const instructions = renderGitHubCopilotAdapterBundle(bundle, "copilot-instructions");
  assert.match(instructions, /# GitHub Copilot Instructions/);
  assert.match(instructions, /AGENTS\.md/);
  assert.match(instructions, /documentation-output-checklist/);

  const cliPrompt = renderGitHubCopilotAdapterBundle(bundle, "copilot-cli-prompt");
  assert.match(cliPrompt, /# GitHub Copilot CLI Prompt/);
  assert.match(cliPrompt, /Follow this workflow order/);

  const markdown = renderGitHubCopilotAdapterBundle(bundle, "markdown");
  assert.match(markdown, /# GitHub Copilot Governance Bundle/);
  assert.match(markdown, /IDE Instructions Output: `.github\/copilot-instructions\.md`/);
});

test("GitHub Copilot bundle rendering script prints instructions for a bootstrapped repository", async () => {
  const cwd = createTempRepo();
  await bootstrapRepo(cwd);

  const output = execFileSync(
    process.execPath,
    [
      "./scripts/examples/render-github-copilot-adapter-bundle.js",
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
      "--format",
      "copilot-instructions"
    ],
    {
      cwd: path.resolve("."),
      encoding: "utf8"
    }
  );

  assert.match(output, /# GitHub Copilot Instructions/);
  assert.match(output, /Project: `demo`/);
});

test("GitHub Copilot adapter example assets document the integration and acceptance path", () => {
  const exampleRoot = path.resolve("examples", "adapters", "github-copilot");
  const readme = fs.readFileSync(path.join(exampleRoot, "README.md"), "utf8");
  const acceptance = fs.readFileSync(path.join(exampleRoot, "acceptance.md"), "utf8");

  assert.match(readme, /render-github-copilot-adapter-bundle\.js/);
  assert.match(readme, /\.github\/copilot-instructions\.md/);
  assert.match(acceptance, /GitHub Copilot Adapter Acceptance/);
  assert.match(acceptance, /--adapter github-copilot/);
});
