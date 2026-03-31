import { CliCommandName } from '../../constants/cli-command.constant.js';
import type {
  CliSessionSlashCommandHighlightSegment,
  CliSessionSlashCommandMetadata,
  CliSessionSlashCommandSuggestion,
} from '../../types/index.js';

type SessionSlashCommandKind = 'builtin' | 'bridge';
type SessionSlashCommandExecutionMode = 'direct' | 'confirm';

interface SessionSlashCommandDefinition {
  command: string;
  summaryKey: string;
  kind: SessionSlashCommandKind;
  executionMode?: SessionSlashCommandExecutionMode;
}

interface SessionSlashCommandResolution {
  command: string;
  summaryKey: string;
  kind: SessionSlashCommandKind;
  bridgeArgv?: string[];
  executionMode?: SessionSlashCommandExecutionMode;
}

interface SessionSlashCommandSuggestOptions {
  surface?: 'launcher' | 'full';
}

const SESSION_SLASH_COMMAND_DEFINITIONS: SessionSlashCommandDefinition[] = [
  { command: '/help', summaryKey: 'cli.sessionShell.commands.help.summary', kind: 'builtin' },
  { command: '/confirm', summaryKey: 'cli.sessionShell.commands.confirm.summary', kind: 'builtin' },
  { command: '/cancel', summaryKey: 'cli.sessionShell.commands.cancel.summary', kind: 'builtin' },
  { command: '/clear', summaryKey: 'cli.sessionShell.commands.clear.summary', kind: 'builtin' },
  { command: '/exit', summaryKey: 'cli.sessionShell.commands.exit.summary', kind: 'builtin' },
  { command: '/resume', summaryKey: 'cli.sessionShell.commands.resume.summary', kind: 'builtin' },
  {
    command: '/history',
    summaryKey: 'cli.sessionShell.commands.history.summary',
    kind: 'builtin',
  },
  { command: '/search', summaryKey: 'cli.sessionShell.commands.search.summary', kind: 'builtin' },
  {
    command: '/multiline',
    summaryKey: 'cli.sessionShell.commands.multiline.summary',
    kind: 'builtin',
  },
  { command: '/status', summaryKey: 'cli.sessionShell.commands.status.summary', kind: 'builtin' },
  { command: '/theme', summaryKey: 'cli.sessionShell.commands.theme.summary', kind: 'builtin' },
  { command: '/agent', summaryKey: 'cli.sessionShell.commands.agent.summary', kind: 'builtin' },
  {
    command: '/init',
    summaryKey: 'cli.commands.init.description',
    kind: 'bridge',
    executionMode: 'direct',
  },
  {
    command: '/connect',
    summaryKey: 'cli.commands.connect.description',
    kind: 'bridge',
    executionMode: 'direct',
  },
  {
    command: '/doctor',
    summaryKey: 'cli.commands.doctor.description',
    kind: 'bridge',
    executionMode: 'direct',
  },
  {
    command: '/verify',
    summaryKey: 'cli.commands.verify.description',
    kind: 'bridge',
    executionMode: 'direct',
  },
  {
    command: '/workspace',
    summaryKey: 'cli.commands.workspace.description',
    kind: 'bridge',
    executionMode: 'confirm',
  },
  {
    command: '/workflow',
    summaryKey: 'cli.commands.workflow.description',
    kind: 'bridge',
    executionMode: 'confirm',
  },
  {
    command: '/run',
    summaryKey: 'cli.commands.run.description',
    kind: 'bridge',
    executionMode: 'confirm',
  },
  {
    command: '/plan',
    summaryKey: 'cli.commands.plan.description',
    kind: 'bridge',
    executionMode: 'confirm',
  },
  {
    command: '/review',
    summaryKey: 'cli.commands.review.description',
    kind: 'bridge',
    executionMode: 'confirm',
  },
];

const SESSION_SLASH_COMMAND_ALIASES: Record<string, string> = {
  '?': '/help',
  '/routing': '/agent',
};

const SESSION_SLASH_COMMAND_LAUNCHER_ORDER = [
  '/workspace',
  '/doctor',
  '/verify',
  '/connect',
  '/review',
  '/plan',
  '/run',
  '/help',
] as const;

/**
 * Owns slash-command metadata, prefix filtering, and handoff argv resolution for the session shell.
 */
export class CliSessionSlashCommandRegistry {
  /**
   * Lists the current session-shell slash-command set in stable order.
   * @param translate i18n translation function for summaries.
   * @returns Localized slash-command metadata.
   */
  public listCommands(
    translate: (key: string, interpolation?: Record<string, string>) => string,
  ): CliSessionSlashCommandMetadata[] {
    return SESSION_SLASH_COMMAND_DEFINITIONS.map((definition) => ({
      command: definition.command,
      summary: translate(definition.summaryKey),
    }));
  }

  /**
   * Resolves one exact slash-command definition for transcript/help rendering.
   * @param query Raw slash query including arguments.
   * @param translate i18n translation function for summaries.
   * @returns Localized metadata or `null` when no exact command exists.
   */
  public findByCommand(
    query: string,
    translate: (key: string, interpolation?: Record<string, string>) => string,
  ): CliSessionSlashCommandMetadata | null {
    const normalizedCommand = this.resolveCommandToken(query);
    const match = SESSION_SLASH_COMMAND_DEFINITIONS.find(
      (definition) => definition.command === normalizedCommand,
    );

    if (!match) {
      return null;
    }

    return {
      command: match.command,
      summary: translate(match.summaryKey),
    };
  }

  /**
   * Resolves the internal action semantics for one exact slash command.
   * @param query Raw slash query including arguments.
   * @returns Runtime command resolution or `null` when no exact command exists.
   */
  public resolveAction(query: string): SessionSlashCommandResolution | null {
    const normalizedCommand = this.resolveCommandToken(query);
    const match = SESSION_SLASH_COMMAND_DEFINITIONS.find(
      (definition) => definition.command === normalizedCommand,
    );

    if (!match) {
      return null;
    }

    return {
      command: match.command,
      summaryKey: match.summaryKey,
      kind: match.kind,
      ...(match.kind === 'bridge'
        ? {
            executionMode: match.executionMode ?? 'confirm',
            bridgeArgv: this.resolveBridgeArgv(match.command, this.resolveArgumentTokens(query)),
          }
        : {}),
    };
  }

  /**
   * Filters slash-command suggestions by prefix and prepares highlight segments for rendering.
   * @param query Raw slash query including the leading slash.
   * @param translate i18n translation function for summaries.
   * @returns Ordered suggestion list for the palette.
   */
  public suggest(
    query: string,
    translate: (key: string, interpolation?: Record<string, string>) => string,
    options: SessionSlashCommandSuggestOptions = {},
  ): CliSessionSlashCommandSuggestion[] {
    const normalizedPrefix = this.normalizePrefix(this.resolveCommandToken(query));
    const commandList =
      normalizedPrefix.length === 0 && options.surface !== 'full'
        ? this.listLauncherCommands(translate)
        : this.listCommands(translate);

    return commandList
      .filter(
        (definition) =>
          normalizedPrefix.length === 0 || definition.command.slice(1).startsWith(normalizedPrefix),
      )
      .map((definition) => ({
        command: definition.command,
        summary: definition.summary,
        highlightSegments: this.buildHighlightSegments(definition.command, normalizedPrefix),
      }));
  }

  private listLauncherCommands(
    translate: (key: string, interpolation?: Record<string, string>) => string,
  ): CliSessionSlashCommandMetadata[] {
    const commandMap = new Map(
      this.listCommands(translate).map((definition) => [definition.command, definition]),
    );

    return SESSION_SLASH_COMMAND_LAUNCHER_ORDER.map((command) => commandMap.get(command)).filter(
      (definition): definition is CliSessionSlashCommandMetadata => definition !== undefined,
    );
  }

  private resolveBridgeArgv(command: string, argumentTokens: string[]): string[] {
    if (command === '/review' && argumentTokens[0]?.toLowerCase() === 'verify') {
      return [CliCommandName.REVIEW_VERIFY, ...argumentTokens.slice(1)];
    }

    if (command === '/workflow' && argumentTokens.length > 0) {
      return [CliCommandName.WORKFLOW, ...argumentTokens];
    }

    if (command === '/workspace' && argumentTokens.length > 0) {
      return [CliCommandName.WORKSPACE, ...argumentTokens];
    }

    return [command.slice(1), ...argumentTokens];
  }

  private normalizePrefix(query: string): string {
    return query.replace(/^\//u, '').trim().toLowerCase();
  }

  private resolveCommandToken(query: string): string {
    const rawToken = query.trim().split(/\s+/u)[0]?.toLowerCase() ?? '';
    return SESSION_SLASH_COMMAND_ALIASES[rawToken] ?? rawToken;
  }

  private resolveArgumentTokens(query: string): string[] {
    const [, ...argumentsList] = query.trim().split(/\s+/u);
    return argumentsList.filter((token) => token.length > 0);
  }

  private buildHighlightSegments(
    command: string,
    normalizedPrefix: string,
  ): CliSessionSlashCommandHighlightSegment[] {
    if (normalizedPrefix.length === 0) {
      return [{ text: command, highlighted: false }];
    }

    const commandBody = command.slice(1);
    const highlightedPrefix = commandBody.slice(0, normalizedPrefix.length);
    const remainingBody = commandBody.slice(normalizedPrefix.length);
    const segments: CliSessionSlashCommandHighlightSegment[] = [
      { text: '/', highlighted: false },
      { text: highlightedPrefix, highlighted: true },
    ];

    if (remainingBody.length > 0) {
      segments.push({ text: remainingBody, highlighted: false });
    }

    return segments;
  }
}
