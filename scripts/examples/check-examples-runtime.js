#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";

import { gateFail, gateInfo, gatePass } from "../governance/gate-output.js";

const GATE_NAME = "examples-runtime-smoke";
const CONTRACT_RELATIVE_PATH = "examples/example-smoke.contract.json";
const CLI_ENTRY_RELATIVE_PATH = "dist/bin/repo-ai-governor.js";

/**
 * Reads UTF-8 text content from one repository-relative path.
 * @param {string} relativePath Repository-relative path.
 * @returns {string}
 */
function readText(relativePath) {
  return readFileSync(resolve(process.cwd(), relativePath), "utf8");
}

/**
 * Parses one repository-relative JSON file.
 * @param {string} relativePath Repository-relative path.
 * @returns {unknown}
 */
function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

/**
 * Validates one non-empty string field.
 * @param {unknown} value Field value.
 * @param {string} fieldName Field name for diagnostics.
 */
function assertNonEmptyString(value, fieldName) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`Field "${fieldName}" must be a non-empty string.`);
  }
}

/**
 * Normalizes example-smoke contract payload.
 * @param {unknown} contractRaw Parsed contract JSON.
 * @returns {{
 *   requiredExamples: Array<{
 *     id: string;
 *     path: string;
 *     runtimeScenarioPath: string;
 *     expectedPath: string;
 *   }>;
 * }}
 */
function normalizeContract(contractRaw) {
  if (!contractRaw || typeof contractRaw !== "object") {
    throw new Error("example smoke contract must be an object.");
  }

  if (!Array.isArray(contractRaw.requiredExamples) || contractRaw.requiredExamples.length === 0) {
    throw new Error('Field "requiredExamples" must be a non-empty array.');
  }

  return {
    requiredExamples: contractRaw.requiredExamples.map((entry, index) => {
      if (!entry || typeof entry !== "object") {
        throw new Error(`requiredExamples[${index}] must be an object.`);
      }

      assertNonEmptyString(entry.id, `requiredExamples[${index}].id`);
      assertNonEmptyString(entry.path, `requiredExamples[${index}].path`);
      assertNonEmptyString(
        entry.runtimeScenarioPath,
        `requiredExamples[${index}].runtimeScenarioPath`,
      );
      assertNonEmptyString(entry.expectedPath, `requiredExamples[${index}].expectedPath`);

      return {
        id: entry.id.trim(),
        path: entry.path.trim(),
        runtimeScenarioPath: entry.runtimeScenarioPath.trim(),
        expectedPath: entry.expectedPath.trim(),
      };
    }),
  };
}

/**
 * Normalizes expected runtime baseline payload.
 * @param {unknown} expectedRaw Parsed expected payload.
 * @param {string} expectedPath Expected payload path.
 * @returns {{expectedCommandOperations: Record<string, string>}}
 */
function normalizeExpectedBaseline(expectedRaw, expectedPath) {
  if (!expectedRaw || typeof expectedRaw !== "object" || Array.isArray(expectedRaw)) {
    throw new Error(`expected baseline must be an object: ${expectedPath}`);
  }

  if (
    !expectedRaw.expectedCommandOperations ||
    typeof expectedRaw.expectedCommandOperations !== "object" ||
    Array.isArray(expectedRaw.expectedCommandOperations)
  ) {
    throw new Error(`expectedCommandOperations must be an object: ${expectedPath}`);
  }

  /** @type {Record<string, string>} */
  const expectedCommandOperations = {};
  for (const [commandName, operationName] of Object.entries(
    expectedRaw.expectedCommandOperations,
  )) {
    assertNonEmptyString(commandName, `${expectedPath}:expectedCommandOperations.command`);
    assertNonEmptyString(operationName, `${expectedPath}:expectedCommandOperations.operation`);
    expectedCommandOperations[commandName.trim()] = operationName.trim();
  }

  return {
    expectedCommandOperations,
  };
}

/**
 * Normalizes one scenario step.
 * @param {unknown} stepRaw Scenario step payload.
 * @param {number} index Step index.
 * @returns {{
 *   id: string;
 *   args: string[];
 *   expect: {
 *     status?: string;
 *     command?: string;
 *     operation?: string;
 *     minPassChecks?: number;
 *     requiredArtifactIds?: string[];
 *   };
 * }}
 */
function normalizeScenarioStep(stepRaw, index) {
  if (!stepRaw || typeof stepRaw !== "object") {
    throw new Error(`commands[${index}] must be an object.`);
  }

  assertNonEmptyString(stepRaw.id, `commands[${index}].id`);

  if (!Array.isArray(stepRaw.args) || stepRaw.args.length === 0) {
    throw new Error(`commands[${index}].args must be a non-empty array.`);
  }

  const args = stepRaw.args.map((arg, argIndex) => {
    assertNonEmptyString(arg, `commands[${index}].args[${argIndex}]`);
    return arg.trim();
  });

  if (!stepRaw.expect || typeof stepRaw.expect !== "object") {
    throw new Error(`commands[${index}].expect must be an object.`);
  }

  const normalizedExpect = {
    ...(typeof stepRaw.expect.status === "string" ? { status: stepRaw.expect.status.trim() } : {}),
    ...(typeof stepRaw.expect.command === "string"
      ? { command: stepRaw.expect.command.trim() }
      : {}),
    ...(typeof stepRaw.expect.operation === "string"
      ? { operation: stepRaw.expect.operation.trim() }
      : {}),
    ...(typeof stepRaw.expect.minPassChecks === "number"
      ? { minPassChecks: stepRaw.expect.minPassChecks }
      : {}),
    ...(Array.isArray(stepRaw.expect.requiredArtifactIds)
      ? {
          requiredArtifactIds: stepRaw.expect.requiredArtifactIds.map(
            (artifactId, artifactIndex) => {
              assertNonEmptyString(
                artifactId,
                `commands[${index}].expect.requiredArtifactIds[${artifactIndex}]`,
              );
              return artifactId.trim();
            },
          ),
        }
      : {}),
  };

  return {
    id: stepRaw.id.trim(),
    args,
    expect: normalizedExpect,
  };
}

/**
 * Normalizes one runtime scenario.
 * @param {unknown} scenarioRaw Parsed scenario payload.
 * @param {string} scenarioPath Scenario path for diagnostics.
 * @returns {{
 *   id: string;
 *   commands: Array<ReturnType<typeof normalizeScenarioStep>>;
 * }}
 */
function normalizeScenario(scenarioRaw, scenarioPath) {
  if (!scenarioRaw || typeof scenarioRaw !== "object") {
    throw new Error(`scenario must be an object: ${scenarioPath}`);
  }

  assertNonEmptyString(scenarioRaw.id, `${scenarioPath}:id`);

  if (!Array.isArray(scenarioRaw.commands) || scenarioRaw.commands.length === 0) {
    throw new Error(`${scenarioPath}:commands must be a non-empty array.`);
  }

  const commands = scenarioRaw.commands.map((stepRaw, index) =>
    normalizeScenarioStep(stepRaw, index),
  );

  return {
    id: scenarioRaw.id.trim(),
    commands,
  };
}

/**
 * Executes one CLI step and returns parsed JSON output.
 * Why: runtime smoke should validate behavior-level contract rather than README text only.
 * @param {string} cliEntryAbsolutePath Absolute CLI entry path.
 * @param {string} workspacePath Scenario temp workspace path.
 * @param {string} scenarioId Scenario id.
 * @param {ReturnType<typeof normalizeScenarioStep>} step Scenario command step.
 * @returns {{exitCode: number; output: Record<string, unknown>; stdout: string; stderr: string}}
 */
function executeStep(cliEntryAbsolutePath, workspacePath, scenarioId, step) {
  const result = spawnSync(process.execPath, [cliEntryAbsolutePath, ...step.args], {
    cwd: workspacePath,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });

  if (typeof result.status !== "number") {
    throw new Error(
      `example(${scenarioId}) step(${step.id}) failed to start: ${result.error?.message ?? "unknown error"}`,
    );
  }

  const stdout = (result.stdout ?? "").trim();
  const stderr = (result.stderr ?? "").trim();

  if (result.status !== 0) {
    throw new Error(
      `example(${scenarioId}) step(${step.id}) exited with code ${result.status}. stderr="${stderr}" stdout="${stdout}"`,
    );
  }

  let parsedOutput;
  try {
    parsedOutput = JSON.parse(stdout);
  } catch {
    throw new Error(
      `example(${scenarioId}) step(${step.id}) returned non-JSON stdout. stdout="${stdout}" stderr="${stderr}"`,
    );
  }

  if (!parsedOutput || typeof parsedOutput !== "object" || Array.isArray(parsedOutput)) {
    throw new Error(`example(${scenarioId}) step(${step.id}) returned invalid JSON payload.`);
  }

  return {
    exitCode: result.status,
    output: parsedOutput,
    stdout,
    stderr,
  };
}

/**
 * Ensures one command output matches scenario expectations.
 * @param {string} scenarioId Scenario id.
 * @param {ReturnType<typeof normalizeScenarioStep>} step Scenario step.
 * @param {string} commandName CLI command name.
 * @param {string} baselineOperation Baseline operation mapped from `expected/runtime-baseline.json`.
 * @param {Record<string, unknown>} output Parsed command output.
 */
function assertStepExpectation(scenarioId, step, commandName, baselineOperation, output) {
  if (step.expect.status && output.status !== step.expect.status) {
    throw new Error(
      `example(${scenarioId}) step(${step.id}) expected status="${step.expect.status}" but got "${String(output.status)}"`,
    );
  }

  if (step.expect.command && output.command !== step.expect.command) {
    throw new Error(
      `example(${scenarioId}) step(${step.id}) expected command="${step.expect.command}" but got "${String(output.command)}"`,
    );
  }

  const commandResult =
    output.command_result &&
    typeof output.command_result === "object" &&
    !Array.isArray(output.command_result)
      ? output.command_result
      : null;

  if (!commandResult) {
    throw new Error(`example(${scenarioId}) step(${step.id}) missing command_result object.`);
  }

  if (step.expect.operation && step.expect.operation !== baselineOperation) {
    throw new Error(
      `example(${scenarioId}) step(${step.id}) operation drift between scenario and baseline for command "${commandName}". scenario="${step.expect.operation}" baseline="${baselineOperation}"`,
    );
  }

  if (commandResult.operation !== baselineOperation) {
    throw new Error(
      `example(${scenarioId}) step(${step.id}) expected baseline operation="${baselineOperation}" but got "${String(commandResult.operation)}"`,
    );
  }

  if (step.expect.operation && commandResult.operation !== step.expect.operation) {
    throw new Error(
      `example(${scenarioId}) step(${step.id}) expected operation="${step.expect.operation}" but got "${String(commandResult.operation)}"`,
    );
  }

  if (typeof step.expect.minPassChecks === "number") {
    const checkTotals =
      commandResult.check_totals &&
      typeof commandResult.check_totals === "object" &&
      !Array.isArray(commandResult.check_totals)
        ? commandResult.check_totals
        : null;

    const passCount = checkTotals && typeof checkTotals.pass === "number" ? checkTotals.pass : -1;
    if (passCount < step.expect.minPassChecks) {
      throw new Error(
        `example(${scenarioId}) step(${step.id}) expected min pass checks ${step.expect.minPassChecks} but got ${passCount}`,
      );
    }
  }

  if (
    Array.isArray(step.expect.requiredArtifactIds) &&
    step.expect.requiredArtifactIds.length > 0
  ) {
    const artifacts = Array.isArray(commandResult.artifacts) ? commandResult.artifacts : [];
    const artifactIds = new Set(
      artifacts
        .filter(
          (artifact) => artifact && typeof artifact === "object" && typeof artifact.id === "string",
        )
        .map((artifact) => artifact.id),
    );

    for (const requiredArtifactId of step.expect.requiredArtifactIds) {
      if (!artifactIds.has(requiredArtifactId)) {
        throw new Error(
          `example(${scenarioId}) step(${step.id}) missing required artifact id "${requiredArtifactId}"`,
        );
      }
    }
  }
}

const issues = [];

try {
  const cliEntryAbsolutePath = resolve(process.cwd(), CLI_ENTRY_RELATIVE_PATH);
  if (!existsSync(cliEntryAbsolutePath)) {
    throw new Error(
      `CLI entry is missing. Run build before runtime smoke: ${CLI_ENTRY_RELATIVE_PATH}`,
    );
  }
  const contract = normalizeContract(readJson(CONTRACT_RELATIVE_PATH));

  for (const requiredExample of contract.requiredExamples) {
    const scenarioRaw = readJson(requiredExample.runtimeScenarioPath);
    const scenario = normalizeScenario(scenarioRaw, requiredExample.runtimeScenarioPath);
    const expectedRaw = readJson(requiredExample.expectedPath);
    const expectedBaseline = normalizeExpectedBaseline(expectedRaw, requiredExample.expectedPath);
    const workspacePath = mkdtempSync(
      resolve(tmpdir(), `repo-ai-governor-example-${scenario.id}-`),
    );

    try {
      for (const step of scenario.commands) {
        const commandName = step.args[0];
        const baselineOperation = expectedBaseline.expectedCommandOperations[commandName];
        if (!baselineOperation) {
          throw new Error(
            `example(${scenario.id}) missing baseline operation mapping for command "${commandName}" at "${requiredExample.expectedPath}"`,
          );
        }

        const executionResult = executeStep(cliEntryAbsolutePath, workspacePath, scenario.id, step);
        assertStepExpectation(
          scenario.id,
          step,
          commandName,
          baselineOperation,
          executionResult.output,
        );
      }
      gateInfo(
        GATE_NAME,
        `example(${scenario.id}) runtime smoke passed with ${scenario.commands.length} step(s).`,
      );
    } finally {
      rmSync(workspacePath, { recursive: true, force: true });
    }
  }
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  issues.push(message);
}

if (issues.length > 0) {
  gateFail(GATE_NAME, `Found ${issues.length} runtime smoke issue(s).`);
  for (const issue of issues) {
    gateInfo(GATE_NAME, `- ${issue}`);
  }
  process.exit(1);
}

gatePass(GATE_NAME, "examples runtime smoke checks passed.");
