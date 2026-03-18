import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "vitest";

type AnyRecord = Record<string, any>;

const ROOT_DIR = path.resolve(".");
const SCRIPT_PATH = path.join(ROOT_DIR, "scripts", "governance", "check-docs-triad-sync.js");

function createTempWorkspace() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "repo-ai-governor-docs-triad-"));
}

function writeTriadDocs(
  workspace: string,
  options: {
    prdDate?: string;
    solutionDate?: string;
    architectureDate?: string;
    briefDate?: string;
  } = {},
) {
  const prdDate = options.prdDate ?? "2026-03-19";
  const solutionDate = options.solutionDate ?? prdDate;
  const architectureDate = options.architectureDate ?? prdDate;
  const briefDate = options.briefDate ?? prdDate;
  const docsRoot = path.join(workspace, "docs");

  fs.mkdirSync(docsRoot, { recursive: true });
  fs.writeFileSync(
    path.join(docsRoot, "product-requirements.md"),
    `# PRD\n\n- 日期：${prdDate}\n\n## Body\n`,
    "utf8",
  );
  fs.writeFileSync(
    path.join(docsRoot, "repo-ai-governor-overall-technical-solution.md"),
    `# Solution\n\n- Date: ${solutionDate}\n\n## Body\n`,
    "utf8",
  );
  fs.writeFileSync(
    path.join(docsRoot, "repo-ai-governor-architecture-and-repo-layering.md"),
    `# Architecture\n\n- Date: ${architectureDate}\n\n## Body\n`,
    "utf8",
  );
  fs.writeFileSync(
    path.join(docsRoot, "product-requirements-brief.md"),
    `# Brief PRD\n\n- 日期：${briefDate}\n\n## Body\n`,
    "utf8",
  );
}

function initGitWorkspace(workspace: string) {
  execFileSync("git", ["init"], { cwd: workspace, stdio: "ignore" });
  execFileSync("git", ["config", "user.name", "repo-ai-governor-test"], {
    cwd: workspace,
    stdio: "ignore",
  });
  execFileSync("git", ["config", "user.email", "repo-ai-governor-test@example.com"], {
    cwd: workspace,
    stdio: "ignore",
  });
  execFileSync("git", ["add", "."], { cwd: workspace, stdio: "ignore" });
  execFileSync("git", ["commit", "-m", "chore: init triad docs"], {
    cwd: workspace,
    stdio: "ignore",
  });
}

function runTriadGate(workspace: string) {
  const result = spawnSync(process.execPath, [SCRIPT_PATH, "--cwd", workspace, "--format=json"], {
    encoding: "utf8",
  });
  const payload = JSON.parse(String(result.stdout ?? "{}"));

  return {
    result,
    payload,
  };
}

function appendLine(filePath: string, line: string) {
  fs.appendFileSync(filePath, `${line}\n`, "utf8");
}

test("docs triad sync gate passes when dates are aligned and working tree is clean", () => {
  const workspace = createTempWorkspace();
  writeTriadDocs(workspace);
  initGitWorkspace(workspace);

  try {
    const { result, payload } = runTriadGate(workspace);

    assert.equal(result.status, 0);
    assert.equal(payload.status, "pass");
    assert.equal(payload.triad.date, "2026-03-19");
    assert.deepEqual(payload.failures, []);
  } finally {
    fs.rmSync(workspace, { recursive: true, force: true });
  }
});

test("docs triad sync gate fails when triad dates are not synchronized", () => {
  const workspace = createTempWorkspace();
  writeTriadDocs(workspace, {
    architectureDate: "2026-03-18",
  });
  initGitWorkspace(workspace);

  try {
    const { result, payload } = runTriadGate(workspace);

    assert.equal(result.status, 1);
    assert.equal(payload.status, "fail");
    assert.equal(
      payload.failures.some((failure: AnyRecord) => failure.code === "docs.triad_date_mismatch"),
      true,
    );
  } finally {
    fs.rmSync(workspace, { recursive: true, force: true });
  }
});

test("docs triad sync gate fails when only one triad document changes", () => {
  const workspace = createTempWorkspace();
  writeTriadDocs(workspace);
  initGitWorkspace(workspace);
  appendLine(
    path.join(workspace, "docs", "repo-ai-governor-architecture-and-repo-layering.md"),
    "changed",
  );

  try {
    const { result, payload } = runTriadGate(workspace);

    assert.equal(result.status, 1);
    assert.equal(payload.status, "fail");
    assert.equal(
      payload.failures.some((failure: AnyRecord) => failure.code === "docs.triad_partial_change"),
      true,
    );
  } finally {
    fs.rmSync(workspace, { recursive: true, force: true });
  }
});

test("docs triad sync gate passes when triad files and brief PRD change together", () => {
  const workspace = createTempWorkspace();
  writeTriadDocs(workspace);
  initGitWorkspace(workspace);
  appendLine(path.join(workspace, "docs", "product-requirements.md"), "changed");
  appendLine(
    path.join(workspace, "docs", "repo-ai-governor-overall-technical-solution.md"),
    "changed",
  );
  appendLine(
    path.join(workspace, "docs", "repo-ai-governor-architecture-and-repo-layering.md"),
    "changed",
  );
  appendLine(path.join(workspace, "docs", "product-requirements-brief.md"), "changed");

  try {
    const { result, payload } = runTriadGate(workspace);

    assert.equal(result.status, 0);
    assert.equal(payload.status, "pass");
    assert.equal(payload.workingTree.changedTriadFiles.length, 3);
    assert.equal(payload.workingTree.changedBriefFile, true);
  } finally {
    fs.rmSync(workspace, { recursive: true, force: true });
  }
});

test("docs triad sync gate fails when PRD changes but brief PRD does not change", () => {
  const workspace = createTempWorkspace();
  writeTriadDocs(workspace);
  initGitWorkspace(workspace);
  appendLine(path.join(workspace, "docs", "product-requirements.md"), "changed");
  appendLine(
    path.join(workspace, "docs", "repo-ai-governor-overall-technical-solution.md"),
    "changed",
  );
  appendLine(
    path.join(workspace, "docs", "repo-ai-governor-architecture-and-repo-layering.md"),
    "changed",
  );

  try {
    const { result, payload } = runTriadGate(workspace);

    assert.equal(result.status, 1);
    assert.equal(payload.status, "fail");
    assert.equal(
      payload.failures.some((failure: AnyRecord) => failure.code === "docs.prd_without_brief_sync"),
      true,
    );
  } finally {
    fs.rmSync(workspace, { recursive: true, force: true });
  }
});
