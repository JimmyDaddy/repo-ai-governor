import { test } from "vitest";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const skillDir = path.resolve(".codex/skills/workspace-delivery-finisher");
const skillFile = path.join(skillDir, "SKILL.md");
const openAiConfigFile = path.join(skillDir, "agents/openai.yaml");

function readFile(filePath: string) {
  return fs.readFileSync(filePath, "utf8");
}

function extractFrontmatter(markdown: string) {
  const match = markdown.match(/^---\n([\s\S]+?)\n---\n/);
  assert.ok(match, "SKILL.md should contain YAML frontmatter");
  return match[1];
}

test("workspace delivery skill contains valid repository-specific triggers", () => {
  assert.ok(fs.existsSync(skillFile), "SKILL.md should exist");

  const content = readFile(skillFile);
  const frontmatter = extractFrontmatter(content);

  assert.match(frontmatter, /^name:\s+workspace-delivery-finisher$/m);
  assert.match(frontmatter, /^description:\s+.+$/m);
  assert.doesNotMatch(content, /\[TODO:/);
  assert.match(content, /"收尾"/);
  assert.match(content, /"提交并推送"/);
  assert.match(content, /"收尾并推送"/);
  assert.match(content, /npm run check/);
  assert.match(content, /git commit -m/);
});

test("workspace delivery agent metadata is present and references the skill", () => {
  assert.ok(fs.existsSync(openAiConfigFile), "agents/openai.yaml should exist");

  const content = readFile(openAiConfigFile);

  assert.match(content, /display_name:\s+"Workspace Delivery"/);
  assert.match(content, /short_description:\s+"Run gates, commit, and optionally push"/);
  assert.match(content, /default_prompt:\s+"Use \$workspace-delivery-finisher/);
});
