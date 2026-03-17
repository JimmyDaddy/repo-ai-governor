import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..", "..");
let didAttemptBuild = false;

function findNpmCommand() {
  if (process.env.npm_execpath && fs.existsSync(process.env.npm_execpath)) {
    return [process.execPath, [process.env.npm_execpath]];
  }

  if (fs.existsSync("/opt/homebrew/bin/npm")) {
    return ["/opt/homebrew/bin/npm", []];
  }

  return ["npm", []];
}

function runBuildOnce() {
  if (didAttemptBuild) {
    return;
  }

  didAttemptBuild = true;
  const [command, prefixArguments] = findNpmCommand();
  execFileSync(command, [...prefixArguments, "run", "build"], {
    cwd: ROOT_DIR,
    stdio: "inherit",
    env: {
      ...process.env,
      PATH: `/opt/homebrew/bin:${process.env.PATH ?? ""}`
    }
  });
}

export async function importDistModule(relativeModulePath) {
  const distModulePath = path.resolve(ROOT_DIR, "dist", relativeModulePath);

  if (!fs.existsSync(distModulePath)) {
    runBuildOnce();
  }

  if (!fs.existsSync(distModulePath)) {
    throw new Error(`Unable to resolve dist module: ${distModulePath}`);
  }

  // dynamic-import-allowed: example loader resolves dist module path at runtime for adapter demos
  return import(pathToFileURL(distModulePath).href);
}
