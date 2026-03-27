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

/** Supported gate profiles mapping to Turbo tasks. */
const SUPPORTED_GATE_PROFILES = {
  full: "gate:check",
  fast: "gate:fast",
};

/** Why: `affected` is a formal profile id, but rollout is deferred to sprint-003. */
const DEFERRED_GATE_PROFILES = {
  affected: "planned for sprint-003-project-references-affected-check-and-ci-matrix via TK-287",
};

const rawArgs = process.argv.slice(2);
const normalizedArgs = rawArgs.filter((arg) => arg !== "--");
const isVerbose = normalizedArgs.includes("--verbose");

// Parse --profile argument (default: full)
const profileIndex = normalizedArgs.indexOf("--profile");
const profileName =
  profileIndex !== -1 && normalizedArgs[profileIndex + 1]
    ? normalizedArgs[profileIndex + 1]
    : "full";

if (DEFERRED_GATE_PROFILES[profileName]) {
  console.error(
    `[gate-check] Profile "${profileName}" is reserved but not implemented in sprint-001; ${DEFERRED_GATE_PROFILES[profileName]}. Use "fast" or "full" for the current baseline.`,
  );
  process.exit(2);
}

if (!SUPPORTED_GATE_PROFILES[profileName]) {
  console.error(
    `[gate-check] Unknown profile "${profileName}". Available: ${Object.keys(SUPPORTED_GATE_PROFILES).join(", ")}`,
  );
  process.exit(1);
}

const turboTask = SUPPORTED_GATE_PROFILES[profileName];
const passthroughArgs = normalizedArgs.filter(
  (arg, index) =>
    arg !== "--verbose" &&
    arg !== "--profile" &&
    (profileIndex === -1 || index !== profileIndex + 1),
);

// Why: default quiet mode is token-efficient for AI execution while `--verbose`
// provides full human-oriented logs on demand.
const outputLogs = isVerbose ? "full" : "errors-only";
const turboArgs = [
  "turbo",
  "run",
  turboTask,
  `--output-logs=${outputLogs}`,
  "--log-prefix=task",
  "--log-order=grouped",
  ...passthroughArgs,
];

const startTime = Date.now();
console.info(
  `[gate-check] profile=${profileName} task=${turboTask} started at ${new Date(startTime).toISOString()}`,
);

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
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  const status = code === 0 ? "PASSED" : "FAILED";
  console.info(`[gate-check] profile=${profileName} status=${status} elapsed=${elapsed}s`);
  process.exit(code ?? 1);
});
