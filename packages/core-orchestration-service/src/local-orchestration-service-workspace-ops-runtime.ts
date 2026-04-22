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
  OrchestrationApplyProviderOnboardingRequest,
  OrchestrationApplyProviderOnboardingResponse,
  OrchestrationBootstrapReadinessSnapshot,
  OrchestrationProviderOnboardingSnapshot,
  OrchestrationProviderOnboardingSnapshotRequest,
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
  ORCHESTRATION_CONNECT_PROVIDER_ONBOARDING_ARGUMENT_KEYS,
  OrchestrationBootstrapReadinessActionId,
  OrchestrationWorkflowDraftEntryMode,
  OrchestrationWorkspaceOperationKind,
} from '@repo-ai-governor/orchestration-service-client';
import {
  AdapterProviderKind,
  AdapterSurface,
  AdapterTransportKind,
  AdapterVendorBindingKind,
  GovernorErrorCode,
  RuntimeError,
  standardizeError,
} from '@repo-ai-governor/shared';
import { LocalOrchestrationServiceWorkflowDraftRuntime } from './local-orchestration-service-workflow-draft-runtime.js';

const EMBEDDED_CLI_PACKAGE_SPECIFIER = '@repo-ai-governor/cli';
const EMBEDDED_CLI_ARGV_ENVIRONMENT_KEY = 'REPO_AI_GOVERNOR_EMBEDDED_CLI_ARGV';
const DEFAULT_USER_CONFIG_ENTRY_DELIMITER = ' | ';
const DEFAULT_SECRET_RECORD_DELIMITER = ' | ';
const CREDENTIAL_SELECTOR_PREFIX = 'secret://';
const UNSAFE_LOCAL_FILE_SECRET_BACKEND_ID = 'unsafe-local-file';
const PROVIDER_ONBOARDING_SURFACE_ID = 'vscode_provider_onboarding';
const PROVIDER_ONBOARDING_MUTATION_MODE = 'explicit_provider_onboarding_command';
const PROVIDER_ONBOARDING_SECRET_CAPTURE_MODE = 'host_secure_prompt';
const PROVIDER_ONBOARDING_SECRET_OWNER = 'governor_managed_secret_backend';
const PROVIDER_ONBOARDING_CREDENTIAL_REF_STRATEGY = 'provider_default_api_key';
const PROVIDER_ONBOARDING_READINESS_PROJECTION_SOURCE = 'provider_onboarding_snapshot';
const PROVIDER_ONBOARDING_CONFIG_TARGET_SUFFIXES = [
  'transport',
  'remoteApi.provider',
  'remoteApi.vendorBinding',
  'remoteApi.model',
  'remoteApi.endpoint',
  'remoteApi.credentialEnvVar',
  'remoteApi.credentialRef',
] as const;
const PROVIDER_ONBOARDING_RECEIPT_FIELDS = [
  'tool',
  'provider',
  'credentialRef',
  'secretBackend',
  'warnings',
  'nextAction',
] as const;
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
  workflowDraftRuntime?: Pick<LocalOrchestrationServiceWorkflowDraftRuntime, 'startWorkflowDraft'>;
}

interface ResolvedProviderOnboardingState {
  provider: AdapterProviderKind;
  vendorBinding: AdapterVendorBindingKind;
  credentialRef: string;
  model?: string;
  endpoint?: string;
}

interface ProviderOnboardingConfigRestoreEntry {
  keyPath: string;
  previousValue?: string;
}

interface StagedConnectProviderOnboardingTransaction {
  finalizeAfterConnect: () => Promise<void>;
  rollbackAfterFailure: () => Promise<void>;
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
  private readonly workflowDraftRuntime: Pick<
    LocalOrchestrationServiceWorkflowDraftRuntime,
    'startWorkflowDraft'
  >;
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
    this.workflowDraftRuntime =
      dependencies.workflowDraftRuntime ??
      new LocalOrchestrationServiceWorkflowDraftRuntime({
        workspaceRoot: dependencies.workspaceRoot,
        nowProvider: this.nowProvider,
      });
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

  public async queryProviderOnboarding(
    request: OrchestrationProviderOnboardingSnapshotRequest,
  ): Promise<OrchestrationProviderOnboardingSnapshot> {
    const secureAuthoring = await this.querySecureAuthoring({
      locale: request.locale,
    });
    const resolvedState = this.resolveProviderOnboardingState(
      secureAuthoring,
      request.tool,
      request.provider,
    );

    return {
      surfaceId: PROVIDER_ONBOARDING_SURFACE_ID,
      entrypointKind: request.entrypointKind,
      mutationMode: PROVIDER_ONBOARDING_MUTATION_MODE,
      tool: request.tool,
      transport: AdapterTransportKind.REMOTE_API,
      provider: resolvedState.provider,
      vendorBinding: resolvedState.vendorBinding,
      secretCaptureMode: PROVIDER_ONBOARDING_SECRET_CAPTURE_MODE,
      secretOwner: PROVIDER_ONBOARDING_SECRET_OWNER,
      credentialRefStrategy: PROVIDER_ONBOARDING_CREDENTIAL_REF_STRATEGY,
      readinessProjectionSource: PROVIDER_ONBOARDING_READINESS_PROJECTION_SOURCE,
      configTargets: this.resolveProviderOnboardingConfigTargets(request.tool),
      receiptFields: [...PROVIDER_ONBOARDING_RECEIPT_FIELDS],
      credentialRef: resolvedState.credentialRef,
      ...(resolvedState.model
        ? {
            model: resolvedState.model,
          }
        : {}),
      ...(resolvedState.endpoint
        ? {
            endpoint: resolvedState.endpoint,
          }
        : {}),
      ...(secureAuthoring.secretReadiness?.selectedBackendId
        ? {
            selectedBackendId: secureAuthoring.secretReadiness.selectedBackendId,
          }
        : {}),
      ...(secureAuthoring.secretReadiness?.defaultBackendId
        ? {
            defaultBackendId: secureAuthoring.secretReadiness.defaultBackendId,
          }
        : {}),
      availableBackends: [...(secureAuthoring.secretReadiness?.backends ?? [])],
      warnings: this.buildProviderOnboardingWarnings(
        secureAuthoring.secretReadiness,
        resolvedState.credentialRef,
      ),
    };
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

  private async unsetUserConfigValue(request: {
    keyPath: string;
    locale?: string;
  }): Promise<void> {
    const context = this.resolveWorkspaceContext();
    await this.cliExecutor({
      args: ['config', 'unset', request.keyPath],
      currentWorkingDirectory: context.repositoryRoot,
      locale: request.locale,
    });
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

  public async applyProviderOnboarding(
    request: OrchestrationApplyProviderOnboardingRequest,
  ): Promise<OrchestrationApplyProviderOnboardingResponse> {
    const reuseExistingCredential = request.reuseExistingCredential === true;
    const normalizedApiKey = request.apiKey.trim();
    if (!reuseExistingCredential && normalizedApiKey.length === 0) {
      throw new RuntimeError(
        GovernorErrorCode.PROCESS_RUNTIME_BACKEND_UNAVAILABLE,
        'Provider onboarding requires one non-empty API key value.',
      );
    }
    const normalizedModel = request.model.trim();
    if (normalizedModel.length === 0) {
      throw new RuntimeError(
        GovernorErrorCode.PROCESS_RUNTIME_BACKEND_UNAVAILABLE,
        'Provider onboarding requires one non-empty model value.',
      );
    }

    const snapshot = await this.queryProviderOnboarding({
      tool: request.tool,
      entrypointKind: request.entrypointKind,
      ...(request.provider
        ? {
            provider: request.provider,
          }
        : {}),
      locale: request.locale,
    });
    const backendId = this.resolveProviderOnboardingBackendId(
      snapshot.availableBackends,
      request.backendId,
      snapshot.defaultBackendId,
      snapshot.selectedBackendId,
    );
    const secretKeyName = this.extractManagedSecretKeyName(snapshot.credentialRef);
    if (!secretKeyName) {
      throw new RuntimeError(
        GovernorErrorCode.PROCESS_RUNTIME_BACKEND_UNAVAILABLE,
        `Provider onboarding credentialRef must use ${CREDENTIAL_SELECTOR_PREFIX} selectors.`,
      );
    }

    const secureAuthoring = await this.querySecureAuthoring({
      locale: request.locale,
    });
    if (secureAuthoring.degradedReason || !secureAuthoring.secretReadiness) {
      throw new RuntimeError(
        GovernorErrorCode.PROCESS_RUNTIME_BACKEND_UNAVAILABLE,
        secureAuthoring.degradedReason ??
          this.localizeText(
            request.locale,
            'Provider onboarding secure-authoring snapshot is unavailable for the current workspace.',
            '当前工作区的 provider onboarding secure-authoring 快照不可用。',
          ),
      );
    }
    const existingCredentialRecord = this.findManagedSecretRecord(
      secureAuthoring.secretReadiness.records,
      secretKeyName,
      backendId,
    );
    if (reuseExistingCredential) {
      if (!existingCredentialRecord || existingCredentialRecord.backendId !== backendId) {
        throw new RuntimeError(
          GovernorErrorCode.PROCESS_RUNTIME_BACKEND_UNAVAILABLE,
          this.localizeText(
            request.locale,
            `Provider onboarding can reuse ${snapshot.credentialRef} only when the managed secret already exists on backend ${backendId}.`,
            `provider onboarding 只有在 backend ${backendId} 上已经存在受管 secret ${snapshot.credentialRef} 时才能复用该 credential。`,
          ),
          {
            credentialRef: snapshot.credentialRef,
            backendId,
          },
        );
      }
    } else if (existingCredentialRecord) {
      throw new RuntimeError(
        GovernorErrorCode.PROCESS_RUNTIME_BACKEND_UNAVAILABLE,
        this.localizeText(
          request.locale,
          `Provider onboarding will not overwrite existing managed secret ${snapshot.credentialRef}. Use the dedicated update/reconnect flow instead.`,
          `provider onboarding 不会覆盖已有的受管 secret ${snapshot.credentialRef}。请改用专门的更新/重连流程。`,
        ),
        {
          credentialRef: snapshot.credentialRef,
          backendId: existingCredentialRecord.backendId,
        },
      );
    }

    const secretResult = reuseExistingCredential
      ? {
          selector: snapshot.credentialRef,
          backendId,
          warning: undefined,
        }
      : await this.setManagedSecret({
          keyName: secretKeyName,
          value: normalizedApiKey,
          backendId,
          locale: request.locale,
        });
    const endpointKeyPath = `tools.${request.tool}.remoteApi.endpoint`;
    const configWrites = [
      {
        keyPath: `tools.${request.tool}.transport`,
        value: AdapterTransportKind.REMOTE_API,
      },
      {
        keyPath: `tools.${request.tool}.remoteApi.provider`,
        value: snapshot.provider,
      },
      {
        keyPath: `tools.${request.tool}.remoteApi.vendorBinding`,
        value: snapshot.vendorBinding,
      },
      {
        keyPath: `tools.${request.tool}.remoteApi.model`,
        value: normalizedModel,
      },
      {
        keyPath: `tools.${request.tool}.remoteApi.credentialRef`,
        value: snapshot.credentialRef,
      },
    ];

    for (const write of configWrites) {
      await this.setUserConfigValue({
        keyPath: write.keyPath,
        value: write.value,
        locale: request.locale,
      });
    }
    const configTargets = configWrites.map((write) => write.keyPath);
    if (request.endpoint !== undefined) {
      if (request.endpoint.trim().length > 0) {
        await this.setUserConfigValue({
          keyPath: endpointKeyPath,
          value: request.endpoint.trim(),
          locale: request.locale,
        });
      } else {
        await this.unsetUserConfigValue({
          keyPath: endpointKeyPath,
          locale: request.locale,
        });
      }
      configTargets.push(endpointKeyPath);
    }
    configTargets.push(`tools.${request.tool}.remoteApi.credentialEnvVar`);
    await this.unsetUserConfigValue({
      keyPath: `tools.${request.tool}.remoteApi.credentialEnvVar`,
      locale: request.locale,
    });

    return {
      surfaceId: PROVIDER_ONBOARDING_SURFACE_ID,
      entrypointKind: request.entrypointKind,
      mutationMode: PROVIDER_ONBOARDING_MUTATION_MODE,
      tool: request.tool,
      transport: AdapterTransportKind.REMOTE_API,
      provider: snapshot.provider,
      vendorBinding: snapshot.vendorBinding,
      credentialRef: secretResult.selector ?? snapshot.credentialRef,
      secretBackend: secretResult.backendId ?? backendId,
      configTargets,
      receiptFields: [...PROVIDER_ONBOARDING_RECEIPT_FIELDS],
      warnings: [...snapshot.warnings, ...(secretResult.warning ? [secretResult.warning] : [])],
      nextAction: 'repoAiGovernor.runConnect',
    };
  }

  public async runWorkspaceOperation(
    request: OrchestrationWorkspaceOperationRequest,
  ): Promise<OrchestrationWorkspaceOperationResponse> {
    const context = this.resolveWorkspaceContext();
    const response =
      request.operationKind === OrchestrationWorkspaceOperationKind.CONNECT
        ? await this.runConnectWorkspaceOperation(request, context)
        : this.isWorkflowDraftWorkspaceOperation(request.operationKind)
          ? await this.runWorkflowDraftWorkspaceOperation(request)
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

  private isWorkflowDraftWorkspaceOperation(
    operationKind: OrchestrationWorkspaceOperationKind,
  ): boolean {
    return (
      operationKind === OrchestrationWorkspaceOperationKind.WORKFLOW_PREVIEW ||
      operationKind === OrchestrationWorkspaceOperationKind.WORKFLOW_CREATE ||
      operationKind === OrchestrationWorkspaceOperationKind.WORKFLOW_EDIT
    );
  }

  private async runWorkflowDraftWorkspaceOperation(
    request: OrchestrationWorkspaceOperationRequest,
  ): Promise<OrchestrationWorkspaceOperationResponse> {
    const response = await this.workflowDraftRuntime.startWorkflowDraft({
      entryMode: this.resolveWorkflowDraftEntryMode(request.operationKind),
      templateId: this.readWorkspaceOperationStringArgument(request, 'templateId'),
      locale: request.locale,
    });

    return this.buildWorkflowDraftWorkspaceOperationResponse(request, response);
  }

  private async runConnectWorkspaceOperation(
    request: OrchestrationWorkspaceOperationRequest,
    context: WorkspaceOpsContext,
  ): Promise<OrchestrationWorkspaceOperationResponse> {
    const providerOnboardingRequest = this.resolveConnectProviderOnboardingRequest(request);
    let stagedProviderOnboarding: StagedConnectProviderOnboardingTransaction | undefined;
    let connectApplied = false;

    try {
      if (providerOnboardingRequest) {
        stagedProviderOnboarding = await this.stageConnectProviderOnboarding(
          providerOnboardingRequest,
          request.locale,
        );
      }

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
      connectApplied = true;
      await stagedProviderOnboarding?.finalizeAfterConnect();

      const response = this.buildWorkspaceOperationResponse(request, applyPayload);
      const combinedArtifacts = this.mergeArtifacts(
        this.readArtifactsFromPayload(generatePayload),
        response.result.artifacts,
      );
      if (combinedArtifacts.length > 0) {
        response.result.artifacts = combinedArtifacts;
      }
      return response;
    } catch (error) {
      if (stagedProviderOnboarding && !connectApplied) {
        try {
          await stagedProviderOnboarding.rollbackAfterFailure();
        } catch (rollbackError) {
          throw new RuntimeError(
            GovernorErrorCode.UNKNOWN,
            this.localizeText(
              request.locale,
              'Connect provider onboarding failed and rollback could not restore the previous state.',
              'connect 的 provider onboarding 失败，且回滚无法恢复先前状态。',
            ),
            {
              connectError: standardizeError(error).message,
              rollbackError: standardizeError(rollbackError).message,
            },
            error,
          );
        }
      }
      throw error;
    }
  }

  private resolveWorkflowDraftEntryMode(
    operationKind: OrchestrationWorkspaceOperationKind,
  ): OrchestrationWorkflowDraftEntryMode {
    switch (operationKind) {
      case OrchestrationWorkspaceOperationKind.WORKFLOW_PREVIEW:
        return OrchestrationWorkflowDraftEntryMode.READ_ONLY;
      case OrchestrationWorkspaceOperationKind.WORKFLOW_CREATE:
        return OrchestrationWorkflowDraftEntryMode.CREATE_SEED;
      case OrchestrationWorkspaceOperationKind.WORKFLOW_EDIT:
        return OrchestrationWorkflowDraftEntryMode.EDIT_SEED;
      default:
        throw new RuntimeError(
          GovernorErrorCode.AGENT_PROTOCOL_INVALID,
          this.localizeText(
            undefined,
            'Unsupported workflow draft entry mode.',
            '不支持的工作流草稿入口模式。',
          ),
          {
            operationKind,
          },
        );
    }
  }

  private readWorkspaceOperationStringArgument(
    request: OrchestrationWorkspaceOperationRequest,
    key: string,
  ): string | undefined {
    const value = request.arguments?.[key];
    return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
  }

  private resolveConnectProviderOnboardingRequest(
    request: OrchestrationWorkspaceOperationRequest,
  ): OrchestrationApplyProviderOnboardingRequest | undefined {
    const args = request.arguments ?? {};
    const toolValue = args[ORCHESTRATION_CONNECT_PROVIDER_ONBOARDING_ARGUMENT_KEYS.TOOL];
    if (toolValue === undefined || toolValue === null) {
      return undefined;
    }

    const readRequiredString = (key: string): string => {
      const value = args[key];
      if (typeof value === 'string' && value.trim().length > 0) {
        return value.trim();
      }

      throw new RuntimeError(
        GovernorErrorCode.AGENT_PROTOCOL_INVALID,
        this.localizeText(
          request.locale,
          `Connect provider onboarding argument "${key}" is required.`,
          `connect provider onboarding 参数“${key}”为必填项。`,
        ),
      );
    };

    const tool = readRequiredString(ORCHESTRATION_CONNECT_PROVIDER_ONBOARDING_ARGUMENT_KEYS.TOOL);
    if (!Object.values(AdapterSurface).includes(tool as AdapterSurface)) {
      throw new RuntimeError(
        GovernorErrorCode.AGENT_PROTOCOL_INVALID,
        this.localizeText(
          request.locale,
          `Unsupported provider onboarding tool "${tool}".`,
          `不支持的 provider onboarding 工具 "${tool}"。`,
        ),
      );
    }

    const providerValue = args[ORCHESTRATION_CONNECT_PROVIDER_ONBOARDING_ARGUMENT_KEYS.PROVIDER];
    if (
      providerValue !== undefined &&
      providerValue !== null &&
      (!(
        typeof providerValue === 'string' &&
        Object.values(AdapterProviderKind).includes(providerValue as AdapterProviderKind)
      ) ||
        providerValue.trim().length === 0)
    ) {
      throw new RuntimeError(
        GovernorErrorCode.AGENT_PROTOCOL_INVALID,
        this.localizeText(
          request.locale,
          `Unsupported provider onboarding provider "${String(providerValue)}".`,
          `不支持的 provider onboarding provider "${String(providerValue)}"。`,
        ),
      );
    }

    const backendIdValue = args[ORCHESTRATION_CONNECT_PROVIDER_ONBOARDING_ARGUMENT_KEYS.BACKEND_ID];
    const reuseExistingCredential =
      args[ORCHESTRATION_CONNECT_PROVIDER_ONBOARDING_ARGUMENT_KEYS.REUSE_EXISTING_CREDENTIAL] ===
      true;
    if (
      backendIdValue !== undefined &&
      backendIdValue !== null &&
      !(typeof backendIdValue === 'string' && backendIdValue.trim().length > 0)
    ) {
      throw new RuntimeError(
        GovernorErrorCode.AGENT_PROTOCOL_INVALID,
        this.localizeText(
          request.locale,
          'Provider onboarding backend override must be one non-empty string when provided.',
          'provider onboarding backend 覆写在提供时必须是一个非空字符串。',
        ),
      );
    }

    const endpointKey = ORCHESTRATION_CONNECT_PROVIDER_ONBOARDING_ARGUMENT_KEYS.ENDPOINT;
    const endpointIsProvided = Object.prototype.hasOwnProperty.call(args, endpointKey);
    const endpointValue = args[endpointKey];
    if (
      endpointIsProvided &&
      endpointValue !== null &&
      endpointValue !== undefined &&
      typeof endpointValue !== 'string'
    ) {
      throw new RuntimeError(
        GovernorErrorCode.AGENT_PROTOCOL_INVALID,
        this.localizeText(
          request.locale,
          'Provider onboarding endpoint override must be a string when provided.',
          'provider onboarding endpoint 覆写在提供时必须是字符串。',
        ),
      );
    }

    return {
      tool: tool as AdapterSurface,
      entrypointKind: readRequiredString(
        ORCHESTRATION_CONNECT_PROVIDER_ONBOARDING_ARGUMENT_KEYS.ENTRYPOINT_KIND,
      ),
      model: readRequiredString(ORCHESTRATION_CONNECT_PROVIDER_ONBOARDING_ARGUMENT_KEYS.MODEL),
      apiKey: reuseExistingCredential
        ? ''
        : readRequiredString(ORCHESTRATION_CONNECT_PROVIDER_ONBOARDING_ARGUMENT_KEYS.API_KEY),
      ...(reuseExistingCredential
        ? {
            reuseExistingCredential: true,
          }
        : {}),
      ...(typeof providerValue === 'string' && providerValue.trim().length > 0
        ? {
            provider: providerValue as AdapterProviderKind,
          }
        : {}),
      ...(endpointIsProvided
        ? {
            endpoint: typeof endpointValue === 'string' ? endpointValue : '',
          }
        : {}),
      ...(typeof backendIdValue === 'string' && backendIdValue.trim().length > 0
        ? {
            backendId: backendIdValue.trim(),
          }
        : {}),
    };
  }

  // Connect needs compensating provider-onboarding truth so a failed CONNECT does not strand
  // partially applied user-config or managed-secret mutations in the workspace.
  private async stageConnectProviderOnboarding(
    request: OrchestrationApplyProviderOnboardingRequest,
    locale: string | undefined,
  ): Promise<StagedConnectProviderOnboardingTransaction> {
    const reuseExistingCredential = request.reuseExistingCredential === true;
    const normalizedApiKey = request.apiKey.trim();
    if (!reuseExistingCredential && normalizedApiKey.length === 0) {
      throw new RuntimeError(
        GovernorErrorCode.PROCESS_RUNTIME_BACKEND_UNAVAILABLE,
        'Provider onboarding requires one non-empty API key value.',
      );
    }
    const normalizedModel = request.model.trim();
    if (normalizedModel.length === 0) {
      throw new RuntimeError(
        GovernorErrorCode.PROCESS_RUNTIME_BACKEND_UNAVAILABLE,
        'Provider onboarding requires one non-empty model value.',
      );
    }

    const secureAuthoring = await this.querySecureAuthoring({
      locale,
    });
    if (secureAuthoring.degradedReason || !secureAuthoring.secretReadiness) {
      throw new RuntimeError(
        GovernorErrorCode.PROCESS_RUNTIME_BACKEND_UNAVAILABLE,
        secureAuthoring.degradedReason ??
          this.localizeText(
            locale,
            'Provider onboarding secure-authoring snapshot is unavailable for the current workspace.',
            '当前工作区的 provider onboarding secure-authoring 快照不可用。',
          ),
      );
    }

    const resolvedState = this.resolveProviderOnboardingState(
      secureAuthoring,
      request.tool,
      request.provider,
    );
    const backendId = this.resolveProviderOnboardingBackendId(
      secureAuthoring.secretReadiness.backends,
      request.backendId,
      secureAuthoring.secretReadiness.defaultBackendId,
      secureAuthoring.secretReadiness.selectedBackendId,
    );
    const finalKeyName = this.extractManagedSecretKeyName(resolvedState.credentialRef);
    if (!finalKeyName) {
      throw new RuntimeError(
        GovernorErrorCode.PROCESS_RUNTIME_BACKEND_UNAVAILABLE,
        `Provider onboarding credentialRef must use ${CREDENTIAL_SELECTOR_PREFIX} selectors.`,
      );
    }
    const existingCredentialRecord = this.findManagedSecretRecord(
      secureAuthoring.secretReadiness.records,
      finalKeyName,
      backendId,
    );
    if (reuseExistingCredential) {
      if (!existingCredentialRecord || existingCredentialRecord.backendId !== backendId) {
        throw new RuntimeError(
          GovernorErrorCode.PROCESS_RUNTIME_BACKEND_UNAVAILABLE,
          this.localizeText(
            locale,
            `Connect onboarding can reuse ${resolvedState.credentialRef} only when the managed secret already exists on backend ${backendId}.`,
            `connect onboarding 只有在 backend ${backendId} 上已经存在受管 secret ${resolvedState.credentialRef} 时才能复用该 credential。`,
          ),
          {
            credentialRef: resolvedState.credentialRef,
            backendId,
          },
        );
      }
    } else if (existingCredentialRecord) {
      throw new RuntimeError(
        GovernorErrorCode.PROCESS_RUNTIME_BACKEND_UNAVAILABLE,
        this.localizeText(
          locale,
          `Connect onboarding will not overwrite existing managed secret ${resolvedState.credentialRef}. Use the dedicated update/reconnect flow instead.`,
          `connect onboarding 不会覆盖已有的受管 secret ${resolvedState.credentialRef}。请改用专门的更新/重连流程。`,
        ),
        {
          credentialRef: resolvedState.credentialRef,
          backendId: existingCredentialRecord.backendId,
        },
      );
    }
    const configKeyPaths = this.createProviderOnboardingConfigKeyPaths(request.tool);
    const restoreEntries = this.captureProviderOnboardingRestoreEntries(
      secureAuthoring.userConfig?.entries,
      configKeyPaths,
    );
    const rollbackAfterFailure = async (): Promise<void> => {
      await this.restoreProviderOnboardingConfig(restoreEntries, locale);
      if (!reuseExistingCredential) {
        await this.deleteManagedSecret({
          keyName: finalKeyName,
          backendId,
          locale,
        });
      }
    };

    try {
      if (!reuseExistingCredential) {
        await this.setManagedSecret({
          keyName: finalKeyName,
          value: normalizedApiKey,
          backendId,
          locale,
        });
      }
      await this.applyProviderOnboardingConfigMutation({
        tool: request.tool,
        provider: resolvedState.provider,
        vendorBinding: resolvedState.vendorBinding,
        model: normalizedModel,
        credentialRef: resolvedState.credentialRef,
        endpoint: request.endpoint,
        locale,
      });
    } catch (error) {
      try {
        await rollbackAfterFailure();
      } catch (rollbackError) {
        throw new RuntimeError(
          GovernorErrorCode.UNKNOWN,
          this.localizeText(
            locale,
            'Provider onboarding staging failed and rollback could not restore the previous state.',
            'provider onboarding 暂存失败，且回滚无法恢复先前状态。',
          ),
          {
            stagingError: standardizeError(error).message,
            rollbackError: standardizeError(rollbackError).message,
          },
          error,
        );
      }
      throw error;
    }

    return {
      finalizeAfterConnect: async () => {},
      rollbackAfterFailure,
    };
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

  private buildWorkflowDraftWorkspaceOperationResponse(
    request: OrchestrationWorkspaceOperationRequest,
    payload: Awaited<
      ReturnType<
        Pick<
          LocalOrchestrationServiceWorkflowDraftRuntime,
          'startWorkflowDraft'
        >['startWorkflowDraft']
      >
    >,
  ): OrchestrationWorkspaceOperationResponse {
    const draftSession = payload.draftSession;
    const artifacts = draftSession.backlinkArtifacts
      .filter(
        (artifact: (typeof draftSession.backlinkArtifacts)[number]) =>
          artifact.artifactPath.trim().length > 0,
      )
      .map((artifact: (typeof draftSession.backlinkArtifacts)[number]) => ({
        id: artifact.artifactId,
        path: artifact.artifactPath,
      }));

    return {
      message: payload.message,
      result: {
        operation: request.operationKind,
        summary: payload.message,
        ...(artifacts.length > 0
          ? {
              artifacts,
            }
          : {}),
        details: {
          workflowDraftId: draftSession.workflowDraftId,
          draftRevision: draftSession.draftRevision,
          baseDefinitionRevision: draftSession.baseDefinitionRevision,
          templateId: draftSession.templateId,
          entryMode: draftSession.entryMode,
          nodeCount: draftSession.nodeSpecs.length,
          edgeCount: draftSession.edgeSpecs.length,
          validationIssueCount: draftSession.validationIssues.length,
          compileWarningCount: draftSession.compiledIrPreview.compileWarningCount,
          compileErrorCount: draftSession.compiledIrPreview.compileErrorCount,
          conflictKind: draftSession.conflictState.conflictKind,
        },
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

  private resolveProviderOnboardingState(
    secureAuthoring: OrchestrationSecureAuthoringSnapshot,
    tool: AdapterSurface,
    provider?: AdapterProviderKind,
  ): ResolvedProviderOnboardingState {
    const configuredProvider = this.readUserConfigEntryValue(
      secureAuthoring.userConfig?.entries,
      tool,
      'remoteApi.provider',
    );
    const resolvedProvider =
      provider ??
      (configuredProvider &&
      Object.values(AdapterProviderKind).includes(configuredProvider as AdapterProviderKind)
        ? (configuredProvider as AdapterProviderKind)
        : this.resolveDefaultRemoteApiProvider(tool));
    const resolvedCompatibility = this.resolveProviderOnboardingCompatibility(
      tool,
      resolvedProvider,
    );
    const configuredVendorBinding = this.readUserConfigEntryValue(
      secureAuthoring.userConfig?.entries,
      tool,
      'remoteApi.vendorBinding',
    );
    if (
      configuredVendorBinding &&
      Object.values(AdapterVendorBindingKind).includes(
        configuredVendorBinding as AdapterVendorBindingKind,
      ) &&
      configuredVendorBinding !== resolvedCompatibility.vendorBinding
    ) {
      throw new RuntimeError(
        GovernorErrorCode.PROCESS_RUNTIME_BACKEND_UNAVAILABLE,
        `Provider onboarding requires ${resolvedCompatibility.vendorBinding} when tool ${tool} uses provider ${resolvedCompatibility.provider}.`,
      );
    }
    const credentialRef =
      this.readUserConfigEntryValue(
        secureAuthoring.userConfig?.entries,
        tool,
        'remoteApi.credentialRef',
      ) ?? this.resolveDefaultCredentialRefSelector(resolvedCompatibility.provider);

    return {
      provider: resolvedCompatibility.provider,
      vendorBinding: resolvedCompatibility.vendorBinding,
      credentialRef,
      ...(this.readUserConfigEntryValue(
        secureAuthoring.userConfig?.entries,
        tool,
        'remoteApi.model',
      )
        ? {
            model: this.readUserConfigEntryValue(
              secureAuthoring.userConfig?.entries,
              tool,
              'remoteApi.model',
            ),
          }
        : {}),
      ...(this.readUserConfigEntryValue(
        secureAuthoring.userConfig?.entries,
        tool,
        'remoteApi.endpoint',
      )
        ? {
            endpoint: this.readUserConfigEntryValue(
              secureAuthoring.userConfig?.entries,
              tool,
              'remoteApi.endpoint',
            ),
          }
        : {}),
    };
  }

  private buildProviderOnboardingWarnings(
    secretReadiness: OrchestrationSecretReadinessSnapshot | undefined,
    credentialRef: string,
  ): string[] {
    const warnings =
      secretReadiness?.backends
        .map((backend) => backend.warning)
        .filter((warning): warning is string => Boolean(warning)) ?? [];
    if (secretReadiness?.unresolvedCredentialRefs.includes(credentialRef)) {
      warnings.push(`${credentialRef} does not resolve through the current managed backend state.`);
    }
    return warnings;
  }

  private resolveProviderOnboardingConfigTargets(tool: AdapterSurface): string[] {
    return PROVIDER_ONBOARDING_CONFIG_TARGET_SUFFIXES.map((suffix) => `tools.${tool}.${suffix}`);
  }

  private createProviderOnboardingConfigKeyPaths(tool: AdapterSurface): Record<string, string> {
    return {
      transport: `tools.${tool}.transport`,
      provider: `tools.${tool}.remoteApi.provider`,
      vendorBinding: `tools.${tool}.remoteApi.vendorBinding`,
      model: `tools.${tool}.remoteApi.model`,
      endpoint: `tools.${tool}.remoteApi.endpoint`,
      credentialRef: `tools.${tool}.remoteApi.credentialRef`,
      credentialEnvVar: `tools.${tool}.remoteApi.credentialEnvVar`,
    };
  }

  private captureProviderOnboardingRestoreEntries(
    entries: readonly OrchestrationUserConfigEntry[] | undefined,
    keyPaths: Record<string, string>,
  ): ProviderOnboardingConfigRestoreEntry[] {
    return Object.values(keyPaths).map((keyPath) => ({
      keyPath,
      previousValue: this.readUserConfigEntryValueByKeyPath(entries, keyPath),
    }));
  }

  private async restoreProviderOnboardingConfig(
    restoreEntries: readonly ProviderOnboardingConfigRestoreEntry[],
    locale?: string,
  ): Promise<void> {
    for (const entry of restoreEntries) {
      if (entry.previousValue !== undefined) {
        await this.setUserConfigValue({
          keyPath: entry.keyPath,
          value: entry.previousValue,
          locale,
        });
        continue;
      }

      await this.unsetUserConfigValue({
        keyPath: entry.keyPath,
        locale,
      });
    }
  }

  private async applyProviderOnboardingConfigMutation(options: {
    tool: AdapterSurface;
    provider: AdapterProviderKind;
    vendorBinding: AdapterVendorBindingKind;
    model: string;
    credentialRef: string;
    endpoint?: string;
    locale?: string;
  }): Promise<string[]> {
    const keyPaths = this.createProviderOnboardingConfigKeyPaths(options.tool);
    const configWrites = [
      {
        keyPath: keyPaths.transport,
        value: AdapterTransportKind.REMOTE_API,
      },
      {
        keyPath: keyPaths.provider,
        value: options.provider,
      },
      {
        keyPath: keyPaths.vendorBinding,
        value: options.vendorBinding,
      },
      {
        keyPath: keyPaths.model,
        value: options.model,
      },
      {
        keyPath: keyPaths.credentialRef,
        value: options.credentialRef,
      },
    ];

    for (const write of configWrites) {
      await this.setUserConfigValue({
        keyPath: write.keyPath,
        value: write.value,
        locale: options.locale,
      });
    }

    const configTargets = configWrites.map((write) => write.keyPath);
    if (options.endpoint !== undefined) {
      if (options.endpoint.trim().length > 0) {
        await this.setUserConfigValue({
          keyPath: keyPaths.endpoint,
          value: options.endpoint.trim(),
          locale: options.locale,
        });
      } else {
        await this.unsetUserConfigValue({
          keyPath: keyPaths.endpoint,
          locale: options.locale,
        });
      }
      configTargets.push(keyPaths.endpoint);
    }

    await this.unsetUserConfigValue({
      keyPath: keyPaths.credentialEnvVar,
      locale: options.locale,
    });
    configTargets.push(keyPaths.credentialEnvVar);
    return configTargets;
  }

  private async deleteManagedSecret(request: {
    keyName: string;
    backendId?: string;
    locale?: string;
  }): Promise<void> {
    const context = this.resolveWorkspaceContext();
    await this.cliExecutor({
      args: [
        'secret',
        'delete',
        request.keyName,
        ...(request.backendId ? ['--backend', request.backendId] : []),
      ],
      currentWorkingDirectory: context.repositoryRoot,
      locale: request.locale,
    });
  }

  private resolveProviderOnboardingBackendId(
    availableBackends: readonly OrchestrationSecretBackendStatus[],
    requestedBackendId?: string,
    defaultBackendId?: string,
    selectedBackendId?: string,
  ): string {
    const writableBackends = availableBackends.filter((backend) => backend.available);
    const matchedRequestedBackend =
      requestedBackendId &&
      writableBackends.find((backend) => backend.backendId === requestedBackendId);
    if (requestedBackendId && !matchedRequestedBackend) {
      throw new RuntimeError(
        GovernorErrorCode.PROCESS_RUNTIME_BACKEND_UNAVAILABLE,
        `Requested secret backend ${requestedBackendId} is not writable for provider onboarding.`,
      );
    }
    if (matchedRequestedBackend) {
      return matchedRequestedBackend.backendId;
    }

    const matchedDefaultBackend =
      defaultBackendId &&
      writableBackends.find((backend) => backend.backendId === defaultBackendId);
    if (matchedDefaultBackend) {
      return matchedDefaultBackend.backendId;
    }
    if (defaultBackendId) {
      throw new RuntimeError(
        GovernorErrorCode.PROCESS_RUNTIME_BACKEND_UNAVAILABLE,
        `Default secret backend ${defaultBackendId} is not writable for provider onboarding.`,
      );
    }

    const matchedSelectedBackend =
      selectedBackendId &&
      writableBackends.find((backend) => backend.backendId === selectedBackendId);
    if (matchedSelectedBackend) {
      return matchedSelectedBackend.backendId;
    }
    if (selectedBackendId) {
      throw new RuntimeError(
        GovernorErrorCode.PROCESS_RUNTIME_BACKEND_UNAVAILABLE,
        `Selected secret backend ${selectedBackendId} is not writable for provider onboarding.`,
      );
    }

    const fallbackBackend = writableBackends[0];
    if (!fallbackBackend) {
      throw new RuntimeError(
        GovernorErrorCode.PROCESS_RUNTIME_BACKEND_UNAVAILABLE,
        'No writable secret backend is available for provider onboarding.',
      );
    }

    return fallbackBackend.backendId;
  }

  private findManagedSecretRecord(
    records: readonly OrchestrationSecretRecord[],
    keyName: string,
    preferredBackendId?: string,
  ): OrchestrationSecretRecord | undefined {
    return (
      (preferredBackendId
        ? records.find(
            (record) =>
              record.keyName === keyName &&
              record.backendId === preferredBackendId &&
              record.exists,
          )
        : undefined) ?? records.find((record) => record.keyName === keyName && record.exists)
    );
  }

  private readUserConfigEntryValue(
    entries: readonly OrchestrationUserConfigEntry[] | undefined,
    tool: AdapterSurface,
    suffix: string,
  ): string | undefined {
    return entries?.find((entry) => entry.keyPath === `tools.${tool}.${suffix}`)?.value;
  }

  private readUserConfigEntryValueByKeyPath(
    entries: readonly OrchestrationUserConfigEntry[] | undefined,
    keyPath: string,
  ): string | undefined {
    return entries?.find((entry) => entry.keyPath === keyPath)?.value;
  }

  private resolveDefaultRemoteApiProvider(tool: AdapterSurface): AdapterProviderKind {
    return tool === AdapterSurface.CLAUDE_CODE
      ? AdapterProviderKind.ANTHROPIC
      : AdapterProviderKind.OPENAI;
  }

  private resolveProviderOnboardingCompatibility(
    tool: AdapterSurface,
    provider: AdapterProviderKind,
  ): {
    provider: AdapterProviderKind;
    vendorBinding: AdapterVendorBindingKind;
  } {
    switch (tool) {
      case AdapterSurface.CODEX:
        if (provider !== AdapterProviderKind.OPENAI) {
          throw new RuntimeError(
            GovernorErrorCode.PROCESS_RUNTIME_BACKEND_UNAVAILABLE,
            `Provider onboarding only supports provider ${AdapterProviderKind.OPENAI} for tool ${tool}.`,
          );
        }
        return {
          provider: AdapterProviderKind.OPENAI,
          vendorBinding: AdapterVendorBindingKind.OPENAI_RESPONSES,
        };
      case AdapterSurface.CLAUDE_CODE:
        if (provider !== AdapterProviderKind.ANTHROPIC) {
          throw new RuntimeError(
            GovernorErrorCode.PROCESS_RUNTIME_BACKEND_UNAVAILABLE,
            `Provider onboarding only supports provider ${AdapterProviderKind.ANTHROPIC} for tool ${tool}.`,
          );
        }
        return {
          provider: AdapterProviderKind.ANTHROPIC,
          vendorBinding: AdapterVendorBindingKind.ANTHROPIC_MESSAGES,
        };
      default:
        throw new RuntimeError(
          GovernorErrorCode.PROCESS_RUNTIME_BACKEND_UNAVAILABLE,
          `Provider onboarding is not supported for tool ${tool}.`,
        );
    }
  }

  private resolveDefaultCredentialRefSelector(provider: AdapterProviderKind): string {
    return `${CREDENTIAL_SELECTOR_PREFIX}${provider}/api-key`;
  }

  private extractManagedSecretKeyName(selector: string): string | undefined {
    if (!selector.startsWith(CREDENTIAL_SELECTOR_PREFIX)) {
      return undefined;
    }

    const keyName = selector.slice(CREDENTIAL_SELECTOR_PREFIX.length).trim();
    return keyName.length > 0 ? keyName : undefined;
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
