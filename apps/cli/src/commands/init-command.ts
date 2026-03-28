import { existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { stderr, stdin } from 'node:process';
import { createInterface } from 'node:readline/promises';

import {
  DEFAULT_I18N_FALLBACK_LOCALE,
  DEFAULT_I18N_LOCALE,
  ErrorOutputEnvironment,
  WorkspaceMode,
} from '@repo-ai-governor/shared';
import type { Locale } from '@repo-ai-governor/shared';
import { CliCommandName } from '../constants/cli-command.constant.js';
import {
  CLI_INIT_REQUIRED_DIRECTORY_SEGMENTS,
  CLI_RUNTIME_OPERATION,
  CliGovernanceCheckStatus,
} from '../constants/cli-governance-runtime.constant.js';
import type {
  CliCommandExecutorContext,
  CliCommandResultArtifact,
  CliCommandResultCheck,
} from '../types/index.js';
import type { CliCommandExecutor } from './cli-command-executor.interface.js';

interface CliInteractiveBootstrapSelection {
  workspaceMode: WorkspaceMode;
  defaultLocale: Locale;
  fallbackLocale: Locale;
}

/**
 * Owns `init` command execution outside the runtime facade.
 */
export class CliInitCommand implements CliCommandExecutor {
  public readonly commandName = CliCommandName.INIT;

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
    const interactiveRequested =
      context.options.runtimeDebugOptions?.interactive === true &&
      context.options.isTty &&
      stdin.isTTY === true &&
      context.options.outputMode === ErrorOutputEnvironment.PRETTY;
    if (configCreated && interactiveRequested) {
      const interactiveSelection = await this.collectInteractiveBootstrapSelection(context);
      configContent = this.applyInteractiveBootstrapSelection(configContent, interactiveSelection);
      checks.push({
        id: 'interactive_bootstrap',
        status: CliGovernanceCheckStatus.PASS,
        detail: `workspace_mode=${interactiveSelection.workspaceMode} default_locale=${interactiveSelection.defaultLocale}`,
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
    await context.artifactWriter.writeJsonArtifact(initManifestPath, {
      initializedAt: context.toRfc3339SecondsTimestamp(new Date()),
      workspaceId: context.options.workspace.workspaceId,
      workspaceRoot: context.options.workspace.workspaceRoot,
      workspaceMode: context.options.workspace.mode,
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
          workspace_mode: context.options.workspace.mode,
          workspace_mode_source: context.options.workspace.modeSource,
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
  ): Promise<CliInteractiveBootstrapSelection> {
    const interactiveConsole = createInterface({
      input: stdin,
      output: stderr,
    });

    try {
      const workspaceModeAnswer = (
        await interactiveConsole.question(
          context.localizeText(
            'Select workspace mode [1=tool_managed, 2=repo_local] (default: 1): ',
            '选择工作区模式 [1=tool_managed, 2=repo_local]（默认 1）: ',
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
          context.localizeText(
            'Select default locale [1=zh-CN, 2=en-US] (default: 1): ',
            '选择默认语言 [1=zh-CN, 2=en-US]（默认 1）: ',
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
        context.localizeText(
          `\nInteractive setup applied: workspace=${workspaceMode}, defaultLocale=${defaultLocale}.\n`,
          `\n已应用向导配置：workspace=${workspaceMode}，defaultLocale=${defaultLocale}。\n`,
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
    selection: CliInteractiveBootstrapSelection,
  ): string {
    return configContent
      .replace(/^ {2}mode:\s.+$/mu, `  mode: ${selection.workspaceMode}`)
      .replace(/^ {2}defaultLocale:\s.+$/mu, `  defaultLocale: ${selection.defaultLocale}`)
      .replace(/^ {2}fallbackLocale:\s.+$/mu, `  fallbackLocale: ${selection.fallbackLocale}`);
  }
}
