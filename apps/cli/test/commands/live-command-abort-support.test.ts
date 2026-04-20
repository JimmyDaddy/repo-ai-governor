import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';

import { GovernorErrorCode, RuntimeError } from '@repo-ai-governor/shared';

import { CliDoctorCommand } from '../../src/commands/doctor-command.js';
import { CliAgentOnboardingPreset } from '../../src/constants/cli-agent-onboarding.constant.js';
import { CliConnectAction } from '../../src/constants/cli-connect.constant.js';
import { CliGovernanceCheckStatus } from '../../src/constants/cli-governance-runtime.constant.js';
import { CliInteractiveUiMode } from '../../src/constants/cli-interactive-shell.constant.js';
import { CliReactThemePreset } from '../../src/constants/cli-react-theme.constant.js';
import type {
  CliAdapterVerificationResolution,
  CliCommandExecutorContext,
} from '../../src/types/index.js';
import {
  createCliAdapterVerificationResolution,
  createCliNormalizedRuntimeDebugOptions,
} from '../test-support/cli-command-fixtures.js';

interface CommandFixture {
  tempRoot: string;
  context: CliCommandExecutorContext;
  resolveAdapterVerification: ReturnType<typeof vi.fn>;
}

function createAdapterVerificationResolution(): CliAdapterVerificationResolution {
  return createCliAdapterVerificationResolution({
    overallStatus: CliGovernanceCheckStatus.PASS,
  });
}

async function createCommandFixture(
  abortSignal?: AbortSignal,
  adapters = true,
): Promise<CommandFixture> {
  const tempRoot = await mkdtemp(resolve(tmpdir(), 'live-command-abort-support-'));
  const workspaceRoot = resolve(tempRoot, '.repo-ai-governor');
  const configPath = resolve(workspaceRoot, 'governor.yaml');
  const memoryStoreRoot = resolve(workspaceRoot, 'context', 'memory');
  await mkdir(memoryStoreRoot, { recursive: true });
  await writeFile(configPath, 'schemaVersion: "1.1"\n', 'utf8');

  const resolveAdapterVerification = vi.fn(
    async (receivedAbortSignal?: AbortSignal): Promise<CliAdapterVerificationResolution> => {
      expect(receivedAbortSignal).toBe(abortSignal);
      return createAdapterVerificationResolution();
    },
  );

  const context = {
    options: {
      currentWorkingDirectory: process.cwd(),
      workspace: {
        workspaceId: 'test-workspace',
        workspaceRoot,
        configPath,
        mode: 'tool_managed',
        modeSource: 'runtime',
      },
      config: {},
      configSource: 'default',
      profileId: null,
      locale: 'en-US',
      outputMode: 'plain',
      isTty: false,
      memoryConfig: {
        storeEngine: 'fs_csv',
        storeRoot: 'context/memory',
      },
      memoryStoreRoot,
      memoryStoreProviderName: 'fs_csv',
      memoryStoreProvider: {},
      adaptersConfig: {
        roles: [],
        routing: {
          roleBindings: {},
        },
        tools: [],
      },
    },
    abortSignal,
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
      createOnboardingContractPayload: () => ({}),
      resolveSelectedTools: () => [],
      createVerifyMatrixPayload: () => ({}),
    },
    agentProjectionRuntime: {
      createDescriptorsFromRoleEvaluations: () => [],
      createCliAgentView: () => ({
        descriptors: [],
      }),
    },
    adapterDiagnosticsRuntime: {
      resolveToolProbeCheckStatus: () => CliGovernanceCheckStatus.PASS,
      resolveToolProbeCheckDetail: () => 'ok',
      createSafeLocalBoundaryArtifactPayload: () => ({}),
      createAdapterVerificationArtifactPayload: () => ({}),
      createAdapterRoleProgressRows: () => [],
      createAdapterInteractionPrompts: () => [],
      resolveRoleEvaluationDetail: () => 'ok',
    },
    reviewQueueRuntime: {},
    orchestrationServiceRuntime: {},
    commandExperienceBuilder: {
      buildExperiencePayload: (payload: unknown) => payload,
    },
    executeRunCommand: async () => {
      throw new RuntimeError(
        GovernorErrorCode.UNKNOWN,
        'executeRunCommand is not used in live-command-abort-support tests.',
      );
    },
    calculateCheckTotals: (checks: Array<{ status: string }>) => ({
      pass: checks.filter((check) => check.status === CliGovernanceCheckStatus.PASS).length,
      warn: checks.filter((check) => check.status === CliGovernanceCheckStatus.WARN).length,
      fail: checks.filter((check) => check.status === CliGovernanceCheckStatus.FAIL).length,
    }),
    buildDefaultConfigContent: () => 'schemaVersion: "1.1"\n',
    toRfc3339SecondsTimestamp: (value: Date) => value.toISOString().replace(/\.\d{3}Z$/u, 'Z'),
    formatExecFailureDetail: (error: unknown) => String(error),
    resolveRuntimeDebugOptions: () =>
      createCliNormalizedRuntimeDebugOptions({
        interactive: false,
        requestedUiMode: CliInteractiveUiMode.REACT,
        requestedUiTheme: CliReactThemePreset.GOVERNOR,
        uiMode: CliInteractiveUiMode.REACT,
        uiTheme: CliReactThemePreset.GOVERNOR,
        inputTty: true,
        stderrTty: true,
        adapters,
        connectAction: CliConnectAction.GENERATE,
        presetId: CliAgentOnboardingPreset.MULTI_TOOL_DEFAULT,
      }),
    resolveExecutionStreamMetadata: async () => ({}),
    resolveAdapterVerification,
    canWritePath: async () => true,
    localizeText: (english: string) => english,
    translate: (key: string) => key,
    runNodeScript: async () => ({
      stdout: '',
      stderr: '',
    }),
  } as unknown as CliCommandExecutorContext;

  return {
    tempRoot,
    context,
    resolveAdapterVerification,
  };
}

describe('live command abort support', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('passes the live abort signal into doctor adapter verification', async () => {
    const abortController = new AbortController();
    const fixture = await createCommandFixture(abortController.signal);

    try {
      await new CliDoctorCommand().execute(fixture.context);

      expect(fixture.resolveAdapterVerification).toHaveBeenCalledWith(abortController.signal);
    } finally {
      await rm(fixture.tempRoot, { recursive: true, force: true });
    }
  });
});
