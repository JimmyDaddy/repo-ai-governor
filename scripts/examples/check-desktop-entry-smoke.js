#!/usr/bin/env node

import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { gateFail, gateInfo, gatePass } from "../governance/gate-output.js";

const GATE_NAME = "desktop-entry-smoke";
const DEFAULT_DISTRIBUTION_MODE = "default";
const PLUGIN_ENABLED_DISTRIBUTION_MODE = "plugin-enabled";
const DESKTOP_README_PATH = "integrations/desktop/README.md";
const DESKTOP_EXAMPLES_README_PATH = "integrations/desktop/examples/README.md";
const DESKTOP_SAMPLE_PATH = "integrations/desktop/examples/desktop-sidecar-runtime.sample.json";
const DIST_CLI_RUNTIME_PATH =
  "dist/node_modules/@repo-ai-governor/cli/dist/src/runtime/orchestration-service-runtime.js";
const DIST_CLI_RUNTIME_MODE_CONSTANT_PATH =
  "dist/node_modules/@repo-ai-governor/cli/dist/src/constants/orchestration-service-runtime.constant.js";
const DIST_ORCHESTRATION_CLIENT_INDEX_PATH =
  "dist/node_modules/@repo-ai-governor/orchestration-service-client/dist/src/index.js";
const DIST_CORE_ORCHESTRATION_SIDECAR_ENTRY_PATH =
  "dist/node_modules/@repo-ai-governor/core-orchestration-service/dist/src/local-orchestration-service-sidecar-entry.js";

/**
 * Reads one repository-relative JSON file.
 * @param {string} relativePath Repository-relative JSON path.
 * @returns {unknown}
 */
function readJson(relativePath) {
  return JSON.parse(readFileSync(resolve(process.cwd(), relativePath), "utf8"));
}

/**
 * Ensures one required file exists.
 * @param {string} relativePath Repository-relative path.
 */
function ensureFileExists(relativePath) {
  if (!existsSync(resolve(process.cwd(), relativePath))) {
    throw new Error(`required file is missing: ${relativePath}`);
  }
}

/**
 * Ensures one value is a non-empty string.
 * @param {unknown} value Candidate value.
 * @param {string} fieldName Field name for diagnostics.
 */
function assertNonEmptyString(value, fieldName) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`Field "${fieldName}" must be a non-empty string.`);
  }
}

/**
 * Parses CLI options for distribution-sensitive smoke coverage.
 * @returns {{distributionMode: "default" | "plugin-enabled"}}
 */
function parseCliOptions() {
  const rawArgs = process.argv.slice(2);
  const distributionModeIndex = rawArgs.findIndex((arg) => arg === "--distribution-mode");
  if (distributionModeIndex === -1) {
    return {
      distributionMode: DEFAULT_DISTRIBUTION_MODE,
    };
  }

  const candidateMode = rawArgs[distributionModeIndex + 1]?.trim();
  if (
    candidateMode !== DEFAULT_DISTRIBUTION_MODE &&
    candidateMode !== PLUGIN_ENABLED_DISTRIBUTION_MODE
  ) {
    throw new Error('Expected "--distribution-mode" to be "default" or "plugin-enabled".');
  }

  return {
    distributionMode: candidateMode,
  };
}

/**
 * Normalizes expected memory-provider composition from the desktop sample.
 * @param {unknown} expectedRaw Raw expected block.
 * @param {string} fieldName Field name for diagnostics.
 * @returns {Record<string, string>}
 */
function normalizeExpectedMemoryProvider(expectedRaw, fieldName) {
  if (!expectedRaw || typeof expectedRaw !== "object" || Array.isArray(expectedRaw)) {
    throw new Error(`Field "${fieldName}" must be an object.`);
  }

  const normalizedEntries = {};
  for (const [key, value] of Object.entries(expectedRaw)) {
    assertNonEmptyString(value, `${fieldName}.${key}`);
    normalizedEntries[key] = value.trim();
  }

  return normalizedEntries;
}

/**
 * Normalizes desktop sample payload.
 * @param {unknown} sampleRaw Parsed sample JSON.
 * @returns {{
 *   surface: string;
 *   runtimeMode: string;
 *   executionKind: string;
 *   expectedServiceHostKind: string;
 *   expectedServiceTransportKind: string;
 *   expectedLifecycleStatus: string;
 *   defaultMemoryProvider: Record<string, string>;
 *   pluginEnabledMemoryProvider: Record<string, string>;
 *   requiredOperations: string[];
 * }}
 */
function normalizeSample(sampleRaw) {
  if (!sampleRaw || typeof sampleRaw !== "object" || Array.isArray(sampleRaw)) {
    throw new Error("desktop runtime sample must be an object.");
  }

  assertNonEmptyString(sampleRaw.surface, "surface");
  assertNonEmptyString(sampleRaw.runtimeMode, "runtimeMode");
  assertNonEmptyString(sampleRaw.executionKind, "executionKind");
  assertNonEmptyString(sampleRaw.expectedServiceHostKind, "expectedServiceHostKind");
  assertNonEmptyString(sampleRaw.expectedServiceTransportKind, "expectedServiceTransportKind");
  assertNonEmptyString(sampleRaw.expectedLifecycleStatus, "expectedLifecycleStatus");

  if (!Array.isArray(sampleRaw.requiredOperations) || sampleRaw.requiredOperations.length === 0) {
    throw new Error("requiredOperations must be a non-empty array.");
  }

  return {
    surface: sampleRaw.surface.trim(),
    runtimeMode: sampleRaw.runtimeMode.trim(),
    executionKind: sampleRaw.executionKind.trim(),
    expectedServiceHostKind: sampleRaw.expectedServiceHostKind.trim(),
    expectedServiceTransportKind: sampleRaw.expectedServiceTransportKind.trim(),
    expectedLifecycleStatus: sampleRaw.expectedLifecycleStatus.trim(),
    defaultMemoryProvider: normalizeExpectedMemoryProvider(
      sampleRaw.defaultMemoryProvider,
      "defaultMemoryProvider",
    ),
    pluginEnabledMemoryProvider: normalizeExpectedMemoryProvider(
      sampleRaw.pluginEnabledMemoryProvider,
      "pluginEnabledMemoryProvider",
    ),
    requiredOperations: sampleRaw.requiredOperations.map((entry, index) => {
      assertNonEmptyString(entry, `requiredOperations[${index}]`);
      return entry.trim();
    }),
  };
}

/**
 * Imports one ESM module from repository-relative path.
 * @template T
 * @param {string} relativePath Repository-relative module path.
 * @returns {Promise<T>}
 */
async function importDistModule(relativePath) {
  const absolutePath = resolve(process.cwd(), relativePath);
  return await import(pathToFileURL(absolutePath).href);
}

/**
 * Asserts one actual memory-provider composition against expected string fields.
 * @param {unknown} actualMemoryProvider Actual runtime composition.
 * @param {Record<string, string>} expectedMemoryProvider Expected memory-provider fields.
 * @param {string} label Assertion label.
 */
function assertExpectedMemoryProvider(actualMemoryProvider, expectedMemoryProvider, label) {
  if (
    !actualMemoryProvider ||
    typeof actualMemoryProvider !== "object" ||
    Array.isArray(actualMemoryProvider)
  ) {
    throw new Error(`${label} did not provide a memoryProvider payload.`);
  }

  for (const [fieldName, expectedValue] of Object.entries(expectedMemoryProvider)) {
    if (actualMemoryProvider[fieldName] !== expectedValue) {
      throw new Error(
        `${label} returned memoryProvider.${fieldName}="${String(actualMemoryProvider[fieldName])}", expected "${expectedValue}"`,
      );
    }
  }
}

try {
  const options = parseCliOptions();
  ensureFileExists(DESKTOP_README_PATH);
  ensureFileExists(DESKTOP_EXAMPLES_README_PATH);
  ensureFileExists(DESKTOP_SAMPLE_PATH);
  ensureFileExists(DIST_CLI_RUNTIME_PATH);
  ensureFileExists(DIST_CLI_RUNTIME_MODE_CONSTANT_PATH);
  ensureFileExists(DIST_ORCHESTRATION_CLIENT_INDEX_PATH);
  ensureFileExists(DIST_CORE_ORCHESTRATION_SIDECAR_ENTRY_PATH);

  const sample = normalizeSample(readJson(DESKTOP_SAMPLE_PATH));
  const expectedMemoryProvider =
    options.distributionMode === PLUGIN_ENABLED_DISTRIBUTION_MODE
      ? sample.pluginEnabledMemoryProvider
      : sample.defaultMemoryProvider;
  const [{ CliOrchestrationServiceRuntime }, { CliOrchestrationServiceRuntimeMode }, clientIndex] =
    await Promise.all([
      importDistModule(DIST_CLI_RUNTIME_PATH),
      importDistModule(DIST_CLI_RUNTIME_MODE_CONSTANT_PATH),
      importDistModule(DIST_ORCHESTRATION_CLIENT_INDEX_PATH),
    ]);

  const {
    OrchestrationClientSurface,
    OrchestrationExecutionKind,
    OrchestrationExecutionStatus,
    OrchestrationServiceEventType,
  } = clientIndex;

  if (sample.surface !== OrchestrationClientSurface.DESKTOP) {
    throw new Error("desktop runtime sample must declare surface=desktop.");
  }
  if (sample.runtimeMode !== CliOrchestrationServiceRuntimeMode.SIDECAR_IPC) {
    throw new Error("desktop runtime sample must declare runtimeMode=sidecar_ipc.");
  }
  if (sample.executionKind !== OrchestrationExecutionKind.RUN) {
    throw new Error("desktop runtime sample must declare executionKind=run.");
  }

  const tempRoot = mkdtempSync(resolve(tmpdir(), "repo-ai-governor-desktop-sidecar-"));
  const workspaceRoot = resolve(tempRoot, ".repo-ai-governor");

  try {
    const runtime = new CliOrchestrationServiceRuntime(workspaceRoot, {
      runtimeMode: CliOrchestrationServiceRuntimeMode.SIDECAR_IPC,
      memoryConfig:
        options.distributionMode === PLUGIN_ENABLED_DISTRIBUTION_MODE
          ? {
              storeEngine: "sqlite_fs",
              storeRoot: "context/memory/desktop-plugin",
              provider: {
                module: "@repo-ai-governor/memory-provider-sqlite-fs",
                exportName: "createMemoryStoreProvider",
              },
            }
          : {
              storeEngine: "fs_csv",
              storeRoot: "context/memory/desktop-default",
            },
    });

    const health = await runtime.getHealth();
    const started = await runtime.startExecution(
      {
        workspaceId: "desktop-workspace",
        workspaceRoot,
        executionKind: OrchestrationExecutionKind.RUN,
        clientSurface: OrchestrationClientSurface.DESKTOP,
      },
      {
        processId: "desktop-process",
        executionId: "desktop-execution",
        executionSessionId: "desktop-session",
      },
    );

    await runtime.publishEvent({
      executionId: started.executionId,
      type: OrchestrationServiceEventType.ARTIFACT_READY,
      status: OrchestrationExecutionStatus.RUNNING,
      artifactId: "desktop-artifact",
      artifactPath: resolve(workspaceRoot, "desktop-artifact.json"),
      message: "desktop artifact ready",
    });
    await runtime.publishEvent({
      executionId: started.executionId,
      type: OrchestrationServiceEventType.EXECUTION_COMPLETED,
      status: OrchestrationExecutionStatus.COMPLETED,
      message: "desktop execution completed",
    });

    const summary = await runtime.getExecution(started.executionId);
    const listed = await runtime.listExecutions({
      filter: {
        workspaceId: "desktop-workspace",
      },
    });
    const subscribed = await runtime.subscribeExecution({
      executionId: started.executionId,
    });

    if (health.lifecycleStatus !== sample.expectedLifecycleStatus) {
      throw new Error(
        `desktop sidecar health returned lifecycleStatus="${health.lifecycleStatus}", expected "${sample.expectedLifecycleStatus}"`,
      );
    }
    if (health.serviceHostKind !== sample.expectedServiceHostKind) {
      throw new Error(
        `desktop sidecar health returned host="${health.serviceHostKind}", expected "${sample.expectedServiceHostKind}"`,
      );
    }
    if (health.serviceTransportKind !== sample.expectedServiceTransportKind) {
      throw new Error(
        `desktop sidecar health returned transport="${health.serviceTransportKind}", expected "${sample.expectedServiceTransportKind}"`,
      );
    }
    assertExpectedMemoryProvider(
      health.memoryProvider,
      expectedMemoryProvider,
      "desktop sidecar health",
    );
    if (started.serviceHostKind !== sample.expectedServiceHostKind) {
      throw new Error("desktop sidecar execution host kind drifted from sample baseline.");
    }
    if (started.serviceTransportKind !== sample.expectedServiceTransportKind) {
      throw new Error("desktop sidecar execution transport kind drifted from sample baseline.");
    }
    assertExpectedMemoryProvider(
      started.memoryProvider,
      expectedMemoryProvider,
      "desktop sidecar startExecution",
    );
    assertExpectedMemoryProvider(
      summary?.memoryProvider,
      expectedMemoryProvider,
      "desktop sidecar getExecution",
    );
    if (listed.executions.length !== 1) {
      throw new Error(`desktop sidecar listExecutions returned ${listed.executions.length} items.`);
    }
    assertExpectedMemoryProvider(
      listed.executions[0]?.memoryProvider,
      expectedMemoryProvider,
      "desktop sidecar listExecutions",
    );
    if (subscribed.serviceHostKind !== sample.expectedServiceHostKind) {
      throw new Error("desktop sidecar subscribeExecution host kind drifted from sample baseline.");
    }
    if (subscribed.serviceTransportKind !== sample.expectedServiceTransportKind) {
      throw new Error(
        "desktop sidecar subscribeExecution transport kind drifted from sample baseline.",
      );
    }
    if (subscribed.events.length < 3) {
      throw new Error("desktop sidecar subscribeExecution returned too few events.");
    }

    await runtime.dispose();
    gateInfo(
      GATE_NAME,
      `desktop sidecar runtime smoke passed operations=${sample.requiredOperations.join(",")} distribution_mode=${options.distributionMode}`,
    );
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }

  gatePass(
    GATE_NAME,
    `desktop execution surface verified using ${sample.runtimeMode} and ${sample.expectedServiceHostKind}/${sample.expectedServiceTransportKind} distribution_mode=${options.distributionMode}`,
  );
} catch (error) {
  gateFail(GATE_NAME, error instanceof Error ? error.message : String(error));
  process.exit(1);
}
