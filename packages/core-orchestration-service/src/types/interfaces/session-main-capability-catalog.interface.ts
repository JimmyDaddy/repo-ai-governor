import type {
  SessionMainCapabilityBackingExecution,
  SessionMainCapabilityCatalogOwnerModuleId,
  SessionMainCapabilityDescriptorVersion,
  SessionMainCapabilityId,
  SessionMainCapabilityInteractionModel,
  SessionMainCapabilityPrimaryEntry,
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
  readonly interactionModel: SessionMainCapabilityInteractionModel;
  readonly primaryEntry: SessionMainCapabilityPrimaryEntry;
  readonly backingExecution: SessionMainCapabilityBackingExecution;
  readonly confirmationRequired: boolean;
  readonly deterministicActionName?: string;
  readonly roleAliasTarget?: string;
  readonly legacyCommandAlias?: string;
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
  readonly interactionModel: SessionMainCapabilityInteractionModel;
  readonly primaryEntry: SessionMainCapabilityPrimaryEntry;
  readonly backingExecution: SessionMainCapabilityBackingExecution;
  readonly confirmationRequired: boolean;
  readonly deterministicActionName?: string;
  readonly roleAliasTarget?: string;
  readonly legacyCommandAlias?: string;
  readonly title: string;
  readonly summary: string;
  readonly detail: string;
  readonly examplePrompts: readonly string[];
  readonly relatedCapabilityIds: readonly SessionMainCapabilityId[];
}
