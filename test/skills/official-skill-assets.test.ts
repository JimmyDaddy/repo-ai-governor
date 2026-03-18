import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "vitest";
import { loadOfficialSkillCatalog } from "../../src/skills/catalog.js";

const EXPECTED_SKILL_IDS = [
  "governor-context-loader",
  "governor-plan-runner",
  "governor-task-implementer",
  "governor-delivery-finisher",
];

test("official skill catalog loads the first-party skill manifests", () => {
  const catalogState = loadOfficialSkillCatalog({ cwd: process.cwd() });
  const skillIds = catalogState.skills.map((skill) => skill.id);

  assert.deepEqual(skillIds, EXPECTED_SKILL_IDS);

  for (const skill of catalogState.skills) {
    assert.equal(fs.existsSync(skill.manifestPath), true);
    assert.equal(fs.existsSync(skill.skillFilePath), true);
    assert.deepEqual(skill.manifest.surfaces, ["codex", "github-copilot", "claude-code"]);

    for (const agentFile of skill.manifest.entry.agentFiles) {
      assert.equal(fs.existsSync(path.resolve(skill.skillRoot, agentFile)), true);
    }
  }
});

test("governor-plan-runner exposes a script-assisted request draft flow", () => {
  const catalogState = loadOfficialSkillCatalog({ cwd: process.cwd() });
  const planRunner = catalogState.skills.find((skill) => skill.id === "governor-plan-runner");
  assert.ok(planRunner);
  const scriptPath = path.resolve(planRunner.skillRoot, "scripts", "create-request-draft.js");
  const templatePath = path.resolve(planRunner.skillRoot, "templates", "request-draft.md");
  const skillBody = fs.readFileSync(planRunner.skillFilePath, "utf8");
  const templateBody = fs.readFileSync(templatePath, "utf8");

  assert.equal(fs.existsSync(scriptPath), true);
  assert.equal(fs.existsSync(templatePath), true);
  assert.match(skillBody, /Script-Assisted Mode/);
  assert.match(templateBody, /TODO_AI_FILL: summary/);
  assert.match(templateBody, /TODO_AI_FILL: acceptance/);
});
