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
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
  const dryRunOutput = runNpm(["pack", "--json", "--dry-run"], ROOT_DIR);
  const dryRunEntries = JSON.parse(dryRunOutput);
  const latestPack = Array.isArray(dryRunEntries) ? dryRunEntries.at(-1) : dryRunEntries;
  const bundledFiles = (latestPack.files ?? []).map((entry) => entry.path).sort();
  const failures = [];

  assertCondition(packageJson.private === false, "package.json must set private=false.", failures);
  assertCondition(typeof packageJson.bin?.["repo-ai-governor"] === "string", "CLI bin entry is required.", failures);
  assertCondition(Array.isArray(packageJson.files) && packageJson.files.length > 0, "package.json files whitelist is required.", failures);
  assertCondition(typeof packageJson.scripts?.["release:verify-local"] === "string", "release:verify-local script is required.", failures);
  assertCondition(typeof packageJson.scripts?.["release:candidate"] === "string", "release:candidate script is required.", failures);
  assertCondition(bundledFiles.includes("bin/repo-ai-governor.js"), "Packed tarball must include bin/repo-ai-governor.js.", failures);
  assertCondition(bundledFiles.some((entry) => entry.startsWith("src/")), "Packed tarball must include src/ files.", failures);

  const payload = {
    status: failures.length === 0 ? "pass" : "fail",
    packageName: packageJson.name,
    version: packageJson.version,
    private: packageJson.private,
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
