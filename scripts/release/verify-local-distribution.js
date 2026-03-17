#!/usr/bin/env node

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

const ROOT_DIR = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..", "..");
const ROOT_PACKAGE_JSON_PATH = path.join(ROOT_DIR, "package.json");
const ROOT_PACKAGE_JSON = JSON.parse(fs.readFileSync(ROOT_PACKAGE_JSON_PATH, "utf8"));
const EXPECTED_BIN_ENTRY = "./dist/bin/repo-ai-governor.js";

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
    format: argv.includes("--format=json") ? "json" : "summary",
    keepArtifacts: argv.includes("--keep-artifacts")
  };
}

function createTempDir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function removeIfExists(targetPath) {
  if (fs.existsSync(targetPath)) {
    fs.rmSync(targetPath, { recursive: true, force: true });
  }
}

function resolveInstalledPackagePath(installDir, packageName) {
  return path.join(installDir, "node_modules", ...String(packageName).split("/"));
}

function main() {
  const options = parseArguments(process.argv.slice(2));
  const installDir = createTempDir("repo-ai-governor-install-");

  runNpm(["run", "build"], ROOT_DIR);
  const packOutput = runNpm(["pack", "--json", "--pack-destination", installDir], ROOT_DIR);
  const packEntries = JSON.parse(packOutput);
  const latestPack = Array.isArray(packEntries) ? packEntries.at(-1) : packEntries;
  const tarballPath = path.join(installDir, latestPack.filename);

  fs.writeFileSync(
    path.join(installDir, "package.json"),
    JSON.stringify(
      {
        name: "repo-ai-governor-install-smoke",
        version: "1.0.0",
        private: true
      },
      null,
      2
    ),
    "utf8"
  );

  runNpm(["install", tarballPath], installDir);
  const installedPackagePath = resolveInstalledPackagePath(installDir, ROOT_PACKAGE_JSON.name);
  const installedPackageJsonPath = path.join(installedPackagePath, "package.json");
  const installedPackageJson = JSON.parse(fs.readFileSync(installedPackageJsonPath, "utf8"));
  const resolvedBinEntry = installedPackageJson.bin?.["repo-ai-governor"] ?? null;
  const resolvedBinEntryPath =
    typeof resolvedBinEntry === "string"
      ? path.join(installedPackagePath, resolvedBinEntry)
      : null;

  const helpOutput = execFileSync("npx", ["--no-install", "repo-ai-governor", "--help"], {
    cwd: installDir,
    encoding: "utf8",
    env: {
      ...process.env,
      PATH: `/opt/homebrew/bin:${process.env.PATH ?? ""}`
    }
  });
  const versionOutput = execFileSync("npx", ["--no-install", "repo-ai-governor", "--version"], {
    cwd: installDir,
    encoding: "utf8",
    env: {
      ...process.env,
      PATH: `/opt/homebrew/bin:${process.env.PATH ?? ""}`
    }
  });

  const checks = {
    help: /repo-ai-governor/.test(helpOutput),
    version: /\d+\.\d+\.\d+/.test(versionOutput),
    distEntrypoint:
      resolvedBinEntry === EXPECTED_BIN_ENTRY &&
      resolvedBinEntryPath !== null &&
      fs.existsSync(resolvedBinEntryPath)
  };
  const failedChecks = Object.entries(checks)
    .filter(([, passed]) => !passed)
    .map(([name]) => name);

  const payload = {
    status: failedChecks.length === 0 ? "pass" : "fail",
    tarball: latestPack.filename,
    installDir,
    installedPackagePath,
    binEntry: resolvedBinEntry,
    expectedBinEntry: EXPECTED_BIN_ENTRY,
    checks,
    failedChecks
  };

  if (!options.keepArtifacts) {
    removeIfExists(installDir);
    removeIfExists(tarballPath);
  }

  if (options.format === "json") {
    process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
    return;
  }

  process.stdout.write(
    [
      "local-distribution-check",
      `status=${payload.status}`,
      `tarball=${payload.tarball}`,
      `help=${payload.checks.help}`,
      `version=${payload.checks.version}`,
      `distEntrypoint=${payload.checks.distEntrypoint}`
    ].join("\n") + "\n"
  );

  if (payload.status !== "pass") {
    process.exitCode = 1;
  }
}

main();
