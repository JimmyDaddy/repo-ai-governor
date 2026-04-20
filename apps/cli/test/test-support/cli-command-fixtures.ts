import { CliAgentOnboardingPreset } from '../../src/constants/cli-agent-onboarding.constant.js';
import { CliConnectAction } from '../../src/constants/cli-connect.constant.js';
import { CliGovernanceCheckStatus } from '../../src/constants/cli-governance-runtime.constant.js';
import { CliInteractiveUiMode } from '../../src/constants/cli-interactive-shell.constant.js';
import { CliReactThemePreset } from '../../src/constants/cli-react-theme.constant.js';
import type {
  CliAdapterSecretBackendDiagnostics,
  CliAdapterVerificationResolution,
  CliNormalizedRuntimeDebugOptions,
  CliRuntimeDebugOptions,
} from '../../src/types/index.js';

const DEFAULT_SECRET_BACKENDS: CliAdapterSecretBackendDiagnostics = {
  selectedBackendId: null,
  defaultBackendId: null,
  indexPath: '/tmp/repo-ai-governor-test-secret-index.json',
  backends: [],
};

export function createCliAdapterVerificationResolution(
  overrides: Partial<CliAdapterVerificationResolution> = {},
): CliAdapterVerificationResolution {
  return {
    overallStatus: CliGovernanceCheckStatus.PASS,
    tools: [],
    roleEvaluations: [],
    requiredRoleCount: 0,
    requiredRoleFailedCount: 0,
    degradedRoleCount: 0,
    fallbackRoleCount: 0,
    nextActions: [],
    secretBackends: overrides.secretBackends ?? DEFAULT_SECRET_BACKENDS,
    credentialReferences: overrides.credentialReferences ?? [],
    ...overrides,
  };
}

export function createCliNormalizedRuntimeDebugOptions(
  overrides: Partial<CliNormalizedRuntimeDebugOptions> = {},
): CliNormalizedRuntimeDebugOptions {
  return {
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
    connectAction: CliConnectAction.GENERATE,
    connectCandidatePath: null,
    connectLatest: false,
    connectForce: false,
    connectRollbackEnabled: true,
    connectWriteMode: null,
    presetId: CliAgentOnboardingPreset.MULTI_TOOL_DEFAULT,
    requestedTools: [],
    overwrite: false,
    singleToolAllRoles: false,
    roleBindingOverrides: [],
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
    ...overrides,
  };
}

export function createCliRuntimeDebugOptions(
  overrides: Partial<CliRuntimeDebugOptions> = {},
): CliRuntimeDebugOptions {
  const normalizedOverrides = overrides as Partial<CliNormalizedRuntimeDebugOptions>;
  return {
    ...createCliNormalizedRuntimeDebugOptions(normalizedOverrides),
    ...overrides,
  };
}
