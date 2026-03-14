#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const ROOT_DIR = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..", "..");

function findNpmCommand() {
  if (process.env.npm_execpath && fs.existsSync(process.env.npm_execpath)) {
    return [process.execPath, [process.env.npm_execpath]];
  }

  if (fs.existsSync("/opt/homebrew/bin/npm")) {
    return ["/opt/homebrew/bin/npm", []];
  }

  return ["npm", []];
}

function runNpm(argumentsList, cwd) {
  const [command, prefixArguments] = findNpmCommand();
  return execFileSync(command, [...prefixArguments, ...argumentsList], {
    cwd,
    encoding: "utf8",
    env: {
      ...process.env,
      PATH: `/opt/homebrew/bin:${process.env.PATH ?? ""}`
    }
  });
}

function parseArguments(argv) {
  return {
    format: argv.includes("--format=json") ? "json" : "summary"
  };
}

function assertCondition(condition, message, failures) {
  if (!condition) {
    failures.push(message);
  }
}

function main() {
  const options = parseArguments(process.argv.slice(2));
  const packageJsonPath = path.join(ROOT_DIR, "package.json");
  const changelogPath = path.join(ROOT_DIR, "CHANGELOG.md");
  const changelogZhPath = path.join(ROOT_DIR, "CHANGELOG.zh-CN.md");
  const readmePath = path.join(ROOT_DIR, "README.md");
  const readmeZhPath = path.join(ROOT_DIR, "README.zh-CN.md");
  const remoteWorkflowPath = path.join(ROOT_DIR, ".github", "workflows", "release-ga.yml");
  const releaseNotesScriptPath = path.join(ROOT_DIR, "scripts", "release", "render-release-notes.js");
  const gettingStartedScriptPath = path.join(ROOT_DIR, "scripts", "release", "run-getting-started-check.sh");
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
  const dryRunOutput = runNpm(["pack", "--json", "--dry-run"], ROOT_DIR);
  const dryRunEntries = JSON.parse(dryRunOutput);
  const latestPack = Array.isArray(dryRunEntries) ? dryRunEntries.at(-1) : dryRunEntries;
  const bundledFiles = (latestPack.files ?? []).map((entry) => entry.path).sort();
  const failures = [];
  const semverPattern = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;
  const changelogExists = fs.existsSync(changelogPath);
  const changelogZhExists = fs.existsSync(changelogZhPath);
  const readmeExists = fs.existsSync(readmePath);
  const readmeZhExists = fs.existsSync(readmeZhPath);
  const remoteWorkflowExists = fs.existsSync(remoteWorkflowPath);
  const releaseNotesScriptExists = fs.existsSync(releaseNotesScriptPath);
  const gettingStartedScriptExists = fs.existsSync(gettingStartedScriptPath);
  const publishAccess = packageJson.publishConfig?.access ?? null;
  const requiredChecks = [
    "npm run check",
    "npm run release:check",
    "npm run release:verify-local"
  ];
  const manualChecks = [
    "确认 CHANGELOG.md / CHANGELOG.zh-CN.md 已更新并包含本次发布说明",
    "确认 README.md / README.zh-CN.md 与当前 CLI 能力一致",
    "确认升级说明、破坏性变更和人工确认项已记录",
    "确认 npm 发布凭据和远端 release 前置条件可用"
  ];

  assertCondition(packageJson.private === false, "package.json must set private=false.", failures);
  assertCondition(typeof packageJson.bin?.["repo-ai-governor"] === "string", "CLI bin entry is required.", failures);
  assertCondition(Array.isArray(packageJson.files) && packageJson.files.length > 0, "package.json files whitelist is required.", failures);
  assertCondition(typeof packageJson.scripts?.["release:verify-local"] === "string", "release:verify-local script is required.", failures);
  assertCondition(typeof packageJson.scripts?.["release:candidate"] === "string", "release:candidate script is required.", failures);
  assertCondition(typeof packageJson.scripts?.["release:ga-check"] === "string", "release:ga-check script is required.", failures);
  assertCondition(typeof packageJson.license === "string" && packageJson.license.length > 0, "package.json license is required.", failures);
  assertCondition(semverPattern.test(packageJson.version), "package.json version must follow semver.", failures);
  assertCondition(publishAccess === "public", "publishConfig.access must be public.", failures);
  assertCondition(changelogExists, "CHANGELOG.md is required for GA release readiness.", failures);
  assertCondition(changelogZhExists, "CHANGELOG.zh-CN.md is required for GA release readiness.", failures);
  assertCondition(readmeExists, "README.md is required for GA release readiness.", failures);
  assertCondition(readmeZhExists, "README.zh-CN.md is required for GA release readiness.", failures);
  assertCondition(remoteWorkflowExists, ".github/workflows/release-ga.yml is required for GA release readiness.", failures);
  assertCondition(releaseNotesScriptExists, "scripts/release/render-release-notes.js is required for GA release readiness.", failures);
  assertCondition(gettingStartedScriptExists, "scripts/release/run-getting-started-check.sh is required for GA release readiness.", failures);
  assertCondition(bundledFiles.includes("bin/repo-ai-governor.js"), "Packed tarball must include bin/repo-ai-governor.js.", failures);
  assertCondition(bundledFiles.some((entry) => entry.startsWith("src/")), "Packed tarball must include src/ files.", failures);

  const payload = {
    status: failures.length === 0 ? "pass" : "fail",
    packageName: packageJson.name,
    version: packageJson.version,
    private: packageJson.private,
    publishAccess,
    changelogExists,
    changelogZhExists,
    readmeExists,
    readmeZhExists,
    remoteWorkflowExists,
    releaseNotesScriptExists,
    gettingStartedScriptExists,
    requiredChecks,
    manualChecks,
    tarball: latestPack.filename,
    bundledFiles
  };

  if (options.format === "json") {
    process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
  } else {
    process.stdout.write(
      [
        "release-check",
        `status=${payload.status}`,
        `package=${payload.packageName}`,
        `version=${payload.version}`,
        `publishAccess=${payload.publishAccess}`,
        `changelog=${payload.changelogExists}`,
        `changelogZh=${payload.changelogZhExists}`,
        `readme=${payload.readmeExists}`,
        `readmeZh=${payload.readmeZhExists}`,
        `remoteWorkflow=${payload.remoteWorkflowExists}`,
        `releaseNotesScript=${payload.releaseNotesScriptExists}`,
        `gettingStartedScript=${payload.gettingStartedScriptExists}`,
        `tarball=${payload.tarball}`
      ].join("\n") + "\n"
    );
  }

  if (failures.length > 0) {
    for (const failure of failures) {
      process.stderr.write(`${failure}\n`);
    }

    process.exitCode = 1;
  }
}

main();
