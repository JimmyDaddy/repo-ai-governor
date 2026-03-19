#!/usr/bin/env node

import { spawn } from "node:child_process";

const TURBO_TASK_PREFIX_PATTERN = /^\/\/:([^:]+:[^:]+):\s?(.*)$/u;

/**
 * Converts Turbo default root-task prefix into a friendlier task tag.
 * @param {string} line Raw line from Turbo stream.
 * @returns {string}
 */
function prettifyTurboPrefix(line) {
  const matched = TURBO_TASK_PREFIX_PATTERN.exec(line);
  if (!matched) {
    return line;
  }

  const [, taskId, message] = matched;
  if (!message.trim()) {
    return "";
  }

  return `[turbo:${taskId}] ${message}`;
}

/**
 * Streams child output line-by-line with Turbo prefix normalization.
 * @param {import("node:stream").Readable} stream Child output stream.
 * @param {(line: string) => void} writer Output writer.
 */
function pipePrettifiedLines(stream, writer) {
  let remaining = "";

  stream.on("data", (chunk) => {
    remaining += chunk.toString("utf8");
    const lines = remaining.split(/\r?\n/u);
    remaining = lines.pop() ?? "";

    for (const line of lines) {
      const formatted = prettifyTurboPrefix(line);
      if (!formatted) {
        continue;
      }
      writer(formatted);
    }
  });

  stream.on("end", () => {
    if (!remaining) {
      return;
    }

    const formatted = prettifyTurboPrefix(remaining);
    if (!formatted) {
      return;
    }
    writer(formatted);
  });
}

const rawArgs = process.argv.slice(2);
const normalizedArgs = rawArgs.filter((arg) => arg !== "--");
const isVerbose = normalizedArgs.includes("--verbose");
const passthroughArgs = normalizedArgs.filter((arg) => arg !== "--verbose");

// Why: default quiet mode is token-efficient for AI execution while `--verbose`
// provides full human-oriented logs on demand.
const outputLogs = isVerbose ? "full" : "errors-only";
const turboArgs = [
  "turbo",
  "run",
  "gate:check",
  `--output-logs=${outputLogs}`,
  "--log-prefix=task",
  "--log-order=grouped",
  ...passthroughArgs,
];

const child = spawn("pnpm", turboArgs, {
  stdio: ["inherit", "pipe", "pipe"],
});

pipePrettifiedLines(child.stdout, (line) => {
  process.stdout.write(`${line}\n`);
});

pipePrettifiedLines(child.stderr, (line) => {
  process.stderr.write(`${line}\n`);
});

child.on("error", (error) => {
  console.error(error.message);
  process.exit(1);
});

child.on("close", (code) => {
  process.exit(code ?? 1);
});
