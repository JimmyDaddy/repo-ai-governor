#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import { gateFail, gateInfo, gatePass } from '../governance/gate-output.js';

const GATE_NAME = 'ide-entry-smoke';
const DIST_CLI_ENTRY_PATH = 'dist/bin/repo-ai-governor.js';
const COMMAND_WRAPPER_CONTRACT_PATH = 'integrations/ide/contracts/command-wrapper.contract.json';
const STANDARDS_INJECTION_CONTRACT_PATH =
  'integrations/ide/contracts/standards-injection.contract.json';
const IDE_EXAMPLES_README_PATH = 'integrations/ide/examples/README.md';
const VSCODE_TASK_SAMPLE_PATH = 'integrations/ide/examples/vscode-task.sample.json';
const VSCODE_LAUNCH_SAMPLE_PATH = 'integrations/ide/examples/vscode-launch.sample.json';
const JETBRAINS_RUN_CONFIGURATION_SAMPLE_PATH =
  'integrations/ide/examples/jetbrains-run-configuration.sample.xml';
const CURSOR_TASK_SAMPLE_PATH = 'integrations/ide/examples/cursor-task.sample.json';
const CLAUDE_CODE_COMMANDS_SAMPLE_PATH =
  'integrations/ide/examples/claude-code-commands.sample.json';
const REQUIRED_COMMAND_SEQUENCE = ['init', 'doctor', 'check'];
const EXPECTED_OPERATION_BY_COMMAND = {
  init: 'workspace_init',
  doctor: 'env_doctor',
  check: 'governance_check',
};

/**
 * Reads UTF-8 text from one repository-relative path.
 * @param {string} relativePath Repository-relative path.
 * @returns {string}
 */
function readText(relativePath) {
  return readFileSync(resolve(process.cwd(), relativePath), 'utf8');
}

/**
 * Reads JSON from one repository-relative path.
 * @param {string} relativePath Repository-relative path.
 * @returns {unknown}
 */
function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

/**
 * Throws when one candidate value is not a non-empty string.
 * @param {unknown} value Candidate field value.
 * @param {string} fieldName Field name for diagnostics.
 */
function assertNonEmptyString(value, fieldName) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`Field "${fieldName}" must be a non-empty string.`);
  }
}

/**
 * Validates one required file exists.
 * @param {string} relativePath Repository-relative path.
 */
function ensureFileExists(relativePath) {
  if (!existsSync(resolve(process.cwd(), relativePath))) {
    throw new Error(`required file is missing: ${relativePath}`);
  }
}

/**
 * Normalizes wrapper contract payload used by IDE templates.
 * @param {unknown} contractRaw Parsed command-wrapper contract.
 * @returns {{environmentKeys: string[]; defaultStandardsProfileId: string; defaultSourceIds: string[]}}
 */
function normalizeContracts(contractRaw, standardsContractRaw) {
  if (!contractRaw || typeof contractRaw !== 'object' || Array.isArray(contractRaw)) {
    throw new Error('command-wrapper contract must be an object.');
  }
  if (
    !standardsContractRaw ||
    typeof standardsContractRaw !== 'object' ||
    Array.isArray(standardsContractRaw)
  ) {
    throw new Error('standards-injection contract must be an object.');
  }
  if (!Array.isArray(contractRaw.environmentKeys) || contractRaw.environmentKeys.length === 0) {
    throw new Error('command-wrapper contract must declare environmentKeys.');
  }
  if (
    !Array.isArray(standardsContractRaw.defaultSourceIds) ||
    standardsContractRaw.defaultSourceIds.length === 0
  ) {
    throw new Error('standards-injection contract must declare defaultSourceIds.');
  }
  assertNonEmptyString(standardsContractRaw.defaultStandardsProfileId, 'defaultStandardsProfileId');

  return {
    environmentKeys: contractRaw.environmentKeys.map((entry, index) => {
      assertNonEmptyString(entry, `environmentKeys[${index}]`);
      return entry.trim();
    }),
    defaultStandardsProfileId: standardsContractRaw.defaultStandardsProfileId.trim(),
    defaultSourceIds: standardsContractRaw.defaultSourceIds.map((entry, index) => {
      assertNonEmptyString(entry, `defaultSourceIds[${index}]`);
      return entry.trim();
    }),
  };
}

/**
 * Normalizes VS Code task template.
 * @param {unknown} templateRaw Parsed task JSON.
 * @returns {Map<string, {command: string; args: string[]; env: Record<string, string>}>}
 */
function normalizeVsCodeTasks(templateRaw) {
  if (!templateRaw || typeof templateRaw !== 'object' || Array.isArray(templateRaw)) {
    throw new Error('VS Code task template must be an object.');
  }
  if (!Array.isArray(templateRaw.tasks) || templateRaw.tasks.length === 0) {
    throw new Error('VS Code task template must declare non-empty tasks array.');
  }

  const tasksByCommand = new Map();
  for (const [index, taskRaw] of templateRaw.tasks.entries()) {
    if (!taskRaw || typeof taskRaw !== 'object' || Array.isArray(taskRaw)) {
      throw new Error(`VS Code task[${index}] must be an object.`);
    }

    assertNonEmptyString(taskRaw.label, `tasks[${index}].label`);
    assertNonEmptyString(taskRaw.command, `tasks[${index}].command`);
    if (!Array.isArray(taskRaw.args) || taskRaw.args.length === 0) {
      throw new Error(`tasks[${index}].args must be a non-empty array.`);
    }

    const commandName = String(taskRaw.label).replace('repo-ai-governor: ', '').trim();
    const args = taskRaw.args.map((arg, argIndex) => {
      assertNonEmptyString(arg, `tasks[${index}].args[${argIndex}]`);
      return arg.trim();
    });
    const env = normalizeTemplateEnv(taskRaw.options?.env, `tasks[${index}].options.env`);

    tasksByCommand.set(commandName, {
      command: taskRaw.command.trim(),
      args,
      env,
    });
  }

  return tasksByCommand;
}

/**
 * Normalizes Claude Code command manifest.
 * @param {unknown} templateRaw Parsed command manifest JSON.
 * @returns {{surface: string; commandsByName: Map<string, {command: string; args: string[]; env: Record<string, string>; nextActionOnFailure: string}>}}
 */
function normalizeClaudeCodeCommands(templateRaw) {
  if (!templateRaw || typeof templateRaw !== 'object' || Array.isArray(templateRaw)) {
    throw new Error('Claude Code command template must be an object.');
  }
  assertNonEmptyString(templateRaw.surface, 'surface');
  if (!Array.isArray(templateRaw.commands) || templateRaw.commands.length === 0) {
    throw new Error('Claude Code command template must declare non-empty commands array.');
  }

  const commandsByName = new Map();
  for (const [index, commandRaw] of templateRaw.commands.entries()) {
    if (!commandRaw || typeof commandRaw !== 'object' || Array.isArray(commandRaw)) {
      throw new Error(`commands[${index}] must be an object.`);
    }
    assertNonEmptyString(commandRaw.label, `commands[${index}].label`);
    assertNonEmptyString(commandRaw.command, `commands[${index}].command`);
    assertNonEmptyString(commandRaw.nextActionOnFailure, `commands[${index}].nextActionOnFailure`);
    if (!Array.isArray(commandRaw.args) || commandRaw.args.length === 0) {
      throw new Error(`commands[${index}].args must be a non-empty array.`);
    }

    const commandName = String(commandRaw.label).replace('repo-ai-governor:', '').trim();
    const args = commandRaw.args.map((arg, argIndex) => {
      assertNonEmptyString(arg, `commands[${index}].args[${argIndex}]`);
      return arg.trim();
    });

    commandsByName.set(commandName, {
      command: commandRaw.command.trim(),
      args,
      env: normalizeTemplateEnv(commandRaw.env, `commands[${index}].env`),
      nextActionOnFailure: commandRaw.nextActionOnFailure.trim(),
    });
  }

  return {
    surface: templateRaw.surface.trim(),
    commandsByName,
  };
}

/**
 * Normalizes VS Code launch template.
 * @param {unknown} templateRaw Parsed launch JSON.
 * @returns {{program: string; args: string[]; env: Record<string, string>}}
 */
function normalizeVsCodeLaunch(templateRaw) {
  if (!templateRaw || typeof templateRaw !== 'object' || Array.isArray(templateRaw)) {
    throw new Error('VS Code launch template must be an object.');
  }
  if (
    !Array.isArray(templateRaw.configurations) ||
    templateRaw.configurations.length === 0 ||
    !templateRaw.configurations[0]
  ) {
    throw new Error('VS Code launch template must declare one configuration.');
  }

  const launchConfig = templateRaw.configurations[0];
  assertNonEmptyString(launchConfig.program, 'configurations[0].program');
  if (!Array.isArray(launchConfig.args) || launchConfig.args.length === 0) {
    throw new Error('configurations[0].args must be a non-empty array.');
  }

  return {
    program: launchConfig.program.trim(),
    args: launchConfig.args.map((arg, index) => {
      assertNonEmptyString(arg, `configurations[0].args[${index}]`);
      return arg.trim();
    }),
    env: normalizeTemplateEnv(launchConfig.env, 'configurations[0].env'),
  };
}

/**
 * Normalizes JetBrains run configuration XML using simple configuration blocks.
 * @param {string} xmlText XML template text.
 * @returns {Map<string, {command: string; args: string[]; env: Record<string, string>}>}
 */
function normalizeJetBrainsRunConfigurations(xmlText) {
  const configurationPattern =
    /<configuration name="([^"]+)" type="ShConfigurationType">([\s\S]*?)<\/configuration>/gmu;
  const configurationByCommand = new Map();
  let matchedConfiguration = configurationPattern.exec(xmlText);
  while (matchedConfiguration) {
    const configurationName = matchedConfiguration[1]?.trim() ?? '';
    const configurationBody = matchedConfiguration[2] ?? '';
    const commandName = configurationName.replace('repo-ai-governor: ', '').trim();
    const scriptMatch = configurationBody.match(/<option name="SCRIPT_TEXT" value="([^"]+)" \/>/u);
    if (!scriptMatch) {
      throw new Error(`JetBrains configuration is missing SCRIPT_TEXT: ${configurationName}`);
    }

    const env = {};
    const envPattern = /<env name="([^"]+)" value="([^"]*)" \/>/gmu;
    let matchedEnv = envPattern.exec(configurationBody);
    while (matchedEnv) {
      env[matchedEnv[1]] = matchedEnv[2];
      matchedEnv = envPattern.exec(configurationBody);
    }

    const tokens = scriptMatch[1].trim().split(/\s+/u);
    if (tokens.length < 2) {
      throw new Error(
        `JetBrains configuration must declare command and args: ${configurationName}`,
      );
    }

    configurationByCommand.set(commandName, {
      command: tokens[0],
      args: tokens.slice(1),
      env,
    });

    matchedConfiguration = configurationPattern.exec(xmlText);
  }

  if (configurationByCommand.size === 0) {
    throw new Error(
      'JetBrains run configuration template must declare at least one configuration.',
    );
  }

  return configurationByCommand;
}

/**
 * Normalizes template env payload.
 * @param {unknown} envRaw Raw env payload.
 * @param {string} fieldName Field name for diagnostics.
 * @returns {Record<string, string>}
 */
function normalizeTemplateEnv(envRaw, fieldName) {
  if (!envRaw || typeof envRaw !== 'object' || Array.isArray(envRaw)) {
    throw new Error(`${fieldName} must be an object.`);
  }

  const normalizedEnv = {};
  for (const [envKey, envValue] of Object.entries(envRaw)) {
    assertNonEmptyString(envKey, `${fieldName}.key`);
    assertNonEmptyString(envValue, `${fieldName}.${envKey}`);
    normalizedEnv[envKey.trim()] = envValue.trim();
  }
  return normalizedEnv;
}

/**
 * Validates one template command definition against expected wrapper baseline.
 * @param {{command: string; args: string[]; env: Record<string, string>}} definition Template definition.
 * @param {string} commandName CLI command name.
 * @param {string} surface Surface identifier.
 * @param {{environmentKeys: string[]; defaultStandardsProfileId: string; defaultSourceIds: string[]}} contract Wrapper contract baseline.
 */
function validateTemplateDefinition(definition, commandName, surface, contract) {
  if (!definition) {
    throw new Error(`template definition is missing for command "${commandName}"`);
  }
  if (definition.command !== 'node') {
    throw new Error(`template command "${commandName}" must use "node".`);
  }

  const expectedArgs = [
    './dist/bin/repo-ai-governor.js',
    '--output',
    'json',
    '--locale',
    'en-US',
    commandName,
  ];
  if (JSON.stringify(definition.args) !== JSON.stringify(expectedArgs)) {
    throw new Error(
      `template args for "${commandName}" do not match expected baseline. expected=${JSON.stringify(expectedArgs)} actual=${JSON.stringify(definition.args)}`,
    );
  }

  for (const envKey of contract.environmentKeys) {
    if (!(envKey in definition.env)) {
      throw new Error(`template env for "${commandName}" is missing "${envKey}"`);
    }
  }

  if (definition.env.REPO_AI_GOVERNOR_OUTPUT_MODE !== 'json') {
    throw new Error(`template env for "${commandName}" must pin REPO_AI_GOVERNOR_OUTPUT_MODE=json`);
  }
  if (definition.env.REPO_AI_GOVERNOR_ENTRY_SURFACE !== surface) {
    throw new Error(
      `template env for "${commandName}" must pin REPO_AI_GOVERNOR_ENTRY_SURFACE=${surface}`,
    );
  }
  if (definition.env.REPO_AI_GOVERNOR_STANDARDS_PROFILE_ID !== contract.defaultStandardsProfileId) {
    throw new Error(
      `template env for "${commandName}" must pin REPO_AI_GOVERNOR_STANDARDS_PROFILE_ID=${contract.defaultStandardsProfileId}`,
    );
  }

  const expectedStandardsSources = contract.defaultSourceIds.join(',');
  if (definition.env.REPO_AI_GOVERNOR_STANDARDS_SOURCES !== expectedStandardsSources) {
    throw new Error(
      `template env for "${commandName}" must pin REPO_AI_GOVERNOR_STANDARDS_SOURCES to the default source ID order.`,
    );
  }
}

/**
 * Executes one command sequence in a temporary repository and validates JSON operations.
 * @param {string} surface Surface id for diagnostics.
 * @param {Map<string, {command: string; args: string[]; env: Record<string, string>}>} definitions Definitions keyed by command.
 */
function runRuntimeSmoke(surface, definitions) {
  const repoRoot = mkdtempSync(join(tmpdir(), `repo-ai-governor-${surface}-smoke-`));
  const linkedDistPath = resolve(repoRoot, 'dist');
  const sourceDistPath = resolve(process.cwd(), 'dist');
  const workspaceDirectoryPath = resolve(repoRoot, '.repo-ai-governor');
  const governorConfigPath = resolve(workspaceDirectoryPath, 'governor.yaml');

  try {
    symlinkSync(sourceDistPath, linkedDistPath, 'dir');
    mkdirSync(workspaceDirectoryPath, { recursive: true });
    writeFileSync(
      governorConfigPath,
      [
        'schemaVersion: "1.1"',
        'workspace:',
        '  mode: repo_local',
        '  migrationPolicy: copy_verify_switch_rollback',
        'i18n:',
        '  runtimeEngine: i18next',
        '  defaultLocale: zh-CN',
        '  fallbackLocale: en-US',
        '  supportedLocales:',
        '    - zh-CN',
        '    - en-US',
        '',
      ].join('\n'),
    );

    for (const commandName of REQUIRED_COMMAND_SEQUENCE) {
      const definition = definitions.get(commandName);
      if (!definition) {
        throw new Error(`${surface} template is missing command "${commandName}"`);
      }

      const result = spawnSync(definition.command, definition.args, {
        cwd: repoRoot,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
        env: {
          ...process.env,
          ...definition.env,
        },
      });

      if (result.error) {
        throw new Error(`${surface} ${commandName} failed to execute: ${result.error.message}`);
      }
      if (result.status !== 0) {
        throw new Error(
          `${surface} ${commandName} exited with code ${result.status}. stdout="${result.stdout?.trim() ?? ''}" stderr="${result.stderr?.trim() ?? ''}"`,
        );
      }

      let payload;
      try {
        payload = JSON.parse(result.stdout ?? '');
      } catch {
        throw new Error(`${surface} ${commandName} did not emit valid JSON stdout.`);
      }

      const actualOperation = payload.command_result?.operation;
      const expectedOperation = EXPECTED_OPERATION_BY_COMMAND[commandName];
      if (actualOperation !== expectedOperation) {
        throw new Error(
          `${surface} ${commandName} returned operation "${String(actualOperation)}", expected "${expectedOperation}".`,
        );
      }
    }

    gateInfo(GATE_NAME, `${surface} template runtime smoke passed.`);
  } finally {
    rmSync(repoRoot, { recursive: true, force: true });
  }
}

try {
  ensureFileExists(DIST_CLI_ENTRY_PATH);
  ensureFileExists(IDE_EXAMPLES_README_PATH);
  ensureFileExists(VSCODE_TASK_SAMPLE_PATH);
  ensureFileExists(VSCODE_LAUNCH_SAMPLE_PATH);
  ensureFileExists(JETBRAINS_RUN_CONFIGURATION_SAMPLE_PATH);
  ensureFileExists(CURSOR_TASK_SAMPLE_PATH);
  ensureFileExists(CLAUDE_CODE_COMMANDS_SAMPLE_PATH);

  const contract = normalizeContracts(
    readJson(COMMAND_WRAPPER_CONTRACT_PATH),
    readJson(STANDARDS_INJECTION_CONTRACT_PATH),
  );

  const vscodeTasks = normalizeVsCodeTasks(readJson(VSCODE_TASK_SAMPLE_PATH));
  for (const commandName of REQUIRED_COMMAND_SEQUENCE) {
    validateTemplateDefinition(vscodeTasks.get(commandName), commandName, 'vscode', contract);
  }

  const vscodeLaunch = normalizeVsCodeLaunch(readJson(VSCODE_LAUNCH_SAMPLE_PATH));
  if (vscodeLaunch.program !== '${workspaceFolder}/dist/bin/repo-ai-governor.js') {
    throw new Error(
      'VS Code launch template must point to ${workspaceFolder}/dist/bin/repo-ai-governor.js.',
    );
  }
  validateTemplateDefinition(
    {
      command: 'node',
      args: ['./dist/bin/repo-ai-governor.js', ...vscodeLaunch.args],
      env: vscodeLaunch.env,
    },
    'check',
    'vscode',
    contract,
  );

  const jetbrainsConfigurations = normalizeJetBrainsRunConfigurations(
    readText(JETBRAINS_RUN_CONFIGURATION_SAMPLE_PATH),
  );
  for (const commandName of REQUIRED_COMMAND_SEQUENCE) {
    validateTemplateDefinition(
      jetbrainsConfigurations.get(commandName),
      commandName,
      'jetbrains',
      contract,
    );
  }

  const cursorTasks = normalizeVsCodeTasks(readJson(CURSOR_TASK_SAMPLE_PATH));
  for (const commandName of REQUIRED_COMMAND_SEQUENCE) {
    validateTemplateDefinition(cursorTasks.get(commandName), commandName, 'cursor', contract);
  }

  const claudeCodeCommands = normalizeClaudeCodeCommands(
    readJson(CLAUDE_CODE_COMMANDS_SAMPLE_PATH),
  );
  if (claudeCodeCommands.surface !== 'claude_code') {
    throw new Error('Claude Code command template must declare surface="claude_code".');
  }
  for (const commandName of REQUIRED_COMMAND_SEQUENCE) {
    validateTemplateDefinition(
      claudeCodeCommands.commandsByName.get(commandName),
      commandName,
      'claude_code',
      contract,
    );
  }

  runRuntimeSmoke('vscode', vscodeTasks);
  runRuntimeSmoke('jetbrains', jetbrainsConfigurations);
  runRuntimeSmoke('cursor', cursorTasks);
  runRuntimeSmoke('claude_code', claudeCodeCommands.commandsByName);

  gatePass(
    GATE_NAME,
    'VS Code, JetBrains, Cursor, and Claude Code official template smoke checks passed.',
  );
} catch (error) {
  gateFail(GATE_NAME, error instanceof Error ? error.message : String(error));
  process.exit(1);
}
