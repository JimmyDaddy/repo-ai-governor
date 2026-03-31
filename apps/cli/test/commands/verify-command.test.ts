import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';

import {
  ErrorOutputEnvironment,
  ExecutionInteractionCategory,
  ExecutionProgressStage,
  ExecutionProgressStatus,
  GovernorErrorCode,
  RuntimeError,
} from '@repo-ai-governor/shared';
import { CliVerifyCommand } from '../../src/commands/verify-command.js';
import { CliGovernanceCheckStatus } from '../../src/constants/cli-governance-runtime.constant.js';
import type { CliCommandExecutorContext, CliCommandProgressEvent } from '../../src/types/index.js';

async function createVerifyCommandFixture(): Promise<{
  tempRoot: string;
  workspaceRoot: string;
}> {
  const tempRoot = await mkdtemp(resolve(tmpdir(), 'verify-command-'));
  const workspaceRoot = resolve(tempRoot, '.repo-ai-governor');
  await mkdir(workspaceRoot, { recursive: true });

  return {
    tempRoot,
    workspaceRoot,
  };
}

function translateVerifyProgress(key: string, interpolation?: Record<string, string>): string {
  if (key === 'cli.reactShell.progress.verify.starting') {
    return 'Preparing verify execution...';
  }
  if (key === 'cli.reactShell.progress.verify.verifyingAdapters') {
    return 'Verify adapters';
  }
  if (key === 'cli.reactShell.progress.verify.writingArtifacts') {
    return 'Write diagnostics artifacts';
  }
  if (key === 'cli.reactShell.progress.verify.completed') {
    return 'Verify diagnostics are ready.';
  }
  if (key === 'cli.reactShell.progress.verify.failed') {
    return 'Verify found required adapter failures.';
  }
  if (key === 'cli.reactShell.progress.verify.cancelled') {
    return 'Verify execution was cancelled.';
  }
  if (key === 'cli.reactShell.progress.status.running') {
    return `Running ${interpolation?.command ?? 'command'}...`;
  }
  return key;
}

describe('CliVerifyCommand', () => {
  it('emits a failure progress snapshot before throwing when required roles fail', async () => {
    const fixture = await createVerifyCommandFixture();
    const progressEvents: CliCommandProgressEvent[] = [];
    const command = new CliVerifyCommand();

    try {
      const context = {
        options: {
          workspace: {
            workspaceId: 'workspace-verify',
            workspaceRoot: fixture.workspaceRoot,
            mode: 'repo_local',
          },
          adaptersConfig: {
            roles: [],
            routing: {
              roleBindings: {},
            },
            tools: [],
          },
          outputMode: ErrorOutputEnvironment.PRETTY,
        },
        progressSink: {
          publish: (event: CliCommandProgressEvent) => {
            progressEvents.push(event);
          },
        },
        artifactWriter: {
          writeTextArtifact: async (filePath: string, content: string) => {
            await mkdir(dirname(filePath), { recursive: true });
            await writeFile(filePath, content, 'utf8');
          },
          writeJsonArtifact: async (filePath: string, payload: unknown) => {
            await mkdir(dirname(filePath), { recursive: true });
            await writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
          },
          safeReadJson: async () => null,
        },
        onboardingRuntime: {
          createVerifyMatrixPayload: () => ({
            matrix: [],
          }),
          createOnboardingContractPayload: () => ({
            commandName: 'verify',
          }),
          resolveSelectedTools: () => [],
        },
        agentProjectionRuntime: {
          createCliAgentView: () => ({
            descriptors: [{ agentId: 'coder:1' }],
          }),
          createDescriptorsFromRoleEvaluations: () => [{ agentId: 'coder:1' }],
        },
        adapterDiagnosticsRuntime: {
          createAdapterVerificationArtifactPayload: (verification: unknown) => verification,
          createAdapterRoleProgressRows: () => [
            {
              roleId: 'coder',
              stage: ExecutionProgressStage.VERIFY,
              status: ExecutionProgressStatus.FAILED,
              category: ExecutionInteractionCategory.ENVIRONMENT_PRECONDITION,
              summary: 'Adapter verification failed.',
            },
          ],
          createAdapterInteractionPrompts: () => [],
          resolveRoleEvaluationDetail: () => 'required role missing tool support',
        },
        reviewQueueRuntime: {} as CliCommandExecutorContext['reviewQueueRuntime'],
        orchestrationServiceRuntime: {} as CliCommandExecutorContext['orchestrationServiceRuntime'],
        commandExperienceBuilder: {
          buildExperiencePayload: (payload: unknown) => payload,
        },
        executeRunCommand: async () => {
          throw new RuntimeError(
            GovernorErrorCode.UNKNOWN,
            'executeRunCommand is not used in verify-command tests.',
          );
        },
        calculateCheckTotals: (checks: Array<{ status: string }>) => ({
          pass: checks.filter((check) => check.status === 'pass').length,
          warn: checks.filter((check) => check.status === 'warn').length,
          fail: checks.filter((check) => check.status === 'fail').length,
        }),
        buildDefaultConfigContent: () => '',
        toRfc3339SecondsTimestamp: (value: Date) => value.toISOString().replace(/\.\d{3}Z$/u, 'Z'),
        formatExecFailureDetail: (error: unknown) => String(error),
        resolveRuntimeDebugOptions: () =>
          ({
            adapters: true,
            dryRun: false,
            overwrite: false,
            singleToolAllRoles: false,
            requestedTools: [],
            presetId: 'multi_tool_default',
            fix: false,
          }) as never,
        resolveExecutionStreamMetadata: async () => ({}),
        resolveAdapterVerification: async () => ({
          overallStatus: CliGovernanceCheckStatus.FAIL,
          tools: [],
          roleEvaluations: [
            {
              roleId: 'coder',
              roleProfileId: 'coder-default',
              required: true,
              primarySurface: 'codex',
              selectedSurface: null,
              selectedBy: 'none',
              unsupportedCapabilities: ['tool_calling'],
              degradedCapabilities: [],
              unavailableReasons: ['tool_missing'],
              failureAttributions: ['tool_missing'],
              status: CliGovernanceCheckStatus.FAIL,
            },
          ],
          requiredRoleCount: 1,
          requiredRoleFailedCount: 1,
          degradedRoleCount: 0,
          fallbackRoleCount: 0,
          nextActions: ['Install the missing tool.'],
        }),
        resolveAdapterVerificationForConfig: async () => {
          throw new RuntimeError(
            GovernorErrorCode.UNKNOWN,
            'resolveAdapterVerificationForConfig is not used in verify-command tests.',
          );
        },
        validateGovernorConfig: (candidate: unknown) => candidate as never,
        canWritePath: async () => true,
        localizeText: (english: string) => english,
        translate: translateVerifyProgress,
        runNodeScript: async () => ({
          stdout: '',
          stderr: '',
        }),
      } as unknown as CliCommandExecutorContext;

      await expect(command.execute(context)).rejects.toMatchObject({
        code: GovernorErrorCode.ADAPTER_ROUTE_NO_AVAILABLE_SURFACE,
      });
      expect(progressEvents[0]).toMatchObject({
        commandName: 'verify',
        runState: 'running',
        currentStepTitle: 'Verify adapters',
      });
      expect(progressEvents.at(-1)).toMatchObject({
        commandName: 'verify',
        runState: 'failure',
        statusLine: 'Verify found required adapter failures.',
        artifact: {
          id: 'verify-diagnostics',
        },
      });
    } finally {
      await rm(fixture.tempRoot, { recursive: true, force: true });
    }
  });
});
