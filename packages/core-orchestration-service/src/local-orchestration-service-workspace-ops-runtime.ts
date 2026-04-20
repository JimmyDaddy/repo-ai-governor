import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import {
  ConfigLoader,
  WorkspaceConfigDiscoveryService,
  WorkspaceResolver,
} from '@repo-ai-governor/config';
import type {
  OrchestrationBootstrapReadinessSnapshot,
  OrchestrationSecretBackendStatus,
  OrchestrationSecretReadinessSnapshot,
  OrchestrationSecretRecord,
  OrchestrationSecureAuthoringQueryRequest,
  OrchestrationSecureAuthoringSnapshot,
  OrchestrationSetManagedSecretRequest,
  OrchestrationSetManagedSecretResponse,
  OrchestrationSetUserConfigValueRequest,
  OrchestrationSetUserConfigValueResponse,
  OrchestrationUserConfigEntry,
  OrchestrationUserConfigStatus,
  OrchestrationWorkspaceOperationLayeredLogs,
  OrchestrationWorkspaceOperationRequest,
  OrchestrationWorkspaceOperationResponse,
  OrchestrationWorkspaceOperationSnapshot,
} from '@repo-ai-governor/orchestration-service-client';
import {
  OrchestrationBootstrapReadinessActionId,
  OrchestrationWorkspaceOperationKind,
} from '@repo-ai-governor/orchestration-service-client';
import { GovernorErrorCode, RuntimeError, standardizeError } from '@repo-ai-governor/shared';

const EMBEDDED_CLI_PACKAGE_SPECIFIER = '@repo-ai-governor/cli';
const EMBEDDED_CLI_ARGV_ENVIRONMENT_KEY = 'REPO_AI_GOVERNOR_EMBEDDED_CLI_ARGV';
const DEFAULT_USER_CONFIG_ENTRY_DELIMITER = ' | ';
const DEFAULT_SECRET_RECORD_DELIMITER = ' | ';
const CREDENTIAL_SELECTOR_PREFIX = 'secret://';
const UNSAFE_LOCAL_FILE_SECRET_BACKEND_ID = 'unsafe-local-file';
const UPGRADE_REPORT_FILE_PATTERN = /^upgrade-(\d+)\.report\.json$/u;
const LATEST_WORKSPACE_OPERATION_SNAPSHOT_FILE_NAME = 'latest-workspace-operation.snapshot.json';
// Service-owned workspace ops must stay machine-readable so embedded CLI execution can be parsed.
const WORKSPACE_DOCTOR_ARGS = ['doctor', '--adapters'] as const;
const requireFromRuntime = createRequire(import.meta.url);

interface CliCommandResultCheckPayload {
  id?: string;
  status?: string;
  detail?: string;
}

interface CliCommandResultArtifactPayload {
  id?: string;
  path?: string;
}

interface CliInteractionPromptPayload {
  title?: string;
  action?: string;
  blocking?: boolean;
}

interface CliLayeredLogsPayload {
  summary?: string[];
  detailed?: string[];
}

interface CliSuccessOutputPayload {
  message?: string;
  command_result?: {
    operation?: string;
    summary?: string;
    check_totals?: {
      pass?: number;
      warn?: number;
      fail?: number;
    };
    checks?: CliCommandResultCheckPayload[];
    artifacts?: CliCommandResultArtifactPayload[];
    experience?: {
      interactionPrompts?: CliInteractionPromptPayload[];
      layeredLogs?: CliLayeredLogsPayload;
    };
    details?: Record<string, boolean | number | string | null>;
  };
}

interface WorkspaceOpsContext {
  repositoryRoot: string;
  workspaceId: string;
  workspaceRoot: string;
  configPath: string;
  workspaceMode: string;
  workspaceModeSource: string;
}

interface LocalOrchestrationServiceWorkspaceOpsRuntimeDependencies {
  workspaceRoot: string;
  repositoryRoot?: string;
  configLoader?: Pick<ConfigLoader, 'loadFromFile'>;
  workspaceResolver?: Pick<WorkspaceResolver, 'resolve'>;
  pathExists?: (path: string) => boolean;
  cliExecutor?: (request: {
    args: readonly string[];
    currentWorkingDirectory: string;
    stdin?: string;
    locale?: string;
  }) => Promise<CliSuccessOutputPayload>;
  nowProvider?: () => Date;
}

/**
 * Owns service-backed workspace operations so IDE clients no longer have to shell out locally.
 *
 * Why this exists:
 * project-114 moves bootstrap/readiness and zero-manual-CLI workspace operations behind the local
 * orchestration service seam while keeping CLI compatibility and one shared artifact truth.
 */
export class LocalOrchestrationServiceWorkspaceOpsRuntime {
  private readonly configLoader: Pick<ConfigLoader, 'loadFromFile'>;
  private readonly workspaceResolver: Pick<WorkspaceResolver, 'resolve'>;
  private readonly pathExists: (path: string) => boolean;
  private readonly workspaceConfigDiscovery: Pick<
    WorkspaceConfigDiscoveryService,
    'loadRepositoryWorkspaceConfig'
  >;
  private readonly cliExecutor: (request: {
    args: readonly string[];
    currentWorkingDirectory: string;
    stdin?: string;
    locale?: string;
  }) => Promise<CliSuccessOutputPayload>;
  private readonly nowProvider: () => Date;
  private latestWorkspaceOperationSnapshot?: OrchestrationWorkspaceOperationSnapshot;
  private latestWorkspaceOperationSnapshotLoaded = false;

  public constructor(
    private readonly dependencies: LocalOrchestrationServiceWorkspaceOpsRuntimeDependencies,
  ) {
    this.configLoader = dependencies.configLoader ?? new ConfigLoader();
    this.workspaceResolver = dependencies.workspaceResolver ?? new WorkspaceResolver();
    this.pathExists = dependencies.pathExists ?? existsSync;
    this.workspaceConfigDiscovery = new WorkspaceConfigDiscoveryService(
      this.configLoader,
      this.workspaceResolver,
      this.pathExists,
    );
    this.cliExecutor = dependencies.cliExecutor ?? this.executeCliJsonCommand.bind(this);
    this.nowProvider = dependencies.nowProvider ?? (() => new Date());
  }

  public async queryBootstrapReadiness(): Promise<OrchestrationBootstrapReadinessSnapshot> {
    const context = this.resolveWorkspaceContext();
    const recommendedActions =
      context.configPath && !this.pathExists(context.configPath)
        ? [OrchestrationBootstrapReadinessActionId.RUN_WORKSPACE_BOOTSTRAP]
        : [OrchestrationBootstrapReadinessActionId.REFRESH_WORKSPACE_STATE];

    return {
      workspaceId: context.workspaceId,
      repositoryRoot: context.repositoryRoot,
      workspaceRoot: context.workspaceRoot,
      configPath: context.configPath,
      configExists: this.pathExists(context.configPath),
      workspaceMode: context.workspaceMode,
      workspaceModeSource: context.workspaceModeSource,
      recommendedActions,
    };
  }

  public async querySecureAuthoring(
    request?: OrchestrationSecureAuthoringQueryRequest,
  ): Promise<OrchestrationSecureAuthoringSnapshot> {
    const context = this.resolveWorkspaceContext();

    try {
      const [configStatusPayload, configListPayload, secretStatusPayload, secretListPayload] =
        await Promise.all([
          this.cliExecutor({
            args: ['config', 'status'],
            currentWorkingDirectory: context.repositoryRoot,
            locale: request?.locale,
          }),
          this.cliExecutor({
            args: ['config', 'list'],
            currentWorkingDirectory: context.repositoryRoot,
            locale: request?.locale,
          }),
          this.cliExecutor({
            args: ['secret', 'status'],
            currentWorkingDirectory: context.repositoryRoot,
            locale: request?.locale,
          }),
          this.cliExecutor({
            args: ['secret', 'list'],
            currentWorkingDirectory: context.repositoryRoot,
            locale: request?.locale,
          }),
        ]);

      const userConfig = this.parseUserConfigStatusSnapshot(
        configStatusPayload,
        configListPayload,
        request?.locale,
      );
      const secretReadiness = this.parseSecretReadinessSnapshot(
        secretStatusPayload,
        secretListPayload,
        userConfig.entries,
        request?.locale,
      );

      return {
        userConfig,
        secretReadiness,
      };
    } catch (error) {
      return {
        degradedReason: standardizeError(error).message,
      };
    }
  }

  public async setUserConfigValue(
    request: OrchestrationSetUserConfigValueRequest,
  ): Promise<OrchestrationSetUserConfigValueResponse> {
    const context = this.resolveWorkspaceContext();
    const payload = await this.cliExecutor({
      args: ['config', 'set', request.keyPath, request.value],
      currentWorkingDirectory: context.repositoryRoot,
      locale: request.locale,
    });

    return {
      message: this.readPayloadMessage(payload, request.locale),
      configPath: this.readDetailString(payload, 'config_path'),
      persistedValue: this.readDetailString(payload, 'value'),
    };
  }

  public async setManagedSecret(
    request: OrchestrationSetManagedSecretRequest,
  ): Promise<OrchestrationSetManagedSecretResponse> {
    const context = this.resolveWorkspaceContext();
    const payload = await this.cliExecutor({
      args: [
        'secret',
        'set',
        request.keyName,
        ...(request.backendId ? ['--backend', request.backendId] : []),
        '--stdin',
      ],
      currentWorkingDirectory: context.repositoryRoot,
      stdin: request.value,
      locale: request.locale,
    });

    return {
      message: this.readPayloadMessage(payload, request.locale),
      selector: this.readDetailString(payload, 'selector'),
      backendId: this.readDetailString(payload, 'backend'),
      warning: this.readDetailString(payload, 'warning'),
    };
  }

  public async runWorkspaceOperation(
    request: OrchestrationWorkspaceOperationRequest,
  ): Promise<OrchestrationWorkspaceOperationResponse> {
    const context = this.resolveWorkspaceContext();
    const response =
      request.operationKind === OrchestrationWorkspaceOperationKind.CONNECT
        ? await this.runConnectWorkspaceOperation(request, context)
        : this.buildWorkspaceOperationResponse(
            request,
            await this.cliExecutor({
              args: this.buildOperationArgs(request, context),
              currentWorkingDirectory: context.repositoryRoot,
              locale: request.locale,
            }),
          );

    this.latestWorkspaceOperationSnapshot = {
      operationKind: request.operationKind,
      completedAt: this.nowProvider().toISOString(),
      ...(request.locale?.trim().length
        ? {
            locale: this.normalizeLocale(request.locale),
          }
        : {}),
      message: response.message,
      result: this.cloneWorkspaceOperationResult(response.result),
    };
    this.latestWorkspaceOperationSnapshotLoaded = true;
    this.persistLatestWorkspaceOperationSnapshot(context, this.latestWorkspaceOperationSnapshot);

    return response;
  }

  private async runConnectWorkspaceOperation(
    request: OrchestrationWorkspaceOperationRequest,
    context: WorkspaceOpsContext,
  ): Promise<OrchestrationWorkspaceOperationResponse> {
    const generatePayload = await this.cliExecutor({
      args: this.buildConnectGenerateArgs(request),
      currentWorkingDirectory: context.repositoryRoot,
      locale: request.locale,
    });
    const applyPayload = await this.cliExecutor({
      args: this.buildConnectApplyArgs(request),
      currentWorkingDirectory: context.repositoryRoot,
      locale: request.locale,
    });
    const response = this.buildWorkspaceOperationResponse(request, applyPayload);
    const combinedArtifacts = this.mergeArtifacts(
      this.readArtifactsFromPayload(generatePayload),
      response.result.artifacts,
    );
    if (combinedArtifacts.length > 0) {
      response.result.artifacts = combinedArtifacts;
    }
    return response;
  }

  private buildWorkspaceOperationResponse(
    request: OrchestrationWorkspaceOperationRequest,
    payload: CliSuccessOutputPayload,
  ): OrchestrationWorkspaceOperationResponse {
    const layeredLogs = this.parseLayeredLogs(payload.command_result?.experience?.layeredLogs);
    const artifacts = this.readArtifactsFromPayload(payload);

    return {
      message: this.readPayloadMessage(payload, request.locale),
      result: {
        operation: payload.command_result?.operation ?? request.operationKind,
        summary: payload.command_result?.summary?.trim().length
          ? payload.command_result.summary
          : this.readPayloadMessage(payload, request.locale),
        ...(payload.command_result?.check_totals
          ? {
              checkTotals: {
                pass: payload.command_result.check_totals.pass ?? 0,
                warn: payload.command_result.check_totals.warn ?? 0,
                fail: payload.command_result.check_totals.fail ?? 0,
              },
            }
          : {}),
        ...(payload.command_result?.checks
          ? {
              checks: payload.command_result.checks
                .filter((check) => typeof check.id === 'string')
                .map((check) => ({
                  id: check.id ?? 'unknown',
                  status: check.status ?? 'unknown',
                  detail: check.detail ?? '',
                })),
            }
          : {}),
        ...(artifacts.length > 0
          ? {
              artifacts,
            }
          : {}),
        ...(payload.command_result?.experience?.interactionPrompts
          ? {
              interactionPrompts: payload.command_result.experience.interactionPrompts
                .filter(
                  (prompt) => typeof prompt.title === 'string' && typeof prompt.action === 'string',
                )
                .map((prompt) => ({
                  title: prompt.title ?? '',
                  action: prompt.action ?? '',
                  blocking: prompt.blocking === true,
                })),
            }
          : {}),
        ...(layeredLogs
          ? {
              layeredLogs,
            }
          : {}),
        ...(payload.command_result?.details
          ? {
              details: payload.command_result.details,
            }
          : {}),
      },
    };
  }

  private readArtifactsFromPayload(
    payload: CliSuccessOutputPayload,
  ): NonNullable<OrchestrationWorkspaceOperationResponse['result']['artifacts']> {
    return (
      payload.command_result?.artifacts
        ?.filter((artifact) => typeof artifact.id === 'string' && typeof artifact.path === 'string')
        .map((artifact) => ({
          id: artifact.id ?? 'artifact',
          path: artifact.path ?? '',
        })) ?? []
    );
  }

  private mergeArtifacts(
    firstArtifacts: OrchestrationWorkspaceOperationResponse['result']['artifacts'],
    secondArtifacts: OrchestrationWorkspaceOperationResponse['result']['artifacts'],
  ): NonNullable<OrchestrationWorkspaceOperationResponse['result']['artifacts']> {
    const mergedArtifacts = [...(firstArtifacts ?? []), ...(secondArtifacts ?? [])];
    const seenArtifactKeys = new Set<string>();
    return mergedArtifacts.filter((artifact) => {
      const artifactKey = `${artifact.id}:${artifact.path}`;
      if (seenArtifactKeys.has(artifactKey)) {
        return false;
      }

      seenArtifactKeys.add(artifactKey);
      return true;
    });
  }

  /**
   * Returns the latest service-owned workspace operation snapshot for overview consumers.
   * @returns Cloned latest operation snapshot when at least one workspace operation completed.
   */
  public getLatestWorkspaceOperationSnapshot():
    | OrchestrationWorkspaceOperationSnapshot
    | undefined {
    if (!this.latestWorkspaceOperationSnapshotLoaded) {
      this.latestWorkspaceOperationSnapshotLoaded = true;
      try {
        this.latestWorkspaceOperationSnapshot = this.loadPersistedLatestWorkspaceOperationSnapshot(
          this.resolveWorkspaceContext(),
        );
      } catch {
        this.latestWorkspaceOperationSnapshot = undefined;
      }
    }

    if (!this.latestWorkspaceOperationSnapshot) {
      return undefined;
    }

    return {
      operationKind: this.latestWorkspaceOperationSnapshot.operationKind,
      completedAt: this.latestWorkspaceOperationSnapshot.completedAt,
      ...(this.latestWorkspaceOperationSnapshot.locale
        ? {
            locale: this.latestWorkspaceOperationSnapshot.locale,
          }
        : {}),
      message: this.latestWorkspaceOperationSnapshot.message,
      result: this.cloneWorkspaceOperationResult(this.latestWorkspaceOperationSnapshot.result),
    };
  }

  private resolveWorkspaceContext(): WorkspaceOpsContext {
    const currentWorkingDirectory =
      this.dependencies.repositoryRoot ?? this.dependencies.workspaceRoot;
    const explicitWorkspaceRootOverride = this.dependencies.workspaceRoot.trim().length
      ? this.dependencies.workspaceRoot
      : undefined;
    const runtimeWorkspaceOverrides = explicitWorkspaceRootOverride
      ? {
          runtimeOverrides: {
            workspaceRoot: explicitWorkspaceRootOverride,
          },
        }
      : {};
    const baselineWorkspace = this.workspaceResolver.resolve({
      currentWorkingDirectory,
      ...(this.dependencies.repositoryRoot
        ? {
            repositoryRootOverride: this.dependencies.repositoryRoot,
          }
        : {}),
      ...runtimeWorkspaceOverrides,
    });
    const repositoryWorkspaceConfig = this.workspaceConfigDiscovery.loadRepositoryWorkspaceConfig(
      baselineWorkspace.repositoryRoot,
    );
    const resolvedWorkspace = this.workspaceResolver.resolve({
      currentWorkingDirectory,
      repositoryRootOverride: baselineWorkspace.repositoryRoot,
      ...(repositoryWorkspaceConfig
        ? {
            config: repositoryWorkspaceConfig,
          }
        : {}),
      ...runtimeWorkspaceOverrides,
    });

    return {
      repositoryRoot: resolvedWorkspace.repositoryRoot,
      workspaceId: resolvedWorkspace.workspaceId,
      workspaceRoot: resolvedWorkspace.workspaceRoot,
      configPath: resolvedWorkspace.configPath,
      workspaceMode: resolvedWorkspace.mode,
      workspaceModeSource: resolvedWorkspace.modeSource,
    };
  }

  private buildOperationArgs(
    request: OrchestrationWorkspaceOperationRequest,
    context: WorkspaceOpsContext,
  ): string[] {
    const args = request.arguments ?? {};
    const readString = (key: string): string | undefined => {
      const value = args[key];
      return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
    };
    const readStringArray = (key: string): string[] | undefined => {
      const value = args[key];
      if (Array.isArray(value)) {
        return value.filter(
          (entry): entry is string => typeof entry === 'string' && entry.trim().length > 0,
        );
      }
      if (typeof value === 'string' && value.trim().length > 0) {
        return value
          .split(',')
          .map((entry) => entry.trim())
          .filter((entry) => entry.length > 0);
      }
      return undefined;
    };

    switch (request.operationKind) {
      case OrchestrationWorkspaceOperationKind.WORKSPACE_BOOTSTRAP:
        return ['init'];
      case OrchestrationWorkspaceOperationKind.CONNECT:
        return this.buildConnectGenerateArgs(request);
      case OrchestrationWorkspaceOperationKind.DOCTOR:
        return [...WORKSPACE_DOCTOR_ARGS];
      case OrchestrationWorkspaceOperationKind.CHECK:
        return ['check'];
      case OrchestrationWorkspaceOperationKind.ADOPT_BOOTSTRAP:
        return [
          'adopt',
          'bootstrap',
          readString('packSelector') ?? 'adopter-complete',
          '--repo',
          context.repositoryRoot,
          '--hosts',
          (readStringArray('hosts') ?? ['codex', 'claude-code']).join(','),
          ...(readString('adoptionProfileId')
            ? ['--adoption-profile', readString('adoptionProfileId') ?? '']
            : []),
        ];
      case OrchestrationWorkspaceOperationKind.ADOPTION_APPLY:
        return [
          'adopt',
          'apply',
          readString('packSelector') ?? 'adopter-complete',
          '--repo',
          context.repositoryRoot,
          '--hosts',
          (readStringArray('hosts') ?? ['codex', 'claude-code', 'github-copilot']).join(','),
          ...(readString('adoptionProfileId')
            ? ['--adoption-profile', readString('adoptionProfileId') ?? '']
            : []),
        ];
      case OrchestrationWorkspaceOperationKind.HOST_EXPORT: {
        const host = readString('host') ?? 'codex';
        const mode = readString('mode') ?? 'project-local';
        return [
          'host',
          'export',
          '--host',
          host,
          '--mode',
          mode,
          '--output-dir',
          readString('outputDir') ?? resolve(context.workspaceRoot, 'generated', 'hosts', host),
        ];
      }
      case OrchestrationWorkspaceOperationKind.HOST_VERIFY:
        return [
          'host',
          'verify',
          '--output-dir',
          readString('outputDir') ??
            resolve(context.workspaceRoot, 'generated', 'hosts', 'github-copilot'),
        ];
      case OrchestrationWorkspaceOperationKind.HOST_PACK: {
        const host = readString('host') ?? 'claude-code';
        const defaultBundleDirectory =
          host === 'claude-code'
            ? resolve(context.workspaceRoot, 'generated', 'bundles', 'claude')
            : resolve(context.workspaceRoot, 'generated', 'bundles', host);
        return [
          'host',
          'pack',
          '--host',
          host,
          '--mode',
          readString('mode') ?? 'plugin-bundle',
          '--bundle-dir',
          readString('bundleDir') ?? defaultBundleDirectory,
        ];
      }
      case OrchestrationWorkspaceOperationKind.UPGRADE_PREVIEW:
        return ['upgrade'];
      case OrchestrationWorkspaceOperationKind.UPGRADE_APPLY: {
        const reportPath =
          readString('reportPath') ?? this.resolveLatestUpgradeReportPath(context.workspaceRoot);
        const confirmationDecision = readString('confirmUpgrade');
        if (!reportPath) {
          throw new RuntimeError(
            GovernorErrorCode.WORKSPACE_SOURCE_NOT_FOUND,
            this.localizeText(
              request.locale,
              'No upgrade report is available to apply from the local orchestration service.',
              '当前没有可供本地编排服务应用的升级报告。',
            ),
            {
              workspaceRoot: context.workspaceRoot,
            },
          );
        }
        if (!confirmationDecision) {
          throw new RuntimeError(
            GovernorErrorCode.POLICY_GATE_HITL_FEEDBACK_INVALID,
            this.localizeText(
              request.locale,
              'Upgrade apply requires an explicit confirmUpgrade decision from the client surface.',
              '升级应用需要客户端显式提供 confirmUpgrade 决策。',
            ),
            {
              reportPath,
            },
          );
        }
        return ['upgrade', 'apply', reportPath, '--confirm-upgrade', confirmationDecision];
      }
      case OrchestrationWorkspaceOperationKind.WORKFLOW_CREATE:
        return [
          'workflow',
          'create',
          ...(readString('templateId')
            ? ['--workflow-template', readString('templateId') ?? '']
            : []),
        ];
      case OrchestrationWorkspaceOperationKind.WORKFLOW_EDIT:
        return [
          'workflow',
          'edit',
          ...(readString('templateId')
            ? ['--workflow-template', readString('templateId') ?? '']
            : []),
        ];
      case OrchestrationWorkspaceOperationKind.WORKFLOW_PREVIEW:
        return [
          'workflow',
          'preview',
          ...(readString('templateId')
            ? ['--workflow-template', readString('templateId') ?? '']
            : []),
        ];
      default:
        throw new RuntimeError(
          GovernorErrorCode.AGENT_PROTOCOL_INVALID,
          this.localizeText(
            request.locale,
            'Unsupported workspace operation kind received by the local orchestration service workspace ops runtime.',
            '本地编排服务工作区操作运行时收到了不受支持的 workspace operation kind。',
          ),
          {
            operationKind: request.operationKind,
          },
        );
    }
  }

  private buildConnectGenerateArgs(request: OrchestrationWorkspaceOperationRequest): string[] {
    const args = request.arguments ?? {};
    const readString = (key: string): string | undefined => {
      const value = args[key];
      return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
    };
    const readStringArray = (key: string): string[] | undefined => {
      const value = args[key];
      if (Array.isArray(value)) {
        return value.filter(
          (entry): entry is string => typeof entry === 'string' && entry.trim().length > 0,
        );
      }
      if (typeof value === 'string' && value.trim().length > 0) {
        return value
          .split(',')
          .map((entry) => entry.trim())
          .filter((entry) => entry.length > 0);
      }
      return undefined;
    };
    const connectArgs = ['connect', '--preset', readString('presetId') ?? 'multi-tool-default'];
    const requestedTools = readStringArray('tools');
    if (requestedTools?.length) {
      connectArgs.push('--tools', requestedTools.join(','));
    }

    const singleToolAllRoles = readString('singleToolAllRoles');
    if (singleToolAllRoles) {
      connectArgs.push('--single-tool-all-roles', singleToolAllRoles);
    }

    for (const binding of readStringArray('toolTransportBindings') ??
      readStringArray('toolTransport') ??
      []) {
      connectArgs.push('--tool-transport', binding);
    }
    for (const binding of readStringArray('remoteApiModelBindings') ??
      readStringArray('remoteApiModel') ??
      []) {
      connectArgs.push('--remote-api-model', binding);
    }
    for (const binding of readStringArray('remoteApiCredentialEnvVarBindings') ??
      readStringArray('remoteApiCredentialEnvVar') ??
      []) {
      connectArgs.push('--remote-api-credential-env-var', binding);
    }
    for (const binding of readStringArray('remoteApiEndpointBindings') ??
      readStringArray('remoteApiEndpoint') ??
      []) {
      connectArgs.push('--remote-api-endpoint', binding);
    }

    return connectArgs;
  }

  private buildConnectApplyArgs(request: OrchestrationWorkspaceOperationRequest): string[] {
    const args = request.arguments ?? {};
    const readBoolean = (key: string): boolean | undefined => {
      const value = args[key];
      return typeof value === 'boolean' ? value : undefined;
    };
    return [
      'connect',
      'apply',
      '--latest',
      ...(readBoolean('force') === true ? ['--force'] : []),
      ...(readBoolean('rollbackEnabled') === false ? ['--no-rollback'] : []),
    ];
  }

  private async executeCliJsonCommand(request: {
    args: readonly string[];
    currentWorkingDirectory: string;
    stdin?: string;
    locale?: string;
  }): Promise<CliSuccessOutputPayload> {
    const cliModulePath = this.resolveEmbeddedCliModulePath(request.locale);
    const context = this.resolveWorkspaceContext();
    const cliArgv = [
      '--locale',
      this.normalizeLocale(request.locale),
      '--output',
      'json',
      '--no-color',
      '--no-interactive',
      '--workspace-mode',
      context.workspaceMode,
      '--workspace-root',
      context.workspaceRoot,
      ...request.args,
    ];
    return new Promise<CliSuccessOutputPayload>((resolvePromise, reject) => {
      const childProcess = spawn(
        process.execPath,
        [
          '--input-type=module',
          '--eval',
          this.renderEmbeddedCliBootstrapSource(
            cliModulePath,
            this.resolveEmbeddedCliBootstrapFailureMessage(request.locale),
          ),
        ],
        {
          cwd: request.currentWorkingDirectory,
          env: {
            ...process.env,
            [EMBEDDED_CLI_ARGV_ENVIRONMENT_KEY]: JSON.stringify(cliArgv),
          },
          stdio: 'pipe',
        },
      );
      let stdout = '';
      let stderr = '';

      childProcess.stdout.on('data', (chunk) => {
        stdout += typeof chunk === 'string' ? chunk : Buffer.from(chunk).toString('utf8');
      });
      childProcess.stderr.on('data', (chunk) => {
        stderr += typeof chunk === 'string' ? chunk : Buffer.from(chunk).toString('utf8');
      });
      childProcess.on('error', (error) => {
        reject(standardizeError(error));
      });
      childProcess.on('close', (exitCode) => {
        const successPayload = this.tryParseJsonPayload(stdout);
        if (exitCode === 0 && successPayload) {
          resolvePromise(successPayload);
          return;
        }

        const failurePayload = this.tryParseJsonPayload(stderr) ?? this.tryParseJsonPayload(stdout);
        if (
          failurePayload &&
          typeof failurePayload === 'object' &&
          !Array.isArray(failurePayload)
        ) {
          const payloadRecord = failurePayload as Record<string, unknown>;
          reject(
            new RuntimeError(
              this.readGovernorErrorCode(payloadRecord.error_code),
              this.readGovernorErrorMessage(payloadRecord.message, stderr, stdout, request.locale),
              {
                exitCode,
              },
            ),
          );
          return;
        }

        reject(
          new RuntimeError(
            GovernorErrorCode.UNKNOWN,
            this.readGovernorErrorMessage(undefined, stderr, stdout, request.locale),
            {
              exitCode,
            },
          ),
        );
      });

      if (request.stdin !== undefined) {
        childProcess.stdin.end(request.stdin);
      } else {
        childProcess.stdin.end();
      }
    });
  }

  private resolveEmbeddedCliModulePath(locale?: string): string {
    try {
      return requireFromRuntime.resolve(EMBEDDED_CLI_PACKAGE_SPECIFIER);
    } catch (error) {
      throw new RuntimeError(
        GovernorErrorCode.WORKSPACE_SOURCE_NOT_FOUND,
        this.localizeText(
          locale,
          'The embedded Repo AI Governor CLI dependency is missing from this installation.',
          '当前安装缺少内嵌的 Repo AI Governor CLI 依赖。',
        ),
        undefined,
        error,
      );
    }
  }

  private renderEmbeddedCliBootstrapSource(cliModulePath: string, failureMessage: string): string {
    return [
      `const cliModule = await import(${JSON.stringify(pathToFileURL(cliModulePath).href)});`,
      "if (typeof cliModule.runCli !== 'function') {",
      `  process.stderr.write(JSON.stringify({ error_code: ${JSON.stringify(GovernorErrorCode.UNKNOWN)}, message: ${JSON.stringify(failureMessage)} }));`,
      '  process.exit(1);',
      '}',
      `const cliArgv = JSON.parse(process.env.${EMBEDDED_CLI_ARGV_ENVIRONMENT_KEY} ?? '[]');`,
      "process.exitCode = await cliModule.runCli(['node', 'repo-ai-governor', ...cliArgv]);",
    ].join('\n');
  }

  private resolveEmbeddedCliBootstrapFailureMessage(locale?: string): string {
    return this.localizeText(
      locale,
      'The embedded CLI module did not expose runCli().',
      '当前内嵌 CLI 模块未导出 runCli()。',
    );
  }

  private tryParseJsonPayload(content: string): CliSuccessOutputPayload | undefined {
    const trimmedContent = content.trim();
    if (trimmedContent.length === 0) {
      return undefined;
    }

    try {
      return JSON.parse(trimmedContent) as CliSuccessOutputPayload;
    } catch {
      return undefined;
    }
  }

  private parseUserConfigStatusSnapshot(
    configStatusPayload: CliSuccessOutputPayload,
    configListPayload: CliSuccessOutputPayload,
    locale?: string,
  ): OrchestrationUserConfigStatus {
    return {
      configPath: this.readRequiredDetailString(configStatusPayload, 'config_path', locale),
      configExists: this.readDetailBoolean(configStatusPayload, 'config_exists'),
      legacyPreferencePath: this.readRequiredDetailString(
        configStatusPayload,
        'legacy_preference_path',
        locale,
      ),
      legacyPreferenceExists: this.readDetailBoolean(
        configStatusPayload,
        'legacy_preference_exists',
      ),
      ...(this.readDetailString(configStatusPayload, 'theme_preference')
        ? {
            themePreference: this.readDetailString(configStatusPayload, 'theme_preference'),
          }
        : {}),
      ...(this.readDetailString(configStatusPayload, 'workspace_mode_preference')
        ? {
            workspaceModePreference: this.readDetailString(
              configStatusPayload,
              'workspace_mode_preference',
            ),
          }
        : {}),
      entries: this.parseUserConfigEntries(this.readDetailString(configListPayload, 'entries')),
    };
  }

  private parseSecretReadinessSnapshot(
    secretStatusPayload: CliSuccessOutputPayload,
    secretListPayload: CliSuccessOutputPayload,
    userConfigEntries: readonly OrchestrationUserConfigEntry[],
    locale?: string,
  ): OrchestrationSecretReadinessSnapshot {
    const records = this.parseSecretRecords(this.readDetailString(secretListPayload, 'records'));
    const configuredCredentialRefs = userConfigEntries
      .filter((entry) => entry.keyPath.endsWith('.remoteApi.credentialRef'))
      .map((entry) => entry.value)
      .filter((value) => value.startsWith(CREDENTIAL_SELECTOR_PREFIX));
    const resolvedSelectors = new Set(
      records
        .filter((record) => record.exists)
        .map((record) => `${CREDENTIAL_SELECTOR_PREFIX}${record.keyName}`),
    );

    return {
      ...(this.readDetailString(secretStatusPayload, 'selected_backend')
        ? {
            selectedBackendId: this.readDetailString(secretStatusPayload, 'selected_backend'),
          }
        : {}),
      ...(this.readDetailString(secretStatusPayload, 'default_backend')
        ? {
            defaultBackendId: this.readDetailString(secretStatusPayload, 'default_backend'),
          }
        : {}),
      indexPath: this.readRequiredDetailString(secretStatusPayload, 'index_path', locale),
      backends: this.parseSecretBackendStatuses(secretStatusPayload),
      records,
      configuredCredentialRefs,
      unresolvedCredentialRefs: configuredCredentialRefs.filter(
        (selector) => !resolvedSelectors.has(selector),
      ),
    };
  }

  private parseUserConfigEntries(entriesSummary?: string): OrchestrationUserConfigEntry[] {
    if (!entriesSummary) {
      return [];
    }

    return entriesSummary
      .split(DEFAULT_USER_CONFIG_ENTRY_DELIMITER)
      .map((entrySummary) => {
        const dividerIndex = entrySummary.indexOf('=');
        if (dividerIndex <= 0) {
          return undefined;
        }

        return {
          keyPath: entrySummary.slice(0, dividerIndex).trim(),
          value: entrySummary.slice(dividerIndex + 1).trim(),
        } satisfies OrchestrationUserConfigEntry;
      })
      .filter((entry): entry is OrchestrationUserConfigEntry => Boolean(entry));
  }

  private parseSecretBackendStatuses(
    payload: CliSuccessOutputPayload,
  ): OrchestrationSecretBackendStatus[] {
    const checks = payload.command_result?.checks ?? [];
    const unsafeFallbackWarning =
      this.readDetailString(payload, 'warning') ?? this.readInteractionPromptAction(payload);

    return checks
      .filter((check) => check.id?.startsWith('secret_backend_'))
      .map((check) => ({
        backendId: check.id?.replace('secret_backend_', '') ?? 'unknown',
        available: check.status === 'pass',
        detail: check.detail ?? '',
        ...(check.id?.replace('secret_backend_', '') === UNSAFE_LOCAL_FILE_SECRET_BACKEND_ID &&
        unsafeFallbackWarning
          ? {
              warning: unsafeFallbackWarning,
            }
          : {}),
      }));
  }

  private parseSecretRecords(recordsSummary?: string): OrchestrationSecretRecord[] {
    if (!recordsSummary) {
      return [];
    }

    return recordsSummary
      .split(DEFAULT_SECRET_RECORD_DELIMITER)
      .map((recordSummary) => {
        const [backendDescriptor, existsDescriptor] = recordSummary.split(':');
        const dividerIndex = backendDescriptor?.lastIndexOf('@') ?? -1;
        if (!backendDescriptor || dividerIndex <= 0) {
          return undefined;
        }

        return {
          keyName: backendDescriptor.slice(0, dividerIndex).trim(),
          backendId: backendDescriptor.slice(dividerIndex + 1).trim(),
          exists: existsDescriptor?.trim() === 'present',
        } satisfies OrchestrationSecretRecord;
      })
      .filter((record): record is OrchestrationSecretRecord => Boolean(record));
  }

  private parseLayeredLogs(
    payload?: CliLayeredLogsPayload,
  ): OrchestrationWorkspaceOperationLayeredLogs | undefined {
    const summary = this.normalizeLayeredLogLines(payload?.summary);
    const detailed = this.normalizeLayeredLogLines(payload?.detailed);
    if (summary.length === 0 && detailed.length === 0) {
      return undefined;
    }

    return {
      summary,
      detailed,
    };
  }

  private normalizeLayeredLogLines(lines: unknown): string[] {
    if (!Array.isArray(lines)) {
      return [];
    }

    return lines.filter(
      (line): line is string => typeof line === 'string' && line.trim().length > 0,
    );
  }

  private cloneWorkspaceOperationResult(
    result: OrchestrationWorkspaceOperationResponse['result'],
  ): OrchestrationWorkspaceOperationResponse['result'] {
    return {
      ...result,
      ...(result.checkTotals
        ? {
            checkTotals: {
              ...result.checkTotals,
            },
          }
        : {}),
      ...(result.checks
        ? {
            checks: result.checks.map((check) => ({
              ...check,
            })),
          }
        : {}),
      ...(result.artifacts
        ? {
            artifacts: result.artifacts.map((artifact) => ({
              ...artifact,
            })),
          }
        : {}),
      ...(result.interactionPrompts
        ? {
            interactionPrompts: result.interactionPrompts.map((prompt) => ({
              ...prompt,
            })),
          }
        : {}),
      ...(result.layeredLogs
        ? {
            layeredLogs: {
              summary: [...result.layeredLogs.summary],
              detailed: [...result.layeredLogs.detailed],
            },
          }
        : {}),
      ...(result.details
        ? {
            details: {
              ...result.details,
            },
          }
        : {}),
    };
  }

  private persistLatestWorkspaceOperationSnapshot(
    context: WorkspaceOpsContext,
    snapshot: OrchestrationWorkspaceOperationSnapshot,
  ): void {
    try {
      mkdirSync(this.resolveLatestWorkspaceOperationSnapshotDirectory(context.workspaceRoot), {
        recursive: true,
      });
      writeFileSync(
        this.resolveLatestWorkspaceOperationSnapshotPath(context.workspaceRoot),
        `${JSON.stringify(
          {
            operationKind: snapshot.operationKind,
            completedAt: snapshot.completedAt,
            ...(snapshot.locale
              ? {
                  locale: snapshot.locale,
                }
              : {}),
            message: snapshot.message,
            result: this.cloneWorkspaceOperationResult(snapshot.result),
          },
          null,
          2,
        )}\n`,
        'utf8',
      );
    } catch {
      // best-effort persistence keeps restart hydration additive without breaking read-only flows
    }
  }

  private loadPersistedLatestWorkspaceOperationSnapshot(
    context: WorkspaceOpsContext,
  ): OrchestrationWorkspaceOperationSnapshot | undefined {
    const snapshotPath = this.resolveLatestWorkspaceOperationSnapshotPath(context.workspaceRoot);
    if (!this.pathExists(snapshotPath)) {
      return undefined;
    }

    try {
      return this.parsePersistedLatestWorkspaceOperationSnapshot(
        JSON.parse(readFileSync(snapshotPath, 'utf8')) as unknown,
      );
    } catch {
      return undefined;
    }
  }

  private parsePersistedLatestWorkspaceOperationSnapshot(
    snapshot: unknown,
  ): OrchestrationWorkspaceOperationSnapshot | undefined {
    if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) {
      return undefined;
    }

    const parsedSnapshot = snapshot as Record<string, unknown>;
    const parsedResult = this.parsePersistedWorkspaceOperationResult(parsedSnapshot.result);
    if (
      typeof parsedSnapshot.operationKind !== 'string' ||
      typeof parsedSnapshot.completedAt !== 'string' ||
      typeof parsedSnapshot.message !== 'string' ||
      !parsedResult
    ) {
      return undefined;
    }

    return {
      operationKind: parsedSnapshot.operationKind as OrchestrationWorkspaceOperationKind,
      completedAt: parsedSnapshot.completedAt,
      ...(typeof parsedSnapshot.locale === 'string' && parsedSnapshot.locale.trim().length > 0
        ? {
            locale: parsedSnapshot.locale.trim(),
          }
        : {}),
      message: parsedSnapshot.message,
      result: parsedResult,
    };
  }

  private parsePersistedWorkspaceOperationResult(
    result: unknown,
  ): OrchestrationWorkspaceOperationResponse['result'] | undefined {
    if (!result || typeof result !== 'object' || Array.isArray(result)) {
      return undefined;
    }

    const parsedResult = result as Record<string, unknown>;
    if (typeof parsedResult.operation !== 'string' || typeof parsedResult.summary !== 'string') {
      return undefined;
    }

    const checkTotals = this.parsePersistedWorkspaceOperationCheckTotals(parsedResult.checkTotals);
    const checks = this.parsePersistedWorkspaceOperationChecks(parsedResult.checks);
    const artifacts = this.parsePersistedWorkspaceOperationArtifacts(parsedResult.artifacts);
    const interactionPrompts = this.parsePersistedWorkspaceOperationInteractionPrompts(
      parsedResult.interactionPrompts,
    );
    const layeredLogs = this.parsePersistedWorkspaceOperationLayeredLogs(parsedResult.layeredLogs);
    const details = this.parsePersistedWorkspaceOperationDetails(parsedResult.details);

    return {
      operation: parsedResult.operation,
      summary: parsedResult.summary,
      ...(checkTotals
        ? {
            checkTotals,
          }
        : {}),
      ...(checks
        ? {
            checks,
          }
        : {}),
      ...(artifacts
        ? {
            artifacts,
          }
        : {}),
      ...(interactionPrompts
        ? {
            interactionPrompts,
          }
        : {}),
      ...(layeredLogs
        ? {
            layeredLogs,
          }
        : {}),
      ...(details
        ? {
            details,
          }
        : {}),
    };
  }

  private parsePersistedWorkspaceOperationCheckTotals(
    checkTotals: unknown,
  ): OrchestrationWorkspaceOperationResponse['result']['checkTotals'] | undefined {
    if (!checkTotals || typeof checkTotals !== 'object' || Array.isArray(checkTotals)) {
      return undefined;
    }

    const parsedCheckTotals = checkTotals as Record<string, unknown>;
    return {
      pass: typeof parsedCheckTotals.pass === 'number' ? parsedCheckTotals.pass : 0,
      warn: typeof parsedCheckTotals.warn === 'number' ? parsedCheckTotals.warn : 0,
      fail: typeof parsedCheckTotals.fail === 'number' ? parsedCheckTotals.fail : 0,
    };
  }

  private parsePersistedWorkspaceOperationChecks(
    checks: unknown,
  ): OrchestrationWorkspaceOperationResponse['result']['checks'] | undefined {
    if (!Array.isArray(checks)) {
      return undefined;
    }

    return checks
      .filter(
        (check): check is { detail?: unknown; id?: unknown; status?: unknown } =>
          Boolean(check) && typeof check === 'object' && !Array.isArray(check),
      )
      .filter(
        (check) =>
          typeof check.id === 'string' &&
          typeof check.status === 'string' &&
          typeof check.detail === 'string',
      )
      .map((check) => ({
        id: check.id as string,
        status: check.status as string,
        detail: check.detail as string,
      }));
  }

  private parsePersistedWorkspaceOperationArtifacts(
    artifacts: unknown,
  ): OrchestrationWorkspaceOperationResponse['result']['artifacts'] | undefined {
    if (!Array.isArray(artifacts)) {
      return undefined;
    }

    return artifacts
      .filter(
        (artifact): artifact is { id?: unknown; path?: unknown } =>
          Boolean(artifact) && typeof artifact === 'object' && !Array.isArray(artifact),
      )
      .filter((artifact) => typeof artifact.id === 'string' && typeof artifact.path === 'string')
      .map((artifact) => ({
        id: artifact.id as string,
        path: artifact.path as string,
      }));
  }

  private parsePersistedWorkspaceOperationInteractionPrompts(
    prompts: unknown,
  ): OrchestrationWorkspaceOperationResponse['result']['interactionPrompts'] | undefined {
    if (!Array.isArray(prompts)) {
      return undefined;
    }

    return prompts
      .filter(
        (prompt): prompt is { action?: unknown; blocking?: unknown; title?: unknown } =>
          Boolean(prompt) && typeof prompt === 'object' && !Array.isArray(prompt),
      )
      .filter(
        (prompt) =>
          typeof prompt.title === 'string' &&
          typeof prompt.action === 'string' &&
          typeof prompt.blocking === 'boolean',
      )
      .map((prompt) => ({
        title: prompt.title as string,
        action: prompt.action as string,
        blocking: prompt.blocking as boolean,
      }));
  }

  private parsePersistedWorkspaceOperationLayeredLogs(
    layeredLogs: unknown,
  ): OrchestrationWorkspaceOperationResponse['result']['layeredLogs'] | undefined {
    if (!layeredLogs || typeof layeredLogs !== 'object' || Array.isArray(layeredLogs)) {
      return undefined;
    }

    const parsedLayeredLogs = layeredLogs as Record<string, unknown>;
    const summary = this.normalizeLayeredLogLines(parsedLayeredLogs.summary);
    const detailed = this.normalizeLayeredLogLines(parsedLayeredLogs.detailed);
    if (summary.length === 0 && detailed.length === 0) {
      return undefined;
    }

    return {
      summary,
      detailed,
    };
  }

  private parsePersistedWorkspaceOperationDetails(
    details: unknown,
  ): OrchestrationWorkspaceOperationResponse['result']['details'] | undefined {
    if (!details || typeof details !== 'object' || Array.isArray(details)) {
      return undefined;
    }

    return Object.fromEntries(
      Object.entries(details).filter(([, value]) => {
        return (
          value === null ||
          typeof value === 'boolean' ||
          typeof value === 'number' ||
          typeof value === 'string'
        );
      }),
    );
  }

  private resolveLatestWorkspaceOperationSnapshotDirectory(workspaceRoot: string): string {
    return resolve(workspaceRoot, 'context', 'runtime');
  }

  private resolveLatestWorkspaceOperationSnapshotPath(workspaceRoot: string): string {
    return resolve(
      this.resolveLatestWorkspaceOperationSnapshotDirectory(workspaceRoot),
      LATEST_WORKSPACE_OPERATION_SNAPSHOT_FILE_NAME,
    );
  }

  private readPayloadMessage(payload: CliSuccessOutputPayload, locale?: string): string {
    return typeof payload.message === 'string' && payload.message.trim().length > 0
      ? payload.message
      : this.localizeText(locale, 'Command completed.', '命令已完成。');
  }

  private readRequiredDetailString(
    payload: CliSuccessOutputPayload,
    key: string,
    locale?: string,
  ): string {
    const value = this.readDetailString(payload, key);
    if (value) {
      return value;
    }

    throw new RuntimeError(
      GovernorErrorCode.UNKNOWN,
      this.localizeText(
        locale,
        `The CLI payload is missing required field "${key}".`,
        `CLI 载荷缺少必填字段“${key}”。`,
      ),
    );
  }

  private readDetailString(payload: CliSuccessOutputPayload, key: string): string | undefined {
    const value = payload.command_result?.details?.[key];
    return typeof value === 'string' && value.trim().length > 0 ? value : undefined;
  }

  private readDetailBoolean(payload: CliSuccessOutputPayload, key: string): boolean {
    return payload.command_result?.details?.[key] === true;
  }

  private readInteractionPromptAction(payload: CliSuccessOutputPayload): string | undefined {
    const action = payload.command_result?.experience?.interactionPrompts?.[0]?.action;
    return typeof action === 'string' && action.trim().length > 0 ? action : undefined;
  }

  private readGovernorErrorCode(errorCode: unknown): GovernorErrorCode {
    return typeof errorCode === 'string' &&
      Object.values(GovernorErrorCode).includes(errorCode as GovernorErrorCode)
      ? (errorCode as GovernorErrorCode)
      : GovernorErrorCode.UNKNOWN;
  }

  private readGovernorErrorMessage(
    message: unknown,
    stderr: string,
    stdout: string,
    locale?: string,
  ): string {
    if (typeof message === 'string' && message.trim().length > 0) {
      return message;
    }

    const stderrContent = stderr.trim();
    if (stderrContent.length > 0) {
      return stderrContent;
    }

    const stdoutContent = stdout.trim();
    if (stdoutContent.length > 0) {
      return stdoutContent;
    }

    return this.localizeText(
      locale,
      'The embedded CLI did not return a parseable result.',
      '内嵌 CLI 没有返回可解析的结果。',
    );
  }

  private resolveLatestUpgradeReportPath(workspaceRoot: string): string | undefined {
    const upgradeDirectoryPath = resolve(workspaceRoot, 'context', 'upgrade');
    if (!this.pathExists(upgradeDirectoryPath)) {
      return undefined;
    }

    const latestReportFileName = readdirSync(upgradeDirectoryPath)
      .map((fileName) => ({
        fileName,
        matchedReport: fileName.match(UPGRADE_REPORT_FILE_PATTERN),
      }))
      .filter(
        (
          entry,
        ): entry is {
          fileName: string;
          matchedReport: RegExpMatchArray;
        } => entry.matchedReport !== null,
      )
      .sort(
        (left, right) =>
          Number(right.matchedReport[1] ?? '0') - Number(left.matchedReport[1] ?? '0'),
      )[0]?.fileName;

    return latestReportFileName ? resolve(upgradeDirectoryPath, latestReportFileName) : undefined;
  }

  private normalizeLocale(locale?: string): string {
    return locale?.trim().length ? locale : 'en-US';
  }

  private localizeText(locale: string | undefined, english: string, chinese: string): string {
    return this.normalizeLocale(locale).toLowerCase().startsWith('zh') ? chinese : english;
  }
}
