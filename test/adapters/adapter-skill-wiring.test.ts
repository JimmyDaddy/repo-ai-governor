import { test } from "vitest";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

test("Codex adapter docs describe native skill installation plus bundle supplementation", () => {
  const exampleRoot = path.resolve("examples", "adapters", "codex");
  const readme = fs.readFileSync(path.join(exampleRoot, "README.md"), "utf8");
  const acceptance = fs.readFileSync(path.join(exampleRoot, "acceptance.md"), "utf8");

  assert.match(readme, /skills install --surface codex/);
  assert.match(readme, /\.codex\/skills\//);
  assert.match(readme, /bundle 是补充层|补充上下文/);
  assert.match(acceptance, /\.codex\/skills\/governor-context-loader\/SKILL\.md/);
});

test("GitHub Copilot adapter docs describe native skills plus instructions and prompt supplementation", () => {
  const exampleRoot = path.resolve("examples", "adapters", "github-copilot");
  const readme = fs.readFileSync(path.join(exampleRoot, "README.md"), "utf8");
  const acceptance = fs.readFileSync(path.join(exampleRoot, "acceptance.md"), "utf8");

  assert.match(readme, /skills install --surface github-copilot/);
  assert.match(readme, /\.github\/skills\//);
  assert.match(readme, /copilot-instructions/);
  assert.match(readme, /补充规则注入|补充层/);
  assert.match(acceptance, /\.github\/skills\/governor-context-loader\/SKILL\.md/);
});

test("Claude Code adapter docs describe native skills plus prompt supplementation and subagent compatibility", () => {
  const exampleRoot = path.resolve("examples", "adapters", "claude-code");
  const readme = fs.readFileSync(path.join(exampleRoot, "README.md"), "utf8");
  const acceptance = fs.readFileSync(path.join(exampleRoot, "acceptance.md"), "utf8");

  assert.match(readme, /skills install --surface claude-code/);
  assert.match(readme, /\.claude\/skills\//);
  assert.match(readme, /subagent/);
  assert.match(readme, /补充上下文|补充层/);
  assert.match(acceptance, /\.claude\/skills\/governor-context-loader\/SKILL\.md/);
});
