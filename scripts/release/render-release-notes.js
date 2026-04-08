#!/usr/bin/env node

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

import { gateFail, gateInfo, gatePass } from '../governance/gate-output.js';

const GATE_NAME = 'release-notes';
const RELEASE_POLICY_CONFIG_PATH = 'scripts/release/release-governance-policy.json';
const PACKAGE_JSON_PATH = 'package.json';

/**
 * Reads one JSON file from repository root.
 * @param {string} relativePath Relative file path from repository root.
 * @returns {unknown}
 */
function readJsonFile(relativePath) {
  const absolutePath = resolve(process.cwd(), relativePath);
  const rawContent = readFileSync(absolutePath, 'utf8');
  return JSON.parse(rawContent);
}

/**
 * Parses one optional `--output <path>` argument.
 * @returns {{outputPath: string | null}}
 */
function parseCliArguments() {
  const rawArgs = process.argv.slice(2);
  const outputIndex = rawArgs.findIndex((arg) => arg === '--output');
  if (outputIndex === -1) {
    return { outputPath: null };
  }

  const outputPath = rawArgs[outputIndex + 1];
  if (typeof outputPath !== 'string' || outputPath.trim().length === 0) {
    throw new Error('Expected non-empty value after "--output".');
  }

  return { outputPath: outputPath.trim() };
}

/**
 * Reads one required array of strings from a generic object.
 * @param {unknown} rawObject Candidate object.
 * @param {string} fieldName Field key.
 * @returns {string[]}
 */
function readRequiredStringArray(rawObject, fieldName) {
  if (!rawObject || typeof rawObject !== 'object') {
    throw new Error(`Expected object to read "${fieldName}".`);
  }

  const value = rawObject[fieldName];
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`Expected non-empty array field "${fieldName}".`);
  }

  const items = [];
  for (const item of value) {
    if (typeof item !== 'string' || item.trim().length === 0) {
      throw new Error(`Field "${fieldName}" must contain non-empty strings.`);
    }
    items.push(item.trim());
  }

  return items;
}

/**
 * Renders one markdown bullet list.
 * @param {string[]} values String values.
 * @returns {string}
 */
function renderBulletList(values) {
  return values.map((value) => `- ${value}`).join('\n');
}

/**
 * Reads one required entry-command string from a generic object.
 * @param {unknown} rawObject Candidate object.
 * @param {string} fieldName Field key.
 * @returns {string}
 */
function readRequiredEntryCommand(rawObject, fieldName) {
  if (!rawObject || typeof rawObject !== 'object') {
    throw new Error(`Expected object to read "${fieldName}".`);
  }

  const entryCommand = rawObject[fieldName];
  if (typeof entryCommand !== 'string' || entryCommand.trim().length === 0) {
    throw new Error(`Expected non-empty string field "${fieldName}".`);
  }

  return entryCommand.trim();
}

/**
 * Collects verification commands from policy-defined channel checks and GA gate config.
 * Why: release notes should stay aligned with the authoritative release-governance policy
 * instead of maintaining a second hardcoded checklist.
 * @param {unknown} policyConfig Parsed release policy config.
 * @returns {string[]}
 */
function collectVerificationCommands(policyConfig) {
  if (!policyConfig || typeof policyConfig !== 'object') {
    throw new Error('release-governance-policy payload is invalid.');
  }

  const channels = policyConfig.channels;
  if (!Array.isArray(channels) || channels.length === 0) {
    throw new Error('release-governance-policy must define channels.');
  }

  const collectedCommands = [];
  const seenCommands = new Set();
  const appendCommand = (command) => {
    if (seenCommands.has(command)) {
      return;
    }
    seenCommands.add(command);
    collectedCommands.push(command);
  };

  for (const channel of channels) {
    const requiredChecks = readRequiredStringArray(channel, 'requiredChecks');
    for (const requiredCheck of requiredChecks) {
      appendCommand(requiredCheck);
    }
  }

  appendCommand(readRequiredEntryCommand(policyConfig.rollbackRehearsal, 'entryCommand'));
  appendCommand(readRequiredEntryCommand(policyConfig.gaCandidateUnifiedGate, 'entryCommand'));
  return collectedCommands;
}

/**
 * Builds markdown release notes text from policy and package metadata.
 * @param {unknown} packageJson Parsed package metadata.
 * @param {unknown} policyConfig Parsed release policy config.
 * @returns {string}
 */
function buildReleaseNotesMarkdown(packageJson, policyConfig) {
  if (!packageJson || typeof packageJson !== 'object') {
    throw new Error('package.json payload is invalid.');
  }
  if (!policyConfig || typeof policyConfig !== 'object') {
    throw new Error('release-governance-policy payload is invalid.');
  }

  const version = typeof packageJson.version === 'string' ? packageJson.version : 'unknown';
  const generatedAt = new Date().toISOString();

  const versioningStrategy = policyConfig.versioningStrategy;
  const lockstepPackages = readRequiredStringArray(versioningStrategy, 'lockstep');
  const independentPackages = readRequiredStringArray(versioningStrategy, 'independent');
  const rollbackTriggers = readRequiredStringArray(policyConfig, 'rollbackTriggers');
  const minimumAuditEvidence = readRequiredStringArray(policyConfig, 'minimumAuditEvidence');

  const channels = policyConfig.channels;
  if (!Array.isArray(channels) || channels.length === 0) {
    throw new Error('release-governance-policy must define channels.');
  }
  const verificationCommands = collectVerificationCommands(policyConfig);

  const channelMarkdownBlocks = channels.map((channel) => {
    if (!channel || typeof channel !== 'object') {
      throw new Error('channel entry must be an object.');
    }

    const channelName = typeof channel.name === 'string' ? channel.name.trim() : '';
    if (channelName.length === 0) {
      throw new Error('channel entry must define name.');
    }

    const requiredChecks = readRequiredStringArray(channel, 'requiredChecks');
    const promotionCriteria = readRequiredStringArray(channel, 'promotionCriteria');

    return [
      `### ${channelName}`,
      '',
      '**Required Checks**',
      renderBulletList(requiredChecks),
      '',
      '**Promotion Criteria**',
      renderBulletList(promotionCriteria),
    ].join('\n');
  });

  return [
    '# Release Notes Draft',
    '',
    `- Version: ${version}`,
    `- Generated At: ${generatedAt}`,
    '',
    '## Versioning Strategy',
    '',
    '**Lockstep Packages**',
    renderBulletList(lockstepPackages),
    '',
    '**Independent Packages**',
    renderBulletList(independentPackages),
    '',
    '## Channel Policy',
    '',
    channelMarkdownBlocks.join('\n\n'),
    '',
    '## Rollback Triggers',
    '',
    renderBulletList(rollbackTriggers),
    '',
    '## Minimum Audit Evidence',
    '',
    renderBulletList(minimumAuditEvidence),
    '',
    '## Verification Commands',
    '',
    renderBulletList(verificationCommands.map((command) => `\`${command}\``)),
    '',
  ].join('\n');
}

try {
  const args = parseCliArguments();
  const packageJson = readJsonFile(PACKAGE_JSON_PATH);
  const policyConfig = readJsonFile(RELEASE_POLICY_CONFIG_PATH);
  const markdown = buildReleaseNotesMarkdown(packageJson, policyConfig);

  if (args.outputPath) {
    const absoluteOutputPath = resolve(process.cwd(), args.outputPath);
    mkdirSync(dirname(absoluteOutputPath), { recursive: true });
    writeFileSync(absoluteOutputPath, markdown, 'utf8');
    gateInfo(GATE_NAME, `release notes generated at ${args.outputPath}`);
  } else {
    process.stdout.write(`${markdown}\n`);
    gateInfo(GATE_NAME, 'release notes printed to stdout.');
  }

  gatePass(GATE_NAME, 'release notes rendering completed.');
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  gateFail(GATE_NAME, errorMessage);
  process.exit(1);
}
