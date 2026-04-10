import {
  SESSION_MAIN_CAPABILITY_BACKING_EXECUTION,
  SESSION_MAIN_CAPABILITY_CATALOG_OWNER_MODULE_ID,
  SESSION_MAIN_CAPABILITY_DESCRIPTOR_VERSION,
  SESSION_MAIN_CAPABILITY_ID,
  SESSION_MAIN_CAPABILITY_INTERACTION_MODEL,
  SESSION_MAIN_CAPABILITY_PRIMARY_ENTRY,
  SESSION_MAIN_HANDOFF_EXECUTION_MODE,
} from './constants/index.js';
import type {
  SessionMainCapabilityDescriptorSeed,
  SessionMainCapabilityDescriptorView,
  SessionMainCapabilityId,
} from './types/index.js';

const SESSION_MAIN_CAPABILITY_SKILL_VERSION = '2026-04-08';
const SESSION_MAIN_CAPABILITY_TRANSLATION_KEY_PREFIX = 'sessionMainCapabilities.catalog';

/**
 * Owns the canonical governed capability catalog used by `session.main`.
 *
 * Why this exists:
 * the orchestration layer needs one service-owned source of truth that can later drive help
 * appendix rendering, explanation answers, discoverability, and shared-session metadata.
 */
export class LocalOrchestrationServiceSessionMainCapabilityCatalog {
  private readonly descriptorSeeds = Object.freeze(
    [
      this.createDescriptorSeed({
        capabilityId: SESSION_MAIN_CAPABILITY_ID.HELP,
        skillId: 'skill.help.overview',
        executionIntent: 'help.overview',
        suggestedSlashCommand: '/help',
        handoffExecutionMode: SESSION_MAIN_HANDOFF_EXECUTION_MODE.DIRECT_EXECUTE,
        interactionModel: SESSION_MAIN_CAPABILITY_INTERACTION_MODEL.EXPLAIN_ONLY,
        primaryEntry: SESSION_MAIN_CAPABILITY_PRIMARY_ENTRY.CONVERSATIONAL_ANSWER,
        backingExecution: SESSION_MAIN_CAPABILITY_BACKING_EXECUTION.PURE_COMMAND,
        confirmationRequired: false,
        relatedCapabilityIds: [
          SESSION_MAIN_CAPABILITY_ID.CONNECT,
          SESSION_MAIN_CAPABILITY_ID.DOCTOR,
          SESSION_MAIN_CAPABILITY_ID.PLAN,
        ],
      }),
      this.createDescriptorSeed({
        capabilityId: SESSION_MAIN_CAPABILITY_ID.CONNECT,
        skillId: 'skill.connect.adapters',
        executionIntent: 'connect.adapters.bootstrap',
        suggestedSlashCommand: '/connect',
        handoffExecutionMode: SESSION_MAIN_HANDOFF_EXECUTION_MODE.PREVIEW_CONFIRM,
        interactionModel: SESSION_MAIN_CAPABILITY_INTERACTION_MODEL.DETERMINISTIC_UTILITY,
        primaryEntry: SESSION_MAIN_CAPABILITY_PRIMARY_ENTRY.SLASH_COMMAND,
        backingExecution: SESSION_MAIN_CAPABILITY_BACKING_EXECUTION.PURE_COMMAND,
        confirmationRequired: true,
        relatedCapabilityIds: [SESSION_MAIN_CAPABILITY_ID.DOCTOR],
      }),
      this.createDescriptorSeed({
        capabilityId: SESSION_MAIN_CAPABILITY_ID.BRANCH_SWITCH,
        skillId: 'skill.workspace.switch_branch',
        executionIntent: 'workspace.branch_switch',
        suggestedSlashCommand: '/workspace switch-branch',
        handoffExecutionMode: SESSION_MAIN_HANDOFF_EXECUTION_MODE.PREVIEW_CONFIRM,
        interactionModel: SESSION_MAIN_CAPABILITY_INTERACTION_MODEL.DETERMINISTIC_UTILITY,
        primaryEntry: SESSION_MAIN_CAPABILITY_PRIMARY_ENTRY.SLASH_COMMAND,
        backingExecution: SESSION_MAIN_CAPABILITY_BACKING_EXECUTION.PURE_COMMAND,
        confirmationRequired: true,
        relatedCapabilityIds: [SESSION_MAIN_CAPABILITY_ID.DOCTOR, SESSION_MAIN_CAPABILITY_ID.RUN],
      }),
      this.createDescriptorSeed({
        capabilityId: SESSION_MAIN_CAPABILITY_ID.DOCTOR,
        skillId: 'skill.doctor.environment',
        executionIntent: 'doctor.adapters',
        suggestedSlashCommand: '/doctor',
        handoffExecutionMode: SESSION_MAIN_HANDOFF_EXECUTION_MODE.DIRECT_EXECUTE,
        interactionModel: SESSION_MAIN_CAPABILITY_INTERACTION_MODEL.DETERMINISTIC_UTILITY,
        primaryEntry: SESSION_MAIN_CAPABILITY_PRIMARY_ENTRY.SLASH_COMMAND,
        backingExecution: SESSION_MAIN_CAPABILITY_BACKING_EXECUTION.PURE_COMMAND,
        confirmationRequired: false,
        relatedCapabilityIds: [SESSION_MAIN_CAPABILITY_ID.CONNECT],
      }),
      this.createDescriptorSeed({
        capabilityId: SESSION_MAIN_CAPABILITY_ID.WORKFLOW,
        skillId: 'skill.workflow.preview',
        executionIntent: 'workflow.preview',
        suggestedSlashCommand: '/workflow',
        handoffExecutionMode: SESSION_MAIN_HANDOFF_EXECUTION_MODE.DIRECT_EXECUTE,
        interactionModel: SESSION_MAIN_CAPABILITY_INTERACTION_MODEL.DETERMINISTIC_UTILITY,
        primaryEntry: SESSION_MAIN_CAPABILITY_PRIMARY_ENTRY.SLASH_COMMAND,
        backingExecution: SESSION_MAIN_CAPABILITY_BACKING_EXECUTION.PURE_COMMAND,
        confirmationRequired: false,
        relatedCapabilityIds: [SESSION_MAIN_CAPABILITY_ID.PLAN, SESSION_MAIN_CAPABILITY_ID.RUN],
      }),
      this.createDescriptorSeed({
        capabilityId: SESSION_MAIN_CAPABILITY_ID.PLAN,
        skillId: 'skill.plan.task',
        executionIntent: 'plan.generate',
        suggestedSlashCommand: '/plan',
        handoffExecutionMode: SESSION_MAIN_HANDOFF_EXECUTION_MODE.DIRECT_EXECUTE,
        interactionModel: SESSION_MAIN_CAPABILITY_INTERACTION_MODEL.AI_FIXED_WORKFLOW,
        primaryEntry: SESSION_MAIN_CAPABILITY_PRIMARY_ENTRY.SLASH_COMMAND,
        backingExecution: SESSION_MAIN_CAPABILITY_BACKING_EXECUTION.TEMPLATED_AI_WORKFLOW,
        confirmationRequired: false,
        relatedCapabilityIds: [SESSION_MAIN_CAPABILITY_ID.REVIEW, SESSION_MAIN_CAPABILITY_ID.RUN],
        deterministicActionName: 'plan sync',
        roleAliasTarget: 'planner',
        legacyCommandAlias: 'repo-ai-governor plan --output pretty',
      }),
      this.createDescriptorSeed({
        capabilityId: SESSION_MAIN_CAPABILITY_ID.REVIEW,
        skillId: 'skill.review.code',
        executionIntent: 'review.start',
        suggestedSlashCommand: '/review',
        handoffExecutionMode: SESSION_MAIN_HANDOFF_EXECUTION_MODE.DIRECT_EXECUTE,
        interactionModel: SESSION_MAIN_CAPABILITY_INTERACTION_MODEL.AI_FIXED_WORKFLOW,
        primaryEntry: SESSION_MAIN_CAPABILITY_PRIMARY_ENTRY.SLASH_COMMAND,
        backingExecution: SESSION_MAIN_CAPABILITY_BACKING_EXECUTION.TEMPLATED_AI_WORKFLOW,
        confirmationRequired: false,
        relatedCapabilityIds: [
          SESSION_MAIN_CAPABILITY_ID.PLAN,
          SESSION_MAIN_CAPABILITY_ID.REVIEW_VERIFY,
        ],
        roleAliasTarget: 'reviewer',
      }),
      this.createDescriptorSeed({
        capabilityId: SESSION_MAIN_CAPABILITY_ID.REVIEW_VERIFY,
        skillId: 'skill.review.verify',
        executionIntent: 'review.verify',
        suggestedSlashCommand: '/review verify',
        handoffExecutionMode: SESSION_MAIN_HANDOFF_EXECUTION_MODE.DIRECT_EXECUTE,
        interactionModel: SESSION_MAIN_CAPABILITY_INTERACTION_MODEL.AI_FIXED_WORKFLOW,
        primaryEntry: SESSION_MAIN_CAPABILITY_PRIMARY_ENTRY.SLASH_COMMAND,
        backingExecution: SESSION_MAIN_CAPABILITY_BACKING_EXECUTION.TEMPLATED_AI_WORKFLOW,
        confirmationRequired: false,
        relatedCapabilityIds: [SESSION_MAIN_CAPABILITY_ID.REVIEW],
        roleAliasTarget: 'reviewer',
      }),
      this.createDescriptorSeed({
        capabilityId: SESSION_MAIN_CAPABILITY_ID.RUN,
        skillId: 'skill.run.task',
        executionIntent: 'run.task',
        suggestedSlashCommand: '/run',
        handoffExecutionMode: SESSION_MAIN_HANDOFF_EXECUTION_MODE.PREVIEW_CONFIRM,
        interactionModel: SESSION_MAIN_CAPABILITY_INTERACTION_MODEL.PENDING_EXISTENCE_REVIEW,
        primaryEntry: SESSION_MAIN_CAPABILITY_PRIMARY_ENTRY.SLASH_COMMAND,
        backingExecution: SESSION_MAIN_CAPABILITY_BACKING_EXECUTION.PURE_COMMAND,
        confirmationRequired: true,
        relatedCapabilityIds: [
          SESSION_MAIN_CAPABILITY_ID.PLAN,
          SESSION_MAIN_CAPABILITY_ID.REVIEW,
          SESSION_MAIN_CAPABILITY_ID.WORKFLOW,
        ],
      }),
    ].map((descriptorSeed) => this.freezeDescriptorSeed(descriptorSeed)),
  );

  /**
   * Returns every locale-neutral capability descriptor seed in canonical catalog order.
   * @returns Frozen descriptor seeds for downstream consumers.
   */
  public listDescriptorSeeds(): readonly SessionMainCapabilityDescriptorSeed[] {
    return this.descriptorSeeds.map((descriptorSeed) => this.cloneDescriptorSeed(descriptorSeed));
  }

  /**
   * Resolves one locale-neutral capability descriptor by id.
   * @param capabilityId Governed capability id.
   * @returns Matching descriptor seed when present.
   */
  public getDescriptorSeed(
    capabilityId: SessionMainCapabilityId,
  ): SessionMainCapabilityDescriptorSeed | null {
    const descriptorSeed =
      this.descriptorSeeds.find((candidateSeed) => candidateSeed.capabilityId === capabilityId) ??
      null;
    return descriptorSeed === null ? null : this.cloneDescriptorSeed(descriptorSeed);
  }

  /**
   * Renders every governed capability descriptor into localized user-facing view data.
   * @param translate Shared translation function bound to the active locale.
   * @returns Localized descriptor views.
   */
  public listDescriptorViews(
    translate: (translationKey: string) => string,
  ): SessionMainCapabilityDescriptorView[] {
    return this.descriptorSeeds.map((descriptorSeed) =>
      this.renderDescriptorView(descriptorSeed, translate),
    );
  }

  /**
   * Resolves one localized governed capability descriptor by id.
   * @param capabilityId Governed capability id.
   * @param translate Shared translation function bound to the active locale.
   * @returns Localized descriptor view when present.
   */
  public getDescriptorView(
    capabilityId: SessionMainCapabilityId,
    translate: (translationKey: string) => string,
  ): SessionMainCapabilityDescriptorView | null {
    const descriptorSeed = this.getDescriptorSeed(capabilityId);
    if (descriptorSeed === null) {
      return null;
    }

    return this.renderDescriptorView(descriptorSeed, translate);
  }

  private createDescriptorSeed(options: {
    capabilityId: SessionMainCapabilityId;
    skillId: string;
    executionIntent: string;
    suggestedSlashCommand: string;
    handoffExecutionMode: SessionMainCapabilityDescriptorSeed['handoffExecutionMode'];
    interactionModel: SessionMainCapabilityDescriptorSeed['interactionModel'];
    primaryEntry: SessionMainCapabilityDescriptorSeed['primaryEntry'];
    backingExecution: SessionMainCapabilityDescriptorSeed['backingExecution'];
    confirmationRequired: boolean;
    relatedCapabilityIds: SessionMainCapabilityId[];
    deterministicActionName?: string;
    roleAliasTarget?: string;
    legacyCommandAlias?: string;
  }): SessionMainCapabilityDescriptorSeed {
    const translationPrefix = `${SESSION_MAIN_CAPABILITY_TRANSLATION_KEY_PREFIX}.${options.capabilityId}`;
    return {
      capabilityId: options.capabilityId,
      ownerModuleId: SESSION_MAIN_CAPABILITY_CATALOG_OWNER_MODULE_ID,
      descriptorVersion: SESSION_MAIN_CAPABILITY_DESCRIPTOR_VERSION,
      skillId: options.skillId,
      skillVersion: SESSION_MAIN_CAPABILITY_SKILL_VERSION,
      executionIntent: options.executionIntent,
      suggestedSlashCommand: options.suggestedSlashCommand,
      handoffExecutionMode: options.handoffExecutionMode,
      interactionModel: options.interactionModel,
      primaryEntry: options.primaryEntry,
      backingExecution: options.backingExecution,
      confirmationRequired: options.confirmationRequired,
      ...(options.deterministicActionName
        ? { deterministicActionName: options.deterministicActionName }
        : {}),
      ...(options.roleAliasTarget ? { roleAliasTarget: options.roleAliasTarget } : {}),
      ...(options.legacyCommandAlias ? { legacyCommandAlias: options.legacyCommandAlias } : {}),
      titleKey: `${translationPrefix}.title`,
      summaryKey: `${translationPrefix}.summary`,
      detailKey: `${translationPrefix}.detail`,
      examplePromptKeys: [`${translationPrefix}.examples.0`, `${translationPrefix}.examples.1`],
      relatedCapabilityIds: [...options.relatedCapabilityIds],
    };
  }

  private freezeDescriptorSeed(
    descriptorSeed: SessionMainCapabilityDescriptorSeed,
  ): Readonly<SessionMainCapabilityDescriptorSeed> {
    return Object.freeze({
      ...descriptorSeed,
      examplePromptKeys: Object.freeze([...descriptorSeed.examplePromptKeys]),
      relatedCapabilityIds: Object.freeze([...descriptorSeed.relatedCapabilityIds]),
    });
  }

  private cloneDescriptorSeed(
    descriptorSeed: SessionMainCapabilityDescriptorSeed,
  ): SessionMainCapabilityDescriptorSeed {
    return {
      ...descriptorSeed,
      examplePromptKeys: [...descriptorSeed.examplePromptKeys],
      relatedCapabilityIds: [...descriptorSeed.relatedCapabilityIds],
    };
  }

  private renderDescriptorView(
    descriptorSeed: SessionMainCapabilityDescriptorSeed,
    translate: (translationKey: string) => string,
  ): SessionMainCapabilityDescriptorView {
    return {
      capabilityId: descriptorSeed.capabilityId,
      ownerModuleId: descriptorSeed.ownerModuleId,
      descriptorVersion: descriptorSeed.descriptorVersion,
      skillId: descriptorSeed.skillId,
      skillVersion: descriptorSeed.skillVersion,
      executionIntent: descriptorSeed.executionIntent,
      suggestedSlashCommand: descriptorSeed.suggestedSlashCommand,
      handoffExecutionMode: descriptorSeed.handoffExecutionMode,
      interactionModel: descriptorSeed.interactionModel,
      primaryEntry: descriptorSeed.primaryEntry,
      backingExecution: descriptorSeed.backingExecution,
      confirmationRequired: descriptorSeed.confirmationRequired,
      ...(descriptorSeed.deterministicActionName
        ? { deterministicActionName: descriptorSeed.deterministicActionName }
        : {}),
      ...(descriptorSeed.roleAliasTarget
        ? { roleAliasTarget: descriptorSeed.roleAliasTarget }
        : {}),
      ...(descriptorSeed.legacyCommandAlias
        ? { legacyCommandAlias: descriptorSeed.legacyCommandAlias }
        : {}),
      title: translate(descriptorSeed.titleKey),
      summary: translate(descriptorSeed.summaryKey),
      detail: translate(descriptorSeed.detailKey),
      examplePrompts: descriptorSeed.examplePromptKeys.map((translationKey) =>
        translate(translationKey),
      ),
      relatedCapabilityIds: [...descriptorSeed.relatedCapabilityIds],
    };
  }
}
