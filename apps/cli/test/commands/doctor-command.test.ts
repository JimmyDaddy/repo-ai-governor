import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';

import {
  AdapterAvailability,
  AdapterSurface,
  ErrorOutputEnvironment,
  ExecutionProgressStatus,
  GovernorErrorCode,
  RuntimeError,
} from '@repo-ai-governor/shared';
import { CliDoctorCommand } from '../../src/commands/doctor-command.js';
import { CliGovernanceCheckStatus } from '../../src/constants/cli-governance-runtime.constant.js';
import { CliAgentOnboardingRuntime } from '../../src/runtime/agent-onboarding-runtime.js';
import type {
  CliAdapterVerificationResolution,
  CliCommandExecutorContext,
  CliCommandProgressEvent,
} from '../../src/types/index.js';

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

function createDoctorCommandContext(options: {
  fixture: Awaited<ReturnType<typeof createDoctorCommandFixture>>;
  progressEvents: CliCommandProgressEvent[];
  adapterVerification?: CliAdapterVerificationResolution | null;
  adaptersConfig?: CliCommandExecutorContext['options']['adaptersConfig'];
  onboardingRuntime?: CliCommandExecutorContext['onboardingRuntime'];
  runtimeDebugOptions?: {
    adapters: boolean;
    fix: boolean;
    dryRun: boolean;
    overwrite: boolean;
    singleToolAllRoles: boolean;
    requestedTools: string[];
    presetId: string;
  };
}): CliCommandExecutorContext {
  const runtimeDebugOptions = options.runtimeDebugOptions ?? {
    adapters: false,
    fix: false,
    dryRun: false,
    overwrite: false,
    singleToolAllRoles: false,
    requestedTools: [],
    presetId: 'multi_tool_default',
  };
  const adaptersConfig = options.adaptersConfig ?? {
    roles: [],
    routing: {
      roleBindings: {},
    },
    tools: [],
  };

  return {
    options: {
      currentWorkingDirectory: options.fixture.tempRoot,
      workspace: {
        workspaceId: 'workspace-doctor',
        workspaceRoot: options.fixture.workspaceRoot,
        configPath: options.fixture.configPath,
        mode: 'repo_local',
      },
      configSource: 'default',
      profileId: null,
      memoryStoreProviderName: 'fs_csv',
      memoryStoreRoot: options.fixture.memoryStoreRoot,
      adaptersConfig,
      outputMode: ErrorOutputEnvironment.PRETTY,
    },
    progressSink: {
      publish: (event: CliCommandProgressEvent) => {
        options.progressEvents.push(event);
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
    onboardingRuntime:
      options.onboardingRuntime ??
      ({
        createOnboardingContractPayload: () => ({
          commandName: 'doctor',
        }),
        createVerifyMatrixPayload: () => ({
          commandName: 'doctor',
          surface: 'verification',
        }),
        resolveSelectedTools: () => [],
      } as CliCommandExecutorContext['onboardingRuntime']),
    agentProjectionRuntime: {
      createCliAgentView: () => ({
        descriptors: [],
      }),
      createDescriptorsFromRoleEvaluations: () => [],
    } as CliCommandExecutorContext['agentProjectionRuntime'],
    adapterDiagnosticsRuntime: {
      createSafeLocalBoundaryArtifactPayload: () => ({
        safeLocal: false,
      }),
      resolveToolProbeCheckStatus: () => CliGovernanceCheckStatus.PASS,
      resolveToolProbeCheckDetail: () => 'tool-check',
      createAdapterVerificationArtifactPayload: (verification: CliAdapterVerificationResolution) =>
        verification,
      createAdapterRoleProgressRows: () => [],
      createAdapterInteractionPrompts: () => [],
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
    resolveRuntimeDebugOptions: () => runtimeDebugOptions as never,
    resolveExecutionStreamMetadata: async () => ({}),
    resolveAdapterVerification: async () => {
      if (!options.adapterVerification) {
        throw new RuntimeError(
          GovernorErrorCode.UNKNOWN,
          'resolveAdapterVerification is not used in doctor-command tests.',
        );
      }
      return options.adapterVerification;
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
}

describe('CliDoctorCommand', () => {
  const doctorAdaptersConfig = {
    roles: [],
    routing: {
      roleBindings: {},
    },
    tools: [
      {
        toolId: AdapterSurface.CODEX,
        enabled: true,
        availability: AdapterAvailability.AVAILABLE,
      },
    ],
  } satisfies CliCommandExecutorContext['options']['adaptersConfig'];
  const doctorReadinessVerification: CliAdapterVerificationResolution = {
    overallStatus: CliGovernanceCheckStatus.WARN,
    tools: [],
    roleEvaluations: [],
    requiredRoleCount: 1,
    requiredRoleFailedCount: 0,
    degradedRoleCount: 1,
    fallbackRoleCount: 0,
    nextActions: ['Review adapter diagnostics before retrying doctor.'],
    secretBackends: null,
    credentialReferences: [],
  };

  it('emits workspace and diagnostics progress events before completing', async () => {
    const fixture = await createDoctorCommandFixture();
    const progressEvents: CliCommandProgressEvent[] = [];
    const command = new CliDoctorCommand();

    try {
      const context = createDoctorCommandContext({
        fixture,
        progressEvents,
      });

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

  it('downgrades warning-bearing default secret backends in doctor output and preserves warning text', async () => {
    const fixture = await createDoctorCommandFixture();
    const progressEvents: CliCommandProgressEvent[] = [];
    const command = new CliDoctorCommand();
    const verification: CliAdapterVerificationResolution = {
      overallStatus: CliGovernanceCheckStatus.WARN,
      tools: [],
      roleEvaluations: [],
      requiredRoleCount: 0,
      requiredRoleFailedCount: 0,
      degradedRoleCount: 0,
      fallbackRoleCount: 0,
      nextActions: [
        'No default secret backend is available for these credential references: codex:secret://openai/api-key. Run `secret status` to inspect backend support, or opt into `--backend unsafe-local-file` only if you accept the local-only plaintext fallback.',
      ],
      secretBackends: {
        selectedBackendId: 'unsafe-local-file',
        defaultBackendId: 'unsafe-local-file',
        indexPath: '/tmp/test-secret-index.json',
        backends: [
          {
            backendId: 'unsafe-local-file',
            available: true,
            detail: '/tmp/test-secrets.json',
            warning: 'plaintext fallback',
          },
        ],
      },
      credentialReferences: [],
    };

    try {
      const context = createDoctorCommandContext({
        fixture,
        progressEvents,
        adapterVerification: verification,
        runtimeDebugOptions: {
          adapters: true,
          fix: false,
          dryRun: false,
          overwrite: false,
          singleToolAllRoles: false,
          requestedTools: [],
          presetId: 'multi_tool_default',
        },
      });

      const result = await command.execute(context);
      const diagnosticsArtifactPath = result.commandResult.artifacts?.find(
        (artifact) => artifact.id === 'doctor_diagnostics',
      )?.path;
      expect(typeof diagnosticsArtifactPath).toBe('string');
      const diagnosticsPayload = JSON.parse(
        await readFile(String(diagnosticsArtifactPath), 'utf8'),
      ) as {
        verificationMatrix?: {
          commandName?: string;
          surface?: string;
        };
      };
      const defaultBackendCheck = result.commandResult.checks.find(
        (check) => check.id === 'secret_backend_default',
      );
      const unsafeBackendCheck = result.commandResult.checks.find(
        (check) => check.id === 'secret_backend_unsafe-local-file',
      );

      expect(defaultBackendCheck).toMatchObject({
        status: CliGovernanceCheckStatus.WARN,
      });
      expect(defaultBackendCheck?.detail).toContain('unsafe-local-file');
      expect(defaultBackendCheck?.detail).toContain('plaintext fallback');
      expect(diagnosticsPayload.verificationMatrix).toEqual({
        commandName: 'doctor',
        surface: 'verification',
      });
      expect(unsafeBackendCheck).toMatchObject({
        status: CliGovernanceCheckStatus.WARN,
      });
      expect(unsafeBackendCheck?.detail).toContain('/tmp/test-secrets.json');
      expect(unsafeBackendCheck?.detail).toContain('warning=plaintext fallback');
      expect(
        progressEvents.some(
          (event) =>
            event.row?.id === 'adapter-verification' &&
            event.row.status === ExecutionProgressStatus.WARNING,
        ),
      ).toBe(true);
    } finally {
      await rm(fixture.tempRoot, { recursive: true, force: true });
    }
  });

  it('projects real readiness fields for doctor without safe_local_fix when --fix is disabled', async () => {
    const fixture = await createDoctorCommandFixture();
    const progressEvents: CliCommandProgressEvent[] = [];
    const command = new CliDoctorCommand();

    try {
      const context = createDoctorCommandContext({
        fixture,
        progressEvents,
        adapterVerification: doctorReadinessVerification,
        adaptersConfig: doctorAdaptersConfig,
        onboardingRuntime: new CliAgentOnboardingRuntime(),
        runtimeDebugOptions: {
          adapters: true,
          fix: false,
          dryRun: false,
          overwrite: false,
          singleToolAllRoles: false,
          requestedTools: [],
          presetId: 'multi_tool_default',
        },
      });

      const result = await command.execute(context);
      const diagnosticsArtifactPath = result.commandResult.artifacts?.find(
        (artifact) => artifact.id === 'doctor_diagnostics',
      )?.path;
      const diagnosticsPayload = JSON.parse(
        await readFile(String(diagnosticsArtifactPath), 'utf8'),
      ) as {
        onboardingContract?: {
          diagnostic_summary?: string;
          verification_status?: string;
          next_action?: string | null;
          next_actions?: string[];
        };
        verificationMatrix?: {
          diagnostic_summary?: string;
          verification_status?: string;
          next_action?: string | null;
          next_actions?: string[];
        };
      };

      expect(diagnosticsPayload.onboardingContract).toMatchObject({
        verification_status: CliGovernanceCheckStatus.WARN,
        diagnostic_summary: 'status=warn required_failures=0 fallback_roles=0 degraded_roles=1',
        next_action: 'Review adapter diagnostics before retrying doctor.',
        next_actions: ['Review adapter diagnostics before retrying doctor.'],
      });
      expect(diagnosticsPayload.verificationMatrix).toMatchObject({
        verification_status: CliGovernanceCheckStatus.WARN,
        diagnostic_summary: 'status=warn required_failures=0 fallback_roles=0 degraded_roles=1',
        next_action: 'Review adapter diagnostics before retrying doctor.',
        next_actions: ['Review adapter diagnostics before retrying doctor.'],
      });
      expect(diagnosticsPayload.onboardingContract?.diagnostic_summary).not.toContain(
        'safe_local_fix=',
      );
      expect(diagnosticsPayload.verificationMatrix?.diagnostic_summary).not.toContain(
        'safe_local_fix=',
      );
    } finally {
      await rm(fixture.tempRoot, { recursive: true, force: true });
    }
  });

  it('includes safe_local_fix counts in doctor readiness fields when safe-local repair runs', async () => {
    const fixture = await createDoctorCommandFixture();
    const progressEvents: CliCommandProgressEvent[] = [];
    const command = new CliDoctorCommand();
    await rm(fixture.workspaceRoot, { recursive: true, force: true });

    try {
      const context = createDoctorCommandContext({
        fixture,
        progressEvents,
        adapterVerification: doctorReadinessVerification,
        adaptersConfig: doctorAdaptersConfig,
        onboardingRuntime: new CliAgentOnboardingRuntime(),
        runtimeDebugOptions: {
          adapters: true,
          fix: true,
          dryRun: false,
          overwrite: false,
          singleToolAllRoles: false,
          requestedTools: [],
          presetId: 'multi_tool_default',
        },
      });

      const result = await command.execute(context);
      const diagnosticsArtifactPath = result.commandResult.artifacts?.find(
        (artifact) => artifact.id === 'doctor_diagnostics',
      )?.path;
      const diagnosticsPayload = JSON.parse(
        await readFile(String(diagnosticsArtifactPath), 'utf8'),
      ) as {
        onboardingContract?: {
          diagnostic_summary?: string;
        };
        verificationMatrix?: {
          diagnostic_summary?: string;
        };
      };

      expect(diagnosticsPayload.onboardingContract?.diagnostic_summary).toBe(
        'status=warn required_failures=0 fallback_roles=0 degraded_roles=1 safe_local_fix=3',
      );
      expect(diagnosticsPayload.verificationMatrix?.diagnostic_summary).toBe(
        'status=warn required_failures=0 fallback_roles=0 degraded_roles=1 safe_local_fix=3',
      );
    } finally {
      await rm(fixture.tempRoot, { recursive: true, force: true });
    }
  });
});
