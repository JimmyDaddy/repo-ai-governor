import { SESSION_MAIN_CAPABILITY_ID } from '@repo-ai-governor/core-orchestration-service/constants';
import { LocalOrchestrationServiceSessionMainCapabilityCatalog } from '@repo-ai-governor/core-orchestration-service/session-main-capability-catalog';
import type {
  SessionMainCapabilityDescriptorSeed,
  SessionMainCapabilityDescriptorView,
  SessionMainCapabilityId,
} from '@repo-ai-governor/core-orchestration-service/types';
import { GovernorErrorCode, RuntimeError } from '@repo-ai-governor/shared';
import type { CliSessionSlashCommandMetadata } from '../types/index.js';

const SESSION_MAIN_CAPABILITY_CATALOG_ORDER = [
  SESSION_MAIN_CAPABILITY_ID.HELP,
  SESSION_MAIN_CAPABILITY_ID.CONNECT,
  SESSION_MAIN_CAPABILITY_ID.BRANCH_SWITCH,
  SESSION_MAIN_CAPABILITY_ID.DOCTOR,
  SESSION_MAIN_CAPABILITY_ID.VERIFY,
  SESSION_MAIN_CAPABILITY_ID.WORKFLOW,
  SESSION_MAIN_CAPABILITY_ID.PLAN,
  SESSION_MAIN_CAPABILITY_ID.REVIEW,
  SESSION_MAIN_CAPABILITY_ID.REVIEW_VERIFY,
  SESSION_MAIN_CAPABILITY_ID.RUN,
] as const;

const SESSION_MAIN_GOVERNED_SLASH_DISCOVERABILITY_ORDER = [
  SESSION_MAIN_CAPABILITY_ID.CONNECT,
  SESSION_MAIN_CAPABILITY_ID.BRANCH_SWITCH,
  SESSION_MAIN_CAPABILITY_ID.DOCTOR,
  SESSION_MAIN_CAPABILITY_ID.VERIFY,
  SESSION_MAIN_CAPABILITY_ID.WORKFLOW,
  SESSION_MAIN_CAPABILITY_ID.PLAN,
  SESSION_MAIN_CAPABILITY_ID.REVIEW,
  SESSION_MAIN_CAPABILITY_ID.REVIEW_VERIFY,
  SESSION_MAIN_CAPABILITY_ID.RUN,
] as const;

const SESSION_MAIN_GOVERNED_SLASH_LAUNCHER_ORDER = [
  SESSION_MAIN_CAPABILITY_ID.BRANCH_SWITCH,
  SESSION_MAIN_CAPABILITY_ID.CONNECT,
  SESSION_MAIN_CAPABILITY_ID.DOCTOR,
  SESSION_MAIN_CAPABILITY_ID.VERIFY,
  SESSION_MAIN_CAPABILITY_ID.REVIEW,
  SESSION_MAIN_CAPABILITY_ID.PLAN,
  SESSION_MAIN_CAPABILITY_ID.RUN,
] as const;

/**
 * Adapts the orchestration-owned capability catalog into CLI-local help/discoverability views.
 *
 * Why this exists:
 * CLI help appendices and slash-command discoverability need one shared consumer seam so the shell
 * does not drift away from the orchestration-owned governed capability truth.
 */
export class CliSessionMainCapabilityDiscoverabilityRuntime {
  private readonly capabilityCatalog = new LocalOrchestrationServiceSessionMainCapabilityCatalog();

  /**
   * Lists all canonical capability views in stable catalog order.
   * @param translate Shared i18n translation function.
   * @returns Localized capability views.
   */
  public listCapabilityViews(
    translate: (translationKey: string) => string,
  ): readonly SessionMainCapabilityDescriptorView[] {
    return SESSION_MAIN_CAPABILITY_CATALOG_ORDER.map((capabilityId) =>
      this.requireDescriptorView(capabilityId, translate),
    );
  }

  /**
   * Resolves one localized capability view by id.
   * @param capabilityId Governed capability id.
   * @param translate Shared i18n translation function.
   * @returns Localized descriptor view when present.
   */
  public findCapabilityViewById(
    capabilityId: SessionMainCapabilityId,
    translate: (translationKey: string) => string,
  ): SessionMainCapabilityDescriptorView | null {
    return this.capabilityCatalog.getDescriptorView(capabilityId, translate);
  }

  /**
   * Lists related localized capability views in canonical related-id order.
   * @param capabilityId Governed capability id.
   * @param translate Shared i18n translation function.
   * @returns Related localized capability views.
   */
  public listRelatedCapabilityViews(
    capabilityId: SessionMainCapabilityId,
    translate: (translationKey: string) => string,
  ): readonly SessionMainCapabilityDescriptorView[] {
    const descriptorSeed = this.capabilityCatalog.getDescriptorSeed(capabilityId);
    if (descriptorSeed === null) {
      return [];
    }

    return descriptorSeed.relatedCapabilityIds
      .map((relatedCapabilityId) => this.findCapabilityViewById(relatedCapabilityId, translate))
      .filter(
        (descriptorView): descriptorView is SessionMainCapabilityDescriptorView =>
          descriptorView !== null,
      );
  }

  /**
   * Lists slash-command discoverability metadata for governed capabilities.
   * @param translate Shared i18n translation function.
   * @param surface Discoverability surface profile.
   * @returns Localized slash-command metadata.
   */
  public listGovernedSlashCommands(
    translate: (translationKey: string) => string,
    surface: 'launcher' | 'full' = 'full',
  ): readonly CliSessionSlashCommandMetadata[] {
    return this.listGovernedDescriptorSeeds(surface).map((descriptorSeed) => {
      const descriptorView = this.requireDescriptorView(descriptorSeed.capabilityId, translate);
      return {
        command: descriptorView.suggestedSlashCommand,
        summary: descriptorView.summary,
      };
    });
  }

  /**
   * Lists locale-neutral governed slash-command descriptor seeds in stable discoverability order.
   * @param surface Discoverability surface profile.
   * @returns Ordered governed descriptor seeds.
   */
  public listGovernedDescriptorSeeds(
    surface: 'launcher' | 'full' = 'full',
  ): readonly SessionMainCapabilityDescriptorSeed[] {
    const orderedCapabilityIds =
      surface === 'launcher'
        ? SESSION_MAIN_GOVERNED_SLASH_LAUNCHER_ORDER
        : SESSION_MAIN_GOVERNED_SLASH_DISCOVERABILITY_ORDER;
    const descriptorSeeds = this.capabilityCatalog.listDescriptorSeeds();

    return orderedCapabilityIds.map((capabilityId) => {
      const descriptorSeed = descriptorSeeds.find(
        (candidateSeed) => candidateSeed.capabilityId === capabilityId,
      );

      if (!descriptorSeed) {
        throw new RuntimeError(
          GovernorErrorCode.AGENTS_PROJECTION_INVALID,
          `Missing governed capability descriptor seed for ${capabilityId}.`,
          {
            capabilityId,
          },
        );
      }

      return descriptorSeed;
    });
  }

  /**
   * Resolves the canonical governed descriptor seed that owns one slash-query prefix.
   * @param query Raw slash query including arguments.
   * @returns Matching locale-neutral descriptor seed when present.
   */
  public findGovernedDescriptorSeedBySlashCommand(
    query: string,
  ): SessionMainCapabilityDescriptorSeed | null {
    const normalizedQuery = this.normalizeSlashQuery(query);
    if (normalizedQuery.length === 0) {
      return null;
    }

    const orderedSeeds = [...this.listGovernedDescriptorSeeds('full')].sort(
      (leftSeed, rightSeed) =>
        rightSeed.suggestedSlashCommand.length - leftSeed.suggestedSlashCommand.length,
    );

    return (
      orderedSeeds.find((descriptorSeed) =>
        this.matchesSlashCommand(normalizedQuery, descriptorSeed.suggestedSlashCommand),
      ) ?? null
    );
  }

  private requireDescriptorView(
    capabilityId: SessionMainCapabilityId,
    translate: (translationKey: string) => string,
  ): SessionMainCapabilityDescriptorView {
    const descriptorView = this.findCapabilityViewById(capabilityId, translate);
    if (descriptorView === null) {
      throw new RuntimeError(
        GovernorErrorCode.AGENTS_PROJECTION_INVALID,
        `Missing governed capability descriptor view for ${capabilityId}.`,
        {
          capabilityId,
        },
      );
    }

    return descriptorView;
  }

  private normalizeSlashQuery(query: string): string {
    return query.trim().toLowerCase();
  }

  private matchesSlashCommand(normalizedQuery: string, suggestedSlashCommand: string): boolean {
    return (
      normalizedQuery === suggestedSlashCommand ||
      normalizedQuery.startsWith(`${suggestedSlashCommand} `)
    );
  }
}
