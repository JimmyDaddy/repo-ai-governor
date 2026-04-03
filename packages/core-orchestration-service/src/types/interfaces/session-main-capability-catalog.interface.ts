import type {
  SessionMainCapabilityCatalogOwnerModuleId,
  SessionMainCapabilityDescriptorVersion,
  SessionMainCapabilityId,
} from '../aliases/session-main-capability.type.js';
import type { SessionMainHandoffExecutionMode } from '../aliases/session-main-supervisor.type.js';

/**
 * Declares one locale-neutral governed capability descriptor owned by orchestration.
 */
export interface SessionMainCapabilityDescriptorSeed {
  readonly capabilityId: SessionMainCapabilityId;
  readonly ownerModuleId: SessionMainCapabilityCatalogOwnerModuleId;
  readonly descriptorVersion: SessionMainCapabilityDescriptorVersion;
  readonly skillId: string;
  readonly skillVersion: string;
  readonly executionIntent: string;
  readonly suggestedSlashCommand: string;
  readonly handoffExecutionMode: SessionMainHandoffExecutionMode;
  readonly confirmationRequired: boolean;
  readonly titleKey: string;
  readonly summaryKey: string;
  readonly detailKey: string;
  readonly examplePromptKeys: readonly string[];
  readonly relatedCapabilityIds: readonly SessionMainCapabilityId[];
}

/**
 * Declares one localized governed capability descriptor view rendered from the seed contract.
 */
export interface SessionMainCapabilityDescriptorView {
  readonly capabilityId: SessionMainCapabilityId;
  readonly ownerModuleId: SessionMainCapabilityCatalogOwnerModuleId;
  readonly descriptorVersion: SessionMainCapabilityDescriptorVersion;
  readonly skillId: string;
  readonly skillVersion: string;
  readonly executionIntent: string;
  readonly suggestedSlashCommand: string;
  readonly handoffExecutionMode: SessionMainHandoffExecutionMode;
  readonly confirmationRequired: boolean;
  readonly title: string;
  readonly summary: string;
  readonly detail: string;
  readonly examplePrompts: readonly string[];
  readonly relatedCapabilityIds: readonly SessionMainCapabilityId[];
}
