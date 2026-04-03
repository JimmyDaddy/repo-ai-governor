import { SESSION_MAIN_HANDOFF_EXECUTION_MODE } from '@repo-ai-governor/core-orchestration-service';
import { CliCommandName } from '../../constants/cli-command.constant.js';
import type {
  CliSessionSlashCommandHighlightSegment,
  CliSessionSlashCommandMetadata,
  CliSessionSlashCommandSuggestion,
} from '../../types/index.js';
import { CliSessionMainCapabilityDiscoverabilityRuntime } from '../session-main-capability-discoverability-runtime.js';

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

const SESSION_SLASH_BUILTIN_DEFINITIONS: SessionSlashCommandDefinition[] = [
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
];

const SESSION_SLASH_LOCAL_BRIDGE_DEFINITIONS: SessionSlashCommandDefinition[] = [
  {
    command: '/init',
    summaryKey: 'cli.commands.init.description',
    kind: 'bridge',
    executionMode: 'direct',
  },
  {
    command: '/workspace',
    summaryKey: 'cli.commands.workspace.description',
    kind: 'bridge',
    executionMode: 'confirm',
  },
];

const SESSION_SLASH_COMMAND_ALIASES: Record<string, string> = {
  '?': '/help',
  '/routing': '/agent',
};

const SESSION_SLASH_COMMAND_FULL_ORDER = [
  '/help',
  '/confirm',
  '/cancel',
  '/clear',
  '/exit',
  '/resume',
  '/history',
  '/search',
  '/multiline',
  '/status',
  '/theme',
  '/agent',
  '/init',
  '/connect',
  '/doctor',
  '/verify',
  '/workspace',
  '/workflow',
  '/plan',
  '/review',
  '/review verify',
  '/run',
] as const;

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
  private readonly capabilityDiscoverabilityRuntime =
    new CliSessionMainCapabilityDiscoverabilityRuntime();

  /**
   * Lists the current session-shell slash-command set in stable order.
   * @param translate i18n translation function for summaries.
   * @returns Localized slash-command metadata.
   */
  public listCommands(
    translate: (key: string, interpolation?: Record<string, string>) => string,
  ): CliSessionSlashCommandMetadata[] {
    return this.listLocalizedCommandMetadata(translate, 'full');
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
    const definition = this.resolveDefinition(query);
    if (!definition) {
      return null;
    }

    return {
      command: definition.command,
      summary: translate(definition.summaryKey),
    };
  }

  /**
   * Resolves the internal action semantics for one exact slash command.
   * @param query Raw slash query including arguments.
   * @returns Runtime command resolution or `null` when no exact command exists.
   */
  public resolveAction(query: string): SessionSlashCommandResolution | null {
    const normalizedQuery = this.normalizeAliasedQuery(query);
    const definition = this.resolveDefinition(query);

    if (!definition) {
      return null;
    }

    const argumentTokens = this.resolveArgumentTokens(normalizedQuery, definition.command);

    return {
      command: definition.command,
      summaryKey: definition.summaryKey,
      kind: definition.kind,
      ...(definition.kind === 'bridge'
        ? {
            executionMode: this.resolveExecutionMode(
              definition.command,
              argumentTokens,
              definition.executionMode ?? 'confirm',
            ),
            bridgeArgv: this.resolveBridgeArgv(definition.command, argumentTokens),
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
    const normalizedPrefix = this.normalizePrefix(this.normalizeAliasedQuery(query));
    const commandList =
      normalizedPrefix.length === 0 && options.surface !== 'full'
        ? this.listLocalizedCommandMetadata(translate, 'launcher')
        : this.listLocalizedCommandMetadata(translate, 'full');

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

  private listLocalizedCommandMetadata(
    translate: (key: string, interpolation?: Record<string, string>) => string,
    surface: 'launcher' | 'full',
  ): CliSessionSlashCommandMetadata[] {
    const orderedCommands =
      surface === 'launcher'
        ? SESSION_SLASH_COMMAND_LAUNCHER_ORDER
        : SESSION_SLASH_COMMAND_FULL_ORDER;
    const metadataMap = new Map(
      this.listAllDefinitions().map((definition) => [
        definition.command,
        {
          command: definition.command,
          summary: translate(definition.summaryKey),
        } satisfies CliSessionSlashCommandMetadata,
      ]),
    );

    return orderedCommands
      .map((command) => metadataMap.get(command))
      .filter(
        (definition): definition is CliSessionSlashCommandMetadata => definition !== undefined,
      );
  }

  private listAllDefinitions(): SessionSlashCommandDefinition[] {
    return [
      ...SESSION_SLASH_BUILTIN_DEFINITIONS,
      ...SESSION_SLASH_LOCAL_BRIDGE_DEFINITIONS,
      ...this.capabilityDiscoverabilityRuntime
        .listGovernedDescriptorSeeds('full')
        .map((descriptorSeed) => ({
          command: descriptorSeed.suggestedSlashCommand,
          summaryKey: descriptorSeed.summaryKey,
          kind: 'bridge' as const,
          executionMode:
            descriptorSeed.handoffExecutionMode ===
            SESSION_MAIN_HANDOFF_EXECUTION_MODE.DIRECT_EXECUTE
              ? ('direct' as const)
              : ('confirm' as const),
        })),
    ];
  }

  private resolveExecutionMode(
    command: string,
    argumentTokens: string[],
    defaultMode: SessionSlashCommandExecutionMode,
  ): SessionSlashCommandExecutionMode {
    if (command === '/workflow') {
      const workflowAction = argumentTokens[0]?.toLowerCase() ?? 'preview';
      return workflowAction === 'preview' ? 'direct' : 'confirm';
    }

    return defaultMode;
  }

  private resolveDefinition(query: string): SessionSlashCommandDefinition | null {
    const normalizedQuery = this.normalizeAliasedQuery(query);
    if (normalizedQuery.length === 0) {
      return null;
    }

    const definitions = [...this.listAllDefinitions()].sort(
      (leftDefinition, rightDefinition) =>
        rightDefinition.command.length - leftDefinition.command.length,
    );

    return (
      definitions.find((definition) =>
        this.matchesSlashCommand(normalizedQuery, definition.command),
      ) ?? null
    );
  }

  private resolveBridgeArgv(command: string, argumentTokens: string[]): string[] {
    if (command === '/review verify') {
      return [CliCommandName.REVIEW_VERIFY, ...argumentTokens];
    }

    if (command === '/workflow') {
      return [
        CliCommandName.WORKFLOW,
        ...(argumentTokens.length > 0 ? argumentTokens : ['preview']),
      ];
    }

    if (command === '/workspace' && argumentTokens.length > 0) {
      return [CliCommandName.WORKSPACE, ...argumentTokens];
    }

    return [command.slice(1), ...argumentTokens];
  }

  private normalizePrefix(query: string): string {
    return query.replace(/^\//u, '').trim().toLowerCase();
  }

  private normalizeAliasedQuery(query: string): string {
    const tokens = query
      .trim()
      .toLowerCase()
      .split(/\s+/u)
      .filter((token) => token.length > 0);

    if (tokens.length === 0) {
      return '';
    }

    const normalizedCommand = SESSION_SLASH_COMMAND_ALIASES[tokens[0] ?? ''] ?? tokens[0] ?? '';
    return [normalizedCommand, ...tokens.slice(1)].join(' ');
  }

  private resolveArgumentTokens(normalizedQuery: string, command: string): string[] {
    const argumentQuery = normalizedQuery.slice(command.length).trim();
    return argumentQuery.length === 0 ? [] : argumentQuery.split(/\s+/u);
  }

  private matchesSlashCommand(normalizedQuery: string, command: string): boolean {
    return normalizedQuery === command || normalizedQuery.startsWith(`${command} `);
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
