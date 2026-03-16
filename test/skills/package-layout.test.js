import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import {
  DEFAULT_SKILL_INSTALL_TARGETS,
  DEFAULT_SKILL_PACKAGE_LAYOUT,
  normalizeSkillId,
  resolveSkillPackageLayout
} from "../../src/skills/package-layout.js";

test("resolveSkillPackageLayout exposes bundled roots and install targets", () => {
  const layout = resolveSkillPackageLayout({
    cwd: "/workspace/repo-ai-governor"
  });

  assert.equal(layout.relative.bundledRoot, "skills");
  assert.equal(layout.relative.officialRoot, "skills/official");
  assert.equal(layout.relative.sharedRoot, "skills/shared");
  assert.equal(layout.relative.catalogFile, "skills/official/catalog.json");
  assert.equal(layout.absolute.catalogFile, "/workspace/repo-ai-governor/skills/official/catalog.json");
  assert.equal(layout.installTargets.codex.repoLocal, ".codex/skills");
  assert.equal(layout.installTargets["github-copilot"].mode, "hybrid");
  assert.equal(layout.installTargets["claude-code"].userLocal, "$HOME/.claude/skills");
});

test("resolveSkillPackageLayout can compute per-skill paths", () => {
  const layout = resolveSkillPackageLayout({
    cwd: "/workspace/repo-ai-governor",
    skillId: "Governor Plan Runner"
  });

  assert.equal(normalizeSkillId("Governor Plan Runner"), "governor-plan-runner");
  assert.equal(layout.relative.skillRoot, "skills/official/governor-plan-runner");
  assert.equal(layout.relative.skillFile, "skills/official/governor-plan-runner/SKILL.md");
  assert.equal(layout.relative.manifestFile, "skills/official/governor-plan-runner/skill.json");
  assert.equal(
    layout.relative.templatesDir,
    "skills/official/governor-plan-runner/templates"
  );
  assert.equal(
    layout.absolute.referencesDir,
    path.join("/workspace/repo-ai-governor", "skills/official/governor-plan-runner/references")
  );
});

test("skill package constants expose stable distribution defaults", () => {
  assert.equal(DEFAULT_SKILL_PACKAGE_LAYOUT.manifestFileName, "skill.json");
  assert.deepEqual(Object.keys(DEFAULT_SKILL_INSTALL_TARGETS), [
    "codex",
    "github-copilot",
    "claude-code"
  ]);
});
