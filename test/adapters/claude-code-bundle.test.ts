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
  buildClaudeCodeAdapterBundle,
  renderClaudeCodeAdapterBundle
} from "../../src/adapters/claude-code-bundle.js";

type BufferedStream = {
  isTTY: boolean;
  write: (chunk: unknown) => boolean;
  toString: () => string;
};

function createTempRepo() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "repo-ai-governor-claude-"));
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
    "claude-code",
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
    "Render Claude Code adapter bundle",
    "--format",
    "json"
  ]);

  assert.equal(planResult.exitCode, EXIT_CODES.success);
}

test("Claude Code bundle renders system and task prompts for the current sprint", async () => {
  const cwd = createTempRepo();
  await bootstrapRepo(cwd);

  const configFilePath = path.join(cwd, ".repo-ai-governor/governor.yaml");
  const config = YAML.parse(fs.readFileSync(configFilePath, "utf8"));
  config.slots.enabled = ["security-slot"];
  fs.writeFileSync(configFilePath, YAML.stringify(config), "utf8");

  fs.mkdirSync(path.join(cwd, ".repo-ai-governor/slots"), { recursive: true });
  fs.writeFileSync(
    path.join(cwd, ".repo-ai-governor/slots/security-slot.yaml"),
    [
      "id: security-slot",
      'version: "1"',
      "kind: governance-slot",
      "meta:",
      "  owner: platform",
      "  source: official",
      "  slotType: security-compliance",
      "  name:",
      '    zh-CN: 安全复核插槽',
      '    en-US: Security Review Slot',
      "trigger:",
      "  match: all",
      "  when:",
      "    stages:",
      "      - review",
      "    commands:",
      "      - review",
      "behavior:",
      "  priority: 220",
      "  conflictPolicy: merge",
      "  inject:",
      "    ai:",
      "      promptKey: security-review-focus"
    ].join("\n"),
    "utf8"
  );

  const bundle = buildClaudeCodeAdapterBundle({
    cwd,
    project: "demo",
    sprint: "sprint-001",
    command: "review",
    stageId: "review"
  });

  assert.equal(bundle.adapter.id, "claude-code");
  assert.deepEqual(bundle.adapter.products, ["claude-code"]);
  const entry = bundle.entry;
  assert.ok(entry);
  assert.equal(entry.agentEntry.path, "AGENTS.md");
  assert.equal(entry.currentContext.path, ".repo-ai-governor/context/current-context.md");
  assert.equal(bundle.files.systemPrompt.path, ".repo-ai-governor/templates/claude-code-system.prompt.md");
  assert.equal(bundle.files.taskPrompt.path, ".repo-ai-governor/templates/claude-code-task.prompt.md");
  assert.ok(entry.agentEntry.excerpt);
  assert.deepEqual(bundle.slots.active.map((slot) => slot.id), ["security-slot"]);

  const systemPrompt = renderClaudeCodeAdapterBundle(bundle, "system-prompt");
  assert.match(systemPrompt, /# Claude Code System Prompt/);
  assert.match(systemPrompt, /security-review-focus/);
  assert.match(systemPrompt, /AGENTS\.md/);

  const taskPrompt = renderClaudeCodeAdapterBundle(bundle, "task-prompt");
  assert.match(taskPrompt, /# Claude Code Task Prompt/);
  assert.match(taskPrompt, /Command: `review`/);

  const markdown = renderClaudeCodeAdapterBundle(bundle, "markdown");
  assert.match(markdown, /# Claude Code Governance Bundle/);
  assert.match(markdown, /AGENTS Entry Excerpt/);
});

test("Claude Code bundle rendering script prints the system prompt for a bootstrapped repository", async () => {
  const cwd = createTempRepo();
  await bootstrapRepo(cwd);

  const output = execFileSync(
    process.execPath,
    [
      "./scripts/examples/render-claude-code-adapter-bundle.js",
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
      "system-prompt"
    ],
    {
      cwd: path.resolve("."),
      encoding: "utf8"
    }
  );

  assert.match(output, /# Claude Code System Prompt/);
  assert.match(output, /Project: `demo`/);
});

test("Claude Code adapter example assets document the integration and acceptance path", () => {
  const exampleRoot = path.resolve("examples", "adapters", "claude-code");
  const readme = fs.readFileSync(path.join(exampleRoot, "README.md"), "utf8");
  const acceptance = fs.readFileSync(path.join(exampleRoot, "acceptance.md"), "utf8");

  assert.match(readme, /render-claude-code-adapter-bundle\.js/);
  assert.match(readme, /claude-code-system\.prompt\.md/);
  assert.match(acceptance, /Claude Code Adapter Acceptance/);
  assert.match(acceptance, /--adapter claude-code/);
});
