#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { dirname, isAbsolute, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { OrchestrationServiceLifecycleStatus } from '../../packages/orchestration-service-client/dist/src/constants/orchestration-service.constant.js';

import { gateFail, gateInfo, gatePass } from '../governance/gate-output.js';
import { packageVscodeExtensionDistribution } from './pack-vscode-extension.js';

const PROJECT_ROOT = fileURLToPath(new URL('../..', import.meta.url));
const GATE_NAME = 'release-verify-vscode-extension-distribution';
const DEFAULT_REPORT_PATH = resolve(
  PROJECT_ROOT,
  '.tmp/release-vscode-extension-distribution-report.json',
);
const VSIX_EXTRACT_ROOT_NAME = 'vsix-extracted';
const REQUIRED_ARCHIVE_ENTRIES = [
  'extension/package.json',
  'extension/package.nls.json',
  'extension/package.nls.zh-cn.json',
  'extension/readme.md',
  'extension/resources/governor.svg',
  'extension/dist/src/extension.js',
  'extension/dist/src/index.js',
  'extension/node_modules/.modules.yaml',
  'extension/node_modules/.pnpm/lock.yaml',
  'extension/node_modules/@repo-ai-governor/cli/package.json',
  'extension/node_modules/@repo-ai-governor/config/package.json',
];
const ALLOWED_SYMLINK_SEGMENTS = [
  '/node_modules/.bin/',
  '/node_modules/@langchain/core/node_modules/.bin/',
  '/node_modules/@langchain/langgraph-sdk/node_modules/.bin/',
];

/**
 * Resolves one isolated scratch workspace root for CLI-backed packaged smoke runs.
 * This keeps release verification from mutating the maintainer's live workspace truth surfaces.
 * @param {string} workingRoot Absolute packaging working root.
 * @param {string} smokeId Human-readable smoke lane label.
 * @returns {string}
 */
export function resolveCliBackedSmokeWorkspaceRoot(workingRoot, smokeId) {
  const normalizedSmokeId = smokeId
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, '-')
    .replace(/^-+|-+$/gu, '');
  return resolve(
    workingRoot,
    'cli-backed-smoke-workspaces',
    normalizedSmokeId.length > 0 ? normalizedSmokeId : 'default',
  );
}

/**
 * Checks whether one candidate path stays inside the declared parent root.
 * @param {string} parentRoot Absolute parent root.
 * @param {string} candidatePath Candidate path to validate.
 * @returns {boolean}
 */
function isPathInside(parentRoot, candidatePath) {
  const relativePath = relative(resolve(parentRoot), resolve(candidatePath));
  return relativePath === '' || (!relativePath.startsWith('..') && !isAbsolute(relativePath));
}

/**
 * Reads one `key=value` entry from layered log lines.
 * @param {string[] | undefined} logLines Candidate layered log lines.
 * @param {string} key Key prefix to match.
 * @returns {string | null}
 */
function readLayeredLogValue(logLines, key) {
  if (!Array.isArray(logLines)) {
    return null;
  }

  const prefix = `${key}=`;
  const matchedLine = logLines.find((line) => typeof line === 'string' && line.startsWith(prefix));
  if (!matchedLine) {
    return null;
  }

  const value = matchedLine.slice(prefix.length).trim();
  return value.length > 0 ? value : null;
}

/**
 * Parses CLI options for packaged-extension verification.
 * @returns {{outputPath: string; workingRoot: string | undefined}}
 */
function parseCliOptions() {
  const args = process.argv.slice(2);
  let outputPath = DEFAULT_REPORT_PATH;
  let workingRoot;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === '--') {
      continue;
    }

    if (arg === '--output') {
      const candidatePath = args[index + 1]?.trim();
      if (!candidatePath) {
        throw new Error('Expected a non-empty value after "--output".');
      }
      outputPath = resolve(PROJECT_ROOT, candidatePath);
      index += 1;
      continue;
    }

    if (arg === '--working-root') {
      const candidatePath = args[index + 1]?.trim();
      if (!candidatePath) {
        throw new Error('Expected a non-empty value after "--working-root".');
      }
      workingRoot = candidatePath;
      index += 1;
      continue;
    }

    throw new Error(`Unsupported option: ${arg}`);
  }

  return {
    outputPath,
    workingRoot,
  };
}

/**
 * Writes one JSON report to disk.
 * @param {string} outputPath Output file path.
 * @param {Record<string, unknown>} payload Report payload.
 */
function writeReport(outputPath, payload) {
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
}

/**
 * Lists archive entries from one VSIX file.
 * @param {string} vsixPath Absolute VSIX path.
 * @returns {string[]}
 */
function listArchiveEntries(vsixPath) {
  const result = spawnSync('unzip', ['-Z1', vsixPath], {
    cwd: PROJECT_ROOT,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  if (result.error) {
    throw new Error(`unzip failed to execute: ${result.error.message}`);
  }

  if (result.status !== 0) {
    throw new Error(`unzip failed (exit=${result.status}) stderr="${result.stderr.trim()}"`);
  }

  return result.stdout
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

/**
 * Creates a minimal runtime stub for the editor-host-provided `vscode` module.
 * @param {string} packageRoot Absolute packaged extension root.
 * @returns {string}
 */
function installVscodeStub(packageRoot) {
  const stubRoot = resolve(packageRoot, 'node_modules/vscode');
  mkdirSync(stubRoot, { recursive: true });
  writeFileSync(
    resolve(stubRoot, 'package.json'),
    `${JSON.stringify(
      {
        name: 'vscode',
        version: '0.0.0-smoke',
        type: 'module',
        exports: './index.js',
      },
      null,
      2,
    )}\n`,
    'utf8',
  );
  writeFileSync(
    resolve(stubRoot, 'index.js'),
    [
      'const noop = () => undefined;',
      'export const workspace = {};',
      'export const window = {};',
      'export const commands = { executeCommand: noop, registerCommand: noop };',
      'export const languages = { registerCodeActionsProvider: noop };',
      'export const Uri = { joinPath: () => ({}) };',
      'export const CodeActionKind = { QuickFix: {} };',
      'export default { workspace, window, commands, languages, Uri, CodeActionKind };',
      '',
    ].join('\n'),
    'utf8',
  );
  return stubRoot;
}

/**
 * Executes a module-resolution smoke against the packaged extension root.
 * @param {string} packageRoot Absolute packaged extension root.
 * @returns {Promise<{mainEntry: string; exportEntry: string}>}
 */
async function runPackagedModuleSmoke(packageRoot) {
  const manifest = JSON.parse(readFileSync(resolve(packageRoot, 'package.json'), 'utf8'));
  const stubRoot = installVscodeStub(packageRoot);

  try {
    const mainEntry = resolve(packageRoot, manifest.main);
    const exportEntry = resolve(packageRoot, manifest.exports['.'].default);
    const mainModule = await import(`${pathToFileURL(mainEntry).href}?smoke=${Date.now()}`);
    const exportModule = await import(`${pathToFileURL(exportEntry).href}?smoke=${Date.now() + 1}`);

    if (typeof mainModule.activate !== 'function' || typeof mainModule.deactivate !== 'function') {
      throw new Error(
        'Packaged extension main entry did not expose activate/deactivate functions.',
      );
    }

    if (typeof exportModule.VsCodeExtensionContract !== 'function') {
      throw new Error('Packaged extension export entry did not expose VsCodeExtensionContract.');
    }

    return {
      mainEntry,
      exportEntry,
    };
  } finally {
    rmSync(stubRoot, { recursive: true, force: true });
  }
}

/**
 * Executes one real sidecar health + queue-overview smoke against a packaged extension root.
 * @param {string} packageRoot Absolute packaged extension root.
 * @returns {Promise<{serviceLifecycle: string; queueGeneratedAt: string}>}
 */
async function runPackagedSidecarSmoke(packageRoot) {
  const clientModulePath = resolve(
    packageRoot,
    'node_modules/@repo-ai-governor/core-orchestration-service/dist/src/local-orchestration-service-sidecar-client.js',
  );
  const clientModule = await import(`${pathToFileURL(clientModulePath).href}?smoke=${Date.now()}`);
  const client = new clientModule.LocalOrchestrationServiceSidecarClient(PROJECT_ROOT, {
    repositoryRoot: PROJECT_ROOT,
  });

  try {
    const health = await client.getHealth();
    const queueOverview = await client.queryQueueOverview({
      limit: 1,
      laneLimit: 1,
      workspaceLimit: 1,
    });
    return {
      serviceLifecycle: health.lifecycleStatus,
      queueGeneratedAt: queueOverview.generatedAt,
    };
  } finally {
    await client.dispose().catch(() => undefined);
  }
}

function readCommandRequestsFromHtml(html, commandId) {
  const escapedCommandId = commandId.replaceAll('.', '\\.');
  const matches = [...html.matchAll(new RegExp(`command:${escapedCommandId}\\?([^"]+)`, 'g'))];
  return matches.map((match) => {
    const encodedRequest = match[1];
    if (!encodedRequest) {
      return {};
    }
    const [request] = JSON.parse(decodeURIComponent(String(encodedRequest)));
    return request ?? {};
  });
}

/**
 * Executes one packaged Workflow Studio projection smoke against the built extension payload.
 * @param {string} packageRoot Absolute packaged extension root.
 * @returns {Promise<{
 *   graphHeadingPresent: boolean;
 *   stageNavigationPresent: boolean;
 *   backlinkRevealPresent: boolean;
 *   focusedBacklinkActionPresent: boolean;
 *   focusRequests: Record<string, unknown>[];
 *   handoffRequests: Record<string, unknown>[];
 * }>}
 */
async function runPackagedWorkflowStudioSmoke(packageRoot) {
  const builderModulePath = resolve(
    packageRoot,
    'dist/src/runtime/vscode-extension-presentation-builder.js',
  );
  // dynamic-import-allowed: packaged release smoke must load the built Workflow Studio presenter
  // from the extracted VSIX so the verification covers distribution output instead of source files.
  const builderModule = await import(
    `${pathToFileURL(builderModulePath).href}?workflow-studio-smoke=${Date.now()}`
  );
  const builder = new builderModule.VsCodeExtensionPresentationBuilder({
    localizeText(englishText) {
      return englishText;
    },
  });
  const html = builder.buildWorkflowStudioHtml({
    workspaceContext: {
      workspaceLabel: 'packaged-root',
      workspaceRoot: '/repo',
      workspaceTrusted: true,
    },
    queueOverview: {
      generatedAt: '2026-04-23T00:00:00.000Z',
      automationInbox: [],
      reviewQueue: [],
      parallelLanes: [],
      workspaceSummary: [],
      temporaryBridges: [],
      notificationOwnership: {
        ownerSurface: 'desktop',
        pendingItemCount: 0,
        dueSoonItemCount: 0,
        overdueItemCount: 0,
        activeWorkspaceCount: 1,
        defaultFollowUpSlaMinutes: 60,
        notificationStatus: 'idle',
      },
    },
    selectedExecution: {
      execution: {
        executionId: 'execution-1',
        executionSessionId: 'session-1',
        processId: 'process-1',
        workspaceId: 'workspace-1',
        workspaceRoot: '/repo',
        executionKind: 'run',
        status: 'running',
        currentStageId: 'review_verify',
        pendingHitl: true,
      },
      actions: [],
      handoffTargets: [],
    },
    workflowDraftSession: {
      workflowDraftId: 'workflow-draft-001',
      draftRevision: 'draft-revision-001',
      baseDefinitionRevision: 'definition-revision-001',
      templateId: 'parallel-review',
      entryMode: 'edit_seed',
      nodeSpecs: [
        {
          nodeId: 'entry-node',
          stageId: 'review_verify',
          nodeType: 'task',
          routeKey: 'review',
          roleProfileId: 'reviewer-default',
          inputSchemaRef: 'schemas/review-input.json',
          outputSchemaRef: 'schemas/review-output.json',
        },
        {
          nodeId: 'decision-node',
          stageId: 'hitl_gate',
          nodeType: 'condition',
          routeKey: 'gate',
          roleProfileId: 'governor-default',
        },
      ],
      edgeSpecs: [
        {
          fromNodeId: 'entry-node',
          toNodeId: 'decision-node',
          conditionKey: 'needs_hitl',
        },
      ],
      supportedPatchOps: ['upsert_node', 'upsert_edge', 'validate', 'commit'],
      validationIssues: [],
      conflictState: {
        hasConflict: false,
        conflictKind: 'none',
        detectedAt: '2026-04-23T00:00:00.000Z',
      },
      compiledIrPreview: {
        processId: 'process-1',
        entryNodeId: 'entry-node',
        compiledAt: '2026-04-23T00:00:00.000Z',
        nodeCount: 2,
        edgeCount: 1,
        compileWarningCount: 0,
        compileErrorCount: 0,
        compileWarnings: [],
        compileErrors: [],
      },
      backlinkArtifacts: [
        {
          artifactId: 'artifact-1',
          artifactKind: 'review_document',
          artifactPath: '/repo/.repo-ai-governor/review/resolved.md',
        },
      ],
    },
    workflowFocusBacklinkTarget: '/repo',
    workflowFocusBacklinkKind: 'workspace',
    artifactPane: {
      artifacts: [],
      reviews: [],
      transcript: [],
      resolvedExecutionId: 'execution-1',
      resolvedSessionId: 'session-1',
      reviewSourcePath: '/repo/.repo-ai-governor/review/resolved.md',
      reviewLifecycle: {
        totalReviewCount: 1,
        pendingReviewCount: 0,
        verifiedReviewCount: 0,
        resolvedReviewCount: 1,
        latestReviewId: 'review-1',
        latestLifecycleStatus: 'resolved',
        latestReviewFilePath: '/repo/.repo-ai-governor/review/resolved.md',
        navigationReviewIds: ['review-1'],
      },
      workbench: {
        artifactCount: 1,
        reviewCount: 1,
        transcriptCount: 0,
        latestArtifactId: 'artifact-1',
        latestArtifactPath: '/repo/.repo-ai-governor/context/review.md',
        latestReviewId: 'review-1',
        latestReviewFilePath: '/repo/.repo-ai-governor/review/resolved.md',
      },
      evidenceBacklinks: {
        governanceWorkspacePath: '/repo/.repo-ai-governor',
        artifactPaths: ['/repo/.repo-ai-governor/context/review.md'],
        reviewPaths: ['/repo/.repo-ai-governor/review/resolved.md'],
        transcriptEntryIds: [],
      },
      policyTrace: {
        executionId: 'execution-1',
        executionStatus: 'running',
        pendingHitl: true,
        recoveryCapable: true,
        currentStageId: 'review_verify',
        latestEventType: 'stage.progress',
        latestArtifactId: 'artifact-1',
        latestArtifactPath: '/repo/.repo-ai-governor/context/review.md',
        taskId: 'TK-1049',
        projectId: 'project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout',
        sprintId: 'sprint-003-richer-graph-editing-and-support-truth-readiness',
        reviewDocumentPath: '/repo/.repo-ai-governor/review/resolved.md',
      },
    },
    roleLaneStatus: {
      generatedAt: '2026-04-23T00:00:00.000Z',
      returnedCount: 1,
      totalMatchedCount: 1,
      lanes: [
        {
          roleId: 'reviewer-default',
          executionId: 'execution-1',
          sessionId: 'session-1',
          currentStageId: 'review_verify',
          status: 'waiting_for_hitl',
          latestEventType: 'hitl.required',
          updatedAt: '2026-04-23T00:00:00.000Z',
          pendingHitl: true,
          artifactBacklinks: [
            {
              backlinkId: 'execution-1:artifact:1',
              backlinkKind: 'artifact',
              label: '/repo/.repo-ai-governor/context/review.md',
              target: '/repo/.repo-ai-governor/context/review.md',
            },
          ],
          reviewBacklinks: [
            {
              backlinkId: 'execution-1:review:1',
              backlinkKind: 'review',
              label: '/repo/.repo-ai-governor/review/resolved.md',
              target: '/repo/.repo-ai-governor/review/resolved.md',
            },
          ],
        },
      ],
    },
    sessionContinuity: {
      sessionId: 'session-1',
      sessionStatus: 'active',
      currentRouteId: 'workflow_authoring',
      latestTurnId: 'turn-1',
      latestEventSequence: 7,
      nextCursor: 'cursor-session-1',
      resumeSelector: 'session://execution-1',
    },
    hitlDecisionPacket: {
      executionId: 'execution-1',
      executionSessionId: 'session-1',
      taskId: 'TK-1049',
      reviewId: 'review-1',
      riskFacts: [
        {
          riskId: 'execution-1:risk-hitl-pending',
          riskCategory: 'hitl-decision-pending',
          riskLevel: 'L2',
          evidence: ['execution_id=execution-1'],
          changeScope: 'TK-1049',
          confidence: 0.86,
          triggerRule: 'runtime-hitl-pending',
        },
      ],
      policyAction: 'confirm',
      defaultTimeoutAction: 'block',
      allowedDecisions: [
        {
          optionId: 'execution-1:approve-resume',
          decision: 'approve',
          resumeAction: 'resume',
        },
      ],
      impactSummary: 'Execution execution-1 is waiting for one HITL decision.',
      backlinks: [
        {
          backlinkId: 'execution-1:workspace',
          backlinkKind: 'workspace',
          label: '/repo',
          target: '/repo',
        },
        {
          backlinkId: 'execution-1:review:1',
          backlinkKind: 'review',
          label: '/repo/.repo-ai-governor/review/resolved.md',
          target: '/repo/.repo-ai-governor/review/resolved.md',
        },
      ],
    },
    reviewSourcePath: '/repo/.repo-ai-governor/review/resolved.md',
  });

  return {
    graphHeadingPresent: html.includes('Workflow graph projection'),
    stageNavigationPresent: html.includes('Stage navigation'),
    backlinkRevealPresent: html.includes('Backlink reveal'),
    focusedBacklinkActionPresent: html.includes('Open focused backlink target'),
    focusRequests: readCommandRequestsFromHtml(html, 'repoAiGovernor.openWorkflowStudio'),
    handoffRequests: readCommandRequestsFromHtml(html, 'repoAiGovernor.openHandoffTarget'),
  };
}

/**
 * Executes one packaged secure-authoring + doctor smoke so CLI-backed runtime seams stay truthful.
 * Any temporary workspace-operation snapshot written during the smoke is restored afterwards.
 * @param {string} packageRoot Absolute packaged extension root.
 * @param {string} workingRoot Absolute packaging working root.
 * @param {string} smokeId Human-readable smoke lane label.
 * @returns {Promise<{smokeWorkspaceRoot: string; secureAuthoringDegradedReason: string | null; doctorOperation: string; doctorSummary: string; doctorDiagnosticsPath: string | null; resolvedWorkspaceRoot: string | null; doctorCheckTotals?: {pass?: number; warn?: number; fail?: number}}>}
 */
async function runPackagedCliBackedSmoke(packageRoot, workingRoot, smokeId) {
  const workspaceOpsModulePath = resolve(
    packageRoot,
    'node_modules/@repo-ai-governor/core-orchestration-service/dist/src/local-orchestration-service-workspace-ops-runtime.js',
  );
  // dynamic-import-allowed: packaged release smoke must load the built workspace-ops runtime from
  // the extracted VSIX so CLI-backed verification exercises shipped artifacts only.
  const workspaceOpsModule = await import(
    `${pathToFileURL(workspaceOpsModulePath).href}?smoke=${Date.now()}`
  );
  const smokeWorkspaceRoot = resolveCliBackedSmokeWorkspaceRoot(workingRoot, smokeId);
  rmSync(smokeWorkspaceRoot, { recursive: true, force: true });
  mkdirSync(smokeWorkspaceRoot, { recursive: true });
  const runtime = new workspaceOpsModule.LocalOrchestrationServiceWorkspaceOpsRuntime({
    workspaceRoot: smokeWorkspaceRoot,
    repositoryRoot: PROJECT_ROOT,
  });

  const secureAuthoring = await runtime.querySecureAuthoring({
    locale: 'en-US',
  });
  const doctorResponse = await runtime.runWorkspaceOperation({
    operationKind: 'doctor',
    locale: 'en-US',
  });
  return {
    smokeWorkspaceRoot,
    secureAuthoringDegradedReason: secureAuthoring.degradedReason ?? null,
    doctorOperation: doctorResponse.result.operation,
    doctorSummary: doctorResponse.result.summary,
    doctorDiagnosticsPath:
      doctorResponse.result.artifacts?.find((artifact) => artifact.id === 'doctor_diagnostics')
        ?.path ?? null,
    resolvedWorkspaceRoot:
      readLayeredLogValue(doctorResponse.result.layeredLogs?.detailed, 'workspace_root') ?? null,
    ...(doctorResponse.result.checkTotals
      ? {
          doctorCheckTotals: doctorResponse.result.checkTotals,
        }
      : {}),
  };
}

/**
 * Enforces the release-evidence contract for one packaged sidecar smoke path.
 * @param {string} smokeLabel Human-readable packaged path label.
 * @param {{serviceLifecycle: string; queueGeneratedAt: string}} sidecarSmoke Recorded smoke result.
 * @returns {{serviceLifecycle: string; queueGeneratedAt: string}}
 */
export function assertReadySidecarSmoke(smokeLabel, sidecarSmoke) {
  if (sidecarSmoke.serviceLifecycle !== OrchestrationServiceLifecycleStatus.READY) {
    throw new Error(
      `${smokeLabel} sidecar smoke must report lifecycle "${OrchestrationServiceLifecycleStatus.READY}" before distribution verification can pass (received "${sidecarSmoke.serviceLifecycle}")`,
    );
  }

  return sidecarSmoke;
}

/**
 * Enforces the supported release-evidence contract for one packaged CLI-backed smoke path.
 *
 * Why this exists:
 * the packaging gate proves executable secure-authoring plus scratch-isolated doctor diagnostics
 * capture for the packaged root and extracted VSIX views. The recorded doctor check totals remain
 * truth-carrying evidence and may still contain non-blocking warnings under the current contract.
 *
 * @param {string} smokeLabel Human-readable packaged path label.
 * @param {{smokeWorkspaceRoot: string; secureAuthoringDegradedReason: string | null; doctorOperation: string; doctorSummary: string; doctorDiagnosticsPath: string | null; resolvedWorkspaceRoot: string | null; doctorCheckTotals?: {pass?: number; warn?: number; fail?: number}}} cliBackedSmoke Recorded smoke result.
 * @returns {{smokeWorkspaceRoot: string; secureAuthoringDegradedReason: string | null; doctorOperation: string; doctorSummary: string; doctorDiagnosticsPath: string | null; resolvedWorkspaceRoot: string | null; doctorCheckTotals?: {pass?: number; warn?: number; fail?: number}}}
 */
export function assertSupportedCliBackedSmoke(smokeLabel, cliBackedSmoke) {
  if (
    typeof cliBackedSmoke.secureAuthoringDegradedReason === 'string' &&
    cliBackedSmoke.secureAuthoringDegradedReason.trim().length > 0
  ) {
    throw new Error(
      `${smokeLabel} secure-authoring smoke must not degrade before distribution verification can pass (received "${cliBackedSmoke.secureAuthoringDegradedReason}")`,
    );
  }

  if (cliBackedSmoke.doctorOperation !== 'env_doctor') {
    throw new Error(
      `${smokeLabel} doctor smoke must report operation "env_doctor" before distribution verification can pass (received "${cliBackedSmoke.doctorOperation}")`,
    );
  }

  if (
    typeof cliBackedSmoke.doctorSummary !== 'string' ||
    cliBackedSmoke.doctorSummary.trim().length === 0
  ) {
    throw new Error(
      `${smokeLabel} doctor smoke must return a non-empty summary before distribution verification can pass.`,
    );
  }

  if (
    typeof cliBackedSmoke.smokeWorkspaceRoot !== 'string' ||
    cliBackedSmoke.smokeWorkspaceRoot.trim().length === 0
  ) {
    throw new Error(
      `${smokeLabel} doctor smoke must declare the scratch workspace root before distribution verification can pass.`,
    );
  }

  if (
    typeof cliBackedSmoke.resolvedWorkspaceRoot !== 'string' ||
    cliBackedSmoke.resolvedWorkspaceRoot.trim().length === 0
  ) {
    throw new Error(
      `${smokeLabel} doctor smoke must report the effective workspace_root before distribution verification can pass.`,
    );
  }

  if (
    resolve(cliBackedSmoke.smokeWorkspaceRoot) !== resolve(cliBackedSmoke.resolvedWorkspaceRoot)
  ) {
    throw new Error(
      `${smokeLabel} doctor smoke must resolve workspace_root to "${cliBackedSmoke.smokeWorkspaceRoot}" (received "${cliBackedSmoke.resolvedWorkspaceRoot}")`,
    );
  }

  if (
    typeof cliBackedSmoke.doctorDiagnosticsPath !== 'string' ||
    cliBackedSmoke.doctorDiagnosticsPath.trim().length === 0
  ) {
    throw new Error(
      `${smokeLabel} doctor smoke must report the diagnostics artifact path before distribution verification can pass.`,
    );
  }

  const expectedDiagnosticsRoot = resolve(
    cliBackedSmoke.smokeWorkspaceRoot,
    'context',
    'diagnostics',
    'doctor',
  );
  if (!isPathInside(expectedDiagnosticsRoot, cliBackedSmoke.doctorDiagnosticsPath)) {
    throw new Error(
      `${smokeLabel} doctor smoke must keep diagnostics inside "${expectedDiagnosticsRoot}" (received "${cliBackedSmoke.doctorDiagnosticsPath}")`,
    );
  }

  return cliBackedSmoke;
}

/**
 * Enforces the packaged Workflow Studio projection smoke contract.
 * @param {string} smokeLabel Human-readable packaged path label.
 * @param {{
 *   graphHeadingPresent: boolean;
 *   stageNavigationPresent: boolean;
 *   backlinkRevealPresent: boolean;
 *   focusedBacklinkActionPresent: boolean;
 *   focusRequests: Record<string, unknown>[];
 *   handoffRequests: Record<string, unknown>[];
 * }} workflowStudioSmoke Recorded workbench smoke result.
 * @returns {{
 *   graphHeadingPresent: boolean;
 *   stageNavigationPresent: boolean;
 *   backlinkRevealPresent: boolean;
 *   focusedBacklinkActionPresent: boolean;
 *   focusRequests: Record<string, unknown>[];
 *   handoffRequests: Record<string, unknown>[];
 * }}
 */
export function assertWorkflowStudioProjectionSmoke(smokeLabel, workflowStudioSmoke) {
  if (!workflowStudioSmoke.graphHeadingPresent) {
    throw new Error(
      `${smokeLabel} workflow-studio smoke must render the graph projection section.`,
    );
  }
  if (!workflowStudioSmoke.stageNavigationPresent) {
    throw new Error(
      `${smokeLabel} workflow-studio smoke must render the stage navigation section.`,
    );
  }
  if (!workflowStudioSmoke.backlinkRevealPresent) {
    throw new Error(`${smokeLabel} workflow-studio smoke must render the backlink reveal section.`);
  }
  if (!workflowStudioSmoke.focusedBacklinkActionPresent) {
    throw new Error(
      `${smokeLabel} workflow-studio smoke must render the focused backlink action surface.`,
    );
  }
  if (
    !workflowStudioSmoke.focusRequests.some(
      (request) =>
        request.clearWorkflowFocus === true && request.workflowFocusStageId === 'review_verify',
    )
  ) {
    throw new Error(
      `${smokeLabel} workflow-studio smoke must expose one stage-focus command for review_verify.`,
    );
  }
  if (
    !workflowStudioSmoke.focusRequests.some(
      (request) =>
        request.clearWorkflowFocus === true &&
        request.workflowFocusBacklinkTarget === '/repo/.repo-ai-governor/review/resolved.md' &&
        request.workflowFocusBacklinkKind === 'review',
    )
  ) {
    throw new Error(
      `${smokeLabel} workflow-studio smoke must expose one backlink-focus command for the canonical review path.`,
    );
  }
  if (
    !workflowStudioSmoke.focusRequests.some(
      (request) =>
        request.clearWorkflowFocus === true &&
        request.workflowFocusBacklinkTarget === '/repo' &&
        request.workflowFocusBacklinkKind === 'workspace',
    )
  ) {
    throw new Error(
      `${smokeLabel} workflow-studio smoke must expose one backlink-focus command for the canonical workspace path.`,
    );
  }
  if (
    !workflowStudioSmoke.handoffRequests.some(
      (request) =>
        request.workflowFocusBacklinkTarget === '/repo' &&
        request.workflowFocusBacklinkKind === 'workspace',
    )
  ) {
    throw new Error(
      `${smokeLabel} workflow-studio smoke must expose one safe worktree handoff action for the focused workspace backlink.`,
    );
  }

  return workflowStudioSmoke;
}

/**
 * Extracts one VSIX into a temp directory and returns the unpacked extension root.
 * @param {string} vsixPath Absolute VSIX path.
 * @param {string} workingRoot Absolute packaging working root.
 * @returns {string}
 */
export function extractVsix(vsixPath, workingRoot) {
  const extractRoot = resolve(workingRoot, VSIX_EXTRACT_ROOT_NAME);
  rmSync(extractRoot, { recursive: true, force: true });
  mkdirSync(extractRoot, { recursive: true });

  const result = spawnSync('unzip', ['-q', vsixPath, '-d', extractRoot], {
    cwd: PROJECT_ROOT,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  if (result.error) {
    throw new Error(`unzip failed to execute: ${result.error.message}`);
  }

  if (result.status !== 0) {
    throw new Error(`unzip failed (exit=${result.status}) stderr="${result.stderr.trim()}"`);
  }

  return resolve(extractRoot, 'extension');
}

/**
 * Collects packaged symlink paths so verification can block runtime-relevant symlink payload.
 * @param {string} rootPath Absolute root to inspect.
 * @returns {string[]}
 */
function collectSymbolicLinks(rootPath) {
  const pendingDirectories = [rootPath];
  const symbolicLinks = [];

  while (pendingDirectories.length > 0) {
    const currentDirectoryPath = pendingDirectories.pop();
    if (!currentDirectoryPath || !existsSync(currentDirectoryPath)) {
      continue;
    }

    for (const entry of readdirSync(currentDirectoryPath, { withFileTypes: true })) {
      const entryPath = resolve(currentDirectoryPath, entry.name);
      const entryStat = lstatSync(entryPath);

      if (entryStat.isSymbolicLink()) {
        symbolicLinks.push(entryPath);
        continue;
      }

      if (entry.isDirectory()) {
        pendingDirectories.push(entryPath);
      }
    }
  }

  return symbolicLinks.sort();
}

/**
 * Ensures packaged runtime payload does not rely on install-time-unsafe symlinks.
 * @param {string} rootPath Absolute root to inspect.
 * @returns {string[]}
 */
export function verifySymlinkPayload(rootPath) {
  const symbolicLinks = collectSymbolicLinks(rootPath);
  const disallowedSymbolicLinks = symbolicLinks.filter(
    (symbolicLinkPath) =>
      !ALLOWED_SYMLINK_SEGMENTS.some((allowedSegment) => symbolicLinkPath.includes(allowedSegment)),
  );

  if (disallowedSymbolicLinks.length > 0) {
    throw new Error(
      `Packaged extension contains install-unsafe symlinks: ${disallowedSymbolicLinks.join(', ')}`,
    );
  }

  return symbolicLinks;
}

async function main() {
  try {
    const options = parseCliOptions();
    const packReport = packageVscodeExtensionDistribution({
      workingRoot: options.workingRoot,
    });

    if (!existsSync(packReport.vsixPath)) {
      throw new Error(`Packaged VSIX is missing: ${packReport.vsixPath}`);
    }

    const archiveEntries = listArchiveEntries(packReport.vsixPath);
    for (const requiredEntry of REQUIRED_ARCHIVE_ENTRIES) {
      if (!archiveEntries.includes(requiredEntry)) {
        throw new Error(`VSIX archive is missing required entry: ${requiredEntry}`);
      }
    }

    const moduleSmoke = await runPackagedModuleSmoke(packReport.packageRoot);
    const packageSidecarSmoke = assertReadySidecarSmoke(
      'packaged root',
      await runPackagedSidecarSmoke(packReport.packageRoot),
    );
    const packageWorkflowStudioSmoke = assertWorkflowStudioProjectionSmoke(
      'packaged root',
      await runPackagedWorkflowStudioSmoke(packReport.packageRoot),
    );
    const packageCliBackedSmoke = assertSupportedCliBackedSmoke(
      'packaged root',
      await runPackagedCliBackedSmoke(
        packReport.packageRoot,
        packReport.workingRoot,
        'packaged-root',
      ),
    );
    const packageSymlinks = verifySymlinkPayload(packReport.packageRoot);
    const extractedExtensionRoot = extractVsix(packReport.vsixPath, packReport.workingRoot);
    const extractedSymlinks = verifySymlinkPayload(extractedExtensionRoot);
    const installedModuleSmoke = await runPackagedModuleSmoke(extractedExtensionRoot);
    const installedSidecarSmoke = assertReadySidecarSmoke(
      'extracted VSIX',
      await runPackagedSidecarSmoke(extractedExtensionRoot),
    );
    const installedWorkflowStudioSmoke = assertWorkflowStudioProjectionSmoke(
      'extracted VSIX',
      await runPackagedWorkflowStudioSmoke(extractedExtensionRoot),
    );
    const installedCliBackedSmoke = assertSupportedCliBackedSmoke(
      'extracted VSIX',
      await runPackagedCliBackedSmoke(
        extractedExtensionRoot,
        packReport.workingRoot,
        'installed-vsix',
      ),
    );

    const report = {
      status: 'pass',
      vsixPath: packReport.vsixPath,
      packageRoot: packReport.packageRoot,
      archiveEntriesChecked: REQUIRED_ARCHIVE_ENTRIES,
      packageSymlinks,
      moduleSmoke,
      packageSidecarSmoke,
      packageWorkflowStudioSmoke,
      packageCliBackedSmoke,
      extractedExtensionRoot,
      extractedSymlinks,
      installedModuleSmoke,
      installedSidecarSmoke,
      installedWorkflowStudioSmoke,
      installedCliBackedSmoke,
    };

    writeReport(options.outputPath, report);
    gateInfo(GATE_NAME, `verified packaged VSIX at ${packReport.vsixPath}`);
    gatePass(
      GATE_NAME,
      `validated local VSIX archive and packaged extension root. report=${options.outputPath}`,
    );
    console.info(JSON.stringify(report, null, 2));
  } catch (error) {
    gateFail(GATE_NAME, error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  void main();
}
