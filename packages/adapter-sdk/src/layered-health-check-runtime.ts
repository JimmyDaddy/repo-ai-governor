import {
  type AdapterCredentialSource,
  type AdapterEndpointSource,
  type AdapterProviderKind,
  AdapterRequestCancellationMode,
  type AdapterTransportKind,
  type AdapterVendorBindingKind,
} from '@repo-ai-governor/shared';
import { AgentAvailabilityStatus } from './constants/index.js';
import type {
  AgentHealthCheckDiagnostic,
  AgentHealthCheckLayer,
  AgentHealthCheckLayerStatus,
  AgentLayeredHealthCheckResult,
} from './types/index.js';

type LayerStatusMap = Record<AgentHealthCheckLayer, AgentHealthCheckLayerStatus>;

const PASS_STATUS: AgentHealthCheckLayerStatus = 'pass';
const WARN_STATUS: AgentHealthCheckLayerStatus = 'warn';
const FAIL_STATUS: AgentHealthCheckLayerStatus = 'fail';

const STATUS_PRIORITY: Record<AgentHealthCheckLayerStatus, number> = {
  pass: 0,
  warn: 1,
  fail: 2,
};

export interface BuildLayeredHealthCheckInput {
  adapterId: string;
  surfaceId: string;
  availabilityStatus: AgentAvailabilityStatus;
  selectedEntrypoint: string;
  routeKey: string;
  routeRequirements?: string[];
  fallbackAllowed?: boolean;
  unavailableReasons?: string[];
  diagnostics?: AgentHealthCheckDiagnostic[];
  unsupportedCapabilities?: string[];
  degradedCapabilities?: string[];
  transportKind?: AdapterTransportKind | null;
  providerKind?: AdapterProviderKind | null;
  vendorBindingKind?: AdapterVendorBindingKind | null;
  model?: string | null;
  credentialSource?: AdapterCredentialSource | null;
  endpointSource?: AdapterEndpointSource | null;
  requestCancellationMode?: AdapterRequestCancellationMode;
}

/**
 * Builds one layered adapter health-check result from stable reason codes and diagnostics.
 * Existing legacy unavailable reasons are still accepted and normalized into the layered shape.
 */
export function buildLayeredHealthCheckResult(
  input: BuildLayeredHealthCheckInput,
): AgentLayeredHealthCheckResult {
  const statuses: LayerStatusMap = {
    install: PASS_STATUS,
    auth: PASS_STATUS,
    protocol: PASS_STATUS,
    semantic: PASS_STATUS,
    route_capability: PASS_STATUS,
  };
  const diagnostics: AgentHealthCheckDiagnostic[] = [];
  const reasonCodes: string[] = [];

  const pushDiagnostic = (diagnostic: AgentHealthCheckDiagnostic): void => {
    const diagnosticKey = `${diagnostic.layer}:${diagnostic.status}:${diagnostic.code}:${diagnostic.detail ?? ''}`;
    if (
      diagnostics.some(
        (candidate) =>
          `${candidate.layer}:${candidate.status}:${candidate.code}:${candidate.detail ?? ''}` ===
          diagnosticKey,
      )
    ) {
      return;
    }
    diagnostics.push(diagnostic);
    if (!reasonCodes.includes(diagnostic.code)) {
      reasonCodes.push(diagnostic.code);
    }
    statuses[diagnostic.layer] = mergeLayerStatus(statuses[diagnostic.layer], diagnostic.status);
  };

  for (const reason of input.unavailableReasons ?? []) {
    addLegacyReasonDiagnostics(reason, pushDiagnostic);
  }

  if ((input.unsupportedCapabilities?.length ?? 0) > 0) {
    pushDiagnostic({
      layer: 'route_capability',
      status: FAIL_STATUS,
      code: 'route.capability_unsupported',
      detail: input.unsupportedCapabilities?.join('|'),
    });
  }

  if ((input.degradedCapabilities?.length ?? 0) > 0) {
    pushDiagnostic({
      layer: 'route_capability',
      status: WARN_STATUS,
      code: 'route.capability_degraded',
      detail: input.degradedCapabilities?.join('|'),
    });
  }

  for (const diagnostic of input.diagnostics ?? []) {
    pushDiagnostic(diagnostic);
  }

  if (
    input.availabilityStatus === AgentAvailabilityStatus.UNAVAILABLE &&
    diagnostics.length === 0
  ) {
    pushDiagnostic({
      layer: 'protocol',
      status: FAIL_STATUS,
      code: 'protocol.unavailable_without_detail',
      detail: input.surfaceId,
    });
  }

  if (input.availabilityStatus === AgentAvailabilityStatus.DEGRADED && diagnostics.length === 0) {
    pushDiagnostic({
      layer: 'semantic',
      status: WARN_STATUS,
      code: 'semantic.degraded_without_detail',
      detail: input.surfaceId,
    });
  }

  return {
    adapterId: input.adapterId,
    surfaceId: input.surfaceId,
    probeTimestamp: new Date().toISOString(),
    installStatus: statuses.install,
    authStatus: statuses.auth,
    protocolStatus: statuses.protocol,
    semanticStatus: statuses.semantic,
    routeCapabilityStatus: statuses.route_capability,
    overallStatus: deriveOverallStatus(input.availabilityStatus, statuses),
    reasonCodes,
    diagnostics,
    selectedEntrypoint: input.selectedEntrypoint,
    routeKey: input.routeKey,
    routeRequirements: [...(input.routeRequirements ?? [])],
    fallbackAllowed: input.fallbackAllowed ?? true,
    transportKind: input.transportKind ?? null,
    providerKind: input.providerKind ?? null,
    vendorBindingKind: input.vendorBindingKind ?? null,
    model: input.model ?? null,
    credentialSource: input.credentialSource ?? null,
    endpointSource: input.endpointSource ?? null,
    requestCancellationMode:
      input.requestCancellationMode ?? AdapterRequestCancellationMode.NOT_SUPPORTED,
  };
}

/**
 * Convenience wrapper for legacy probe results that only expose availability + reason strings.
 */
export function createLayeredHealthCheckFromLegacyReasons(
  input: Omit<BuildLayeredHealthCheckInput, 'diagnostics'>,
): AgentLayeredHealthCheckResult {
  return buildLayeredHealthCheckResult(input);
}

function mergeLayerStatus(
  currentStatus: AgentHealthCheckLayerStatus,
  nextStatus: AgentHealthCheckLayerStatus,
): AgentHealthCheckLayerStatus {
  return STATUS_PRIORITY[nextStatus] > STATUS_PRIORITY[currentStatus] ? nextStatus : currentStatus;
}

function deriveOverallStatus(
  availabilityStatus: AgentAvailabilityStatus,
  statuses: LayerStatusMap,
): AgentAvailabilityStatus {
  if (
    availabilityStatus === AgentAvailabilityStatus.UNAVAILABLE ||
    statuses.install === FAIL_STATUS ||
    statuses.auth === FAIL_STATUS ||
    statuses.protocol === FAIL_STATUS
  ) {
    return AgentAvailabilityStatus.UNAVAILABLE;
  }

  if (
    availabilityStatus === AgentAvailabilityStatus.DEGRADED ||
    statuses.semantic !== PASS_STATUS ||
    statuses.route_capability !== PASS_STATUS
  ) {
    return AgentAvailabilityStatus.DEGRADED;
  }

  return AgentAvailabilityStatus.AVAILABLE;
}

function addLegacyReasonDiagnostics(
  reason: string,
  pushDiagnostic: (diagnostic: AgentHealthCheckDiagnostic) => void,
): void {
  if (reason.startsWith('command_missing:')) {
    const [, surface, command] = reason.split(':', 3);
    pushDiagnostic({
      layer: 'install',
      status: FAIL_STATUS,
      code: 'install.command_missing',
      detail: [surface, command].filter(Boolean).join(':'),
    });
    return;
  }

  if (reason.startsWith('command_probe_failed:')) {
    const [, surface, command, ...detailParts] = reason.split(':');
    pushDiagnostic({
      layer: 'install',
      status: FAIL_STATUS,
      code: 'install.command_probe_failed',
      detail: [surface, command, detailParts.join(':')].filter(Boolean).join(':'),
    });
    return;
  }

  if (reason.startsWith('credential_missing:')) {
    const detail = reason.slice('credential_missing:'.length);
    pushDiagnostic({
      layer: 'auth',
      status: FAIL_STATUS,
      code: 'auth.credential_missing',
      ...(detail.length > 0 ? { detail } : {}),
    });
    return;
  }

  if (reason === 'login_required') {
    pushDiagnostic({
      layer: 'auth',
      status: FAIL_STATUS,
      code: 'auth.login_required',
    });
    return;
  }

  if (reason.startsWith('health_check_timeout:')) {
    const [, surface] = reason.split(':', 2);
    pushDiagnostic({
      layer: 'protocol',
      status: FAIL_STATUS,
      code: 'protocol.health_check_timeout',
      detail: surface,
    });
    return;
  }

  if (reason.startsWith('health_check_invalid_response:')) {
    const [, surface, ...responseParts] = reason.split(':');
    pushDiagnostic({
      layer: 'semantic',
      status: FAIL_STATUS,
      code: 'semantic.invalid_response',
      detail: [surface, responseParts.join(':')].filter(Boolean).join(':'),
    });
    return;
  }

  if (reason.startsWith('health_check_failed:')) {
    const [, surface, ...detailParts] = reason.split(':');
    const detail = detailParts.join(':');
    let code = 'protocol.health_check_failed';
    if (detail === 'rate_limited') {
      code = 'protocol.rate_limited';
    } else if (detail === 'quota_exhausted') {
      code = 'protocol.quota_exhausted';
    } else if (detail === 'unauthorized' || detail === 'forbidden') {
      pushDiagnostic({
        layer: 'auth',
        status: FAIL_STATUS,
        code: `auth.${detail}`,
        detail: surface,
      });
      return;
    }
    pushDiagnostic({
      layer: 'protocol',
      status: FAIL_STATUS,
      code,
      detail: [surface, detail].filter(Boolean).join(':'),
    });
    return;
  }

  if (reason.startsWith('probe_failed:')) {
    pushDiagnostic({
      layer: 'protocol',
      status: FAIL_STATUS,
      code: 'protocol.probe_failed',
      detail: reason.slice('probe_failed:'.length),
    });
    return;
  }

  if (reason.startsWith('capability_gap:')) {
    const [, surface, capabilities] = reason.split(':', 3);
    pushDiagnostic({
      layer: 'route_capability',
      status: FAIL_STATUS,
      code: 'route.capability_gap',
      detail: [surface, capabilities].filter(Boolean).join(':'),
    });
    return;
  }

  if (reason.startsWith('surface_unavailable:')) {
    const surfaceUnavailablePrefix = 'surface_unavailable:';
    const payload = reason.slice(surfaceUnavailablePrefix.length);
    const separatorIndex = payload.indexOf(':');
    const surface = separatorIndex >= 0 ? payload.slice(0, separatorIndex) : payload;
    const nestedReasons = separatorIndex >= 0 ? payload.slice(separatorIndex + 1) : '';
    pushDiagnostic({
      layer: 'route_capability',
      status: FAIL_STATUS,
      code: 'route.surface_unavailable',
      detail: surface,
    });
    if (nestedReasons) {
      for (const nestedReason of nestedReasons.split('|')) {
        if (nestedReason.trim().length === 0 || nestedReason === 'unavailable') {
          continue;
        }
        addLegacyReasonDiagnostics(nestedReason, pushDiagnostic);
      }
    }
    return;
  }

  if (reason.startsWith('disabled_by_config:')) {
    pushDiagnostic({
      layer: 'route_capability',
      status: FAIL_STATUS,
      code: 'route.disabled_by_config',
      detail: reason.slice('disabled_by_config:'.length),
    });
    return;
  }

  if (reason.startsWith('tool_disabled:')) {
    pushDiagnostic({
      layer: 'route_capability',
      status: FAIL_STATUS,
      code: 'route.tool_disabled',
      detail: reason.slice('tool_disabled:'.length),
    });
    return;
  }

  if (reason.startsWith('missing_tool_snapshot:')) {
    pushDiagnostic({
      layer: 'route_capability',
      status: FAIL_STATUS,
      code: 'route.missing_tool_snapshot',
      detail: reason.slice('missing_tool_snapshot:'.length),
    });
    return;
  }

  if (reason.startsWith('missing_role_binding:')) {
    pushDiagnostic({
      layer: 'route_capability',
      status: FAIL_STATUS,
      code: 'route.missing_role_binding',
      detail: reason.slice('missing_role_binding:'.length),
    });
    return;
  }

  if (reason.startsWith('local_model_config_missing:')) {
    const [, surface, missingKeys] = reason.split(':', 3);
    pushDiagnostic({
      layer: 'install',
      status: FAIL_STATUS,
      code: 'install.local_model_config_missing',
      detail: [surface, missingKeys].filter(Boolean).join(':'),
    });
    return;
  }

  if (reason.startsWith('local_model_model_missing:')) {
    const [, surface, model] = reason.split(':', 3);
    pushDiagnostic({
      layer: 'route_capability',
      status: FAIL_STATUS,
      code: 'route.local_model_model_missing',
      detail: [surface, model].filter(Boolean).join(':'),
    });
    return;
  }

  if (reason.startsWith('local_model_endpoint_unreachable:')) {
    const [, surface, endpoint, ...detailParts] = reason.split(':');
    pushDiagnostic({
      layer: 'install',
      status: FAIL_STATUS,
      code: 'install.local_model_endpoint_unreachable',
      detail: [surface, endpoint, detailParts.join(':')].filter(Boolean).join(':'),
    });
    return;
  }

  if (reason.startsWith('local_model_probe_invalid_response:')) {
    const [, surface, endpoint] = reason.split(':', 3);
    pushDiagnostic({
      layer: 'protocol',
      status: FAIL_STATUS,
      code: 'protocol.local_model_invalid_response',
      detail: [surface, endpoint].filter(Boolean).join(':'),
    });
    return;
  }

  pushDiagnostic({
    layer: 'protocol',
    status: WARN_STATUS,
    code: 'protocol.unclassified_reason',
    detail: reason,
  });
}
