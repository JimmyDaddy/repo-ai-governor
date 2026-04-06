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
import { CLI_REVIEW_REQUEST_STATUS } from '../../src/constants/cli-governance-runtime.constant.js';
import { CliInteractiveUiMode } from '../../src/constants/cli-interactive-shell.constant.js';
import { CliReviewQueueRuntime } from '../../src/runtime/artifacts/review-queue-runtime.js';
import type {
  CliCommandExecutorContext,
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
        status?: string;
        reviewArtifactStatus?: string;
        reviewTaskId?: string;
        reviewTaskCardPath?: string;
        findings?: Array<{ ruleId?: string }>;
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
      expect(
        requestPayload.findings?.some(
          (finding) => finding.ruleId === 'code_change_without_test_change',
        ),
      ).toBe(true);
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
