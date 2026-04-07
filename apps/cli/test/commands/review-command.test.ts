import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { promisify } from 'node:util';

import {
  CliReactThemePreset,
  GovernorErrorCode,
  RuntimeError,
  standardizeError,
} from '@repo-ai-governor/shared';
import { CliReviewCommand } from '../../src/commands/review-command.js';
import {
  CLI_REVIEW_REQUEST_STATUS,
  CliGovernanceCheckStatus,
} from '../../src/constants/cli-governance-runtime.constant.js';
import { CliInteractiveUiMode } from '../../src/constants/cli-interactive-shell.constant.js';
import {
  CliDelegatedReviewActivationLevel,
  CliDelegatedReviewActivationReason,
  CliReviewFindingExecutionMode,
  CliReviewFindingSourceType,
  CliReviewLifecycleStatus,
} from '../../src/constants/cli-review.constant.js';
import { CliReviewQueueRuntime } from '../../src/runtime/artifacts/review-queue-runtime.js';
import type {
  CliCommandExecutorContext,
  CliHybridReviewContext,
  CliReviewRequestArtifactPayload,
} from '../../src/types/interfaces/index.js';

const execFileAsync = promisify(execFile);

interface ReviewFixture {
  tempRoot: string;
  workspaceRoot: string;
  command: CliReviewCommand;
  context: CliCommandExecutorContext;
}

async function createReviewFixture(): Promise<ReviewFixture> {
  const tempRoot = await mkdtemp(resolve(tmpdir(), 'review-command-'));
  const workspaceRoot = resolve(tempRoot, '.repo-ai-governor');
  const reviewQueueRuntime = new CliReviewQueueRuntime(workspaceRoot, async (filePath) => {
    try {
      return JSON.parse(await readFile(filePath, 'utf8')) as Record<string, unknown>;
    } catch {
      return null;
    }
  });
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
        executionId: runtimeContext?.executionId ?? 'review-fixture',
        executionSessionId: 'session-review-fixture',
        acceptedAt: '2026-03-25T00:00:00Z',
        status: 'accepted',
        checkpointCapable: false,
        serviceHostKind: 'embedded',
        serviceTransportKind: 'in_process',
        eventStreamToken: 'stream-review-fixture',
        latestEventSequence: 0,
        nextCursor: 'cursor-review-fixture',
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
        'executeRunCommand is not used in review-command tests.',
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
      recordLedger: false,
      taskId: null,
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
    runNodeScript: async () => ({
      stdout: '',
      stderr: '',
    }),
  } as unknown as CliCommandExecutorContext;

  return {
    tempRoot,
    workspaceRoot,
    command: new CliReviewCommand(),
    context,
  };
}

async function initGitRepository(repositoryRoot: string): Promise<void> {
  await execFileAsync('git', ['init'], {
    cwd: repositoryRoot,
  });
  await execFileAsync('git', ['config', 'commit.gpgSign', 'false'], {
    cwd: repositoryRoot,
  });
  await execFileAsync('git', ['config', 'user.email', 'codex@example.com'], {
    cwd: repositoryRoot,
  });
  await execFileAsync('git', ['config', 'user.name', 'Codex Test'], {
    cwd: repositoryRoot,
  });
}

async function commitAll(repositoryRoot: string, message: string): Promise<void> {
  await execFileAsync('git', ['add', '.'], {
    cwd: repositoryRoot,
  });
  await execFileAsync('git', ['commit', '--no-verify', '-m', message], {
    cwd: repositoryRoot,
  });
}

async function writeCurrentContextFixture(workspaceRoot: string): Promise<void> {
  const currentContextPath = resolve(workspaceRoot, 'context', 'current-context.md');
  await mkdir(dirname(currentContextPath), { recursive: true });
  await writeFile(
    currentContextPath,
    [
      '# Workspace Current Context',
      '',
      '## Primary Stream',
      '',
      '- Status: active',
      '- Project: `project-042-review-command-fixture`',
      '- Sprint: `sprint-003-review-lifecycle`',
      '- Docs root: `.repo-ai-governor/context/dev/project-042-review-command-fixture`',
      '- Task records: `.repo-ai-governor/context/dev/project-042-review-command-fixture/sprint-003-review-lifecycle/tasks/`',
      '- Review records: `.repo-ai-governor/context/dev/project-042-review-command-fixture/sprint-003-review-lifecycle/review/`',
      '',
      '## Active Streams',
      '',
      '- `active-1`: role=`primary`, project=`project-042-review-command-fixture`, sprint=`sprint-003-review-lifecycle`, docs=`.repo-ai-governor/context/dev/project-042-review-command-fixture`, plan=`.repo-ai-governor/context/dev/project-042-review-command-fixture/plan.md`, tasks=`.repo-ai-governor/context/dev/project-042-review-command-fixture/sprint-003-review-lifecycle/tasks/`, checklist=`.repo-ai-governor/context/dev/project-042-review-command-fixture/sprint-003-review-lifecycle/tasks/checklist.md`, csv=`.repo-ai-governor/context/dev/project-042-review-command-fixture/sprint-003-review-lifecycle/tasks/tasks.csv`, review=`.repo-ai-governor/context/dev/project-042-review-command-fixture/sprint-003-review-lifecycle/review/`, status=`active`, note=`fixture for review command tests`',
      '',
    ].join('\n'),
    'utf8',
  );
}

describe('CliReviewCommand', () => {
  it('writes canonical review artifact plus queued transport artifact when executable code changes lack test updates', async () => {
    const fixture = await createReviewFixture();

    try {
      await writeCurrentContextFixture(fixture.workspaceRoot);
      await initGitRepository(fixture.tempRoot);
      const changedFilePath = resolve(fixture.tempRoot, 'apps', 'cli', 'src', 'review-scope.ts');
      await mkdir(dirname(changedFilePath), { recursive: true });
      await writeFile(changedFilePath, 'export const reviewScope = 1;\n', 'utf8');

      const commandResult = await fixture.command.execute(fixture.context);
      const reviewArtifactPath = commandResult.commandResult.artifacts?.find(
        (artifact) => artifact.id === 'review_artifact',
      )?.path;
      const requestPath = commandResult.commandResult.artifacts?.find(
        (artifact) => artifact.id === 'review_request',
      )?.path;

      expect(String(reviewArtifactPath)).toContain(
        '.repo-ai-governor/context/dev/project-042-review-command-fixture/sprint-003-review-lifecycle/review/code_review_',
      );
      expect(typeof requestPath).toBe('string');

      const requestPayload = JSON.parse(await readFile(String(requestPath), 'utf8')) as {
        requestId?: string;
        status?: string;
        reviewArtifactStatus?: string;
        reviewTaskId?: string;
        reviewTaskCardPath?: string;
        findings?: Array<{
          ruleId?: string;
          sourceType?: string;
          executionMode?: string;
          standardsSourceRefs?: string[];
        }>;
        hybridReviewContext?: {
          projectedRuleBundle?: { bundleId?: string };
          coverageSummary?: {
            totalApplicableRuleCount?: number;
            residualGapRuleCount?: number;
            manualOnlyGapRuleCount?: number;
          };
          delegatedReviewActivationPolicy?: {
            level?: string;
            manualFollowUpRequired?: boolean;
          };
          uncoveredRuleIds?: string[];
          delegatedReviewEnabled?: boolean;
          delegatedReviewRequest?: {
            requestId?: string;
            reviewSurface?: string[];
            requiredNormativeInputs?: string[];
          };
        };
      };
      expect(requestPayload.status).toBe(CLI_REVIEW_REQUEST_STATUS.QUEUED);
      expect(requestPayload.reviewArtifactStatus).toBe('review_pending');
      expect(requestPayload.reviewTaskId).toBe('CR-001');
      expect(typeof requestPayload.reviewTaskCardPath).toBe('string');
      expect(String(requestPayload.reviewTaskCardPath)).toContain(
        '.repo-ai-governor/context/dev/project-042-review-command-fixture/sprint-003-review-lifecycle/tasks/CR-001-',
      );
      const reviewTaskCardContent = await readFile(
        String(requestPayload.reviewTaskCardPath),
        'utf8',
      );
      expect(reviewTaskCardContent).toContain('# CR-001 working tree review lifecycle');
      expect(reviewTaskCardContent).toContain('- Status: review_pending');
      expect(requestPayload.findings).toContainEqual(
        expect.objectContaining({
          ruleId: 'code_change_without_test_change',
          sourceType: CliReviewFindingSourceType.RISK_INFERENCE,
          executionMode: CliReviewFindingExecutionMode.DETERMINISTIC,
          standardsSourceRefs: [],
        }),
      );
      expect(requestPayload.hybridReviewContext?.projectedRuleBundle?.bundleId).toBe(
        'bundle.review.phase-a',
      );
      expect(requestPayload.hybridReviewContext?.delegatedReviewEnabled).toBe(false);
      expect(requestPayload.hybridReviewContext?.coverageSummary?.totalApplicableRuleCount).toBe(2);
      expect(requestPayload.hybridReviewContext?.coverageSummary?.residualGapRuleCount).toBe(0);
      expect(requestPayload.hybridReviewContext?.coverageSummary?.manualOnlyGapRuleCount).toBe(0);
      expect(requestPayload.hybridReviewContext?.delegatedReviewActivationPolicy?.level).toBe(
        CliDelegatedReviewActivationLevel.OPTIONAL,
      );
      expect(
        requestPayload.hybridReviewContext?.delegatedReviewActivationPolicy?.manualFollowUpRequired,
      ).toBe(false);
      expect(requestPayload.hybridReviewContext?.delegatedReviewRequest?.requestId).toBe(
        requestPayload.requestId,
      );
      expect(requestPayload.hybridReviewContext?.delegatedReviewRequest?.reviewSurface).toEqual(
        expect.arrayContaining(['apps/cli/src/review-scope.ts']),
      );
      expect(
        requestPayload.hybridReviewContext?.delegatedReviewRequest?.requiredNormativeInputs,
      ).toEqual(expect.arrayContaining(['AGENTS.md']));
      expect(requestPayload.findings).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            ruleId: 'review-rule.cs-034-build-evidence',
            sourceType: CliReviewFindingSourceType.STANDARDS_GUIDED_INFERENCE,
            executionMode: CliReviewFindingExecutionMode.STANDARDS_GUIDED,
            semanticKey: 'code-standards.cs-034',
          }),
        ]),
      );
      expect(requestPayload.hybridReviewContext?.uncoveredRuleIds).not.toContain(
        'review-rule.cs-034-build-evidence',
      );
      expect(requestPayload.hybridReviewContext?.coverageSummary?.residualGapRuleCount).toBe(0);
      expect(requestPayload.hybridReviewContext?.delegatedReviewActivationPolicy?.level).toBe(
        CliDelegatedReviewActivationLevel.OPTIONAL,
      );

      const reviewArtifactContent = await readFile(String(reviewArtifactPath), 'utf8');
      expect(reviewArtifactContent).toContain('## 2. Deterministic Rule Findings');
      expect(reviewArtifactContent).toContain('## 3. Standards-Guided Findings');
      expect(reviewArtifactContent).toContain('## 4. Residual Risk Observations');
      expect(reviewArtifactContent).toContain('## 5. Coverage Summary');
      expect(reviewArtifactContent).toContain('## 7. Delegated Reviewer Handoff');
      expect(reviewArtifactContent).toContain('Delegated activation policy');
      expect(reviewArtifactContent).toContain('transport view');
      expect(reviewArtifactContent).toContain('code_change_without_test_change');
      expect(reviewArtifactContent).toContain('risk_inference');
      expect(reviewArtifactContent).toContain('review-rule.cs-034-build-evidence');
    } finally {
      await rm(fixture.tempRoot, { recursive: true, force: true });
    }
  });

  it('falls back to workspace context/review and resolves immediately when no reviewable paths are detected', async () => {
    const fixture = await createReviewFixture();

    try {
      const commandResult = await fixture.command.execute(fixture.context);
      const reviewArtifactPath = commandResult.commandResult.artifacts?.find(
        (artifact) => artifact.id === 'review_artifact',
      )?.path;
      const requestPath = commandResult.commandResult.artifacts?.find(
        (artifact) => artifact.id === 'review_request',
      )?.path;

      expect(String(reviewArtifactPath)).toContain(
        '.repo-ai-governor/context/review/resolved_code_review_',
      );

      const requestPayload = JSON.parse(
        await readFile(String(requestPath), 'utf8'),
      ) as CliReviewRequestArtifactPayload;
      expect(requestPayload.reviewArtifactStatus).toBe('resolved');
      expect(requestPayload.findings).toHaveLength(0);
    } finally {
      await rm(fixture.tempRoot, { recursive: true, force: true });
    }
  });

  it('projects TODO findings as deterministic rule-backed entries in the canonical artifact', async () => {
    const fixture = await createReviewFixture();

    try {
      await writeCurrentContextFixture(fixture.workspaceRoot);
      await initGitRepository(fixture.tempRoot);
      const changedFilePath = resolve(fixture.tempRoot, 'apps', 'cli', 'src', 'todo-scope.ts');
      await mkdir(dirname(changedFilePath), { recursive: true });
      await writeFile(
        changedFilePath,
        'export const todoScope = 1; // TODO: backfill tests\n',
        'utf8',
      );

      const commandResult = await fixture.command.execute(fixture.context);
      const reviewArtifactPath = commandResult.commandResult.artifacts?.find(
        (artifact) => artifact.id === 'review_artifact',
      )?.path;
      const requestPath = commandResult.commandResult.artifacts?.find(
        (artifact) => artifact.id === 'review_request',
      )?.path;

      const requestPayload = JSON.parse(
        await readFile(String(requestPath), 'utf8'),
      ) as CliReviewRequestArtifactPayload;
      expect(requestPayload.findings).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            ruleId: 'review-rule.cs-003-unresolved-markers',
            sourceType: CliReviewFindingSourceType.DETERMINISTIC_RULE,
            executionMode: CliReviewFindingExecutionMode.DETERMINISTIC,
            semanticKey: 'code-standards.cs-003',
          }),
        ]),
      );

      const reviewArtifactContent = await readFile(String(reviewArtifactPath), 'utf8');
      expect(reviewArtifactContent).toContain('## 2. Deterministic Rule Findings');
      expect(reviewArtifactContent).toContain('review-rule.cs-003-unresolved-markers');
      expect(reviewArtifactContent).toContain('code-standards.cs-003');
    } finally {
      await rm(fixture.tempRoot, { recursive: true, force: true });
    }
  });

  it('keeps code-affecting reviews pending by emitting a CS-034 finding when build evidence is still missing', async () => {
    const fixture = await createReviewFixture();

    try {
      await writeCurrentContextFixture(fixture.workspaceRoot);
      await initGitRepository(fixture.tempRoot);
      const changedFilePath = resolve(fixture.tempRoot, 'apps', 'cli', 'src', 'review-scope.ts');
      const changedTestPath = resolve(
        fixture.tempRoot,
        'apps',
        'cli',
        'test',
        'review-scope.test.ts',
      );
      await mkdir(dirname(changedFilePath), { recursive: true });
      await mkdir(dirname(changedTestPath), { recursive: true });
      await writeFile(changedFilePath, 'export const reviewScope = 1;\n', 'utf8');
      await writeFile(
        changedTestPath,
        'import { reviewScope } from "../src/review-scope.js";\n',
        'utf8',
      );

      const commandResult = await fixture.command.execute(fixture.context);
      const reviewArtifactPath = commandResult.commandResult.artifacts?.find(
        (artifact) => artifact.id === 'review_artifact',
      )?.path;
      const requestPath = commandResult.commandResult.artifacts?.find(
        (artifact) => artifact.id === 'review_request',
      )?.path;

      const requestPayload = JSON.parse(
        await readFile(String(requestPath), 'utf8'),
      ) as CliReviewRequestArtifactPayload;
      expect(requestPayload.reviewArtifactStatus).toBe('review_pending');
      expect(requestPayload.findings).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            ruleId: 'review-rule.cs-034-build-evidence',
            sourceType: CliReviewFindingSourceType.STANDARDS_GUIDED_INFERENCE,
            executionMode: CliReviewFindingExecutionMode.STANDARDS_GUIDED,
          }),
        ]),
      );
      expect(requestPayload.hybridReviewContext?.uncoveredRuleIds).not.toContain(
        'review-rule.cs-034-build-evidence',
      );
      expect(requestPayload.hybridReviewContext?.delegatedReviewActivationPolicy?.level).toBe(
        CliDelegatedReviewActivationLevel.OPTIONAL,
      );
      expect(requestPayload.hybridReviewContext?.uncoveredRuleIds).not.toContain(
        'review-rule.cs-033-user-facing-i18n',
      );
      expect(
        requestPayload.hybridReviewContext?.projectedRuleBundle.standardsSourceRefs,
      ).not.toEqual(
        expect.arrayContaining([
          '.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md#CS-021',
        ]),
      );

      const reviewArtifactContent = await readFile(String(reviewArtifactPath), 'utf8');
      expect(String(reviewArtifactPath)).toContain('/code_review_');
      expect(reviewArtifactContent).toContain(
        'Same-window build evidence is required before this review can resolve',
      );
      expect(reviewArtifactContent).toContain(
        'Run review-verify after applying fixes or when you want an explicit verification decision.',
      );
    } finally {
      await rm(fixture.tempRoot, { recursive: true, force: true });
    }
  });

  it('marks CS-033 uncovered only when the changed source is likely to own user-facing text', async () => {
    const fixture = await createReviewFixture();

    try {
      await writeCurrentContextFixture(fixture.workspaceRoot);
      await initGitRepository(fixture.tempRoot);
      const changedFilePath = resolve(
        fixture.tempRoot,
        'apps',
        'cli',
        'src',
        'runtime',
        'review',
        'cli-user-facing-copy.ts',
      );
      const changedTestPath = resolve(
        fixture.tempRoot,
        'apps',
        'cli',
        'test',
        'cli-user-facing-copy.test.ts',
      );
      await mkdir(dirname(changedFilePath), { recursive: true });
      await mkdir(dirname(changedTestPath), { recursive: true });
      await writeFile(
        changedFilePath,
        "export const renderCopy = () => localizeText('Hello', '你好');\n",
        'utf8',
      );
      await writeFile(changedTestPath, 'export const renderCopyTest = true;\n', 'utf8');

      const commandResult = await fixture.command.execute(fixture.context);
      const requestPath = commandResult.commandResult.artifacts?.find(
        (artifact) => artifact.id === 'review_request',
      )?.path;
      const requestPayload = JSON.parse(
        await readFile(String(requestPath), 'utf8'),
      ) as CliReviewRequestArtifactPayload;

      expect(requestPayload.reviewArtifactStatus).toBe('review_pending');
      expect(requestPayload.findings).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            ruleId: 'review-rule.cs-034-build-evidence',
            sourceType: CliReviewFindingSourceType.STANDARDS_GUIDED_INFERENCE,
          }),
        ]),
      );
      expect(requestPayload.hybridReviewContext?.uncoveredRuleIds).toEqual(
        expect.arrayContaining(['review-rule.cs-033-user-facing-i18n']),
      );
      expect(requestPayload.hybridReviewContext?.uncoveredRuleIds).not.toContain(
        'review-rule.cs-034-build-evidence',
      );
    } finally {
      await rm(fixture.tempRoot, { recursive: true, force: true });
    }
  });

  it('treats manual-only gaps as coverage gaps in notes and checks', async () => {
    const fixture = await createReviewFixture();
    const internalCommand = fixture.command as unknown as {
      buildChecks: (
        requestPath: string,
        findings: unknown[],
        reviewStatus: CliReviewLifecycleStatus,
        reviewArtifactPath: string,
        hybridReviewContext: CliHybridReviewContext,
      ) => Array<{ id: string; status: string }>;
      buildReviewNotes: (
        context: CliCommandExecutorContext,
        reviewStatus: CliReviewLifecycleStatus,
        changedPathCount: number,
        findingCount: number,
        hybridReviewContext: CliHybridReviewContext,
      ) => string[];
    };
    const hybridReviewContext = {
      projectedRuleBundle: {
        bundleId: 'bundle.review.phase-a',
        bundleVersion: '1.0.0',
      },
      projectedRules: [],
      deterministicFindings: [],
      standardsGuidedFindings: [],
      riskFindings: [],
      coverageSummary: {
        totalApplicableRuleCount: 1,
        deterministicCoveredRuleCount: 0,
        standardsGuidedCoveredRuleCount: 0,
        residualGapRuleCount: 0,
        manualOnlyGapRuleCount: 1,
        deterministicCoveredRuleIds: [],
        standardsGuidedCoveredRuleIds: [],
        residualGapRuleIds: [],
        manualOnlyGapRuleIds: ['review-rule.fixture-manual-follow-up'],
        coverageBuckets: [],
      },
      delegatedReviewActivationPolicy: {
        level: CliDelegatedReviewActivationLevel.OPTIONAL,
        reasonCodes: [CliDelegatedReviewActivationReason.MANUAL_ONLY_GAP_PRESENT],
        delegatableGapRuleIds: [],
        manualOnlyGapRuleIds: ['review-rule.fixture-manual-follow-up'],
        manualFollowUpRequired: true,
      },
      uncoveredRuleIds: [],
      delegatedReviewEnabled: false,
      dedupeStrategy: 'ruleId+file+line',
      delegatedReviewRequest: {
        requestId: 'review-004',
        scopeSummary: 'fixture scope',
        reviewMode: 'working_tree',
        reviewSurface: ['apps/cli/src/commands/review-command.ts'],
        requiredNormativeInputs: ['AGENTS.md'],
        projectedRuleBundle: {
          bundleId: 'bundle.review.phase-a',
          bundleVersion: '1.0.0',
        },
        projectedRules: [],
        deterministicFindings: [],
        coverageSummary: {
          totalApplicableRuleCount: 1,
          deterministicCoveredRuleCount: 0,
          standardsGuidedCoveredRuleCount: 0,
          residualGapRuleCount: 0,
          manualOnlyGapRuleCount: 1,
          deterministicCoveredRuleIds: [],
          standardsGuidedCoveredRuleIds: [],
          residualGapRuleIds: [],
          manualOnlyGapRuleIds: ['review-rule.fixture-manual-follow-up'],
          coverageBuckets: [],
        },
        delegatedReviewActivationPolicy: {
          level: CliDelegatedReviewActivationLevel.OPTIONAL,
          reasonCodes: [CliDelegatedReviewActivationReason.MANUAL_ONLY_GAP_PRESENT],
          delegatableGapRuleIds: [],
          manualOnlyGapRuleIds: ['review-rule.fixture-manual-follow-up'],
          manualFollowUpRequired: true,
        },
        uncoveredRuleIds: [],
      },
    } as unknown as CliHybridReviewContext;

    try {
      const checks = internalCommand.buildChecks(
        'request.json',
        [],
        CliReviewLifecycleStatus.RESOLVED,
        'review.md',
        hybridReviewContext,
      );
      const notes = internalCommand.buildReviewNotes(
        fixture.context,
        CliReviewLifecycleStatus.RESOLVED,
        1,
        0,
        hybridReviewContext,
      );

      expect(checks.find((check) => check.id === 'review_findings')?.status).toBe(
        CliGovernanceCheckStatus.WARN,
      );
      expect(notes).toEqual(
        expect.arrayContaining([
          'Coverage gap rule ids reserved for future delegated and/or manual follow-up: review-rule.fixture-manual-follow-up.',
          'Manual-only coverage gaps remain; delegated review alone is not sufficient and an explicit human/manual follow-up is still required.',
          'This lifecycle artifact resolved without emitted findings; remaining projected rule coverage gaps were recorded for future delegated or manual follow-up outside review-verify.',
        ]),
      );
    } finally {
      await rm(fixture.tempRoot, { recursive: true, force: true });
    }
  });

  it('keeps ordinary unstaged paths intact when parsing porcelain status output', async () => {
    const fixture = await createReviewFixture();

    try {
      await writeCurrentContextFixture(fixture.workspaceRoot);
      await initGitRepository(fixture.tempRoot);
      const changedFilePath = resolve(fixture.tempRoot, 'apps', 'cli', 'src', 'review-scope.ts');
      await mkdir(dirname(changedFilePath), { recursive: true });
      await writeFile(changedFilePath, 'export const reviewScope = 1;\n', 'utf8');
      await commitAll(fixture.tempRoot, 'baseline');
      await writeFile(changedFilePath, 'export const reviewScope = 2;\n', 'utf8');

      const commandResult = await fixture.command.execute(fixture.context);
      const requestPath = commandResult.commandResult.artifacts?.find(
        (artifact) => artifact.id === 'review_request',
      )?.path;
      const requestPayload = JSON.parse(
        await readFile(String(requestPath), 'utf8'),
      ) as CliReviewRequestArtifactPayload;

      expect(requestPayload.scope.reviewedPaths).toContain('apps/cli/src/review-scope.ts');
      expect(requestPayload.scope.reviewedPaths).not.toContain('pps/cli/src/review-scope.ts');
    } finally {
      await rm(fixture.tempRoot, { recursive: true, force: true });
    }
  });

  it('routes active-stream review artifacts to the repository root even when invoked from a subdirectory', async () => {
    const fixture = await createReviewFixture();

    try {
      await writeCurrentContextFixture(fixture.workspaceRoot);
      await initGitRepository(fixture.tempRoot);
      const subdirectoryCwd = resolve(fixture.tempRoot, 'apps', 'cli');
      await mkdir(subdirectoryCwd, { recursive: true });
      fixture.context.options.currentWorkingDirectory = subdirectoryCwd;
      const changedFilePath = resolve(fixture.tempRoot, 'apps', 'cli', 'src', 'review-scope.ts');
      await mkdir(dirname(changedFilePath), { recursive: true });
      await writeFile(changedFilePath, 'export const reviewScope = 1;\n', 'utf8');

      const commandResult = await fixture.command.execute(fixture.context);
      const reviewArtifactPath = commandResult.commandResult.artifacts?.find(
        (artifact) => artifact.id === 'review_artifact',
      )?.path;

      expect(String(reviewArtifactPath)).toContain(
        `${fixture.workspaceRoot}/context/dev/project-042-review-command-fixture/sprint-003-review-lifecycle/review/code_review_`,
      );
      expect(String(reviewArtifactPath)).not.toContain(
        `${subdirectoryCwd}/.repo-ai-governor/context/dev/`,
      );
    } finally {
      await rm(fixture.tempRoot, { recursive: true, force: true });
    }
  });
});
