import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';

import {
  ErrorOutputEnvironment,
  ExecutionProgressStatus,
  GovernorErrorCode,
  RuntimeError,
} from '@repo-ai-governor/shared';
import { CliDoctorCommand } from '../../src/commands/doctor-command.js';
import type { CliCommandExecutorContext, CliCommandProgressEvent } from '../../src/types/index.js';

async function createDoctorCommandFixture(): Promise<{
  tempRoot: string;
  workspaceRoot: string;
  configPath: string;
  memoryStoreRoot: string;
}> {
  const tempRoot = await mkdtemp(resolve(tmpdir(), 'doctor-command-'));
  const workspaceRoot = resolve(tempRoot, '.repo-ai-governor');
  const configPath = resolve(workspaceRoot, 'governor.yaml');
  const memoryStoreRoot = resolve(workspaceRoot, 'context', 'memory');

  await mkdir(memoryStoreRoot, { recursive: true });
  await writeFile(configPath, 'schemaVersion: "1.1"\n', 'utf8');

  return {
    tempRoot,
    workspaceRoot,
    configPath,
    memoryStoreRoot,
  };
}

function translateDoctorProgress(key: string, interpolation?: Record<string, string>): string {
  if (key === 'cli.reactShell.progress.doctor.starting') {
    return 'Preparing doctor execution...';
  }
  if (key === 'cli.reactShell.progress.doctor.workspaceChecks') {
    return 'Inspect workspace baseline';
  }
  if (key === 'cli.reactShell.progress.doctor.writingArtifacts') {
    return 'Write diagnostics artifacts';
  }
  if (key === 'cli.reactShell.progress.doctor.completed') {
    return 'Doctor diagnostics are ready.';
  }
  if (key === 'cli.reactShell.progress.doctor.cancelled') {
    return 'Doctor execution was cancelled.';
  }
  if (key === 'cli.reactShell.progress.status.running') {
    return `Running ${interpolation?.command ?? 'command'}...`;
  }
  return key;
}

describe('CliDoctorCommand', () => {
  it('emits workspace and diagnostics progress events before completing', async () => {
    const fixture = await createDoctorCommandFixture();
    const progressEvents: CliCommandProgressEvent[] = [];
    const command = new CliDoctorCommand();

    try {
      const context = {
        options: {
          currentWorkingDirectory: fixture.tempRoot,
          workspace: {
            workspaceId: 'workspace-doctor',
            workspaceRoot: fixture.workspaceRoot,
            configPath: fixture.configPath,
            mode: 'repo_local',
          },
          configSource: 'default',
          profileId: null,
          memoryStoreProviderName: 'fs_csv',
          memoryStoreRoot: fixture.memoryStoreRoot,
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
        onboardingRuntime: {} as CliCommandExecutorContext['onboardingRuntime'],
        agentProjectionRuntime: {} as CliCommandExecutorContext['agentProjectionRuntime'],
        adapterDiagnosticsRuntime: {
          createSafeLocalBoundaryArtifactPayload: () => ({
            safeLocal: false,
          }),
        } as CliCommandExecutorContext['adapterDiagnosticsRuntime'],
        reviewQueueRuntime: {} as CliCommandExecutorContext['reviewQueueRuntime'],
        orchestrationServiceRuntime: {} as CliCommandExecutorContext['orchestrationServiceRuntime'],
        commandExperienceBuilder: {
          buildExperiencePayload: (payload: unknown) => payload,
        },
        executeRunCommand: async () => {
          throw new RuntimeError(
            GovernorErrorCode.UNKNOWN,
            'executeRunCommand is not used in doctor-command tests.',
          );
        },
        calculateCheckTotals: (checks: Array<{ status: string }>) => ({
          pass: checks.filter((check) => check.status === 'pass').length,
          warn: checks.filter((check) => check.status === 'warn').length,
          fail: checks.filter((check) => check.status === 'fail').length,
        }),
        buildDefaultConfigContent: () => 'schemaVersion: "1.1"\n',
        toRfc3339SecondsTimestamp: (value: Date) => value.toISOString().replace(/\.\d{3}Z$/u, 'Z'),
        formatExecFailureDetail: (error: unknown) => String(error),
        resolveRuntimeDebugOptions: () =>
          ({
            adapters: false,
            fix: false,
            dryRun: false,
            overwrite: false,
            singleToolAllRoles: false,
            requestedTools: [],
            presetId: 'multi_tool_default',
          }) as never,
        resolveExecutionStreamMetadata: async () => ({}),
        resolveAdapterVerification: async () => {
          throw new RuntimeError(
            GovernorErrorCode.UNKNOWN,
            'resolveAdapterVerification is not used in doctor-command tests.',
          );
        },
        resolveAdapterVerificationForConfig: async () => {
          throw new RuntimeError(
            GovernorErrorCode.UNKNOWN,
            'resolveAdapterVerificationForConfig is not used in doctor-command tests.',
          );
        },
        validateGovernorConfig: (candidate: unknown) => candidate as never,
        canWritePath: async () => true,
        localizeText: (english: string) => english,
        translate: translateDoctorProgress,
        runNodeScript: async () => ({
          stdout: '',
          stderr: '',
        }),
      } as unknown as CliCommandExecutorContext;

      const result = await command.execute(context);

      expect(result.commandResult.operation).toBe('env_doctor');
      expect(progressEvents[0]).toMatchObject({
        commandName: 'doctor',
        runState: 'running',
        currentStepTitle: 'Inspect workspace baseline',
      });
      expect(
        progressEvents.some(
          (event) =>
            event.row?.id === 'workspace-baseline' &&
            event.row.status === ExecutionProgressStatus.COMPLETED,
        ),
      ).toBe(true);
      expect(progressEvents.at(-1)).toMatchObject({
        commandName: 'doctor',
        runState: 'success',
        statusLine: 'Doctor diagnostics are ready.',
        artifact: {
          id: 'doctor-diagnostics',
        },
      });
    } finally {
      await rm(fixture.tempRoot, { recursive: true, force: true });
    }
  });
});
