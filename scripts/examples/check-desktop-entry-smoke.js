#!/usr/bin/env node

import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import { gateFail, gateInfo, gatePass } from '../governance/gate-output.js';

const GATE_NAME = 'desktop-entry-smoke';
const DEFAULT_DISTRIBUTION_MODE = 'default';
const PLUGIN_ENABLED_DISTRIBUTION_MODE = 'plugin-enabled';
const DESKTOP_README_PATH = 'integrations/desktop/README.md';
const DESKTOP_EXAMPLES_README_PATH = 'integrations/desktop/examples/README.md';
const DESKTOP_SAMPLE_PATH = 'integrations/desktop/examples/desktop-sidecar-runtime.sample.json';
const DIST_DESKTOP_INDEX_PATH = 'dist/node_modules/@repo-ai-governor/desktop/dist/src/index.js';
const DIST_ORCHESTRATION_CLIENT_INDEX_PATH =
  'dist/node_modules/@repo-ai-governor/orchestration-service-client/dist/src/index.js';
const DIST_CORE_ORCHESTRATION_SIDECAR_ENTRY_PATH =
  'dist/node_modules/@repo-ai-governor/core-orchestration-service/dist/src/local-orchestration-service-sidecar-entry.js';

function readJson(relativePath) {
  return JSON.parse(readFileSync(resolve(process.cwd(), relativePath), 'utf8'));
}

function ensureFileExists(relativePath) {
  if (!existsSync(resolve(process.cwd(), relativePath))) {
    throw new Error(`required file is missing: ${relativePath}`);
  }
}

function assertNonEmptyString(value, fieldName) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`Field "${fieldName}" must be a non-empty string.`);
  }
}

function parseCliOptions() {
  const rawArgs = process.argv.slice(2);
  const distributionModeIndex = rawArgs.findIndex((arg) => arg === '--distribution-mode');
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

function normalizeExpectedMemoryProvider(expectedRaw, fieldName) {
  if (!expectedRaw || typeof expectedRaw !== 'object' || Array.isArray(expectedRaw)) {
    throw new Error(`Field "${fieldName}" must be an object.`);
  }

  const normalizedEntries = {};
  for (const [key, value] of Object.entries(expectedRaw)) {
    assertNonEmptyString(value, `${fieldName}.${key}`);
    normalizedEntries[key] = value.trim();
  }

  return normalizedEntries;
}

function normalizeSample(sampleRaw) {
  if (!sampleRaw || typeof sampleRaw !== 'object' || Array.isArray(sampleRaw)) {
    throw new Error('desktop runtime sample must be an object.');
  }

  assertNonEmptyString(sampleRaw.surface, 'surface');
  assertNonEmptyString(sampleRaw.runtimeMode, 'runtimeMode');
  assertNonEmptyString(sampleRaw.executionKind, 'executionKind');
  assertNonEmptyString(sampleRaw.expectedServiceHostKind, 'expectedServiceHostKind');
  assertNonEmptyString(sampleRaw.expectedServiceTransportKind, 'expectedServiceTransportKind');
  assertNonEmptyString(sampleRaw.expectedLifecycleStatus, 'expectedLifecycleStatus');
  assertNonEmptyString(sampleRaw.expectedArtifactQueryGateState, 'expectedArtifactQueryGateState');

  if (!Array.isArray(sampleRaw.requiredOperations) || sampleRaw.requiredOperations.length === 0) {
    throw new Error('requiredOperations must be a non-empty array.');
  }

  return {
    surface: sampleRaw.surface.trim(),
    runtimeMode: sampleRaw.runtimeMode.trim(),
    executionKind: sampleRaw.executionKind.trim(),
    expectedServiceHostKind: sampleRaw.expectedServiceHostKind.trim(),
    expectedServiceTransportKind: sampleRaw.expectedServiceTransportKind.trim(),
    expectedLifecycleStatus: sampleRaw.expectedLifecycleStatus.trim(),
    expectedArtifactQueryGateState: sampleRaw.expectedArtifactQueryGateState.trim(),
    defaultMemoryProvider: normalizeExpectedMemoryProvider(
      sampleRaw.defaultMemoryProvider,
      'defaultMemoryProvider',
    ),
    pluginEnabledMemoryProvider: normalizeExpectedMemoryProvider(
      sampleRaw.pluginEnabledMemoryProvider,
      'pluginEnabledMemoryProvider',
    ),
    requiredOperations: sampleRaw.requiredOperations.map((entry, index) => {
      assertNonEmptyString(entry, `requiredOperations[${index}]`);
      return entry.trim();
    }),
  };
}

async function importDistModule(relativePath) {
  const absolutePath = resolve(process.cwd(), relativePath);
  return await import(pathToFileURL(absolutePath).href);
}

function assertExpectedMemoryProvider(actualMemoryProvider, expectedMemoryProvider, label) {
  if (
    !actualMemoryProvider ||
    typeof actualMemoryProvider !== 'object' ||
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

function assertRequiredOperations(bridge, requiredOperations) {
  for (const operationName of requiredOperations) {
    if (typeof bridge[operationName] !== 'function') {
      throw new Error(`desktop preload bridge is missing required operation "${operationName}"`);
    }
  }
}

try {
  const options = parseCliOptions();
  ensureFileExists(DESKTOP_README_PATH);
  ensureFileExists(DESKTOP_EXAMPLES_README_PATH);
  ensureFileExists(DESKTOP_SAMPLE_PATH);
  ensureFileExists(DIST_DESKTOP_INDEX_PATH);
  ensureFileExists(DIST_ORCHESTRATION_CLIENT_INDEX_PATH);
  ensureFileExists(DIST_CORE_ORCHESTRATION_SIDECAR_ENTRY_PATH);

  const sample = normalizeSample(readJson(DESKTOP_SAMPLE_PATH));
  const expectedMemoryProvider =
    options.distributionMode === PLUGIN_ENABLED_DISTRIBUTION_MODE
      ? sample.pluginEnabledMemoryProvider
      : sample.defaultMemoryProvider;
  const [
    { DesktopArtifactQueryGateState, DesktopOrchestrationRuntimeMode, DesktopShellBootstrap },
    clientIndex,
  ] = await Promise.all([
    importDistModule(DIST_DESKTOP_INDEX_PATH),
    importDistModule(DIST_ORCHESTRATION_CLIENT_INDEX_PATH),
  ]);

  const {
    OrchestrationClientSurface,
    OrchestrationExecutionKind,
    OrchestrationExecutionStatus,
    OrchestrationServiceEventType,
    OrchestrationSessionTranscriptRole,
  } = clientIndex;

  if (sample.surface !== OrchestrationClientSurface.DESKTOP) {
    throw new Error('desktop runtime sample must declare surface=desktop.');
  }
  if (sample.runtimeMode !== DesktopOrchestrationRuntimeMode.SIDECAR_IPC) {
    throw new Error('desktop runtime sample must declare runtimeMode=sidecar_ipc.');
  }
  if (sample.executionKind !== OrchestrationExecutionKind.RUN) {
    throw new Error('desktop runtime sample must declare executionKind=run.');
  }
  if (sample.expectedArtifactQueryGateState !== DesktopArtifactQueryGateState.READY) {
    throw new Error('desktop runtime sample must declare expectedArtifactQueryGateState=ready.');
  }

  const tempRoot = mkdtempSync(resolve(tmpdir(), 'repo-ai-governor-desktop-sidecar-'));
  const workspaceRoot = resolve(tempRoot, '.repo-ai-governor');

  try {
    const bootstrap = new DesktopShellBootstrap(workspaceRoot, {
      runtimeDependencies: {
        memoryConfig:
          options.distributionMode === PLUGIN_ENABLED_DISTRIBUTION_MODE
            ? {
                storeEngine: 'sqlite_fs',
                storeRoot: 'context/memory/desktop-plugin',
                provider: {
                  module: '@repo-ai-governor/memory-provider-sqlite-fs',
                  exportName: 'createMemoryStoreProvider',
                },
              }
            : {
                storeEngine: 'fs_csv',
                storeRoot: 'context/memory/desktop-default',
              },
      },
    });
    const preloadBridge = bootstrap.getPreloadBridge();
    assertRequiredOperations(preloadBridge, sample.requiredOperations);

    const bootstrapSnapshot = await preloadBridge.bootstrap();
    const health = await preloadBridge.getHealth();
    const started = await preloadBridge.startExecution(
      {
        workspaceId: 'desktop-workspace',
        workspaceRoot,
        executionKind: OrchestrationExecutionKind.RUN,
        clientSurface: OrchestrationClientSurface.DESKTOP,
      },
      {
        processId: 'desktop-process',
        executionId: 'desktop-execution',
        executionSessionId: 'desktop-session',
      },
    );

    await preloadBridge.publishEvent({
      executionId: started.executionId,
      type: OrchestrationServiceEventType.ARTIFACT_READY,
      status: OrchestrationExecutionStatus.RUNNING,
      artifactId: 'artifact-desktop',
      artifactPath: resolve(workspaceRoot, 'artifact-desktop.json'),
      message: 'desktop artifact ready',
    });
    await preloadBridge.publishEvent({
      executionId: started.executionId,
      type: OrchestrationServiceEventType.EXECUTION_COMPLETED,
      status: OrchestrationExecutionStatus.COMPLETED,
      message: 'desktop execution completed',
    });

    const session = await preloadBridge.startSession();
    await preloadBridge.appendMessage(
      session.session.sessionId,
      OrchestrationSessionTranscriptRole.ASSISTANT,
      ['desktop baseline active'],
    );
    const listedExecutions = await preloadBridge.listExecutions({
      filter: {
        workspaceId: 'desktop-workspace',
      },
    });
    const artifactPane = await preloadBridge.queryArtifactPane({
      executionId: started.executionId,
      sessionId: session.session.sessionId,
    });
    const subscribedExecutions = await preloadBridge.subscribeExecution({
      executionId: started.executionId,
    });
    const resumedSession = await preloadBridge.resumeSession(session.session.sessionId);
    const listedSessions = await preloadBridge.listSessions({
      limit: 1,
    });
    const subscribedSessions = await preloadBridge.subscribeSession({
      sessionId: session.session.sessionId,
    });
    const wakeSnapshot = await preloadBridge.requestWindowWake('main-window');
    const notificationSnapshot = await preloadBridge.registerNotification('review-ready');
    const restartSnapshot = await preloadBridge.restartServiceHost('desktop-smoke-restart');
    const consoleSnapshot = await preloadBridge.buildGovernanceConsoleSnapshot({
      locale: 'en-US',
      workspaceLabel: 'desktop-workspace',
    });

    if (bootstrapSnapshot.health.lifecycleStatus !== sample.expectedLifecycleStatus) {
      throw new Error(
        `desktop bootstrap lifecycle="${bootstrapSnapshot.health.lifecycleStatus}", expected "${sample.expectedLifecycleStatus}"`,
      );
    }
    if (
      bootstrapSnapshot.baseline.artifactQueryGateState !== sample.expectedArtifactQueryGateState
    ) {
      throw new Error(
        `desktop artifact gate="${bootstrapSnapshot.baseline.artifactQueryGateState}", expected "${sample.expectedArtifactQueryGateState}"`,
      );
    }

    assertExpectedMemoryProvider(health.memoryProvider, expectedMemoryProvider, 'desktop health');
    assertExpectedMemoryProvider(
      started.memoryProvider,
      expectedMemoryProvider,
      'desktop startExecution',
    );

    if (listedExecutions.executions.length !== 1) {
      throw new Error('desktop execution list did not return exactly one execution.');
    }
    if (resumedSession.session.sessionId !== session.session.sessionId) {
      throw new Error('desktop resumeSession did not return the started session.');
    }
    if (listedSessions.sessions[0]?.sessionId !== session.session.sessionId) {
      throw new Error('desktop listSessions did not return the started session.');
    }
    if (subscribedSessions.session.sessionId !== session.session.sessionId) {
      throw new Error('desktop subscribeSession did not attach to the started session.');
    }
    if (artifactPane.resolvedSessionId !== session.session.sessionId) {
      throw new Error('desktop queryArtifactPane did not resolve the active session.');
    }
    if (!artifactPane.transcript[0]?.lines.includes('desktop baseline active')) {
      throw new Error('desktop queryArtifactPane did not return the appended transcript row.');
    }
    if (wakeSnapshot.windowWakeCount !== 1 || notificationSnapshot.notificationCount !== 1) {
      throw new Error('desktop lifecycle guard counts were not recorded as expected.');
    }
    if (restartSnapshot.restartCount !== 1) {
      throw new Error('desktop restart lifecycle guard did not increment restartCount.');
    }
    if (!consoleSnapshot.workspaceHome || !consoleSnapshot.sessionLane) {
      throw new Error('desktop governance console snapshot is incomplete.');
    }
    if (
      subscribedExecutions.events.map((event) => event.type).join('|') !==
      [
        OrchestrationServiceEventType.EXECUTION_STARTED,
        OrchestrationServiceEventType.ARTIFACT_READY,
        OrchestrationServiceEventType.EXECUTION_COMPLETED,
      ].join('|')
    ) {
      throw new Error(
        'desktop execution subscribe sequence did not match the expected smoke flow.',
      );
    }

    await bootstrap.dispose();
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }

  gateInfo(
    GATE_NAME,
    `desktop shell bootstrap smoke passed for ${options.distributionMode} distribution mode.`,
  );
  gatePass(GATE_NAME, 'desktop entry smoke passed.');
} catch (error) {
  gateFail(GATE_NAME, error instanceof Error ? error.message : String(error));
  process.exit(1);
}
