import { existsSync } from 'node:fs';
import { isAbsolute, resolve } from 'node:path';

import { Command, CommanderError } from 'commander';

import { AgentAvailabilityStatus, AgentCapability } from '@repo-ai-governor/adapter-sdk';
import {
  type AdaptersConfig,
  ConfigLoader,
  type GovernorConfig,
  type MemoryConfig,
  ProfileResolver,
  type ResolvedWorkspace,
  WorkspaceResolver,
} from '@repo-ai-governor/config';
import {
  MemoryProviderRegistry,
  type MemoryProviderRegistryLoadResult,
} from '@repo-ai-governor/memory-provider-registry';
import {
  AdapterAvailability,
  AdapterSurface,
  DEFAULT_I18N_RUNTIME_CONFIG,
  DEFAULT_MEMORY_RUNTIME_CONFIG,
  DefaultRoleProfileId,
  ErrorOutputEnvironment,
  GovernorErrorCode,
  I18nRuntime,
  type I18nRuntimeConfig,
  type MemoryRuntimeConfig,
  RuntimeError,
  type StandardizedError,
  WorkspaceMigrationPolicy,
  standardizeError,
} from '@repo-ai-governor/shared';
import { CliGovernanceRuntime } from './cli-governance-runtime.js';
import { CliOutputPresenter } from './cli-output-presenter.js';
import {
  CLI_AGENT_ONBOARDING_PRESET_ORDER,
  CLI_AGENT_ONBOARDING_PRESET_VALUES,
  CliAgentOnboardingPreset,
} from './constants/cli-agent-onboarding.constant.js';
import {
  CLI_COMMAND_DEFINITIONS,
  CLI_PROGRAM_NAME,
  CliCommandName,
} from './constants/cli-command.constant.js';
import {
  CLI_CONNECT_ACTION_VALUES,
  CliConnectAction,
  CliConnectWriteMode,
} from './constants/cli-connect.constant.js';
import {
  CLI_INTERACTIVE_UI_MODE_VALUES,
  CliInteractiveUiMode,
} from './constants/cli-interactive-shell.constant.js';
import {
  CLI_OPTIONS_REQUIRING_VALUE,
  CLI_OUTPUT_MODE_VALUES,
  CLI_OUTPUT_SCHEMA_VERSION,
  CLI_VERBOSITY_VALUES,
  CliNextAction,
  CliOutputStatus,
  type CliVerbosity,
  DEFAULT_CLI_OUTPUT_MODE,
  DEFAULT_CLI_VERBOSITY,
  NON_TTY_FALLBACK_OUTPUT_MODE,
} from './constants/cli-output.constant.js';
import {
  CLI_REACT_THEME_PRESET_ORDER,
  CLI_REACT_THEME_VALUES,
  type CliReactThemePreset,
  DEFAULT_CLI_REACT_THEME_PRESET,
} from './constants/cli-react-theme.constant.js';
import { CliWorkflowAction } from './constants/cli-workflow.constant.js';
import { CliWorkspaceAction, CliWorkspaceThemeScope } from './constants/cli-workspace.constant.js';
import { CliCodexExecFixtureEnvironmentKey } from './constants/codex-exec-fixture.constant.js';
import { CliGithubCopilotExecFixtureEnvironmentKey } from './constants/github-copilot-exec-fixture.constant.js';
import {
  IDE_WRAPPER_DEFAULT_STANDARDS_PROFILE_ID,
  type IdeEntrySurface,
  IdeWrapperEnvironmentKey,
} from './constants/ide-command-wrapper.constant.js';
import type { IdeStandardsSourceId } from './constants/ide-standards-source.constant.js';
import {
  ReactCliCommandProgressController,
  ReactCliLiveProgressPresenter,
  ReactCliStderrFramePresenter,
} from './react-cli/index.js';
import { CliClaudeCodeExecFixtureRuntime } from './runtime/claude-code-exec-fixture-runtime.js';
import { CliCodexExecFixtureRuntime } from './runtime/codex-exec-fixture-runtime.js';
import { CliGithubCopilotExecFixtureRuntime } from './runtime/github-copilot-exec-fixture-runtime.js';
import { GlobalCliThemePreferenceService } from './runtime/global-cli-theme-preference-service.js';
import { IdeStandardsSourceRuntime } from './runtime/ide-standards-source-runtime.js';
import { IdeSurfaceRegistryRuntime } from './runtime/ide-surface-registry-runtime.js';
import { CliInteractiveShellUiModeResolver } from './runtime/interactive-shell/interactive-shell-ui-mode-resolver.js';
import { CliSessionShellEntrypointRuntime } from './runtime/interactive-shell/session-shell-entrypoint-runtime.js';
import { CliSessionShellRunner } from './runtime/interactive-shell/session-shell-runner.js';
import { CliSessionShellServiceClient } from './runtime/interactive-shell/session-shell-service-client.js';
import { CliSessionShellStderrRenderer } from './runtime/interactive-shell/session-shell-stderr-renderer.js';
import { CliLiveCommandCancelController } from './runtime/live-command-cancel-controller.js';
import { CliLiveCommandCancellationPolicy } from './runtime/live-command-cancellation-policy.js';
import { CliNotificationProviderRegistryRuntime } from './runtime/notification-provider-registry-runtime.js';
import { CliOrchestrationServiceRuntime } from './runtime/orchestration-service-runtime.js';
import { CliSessionMainSupervisorRuntime } from './runtime/session-main-supervisor-runtime.js';
export {
  IDE_SURFACE_REGISTRY,
  IDE_WRAPPER_DEFAULT_OUTPUT_MODE,
  IDE_WRAPPER_RESERVED_ENVIRONMENT_KEYS,
  IDE_WRAPPER_DEFAULT_STANDARDS_SOURCE_IDS,
  IDE_WRAPPER_SELF_HOSTED_STANDARDS_SOURCE_REGISTRY,
  IDE_WRAPPER_SUPPORTED_COMMANDS,
  IDE_WRAPPER_SUPPORTED_SURFACES,
  IdeEntrySurface,
  IdeStandardsSourceId,
  IdeStandardsSourceKind,
  IdeSurfaceCapability,
  IdeSurfaceDegradeMode,
  IdeWrapperEnvironmentKey,
} from './constants/ide-command-wrapper.constant.js';
export { IdeCommandWrapper, standardizeIdeWrapperError } from './ide-command-wrapper.js';
export type {
  IdeCommandInvocationEnvelope,
  IdeResolvedStandardsSource,
  IdeSurfaceContract,
  IdeCommandWrapperOptions,
  IdeCommandWrapperRequest,
  IdeStandardsInjectionPayload,
  IdeStandardsSourceDescriptor,
  IdeWrapperCommandName,
} from './types/index.js';
import type {
  CliCommandDiagnostics,
  CliCommandExecutionResultPayload,
  CliConnectRoleBindingOverride,
  CliErrorOutputPayload,
  CliGovernanceCommandExecutionOptions,
  CliLocalAdapterProbeOverride,
  CliNestedCommandExecutionOptions,
  CliResolvedOutputContext,
  CliRuntimeDebugOptions,
  CliSuccessOutputPayload,
  CliWorkflowCommandOptions,
  CliWorkspaceCommandOptions,
} from './types/index.js';

const DEFAULT_I18N_CONFIG: I18nRuntimeConfig = {
  ...DEFAULT_I18N_RUNTIME_CONFIG,
  supportedLocales: [...DEFAULT_I18N_RUNTIME_CONFIG.supportedLocales],
};
const DEFAULT_MEMORY_CONFIG: MemoryRuntimeConfig = {
  ...DEFAULT_MEMORY_RUNTIME_CONFIG,
};
const DEFAULT_MEMORY_PROVIDER_REGISTRY = new MemoryProviderRegistry();
const LIVE_COMMAND_CANCELLATION_POLICY = new CliLiveCommandCancellationPolicy();
const CLI_TOP_LEVEL_BOOLEAN_OPTIONS = new Set<string>([
  '--compact',
  '--no-color',
  '--adapters',
  '--fix',
  '--overwrite',
  '--latest',
  '--force',
  '--no-rollback',
  '--record-ledger',
  '--no-interactive',
  '--dry-run',
  '--trace',
  '--restricted-network',
  '--no-local-fallback',
  '--help',
  '-h',
]);
const DEFAULT_ADAPTERS_CONFIG: AdaptersConfig = {
  roles: [
    {
      roleId: 'planner',
      roleProfileId: DefaultRoleProfileId.PLANNER,
      requiredCapabilities: [AgentCapability.STRUCTURED_OUTPUT],
      required: true,
    },
    {
      roleId: 'architect',
      roleProfileId: DefaultRoleProfileId.ARCHITECT,
      requiredCapabilities: [AgentCapability.STRUCTURED_OUTPUT],
      required: true,
    },
    {
      roleId: 'coder',
      roleProfileId: DefaultRoleProfileId.CODER,
      requiredCapabilities: [AgentCapability.TOOL_CALLING],
      required: true,
    },
    {
      roleId: 'tester',
      roleProfileId: DefaultRoleProfileId.TESTER,
      requiredCapabilities: [AgentCapability.TOOL_CALLING],
      required: true,
    },
    {
      roleId: 'reviewer',
      roleProfileId: DefaultRoleProfileId.REVIEWER,
      requiredCapabilities: [AgentCapability.STRUCTURED_OUTPUT],
      required: true,
    },
    {
      roleId: 'verifier',
      roleProfileId: DefaultRoleProfileId.VERIFIER,
      requiredCapabilities: [AgentCapability.STRUCTURED_OUTPUT],
      required: true,
    },
  ],
  routing: {
    roleBindings: {
      planner: {
        primarySurface: AdapterSurface.CODEX,
        fallbackSurfaces: [AdapterSurface.CLAUDE_CODE, AdapterSurface.GITHUB_COPILOT],
      },
      architect: {
        primarySurface: AdapterSurface.CODEX,
        fallbackSurfaces: [AdapterSurface.CLAUDE_CODE, AdapterSurface.GITHUB_COPILOT],
      },
      coder: {
        primarySurface: AdapterSurface.CODEX,
        fallbackSurfaces: [AdapterSurface.GITHUB_COPILOT, AdapterSurface.CLAUDE_CODE],
      },
      tester: {
        primarySurface: AdapterSurface.GITHUB_COPILOT,
        fallbackSurfaces: [AdapterSurface.CODEX, AdapterSurface.CLAUDE_CODE],
      },
      reviewer: {
        primarySurface: AdapterSurface.CODEX,
        fallbackSurfaces: [AdapterSurface.CLAUDE_CODE, AdapterSurface.GITHUB_COPILOT],
      },
      verifier: {
        primarySurface: AdapterSurface.CODEX,
        fallbackSurfaces: [AdapterSurface.CLAUDE_CODE, AdapterSurface.GITHUB_COPILOT],
      },
    },
  },
  tools: [
    {
      toolId: AdapterSurface.CODEX,
      enabled: true,
      availability: AdapterAvailability.AVAILABLE,
    },
    {
      toolId: AdapterSurface.GITHUB_COPILOT,
      enabled: true,
      availability: AdapterAvailability.AVAILABLE,
    },
    {
      toolId: AdapterSurface.CLAUDE_CODE,
      enabled: true,
      availability: AdapterAvailability.AVAILABLE,
    },
  ],
};

const DEFAULT_IO: CliIoAdapters = {
  stdout: (value: string): void => {
    process.stdout.write(value);
  },
  stderr: (value: string): void => {
    process.stderr.write(value);
  },
  cwd: (): string => process.cwd(),
  isStdoutTty: (): boolean => Boolean(process.stdout.isTTY),
  isStdinTty: (): boolean => Boolean(process.stdin.isTTY),
  isStderrTty: (): boolean => Boolean(process.stderr.isTTY),
  env: (): NodeJS.ProcessEnv => process.env,
};

/**
 * Defines IO adapters used by CLI runtime execution.
 */
interface CliIoAdapters {
  stdout: (value: string) => void;
  stderr: (value: string) => void;
  cwd: () => string;
  isStdoutTty?: () => boolean;
  isStdinTty?: () => boolean;
  isStderrTty?: () => boolean;
  env?: () => NodeJS.ProcessEnv;
}

/**
 * Defines one runtime context merged from defaults and repository configuration.
 */
interface ResolvedCliRuntimeContext {
  config: GovernorConfig;
  i18n: I18nRuntimeConfig;
  memory: MemoryRuntimeConfig;
  adapters: AdaptersConfig;
  uiTheme: CliReactThemePreset;
  profileId: string | null;
  configSource: 'default' | 'file';
  workspace: ResolvedWorkspace;
}

/**
 * Defines parsed option state for robust CLI flag handling.
 */
interface ReadOptionResult {
  isPresent: boolean;
  value: string | undefined;
}

/**
 * Defines normalized failure details shared by all runtime catch paths.
 */
interface CliFailureResolution {
  standardizedError: StandardizedError;
  exitCode: number;
}

/**
 * Defines validated IDE wrapper environment overlay consumed by the real CLI entrypoint.
 */
interface ResolvedIdeWrapperEnvironment {
  entrySurface: IdeEntrySurface | null;
  standardsProfileId: string | null;
  standardsSourceIds: IdeStandardsSourceId[];
}

/**
 * Defines replaceable runtime dependencies for entrypoint-specific integration tests.
 */
interface CliEntrypointDependencies {
  sessionShellRunner?: CliSessionShellRunner;
  nestedCommandExecutionOptions?: CliNestedCommandExecutionOptions;
}

const ADAPTER_SURFACE_VALUES = new Set<string>(Object.values(AdapterSurface));

/**
 * Runs the Stage-6 CLI output-contract baseline with TTY-aware fallback semantics.
 * @param argv Raw process argv from Node runtime.
 * @param io Runtime I/O adapters for stdout/stderr/cwd.
 * @returns CLI exit code where `0` means command handled successfully.
 */
export async function runCli(
  argv: string[],
  io: CliIoAdapters = DEFAULT_IO,
  dependencies: CliEntrypointDependencies = {},
): Promise<number> {
  const rawArgs = argv.slice(2);
  const commandName = resolveRequestedCommandName(rawArgs);
  const environment = io.env?.() ?? process.env;
  const outputPresenter = new CliOutputPresenter({
    stdout: io.stdout,
    stderr: io.stderr,
    translate: (key, interpolation) => i18nRuntime?.t(key, interpolation),
  });

  let outputContext = resolveFallbackOutputContext(io);
  let i18nRuntime: I18nRuntime | undefined;
  let memoryStoreComposition: MemoryProviderRegistryLoadResult | undefined;
  let sessionShellOrchestrationServiceRuntime: CliOrchestrationServiceRuntime | undefined;

  try {
    outputContext = resolveOutputModeContext(rawArgs, io);
    outputContext = {
      ...outputContext,
      verbosity: resolveVerbosityOption(rawArgs),
    };

    const requestedLocale = readOptionValue(rawArgs, '--locale');
    const requestedProfileId = readOptionValue(rawArgs, '--profile');
    const ideWrapperEnvironment = resolveIdeWrapperEnvironment(environment);
    const codexExecFixtureRuntime = new CliCodexExecFixtureRuntime();
    const codexExecRunner = codexExecFixtureRuntime.resolveExecRunner(environment);
    const claudeCodeExecFixtureRuntime = new CliClaudeCodeExecFixtureRuntime();
    const claudeCodeExecRunner = claudeCodeExecFixtureRuntime.resolveExecRunner(environment);
    const githubCopilotExecFixtureRuntime = new CliGithubCopilotExecFixtureRuntime();
    const githubCopilotExecRunner = githubCopilotExecFixtureRuntime.resolveExecRunner(environment);
    const globalCliThemePreferenceService = new GlobalCliThemePreferenceService();
    const notificationProviderRegistryRuntime = new CliNotificationProviderRegistryRuntime();
    const notificationProviders = notificationProviderRegistryRuntime.resolveProviders(environment);
    const sessionShellRunner =
      dependencies.sessionShellRunner ??
      new CliSessionShellRunner(undefined, new CliSessionShellStderrRenderer(io.stderr));
    const adapterLocalProbeOverrides = resolveFixtureBackedLocalProbeOverrides({
      hasCodexExecFixture: Boolean(codexExecRunner),
      hasClaudeCodeExecFixture: Boolean(claudeCodeExecRunner),
      hasGithubCopilotExecFixture: Boolean(githubCopilotExecRunner),
    });
    const runtimeContext = resolveRuntimeContext(
      io.cwd(),
      requestedProfileId,
      environment,
      globalCliThemePreferenceService,
    );
    const workspaceCommandOptions = resolveWorkspaceCommandOptions(
      rawArgs,
      globalCliThemePreferenceService.resolvePreferencePath(environment),
    );
    const runtimeDebugOptions = resolveRuntimeDebugOptions(
      rawArgs,
      io.cwd(),
      outputContext,
      io,
      runtimeContext.uiTheme,
      runtimeContext.adapters,
      workspaceCommandOptions,
    );
    const workflowCommandOptions = resolveWorkflowCommandOptions(rawArgs);
    memoryStoreComposition = await DEFAULT_MEMORY_PROVIDER_REGISTRY.loadProvider({
      workspaceRoot: runtimeContext.workspace.workspaceRoot,
      memoryConfig: runtimeContext.memory,
    });
    const activeMemoryStoreComposition = memoryStoreComposition;

    i18nRuntime = new I18nRuntime();
    const runtimeI18n = i18nRuntime;
    const resolvedLocale = await runtimeI18n.initialize(runtimeContext.i18n, requestedLocale);
    const profileLabel = runtimeContext.profileId ?? runtimeI18n.t('cli.skeleton.noProfile');
    sessionShellOrchestrationServiceRuntime = new CliOrchestrationServiceRuntime(
      runtimeContext.workspace.workspaceRoot,
      {
        memoryConfig: runtimeContext.memory,
        embeddedShellDependencies: {
          sessionMainSupervisorRuntime: new CliSessionMainSupervisorRuntime({
            workspaceRoot: runtimeContext.workspace.workspaceRoot,
            currentWorkingDirectory: io.cwd(),
            workspace: runtimeContext.workspace,
            locale: resolvedLocale,
            adaptersConfig: runtimeContext.adapters,
            ...(codexExecRunner
              ? {
                  codexExecRunner,
                }
              : {}),
            ...(claudeCodeExecRunner
              ? {
                  claudeCodeExecRunner,
                }
              : {}),
            ...(githubCopilotExecRunner
              ? {
                  githubCopilotExecRunner,
                }
              : {}),
          }),
        },
      },
    );
    const sessionShellServiceClient = new CliSessionShellServiceClient(
      sessionShellOrchestrationServiceRuntime,
    );
    const sessionShellEntrypointRuntime = new CliSessionShellEntrypointRuntime({
      sessionClient: sessionShellServiceClient,
      commandExecutor: CliSessionShellEntrypointRuntime.createNestedCommandExecutor({
        locale: resolvedLocale,
        currentWorkingDirectory: io.cwd(),
        environment,
        translate: (key: string, interpolation?: Record<string, string>) =>
          runtimeI18n.t(key, interpolation),
        executeCli: (nestedArgv, nestedIo, nestedExecutionOptions) =>
          runCli(nestedArgv, nestedIo, {
            ...dependencies,
            ...(nestedExecutionOptions
              ? {
                  nestedCommandExecutionOptions: nestedExecutionOptions,
                }
              : {}),
          }),
      }),
      ...(dependencies.nestedCommandExecutionOptions
        ? {
            commandExecutionOptions: dependencies.nestedCommandExecutionOptions,
          }
        : {}),
      currentWorkingDirectory: io.cwd(),
      workspaceSummary: runtimeI18n.t('cli.sessionShell.workspaceSummary', {
        workspaceId: runtimeContext.workspace.workspaceId,
        workspaceMode: runtimeContext.workspace.mode,
        workspaceRoot: runtimeContext.workspace.workspaceRoot,
      }),
      outputMode: outputContext.outputMode,
      uiTheme: runtimeDebugOptions.uiTheme,
      translate: (key: string, interpolation?: Record<string, string>) =>
        runtimeI18n.t(key, interpolation),
    });
    const governanceRuntime = new CliGovernanceRuntime({
      currentWorkingDirectory: io.cwd(),
      workspace: runtimeContext.workspace,
      config: runtimeContext.config,
      configSource: runtimeContext.configSource,
      profileId: runtimeContext.profileId,
      locale: resolvedLocale,
      translate: (key: string, interpolation?: Record<string, string>) =>
        runtimeI18n.t(key, interpolation),
      outputMode: outputContext.outputMode,
      isTty: outputContext.isTty,
      memoryConfig: runtimeContext.memory,
      memoryStoreRoot: activeMemoryStoreComposition.memoryStoreRoot,
      memoryStoreProviderName: activeMemoryStoreComposition.providerName,
      memoryStoreProvider: activeMemoryStoreComposition.provider,
      workspaceCommandOptions,
      workflowCommandOptions,
      orchestrationServiceRuntimeDependencies: {
        memoryConfig: runtimeContext.memory,
      },
      adaptersConfig: runtimeContext.adapters,
      ...(notificationProviders.length > 0
        ? {
            notificationProviders,
          }
        : {}),
      ...(adapterLocalProbeOverrides
        ? {
            adapterLocalProbeOverrides,
          }
        : {}),
      runtimeDebugOptions,
      ...(codexExecRunner
        ? {
            codexExecRunner,
          }
        : {}),
      ...(claudeCodeExecRunner
        ? {
            claudeCodeExecRunner,
          }
        : {}),
      ...(githubCopilotExecRunner
        ? {
            githubCopilotExecRunner,
          }
        : {}),
    });
    const reactCliStderrFramePresenter = new ReactCliStderrFramePresenter(io.stderr);

    const program = new Command();
    program.name(CLI_PROGRAM_NAME);
    program.description(runtimeI18n.t('cli.app.description'));
    program.option('--locale <locale>', runtimeI18n.t('cli.options.locale'));
    program.option('--profile <profileId>', runtimeI18n.t('cli.options.profile'));
    program.option('--output <mode>', runtimeI18n.t('cli.options.output'));
    program.option('--ui <mode>', runtimeI18n.t('cli.options.ui'));
    program.option('--ui-theme <theme>', runtimeI18n.t('cli.options.uiTheme'));
    program.option('--verbosity <level>', runtimeI18n.t('cli.options.verbosity'));
    program.option('--compact', runtimeI18n.t('cli.options.compact'));
    program.option('--no-color', runtimeI18n.t('cli.options.noColor'));
    program.option('--adapters', runtimeI18n.t('cli.options.adapters'));
    program.option('--fix', runtimeI18n.t('cli.options.fix'));
    program.option('--preset <presetId>', runtimeI18n.t('cli.options.preset'));
    program.option('--tools <tools>', runtimeI18n.t('cli.options.tools'));
    program.option('--overwrite', runtimeI18n.t('cli.options.overwrite'));
    program.option('--latest', runtimeI18n.t('cli.options.latest'));
    program.option('--force', runtimeI18n.t('cli.options.force'));
    program.option('--no-rollback', runtimeI18n.t('cli.options.noRollback'));
    program.option(
      '--single-tool-all-roles <tool>',
      runtimeI18n.t('cli.options.singleToolAllRoles'),
    );
    program.option('--role-binding <binding>', runtimeI18n.t('cli.options.roleBinding'));
    program.option('--record-ledger', runtimeI18n.t('cli.options.recordLedger'));
    program.option('--task-id <taskId>', runtimeI18n.t('cli.options.taskId'));
    program.option('--no-interactive', runtimeI18n.t('cli.options.noInteractive'));
    program.option('--dry-run', runtimeI18n.t('cli.options.dryRun'));
    program.option('--trace', runtimeI18n.t('cli.options.trace'));
    program.option('--replay <path>', runtimeI18n.t('cli.options.replay'));
    program.option('--restricted-network', runtimeI18n.t('cli.options.restrictedNetwork'));
    program.option('--restricted-reason <reason>', runtimeI18n.t('cli.options.restrictedReason'));
    program.option('--no-local-fallback', runtimeI18n.t('cli.options.noLocalFallback'));
    program.option('--workspace-action <action>', runtimeI18n.t('cli.options.workspaceAction'));
    program.option('--workspace-mode <mode>', runtimeI18n.t('cli.options.workspaceMode'));
    program.option('--workspace-root <path>', runtimeI18n.t('cli.options.workspaceRoot'));
    program.option('--workspace-plan <path>', runtimeI18n.t('cli.options.workspacePlan'));
    program.option('--theme-scope <scope>', runtimeI18n.t('cli.options.themeScope'));
    program.option(
      '--hitl-decision <decision>',
      'HITL decision receipt (`approve`, `reject`, or `revise`).',
    );
    program.option(
      '--hitl-decision-reason <reason>',
      'Human-readable reason attached to the HITL decision receipt.',
    );
    program.option(
      '--hitl-resume-action <action>',
      'Resume action applied after HITL decision (`resume`, `terminate`, or `degrade`).',
    );
    program.option(
      '--hitl-decided-by <actor>',
      'Actor identifier recorded in the HITL decision receipt.',
    );
    program.option(
      '--hitl-constraints <constraints>',
      'Comma-separated constraints attached to the HITL decision receipt.',
    );
    program.showHelpAfterError(false);
    program.configureOutput({
      writeOut: (value) => io.stdout(value),
      writeErr: () => undefined,
    });
    program.exitOverride();

    const executeCliCommand = async (
      resolvedCommandName: CliCommandName,
      presentedCommandName: string = resolvedCommandName,
    ) => {
      const nestedCommandExecutionOptions = dependencies.nestedCommandExecutionOptions;
      const relayProgressSink = nestedCommandExecutionOptions?.progressSink;
      const diagnostics: CliCommandDiagnostics = {
        configSource: runtimeContext.configSource,
        locale: resolvedLocale,
        profile: profileLabel,
        workspaceMode: runtimeContext.workspace.mode,
        workspaceModeSource: runtimeContext.workspace.modeSource,
        workspaceId: runtimeContext.workspace.workspaceId,
        workspaceRoot: runtimeContext.workspace.workspaceRoot,
        ...activeMemoryStoreComposition.summary,
        ...(ideWrapperEnvironment.entrySurface
          ? {
              entrySurface: ideWrapperEnvironment.entrySurface,
            }
          : {}),
        ...(ideWrapperEnvironment.standardsProfileId
          ? {
              standardsProfileId: ideWrapperEnvironment.standardsProfileId,
            }
          : {}),
        ...(ideWrapperEnvironment.standardsSourceIds.length > 0
          ? {
              standardsSourceIds: [...ideWrapperEnvironment.standardsSourceIds],
            }
          : {}),
        ...(environment[CliCodexExecFixtureEnvironmentKey.EXEC_FIXTURE]
          ? {
              codexExecFixture: environment[CliCodexExecFixtureEnvironmentKey.EXEC_FIXTURE] ?? null,
            }
          : {}),
        ...(environment[CliGithubCopilotExecFixtureEnvironmentKey.EXEC_FIXTURE]
          ? {
              githubCopilotExecFixture:
                environment[CliGithubCopilotExecFixtureEnvironmentKey.EXEC_FIXTURE] ?? null,
            }
          : {}),
      };
      const shouldOwnLiveProgressPresenter =
        runtimeDebugOptions.uiMode === CliInteractiveUiMode.REACT &&
        !nestedCommandExecutionOptions?.suppressLiveProgressPresenter &&
        relayProgressSink === undefined;
      const progressController = shouldOwnLiveProgressPresenter
        ? new ReactCliCommandProgressController({
            commandName: resolvedCommandName,
            initialTitle: `[react-shell:${resolvedCommandName}] ${presentedCommandName}`,
            initialSubtitle: `ui=${runtimeDebugOptions.uiMode} theme=${runtimeDebugOptions.uiTheme ?? DEFAULT_CLI_REACT_THEME_PRESET} stdout=${outputContext.outputMode} workspace=${runtimeContext.workspace.mode}`,
            themePreset: runtimeDebugOptions.uiTheme ?? DEFAULT_CLI_REACT_THEME_PRESET,
            translate: (key, interpolation) => runtimeI18n.t(key, interpolation),
          })
        : null;
      const liveProgressPresenter = progressController ? new ReactCliLiveProgressPresenter() : null;
      const localProgressSink =
        progressController && liveProgressPresenter
          ? {
              publish: (
                event: Parameters<
                  NonNullable<CliGovernanceCommandExecutionOptions['progressSink']>['publish']
                >[0],
              ) => {
                liveProgressPresenter.render(progressController.apply(event));
              },
            }
          : undefined;
      const progressSink = relayProgressSink ?? localProgressSink;
      const cancelController =
        progressSink &&
        LIVE_COMMAND_CANCELLATION_POLICY.supportsLiveCancellation(resolvedCommandName)
          ? new CliLiveCommandCancelController({
              commandName: resolvedCommandName,
              progressSink,
              translate: (key, interpolation) => runtimeI18n.t(key, interpolation),
            })
          : null;
      const sigintHandler = (): void => {
        cancelController?.handleSigint();
      };
      const executionOptions: CliGovernanceCommandExecutionOptions | undefined = cancelController
        ? cancelController.createExecutionOptions()
        : progressSink
          ? {
              progressSink,
            }
          : undefined;

      try {
        if (cancelController) {
          process.on('SIGINT', sigintHandler);
        }
        const executionResult = cancelController
          ? await cancelController.raceExecution(
              governanceRuntime.execute(resolvedCommandName, executionOptions),
            )
          : await governanceRuntime.execute(resolvedCommandName, executionOptions);
        liveProgressPresenter?.close();
        if (executionResult.reactCliViewModel) {
          reactCliStderrFramePresenter.write(executionResult.reactCliViewModel);
        }

        outputPresenter.writeSuccess(
          buildSuccessOutputPayload(
            presentedCommandName,
            executionResult.message,
            outputContext,
            diagnostics,
            executionResult.commandResult,
          ),
        );
      } finally {
        if (cancelController) {
          process.off('SIGINT', sigintHandler);
        }
        liveProgressPresenter?.close();
      }
    };

    for (const commandDefinition of CLI_COMMAND_DEFINITIONS) {
      if (
        commandDefinition.name === CliCommandName.CONNECT ||
        commandDefinition.name === CliCommandName.WORKFLOW ||
        commandDefinition.name === CliCommandName.WORKSPACE ||
        commandDefinition.name === CliCommandName.RESUME
      ) {
        continue;
      }

      program
        .command(commandDefinition.name)
        .description(runtimeI18n.t(commandDefinition.descriptionKey))
        .action(async () => {
          await executeCliCommand(commandDefinition.name);
        });
    }

    program
      .command(CliCommandName.CONNECT)
      .description(runtimeI18n.t('cli.commands.connect.description'))
      .argument('[action]', runtimeI18n.t('cli.commands.connect.actionArgument'))
      .argument('[candidate]', runtimeI18n.t('cli.commands.connect.candidateArgument'))
      .option('--latest', runtimeI18n.t('cli.options.latest'))
      .option('--force', runtimeI18n.t('cli.options.force'))
      .option('--no-rollback', runtimeI18n.t('cli.options.noRollback'))
      .addHelpText('after', buildConnectHelpText(runtimeI18n))
      .action(async () => {
        await executeCliCommand(CliCommandName.CONNECT);
      });

    program
      .command(CliCommandName.RESUME)
      .description(runtimeI18n.t('cli.commands.resume.description'))
      .argument('[sessionId]', runtimeI18n.t('cli.commands.resume.sessionIdArgument'))
      .action(async (sessionId?: string) => {
        if (!sessionShellEntrypointRuntime.isInteractiveSessionShellAllowed(runtimeDebugOptions)) {
          throw new RuntimeError(
            GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID,
            runtimeI18n.t('cli.sessionShell.resumeRequiresInteractive'),
            {
              command: CliCommandName.RESUME,
              outputMode: outputContext.outputMode,
              uiMode: runtimeDebugOptions.uiMode,
            },
          );
        }

        await sessionShellRunner.run(
          sessionShellEntrypointRuntime.createRunOptions({
            resumeOnStartup: true,
            requestedSessionId: sessionId ?? null,
          }),
        );
      });

    program
      .command(CliCommandName.WORKSPACE)
      .description(runtimeI18n.t('cli.commands.workspace.description'))
      .argument('[action]', runtimeI18n.t('cli.commands.workspace.actionArgument'))
      .argument('[value]', runtimeI18n.t('cli.commands.workspace.valueArgument'))
      .option('--workspace-action <action>', runtimeI18n.t('cli.options.workspaceAction'))
      .option('--workspace-mode <mode>', runtimeI18n.t('cli.options.workspaceMode'))
      .option('--workspace-root <path>', runtimeI18n.t('cli.options.workspaceRoot'))
      .option('--workspace-plan <path>', runtimeI18n.t('cli.options.workspacePlan'))
      .option('--theme-scope <scope>', runtimeI18n.t('cli.options.themeScope'))
      .option('--output <mode>', runtimeI18n.t('cli.options.output'))
      .option('--ui <mode>', runtimeI18n.t('cli.options.ui'))
      .option('--ui-theme <theme>', runtimeI18n.t('cli.options.uiTheme'))
      .addHelpText('after', buildWorkspaceHelpText(runtimeI18n))
      .action(async () => {
        await executeCliCommand(CliCommandName.WORKSPACE);
      });

    program
      .command(CliWorkspaceAction.SET_UI_THEME)
      .description(runtimeI18n.t('cli.commands.setUiTheme.description'))
      .argument('[theme]', runtimeI18n.t('cli.commands.setUiTheme.themeArgument'))
      .option('--theme-scope <scope>', runtimeI18n.t('cli.options.themeScope'))
      .option('--output <mode>', runtimeI18n.t('cli.options.output'))
      .option('--ui <mode>', runtimeI18n.t('cli.options.ui'))
      .addHelpText('after', buildSetUiThemeHelpText(runtimeI18n))
      .action(async () => {
        await executeCliCommand(CliCommandName.WORKSPACE, CliWorkspaceAction.SET_UI_THEME);
      });

    const workflowCommand = program
      .command(CliCommandName.WORKFLOW)
      .description(runtimeI18n.t('cli.commands.workflow.description'))
      .action(async () => {
        throw new RuntimeError(
          GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID,
          runtimeI18n.t('cli.commands.workflow.subcommandRequired'),
          {
            command: CliCommandName.WORKFLOW,
          },
        );
      });
    workflowCommand
      .command(CliWorkflowAction.CREATE)
      .description(runtimeI18n.t('cli.commands.workflow.createDescription'))
      .option('--workflow-template <template>', runtimeI18n.t('cli.options.workflowTemplate'))
      .action(async () => {
        await executeCliCommand(CliCommandName.WORKFLOW);
      });
    workflowCommand
      .command(CliWorkflowAction.EDIT)
      .description(runtimeI18n.t('cli.commands.workflow.editDescription'))
      .option('--workflow-template <template>', runtimeI18n.t('cli.options.workflowTemplate'))
      .action(async () => {
        await executeCliCommand(CliCommandName.WORKFLOW);
      });
    workflowCommand
      .command(CliWorkflowAction.PREVIEW)
      .description(runtimeI18n.t('cli.commands.workflow.previewDescription'))
      .option('--workflow-template <template>', runtimeI18n.t('cli.options.workflowTemplate'))
      .action(async () => {
        await executeCliCommand(CliCommandName.WORKFLOW);
      });

    const sessionStartupQuery = sessionShellEntrypointRuntime.resolveSessionStartupQuery(rawArgs);
    if (
      sessionShellEntrypointRuntime.shouldEnterDefaultSessionShell(
        rawArgs,
        runtimeDebugOptions,
        sessionStartupQuery,
      )
    ) {
      try {
        await sessionShellRunner.run(
          sessionShellEntrypointRuntime.createRunOptions({
            initialPrompt: sessionStartupQuery,
          }),
        );
        return 0;
      } catch (error) {
        io.stderr(
          `${runtimeI18n.t('cli.sessionShell.fallbackToHelp', {
            reason: standardizeError(error).message,
          })}\n`,
        );
        program.outputHelp();
        return 0;
      }
    }

    if (hasOnlyKnownTopLevelOptions(rawArgs)) {
      program.outputHelp();
      return 0;
    }

    await program.parseAsync(argv, { from: 'node' });
    return 0;
  } catch (error) {
    if (isCommanderHelpDisplayed(error)) {
      return 0;
    }

    const { standardizedError, exitCode } = resolveCliFailure(error);
    const message = i18nRuntime
      ? i18nRuntime.t('cli.errors.unexpected', {
          code: standardizedError.code,
          message: standardizedError.message,
        })
      : `CLI execution failed [${standardizedError.code}]: ${standardizedError.message}`;

    outputPresenter.writeError(
      buildErrorOutputPayload(commandName, message, standardizedError, outputContext),
    );
    return exitCode;
  } finally {
    await sessionShellOrchestrationServiceRuntime?.dispose();
    await memoryStoreComposition?.provider.dispose?.();
  }
}

/**
 * Summarizes one nested CLI handoff run so the session shell can append a stable transcript recap.
 * @param options Nested command execution payloads captured from `runCli`.
 * @returns Session-shell command execution summary.
 */
/**
 * Builds one localized workspace-command help appendix with action guidance and copy-paste examples.
 * @param i18n Initialized CLI i18n runtime.
 * @returns Multi-line help text appended after Commander-generated options.
 */
function buildWorkspaceHelpText(i18n: I18nRuntime): string {
  return [
    '',
    i18n.t('cli.commands.workspace.actionGuideTitle'),
    `  ${CliWorkspaceAction.DRY_RUN.padEnd(12)} ${i18n.t('cli.commands.workspace.actionGuideDryRun')}`,
    `  ${CliWorkspaceAction.EXECUTE.padEnd(12)} ${i18n.t('cli.commands.workspace.actionGuideExecute')}`,
    `  ${CliWorkspaceAction.ROLLBACK.padEnd(12)} ${i18n.t('cli.commands.workspace.actionGuideRollback')}`,
    `  ${CliWorkspaceAction.CLEAR_CONFIG.padEnd(12)} ${i18n.t('cli.commands.workspace.actionGuideClearConfig')}`,
    `  ${CliWorkspaceAction.SET_UI_THEME.padEnd(12)} ${i18n.t('cli.commands.workspace.actionGuideSetUiTheme')}`,
    '',
    i18n.t('cli.commands.workspace.compatibilityTitle'),
    `  ${i18n.t('cli.commands.workspace.compatibilityDetail')}`,
    '',
    ...buildThemeHelpTextBlock(i18n),
    '',
    i18n.t('cli.commands.workspace.examplesTitle'),
    `  ${CLI_PROGRAM_NAME} workspace dry-run --workspace-mode repo_local --output json`,
    `  ${CLI_PROGRAM_NAME} workspace execute --workspace-mode repo_local --output pretty`,
    `  ${CLI_PROGRAM_NAME} workspace rollback <plan-path> --output json`,
    `  ${CLI_PROGRAM_NAME} workspace clear-config --output pretty`,
    `  ${CLI_PROGRAM_NAME} workspace set-ui-theme --output pretty`,
    `  ${CLI_PROGRAM_NAME} set-ui-theme --output pretty`,
    `  ${CLI_PROGRAM_NAME} set-ui-theme calm --output pretty`,
    `  ${CLI_PROGRAM_NAME} set-ui-theme calm --theme-scope workspace --output pretty`,
    `  ${CLI_PROGRAM_NAME} workspace set-ui-theme calm --output pretty`,
  ].join('\n');
}

/**
 * Builds one localized top-level set-ui-theme help appendix.
 * @param i18n Initialized CLI i18n runtime.
 * @returns Multi-line help text appended after Commander-generated options.
 */
function buildSetUiThemeHelpText(i18n: I18nRuntime): string {
  return [
    '',
    i18n.t('cli.commands.setUiTheme.precedenceTitle'),
    `  ${i18n.t('cli.commands.setUiTheme.precedenceDetail')}`,
    '',
    ...buildThemeHelpTextBlock(i18n),
    '',
    i18n.t('cli.commands.setUiTheme.examplesTitle'),
    `  ${CLI_PROGRAM_NAME} set-ui-theme --output pretty`,
    `  ${CLI_PROGRAM_NAME} set-ui-theme calm --output pretty`,
    `  ${CLI_PROGRAM_NAME} set-ui-theme calm --theme-scope workspace --output pretty`,
    `  ${CLI_PROGRAM_NAME} workspace set-ui-theme calm --output pretty`,
  ].join('\n');
}

/**
 * Builds one localized connect-command help appendix covering generate/diff/apply flows.
 * @param i18n Initialized CLI i18n runtime.
 * @returns Multi-line help text appended after Commander-generated options.
 */
function buildConnectHelpText(i18n: I18nRuntime): string {
  return [
    '',
    i18n.t('cli.commands.connect.actionGuideTitle'),
    `  ${CliConnectAction.GENERATE.padEnd(12)} ${i18n.t('cli.commands.connect.actionGuideGenerate')}`,
    `  ${CliConnectAction.DIFF.padEnd(12)} ${i18n.t('cli.commands.connect.actionGuideDiff')}`,
    `  ${CliConnectAction.APPLY.padEnd(12)} ${i18n.t('cli.commands.connect.actionGuideApply')}`,
    '',
    i18n.t('cli.commands.connect.examplesTitle'),
    `  ${CLI_PROGRAM_NAME} connect --preset multi-tool-default --output pretty`,
    `  ${CLI_PROGRAM_NAME} connect diff --latest --output json`,
    `  ${CLI_PROGRAM_NAME} connect apply --latest --output pretty`,
    `  ${CLI_PROGRAM_NAME} connect apply ./context/diagnostics/connect/connect-1234567890.governor.yaml --force`,
  ].join('\n');
}

/**
 * Builds one localized theme discoverability block reused by help appendices.
 * @param i18n Initialized CLI i18n runtime.
 * @returns Ordered help lines covering supported presets and selector behavior.
 */
function buildThemeHelpTextBlock(i18n: I18nRuntime): string[] {
  return [
    i18n.t('cli.reactShell.themeSelector.availableThemesTitle'),
    ...CLI_REACT_THEME_PRESET_ORDER.map(
      (themePreset) =>
        `  ${themePreset.padEnd(12)} ${i18n.t(`cli.reactShell.themePresets.${themePreset}.description`)}`,
    ),
    '',
    i18n.t('cli.reactShell.themeSelector.selectorTitle'),
    `  ${i18n.t('cli.reactShell.themeSelector.selectorHint')}`,
  ];
}

/**
 * Resolves runtime config from repository file when available, otherwise uses defaults.
 * @param currentWorkingDirectory Execution working directory.
 * @param requestedProfileId Optional requested profile id.
 * @returns Effective runtime context plus selected profile and source metadata.
 */
function resolveRuntimeContext(
  currentWorkingDirectory: string,
  requestedProfileId?: string,
  environment: NodeJS.ProcessEnv = process.env,
  globalCliThemePreferenceService = new GlobalCliThemePreferenceService(),
): ResolvedCliRuntimeContext {
  const configLoader = new ConfigLoader();
  const profileResolver = new ProfileResolver();
  const workspaceResolver = new WorkspaceResolver();
  const defaultWorkspace = workspaceResolver.resolve({ currentWorkingDirectory });
  const globalThemePreference = globalCliThemePreferenceService.loadThemePreference({
    environment,
  });
  const repoLocalConfigPath = resolve(currentWorkingDirectory, '.repo-ai-governor/governor.yaml');
  const configPathCandidates = Array.from(
    new Set([repoLocalConfigPath, defaultWorkspace.configPath]),
  );

  for (const configPath of configPathCandidates) {
    if (!existsSync(configPath)) {
      continue;
    }

    const loadedConfig = configLoader.loadFromFile(configPath);
    const resolvedConfig = profileResolver.resolve(loadedConfig, requestedProfileId);
    const resolvedWorkspace = workspaceResolver.resolve({
      currentWorkingDirectory,
      config: resolvedConfig.config,
    });
    const workspaceThemePreference = resolveWorkspaceThemePreference({
      configLoader,
      profileResolver,
      requestedProfileId,
      activeWorkspaceConfigPath: resolvedWorkspace.configPath,
      fallbackConfigPath: configPath,
      fallbackThemePreference: resolvedConfig.config.ui?.react?.theme ?? null,
    });

    return {
      config: resolvedConfig.config,
      i18n: resolvedConfig.config.i18n,
      memory: resolveMemoryRuntimeConfig(resolvedConfig.config.memory),
      adapters: resolveAdaptersRuntimeConfig(resolvedConfig.config.adapters),
      uiTheme: resolveCliThemePreset(
        workspaceThemePreference ?? globalThemePreference ?? undefined,
      ),
      profileId: resolvedConfig.profileId,
      configSource: 'file',
      workspace: resolvedWorkspace,
    };
  }

  return {
    config: buildDefaultGovernorConfig(defaultWorkspace.mode),
    i18n: DEFAULT_I18N_CONFIG,
    memory: DEFAULT_MEMORY_CONFIG,
    adapters: resolveAdaptersRuntimeConfig(undefined),
    uiTheme: resolveCliThemePreset(globalThemePreference ?? undefined),
    profileId: null,
    configSource: 'default',
    workspace: defaultWorkspace,
  };
}

function buildDefaultGovernorConfig(workspaceMode: ResolvedWorkspace['mode']): GovernorConfig {
  return {
    schemaVersion: '1.1',
    workspace: {
      mode: workspaceMode,
      migrationPolicy: WorkspaceMigrationPolicy.COPY_VERIFY_SWITCH_ROLLBACK,
    },
    i18n: {
      runtimeEngine: DEFAULT_I18N_CONFIG.runtimeEngine,
      defaultLocale: DEFAULT_I18N_CONFIG.defaultLocale,
      fallbackLocale: DEFAULT_I18N_CONFIG.fallbackLocale,
      supportedLocales: [...DEFAULT_I18N_CONFIG.supportedLocales],
    },
    memory: {
      storeEngine: DEFAULT_MEMORY_CONFIG.storeEngine,
      storeRoot: DEFAULT_MEMORY_CONFIG.storeRoot,
    },
    ui: {
      react: {
        theme: DEFAULT_CLI_REACT_THEME_PRESET,
      },
    },
    adapters: resolveAdaptersRuntimeConfig(undefined),
  };
}

/**
 * Resolves the effective workspace-layer theme by preferring the active workspace config.
 * @param options Helper inputs used to inspect both selector and active workspace config files.
 * @returns Workspace theme preference or `null` when no workspace file defines one.
 */
function resolveWorkspaceThemePreference(options: {
  configLoader: ConfigLoader;
  profileResolver: ProfileResolver;
  requestedProfileId?: string;
  activeWorkspaceConfigPath: string;
  fallbackConfigPath: string;
  fallbackThemePreference: CliReactThemePreset | null;
}): CliReactThemePreset | null {
  if (options.activeWorkspaceConfigPath === options.fallbackConfigPath) {
    return options.fallbackThemePreference;
  }

  if (!existsSync(options.activeWorkspaceConfigPath)) {
    return options.fallbackThemePreference;
  }

  const activeWorkspaceConfig = options.profileResolver.resolve(
    options.configLoader.loadFromFile(options.activeWorkspaceConfigPath),
    options.requestedProfileId,
  );
  return activeWorkspaceConfig.config.ui?.react?.theme ?? options.fallbackThemePreference;
}

/**
 * Resolves local command-probe overrides for surfaces backed by deterministic exec fixtures.
 * @param options Boolean flags describing which CLI exec fixtures are active.
 * @returns Probe overrides that bypass host-binary checks for fixture-backed surfaces.
 */
function resolveFixtureBackedLocalProbeOverrides(options: {
  hasCodexExecFixture: boolean;
  hasClaudeCodeExecFixture: boolean;
  hasGithubCopilotExecFixture: boolean;
}): Partial<Record<AdapterSurface, CliLocalAdapterProbeOverride>> | undefined {
  const overrides: Partial<Record<AdapterSurface, CliLocalAdapterProbeOverride>> = {};

  if (options.hasCodexExecFixture) {
    overrides[AdapterSurface.CODEX] = {
      availabilityStatus: AgentAvailabilityStatus.AVAILABLE,
      unavailableReasons: [],
    };
  }

  if (options.hasClaudeCodeExecFixture) {
    overrides[AdapterSurface.CLAUDE_CODE] = {
      availabilityStatus: AgentAvailabilityStatus.AVAILABLE,
      unavailableReasons: [],
    };
  }

  if (options.hasGithubCopilotExecFixture) {
    overrides[AdapterSurface.GITHUB_COPILOT] = {
      availabilityStatus: AgentAvailabilityStatus.AVAILABLE,
      unavailableReasons: [],
    };
  }

  return Object.keys(overrides).length > 0 ? overrides : undefined;
}

/**
 * Resolves and validates IDE wrapper env injected by official IDE templates.
 * @param environment Process-level environment map.
 * @returns Validated IDE wrapper overlay snapshot for diagnostics and fail-fast validation.
 */
function resolveIdeWrapperEnvironment(
  environment: NodeJS.ProcessEnv,
): ResolvedIdeWrapperEnvironment {
  const ideSurfaceRegistryRuntime = new IdeSurfaceRegistryRuntime();
  const ideStandardsSourceRuntime = new IdeStandardsSourceRuntime();
  const entrySurfaceValue = normalizeWrapperEnvironmentValue(
    environment[IdeWrapperEnvironmentKey.ENTRY_SURFACE],
    IdeWrapperEnvironmentKey.ENTRY_SURFACE,
  );
  const standardsProfileIdValue = normalizeWrapperEnvironmentValue(
    environment[IdeWrapperEnvironmentKey.STANDARDS_PROFILE_ID],
    IdeWrapperEnvironmentKey.STANDARDS_PROFILE_ID,
  );
  const standardsSourcesValue = normalizeWrapperEnvironmentValue(
    environment[IdeWrapperEnvironmentKey.STANDARDS_SOURCES],
    IdeWrapperEnvironmentKey.STANDARDS_SOURCES,
  );

  const entrySurface = entrySurfaceValue
    ? ideSurfaceRegistryRuntime.resolveSurfaceContract(entrySurfaceValue as IdeEntrySurface)
        .surfaceId
    : null;
  const standardsProfileId =
    standardsProfileIdValue ??
    (standardsSourcesValue ? IDE_WRAPPER_DEFAULT_STANDARDS_PROFILE_ID : null);
  const standardsSourceIds = standardsSourcesValue
    ? parseIdeStandardsSourceIds(standardsSourcesValue, ideStandardsSourceRuntime)
    : [];

  return {
    entrySurface,
    standardsProfileId,
    standardsSourceIds,
  };
}

/**
 * Normalizes one IDE wrapper environment value and rejects blank strings.
 * @param rawValue Raw environment value.
 * @param environmentKey Environment variable key.
 * @returns Trimmed value or null when omitted.
 */
function normalizeWrapperEnvironmentValue(
  rawValue: string | undefined,
  environmentKey: IdeWrapperEnvironmentKey,
): string | null {
  if (rawValue === undefined) {
    return null;
  }

  const normalizedValue = rawValue.trim();
  if (normalizedValue.length === 0) {
    throw new RuntimeError(
      GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID,
      `Environment variable ${environmentKey} must not be empty.`,
      {
        environmentKey,
      },
    );
  }

  return normalizedValue;
}

/**
 * Parses IDE standards source IDs from comma-separated env input and validates them.
 * @param standardsSourcesValue Comma-separated source IDs.
 * @param ideStandardsSourceRuntime Standards source validation runtime.
 * @returns Ordered validated source IDs.
 */
function parseIdeStandardsSourceIds(
  standardsSourcesValue: string,
  ideStandardsSourceRuntime: IdeStandardsSourceRuntime,
): IdeStandardsSourceId[] {
  const sourceTokens = standardsSourcesValue.split(',').map((sourceId) => sourceId.trim());
  if (sourceTokens.some((sourceId) => sourceId.length === 0)) {
    throw new RuntimeError(
      GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID,
      `Environment variable ${IdeWrapperEnvironmentKey.STANDARDS_SOURCES} must be a comma-separated list of non-empty source IDs.`,
      {
        environmentKey: IdeWrapperEnvironmentKey.STANDARDS_SOURCES,
        value: standardsSourcesValue,
      },
    );
  }

  const sourceIds = sourceTokens as IdeStandardsSourceId[];
  ideStandardsSourceRuntime.resolveSources(sourceIds);
  return [...sourceIds];
}

/**
 * Resolves memory runtime config with shared defaults.
 * @param memoryConfig Optional memory config from repository file and profile overrides.
 * @returns Fully-resolved memory runtime config.
 */
function resolveMemoryRuntimeConfig(
  memoryConfig: Partial<MemoryConfig> | undefined,
): MemoryRuntimeConfig {
  return {
    ...DEFAULT_MEMORY_CONFIG,
    ...(memoryConfig ?? {}),
  };
}

/**
 * Resolves adapters runtime config with default role/routing/tool baseline.
 * @param adaptersConfig Optional adapters config from repository file and profile overrides.
 * @returns Fully-resolved adapters runtime config.
 */
function resolveAdaptersRuntimeConfig(
  adaptersConfig: Partial<AdaptersConfig> | undefined,
): AdaptersConfig {
  const roles = (adaptersConfig?.roles ?? DEFAULT_ADAPTERS_CONFIG.roles).map((role) => ({
    ...role,
    requiredCapabilities: [...role.requiredCapabilities],
  }));
  const roleBindings = Object.fromEntries(
    Object.entries({
      ...DEFAULT_ADAPTERS_CONFIG.routing.roleBindings,
      ...(adaptersConfig?.routing?.roleBindings ?? {}),
    }).map(([roleId, binding]) => [
      roleId,
      {
        ...binding,
        ...(binding.fallbackSurfaces
          ? {
              fallbackSurfaces: [...binding.fallbackSurfaces],
            }
          : {}),
      },
    ]),
  );
  const toolsById = new Map(
    (DEFAULT_ADAPTERS_CONFIG.tools ?? []).map((tool) => [tool.toolId, { ...tool }]),
  );
  for (const tool of adaptersConfig?.tools ?? []) {
    toolsById.set(tool.toolId, {
      ...(toolsById.get(tool.toolId) ?? {}),
      ...tool,
      ...(tool.unavailableReasons
        ? {
            unavailableReasons: [...tool.unavailableReasons],
          }
        : {}),
    });
  }

  return {
    roles,
    routing: {
      roleBindings,
    },
    ...(toolsById.size > 0
      ? {
          tools: Array.from(toolsById.values()),
        }
      : {}),
  };
}

/**
 * Resolves fallback output context when option parsing has not completed yet.
 * @param io Runtime IO adapters.
 * @returns Safe fallback output context.
 */
function resolveFallbackOutputContext(io: CliIoAdapters): CliResolvedOutputContext {
  const isTty = resolveIsStdoutTty(io);
  const outputMode = isTty ? DEFAULT_CLI_OUTPUT_MODE : NON_TTY_FALLBACK_OUTPUT_MODE;

  return {
    outputMode,
    verbosity: DEFAULT_CLI_VERBOSITY,
    compact: false,
    noColor: false,
    isTty,
    colorEnabled: outputMode === ErrorOutputEnvironment.PRETTY && isTty,
    downgradedFrom: null,
  };
}

/**
 * Resolves output mode/no-color first so JSON error contract is preserved.
 * @param args CLI args excluding node and binary.
 * @param io Runtime IO adapters.
 * @returns Output context with mode fallback and default verbosity.
 */
function resolveOutputModeContext(args: string[], io: CliIoAdapters): CliResolvedOutputContext {
  const requestedOutputMode = resolveOutputModeOption(args);
  const isTty = resolveIsStdoutTty(io);
  const downgradedFrom =
    requestedOutputMode === ErrorOutputEnvironment.PRETTY && !isTty
      ? ErrorOutputEnvironment.PRETTY
      : null;
  const outputMode = downgradedFrom ? NON_TTY_FALLBACK_OUTPUT_MODE : requestedOutputMode;
  const noColor = hasFlag(args, '--no-color');
  const compact = hasFlag(args, '--compact');

  return {
    outputMode,
    verbosity: DEFAULT_CLI_VERBOSITY,
    compact,
    noColor,
    isTty,
    colorEnabled: !noColor && outputMode === ErrorOutputEnvironment.PRETTY && isTty,
    downgradedFrom,
  };
}

/**
 * Resolves `--output` option and validates allowed values.
 * @param args CLI args excluding node and binary.
 * @returns Validated output mode.
 */
function resolveOutputModeOption(args: string[]): ErrorOutputEnvironment {
  const option = readOptionInput(args, '--output');
  if (!option.isPresent) {
    return DEFAULT_CLI_OUTPUT_MODE;
  }

  if (!option.value) {
    throw new RuntimeError(
      GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID,
      'Option --output requires one value: pretty|plain|json.',
      { option: '--output' },
    );
  }

  if (!CLI_OUTPUT_MODE_VALUES.has(option.value)) {
    throw new RuntimeError(
      GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID,
      `Option --output must be one of pretty|plain|json; received '${option.value}'.`,
      { option: '--output', value: option.value },
    );
  }

  return option.value as ErrorOutputEnvironment;
}

/**
 * Resolves `--verbosity` option and validates allowed values.
 * @param args CLI args excluding node and binary.
 * @returns Validated verbosity value.
 */
function resolveVerbosityOption(args: string[]): CliVerbosity {
  const option = readOptionInput(args, '--verbosity');
  if (!option.isPresent) {
    return DEFAULT_CLI_VERBOSITY;
  }

  if (!option.value) {
    throw new RuntimeError(
      GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID,
      'Option --verbosity requires one value: quiet|normal|verbose.',
      { option: '--verbosity' },
    );
  }

  if (!CLI_VERBOSITY_VALUES.has(option.value)) {
    throw new RuntimeError(
      GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID,
      `Option --verbosity must be one of quiet|normal|verbose; received '${option.value}'.`,
      { option: '--verbosity', value: option.value },
    );
  }

  return option.value as CliVerbosity;
}

/**
 * Resolves local debug/replay flags for `run` execution path.
 * @param args CLI args excluding node and binary.
 * @param currentWorkingDirectory Runtime current working directory.
 * @param defaultUiTheme Effective repository-level React-shell theme preset.
 * @returns Normalized debug options.
 */
function resolveRuntimeDebugOptions(
  args: string[],
  currentWorkingDirectory: string,
  outputContext: CliResolvedOutputContext,
  io: CliIoAdapters,
  defaultUiTheme: CliReactThemePreset,
  adaptersConfig: AdaptersConfig,
  workspaceCommandOptions: CliWorkspaceCommandOptions,
): CliRuntimeDebugOptions {
  const requestedCommandName = resolveRequestedCommandName(args);
  const readRequiredOption = (flag: string, errorMessage: string): string | null => {
    const option = readOptionInput(args, flag);
    if (option.isPresent && !option.value) {
      throw new RuntimeError(GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID, errorMessage, {
        option: flag,
      });
    }

    return option.value?.trim() || null;
  };
  const replayOption = readOptionInput(args, '--replay');
  if (replayOption.isPresent && !replayOption.value) {
    throw new RuntimeError(
      GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID,
      'Option --replay requires one path value.',
      { option: '--replay' },
    );
  }

  const replayPath =
    replayOption.value && replayOption.value.trim().length > 0
      ? resolveReplayPath(currentWorkingDirectory, replayOption.value.trim())
      : null;
  const presetOption = readOptionInput(args, '--preset');
  if (presetOption.isPresent && !presetOption.value) {
    throw new RuntimeError(
      GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID,
      `Option --preset requires one value: ${CLI_AGENT_ONBOARDING_PRESET_ORDER.join('|')}.`,
      { option: '--preset' },
    );
  }

  const presetId = presetOption.value?.trim().toLowerCase() ?? null;
  if (presetId && !CLI_AGENT_ONBOARDING_PRESET_VALUES.has(presetId)) {
    throw new RuntimeError(
      GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID,
      `Option --preset must be one of ${CLI_AGENT_ONBOARDING_PRESET_ORDER.join('|')}; received '${presetId}'.`,
      { option: '--preset', value: presetId },
    );
  }

  const toolsOption = readOptionInput(args, '--tools');
  if (toolsOption.isPresent && !toolsOption.value) {
    throw new RuntimeError(
      GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID,
      'Option --tools requires one comma-separated tool list.',
      { option: '--tools' },
    );
  }
  const requestedTools = resolveAdapterSurfaceListOption(toolsOption.value ?? null, '--tools');

  const singleToolAllRolesOption = readOptionInput(args, '--single-tool-all-roles');
  if (singleToolAllRolesOption.isPresent && !singleToolAllRolesOption.value) {
    throw new RuntimeError(
      GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID,
      'Option --single-tool-all-roles requires one tool id value.',
      { option: '--single-tool-all-roles' },
    );
  }
  const singleToolAllRolesSurface = resolveSingleAdapterSurfaceOption(
    singleToolAllRolesOption.value ?? null,
    '--single-tool-all-roles',
  );
  const roleBindingOverrides = resolveRoleBindingOverrides(args, adaptersConfig);
  const uiModeOption = readOptionInput(args, '--ui');
  if (uiModeOption.isPresent && !uiModeOption.value) {
    throw new RuntimeError(
      GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID,
      'Option --ui requires one value: none|classic|react|tui.',
      { option: '--ui' },
    );
  }

  const requestedUiMode = uiModeOption.value?.trim().toLowerCase() ?? null;
  if (requestedUiMode && !CLI_INTERACTIVE_UI_MODE_VALUES.has(requestedUiMode)) {
    throw new RuntimeError(
      GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID,
      `Option --ui must be one of none|classic|react|tui; received '${requestedUiMode}'.`,
      { option: '--ui', value: requestedUiMode },
    );
  }
  const uiThemeOption = readOptionInput(args, '--ui-theme');
  if (uiThemeOption.isPresent && !uiThemeOption.value) {
    throw new RuntimeError(
      GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID,
      'Option --ui-theme requires one value: governor|catppuccin|calm.',
      { option: '--ui-theme' },
    );
  }

  const workspaceThemeShortcut =
    workspaceCommandOptions.action === CliWorkspaceAction.SET_UI_THEME
      ? (workspaceCommandOptions.actionValue?.trim().toLowerCase() ?? null)
      : null;
  const requestedUiTheme = uiThemeOption.value?.trim().toLowerCase() ?? workspaceThemeShortcut;
  if (requestedUiTheme && !CLI_REACT_THEME_VALUES.has(requestedUiTheme)) {
    throw new RuntimeError(
      GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID,
      `Option --ui-theme must be one of governor|catppuccin|calm; received '${requestedUiTheme}'.`,
      { option: '--ui-theme', value: requestedUiTheme },
    );
  }

  const uiModeResolver = new CliInteractiveShellUiModeResolver();
  const inputTty = resolveIsStdinTty(io);
  const stderrTty = resolveIsStderrTty(io);
  const uiModeResolution = uiModeResolver.resolve({
    interactiveRequested: !hasFlag(args, '--no-interactive'),
    requestedUiMode: (requestedUiMode as CliInteractiveUiMode | null) ?? null,
    outputMode: outputContext.outputMode,
    isOutputTty: outputContext.isTty,
    isInputTty: inputTty,
    isStderrTty: stderrTty,
  });
  const taskIdOption = readOptionInput(args, '--task-id');
  if (taskIdOption.isPresent && !taskIdOption.value) {
    throw new RuntimeError(
      GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID,
      'Option --task-id requires one value.',
      { option: '--task-id' },
    );
  }
  const restrictedReasonOption = readOptionInput(args, '--restricted-reason');
  if (restrictedReasonOption.isPresent && !restrictedReasonOption.value) {
    throw new RuntimeError(
      GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID,
      'Option --restricted-reason requires one value.',
      { option: '--restricted-reason' },
    );
  }
  const rawConnectAction =
    requestedCommandName === CliCommandName.CONNECT
      ? (resolveNestedSubcommandToken(args, CliCommandName.CONNECT)?.trim().toLowerCase() ?? null)
      : null;
  if (rawConnectAction && !CLI_CONNECT_ACTION_VALUES.has(rawConnectAction)) {
    throw new RuntimeError(
      GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID,
      `connect action must be one of ${Array.from(CLI_CONNECT_ACTION_VALUES).join('|')}; received '${rawConnectAction}'.`,
      {
        command: CliCommandName.CONNECT,
        value: rawConnectAction,
      },
    );
  }
  const connectAction =
    rawConnectAction === CliConnectAction.DIFF || rawConnectAction === CliConnectAction.APPLY
      ? rawConnectAction
      : CliConnectAction.GENERATE;
  const connectCandidatePath =
    requestedCommandName === CliCommandName.CONNECT
      ? resolvePositionalTokenAfterCommand(args, CliCommandName.CONNECT, 1)
      : null;
  const connectLatest = hasFlag(args, '--latest');
  if (
    requestedCommandName === CliCommandName.CONNECT &&
    connectAction === CliConnectAction.GENERATE &&
    connectCandidatePath
  ) {
    throw new RuntimeError(
      GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID,
      'connect generate does not accept one candidate positional path; use `connect diff <candidate>` or `connect apply <candidate>` instead.',
      {
        command: CliCommandName.CONNECT,
        candidatePath: connectCandidatePath,
      },
    );
  }
  if (
    requestedCommandName === CliCommandName.CONNECT &&
    connectAction !== CliConnectAction.GENERATE &&
    connectCandidatePath &&
    connectLatest
  ) {
    throw new RuntimeError(
      GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID,
      'connect diff/apply accepts either one candidate path or --latest, but not both.',
      {
        command: CliCommandName.CONNECT,
        candidatePath: connectCandidatePath,
        option: '--latest',
      },
    );
  }

  const hitlDecision = readRequiredOption(
    '--hitl-decision',
    'Option --hitl-decision requires one value.',
  );
  const hitlDecisionReason = readRequiredOption(
    '--hitl-decision-reason',
    'Option --hitl-decision-reason requires one value.',
  );
  const hitlResumeAction = readRequiredOption(
    '--hitl-resume-action',
    'Option --hitl-resume-action requires one value.',
  );
  const hitlDecidedBy = readRequiredOption(
    '--hitl-decided-by',
    'Option --hitl-decided-by requires one value.',
  );
  const hitlConstraintsInput = readRequiredOption(
    '--hitl-constraints',
    'Option --hitl-constraints requires one value.',
  );
  const hitlConstraints =
    hitlConstraintsInput
      ?.split(',')
      .map((constraint) => constraint.trim())
      .filter(Boolean) ?? [];

  if (hitlDecision && !['approve', 'reject', 'revise'].includes(hitlDecision)) {
    throw new RuntimeError(
      GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID,
      'Option --hitl-decision must be one of: approve, reject, revise.',
      {
        option: '--hitl-decision',
        value: hitlDecision,
      },
    );
  }

  if (hitlResumeAction && !['resume', 'terminate', 'degrade'].includes(hitlResumeAction)) {
    throw new RuntimeError(
      GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID,
      'Option --hitl-resume-action must be one of: resume, terminate, degrade.',
      {
        option: '--hitl-resume-action',
        value: hitlResumeAction,
      },
    );
  }

  if (
    !hitlDecision &&
    (hitlDecisionReason || hitlResumeAction || hitlDecidedBy || hitlConstraints.length > 0)
  ) {
    throw new RuntimeError(
      GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID,
      'HITL receipt companion options require --hitl-decision.',
      {
        option: '--hitl-decision',
      },
    );
  }

  return {
    interactive: !hasFlag(args, '--no-interactive'),
    requestedUiMode: uiModeResolution.requestedUiMode,
    requestedUiTheme: (requestedUiTheme as CliReactThemePreset | null) ?? null,
    uiMode: uiModeResolution.uiMode,
    uiTheme: (requestedUiTheme as CliReactThemePreset | null) ?? defaultUiTheme,
    uiFallbackBehavior: uiModeResolution.fallbackBehavior,
    inputTty,
    stderrTty,
    dryRun: hasFlag(args, '--dry-run'),
    trace: hasFlag(args, '--trace'),
    replayPath,
    connectAction,
    connectCandidatePath,
    connectLatest,
    connectForce: hasFlag(args, '--force'),
    connectRollbackEnabled: !hasFlag(args, '--no-rollback'),
    connectWriteMode: hasFlag(args, '--overwrite')
      ? CliConnectWriteMode.OVERWRITE
      : CliConnectWriteMode.MERGE,
    presetId:
      (presetId as CliAgentOnboardingPreset | null) ?? CliAgentOnboardingPreset.MULTI_TOOL_DEFAULT,
    requestedTools:
      singleToolAllRolesSurface !== null ? [singleToolAllRolesSurface] : requestedTools,
    overwrite: hasFlag(args, '--overwrite'),
    singleToolAllRoles: singleToolAllRolesSurface !== null,
    roleBindingOverrides,
    adapters: hasFlag(args, '--adapters'),
    fix: hasFlag(args, '--fix'),
    recordLedger: hasFlag(args, '--record-ledger'),
    taskId: taskIdOption.value?.trim() || null,
    restrictedNetwork: hasFlag(args, '--restricted-network'),
    restrictedReason: restrictedReasonOption.value?.trim() || null,
    allowLocalFallback: !hasFlag(args, '--no-local-fallback'),
    hitlDecision,
    hitlDecisionReason,
    hitlResumeAction,
    hitlDecidedBy,
    hitlConstraints,
  };
}

function resolveAdapterSurfaceListOption(rawValue: string | null, flag: string): AdapterSurface[] {
  if (!rawValue) {
    return [];
  }

  const values = rawValue
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  if (values.length === 0) {
    throw new RuntimeError(
      GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID,
      `Option ${flag} requires at least one non-empty tool id.`,
      { option: flag },
    );
  }

  for (const value of values) {
    if (!ADAPTER_SURFACE_VALUES.has(value)) {
      throw new RuntimeError(
        GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID,
        `Option ${flag} contains unsupported tool id '${value}'.`,
        {
          option: flag,
          value,
        },
      );
    }
  }

  return Array.from(new Set(values)) as AdapterSurface[];
}

function resolveSingleAdapterSurfaceOption(
  rawValue: string | null,
  flag: string,
): AdapterSurface | null {
  if (!rawValue) {
    return null;
  }

  const [surface] = resolveAdapterSurfaceListOption(rawValue, flag);
  return surface ?? null;
}

function resolveRoleBindingOverrides(
  args: string[],
  adaptersConfig: AdaptersConfig,
): CliConnectRoleBindingOverride[] {
  const rawBindings = readRepeatedOptionValues(args, '--role-binding');
  if (rawBindings.length === 0) {
    return [];
  }

  const roleIdByToken = new Map<string, string>();
  for (const role of adaptersConfig.roles) {
    roleIdByToken.set(role.roleId, role.roleId);
    roleIdByToken.set(role.roleProfileId, role.roleId);
  }

  return rawBindings.map((rawBinding) => {
    const separatorIndex = rawBinding.indexOf('=');
    if (separatorIndex <= 0 || separatorIndex === rawBinding.length - 1) {
      throw new RuntimeError(
        GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID,
        'Option --role-binding must use roleId=tool[,fallbackTool...] syntax.',
        {
          option: '--role-binding',
          value: rawBinding,
        },
      );
    }

    const roleToken = rawBinding.slice(0, separatorIndex).trim();
    const surfaceToken = rawBinding.slice(separatorIndex + 1).trim();
    const roleId = roleIdByToken.get(roleToken);
    if (!roleId) {
      throw new RuntimeError(
        GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID,
        `Option --role-binding references unsupported role '${roleToken}'.`,
        {
          option: '--role-binding',
          value: rawBinding,
        },
      );
    }

    const [primarySurface, ...fallbackSurfaces] = resolveAdapterSurfaceListOption(
      surfaceToken,
      '--role-binding',
    );
    if (!primarySurface) {
      throw new RuntimeError(
        GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID,
        'Option --role-binding requires at least one target tool id.',
        {
          option: '--role-binding',
          value: rawBinding,
        },
      );
    }

    return {
      roleId,
      primarySurface,
      fallbackSurfaces,
    };
  });
}

/**
 * Resolves one effective React-shell theme by falling back to the repository baseline.
 * @param themePreset Optional config-defined preset.
 * @returns Effective preset guaranteed to be supported.
 */
function resolveCliThemePreset(themePreset: CliReactThemePreset | undefined): CliReactThemePreset {
  return themePreset ?? DEFAULT_CLI_REACT_THEME_PRESET;
}

/**
 * Resolves replay source path to absolute path for deterministic diagnostics output.
 * @param currentWorkingDirectory Runtime current working directory.
 * @param replayPath Replay source path from CLI option.
 * @returns Absolute replay source path.
 */
function resolveReplayPath(currentWorkingDirectory: string, replayPath: string): string {
  if (isAbsolute(replayPath)) {
    return replayPath;
  }

  return resolve(currentWorkingDirectory, replayPath);
}

/**
 * Builds stable success payload for JSON and text renderers.
 * @param command Executed command name.
 * @param message Human-readable command summary.
 * @param outputContext Resolved output runtime context.
 * @param diagnostics Runtime diagnostics snapshot.
 * @param commandResult Optional command-level governance payload.
 * @returns Stable success payload.
 */
function buildSuccessOutputPayload(
  command: string,
  message: string,
  outputContext: CliResolvedOutputContext,
  diagnostics: CliCommandDiagnostics,
  commandResult?: CliCommandExecutionResultPayload,
): CliSuccessOutputPayload {
  return {
    schema_version: CLI_OUTPUT_SCHEMA_VERSION,
    status: CliOutputStatus.SUCCESS,
    output_mode: outputContext.outputMode,
    verbosity: outputContext.verbosity,
    command,
    message,
    runtime: {
      is_tty: outputContext.isTty,
      color_enabled: outputContext.colorEnabled,
      compact: outputContext.compact,
      downgraded_from: outputContext.downgradedFrom,
    },
    diagnostics,
    ...(commandResult ? { command_result: commandResult } : {}),
  };
}

/**
 * Builds stable error payload with structured hint/next_action fields.
 * @param command Requested command name.
 * @param message Human-readable error summary.
 * @param standardizedError Standardized error object.
 * @param outputContext Resolved output runtime context.
 * @returns Stable error payload.
 */
function buildErrorOutputPayload(
  command: string,
  message: string,
  standardizedError: StandardizedError,
  outputContext: CliResolvedOutputContext,
): CliErrorOutputPayload {
  const guidance = resolveErrorGuidance(standardizedError.code);
  const errorDetails = resolveCliErrorDetails(standardizedError.details);

  return {
    schema_version: CLI_OUTPUT_SCHEMA_VERSION,
    status: CliOutputStatus.ERROR,
    output_mode: outputContext.outputMode,
    verbosity: outputContext.verbosity,
    command,
    message,
    error_code: standardizedError.code,
    hint: guidance.hint,
    next_action: guidance.nextAction,
    ...(errorDetails ? { error_details: errorDetails } : {}),
    runtime: {
      is_tty: outputContext.isTty,
      color_enabled: outputContext.colorEnabled,
      compact: outputContext.compact,
      downgraded_from: outputContext.downgradedFrom,
    },
  };
}

/**
 * Resolves hint and next action from standardized error code.
 * @param code Standardized error code.
 * @returns User/action guidance tuple.
 */
function resolveErrorGuidance(code: GovernorErrorCode): {
  hint: string;
  nextAction: CliNextAction;
} {
  if (code === GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID) {
    return {
      hint: 'Command name or option values are invalid.',
      nextAction: CliNextAction.CHECK_COMMAND_USAGE,
    };
  }

  if (code.startsWith('CONFIG_')) {
    return {
      hint: 'governor.yaml might be invalid or incompatible.',
      nextAction: CliNextAction.INSPECT_GOVERNOR_CONFIG,
    };
  }

  if (code.startsWith('I18N_')) {
    return {
      hint: 'Locale setup is invalid or unsupported by current runtime.',
      nextAction: CliNextAction.RETRY_WITH_VERBOSE,
    };
  }

  if (code.startsWith('ADAPTER_')) {
    return {
      hint: 'Adapter routing or capability verification failed.',
      nextAction: CliNextAction.INSPECT_GOVERNOR_CONFIG,
    };
  }

  if (
    code === GovernorErrorCode.POLICY_GATE_EVALUATION_FAILED ||
    code === GovernorErrorCode.POLICY_GATE_HITL_FEEDBACK_INVALID
  ) {
    return {
      hint: 'Policy gate did not allow this run; inspect report/replay diagnostics artifacts.',
      nextAction: CliNextAction.INSPECT_POLICY_DIAGNOSTICS,
    };
  }

  if (code === GovernorErrorCode.REPORT_REPLAY_INPUT_INVALID) {
    return {
      hint: 'Replay source path or payload is invalid for diagnostics replay.',
      nextAction: CliNextAction.CHECK_REPLAY_SOURCE,
    };
  }

  return {
    hint: 'Unexpected runtime failure occurred.',
    nextAction: CliNextAction.REPORT_ISSUE,
  };
}

/**
 * Selects stable CLI error details from standardized error diagnostics.
 * @param details Optional standardized error details payload.
 * @returns Whitelisted CLI error details, or null when no supported fields exist.
 */
function resolveCliErrorDetails(
  details: Record<string, unknown> | undefined,
): CliErrorOutputPayload['error_details'] | null {
  if (!details) {
    return null;
  }

  const normalizedDetails: CliErrorOutputPayload['error_details'] = {};
  if (typeof details.reportPath === 'string') {
    normalizedDetails.report_path = details.reportPath;
  }
  if (typeof details.replayPath === 'string') {
    normalizedDetails.replay_path = details.replayPath;
  }
  if (typeof details.pendingStatus === 'string') {
    normalizedDetails.pending_status = details.pendingStatus;
  }

  if (
    !normalizedDetails.report_path &&
    !normalizedDetails.replay_path &&
    !normalizedDetails.pending_status
  ) {
    return null;
  }

  return normalizedDetails;
}

/**
 * Resolves standardized error and exit code from any throw path.
 * @param error Unknown thrown value.
 * @returns Standardized failure resolution.
 */
function resolveCliFailure(error: unknown): CliFailureResolution {
  if (error instanceof CommanderError) {
    return {
      standardizedError: {
        code: GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID,
        message: error.message,
      },
      exitCode: error.exitCode,
    };
  }

  return {
    standardizedError: standardizeError(error),
    exitCode: 1,
  };
}

/**
 * Detects Commander help-display control flow emitted by `exitOverride`.
 * @param error Unknown thrown value.
 * @returns True when Commander intentionally interrupted parse after printing help.
 */
function isCommanderHelpDisplayed(error: unknown): boolean {
  if (!(error instanceof CommanderError)) {
    return false;
  }

  return error.code === 'commander.helpDisplayed';
}

/**
 * Resolves option value when present and syntactically valid.
 * @param args CLI args excluding node and binary.
 * @param flag Long option flag (for example `--locale`).
 * @returns Option value when present; otherwise undefined.
 */
function readOptionValue(args: string[], flag: string): string | undefined {
  return readOptionInput(args, flag).value;
}

/**
 * Resolves option presence and value across `--flag value` and `--flag=value`.
 * @param args CLI args excluding node and binary.
 * @param flag Long option flag.
 * @returns Parsed option presence and optional value.
 */
function readOptionInput(args: string[], flag: string): ReadOptionResult {
  const exactFlagIndex = args.indexOf(flag);
  if (exactFlagIndex >= 0) {
    const candidateValue = args[exactFlagIndex + 1];
    if (!candidateValue || candidateValue.startsWith('-')) {
      return { isPresent: true, value: undefined };
    }

    return { isPresent: true, value: candidateValue };
  }

  const pairArgument = args.find((item) => item.startsWith(`${flag}=`));
  if (!pairArgument) {
    return { isPresent: false, value: undefined };
  }

  const value = pairArgument.slice(flag.length + 1);
  return {
    isPresent: true,
    value: value.length > 0 ? value : undefined,
  };
}

function readRepeatedOptionValues(args: string[], flag: string): string[] {
  const values: string[] = [];

  for (let index = 0; index < args.length; index += 1) {
    const token = args[index];
    if (!token) {
      continue;
    }

    if (token === flag) {
      const nextValue = args[index + 1];
      if (!nextValue || nextValue.startsWith('-')) {
        throw new RuntimeError(
          GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID,
          `Option ${flag} requires one value.`,
          { option: flag },
        );
      }
      values.push(nextValue);
      index += 1;
      continue;
    }

    if (token.startsWith(`${flag}=`)) {
      const value = token.slice(flag.length + 1).trim();
      if (!value) {
        throw new RuntimeError(
          GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID,
          `Option ${flag} requires one value.`,
          { option: flag },
        );
      }
      values.push(value);
    }
  }

  return values;
}

/**
 * Resolves raw workspace-command option values from CLI args.
 * @param args CLI args excluding node and binary.
 * @returns Parsed workspace command options.
 */
function resolveWorkspaceCommandOptions(
  args: string[],
  themePreferencePath: string | null = null,
): CliWorkspaceCommandOptions {
  const topLevelSetUiThemeRequested =
    resolveRequestedCommandName(args) === CliWorkspaceAction.SET_UI_THEME;
  const explicitThemeScope = readOptionValue(args, '--theme-scope');
  const action =
    readOptionValue(args, '--workspace-action') ??
    resolveNestedSubcommandToken(args, CliCommandName.WORKSPACE) ??
    (topLevelSetUiThemeRequested ? CliWorkspaceAction.SET_UI_THEME : null);
  const actionValue =
    resolvePositionalTokenAfterCommand(args, CliCommandName.WORKSPACE, 1) ??
    (topLevelSetUiThemeRequested
      ? resolvePositionalTokenAfterToken(args, CliWorkspaceAction.SET_UI_THEME, 0)
      : null);
  return {
    action,
    actionValue,
    targetMode: readOptionValue(args, '--workspace-mode') ?? null,
    targetRoot: readOptionValue(args, '--workspace-root') ?? null,
    planPath:
      readOptionValue(args, '--workspace-plan') ??
      (action === CliWorkspaceAction.ROLLBACK ? actionValue : null),
    themeScope:
      explicitThemeScope ?? (topLevelSetUiThemeRequested ? CliWorkspaceThemeScope.GLOBAL : null),
    themePreferencePath,
  };
}

/**
 * Resolves raw workflow-command option values from CLI args.
 * @param args CLI args excluding node and binary.
 * @returns Parsed workflow command options.
 */
function resolveWorkflowCommandOptions(args: string[]): CliWorkflowCommandOptions {
  return {
    action: resolveNestedSubcommandToken(args, CliCommandName.WORKFLOW),
    templateId: readOptionValue(args, '--workflow-template') ?? null,
  };
}

/**
 * Checks whether one boolean flag appears in raw args.
 * @param args CLI args excluding node and binary.
 * @param flag Long option flag.
 * @returns True when flag is present.
 */
function hasFlag(args: string[], flag: string): boolean {
  return args.includes(flag);
}

/**
 * Detects whether raw argv contains only recognized top-level option tokens and no command token.
 * @param args CLI args excluding node and binary.
 * @returns True when the entrypoint should fall back to help instead of parsing a command.
 */
function hasOnlyKnownTopLevelOptions(args: string[]): boolean {
  if (args.length === 0) {
    return true;
  }

  for (let index = 0; index < args.length; index += 1) {
    const token = args[index];
    if (!token) {
      continue;
    }

    if (token === '--') {
      return false;
    }

    if (token.startsWith('--')) {
      const [flag] = token.split('=', 1);
      if (CLI_OPTIONS_REQUIRING_VALUE.has(flag)) {
        if (!token.includes('=')) {
          index += 1;
        }
        continue;
      }

      if (CLI_TOP_LEVEL_BOOLEAN_OPTIONS.has(flag)) {
        continue;
      }

      return false;
    }

    if (token.startsWith('-')) {
      if (CLI_TOP_LEVEL_BOOLEAN_OPTIONS.has(token)) {
        continue;
      }

      return false;
    }

    return false;
  }

  return true;
}

/**
 * Resolves requested command token from raw args for fallback error payloads.
 * @param args CLI args excluding node and binary.
 * @returns Requested command token, or `help` when no command token exists.
 */
function resolveRequestedCommandName(args: string[]): string {
  const positionalToken = resolveFirstPositionalToken(args);
  return positionalToken ?? 'help';
}

/**
 * Resolves the first positional token while skipping option values.
 * @param args CLI args excluding node and binary.
 * @returns First positional token or `null` when no command token exists.
 */
function resolveFirstPositionalToken(args: string[]): string | null {
  return resolvePositionalTokens(args)[0] ?? null;
}

/**
 * Resolves all positional tokens while skipping option values.
 * @param args CLI args excluding node and binary.
 * @returns Ordered positional token list.
 */
function resolvePositionalTokens(args: string[]): string[] {
  const positionalTokens: string[] = [];

  for (let index = 0; index < args.length; index += 1) {
    const token = args[index];
    if (!token) {
      continue;
    }

    if (token === '--') {
      if (args[index + 1]) {
        positionalTokens.push(args[index + 1] as string);
      }
      break;
    }

    if (token.startsWith('--')) {
      if (!token.includes('=') && CLI_OPTIONS_REQUIRING_VALUE.has(token)) {
        const nextToken = args[index + 1];
        if (nextToken && !nextToken.startsWith('-')) {
          index += 1;
        }
      }
      continue;
    }

    if (token.startsWith('-')) {
      continue;
    }

    positionalTokens.push(token);
  }

  return positionalTokens;
}

/**
 * Resolves one nested subcommand token beneath a top-level command name.
 * @param args CLI args excluding node and binary.
 * @param commandName Top-level command token.
 * @returns Nested subcommand token or `null`.
 */
function resolveNestedSubcommandToken(args: string[], commandName: CliCommandName): string | null {
  return resolvePositionalTokenAfterCommand(args, commandName, 0);
}

/**
 * Resolves one positional token after a top-level command while skipping option values.
 * @param args CLI args excluding node and binary.
 * @param commandName Top-level command token.
 * @param position Zero-based positional index after the command token.
 * @returns Positional token or `null`.
 */
function resolvePositionalTokenAfterCommand(
  args: string[],
  commandName: CliCommandName,
  position: number,
): string | null {
  return resolvePositionalTokenAfterToken(args, commandName, position);
}

/**
 * Resolves one positional token after a top-level token while skipping option values.
 * @param args CLI args excluding node and binary.
 * @param commandToken Top-level token.
 * @param position Zero-based positional index after the token.
 * @returns Positional token or `null`.
 */
function resolvePositionalTokenAfterToken(
  args: string[],
  commandToken: string,
  position: number,
): string | null {
  const commandIndex = args.indexOf(commandToken);
  if (commandIndex < 0) {
    return null;
  }

  let positionalIndex = 0;
  for (let index = commandIndex + 1; index < args.length; index += 1) {
    const token = args[index];
    if (!token) {
      continue;
    }

    if (token.startsWith('--')) {
      if (!token.includes('=') && CLI_OPTIONS_REQUIRING_VALUE.has(token)) {
        const nextToken = args[index + 1];
        if (nextToken && !nextToken.startsWith('-')) {
          index += 1;
        }
      }
      continue;
    }

    if (token.startsWith('-')) {
      continue;
    }

    if (positionalIndex === position) {
      return token;
    }

    positionalIndex += 1;
  }

  return null;
}

/**
 * Resolves terminal TTY state from runtime adapters with safe defaults.
 * @param io Runtime IO adapters.
 * @returns Whether stdout is a TTY terminal.
 */
function resolveIsStdoutTty(io: CliIoAdapters): boolean {
  if (!io.isStdoutTty) {
    return false;
  }

  return io.isStdoutTty();
}

/**
 * Resolves terminal stdin state from runtime adapters with safe defaults.
 * @param io Runtime IO adapters.
 * @returns Whether stdin is a TTY terminal.
 */
function resolveIsStdinTty(io: CliIoAdapters): boolean {
  if (!io.isStdinTty) {
    return false;
  }

  return io.isStdinTty();
}

/**
 * Resolves terminal stderr state from runtime adapters with safe defaults.
 * @param io Runtime IO adapters.
 * @returns Whether stderr is a TTY terminal.
 */
function resolveIsStderrTty(io: CliIoAdapters): boolean {
  if (!io.isStderrTty) {
    return false;
  }

  return io.isStderrTty();
}
