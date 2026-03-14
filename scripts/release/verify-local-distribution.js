#!/usr/bin/env node

import fs from "node:fs";
import os from "node:os";
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

function main() {
  const options = parseArguments(process.argv.slice(2));
  const packOutput = runNpm(["pack", "--json"], ROOT_DIR);
  const packEntries = JSON.parse(packOutput);
  const latestPack = Array.isArray(packEntries) ? packEntries.at(-1) : packEntries;
  const tarballPath = path.join(ROOT_DIR, latestPack.filename);
  const installDir = createTempDir("repo-ai-governor-install-");

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

  const payload = {
    status: "pass",
    tarball: latestPack.filename,
    installDir,
    checks: {
      help: /repo-ai-governor/.test(helpOutput),
      version: /\d+\.\d+\.\d+/.test(versionOutput)
    }
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
      `version=${payload.checks.version}`
    ].join("\n") + "\n"
  );
}

main();
