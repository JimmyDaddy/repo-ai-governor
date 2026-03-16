#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const MAX_OUTPUT_LENGTH = 4000;

function parseArguments(argv) {
  const options = {
    cwd: process.cwd(),
    standards: "code_standards.md",
    format: "summary",
    dryRun: false
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (token === "--cwd") {
      options.cwd = argv[index + 1] ?? options.cwd;
      index += 1;
      continue;
    }

    if (token === "--standards") {
      options.standards = argv[index + 1] ?? options.standards;
      index += 1;
      continue;
    }

    if (token === "--format=json") {
      options.format = "json";
      continue;
    }

    if (token === "--dry-run") {
      options.dryRun = true;
    }
  }

  return options;
}

function toRelativePath(cwd, absolutePath) {
  const relativePath = path.relative(cwd, absolutePath).split(path.sep).join("/");
  return relativePath || ".";
}

function normalizeText(value) {
  return String(value ?? "").trim();
}

function truncateOutput(value) {
  if (typeof value !== "string") {
    return "";
  }

  if (value.length <= MAX_OUTPUT_LENGTH) {
    return value;
  }

  return `${value.slice(0, MAX_OUTPUT_LENGTH)}\n...<truncated>`;
}

function parseRules(content) {
  const rulePattern = /^\s*[-*+]\s+\[([A-Za-z0-9._-]+)\]\s+(.+)$/gm;
  const rules = [];
  let match = rulePattern.exec(content);

  while (match) {
    rules.push({
      id: match[1],
      text: normalizeText(match[2])
    });
    match = rulePattern.exec(content);
  }

  return rules;
}

function extractVerificationSection(content) {
  const lines = String(content).split(/\r?\n/);
  let sectionStart = -1;

  for (let index = 0; index < lines.length; index += 1) {
    if (/^##+\s*(Verification Commands|校验命令)\s*$/i.test(lines[index].trim())) {
      sectionStart = index + 1;
      break;
    }
  }

  if (sectionStart < 0) {
    return "";
  }

  let sectionEnd = lines.length;

  for (let index = sectionStart; index < lines.length; index += 1) {
    if (/^##+\s+/.test(lines[index])) {
      sectionEnd = index;
      break;
    }
  }

  return lines.slice(sectionStart, sectionEnd).join("\n");
}

function parseCommandLines(rawBlock) {
  const commands = [];
  const lines = String(rawBlock).split(/\r?\n/);
  let pending = "";

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed === "" || trimmed.startsWith("#")) {
      continue;
    }

    if (trimmed.endsWith("\\")) {
      pending = `${pending}${trimmed.slice(0, -1)} `;
      continue;
    }

    const command = `${pending}${trimmed}`.trim();
    pending = "";

    if (command) {
      commands.push(command);
    }
  }

  if (pending.trim()) {
    commands.push(pending.trim());
  }

  return commands;
}

function parseCommandsFromVerificationSection(sectionContent) {
  const commands = [];
  const fencedBlockPattern = /```(?:bash|sh|zsh|shell|pwsh|powershell)?\s*\n([\s\S]*?)```/gi;
  let blockMatch = fencedBlockPattern.exec(sectionContent);

  while (blockMatch) {
    commands.push(...parseCommandLines(blockMatch[1]));
    blockMatch = fencedBlockPattern.exec(sectionContent);
  }

  if (commands.length > 0) {
    return [...new Set(commands)];
  }

  for (const line of sectionContent.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!/^\s*[-*+]\s+/.test(trimmed)) {
      continue;
    }

    let candidate = trimmed.replace(/^\s*[-*+]\s+/, "").trim();

    if (candidate.startsWith("`") && candidate.endsWith("`")) {
      candidate = candidate.slice(1, -1).trim();
    }

    if (candidate) {
      commands.push(candidate);
    }
  }

  return [...new Set(commands)];
}

function isRecursiveGateCommand(command) {
  if (/\bcheck:code-standards\b/i.test(command)) {
    return true;
  }

  return /\b(?:npm|pnpm|yarn|bun)\s+(?:run|exec)\s+check\b/i.test(command);
}

function runCommand(command, cwd) {
  const startedAt = Date.now();
  const result = spawnSync(command, {
    cwd,
    shell: true,
    encoding: "utf8",
    env: process.env
  });
  const durationMs = Date.now() - startedAt;

  return {
    command,
    status: result.status === 0 ? "pass" : "fail",
    exitCode: typeof result.status === "number" ? result.status : 1,
    durationMs,
    stdout: truncateOutput(result.stdout),
    stderr: truncateOutput(result.stderr)
  };
}

function writeOutput(payload, format) {
  if (format === "json") {
    process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
    return;
  }

  process.stdout.write(
    [
      "code-standards-check",
      `status=${payload.status}`,
      `standards=${payload.standardsPath}`,
      `rules=${payload.ruleCount}`,
      `commands=${payload.commandCount}`,
      `failedCommands=${payload.failedCommands}`,
      `failures=${payload.failures.length}`
    ].join("\n") + "\n"
  );

  if (payload.failures.length > 0) {
    for (const failure of payload.failures) {
      process.stderr.write(`${failure.message}\n`);
    }

    const failedCommand = payload.commands.find((command) => command.status === "fail");

    if (failedCommand) {
      process.stderr.write(
        [
          "",
          `Failed command: ${failedCommand.command}`,
          `Exit code: ${failedCommand.exitCode}`,
          failedCommand.stdout ? `stdout:\n${failedCommand.stdout}` : "",
          failedCommand.stderr ? `stderr:\n${failedCommand.stderr}` : ""
        ]
          .filter(Boolean)
          .join("\n") + "\n"
      );
    }
  }
}

function finalize(payload, format) {
  writeOutput(payload, format);
  process.exitCode = payload.status === "pass" ? 0 : 1;
}

function main() {
  const options = parseArguments(process.argv.slice(2));
  const cwd = path.resolve(options.cwd);
  const standardsFilePath = path.resolve(cwd, options.standards);
  const payload = {
    status: "pass",
    cwd,
    standardsPath: toRelativePath(cwd, standardsFilePath),
    dryRun: options.dryRun,
    ruleCount: 0,
    commandCount: 0,
    failedCommands: 0,
    rules: [],
    commands: [],
    failures: []
  };

  if (!fs.existsSync(standardsFilePath)) {
    payload.status = "fail";
    payload.failures.push({
      code: "standards.file_missing",
      message: `Code standards file not found: ${payload.standardsPath}`
    });
    finalize(payload, options.format);
    return;
  }

  const standardsContent = fs.readFileSync(standardsFilePath, "utf8");
  const parsedRules = parseRules(standardsContent);
  payload.rules = parsedRules;
  payload.ruleCount = parsedRules.length;

  if (parsedRules.length === 0) {
    payload.status = "fail";
    payload.failures.push({
      code: "standards.rules_missing",
      message:
        "No rule entries found. Add bullet rules like: - [RULE-ID] rule description."
    });
    finalize(payload, options.format);
    return;
  }

  const verificationSection = extractVerificationSection(standardsContent);

  if (!verificationSection) {
    payload.status = "fail";
    payload.failures.push({
      code: "standards.verification_section_missing",
      message:
        'Verification section not found. Add a "## Verification Commands" (or "## 校验命令") section.'
    });
    finalize(payload, options.format);
    return;
  }

  const commands = parseCommandsFromVerificationSection(verificationSection);
  payload.commandCount = commands.length;

  if (commands.length === 0) {
    payload.status = "fail";
    payload.failures.push({
      code: "standards.verification_commands_missing",
      message:
        "No verification commands found. Add a bash/sh code block under Verification Commands."
    });
    finalize(payload, options.format);
    return;
  }

  for (const command of commands) {
    if (isRecursiveGateCommand(command)) {
      payload.status = "fail";
      payload.failures.push({
        code: "standards.recursive_gate_command",
        message: `Recursive gate command is not allowed in code standards: ${command}`
      });
      finalize(payload, options.format);
      return;
    }
  }

  if (options.dryRun) {
    payload.commands = commands.map((command) => ({
      command,
      status: "planned",
      exitCode: 0,
      durationMs: 0,
      stdout: "",
      stderr: ""
    }));
    finalize(payload, options.format);
    return;
  }

  for (const command of commands) {
    const result = runCommand(command, cwd);
    payload.commands.push(result);

    if (result.status === "fail") {
      payload.status = "fail";
      payload.failedCommands += 1;
      payload.failures.push({
        code: "standards.command_failed",
        message: `Verification command failed: ${command}`,
        exitCode: result.exitCode
      });
      break;
    }
  }

  finalize(payload, options.format);
}

main();
