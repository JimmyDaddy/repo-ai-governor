#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distCliEntryPath = path.resolve(__dirname, "..", "dist", "src", "cli", "index.js");
const sourceCliEntryPath = path.resolve(__dirname, "..", "src", "cli", "index.js");
const resolvedCliEntryPath = fs.existsSync(distCliEntryPath)
  ? distCliEntryPath
  : sourceCliEntryPath;
const { runCli } = await import(pathToFileURL(resolvedCliEntryPath).href);

const exitCode = await runCli(process.argv.slice(2));
process.exitCode = exitCode;
