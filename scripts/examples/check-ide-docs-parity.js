#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { gateFail, gatePass } from '../governance/gate-output.js';

const GATE_NAME = 'ide-docs-parity';
const COMMAND_WRAPPER_CONTRACT_PATH = 'integrations/ide/contracts/command-wrapper.contract.json';
const STANDARDS_INJECTION_CONTRACT_PATH =
  'integrations/ide/contracts/standards-injection.contract.json';
const IDE_README_PATH = 'integrations/ide/README.md';
const IDE_EXAMPLES_README_PATH = 'integrations/ide/examples/README.md';
const CURSOR_TASK_SAMPLE_PATH = 'integrations/ide/examples/cursor-task.sample.json';
const CLAUDE_CODE_COMMANDS_SAMPLE_PATH =
  'integrations/ide/examples/claude-code-commands.sample.json';
const CURSOR_SURFACE_ID = 'cursor';
const CLAUDE_CODE_SURFACE_ID = 'claude_code';
const REQUIRED_COMMAND_SEQUENCE = ['init', 'doctor', 'check'];

/**
 * Reads one repository-relative UTF-8 text file.
 * @param {string} relativePath Repository-relative path.
 * @returns {string}
 */
function readText(relativePath) {
  return readFileSync(resolve(process.cwd(), relativePath), 'utf8');
}

/**
 * Reads one repository-relative JSON file.
 * @param {string} relativePath Repository-relative path.
 * @returns {unknown}
 */
function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

/**
 * Ensures one required file exists.
 * @param {string} relativePath Repository-relative path.
 */
function ensureFileExists(relativePath) {
  if (!existsSync(resolve(process.cwd(), relativePath))) {
    throw new Error(`Required file is missing: ${relativePath}`);
  }
}

/**
 * Throws when one candidate value is not a non-empty string.
 * @param {unknown} value Candidate value.
 * @param {string} fieldName Field name for diagnostics.
 */
function assertNonEmptyString(value, fieldName) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`Field "${fieldName}" must be a non-empty string.`);
  }
}

/**
 * Requires one exact string to appear in one text payload.
 * @param {string} text Source text.
 * @param {string} expectedSnippet Required snippet.
 * @param {string} label Diagnostic label.
 */
function assertTextIncludes(text, expectedSnippet, label) {
  if (!text.includes(expectedSnippet)) {
    throw new Error(`${label} is missing required snippet: ${expectedSnippet}`);
  }
}

/**
 * Normalizes one surface registry record list into a map.
 * @param {unknown} contractRaw Parsed contract JSON.
 * @returns {Map<string, {surfaceId: string; nextAction: string}>}
 */
function normalizeSurfaceRegistry(contractRaw) {
  if (!contractRaw || typeof contractRaw !== 'object' || Array.isArray(contractRaw)) {
    throw new Error('command-wrapper contract must be an object.');
  }
  if (!Array.isArray(contractRaw.surfaceRegistry) || contractRaw.surfaceRegistry.length === 0) {
    throw new Error('command-wrapper contract must declare a non-empty surfaceRegistry.');
  }

  const surfaceRegistry = new Map();
  for (const [index, surfaceRaw] of contractRaw.surfaceRegistry.entries()) {
    if (!surfaceRaw || typeof surfaceRaw !== 'object' || Array.isArray(surfaceRaw)) {
      throw new Error(`surfaceRegistry[${index}] must be an object.`);
    }
    assertNonEmptyString(surfaceRaw.surfaceId, `surfaceRegistry[${index}].surfaceId`);
    assertNonEmptyString(surfaceRaw.nextAction, `surfaceRegistry[${index}].nextAction`);
    surfaceRegistry.set(surfaceRaw.surfaceId.trim(), {
      surfaceId: surfaceRaw.surfaceId.trim(),
      nextAction: surfaceRaw.nextAction.trim(),
    });
  }

  return surfaceRegistry;
}

/**
 * Normalizes standards injection defaults for env parity checks.
 * @param {unknown} standardsContractRaw Parsed standards injection contract.
 * @returns {{defaultStandardsProfileId: string; defaultSourceIds: string[]; selfHostedSourceRegistry: Array<{sourceId: string; defaultSelfHostedPath: string}>}}
 */
function normalizeStandardsContract(standardsContractRaw) {
  if (
    !standardsContractRaw ||
    typeof standardsContractRaw !== 'object' ||
    Array.isArray(standardsContractRaw)
  ) {
    throw new Error('standards-injection contract must be an object.');
  }
  assertNonEmptyString(standardsContractRaw.defaultStandardsProfileId, 'defaultStandardsProfileId');
  if (
    !Array.isArray(standardsContractRaw.defaultSourceIds) ||
    standardsContractRaw.defaultSourceIds.length === 0
  ) {
    throw new Error('standards-injection contract must declare non-empty defaultSourceIds.');
  }
  if (
    !Array.isArray(standardsContractRaw.selfHostedSourceRegistry) ||
    standardsContractRaw.selfHostedSourceRegistry.length === 0
  ) {
    throw new Error(
      'standards-injection contract must declare non-empty selfHostedSourceRegistry.',
    );
  }

  return {
    defaultStandardsProfileId: standardsContractRaw.defaultStandardsProfileId.trim(),
    defaultSourceIds: standardsContractRaw.defaultSourceIds.map((entry, index) => {
      assertNonEmptyString(entry, `defaultSourceIds[${index}]`);
      return entry.trim();
    }),
    selfHostedSourceRegistry: standardsContractRaw.selfHostedSourceRegistry.map((entry, index) => {
      if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
        throw new Error(`selfHostedSourceRegistry[${index}] must be an object.`);
      }
      assertNonEmptyString(entry.sourceId, `selfHostedSourceRegistry[${index}].sourceId`);
      assertNonEmptyString(
        entry.defaultSelfHostedPath,
        `selfHostedSourceRegistry[${index}].defaultSelfHostedPath`,
      );
      return {
        sourceId: entry.sourceId.trim(),
        defaultSelfHostedPath: entry.defaultSelfHostedPath.trim(),
      };
    }),
  };
}

/**
 * Validates one template env block against the standards baseline.
 * @param {Record<string, unknown>} env Template env payload.
 * @param {string} surfaceId Expected surface id.
 * @param {{defaultStandardsProfileId: string; defaultSourceIds: string[]; selfHostedSourceRegistry: Array<{sourceId: string; defaultSelfHostedPath: string}>}} standardsContract Normalized standards baseline.
 * @param {string} fieldPrefix Diagnostic field prefix.
 */
function validateTemplateEnv(env, surfaceId, standardsContract, fieldPrefix) {
  if (!env || typeof env !== 'object' || Array.isArray(env)) {
    throw new Error(`${fieldPrefix} must be an object.`);
  }

  const expectedStandardsSources = standardsContract.defaultSourceIds.join(',');
  const normalizedEnv = /** @type {Record<string, unknown>} */ (env);
  if (normalizedEnv.REPO_AI_GOVERNOR_OUTPUT_MODE !== 'json') {
    throw new Error(`${fieldPrefix}.REPO_AI_GOVERNOR_OUTPUT_MODE must equal "json".`);
  }
  if (normalizedEnv.REPO_AI_GOVERNOR_ENTRY_SURFACE !== surfaceId) {
    throw new Error(`${fieldPrefix}.REPO_AI_GOVERNOR_ENTRY_SURFACE must equal "${surfaceId}".`);
  }
  if (
    normalizedEnv.REPO_AI_GOVERNOR_STANDARDS_PROFILE_ID !==
    standardsContract.defaultStandardsProfileId
  ) {
    throw new Error(
      `${fieldPrefix}.REPO_AI_GOVERNOR_STANDARDS_PROFILE_ID must equal "${standardsContract.defaultStandardsProfileId}".`,
    );
  }
  if (normalizedEnv.REPO_AI_GOVERNOR_STANDARDS_SOURCES !== expectedStandardsSources) {
    throw new Error(
      `${fieldPrefix}.REPO_AI_GOVERNOR_STANDARDS_SOURCES must preserve the default ordered source IDs.`,
    );
  }
}

/**
 * Validates one Cursor task template.
 * @param {unknown} templateRaw Parsed Cursor task template JSON.
 * @param {{defaultStandardsProfileId: string; defaultSourceIds: string[]; selfHostedSourceRegistry: Array<{sourceId: string; defaultSelfHostedPath: string}>}} standardsContract Normalized standards baseline.
 */
function validateCursorTemplate(templateRaw, standardsContract) {
  if (!templateRaw || typeof templateRaw !== 'object' || Array.isArray(templateRaw)) {
    throw new Error('Cursor task template must be an object.');
  }
  if (
    !Array.isArray(templateRaw.tasks) ||
    templateRaw.tasks.length !== REQUIRED_COMMAND_SEQUENCE.length
  ) {
    throw new Error('Cursor task template must declare init/doctor/check tasks.');
  }

  for (const commandName of REQUIRED_COMMAND_SEQUENCE) {
    const task = templateRaw.tasks.find(
      (entry) => entry?.label === `repo-ai-governor: ${commandName}`,
    );
    if (!task) {
      throw new Error(`Cursor task template is missing command "${commandName}".`);
    }
    validateTemplateEnv(
      task.options?.env,
      CURSOR_SURFACE_ID,
      standardsContract,
      `${commandName}.env`,
    );
  }
}

/**
 * Validates one Claude Code command manifest and common errors.
 * @param {unknown} templateRaw Parsed Claude Code template JSON.
 * @param {{defaultStandardsProfileId: string; defaultSourceIds: string[]; selfHostedSourceRegistry: Array<{sourceId: string; defaultSelfHostedPath: string}>}} standardsContract Normalized standards baseline.
 * @param {string} claudeNextAction Required surface nextAction from contract.
 * @param {string} examplesReadmeText Examples README text for parity checks.
 */
function validateClaudeCodeTemplate(
  templateRaw,
  standardsContract,
  claudeNextAction,
  examplesReadmeText,
) {
  if (!templateRaw || typeof templateRaw !== 'object' || Array.isArray(templateRaw)) {
    throw new Error('Claude Code command template must be an object.');
  }
  if (templateRaw.surface !== CLAUDE_CODE_SURFACE_ID) {
    throw new Error('Claude Code command template must declare surface="claude_code".');
  }
  if (
    !Array.isArray(templateRaw.commands) ||
    templateRaw.commands.length !== REQUIRED_COMMAND_SEQUENCE.length
  ) {
    throw new Error('Claude Code command template must declare init/doctor/check commands.');
  }

  for (const commandName of REQUIRED_COMMAND_SEQUENCE) {
    const command = templateRaw.commands.find(
      (entry) => entry?.label === `repo-ai-governor:${commandName}`,
    );
    if (!command) {
      throw new Error(`Claude Code command template is missing command "${commandName}".`);
    }
    validateTemplateEnv(
      command.env,
      CLAUDE_CODE_SURFACE_ID,
      standardsContract,
      `${commandName}.env`,
    );
    if (command.nextActionOnFailure !== claudeNextAction) {
      throw new Error(
        `Claude Code "${commandName}" nextActionOnFailure must match the surface registry nextAction.`,
      );
    }
  }

  if (!Array.isArray(templateRaw.commonErrors) || templateRaw.commonErrors.length === 0) {
    throw new Error('Claude Code command template must declare commonErrors.');
  }

  const invalidWrapperError = templateRaw.commonErrors.find(
    (entry) => entry?.errorCode === 'ENTRYPOINT_COMMAND_WRAPPER_INVALID',
  );
  if (!invalidWrapperError || invalidWrapperError.nextAction !== claudeNextAction) {
    throw new Error(
      'Claude Code command template must align ENTRYPOINT_COMMAND_WRAPPER_INVALID nextAction with the surface registry.',
    );
  }
  const configValidationError = templateRaw.commonErrors.find(
    (entry) => entry?.errorCode === 'CONFIG_SCHEMA_VALIDATION_FAILED',
  );
  if (
    !configValidationError ||
    configValidationError.nextAction !==
      'Add the repo-local governor.yaml baseline before invoking Claude Code commands.'
  ) {
    throw new Error(
      'Claude Code command template must declare the repo-local governor.yaml recovery guidance.',
    );
  }

  assertTextIncludes(
    examplesReadmeText,
    configValidationError.nextAction,
    'integrations/ide/examples/README.md',
  );
}

try {
  ensureFileExists(COMMAND_WRAPPER_CONTRACT_PATH);
  ensureFileExists(STANDARDS_INJECTION_CONTRACT_PATH);
  ensureFileExists(IDE_README_PATH);
  ensureFileExists(IDE_EXAMPLES_README_PATH);
  ensureFileExists(CURSOR_TASK_SAMPLE_PATH);
  ensureFileExists(CLAUDE_CODE_COMMANDS_SAMPLE_PATH);

  const ideReadmeText = readText(IDE_README_PATH);
  const examplesReadmeText = readText(IDE_EXAMPLES_README_PATH);
  const surfaceRegistry = normalizeSurfaceRegistry(readJson(COMMAND_WRAPPER_CONTRACT_PATH));
  const standardsContract = normalizeStandardsContract(readJson(STANDARDS_INJECTION_CONTRACT_PATH));

  const cursorSurface = surfaceRegistry.get(CURSOR_SURFACE_ID);
  const claudeCodeSurface = surfaceRegistry.get(CLAUDE_CODE_SURFACE_ID);
  if (!cursorSurface || !claudeCodeSurface) {
    throw new Error('command-wrapper contract must declare Cursor and Claude Code surfaces.');
  }

  assertTextIncludes(ideReadmeText, 'cursor-task.sample.json', IDE_README_PATH);
  assertTextIncludes(ideReadmeText, 'claude-code-commands.sample.json', IDE_README_PATH);
  assertTextIncludes(ideReadmeText, 'check:ide-docs-parity', IDE_README_PATH);
  assertTextIncludes(ideReadmeText, 'source IDs', IDE_README_PATH);
  assertTextIncludes(examplesReadmeText, 'cursor-task.sample.json', IDE_EXAMPLES_README_PATH);
  assertTextIncludes(
    examplesReadmeText,
    'claude-code-commands.sample.json',
    IDE_EXAMPLES_README_PATH,
  );
  assertTextIncludes(examplesReadmeText, 'source IDs', IDE_EXAMPLES_README_PATH);
  assertTextIncludes(examplesReadmeText, cursorSurface.nextAction, IDE_EXAMPLES_README_PATH);
  assertTextIncludes(examplesReadmeText, claudeCodeSurface.nextAction, IDE_EXAMPLES_README_PATH);
  for (const sourceId of standardsContract.defaultSourceIds) {
    assertTextIncludes(examplesReadmeText, sourceId, IDE_EXAMPLES_README_PATH);
  }
  for (const sourceDescriptor of standardsContract.selfHostedSourceRegistry) {
    assertTextIncludes(
      readText(STANDARDS_INJECTION_CONTRACT_PATH),
      sourceDescriptor.defaultSelfHostedPath,
      STANDARDS_INJECTION_CONTRACT_PATH,
    );
  }

  validateCursorTemplate(readJson(CURSOR_TASK_SAMPLE_PATH), standardsContract);
  validateClaudeCodeTemplate(
    readJson(CLAUDE_CODE_COMMANDS_SAMPLE_PATH),
    standardsContract,
    claudeCodeSurface.nextAction,
    examplesReadmeText,
  );

  gatePass(GATE_NAME, 'Cursor and Claude Code contracts/examples/docs parity checks passed.');
} catch (error) {
  gateFail(GATE_NAME, error instanceof Error ? error.message : String(error));
  process.exit(1);
}
