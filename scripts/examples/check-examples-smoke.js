#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { gateFail, gateInfo, gatePass } from '../governance/gate-output.js';

const GATE_NAME = 'examples-doc-smoke';
const EXAMPLES_ROOT = 'examples';
const CONTRACT_RELATIVE_PATH = 'examples/example-smoke.contract.json';
const PACKAGE_JSON_RELATIVE_PATH = 'package.json';
const CLI_COMMANDS_RELATIVE_PATH = 'apps/cli/src/constants/cli-command.constant.ts';
const REQUIRED_SECTION_HEADINGS = ['## 输入', '## 命令', '## 预期输出', '## 排障'];

/**
 * Reads UTF-8 text from one relative path.
 * @param {string} relativePath File path relative to repository root.
 * @returns {string}
 */
function readText(relativePath) {
  const absolutePath = resolve(process.cwd(), relativePath);
  return readFileSync(absolutePath, 'utf8');
}

/**
 * Reads and parses JSON payload from one relative path.
 * @param {string} relativePath File path relative to repository root.
 * @returns {unknown}
 */
function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

/**
 * Validates one non-empty string field.
 * @param {unknown} value Candidate value.
 * @param {string} fieldName Field name for diagnostics.
 */
function assertNonEmptyString(value, fieldName) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`Field "${fieldName}" must be a non-empty string.`);
  }
}

/**
 * Normalizes one example entry list from the contract payload.
 * @param {unknown} entriesRaw Raw entries value.
 * @param {string} fieldName Field name for diagnostics.
 * @returns {Array<{
 *   id: string;
 *   path: string;
 *   runtimeScenarioPath: string;
 *   fixturesPath: string;
 *   expectedPath: string;
 *   requiredCommands: string[];
 * }>}
 */
function normalizeExampleEntries(entriesRaw, fieldName) {
  if (entriesRaw === undefined) {
    return [];
  }

  if (!Array.isArray(entriesRaw)) {
    throw new Error(`Field "${fieldName}" must be an array when provided.`);
  }

  return entriesRaw.map((entry, index) => {
    if (!entry || typeof entry !== 'object') {
      throw new Error(`${fieldName}[${index}] must be an object.`);
    }

    assertNonEmptyString(entry.id, `${fieldName}[${index}].id`);
    assertNonEmptyString(entry.path, `${fieldName}[${index}].path`);
    assertNonEmptyString(entry.runtimeScenarioPath, `${fieldName}[${index}].runtimeScenarioPath`);
    assertNonEmptyString(entry.fixturesPath, `${fieldName}[${index}].fixturesPath`);
    assertNonEmptyString(entry.expectedPath, `${fieldName}[${index}].expectedPath`);

    if (!Array.isArray(entry.requiredCommands) || entry.requiredCommands.length === 0) {
      throw new Error(`${fieldName}[${index}].requiredCommands must be a non-empty array.`);
    }

    return {
      id: entry.id.trim(),
      path: entry.path.trim(),
      runtimeScenarioPath: entry.runtimeScenarioPath.trim(),
      fixturesPath: entry.fixturesPath.trim(),
      expectedPath: entry.expectedPath.trim(),
      requiredCommands: entry.requiredCommands.map((command) => {
        assertNonEmptyString(command, `${fieldName}[${index}].requiredCommands[]`);
        return command.trim();
      }),
    };
  });
}

/**
 * Collects CLI command names from enum declarations.
 * @returns {Set<string>}
 */
function collectCliCommandNames() {
  const content = readText(CLI_COMMANDS_RELATIVE_PATH);
  const commandNames = new Set();

  const pattern = /^\s+[A-Z_]+\s*=\s*["']([a-z-]+)["']/gmu;
  let matched = pattern.exec(content);
  while (matched) {
    commandNames.add(matched[1]);
    matched = pattern.exec(content);
  }

  return commandNames;
}

/**
 * Reads command name from one README command line.
 * Why: examples must keep command-first style to keep parser deterministic.
 * @param {string} line One command line.
 * @returns {string | null}
 */
function readCommandNameFromReadmeLine(line) {
  const normalized = line.trim();
  const hasExecutablePrefix =
    normalized.includes('pnpm exec repo-ai-governor') || normalized.startsWith('repo-ai-governor ');
  if (normalized.length === 0 || !hasExecutablePrefix) {
    return null;
  }

  const tokens = normalized.split(/\s+/u);
  const cliIndex = tokens.findIndex((token) => token.includes('repo-ai-governor'));
  if (cliIndex === -1) {
    return null;
  }

  for (let index = cliIndex + 1; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (token.startsWith('-')) {
      continue;
    }
    if (token.startsWith('#')) {
      break;
    }
    return token.replace(/[;|].*$/u, '');
  }

  return null;
}

/**
 * Collects command names declared in one example markdown.
 * @param {string} content Markdown content.
 * @returns {Set<string>}
 */
function collectExampleReadmeCommands(content) {
  const commandNames = new Set();
  for (const line of content.split(/\r?\n/u)) {
    const commandName = readCommandNameFromReadmeLine(line);
    if (!commandName) {
      continue;
    }
    commandNames.add(commandName);
  }
  return commandNames;
}

/**
 * Collects command names declared in scenario commands.
 * @param {unknown} scenarioRaw Scenario payload.
 * @param {string} scenarioPath Path for diagnostics.
 * @returns {Set<string>}
 */
function collectScenarioCommands(scenarioRaw, scenarioPath) {
  if (!scenarioRaw || typeof scenarioRaw !== 'object') {
    throw new Error(`scenario must be an object: ${scenarioPath}`);
  }

  if (!Array.isArray(scenarioRaw.commands) || scenarioRaw.commands.length === 0) {
    throw new Error(`scenario.commands must be a non-empty array: ${scenarioPath}`);
  }

  const commandNames = new Set();
  for (const [index, command] of scenarioRaw.commands.entries()) {
    if (
      !command ||
      typeof command !== 'object' ||
      !Array.isArray(command.args) ||
      command.args.length === 0
    ) {
      throw new Error(`scenario.commands[${index}] must include non-empty args: ${scenarioPath}`);
    }

    const firstArg = command.args[0];
    assertNonEmptyString(firstArg, `scenario.commands[${index}].args[0]`);
    commandNames.add(firstArg.trim());
  }

  return commandNames;
}

/**
 * Collects command->operation mapping declared by scenario expectations.
 * @param {unknown} scenarioRaw Scenario payload.
 * @param {string} scenarioPath Path for diagnostics.
 * @returns {Map<string, string>}
 */
function collectScenarioCommandOperations(scenarioRaw, scenarioPath) {
  if (!scenarioRaw || typeof scenarioRaw !== 'object') {
    throw new Error(`scenario must be an object: ${scenarioPath}`);
  }

  if (!Array.isArray(scenarioRaw.commands) || scenarioRaw.commands.length === 0) {
    throw new Error(`scenario.commands must be a non-empty array: ${scenarioPath}`);
  }

  const commandOperations = new Map();
  for (const [index, command] of scenarioRaw.commands.entries()) {
    if (
      !command ||
      typeof command !== 'object' ||
      !Array.isArray(command.args) ||
      command.args.length === 0
    ) {
      throw new Error(`scenario.commands[${index}] must include non-empty args: ${scenarioPath}`);
    }

    const commandName = command.args[0];
    assertNonEmptyString(commandName, `scenario.commands[${index}].args[0]`);

    const operationName =
      command.expect &&
      typeof command.expect === 'object' &&
      typeof command.expect.operation === 'string'
        ? command.expect.operation.trim()
        : '';
    if (operationName.length === 0) {
      continue;
    }

    commandOperations.set(commandName.trim(), operationName);
  }

  return commandOperations;
}

/**
 * Validates one required file path exists.
 * @param {string[]} issues Issue collection.
 * @param {string} relativePath Relative path.
 * @param {string} reason Failure reason prefix.
 */
function ensureFileExists(issues, relativePath, reason) {
  const absolutePath = resolve(process.cwd(), relativePath);
  if (!existsSync(absolutePath)) {
    issues.push(`${reason}: missing "${relativePath}"`);
  }
}

/**
 * Validates top-level examples contract shape and returns normalized payload.
 * @param {unknown} contractRaw Parsed contract payload.
 * @returns {{
 *   schemaVersion: string;
 *   requiredExamples: Array<{
 *     id: string;
 *     path: string;
 *     runtimeScenarioPath: string;
 *     fixturesPath: string;
 *     expectedPath: string;
 *     requiredCommands: string[];
 *   }>;
 *   pluginEnabledExamples: Array<{
 *     id: string;
 *     path: string;
 *     runtimeScenarioPath: string;
 *     fixturesPath: string;
 *     expectedPath: string;
 *     requiredCommands: string[];
 *   }>;
 *   requiredGateScripts: string[];
 *   externalConsumptionContractMatrixRef: string;
 *   supportMatrixRef: string;
 *   readmeRefs: string[];
 * }}
 */
function normalizeContract(contractRaw) {
  if (!contractRaw || typeof contractRaw !== 'object') {
    throw new Error('example smoke contract must be an object.');
  }

  assertNonEmptyString(contractRaw.schemaVersion, 'schemaVersion');
  assertNonEmptyString(
    contractRaw.externalConsumptionContractMatrixRef,
    'externalConsumptionContractMatrixRef',
  );
  assertNonEmptyString(contractRaw.supportMatrixRef, 'supportMatrixRef');

  if (
    !Array.isArray(contractRaw.requiredGateScripts) ||
    contractRaw.requiredGateScripts.length === 0
  ) {
    throw new Error('Field "requiredGateScripts" must be a non-empty string array.');
  }
  if (!Array.isArray(contractRaw.readmeRefs) || contractRaw.readmeRefs.length === 0) {
    throw new Error('Field "readmeRefs" must be a non-empty string array.');
  }
  const requiredExamples = normalizeExampleEntries(
    contractRaw.requiredExamples,
    'requiredExamples',
  );
  if (requiredExamples.length === 0) {
    throw new Error('Field "requiredExamples" must be a non-empty array.');
  }

  const requiredGateScripts = contractRaw.requiredGateScripts.map((scriptName) => {
    assertNonEmptyString(scriptName, 'requiredGateScripts[]');
    return scriptName.trim();
  });
  const readmeRefs = contractRaw.readmeRefs.map((referencePath) => {
    assertNonEmptyString(referencePath, 'readmeRefs[]');
    return referencePath.trim();
  });

  return {
    schemaVersion: contractRaw.schemaVersion.trim(),
    requiredExamples,
    pluginEnabledExamples: normalizeExampleEntries(
      contractRaw.pluginEnabledExamples,
      'pluginEnabledExamples',
    ),
    requiredGateScripts,
    externalConsumptionContractMatrixRef: contractRaw.externalConsumptionContractMatrixRef.trim(),
    supportMatrixRef: contractRaw.supportMatrixRef.trim(),
    readmeRefs,
  };
}

/**
 * Validates expected baseline JSON shape.
 * @param {unknown} expectedRaw Parsed expected payload.
 * @param {string} expectedPath Expected file path.
 */
function validateExpectedShape(expectedRaw, expectedPath) {
  if (!expectedRaw || typeof expectedRaw !== 'object') {
    throw new Error(`expected baseline must be an object: ${expectedPath}`);
  }

  if (
    !expectedRaw.expectedCommandOperations ||
    typeof expectedRaw.expectedCommandOperations !== 'object' ||
    Array.isArray(expectedRaw.expectedCommandOperations)
  ) {
    throw new Error(`expectedCommandOperations must be an object: ${expectedPath}`);
  }
}

const issues = [];

try {
  ensureFileExists(issues, CONTRACT_RELATIVE_PATH, 'contract');
  ensureFileExists(issues, `${EXAMPLES_ROOT}/README.md`, 'examples root');
  ensureFileExists(issues, PACKAGE_JSON_RELATIVE_PATH, 'package metadata');
  ensureFileExists(issues, CLI_COMMANDS_RELATIVE_PATH, 'cli command baseline');

  const examplesRootPath = resolve(process.cwd(), EXAMPLES_ROOT);
  if (!existsSync(examplesRootPath)) {
    issues.push(`examples root: missing "${EXAMPLES_ROOT}/"`);
  }

  const contract = normalizeContract(readJson(CONTRACT_RELATIVE_PATH));
  const packageJson = readJson(PACKAGE_JSON_RELATIVE_PATH);
  const packageScripts =
    packageJson &&
    typeof packageJson === 'object' &&
    packageJson.scripts &&
    typeof packageJson.scripts === 'object'
      ? packageJson.scripts
      : null;
  if (!packageScripts) {
    issues.push('package metadata: missing "scripts" object in package.json');
  }

  const rootReadmeContent = readText(`${EXAMPLES_ROOT}/README.md`);
  for (const readmeRef of contract.readmeRefs) {
    ensureFileExists(issues, readmeRef, 'readme refs');
    if (!rootReadmeContent.includes(readmeRef)) {
      issues.push(`examples root README missing ref path: "${readmeRef}"`);
    }
  }

  ensureFileExists(
    issues,
    contract.externalConsumptionContractMatrixRef,
    'external contract matrix ref',
  );
  ensureFileExists(issues, contract.supportMatrixRef, 'support matrix ref');

  for (const requiredScriptName of contract.requiredGateScripts) {
    if (!packageScripts || !(requiredScriptName in packageScripts)) {
      issues.push(`required gate script missing in package.json: "${requiredScriptName}"`);
    }
  }

  const validCliCommands = collectCliCommandNames();
  for (const requiredExample of [...contract.requiredExamples, ...contract.pluginEnabledExamples]) {
    ensureFileExists(issues, requiredExample.path, `example(${requiredExample.id})`);
    ensureFileExists(issues, requiredExample.runtimeScenarioPath, `example(${requiredExample.id})`);
    ensureFileExists(issues, requiredExample.fixturesPath, `example(${requiredExample.id})`);
    ensureFileExists(issues, requiredExample.expectedPath, `example(${requiredExample.id})`);

    const exampleContent = readText(requiredExample.path);
    const scenarioRaw = readJson(requiredExample.runtimeScenarioPath);
    const expectedRaw = readJson(requiredExample.expectedPath);
    const readmeCommands = collectExampleReadmeCommands(exampleContent);
    const scenarioCommands = collectScenarioCommands(
      scenarioRaw,
      requiredExample.runtimeScenarioPath,
    );
    const scenarioCommandOperations = collectScenarioCommandOperations(
      scenarioRaw,
      requiredExample.runtimeScenarioPath,
    );

    validateExpectedShape(expectedRaw, requiredExample.expectedPath);

    for (const heading of REQUIRED_SECTION_HEADINGS) {
      if (!exampleContent.includes(heading)) {
        issues.push(`example(${requiredExample.id}) missing heading "${heading}"`);
      }
    }

    for (const requiredCommand of requiredExample.requiredCommands) {
      if (!readmeCommands.has(requiredCommand)) {
        issues.push(
          `example(${requiredExample.id}) missing required command "${requiredCommand}" in README`,
        );
      }
      if (!scenarioCommands.has(requiredCommand)) {
        issues.push(
          `example(${requiredExample.id}) missing required command "${requiredCommand}" in scenario`,
        );
      }
      if (!expectedRaw.expectedCommandOperations[requiredCommand]) {
        issues.push(
          `example(${requiredExample.id}) expected baseline missing operation mapping for "${requiredCommand}"`,
        );
      }

      const scenarioOperation = scenarioCommandOperations.get(requiredCommand);
      if (!scenarioOperation) {
        issues.push(
          `example(${requiredExample.id}) scenario missing expect.operation for command "${requiredCommand}"`,
        );
        continue;
      }

      const expectedOperation = expectedRaw.expectedCommandOperations[requiredCommand];
      if (expectedOperation !== scenarioOperation) {
        issues.push(
          `example(${requiredExample.id}) operation drift for "${requiredCommand}". scenario="${scenarioOperation}" expected="${String(expectedOperation)}"`,
        );
      }
    }

    for (const commandName of readmeCommands) {
      if (!validCliCommands.has(commandName)) {
        issues.push(
          `example(${requiredExample.id}) README uses unknown CLI command "${commandName}"`,
        );
      }
    }

    for (const commandName of scenarioCommands) {
      if (!validCliCommands.has(commandName)) {
        issues.push(
          `example(${requiredExample.id}) scenario uses unknown CLI command "${commandName}"`,
        );
      }
    }

    if (requiredExample.id === 'multi-role-collaboration-flow') {
      if (!exampleContent.includes('review-verify')) {
        issues.push('example(multi-role-collaboration-flow) must mention "review-verify"');
      }
      if (!/ledger[-\s]backfill/iu.test(exampleContent)) {
        issues.push('example(multi-role-collaboration-flow) must mention "ledger backfill"');
      }
    }

    if (requiredExample.id === 'restricted-network-degrade-flow') {
      if (!/read-only attach/iu.test(exampleContent)) {
        issues.push('example(restricted-network-degrade-flow) must mention "read-only attach"');
      }
      if (!exampleContent.includes('tool_managed') || !exampleContent.includes('repo_local')) {
        issues.push(
          'example(restricted-network-degrade-flow) must mention "tool_managed" and "repo_local"',
        );
      }
    }

    if (requiredExample.id === 'hitl-escalation-flow') {
      if (!/confirm/iu.test(exampleContent) || !/escalate/iu.test(exampleContent)) {
        issues.push('example(hitl-escalation-flow) must mention "confirm" and "escalate"');
      }
    }
  }
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  issues.push(message);
}

if (issues.length > 0) {
  gateFail(GATE_NAME, `Found ${issues.length} example smoke issue(s).`);
  for (const issue of issues) {
    gateInfo(GATE_NAME, `- ${issue}`);
  }
  process.exit(1);
}

gatePass(GATE_NAME, 'examples doc smoke checks passed.');
