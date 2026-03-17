#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageDir = path.resolve(__dirname, "..");
const isDistBin = path.basename(packageDir) === "dist";
const distCliEntryPath = isDistBin
  ? path.resolve(packageDir, "src", "cli", "index.js")
  : path.resolve(packageDir, "dist", "src", "cli", "index.js");

function findNpmCommand() {
  if (process.env.npm_execpath && fs.existsSync(process.env.npm_execpath)) {
    return [process.execPath, [process.env.npm_execpath]];
  }

  if (fs.existsSync("/opt/homebrew/bin/npm")) {
    return ["/opt/homebrew/bin/npm", []];
  }

  return ["npm", []];
}

function runBuildIfNeeded() {
  if (fs.existsSync(distCliEntryPath)) {
    return;
  }

  if (isDistBin) {
    return;
  }

  const [command, prefixArguments] = findNpmCommand();
  execFileSync(command, [...prefixArguments, "run", "build"], {
    cwd: packageDir,
    stdio: "inherit",
    env: {
      ...process.env,
      PATH: `/opt/homebrew/bin:${process.env.PATH ?? ""}`
    }
  });
}

runBuildIfNeeded();

if (!fs.existsSync(distCliEntryPath)) {
  process.stderr.write(`Unable to resolve CLI entrypoint: ${distCliEntryPath}\n`);
  process.exit(1);
}

// dynamic-import-allowed: runtime entrypoint path is resolved dynamically for source/dist execution
const { runCli } = await import(pathToFileURL(distCliEntryPath).href);

const exitCode = await runCli(process.argv.slice(2));
process.exitCode = exitCode;
