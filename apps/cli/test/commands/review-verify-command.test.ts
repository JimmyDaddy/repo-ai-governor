import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, relative, resolve } from 'node:path';
import { promisify } from 'node:util';

import {
  CliReactThemePreset,
  GovernorErrorCode,
  RuntimeError,
  standardizeError,
} from '@repo-ai-governor/shared';
import { CliReviewVerifyCommand } from '../../src/commands/review-verify-command.js';
import {
  CLI_REVIEW_LEDGER_BACKFILL_STATUS,
  CLI_REVIEW_REQUEST_STATUS,
} from '../../src/constants/cli-governance-runtime.constant.js';
import { CliInteractiveUiMode } from '../../src/constants/cli-interactive-shell.constant.js';
import {
  CliReviewFindingRuleId,
  CliReviewFindingSeverity,
  CliReviewLifecycleStatus,
  CliReviewScopeMode,
} from '../../src/constants/cli-review.constant.js';
import { CliReviewQueueRuntime } from '../../src/runtime/artifacts/review-queue-runtime.js';
import type {
  CliCommandExecutorContext,
  CliReviewFinding,
  CliReviewRequestArtifactPayload,
} from '../../src/types/interfaces/index.js';

const execFileAsync = promisify(execFile);

interface ReviewVerifyFixture {
  tempRoot: string;
  workspaceRoot: string;
  reviewDirPath: string;
  requestDirectoryPath: string;
  resultDirectoryPath: string;
  command: CliReviewVerifyCommand;
  context: CliCommandExecutorContext;
}

async function createReviewVerifyFixture(
  options: {
    taskId?: string | null;
    recordLedger?: boolean;
    runNodeScript?: CliCommandExecutorContext['runNodeScript'];
  } = {},
): Promise<ReviewVerifyFixture> {
  const tempRoot = await mkdtemp(resolve(tmpdir(), 'review-verify-command-'));
  const workspaceRoot = resolve(tempRoot, '.repo-ai-governor');
  const reviewDirPath = resolve(workspaceRoot, 'context', 'review');
  const reviewQueueRuntime = new CliReviewQueueRuntime(workspaceRoot, async (filePath) => {
    try {
      return JSON.parse(await readFile(filePath, 'utf8')) as Record<string, unknown>;
    } catch {
      return null;
    }
  });
  const { requestDirectoryPath, resultDirectoryPath } =
    reviewQueueRuntime.resolveReviewQueueDirectories();
  await mkdir(requestDirectoryPath, { recursive: true });
  await mkdir(resultDirectoryPath, { recursive: true });
  await mkdir(reviewDirPath, { recursive: true });

  const artifactWriter = {
    writeTextArtifact: async (filePath: string, content: string) => {
      await mkdir(dirname(filePath), { recursive: true });
      await writeFile(filePath, content, 'utf8');
    },
    writeJsonArtifact: async (filePath: string, payload: unknown) => {
      await mkdir(dirname(filePath), { recursive: true });
      await writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
    },
    safeReadJson: async (filePath: string) => {
      try {
        return JSON.parse(await readFile(filePath, 'utf8')) as Record<string, unknown>;
      } catch {
        return null;
      }
    },
  };

  const context = {
    options: {
      currentWorkingDirectory: tempRoot,
      workspace: {
        workspaceId: 'test-workspace',
        repositoryRoot: tempRoot,
        workspaceRoot,
      },
      locale: 'en-US',
      outputMode: 'plain',
    },
    artifactWriter,
    reviewQueueRuntime,
    orchestrationServiceRuntime: {
      startExecution: async (_request: unknown, runtimeContext?: { executionId?: string }) => ({
        executionId: runtimeContext?.executionId ?? 'review-verify-fixture',
        executionSessionId: 'session-review-verify-fixture',
        acceptedAt: '2026-03-25T00:00:00Z',
        status: 'accepted',
        checkpointCapable: false,
        serviceHostKind: 'embedded',
        serviceTransportKind: 'in_process',
        eventStreamToken: 'stream-review-verify-fixture',
        latestEventSequence: 0,
        nextCursor: 'cursor-review-verify-fixture',
      }),
      publishEvent: async () => undefined,
      getExecution: async () => undefined,
    },
    commandExperienceBuilder: {
      buildExperiencePayload: (payload: unknown) => payload,
    },
    executeRunCommand: async () => {
      throw new RuntimeError(
        GovernorErrorCode.UNKNOWN,
        'executeRunCommand is not used in review-verify-command tests.',
      );
    },
    calculateCheckTotals: () => ({
      pass: 1,
      warn: 0,
      fail: 0,
    }),
    buildDefaultConfigContent: () => '',
    toRfc3339SecondsTimestamp: (value: Date) => value.toISOString().replace(/\.\d{3}Z$/u, 'Z'),
    formatExecFailureDetail: (error: unknown) => standardizeError(error).message,
    resolveRuntimeDebugOptions: () => ({
      interactive: false,
      requestedUiMode: null,
      requestedUiTheme: null,
      uiMode: CliInteractiveUiMode.NONE,
      uiTheme: CliReactThemePreset.GOVERNOR,
      uiFallbackBehavior: null,
      inputTty: false,
      stderrTty: false,
      dryRun: false,
      trace: false,
      replayPath: null,
      adapters: false,
      fix: false,
      recordLedger: options.recordLedger === true,
      taskId: options.taskId ?? null,
      restrictedNetwork: false,
      restrictedReason: null,
      allowLocalFallback: true,
      hitlDecision: null,
      hitlDecisionReason: null,
      hitlResumeAction: null,
      hitlDecidedBy: null,
      hitlConstraints: [],
    }),
    resolveExecutionStreamMetadata: async () => ({}),
    resolveAdapterVerification: async () => ({
      allRequiredRolesSatisfied: true,
      requiredRoleEvaluations: [],
      optionalRoleEvaluations: [],
      tools: [],
    }),
    canWritePath: async () => true,
    localizeText: (english: string) => english,
    translate: (key: string) => key,
    adapterDiagnosticsRuntime: {} as CliCommandExecutorContext['adapterDiagnosticsRuntime'],
    runNodeScript:
      options.runNodeScript ??
      (async () => ({
        stdout: '',
        stderr: '',
      })),
  } as unknown as CliCommandExecutorContext;

  return {
    tempRoot,
    workspaceRoot,
    reviewDirPath,
    requestDirectoryPath,
    resultDirectoryPath,
    command: new CliReviewVerifyCommand(),
    context,
  };
}

async function initGitRepository(repositoryRoot: string): Promise<void> {
  await execFileAsync('git', ['init'], {
    cwd: repositoryRoot,
  });
}

async function writeReviewArtifact(
  reviewDirPath: string,
  fileName: string,
  options: {
    status: CliReviewLifecycleStatus;
    taskId?: string | null;
  },
): Promise<string> {
  const filePath = resolve(reviewDirPath, fileName);
  await writeFile(
    filePath,
    [
      `# ${options.taskId ? `Code Review: ${options.taskId}` : 'Code Review: working tree'}`,
      '',
      `- Status: ${options.status}`,
      '- Date: 2026-04-04',
      '- Reviewer: repo-ai-governor CLI',
      `- Task: \`${options.taskId ?? 'n/a'}\``,
      '',
      '## 1. Review Scope',
      '',
      '1. fixture scope',
      '',
      '## 2. Findings',
      '',
      'No actionable findings were identified for the current scope.',
      '',
      '## 3. Notes',
      '',
      '1. fixture note',
      '',
    ].join('\n'),
    'utf8',
  );
  return filePath;
}

async function writeQueuedRequest(
  fixture: ReviewVerifyFixture,
  fileName: string,
  payload: Omit<CliReviewRequestArtifactPayload, 'generatedArtifactPaths'>,
): Promise<string> {
  const filePath = resolve(fixture.requestDirectoryPath, fileName);
  await writeFile(
    filePath,
    `${JSON.stringify(
      {
        ...payload,
        generatedArtifactPaths: [
          relative(fixture.tempRoot, filePath).replace(/\\/gu, '/'),
          relative(fixture.tempRoot, payload.reviewArtifactPath).replace(/\\/gu, '/'),
        ],
      },
      null,
      2,
    )}\n`,
    'utf8',
  );
  return filePath;
}

function createRequestPayload(options: {
  requestId: string;
  workspaceRoot: string;
  reviewArtifactPath: string;
  reviewArtifactStatus: CliReviewLifecycleStatus;
  reviewSlug: string;
  findings?: CliReviewFinding[];
  taskId?: string | null;
  recordLedger?: boolean;
}): Omit<CliReviewRequestArtifactPayload, 'generatedArtifactPaths'> {
  return {
    requestId: options.requestId,
    status: CLI_REVIEW_REQUEST_STATUS.QUEUED,
    createdAt: '2026-04-04T00:00:00Z',
    workspaceId: 'test-workspace',
    workspaceRoot: options.workspaceRoot,
    locale: 'en-US',
    outputMode: 'plain',
    ...(options.taskId ? { taskId: options.taskId } : {}),
    recordLedger: options.recordLedger === true,
    reviewSlug: options.reviewSlug,
    reviewArtifactPath: options.reviewArtifactPath,
    reviewArtifactStatus: options.reviewArtifactStatus,
    scope: {
      reviewMode: options.taskId ? CliReviewScopeMode.TASK_SCOPE : CliReviewScopeMode.WORKING_TREE,
      scopeSummary: 'fixture review scope',
      reviewedPaths: [],
      excludedPaths: [],
      riskLevel: 'low',
      requiredAction: 'allow',
    },
    findings: options.findings ?? [],
    notes: [],
    diagnosticContext: {
      correlationId: `review-chain-${options.requestId}`,
      queueStage: 'review',
      chain: 'review->review-verify->ledger-backfill',
      ...(options.taskId ? { taskId: options.taskId } : {}),
      reviewChainMode: options.recordLedger ? 'managed_task_chain' : 'queued_external_chain',
    },
    orchestrationExecutionId: options.requestId,
    orchestrationEventStreamToken: `stream-${options.requestId}`,
  };
}

describe('CliReviewVerifyCommand', () => {
  it('consumes the queued request matching --task-id instead of blindly taking the latest request', async () => {
    const fixture = await createReviewVerifyFixture({
      taskId: 'TK-130',
    });

    try {
      const tk130ReviewArtifactPath = await writeReviewArtifact(
        fixture.reviewDirPath,
        'resolved_code_review_tk-130-review.md',
        {
          status: CliReviewLifecycleStatus.RESOLVED,
          taskId: 'TK-130',
        },
      );
      const tk131ReviewArtifactPath = await writeReviewArtifact(
        fixture.reviewDirPath,
        'resolved_code_review_tk-131-review.md',
        {
          status: CliReviewLifecycleStatus.RESOLVED,
          taskId: 'TK-131',
        },
      );
      const tk130RequestPath = await writeQueuedRequest(
        fixture,
        'review-100.json',
        createRequestPayload({
          requestId: 'review-100',
          workspaceRoot: fixture.workspaceRoot,
          reviewArtifactPath: tk130ReviewArtifactPath,
          reviewArtifactStatus: CliReviewLifecycleStatus.RESOLVED,
          reviewSlug: 'tk-130-review',
          taskId: 'TK-130',
        }),
      );
      const tk131RequestPath = await writeQueuedRequest(
        fixture,
        'review-200.json',
        createRequestPayload({
          requestId: 'review-200',
          workspaceRoot: fixture.workspaceRoot,
          reviewArtifactPath: tk131ReviewArtifactPath,
          reviewArtifactStatus: CliReviewLifecycleStatus.RESOLVED,
          reviewSlug: 'tk-131-review',
          taskId: 'TK-131',
        }),
      );

      const commandResult = await fixture.command.execute(fixture.context);
      const verifyArtifactPath = commandResult.commandResult.artifacts?.find(
        (artifact) => artifact.id === 'review_verify_result',
      )?.path;
      expect(typeof verifyArtifactPath).toBe('string');

      const verifyPayload = JSON.parse(await readFile(String(verifyArtifactPath), 'utf8')) as {
        taskId?: string;
        sourceRequestPath?: string;
      };
      expect(verifyPayload.taskId).toBe('TK-130');
      expect(verifyPayload.sourceRequestPath).toBe(tk130RequestPath);

      const tk130Payload = JSON.parse(await readFile(tk130RequestPath, 'utf8')) as {
        status?: string;
      };
      const tk131Payload = JSON.parse(await readFile(tk131RequestPath, 'utf8')) as {
        status?: string;
      };
      expect(tk130Payload.status).toBe(CLI_REVIEW_REQUEST_STATUS.VERIFIED);
      expect(tk131Payload.status).toBe(CLI_REVIEW_REQUEST_STATUS.QUEUED);
    } finally {
      await rm(fixture.tempRoot, { recursive: true, force: true });
    }
  });

  it('fails explicitly when --task-id does not match any queued request', async () => {
    const fixture = await createReviewVerifyFixture({
      taskId: 'TK-999',
    });

    try {
      const reviewArtifactPath = await writeReviewArtifact(
        fixture.reviewDirPath,
        'resolved_code_review_tk-130-review.md',
        {
          status: CliReviewLifecycleStatus.RESOLVED,
          taskId: 'TK-130',
        },
      );
      await writeQueuedRequest(
        fixture,
        'review-100.json',
        createRequestPayload({
          requestId: 'review-100',
          workspaceRoot: fixture.workspaceRoot,
          reviewArtifactPath,
          reviewArtifactStatus: CliReviewLifecycleStatus.RESOLVED,
          reviewSlug: 'tk-130-review',
          taskId: 'TK-130',
        }),
      );

      await expect(fixture.command.execute(fixture.context)).rejects.toMatchObject({
        code: GovernorErrorCode.UNKNOWN,
        message: expect.stringContaining('task_id=TK-999'),
      });
    } finally {
      await rm(fixture.tempRoot, { recursive: true, force: true });
    }
  });

  it('prefers unresolved queued requests over newer resolved no-op requests by default', async () => {
    const fixture = await createReviewVerifyFixture();

    try {
      const pendingReviewArtifactPath = await writeReviewArtifact(
        fixture.reviewDirPath,
        'code_review_working-tree-open.md',
        {
          status: CliReviewLifecycleStatus.REVIEW_PENDING,
          taskId: null,
        },
      );
      const resolvedReviewArtifactPath = await writeReviewArtifact(
        fixture.reviewDirPath,
        'resolved_code_review_working-tree-closed.md',
        {
          status: CliReviewLifecycleStatus.RESOLVED,
          taskId: null,
        },
      );
      const pendingFinding: CliReviewFinding = {
        findingId: 'code-change-without-test-change-apps-cli-src-open-scope-ts',
        fingerprint: `${CliReviewFindingRuleId.CODE_CHANGE_WITHOUT_TEST_CHANGE}:apps/cli/src/open-scope.ts:0`,
        ruleId: CliReviewFindingRuleId.CODE_CHANGE_WITHOUT_TEST_CHANGE,
        severity: CliReviewFindingSeverity.P2,
        title: 'Code change is missing matching test updates',
        file: 'apps/cli/src/open-scope.ts',
        summary: 'fixture summary',
        impact: 'fixture impact',
        suggestedAction: 'fixture action',
        evidence: ['apps/cli/src/open-scope.ts'],
      };
      const pendingRequestPath = await writeQueuedRequest(
        fixture,
        'review-100.json',
        createRequestPayload({
          requestId: 'review-100',
          workspaceRoot: fixture.workspaceRoot,
          reviewArtifactPath: pendingReviewArtifactPath,
          reviewArtifactStatus: CliReviewLifecycleStatus.REVIEW_PENDING,
          reviewSlug: 'working-tree-open',
          findings: [pendingFinding],
        }),
      );
      const resolvedRequestPath = await writeQueuedRequest(
        fixture,
        'review-200.json',
        createRequestPayload({
          requestId: 'review-200',
          workspaceRoot: fixture.workspaceRoot,
          reviewArtifactPath: resolvedReviewArtifactPath,
          reviewArtifactStatus: CliReviewLifecycleStatus.RESOLVED,
          reviewSlug: 'working-tree-closed',
        }),
      );

      const commandResult = await fixture.command.execute(fixture.context);
      const verifyArtifactPath = commandResult.commandResult.artifacts?.find(
        (artifact) => artifact.id === 'review_verify_result',
      )?.path;
      expect(typeof verifyArtifactPath).toBe('string');

      const verifyPayload = JSON.parse(await readFile(String(verifyArtifactPath), 'utf8')) as {
        sourceRequestPath?: string;
      };
      expect(verifyPayload.sourceRequestPath).toBe(pendingRequestPath);

      const pendingRequestPayload = JSON.parse(await readFile(pendingRequestPath, 'utf8')) as {
        status?: string;
      };
      const resolvedRequestPayload = JSON.parse(await readFile(resolvedRequestPath, 'utf8')) as {
        status?: string;
      };
      expect(pendingRequestPayload.status).toBe(CLI_REVIEW_REQUEST_STATUS.VERIFIED);
      expect(resolvedRequestPayload.status).toBe(CLI_REVIEW_REQUEST_STATUS.QUEUED);
    } finally {
      await rm(fixture.tempRoot, { recursive: true, force: true });
    }
  });

  it('prefers readable queued requests when a newer queued payload becomes unreadable during selection', async () => {
    const fixture = await createReviewVerifyFixture();

    try {
      const pendingReviewArtifactPath = await writeReviewArtifact(
        fixture.reviewDirPath,
        'code_review_working-tree-readable.md',
        {
          status: CliReviewLifecycleStatus.REVIEW_PENDING,
          taskId: null,
        },
      );
      const unreadableReviewArtifactPath = await writeReviewArtifact(
        fixture.reviewDirPath,
        'resolved_code_review_working-tree-unreadable.md',
        {
          status: CliReviewLifecycleStatus.RESOLVED,
          taskId: null,
        },
      );
      const pendingFinding: CliReviewFinding = {
        findingId: 'code-change-without-test-change-apps-cli-src-readable-scope-ts',
        fingerprint: `${CliReviewFindingRuleId.CODE_CHANGE_WITHOUT_TEST_CHANGE}:apps/cli/src/readable-scope.ts:0`,
        ruleId: CliReviewFindingRuleId.CODE_CHANGE_WITHOUT_TEST_CHANGE,
        severity: CliReviewFindingSeverity.P2,
        title: 'Code change is missing matching test updates',
        file: 'apps/cli/src/readable-scope.ts',
        summary: 'fixture summary',
        impact: 'fixture impact',
        suggestedAction: 'fixture action',
        evidence: ['apps/cli/src/readable-scope.ts'],
      };
      const readableRequestPath = await writeQueuedRequest(
        fixture,
        'review-100.json',
        createRequestPayload({
          requestId: 'review-100',
          workspaceRoot: fixture.workspaceRoot,
          reviewArtifactPath: pendingReviewArtifactPath,
          reviewArtifactStatus: CliReviewLifecycleStatus.REVIEW_PENDING,
          reviewSlug: 'working-tree-readable',
          findings: [pendingFinding],
        }),
      );
      const unreadableRequestPath = await writeQueuedRequest(
        fixture,
        'review-200.json',
        createRequestPayload({
          requestId: 'review-200',
          workspaceRoot: fixture.workspaceRoot,
          reviewArtifactPath: unreadableReviewArtifactPath,
          reviewArtifactStatus: CliReviewLifecycleStatus.RESOLVED,
          reviewSlug: 'working-tree-unreadable',
        }),
      );
      const originalSafeReadJson = fixture.context.artifactWriter.safeReadJson;
      fixture.context.artifactWriter.safeReadJson = async (filePath: string) =>
        filePath === unreadableRequestPath ? null : originalSafeReadJson(filePath);

      const commandResult = await fixture.command.execute(fixture.context);
      const verifyArtifactPath = commandResult.commandResult.artifacts?.find(
        (artifact) => artifact.id === 'review_verify_result',
      )?.path;
      expect(typeof verifyArtifactPath).toBe('string');

      const verifyPayload = JSON.parse(await readFile(String(verifyArtifactPath), 'utf8')) as {
        sourceRequestPath?: string;
      };
      expect(verifyPayload.sourceRequestPath).toBe(readableRequestPath);

      const readableRequestPayload = JSON.parse(await readFile(readableRequestPath, 'utf8')) as {
        status?: string;
      };
      const unreadableRequestPayload = JSON.parse(
        await readFile(unreadableRequestPath, 'utf8'),
      ) as {
        status?: string;
      };
      expect(readableRequestPayload.status).toBe(CLI_REVIEW_REQUEST_STATUS.VERIFIED);
      expect(unreadableRequestPayload.status).toBe(CLI_REVIEW_REQUEST_STATUS.QUEUED);
    } finally {
      await rm(fixture.tempRoot, { recursive: true, force: true });
    }
  });

  it('keeps the source request queued and transitions the artifact to verified when findings remain reproducible', async () => {
    const fixture = await createReviewVerifyFixture({
      taskId: 'TK-130',
    });

    try {
      await initGitRepository(fixture.tempRoot);
      const changedFilePath = resolve(fixture.tempRoot, 'apps', 'cli', 'src', 'open-scope.ts');
      await mkdir(dirname(changedFilePath), { recursive: true });
      await writeFile(changedFilePath, 'export const openScope = 1;\n', 'utf8');

      const sourceReviewArtifactPath = await writeReviewArtifact(
        fixture.reviewDirPath,
        'code_review_tk-130-open.md',
        {
          status: CliReviewLifecycleStatus.REVIEW_PENDING,
          taskId: 'TK-130',
        },
      );
      const sourceFinding: CliReviewFinding = {
        findingId: 'code-change-without-test-change-apps-cli-src-open-scope-ts',
        fingerprint: `${CliReviewFindingRuleId.CODE_CHANGE_WITHOUT_TEST_CHANGE}:apps/cli/src/open-scope.ts:0`,
        ruleId: CliReviewFindingRuleId.CODE_CHANGE_WITHOUT_TEST_CHANGE,
        severity: CliReviewFindingSeverity.P2,
        title: 'Code change is missing matching test updates',
        file: 'apps/cli/src/open-scope.ts',
        summary: 'fixture summary',
        impact: 'fixture impact',
        suggestedAction: 'fixture action',
        evidence: ['apps/cli/src/open-scope.ts'],
      };
      const sourceRequestPath = await writeQueuedRequest(
        fixture,
        'review-100.json',
        createRequestPayload({
          requestId: 'review-100',
          workspaceRoot: fixture.workspaceRoot,
          reviewArtifactPath: sourceReviewArtifactPath,
          reviewArtifactStatus: CliReviewLifecycleStatus.REVIEW_PENDING,
          reviewSlug: 'tk-130-open',
          taskId: 'TK-130',
          findings: [sourceFinding],
        }),
      );

      const commandResult = await fixture.command.execute(fixture.context);
      const verifyArtifactPath = commandResult.commandResult.artifacts?.find(
        (artifact) => artifact.id === 'review_verify_result',
      )?.path;
      const transitionedReviewArtifactPath = commandResult.commandResult.artifacts?.find(
        (artifact) => artifact.id === 'review_artifact',
      )?.path;

      expect(String(transitionedReviewArtifactPath)).toContain('verified_review_tk-130-open.md');

      const verifyPayload = JSON.parse(await readFile(String(verifyArtifactPath), 'utf8')) as {
        overallDecision?: string;
        reviewArtifactStatus?: string;
      };
      expect(verifyPayload.overallDecision).toBe('accepted');
      expect(verifyPayload.reviewArtifactStatus).toBe('verified');

      const sourceRequestPayload = JSON.parse(await readFile(sourceRequestPath, 'utf8')) as {
        status?: string;
        reviewArtifactStatus?: string;
        lastVerifyAttemptAt?: string;
      };
      expect(sourceRequestPayload.status).toBe(CLI_REVIEW_REQUEST_STATUS.QUEUED);
      expect(sourceRequestPayload.reviewArtifactStatus).toBe('verified');
      expect(typeof sourceRequestPayload.lastVerifyAttemptAt).toBe('string');
    } finally {
      await rm(fixture.tempRoot, { recursive: true, force: true });
    }
  });

  it('keeps the source request queued when managed ledger backfill fails', async () => {
    const fixture = await createReviewVerifyFixture({
      taskId: 'TK-130',
      recordLedger: true,
      runNodeScript: async () => {
        throw new RuntimeError(GovernorErrorCode.UNKNOWN, 'synthetic ledger sync failure');
      },
    });

    try {
      const sourceReviewArtifactPath = await writeReviewArtifact(
        fixture.reviewDirPath,
        'resolved_code_review_tk-130-review.md',
        {
          status: CliReviewLifecycleStatus.RESOLVED,
          taskId: 'TK-130',
        },
      );
      const sourceRequestPath = await writeQueuedRequest(
        fixture,
        'review-100.json',
        createRequestPayload({
          requestId: 'review-100',
          workspaceRoot: fixture.workspaceRoot,
          reviewArtifactPath: sourceReviewArtifactPath,
          reviewArtifactStatus: CliReviewLifecycleStatus.RESOLVED,
          reviewSlug: 'tk-130-review',
          taskId: 'TK-130',
          recordLedger: true,
        }),
      );

      await expect(fixture.command.execute(fixture.context)).rejects.toMatchObject({
        code: GovernorErrorCode.UNKNOWN,
      });

      const sourceRequestPayload = JSON.parse(await readFile(sourceRequestPath, 'utf8')) as {
        status?: string;
        consumedAt?: string;
        lastVerifyAttemptAt?: string;
        ledgerBackfillStatus?: string;
        reviewArtifactStatus?: string;
      };
      expect(sourceRequestPayload.status).toBe(CLI_REVIEW_REQUEST_STATUS.QUEUED);
      expect(sourceRequestPayload.consumedAt).toBeUndefined();
      expect(typeof sourceRequestPayload.lastVerifyAttemptAt).toBe('string');
      expect(sourceRequestPayload.reviewArtifactStatus).toBe('resolved');
      expect(sourceRequestPayload.ledgerBackfillStatus).toBe(
        CLI_REVIEW_LEDGER_BACKFILL_STATUS.FAILED,
      );

      const resultFileNames = await readdir(fixture.resultDirectoryPath);
      expect(resultFileNames).toHaveLength(1);
      const verifyPayload = JSON.parse(
        await readFile(resolve(fixture.resultDirectoryPath, resultFileNames[0]), 'utf8'),
      ) as {
        status?: string;
        ledgerBackfillStatus?: string;
      };
      expect(verifyPayload.status).toBe(CLI_REVIEW_REQUEST_STATUS.FAILED);
      expect(verifyPayload.ledgerBackfillStatus).toBe(CLI_REVIEW_LEDGER_BACKFILL_STATUS.FAILED);
    } finally {
      await rm(fixture.tempRoot, { recursive: true, force: true });
    }
  });
});
