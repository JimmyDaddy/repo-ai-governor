#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { gateFail, gateInfo, gatePass } from "../governance/gate-output.js";

const GATE_NAME = "release-ready";
const RELEASE_POLICY_SPEC_PATH =
  ".repo-ai-governor/normative_knowledge_sources/governance/release-governance-spec.md";
const RELEASE_POLICY_CONFIG_PATH = "scripts/release/release-governance-policy.json";
const RELEASE_IT_CONFIG_PATH = ".release-it.json";

const REQUIRED_RELEASE_ASSETS = [
  "scripts/release/check-release-ready.js",
  "scripts/release/check-runtime-js-whitelist.js",
  "scripts/ci/run-stage9-blackbox-ga-baseline.js",
  "scripts/ci/stage9-blackbox-ga-lib.js",
  "scripts/release/verify-local-distribution.js",
  "scripts/examples/check-desktop-entry-smoke.js",
  "scripts/release/run-rollback-rehearsal.js",
  "scripts/release/check-ga-candidate-unified-gate.js",
  "scripts/release/render-release-notes.js",
  "scripts/release/release-governance-policy.json",
  "scripts/release/runtime-js-whitelist.json",
];

const REQUIRED_PACKAGE_SCRIPTS = [
  "release:check",
  "release:notes",
  "release:verify-local",
  "check:desktop-entry-smoke",
  "release:verify-cleanroom-local-install",
  "release:verify-cleanroom-local-install:tgz",
  "release:rollback-rehearsal",
  "release:candidate",
  "release:ga-check",
  "release:ga-candidate-unified-gate",
  "test:stage9-blackbox-ga",
  "gate:desktop-entry-smoke",
  "check:runtime-js-whitelist",
];
const REQUIRED_CHANNEL_NAMES = ["canary", "rc", "ga"];
const REQUIRED_RELEASE_INIT_HOOK = "pnpm run release:ga-check";

/**
 * Reads one JSON file from repository root with explicit missing-file diagnostics.
 * @param {string} relativePath Path relative to repository root.
 * @returns {unknown}
 */
function readJsonFile(relativePath) {
  const absolutePath = resolve(process.cwd(), relativePath);
  if (!existsSync(absolutePath)) {
    throw new Error(`Required file is missing: ${relativePath}`);
  }

  const rawContent = readFileSync(absolutePath, "utf8");
  return JSON.parse(rawContent);
}

/**
 * Reads one required string array field from a generic JSON object.
 * @param {unknown} rawObject Candidate object.
 * @param {string} fieldName Field key.
 * @returns {string[]}
 */
function readRequiredStringArray(rawObject, fieldName) {
  if (!rawObject || typeof rawObject !== "object") {
    throw new Error(`Release policy config must be an object to read "${fieldName}".`);
  }

  const value = rawObject[fieldName];
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`Release policy config must define non-empty array "${fieldName}".`);
  }

  const values = [];
  for (const entry of value) {
    if (typeof entry !== "string" || entry.trim().length === 0) {
      throw new Error(`Release policy config field "${fieldName}" must contain strings only.`);
    }
    values.push(entry.trim());
  }

  return values;
}

/**
 * Validates optional audit-evidence source mappings.
 * @param {unknown} policyConfig Parsed policy config.
 */
function validateAuditEvidenceSources(policyConfig) {
  if (!policyConfig || typeof policyConfig !== "object") {
    throw new Error("Release policy config must be a JSON object.");
  }

  const auditEvidenceSources = policyConfig.auditEvidenceSources;
  if (typeof auditEvidenceSources === "undefined") {
    return;
  }

  if (
    !auditEvidenceSources ||
    typeof auditEvidenceSources !== "object" ||
    Array.isArray(auditEvidenceSources)
  ) {
    throw new Error('Release policy config field "auditEvidenceSources" must be an object.');
  }

  for (const [evidenceKey, sourceConfig] of Object.entries(auditEvidenceSources)) {
    if (!sourceConfig || typeof sourceConfig !== "object" || Array.isArray(sourceConfig)) {
      throw new Error(`auditEvidenceSources.${evidenceKey} must be an object.`);
    }

    if (sourceConfig.sourceType !== "report_file") {
      throw new Error(`auditEvidenceSources.${evidenceKey}.sourceType must be "report_file".`);
    }

    if (
      typeof sourceConfig.reportPath !== "string" ||
      sourceConfig.reportPath.trim().length === 0
    ) {
      throw new Error(`auditEvidenceSources.${evidenceKey}.reportPath must be non-empty.`);
    }

    if (
      typeof sourceConfig.requiredStatus !== "string" ||
      sourceConfig.requiredStatus.trim().length === 0
    ) {
      throw new Error(`auditEvidenceSources.${evidenceKey}.requiredStatus must be non-empty.`);
    }
  }
}

/**
 * Validates release governance policy config shape.
 * @param {unknown} policyConfig Parsed policy config.
 */
function validateReleasePolicyConfig(policyConfig) {
  if (!policyConfig || typeof policyConfig !== "object") {
    throw new Error("Release policy config must be a JSON object.");
  }

  const versioningStrategy = policyConfig.versioningStrategy;
  if (!versioningStrategy || typeof versioningStrategy !== "object") {
    throw new Error('Release policy config must define object field "versioningStrategy".');
  }

  const lockstepPackages = readRequiredStringArray(versioningStrategy, "lockstep");
  const independentPackages = readRequiredStringArray(versioningStrategy, "independent");

  const channelEntries = policyConfig.channels;
  if (!Array.isArray(channelEntries) || channelEntries.length !== REQUIRED_CHANNEL_NAMES.length) {
    throw new Error("Release policy config must define canary/rc/ga channel entries.");
  }

  const channelNameSet = new Set();
  for (const channelEntry of channelEntries) {
    if (!channelEntry || typeof channelEntry !== "object") {
      throw new Error("Release channel entry must be an object.");
    }

    const rawName = channelEntry.name;
    if (typeof rawName !== "string" || rawName.trim().length === 0) {
      throw new Error('Release channel entry must define non-empty field "name".');
    }

    const name = rawName.trim();
    channelNameSet.add(name);
    readRequiredStringArray(channelEntry, "requiredChecks");
    readRequiredStringArray(channelEntry, "promotionCriteria");
  }

  for (const requiredChannelName of REQUIRED_CHANNEL_NAMES) {
    if (!channelNameSet.has(requiredChannelName)) {
      throw new Error(`Release policy config is missing channel "${requiredChannelName}".`);
    }
  }

  readRequiredStringArray(policyConfig, "rollbackTriggers");
  readRequiredStringArray(policyConfig, "minimumAuditEvidence");
  validateAuditEvidenceSources(policyConfig);

  gateInfo(
    GATE_NAME,
    `versioning validated lockstep=${lockstepPackages.length} independent=${independentPackages.length}`,
  );
}

/**
 * Validates `.release-it.json` policy hooks.
 * @param {unknown} releaseItConfig Parsed release-it config object.
 */
function validateReleaseItConfig(releaseItConfig) {
  if (!releaseItConfig || typeof releaseItConfig !== "object") {
    throw new Error(".release-it.json must be a JSON object.");
  }

  const hooks = releaseItConfig.hooks;
  if (!hooks || typeof hooks !== "object") {
    throw new Error('.release-it.json must define "hooks".');
  }

  const beforeInitHooks = hooks["before:init"];
  if (!Array.isArray(beforeInitHooks) || beforeInitHooks.length === 0) {
    throw new Error('.release-it.json must define non-empty hooks["before:init"].');
  }

  const hasRequiredHook = beforeInitHooks.some(
    (hookCommand) =>
      typeof hookCommand === "string" && hookCommand.trim().includes(REQUIRED_RELEASE_INIT_HOOK),
  );

  if (!hasRequiredHook) {
    throw new Error(
      `.release-it.json hooks["before:init"] must include "${REQUIRED_RELEASE_INIT_HOOK}".`,
    );
  }
}

/**
 * Ensures package scripts include required release entries.
 * @param {unknown} packageJson Parsed package.json content.
 */
function validatePackageScripts(packageJson) {
  if (!packageJson || typeof packageJson !== "object") {
    throw new Error("package.json must be an object.");
  }

  const scripts = packageJson.scripts;
  if (!scripts || typeof scripts !== "object") {
    throw new Error("package.json must define scripts.");
  }

  for (const requiredScriptName of REQUIRED_PACKAGE_SCRIPTS) {
    if (!(requiredScriptName in scripts)) {
      throw new Error(`package.json is missing required script: ${requiredScriptName}`);
    }
  }
}

try {
  for (const requiredAssetPath of REQUIRED_RELEASE_ASSETS) {
    if (!existsSync(resolve(process.cwd(), requiredAssetPath))) {
      throw new Error(`Required release artifact is missing: ${requiredAssetPath}`);
    }
  }
  gateInfo(GATE_NAME, `release assets found (${REQUIRED_RELEASE_ASSETS.length}).`);

  if (!existsSync(resolve(process.cwd(), RELEASE_POLICY_SPEC_PATH))) {
    throw new Error(`Release governance spec is missing: ${RELEASE_POLICY_SPEC_PATH}`);
  }
  gateInfo(GATE_NAME, "release governance spec found.");

  const releasePolicyConfig = readJsonFile(RELEASE_POLICY_CONFIG_PATH);
  validateReleasePolicyConfig(releasePolicyConfig);

  const packageJson = readJsonFile("package.json");
  validatePackageScripts(packageJson);
  gateInfo(
    GATE_NAME,
    `package scripts validated (${REQUIRED_PACKAGE_SCRIPTS.length} required entries).`,
  );

  if (!existsSync(resolve(process.cwd(), RELEASE_IT_CONFIG_PATH))) {
    throw new Error(`release-it config is missing: ${RELEASE_IT_CONFIG_PATH}`);
  }
  const releaseItConfig = readJsonFile(RELEASE_IT_CONFIG_PATH);
  validateReleaseItConfig(releaseItConfig);

  gatePass(GATE_NAME, "release governance checks passed.");
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  gateFail(GATE_NAME, errorMessage);
  process.exit(1);
}
