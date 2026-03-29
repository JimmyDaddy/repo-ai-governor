import { existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { stderr, stdin } from 'node:process';
import { createInterface } from 'node:readline/promises';

import {
  BaseError,
  DEFAULT_I18N_FALLBACK_LOCALE,
  DEFAULT_I18N_LOCALE,
  ErrorOutputEnvironment,
  GovernorErrorCode,
  WorkspaceMode,
} from '@repo-ai-governor/shared';
import type { Locale } from '@repo-ai-governor/shared';
import { CliCommandName } from '../constants/cli-command.constant.js';
import {
  CLI_INIT_REQUIRED_DIRECTORY_SEGMENTS,
  CLI_RUNTIME_OPERATION,
  CliGovernanceCheckStatus,
} from '../constants/cli-governance-runtime.constant.js';
import {
  CliInteractiveShellFallbackBehavior,
  CliInteractiveUiMode,
} from '../constants/cli-interactive-shell.constant.js';
import { DEFAULT_CLI_REACT_THEME_PRESET } from '../constants/cli-react-theme.constant.js';
import { CliInitReactShellRunner } from '../runtime/interactive-shell/init-react-shell-runner.js';
import type {
  CliCommandExecutorContext,
  CliCommandResultArtifact,
  CliCommandResultCheck,
  CliInitReactShellSelection,
} from '../types/index.js';
import type { CliCommandExecutor } from './cli-command-executor.interface.js';

/**
 * Owns `init` command execution outside the runtime facade.
 */
export class CliInitCommand implements CliCommandExecutor {
  public readonly commandName = CliCommandName.INIT;

  public constructor(
    private readonly reactShellRunner: CliInitReactShellRunner = new CliInitReactShellRunner(),
  ) {}

  public async execute(context: CliCommandExecutorContext) {
    const checks: CliCommandResultCheck[] = [];
    const artifacts: CliCommandResultArtifact[] = [];
    const ensuredDirectoryPaths: string[] = [];
    const createdDirectoryPaths: string[] = [];

    for (const segments of CLI_INIT_REQUIRED_DIRECTORY_SEGMENTS) {
      const directoryPath = resolve(context.options.workspace.workspaceRoot, ...segments);
      const directoryExisted = existsSync(directoryPath);
      await mkdir(directoryPath, { recursive: true });
      ensuredDirectoryPaths.push(directoryPath);
      if (!directoryExisted) {
        createdDirectoryPaths.push(directoryPath);
      }
    }

    checks.push({
      id: 'workspace_directories',
      status: CliGovernanceCheckStatus.PASS,
      detail: `ensured=${ensuredDirectoryPaths.length} created=${createdDirectoryPaths.length}`,
    });

    const configPath = context.options.workspace.configPath;
    const configCreated = !existsSync(configPath);
    let configContent = context.buildDefaultConfigContent();
    const runtimeDebugOptions = context.resolveRuntimeDebugOptions();
    const interactiveContractAllowed =
      runtimeDebugOptions.interactive &&
      context.options.isTty &&
      runtimeDebugOptions.inputTty &&
      runtimeDebugOptions.stderrTty &&
      context.options.outputMode === ErrorOutputEnvironment.PRETTY;
    let interactiveSelection: CliInitReactShellSelection | null = null;
    let resolvedUiMode = this.resolveInitUiMode(
      runtimeDebugOptions,
      configCreated,
      interactiveContractAllowed,
    );
    let uiFallbackBehavior = runtimeDebugOptions.uiFallbackBehavior;

    if (configCreated && interactiveContractAllowed) {
      if (resolvedUiMode === CliInteractiveUiMode.REACT) {
        try {
          interactiveSelection = await this.reactShellRunner.run({
            locale: context.options.locale as Locale,
            outputMode: context.options.outputMode,
            uiTheme: runtimeDebugOptions.uiTheme ?? DEFAULT_CLI_REACT_THEME_PRESET,
            translate: (key, interpolation) => context.translate?.(key, interpolation) ?? key,
          });
          checks.push({
            id: 'interactive_shell',
            status: CliGovernanceCheckStatus.PASS,
            detail: `ui_mode=react theme=${runtimeDebugOptions.uiTheme ?? DEFAULT_CLI_REACT_THEME_PRESET} fallback=${uiFallbackBehavior ?? 'none'}`,
          });
        } catch (error) {
          if (
            error instanceof BaseError &&
            error.code === GovernorErrorCode.PROCESS_RUNTIME_CANCELLED
          ) {
            throw error;
          }

          resolvedUiMode = CliInteractiveUiMode.CLASSIC;
          uiFallbackBehavior = CliInteractiveShellFallbackBehavior.SHELL_INIT_FAILED;
          stderr.write(
            `${this.translate(
              context,
              'cli.commandMessages.init.reactShellFallbackToClassic',
              'React shell initialization failed; falling back to classic bootstrap. reason={{reason}}.',
              {
                reason: context.formatExecFailureDetail(error),
              },
            )}\n`,
          );
          checks.push({
            id: 'interactive_shell',
            status: CliGovernanceCheckStatus.WARN,
            detail: `requested=react resolved=classic fallback=${uiFallbackBehavior}`,
          });
          interactiveSelection = await this.collectInteractiveBootstrapSelection(context);
        }
      } else if (resolvedUiMode === CliInteractiveUiMode.CLASSIC) {
        interactiveSelection = await this.collectInteractiveBootstrapSelection(context);
        checks.push({
          id: 'interactive_shell',
          status: CliGovernanceCheckStatus.PASS,
          detail: `ui_mode=classic theme=${runtimeDebugOptions.uiTheme ?? DEFAULT_CLI_REACT_THEME_PRESET} fallback=${uiFallbackBehavior ?? 'none'}`,
        });
      }
    }

    if (interactiveSelection) {
      configContent = this.applyInteractiveBootstrapSelection(configContent, interactiveSelection);
      checks.push({
        id: 'interactive_bootstrap',
        status: CliGovernanceCheckStatus.PASS,
        detail: `ui_mode=${resolvedUiMode} workspace_mode=${interactiveSelection.workspaceMode} default_locale=${interactiveSelection.defaultLocale}`,
      });
    }

    if (configCreated) {
      await context.artifactWriter.writeTextArtifact(configPath, configContent);
    }

    checks.push({
      id: 'workspace_config',
      status: CliGovernanceCheckStatus.PASS,
      detail: configCreated ? `created=${configPath}` : `reused=${configPath}`,
    });
    artifacts.push({
      id: 'workspace_config',
      path: configPath,
    });

    const initManifestPath = resolve(
      context.options.workspace.workspaceRoot,
      'context',
      'bootstrap',
      'init-manifest.json',
    );
    const effectiveWorkspaceMode =
      interactiveSelection?.workspaceMode ?? context.options.workspace.mode;
    await context.artifactWriter.writeJsonArtifact(initManifestPath, {
      initializedAt: context.toRfc3339SecondsTimestamp(new Date()),
      workspaceId: context.options.workspace.workspaceId,
      workspaceRoot: context.options.workspace.workspaceRoot,
      workspaceMode: effectiveWorkspaceMode,
      configPath,
      configSource: context.options.configSource,
      profileId: context.options.profileId,
      locale: context.options.locale,
      memoryStoreEngine: context.options.memoryConfig.storeEngine,
      memoryStoreRoot: context.options.memoryStoreRoot,
    });
    artifacts.push({
      id: 'init_manifest',
      path: initManifestPath,
    });

    const message = `Initialized workspace at ${context.options.workspace.workspaceRoot}; config ${configCreated ? 'created' : 'reused'}.`;
    return {
      message,
      commandResult: {
        operation: CLI_RUNTIME_OPERATION.WORKSPACE_INIT,
        summary: message,
        check_totals: context.calculateCheckTotals(checks),
        checks,
        artifacts,
        details: {
          workspace_mode: effectiveWorkspaceMode,
          workspace_mode_source: interactiveSelection
            ? 'interactive_bootstrap'
            : context.options.workspace.modeSource,
          ui_mode: resolvedUiMode,
          ui_theme: runtimeDebugOptions.uiTheme ?? DEFAULT_CLI_REACT_THEME_PRESET,
          ui_fallback_behavior: uiFallbackBehavior,
        },
      },
    };
  }

  /**
   * Prompts first-time users with a minimal interactive setup and collects key defaults.
   * @param context Command execution context.
   * @returns User-selected workspace and locale defaults.
   */
  private async collectInteractiveBootstrapSelection(
    context: CliCommandExecutorContext,
  ): Promise<CliInitReactShellSelection> {
    const interactiveConsole = createInterface({
      input: stdin,
      output: stderr,
    });

    try {
      const workspaceModeAnswer = (
        await interactiveConsole.question(
          this.translate(
            context,
            'cli.commandMessages.init.selectWorkspaceMode',
            'Select workspace mode [1=tool_managed, 2=repo_local] (default: 1): ',
          ),
        )
      )
        .trim()
        .toLowerCase();

      const workspaceMode =
        workspaceModeAnswer === '2' || workspaceModeAnswer === WorkspaceMode.REPO_LOCAL
          ? WorkspaceMode.REPO_LOCAL
          : WorkspaceMode.TOOL_MANAGED;

      const localeAnswer = (
        await interactiveConsole.question(
          this.translate(
            context,
            'cli.commandMessages.init.selectDefaultLocale',
            'Select default locale [1=zh-CN, 2=en-US] (default: 1): ',
          ),
        )
      )
        .trim()
        .toLowerCase();

      const defaultLocale =
        localeAnswer === '2' || localeAnswer === DEFAULT_I18N_FALLBACK_LOCALE.toLowerCase()
          ? DEFAULT_I18N_FALLBACK_LOCALE
          : DEFAULT_I18N_LOCALE;
      const fallbackLocale =
        defaultLocale === DEFAULT_I18N_LOCALE ? DEFAULT_I18N_FALLBACK_LOCALE : DEFAULT_I18N_LOCALE;

      stderr.write(
        this.translate(
          context,
          'cli.commandMessages.init.interactiveApplied',
          '\nInteractive setup applied: workspace={{workspaceMode}}, defaultLocale={{defaultLocale}}.\n',
          {
            workspaceMode,
            defaultLocale,
          },
        ),
      );

      return {
        workspaceMode,
        defaultLocale,
        fallbackLocale,
      };
    } finally {
      interactiveConsole.close();
    }
  }

  /**
   * Applies interactive selection values onto the generated default yaml template.
   * @param configContent Current default config yaml content.
   * @param selection Interactive selection payload.
   * @returns Updated config yaml content.
   */
  private applyInteractiveBootstrapSelection(
    configContent: string,
    selection: CliInitReactShellSelection,
  ): string {
    return configContent
      .replace(/^ {2}mode:\s.+$/mu, `  mode: ${selection.workspaceMode}`)
      .replace(/^ {2}defaultLocale:\s.+$/mu, `  defaultLocale: ${selection.defaultLocale}`)
      .replace(/^ {2}fallbackLocale:\s.+$/mu, `  fallbackLocale: ${selection.fallbackLocale}`);
  }
  /**
   * Resolves the effective UI mode for first-time init bootstrapping.
   * @param runtimeDebugOptions Parsed runtime debug flags.
   * @param configCreated Whether the workspace config file is newly created.
   * @param interactiveContractAllowed Whether tty/output constraints allow interactive bootstrapping.
   * @returns Effective UI mode for init execution.
   */
  private resolveInitUiMode(
    runtimeDebugOptions: ReturnType<CliCommandExecutorContext['resolveRuntimeDebugOptions']>,
    configCreated: boolean,
    interactiveContractAllowed: boolean,
  ): CliInteractiveUiMode {
    if (
      configCreated &&
      interactiveContractAllowed &&
      runtimeDebugOptions.requestedUiMode === null &&
      runtimeDebugOptions.uiMode === CliInteractiveUiMode.CLASSIC
    ) {
      return CliInteractiveUiMode.REACT;
    }

    return runtimeDebugOptions.uiMode;
  }

  /**
   * Resolves one localized init string through i18n runtime with a stable fallback.
   * @param context Command execution context.
   * @param key Translation key.
   * @param fallback Fallback copy used when runtime translation is unavailable.
   * @param interpolation Optional translation variables.
   * @returns Localized string.
   */
  private translate(
    context: Pick<CliCommandExecutorContext, 'translate'>,
    key: string,
    fallback: string,
    interpolation?: Record<string, string>,
  ): string {
    return context.translate?.(key, interpolation) ?? fallback;
  }
}
