#!/usr/bin/env node

import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { gateFail, gateInfo, gatePass } from "../governance/gate-output.js";

const GATE_NAME = "desktop-entry-smoke";
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
 * Normalizes desktop sample payload.
 * @param {unknown} sampleRaw Parsed sample JSON.
 * @returns {{
 *   surface: string;
 *   runtimeMode: string;
 *   executionKind: string;
 *   expectedServiceHostKind: string;
 *   expectedServiceTransportKind: string;
 *   expectedLifecycleStatus: string;
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

try {
  ensureFileExists(DESKTOP_README_PATH);
  ensureFileExists(DESKTOP_EXAMPLES_README_PATH);
  ensureFileExists(DESKTOP_SAMPLE_PATH);
  ensureFileExists(DIST_CLI_RUNTIME_PATH);
  ensureFileExists(DIST_CLI_RUNTIME_MODE_CONSTANT_PATH);
  ensureFileExists(DIST_ORCHESTRATION_CLIENT_INDEX_PATH);
  ensureFileExists(DIST_CORE_ORCHESTRATION_SIDECAR_ENTRY_PATH);

  const sample = normalizeSample(readJson(DESKTOP_SAMPLE_PATH));
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
    if (started.serviceHostKind !== sample.expectedServiceHostKind) {
      throw new Error("desktop sidecar execution host kind drifted from sample baseline.");
    }
    if (started.serviceTransportKind !== sample.expectedServiceTransportKind) {
      throw new Error("desktop sidecar execution transport kind drifted from sample baseline.");
    }
    if (listed.executions.length !== 1) {
      throw new Error(`desktop sidecar listExecutions returned ${listed.executions.length} items.`);
    }
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
      `desktop sidecar runtime smoke passed operations=${sample.requiredOperations.join(",")}`,
    );
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }

  gatePass(
    GATE_NAME,
    `desktop execution surface verified using ${sample.runtimeMode} and ${sample.expectedServiceHostKind}/${sample.expectedServiceTransportKind}`,
  );
} catch (error) {
  gateFail(GATE_NAME, error instanceof Error ? error.message : String(error));
  process.exit(1);
}
