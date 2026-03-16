import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { runCli } from "../../src/cli/index.js";
import { EXIT_CODES } from "../../src/cli/runtime/exit-codes.js";

function createTempRepo() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "repo-ai-governor-skills-"));
}

function createBufferedStream() {
  const chunks = [];

  return {
    isTTY: false,
    write(chunk) {
      chunks.push(String(chunk));
      return true;
    },
    toString() {
      return chunks.join("");
    }
  };
}

async function runCommand(argv) {
  const stdout = createBufferedStream();
  const stderr = createBufferedStream();
  const exitCode = await runCli(argv, { stdout, stderr });

  return {
    exitCode,
    stdout: stdout.toString(),
    stderr: stderr.toString()
  };
}

function createMockCatalog(cwd) {
  const officialRoot = path.join(cwd, "skills", "official");
  const skillId = "governor-context-loader";
  const skillRoot = path.join(officialRoot, skillId);
  const manifestPath = path.join(skillRoot, "skill.json");
  const catalogPath = path.join(officialRoot, "catalog.json");

  fs.mkdirSync(skillRoot, { recursive: true });
  fs.writeFileSync(
    path.join(skillRoot, "SKILL.md"),
    [
      "---",
      "name: governor-context-loader",
      "description: Load AGENTS.md and current context before other actions.",
      "---",
      "",
      "# Governor Context Loader"
    ].join("\n"),
    "utf8"
  );
  fs.writeFileSync(
    manifestPath,
    JSON.stringify(
      {
        schemaVersion: "1",
        id: skillId,
        version: "0.1.0",
        kind: "governor-skill",
        displayName: "Governor Context Loader",
        description: "Load repository entry files before executing workflow skills.",
        entry: {
          skillFile: "SKILL.md",
          agentFiles: [],
          scriptsDir: "scripts",
          templatesDir: "templates",
          referencesDir: "references"
        },
        triggers: {
          keywords: ["load context"],
          intents: ["read context"]
        },
        compatibility: {
          repoAiGovernor: "^0.1.0",
          installModes: {
            codex: "native",
            "github-copilot": "native",
            "claude-code": "native"
          }
        },
        distribution: {
          channel: "official",
          root: `skills/official/${skillId}`
        },
        surfaces: ["codex", "github-copilot", "claude-code"]
      },
      null,
      2
    ),
    "utf8"
  );
  fs.writeFileSync(
    catalogPath,
    JSON.stringify(
      {
        schemaVersion: "1",
        id: "repo-ai-governor-official",
        version: "0.1.0",
        kind: "skill-catalog",
        packageRoot: "skills",
        officialRoot: "skills/official",
        sharedRoot: "skills/shared",
        compatibility: {
          repoAiGovernor: "^0.1.0"
        },
        installTargets: {
          codex: {
            repoLocal: ".codex/skills",
            userLocal: "$CODEX_HOME/skills",
            mode: "native"
          },
          "github-copilot": {
            repoLocal: ".github/skills",
            userLocal: "$HOME/.copilot/skills",
            mode: "hybrid"
          },
          "claude-code": {
            repoLocal: ".claude/skills",
            userLocal: "$HOME/.claude/skills",
            mode: "native"
          }
        },
        skills: [
          {
            id: skillId,
            manifestPath: `skills/official/${skillId}/skill.json`,
            surfaces: ["codex", "github-copilot", "claude-code"],
            defaultInstallMode: "native"
          }
        ]
      },
      null,
      2
    ),
    "utf8"
  );

  return {
    catalogPath,
    skillId
  };
}

test("skills list reports available skills from catalog", async () => {
  const cwd = createTempRepo();
  const { catalogPath, skillId } = createMockCatalog(cwd);

  const result = await runCommand([
    "skills",
    "list",
    "--cwd",
    cwd,
    "--catalog",
    catalogPath,
    "--format",
    "json"
  ]);
  const payload = JSON.parse(result.stdout);

  assert.equal(result.exitCode, EXIT_CODES.success);
  assert.equal(payload.status, "listed");
  assert.equal(payload.summary.available, 1);
  assert.equal(payload.availableSkills[0].id, skillId);
  assert.equal(payload.installedSkills.length, 0);
});

test("skills install copies official skills into repo-local target", async () => {
  const cwd = createTempRepo();
  const { catalogPath, skillId } = createMockCatalog(cwd);

  const result = await runCommand([
    "skills",
    "install",
    "--cwd",
    cwd,
    "--catalog",
    catalogPath,
    "--surface",
    "codex",
    "--format",
    "json"
  ]);
  const payload = JSON.parse(result.stdout);
  const installedSkillRoot = path.join(cwd, ".codex", "skills", skillId);

  assert.equal(result.exitCode, EXIT_CODES.success);
  assert.equal(payload.status, "installed");
  assert.equal(payload.summary.installed, 1);
  assert.equal(fs.existsSync(path.join(installedSkillRoot, "SKILL.md")), true);
  assert.equal(fs.existsSync(path.join(installedSkillRoot, "skill.json")), true);
});

test("skills doctor passes for a valid installed skill", async () => {
  const cwd = createTempRepo();
  const { catalogPath } = createMockCatalog(cwd);

  await runCommand([
    "skills",
    "install",
    "--cwd",
    cwd,
    "--catalog",
    catalogPath,
    "--surface",
    "codex",
    "--format",
    "json"
  ]);

  const result = await runCommand([
    "skills",
    "doctor",
    "--cwd",
    cwd,
    "--catalog",
    catalogPath,
    "--surface",
    "codex",
    "--format",
    "json"
  ]);
  const payload = JSON.parse(result.stdout);

  assert.equal(result.exitCode, EXIT_CODES.success);
  assert.equal(payload.status, "pass");
  assert.equal(payload.summary.errors, 0);
  assert.equal(payload.summary.warnings, 0);
});

test("skills doctor fails when installed skill structure is broken", async () => {
  const cwd = createTempRepo();
  const { catalogPath, skillId } = createMockCatalog(cwd);

  await runCommand([
    "skills",
    "install",
    "--cwd",
    cwd,
    "--catalog",
    catalogPath,
    "--surface",
    "codex",
    "--format",
    "json"
  ]);

  fs.rmSync(path.join(cwd, ".codex", "skills", skillId, "SKILL.md"));

  const result = await runCommand([
    "skills",
    "doctor",
    "--cwd",
    cwd,
    "--catalog",
    catalogPath,
    "--surface",
    "codex",
    "--format",
    "json"
  ]);
  const payload = JSON.parse(result.stdout);

  assert.equal(result.exitCode, EXIT_CODES.businessCheckFailed);
  assert.equal(payload.status, "fail");
  assert.equal(payload.summary.errors, 1);
  assert.match(result.stderr, /skills doctor found blocking issues/);
});
