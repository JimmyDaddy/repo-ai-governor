import type {
  AgentAvailabilityStatus,
  AgentCapabilitySupportLevel,
} from "@repo-ai-governor/adapter-sdk";
import type { AdapterAvailability, AdapterSurface } from "@repo-ai-governor/shared";
import type {
  CliAdapterRoleSelectionSource,
  CliGovernanceCheckStatus,
} from "../../constants/cli-governance-runtime.constant.js";

/**
 * Defines one local adapter probe override row used by CLI runtime tests and diagnostics.
 */
export interface CliLocalAdapterProbeOverride {
  availabilityStatus: AgentAvailabilityStatus;
  unavailableReasons: string[];
}

/**
 * Defines one tool-level adapter probe snapshot retained by verification diagnostics.
 */
export interface CliAdapterToolProbeSnapshot {
  toolId: AdapterSurface;
  enabled: boolean;
  configuredAvailability: AdapterAvailability | null;
  availabilityStatus: AgentAvailabilityStatus;
  unavailableReasons: string[];
  capabilitySupportByCapability: Map<string, AgentCapabilitySupportLevel>;
  failureAttributions: string[];
}

/**
 * Defines one role-level routing evaluation derived from tool probe snapshots.
 */
export interface CliAdapterRoleEvaluation {
  roleId: string;
  roleProfileId: string;
  required: boolean;
  primarySurface: AdapterSurface;
  selectedSurface: AdapterSurface | null;
  selectedBy: CliAdapterRoleSelectionSource;
  unsupportedCapabilities: string[];
  degradedCapabilities: string[];
  unavailableReasons: string[];
  failureAttributions: string[];
  status: CliGovernanceCheckStatus;
}

/**
 * Defines the aggregated adapter verification resolution consumed by CLI commands.
 */
export interface CliAdapterVerificationResolution {
  overallStatus: CliGovernanceCheckStatus;
  tools: CliAdapterToolProbeSnapshot[];
  roleEvaluations: CliAdapterRoleEvaluation[];
  requiredRoleCount: number;
  requiredRoleFailedCount: number;
  degradedRoleCount: number;
  fallbackRoleCount: number;
  nextActions: string[];
}

/**
 * Defines one local adapter readiness resolution returned by config/probe checks.
 */
export interface CliLocalAdapterProbeResolution {
  availabilityStatus: AgentAvailabilityStatus;
  unavailableReasons: string[];
}
