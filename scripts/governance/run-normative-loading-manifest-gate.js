#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { gateFail, gateInfo } from "./gate-output.js";

const GATE_NAME = "normative-loading-gate-runner";
const DEFAULT_CONFIG_PATH = "scripts/governance/normative-loading-gate.config.json";
const CHECK_SCRIPT_PATH = "scripts/governance/check-normative-loading-manifest.js";
const SUPPORTED_MODES = new Set(["warn", "block"]);

/**
 * Resolves one flag value from argv.
 * @param {string[]} argv Raw argv.
 * @param {string} flagName Flag name.
 * @returns {string | null}
 */
function readFlagValue(argv, flagName) {
  const flagIndex = argv.indexOf(flagName);
  if (flagIndex === -1) {
    return null;
  }

  const nextValue = argv[flagIndex + 1];
  if (!nextValue || nextValue.startsWith("--")) {
    throw new Error(`Flag "${flagName}" requires a value.`);
  }

  return nextValue.trim();
}

/**
 * Loads runner config.
 * @param {string} configPath Absolute config path.
 * @returns {{
 *   defaultMode: "warn" | "block",
 *   switchConditions: string[],
 *   rollbackSwitch: {enabled: boolean, mode: "warn" | "block", reason: string, owner: string},
 *   envOverrides: {forceMode: string, rollback: string},
 * }}
 */
function loadRunnerConfig(configPath) {
  if (!existsSync(configPath)) {
    throw new Error(`Runner config not found: ${configPath}`);
  }

  const configPayload = JSON.parse(readFileSync(configPath, "utf8"));

  const defaultMode = String(configPayload.defaultMode ?? "").trim();
  if (!SUPPORTED_MODES.has(defaultMode)) {
    throw new Error(
      `Invalid defaultMode "${defaultMode}" in config. Expected one of: ${Array.from(SUPPORTED_MODES).join(", ")}`,
    );
  }

  const rollbackSwitch = configPayload.rollbackSwitch ?? {};
  const rollbackMode = String(rollbackSwitch.mode ?? "warn").trim();
  if (!SUPPORTED_MODES.has(rollbackMode)) {
    throw new Error(
      `Invalid rollbackSwitch.mode "${rollbackMode}" in config. Expected one of: ${Array.from(SUPPORTED_MODES).join(", ")}`,
    );
  }

  return {
    defaultMode,
    switchConditions: Array.isArray(configPayload.switchConditions)
      ? configPayload.switchConditions.map((item) => String(item))
      : [],
    rollbackSwitch: {
      enabled: Boolean(rollbackSwitch.enabled),
      mode: rollbackMode,
      reason: String(rollbackSwitch.reason ?? "").trim(),
      owner: String(rollbackSwitch.owner ?? "").trim(),
    },
    envOverrides: {
      forceMode: String(
        configPayload.envOverrides?.forceMode ?? "NORMATIVE_LOADING_GATE_FORCE_MODE",
      ),
      rollback: String(configPayload.envOverrides?.rollback ?? "NORMATIVE_LOADING_GATE_ROLLBACK"),
    },
  };
}

/**
 * Resolves effective gate mode with rollback semantics.
 * @param {{
 *   defaultMode: "warn" | "block",
 *   rollbackSwitch: {enabled: boolean, mode: "warn" | "block", reason: string, owner: string},
 *   envOverrides: {forceMode: string, rollback: string},
 * }} config Runner config.
 * @returns {{mode: "warn" | "block", reason: string}}
 */
function resolveEffectiveMode(config) {
  const forceModeEnvName = config.envOverrides.forceMode;
  const rollbackEnvName = config.envOverrides.rollback;

  const forceModeValue = String(process.env[forceModeEnvName] ?? "")
    .trim()
    .toLowerCase();
  if (forceModeValue) {
    if (!SUPPORTED_MODES.has(forceModeValue)) {
      throw new Error(
        `Invalid ${forceModeEnvName}="${forceModeValue}". Expected one of: ${Array.from(SUPPORTED_MODES).join(", ")}`,
      );
    }

    return {
      mode: /** @type {"warn" | "block"} */ (forceModeValue),
      reason: `forced by env ${forceModeEnvName}`,
    };
  }

  const rollbackEnvEnabled = ["1", "true", "yes", "on"].includes(
    String(process.env[rollbackEnvName] ?? "")
      .trim()
      .toLowerCase(),
  );

  if (rollbackEnvEnabled || config.rollbackSwitch.enabled) {
    return {
      mode: config.rollbackSwitch.mode,
      reason: rollbackEnvEnabled
        ? `rollback enabled by env ${rollbackEnvName}`
        : "rollback enabled in config",
    };
  }

  return {
    mode: config.defaultMode,
    reason: "default mode",
  };
}

try {
  const argv = process.argv.slice(2);
  const configCandidate = readFlagValue(argv, "--config") ?? DEFAULT_CONFIG_PATH;
  const configPath = resolve(process.cwd(), configCandidate);
  const checkScriptPath = resolve(process.cwd(), CHECK_SCRIPT_PATH);

  if (!existsSync(checkScriptPath)) {
    throw new Error(`Gate script not found: ${checkScriptPath}`);
  }

  const config = loadRunnerConfig(configPath);
  const effective = resolveEffectiveMode(config);

  gateInfo(
    GATE_NAME,
    `effective_mode=${effective.mode} reason="${effective.reason}" switch_conditions=${config.switchConditions.length}`,
  );

  const child = spawnSync(process.execPath, [checkScriptPath, "--mode", effective.mode], {
    stdio: "inherit",
  });

  if (typeof child.status === "number") {
    process.exit(child.status);
  }

  if (child.error) {
    throw child.error;
  }

  process.exit(1);
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  gateFail(GATE_NAME, errorMessage);
  process.exit(1);
}
