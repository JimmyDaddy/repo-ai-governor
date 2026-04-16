import type {
  CliSessionSlashCommandHighlightSegment,
  CliSessionSlashCommandSuggestion,
} from '../../types/index.js';

interface SessionRoleMentionMetadata {
  command: string;
  summary: string;
}

const DEFAULT_SESSION_ROLE_MENTION_ORDER = ['planner', 'architect', 'reviewer', 'verifier'];
const TRAILING_ROLE_MENTION_PATTERN = /(^|\s)(@[a-z0-9_.-]*)$/iu;

/**
 * Detects whether one palette candidate is a role mention token.
 * @param value Candidate palette value.
 * @returns True when the value starts with the role-mention prefix.
 */
export function isRoleMentionSuggestion(value: string | null | undefined): boolean {
  return typeof value === 'string' && value.startsWith('@');
}

/**
 * Resolves the trailing role-mention token that is still being composed.
 * @param composerValue Current session-shell composer value.
 * @returns Active trailing `@role` query when present.
 */
export function resolveTrailingRoleMentionQuery(composerValue: string): string | null {
  const match = composerValue.match(TRAILING_ROLE_MENTION_PATTERN);
  const mentionQuery = match?.[2] ?? null;
  return mentionQuery && mentionQuery.length > 0 ? mentionQuery : null;
}

/**
 * Replaces the trailing mention query with one accepted role mention.
 * @param composerValue Current session-shell composer value.
 * @param acceptedMention Accepted `@role` suggestion.
 * @returns Composer value with the trailing query replaced and a trailing space appended.
 */
export function applyAcceptedRoleMention(composerValue: string, acceptedMention: string): string {
  const trailingMentionQuery = resolveTrailingRoleMentionQuery(composerValue);
  if (!trailingMentionQuery) {
    return `${acceptedMention} `;
  }

  const preservedPrefix = composerValue.slice(
    0,
    composerValue.length - trailingMentionQuery.length,
  );
  return `${preservedPrefix}${acceptedMention} `;
}

/**
 * Owns the presenter-safe `@role` suggestion catalog shown by the live session shell.
 */
export class CliSessionRoleMentionRegistry {
  /**
   * Builds one ordered list of mention suggestions for the trailing role token.
   * @param composerValue Current composer value.
   * @param translate Session-shell i18n runtime.
   * @param roleIds Configured role ids available for explicit mention.
   * @returns Filtered mention suggestions in stable display order.
   */
  public suggest(
    composerValue: string,
    translate: (key: string, interpolation?: Record<string, string>) => string,
    roleIds: readonly string[] | undefined,
  ): CliSessionSlashCommandSuggestion[] {
    const mentionQuery = resolveTrailingRoleMentionQuery(composerValue);
    if (!mentionQuery) {
      return [];
    }

    const normalizedQuery = mentionQuery.toLowerCase();
    return this.listRoleMentionMetadata(translate, roleIds)
      .filter((metadata) => metadata.command.toLowerCase().startsWith(normalizedQuery))
      .map((metadata) => ({
        command: metadata.command,
        summary: metadata.summary,
        highlightSegments: this.createHighlightSegments(metadata.command, normalizedQuery),
      }));
  }

  private listRoleMentionMetadata(
    translate: (key: string, interpolation?: Record<string, string>) => string,
    roleIds: readonly string[] | undefined,
  ): SessionRoleMentionMetadata[] {
    const configuredRoleIds = this.normalizeRoleIds(roleIds);
    if (configuredRoleIds.length === 0) {
      return DEFAULT_SESSION_ROLE_MENTION_ORDER.map((roleId) =>
        this.createRoleMentionMetadata(roleId, translate),
      );
    }

    const preferredRoleIds = DEFAULT_SESSION_ROLE_MENTION_ORDER.filter((roleId) =>
      configuredRoleIds.includes(roleId),
    );
    const remainingRoleIds = configuredRoleIds.filter(
      (roleId) => !DEFAULT_SESSION_ROLE_MENTION_ORDER.includes(roleId),
    );
    remainingRoleIds.sort((leftRoleId, rightRoleId) => leftRoleId.localeCompare(rightRoleId));

    return [...preferredRoleIds, ...remainingRoleIds].map((roleId) =>
      this.createRoleMentionMetadata(roleId, translate),
    );
  }

  private normalizeRoleIds(roleIds: readonly string[] | undefined): string[] {
    const normalizedRoleIds: string[] = [];
    for (const roleId of roleIds ?? []) {
      const normalizedRoleId = roleId.trim().toLowerCase();
      if (normalizedRoleId.length === 0 || normalizedRoleIds.includes(normalizedRoleId)) {
        continue;
      }
      normalizedRoleIds.push(normalizedRoleId);
    }

    return normalizedRoleIds;
  }

  private createRoleMentionMetadata(
    roleId: string,
    translate: (key: string, interpolation?: Record<string, string>) => string,
  ): SessionRoleMentionMetadata {
    const summaryKey = `cli.sessionShell.mentions.roles.${roleId}.summary`;
    const translatedSummary = translate(summaryKey, {
      roleId,
    });
    const fallbackSummary = translate('cli.sessionShell.mentions.roles.generic.summary', {
      roleId,
    });

    return {
      command: `@${roleId}`,
      summary: translatedSummary === summaryKey ? fallbackSummary : translatedSummary,
    };
  }

  private createHighlightSegments(
    command: string,
    normalizedQuery: string,
  ): CliSessionSlashCommandHighlightSegment[] {
    if (normalizedQuery.length === 0) {
      return [
        {
          text: command,
          highlighted: false,
        },
      ];
    }

    return [
      {
        text: command.slice(0, normalizedQuery.length),
        highlighted: true,
      },
      {
        text: command.slice(normalizedQuery.length),
        highlighted: false,
      },
    ].filter((segment) => segment.text.length > 0);
  }
}
