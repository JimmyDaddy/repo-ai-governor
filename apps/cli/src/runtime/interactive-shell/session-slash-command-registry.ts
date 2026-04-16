import {
  SESSION_MAIN_CAPABILITY_BACKING_EXECUTION,
  SESSION_MAIN_HANDOFF_EXECUTION_MODE,
} from '@repo-ai-governor/core-orchestration-service/constants';
import { CliCommandName } from '../../constants/cli-command.constant.js';
import { CLI_REACT_THEME_PRESET_ORDER } from '../../constants/cli-react-theme.constant.js';
import type {
  CliSessionSlashCommandHighlightSegment,
  CliSessionSlashCommandMetadata,
  CliSessionSlashCommandSuggestion,
} from '../../types/index.js';
import { CliSessionMainCapabilityDiscoverabilityRuntime } from '../session-main-capability-discoverability-runtime.js';

type SessionSlashCommandKind = 'builtin' | 'bridge' | 'ai_workflow' | 'secure_local_secret_capture';
type SessionSlashCommandExecutionMode = 'direct' | 'confirm';

interface SessionSlashCommandSecureLocalSecretCapture {
  action: 'set';
  keyName: string;
  displayCommand: string;
  rejectedSuffix: boolean;
}

interface SessionSlashCommandDefinition {
  command: string;
  summaryKey: string;
  kind: SessionSlashCommandKind;
  executionMode?: SessionSlashCommandExecutionMode;
  discoverable?: boolean;
}

interface SessionSlashCommandResolution {
  command: string;
  summaryKey: string;
  kind: SessionSlashCommandKind;
  bridgeArgv?: string[];
  aiWorkflowPrompt?: string;
  executionMode?: SessionSlashCommandExecutionMode;
  secureLocalSecretCapture?: SessionSlashCommandSecureLocalSecretCapture;
}

interface SessionSlashCommandSuggestOptions {
  surface?: 'launcher' | 'full';
}

const SESSION_SLASH_BUILTIN_DEFINITIONS: SessionSlashCommandDefinition[] = [
  { command: '/help', summaryKey: 'cli.sessionShell.commands.help.summary', kind: 'builtin' },
  {
    command: '/confirm',
    summaryKey: 'cli.sessionShell.commands.confirm.summary',
    kind: 'builtin',
    discoverable: false,
  },
  {
    command: '/cancel',
    summaryKey: 'cli.sessionShell.commands.cancel.summary',
    kind: 'builtin',
    discoverable: false,
  },
  { command: '/clear', summaryKey: 'cli.sessionShell.commands.clear.summary', kind: 'builtin' },
  { command: '/exit', summaryKey: 'cli.sessionShell.commands.exit.summary', kind: 'builtin' },
  { command: '/resume', summaryKey: 'cli.sessionShell.commands.resume.summary', kind: 'builtin' },
  {
    command: '/sessions',
    summaryKey: 'cli.sessionShell.commands.sessions.summary',
    kind: 'builtin',
  },
  { command: '/fork', summaryKey: 'cli.sessionShell.commands.fork.summary', kind: 'builtin' },
  {
    command: '/archive',
    summaryKey: 'cli.sessionShell.commands.archive.summary',
    kind: 'builtin',
  },
  {
    command: '/unarchive',
    summaryKey: 'cli.sessionShell.commands.unarchive.summary',
    kind: 'builtin',
  },
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
    command: '/plan sync',
    summaryKey: 'cli.sessionShell.commands.planSync.summary',
    kind: 'bridge',
    executionMode: 'direct',
  },
  {
    command: '/config',
    summaryKey: 'cli.commands.config.description',
    kind: 'bridge',
    executionMode: 'direct',
  },
  {
    command: '/secret',
    summaryKey: 'cli.commands.secret.description',
    kind: 'bridge',
    executionMode: 'direct',
  },
  {
    command: '/workspace',
    summaryKey: 'cli.commands.workspace.description',
    kind: 'bridge',
    executionMode: 'direct',
  },
  {
    command: '/workspace dry-run',
    summaryKey: 'cli.commands.workspace.actionGuideDryRun',
    kind: 'bridge',
    executionMode: 'direct',
  },
  {
    command: '/workspace execute',
    summaryKey: 'cli.commands.workspace.actionGuideExecute',
    kind: 'bridge',
    executionMode: 'direct',
  },
  {
    command: '/workspace rollback',
    summaryKey: 'cli.commands.workspace.actionGuideRollback',
    kind: 'bridge',
    executionMode: 'direct',
  },
  {
    command: '/workspace clear-config',
    summaryKey: 'cli.commands.workspace.actionGuideClearConfig',
    kind: 'bridge',
    executionMode: 'direct',
  },
  {
    command: '/workspace set-ui-theme',
    summaryKey: 'cli.commands.workspace.actionGuideSetUiTheme',
    kind: 'bridge',
    executionMode: 'direct',
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
  '/sessions',
  '/fork',
  '/archive',
  '/unarchive',
  '/history',
  '/search',
  '/multiline',
  '/status',
  '/theme',
  '/agent',
  '/init',
  '/connect',
  '/doctor',
  '/plan sync',
  '/config',
  '/secret',
  '/workspace',
  '/workspace dry-run',
  '/workspace execute',
  '/workspace rollback',
  '/workspace clear-config',
  '/workspace switch-branch',
  '/workspace set-ui-theme',
  '/workflow',
  '/deliver',
  '/plan',
  '/review',
  '/review verify',
  '/run',
] as const;

const SESSION_SLASH_COMMAND_LAUNCHER_ORDER = [
  '/workspace',
  '/workspace switch-branch',
  '/doctor',
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
   * @param translate Optional i18n translation function used for AI workflow prompts.
   * @returns Runtime command resolution or `null` when no exact command exists.
   */
  public resolveAction(
    query: string,
    translate?: (key: string, interpolation?: Record<string, string>) => string,
  ): SessionSlashCommandResolution | null {
    const secureLocalSecretCapture = this.resolveSecureLocalSecretCapture(query);
    if (secureLocalSecretCapture) {
      return {
        command: '/secret set',
        summaryKey: 'cli.commands.secret.description',
        kind: 'secure_local_secret_capture',
        secureLocalSecretCapture,
      };
    }

    const definition = this.resolveDefinition(query);

    if (!definition) {
      return null;
    }

    const argumentTokens = this.resolveArgumentTokens(this.resolveQueryTokens(query), definition);

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
        : definition.kind === 'ai_workflow'
          ? {
              executionMode: definition.executionMode ?? 'direct',
              aiWorkflowPrompt: translate
                ? this.resolveAiWorkflowPrompt(definition.command, argumentTokens, translate)
                : undefined,
            }
          : {}),
    };
  }

  /**
   * Detects the secure local `/secret set <keyName>` route before any presenter-safe state is updated.
   * @param query Raw slash query including arguments.
   * @returns Secure-local capture metadata or `null` when the query is not the secure route.
   */
  public resolveSecureLocalSecretCapture(
    query: string,
  ): SessionSlashCommandSecureLocalSecretCapture | null {
    const queryTokens = this.resolveQueryTokens(query);
    if (queryTokens.length < 3) {
      return null;
    }

    const [rawCommandToken, actionToken, keyName, ...suffixTokens] = queryTokens;
    if (
      this.normalizeSlashCommandToken(rawCommandToken ?? '') !== '/secret' ||
      actionToken?.toLowerCase() !== 'set' ||
      !keyName ||
      keyName.startsWith('-')
    ) {
      return null;
    }

    return {
      action: 'set',
      keyName,
      displayCommand: `/secret set ${keyName}`,
      rejectedSuffix: suffixTokens.length > 0,
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
    const normalizedQuery = this.normalizeAliasedQuery(query);
    const workspaceThemePresetSuggestions = this.buildWorkspaceThemePresetSuggestions(
      normalizedQuery,
      translate,
    );
    if (workspaceThemePresetSuggestions) {
      return workspaceThemePresetSuggestions;
    }

    const normalizedPrefix = this.normalizePrefix(normalizedQuery);
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

  private buildWorkspaceThemePresetSuggestions(
    normalizedQuery: string,
    translate: (key: string, interpolation?: Record<string, string>) => string,
  ): CliSessionSlashCommandSuggestion[] | null {
    const queryTokens = this.resolveQueryTokens(normalizedQuery);
    if (queryTokens.length < 2 || queryTokens.length > 3) {
      return null;
    }

    const [rawCommandToken, actionToken, themePrefixToken = ''] = queryTokens;
    if (
      this.normalizeSlashCommandToken(rawCommandToken ?? '') !== '/workspace' ||
      actionToken?.toLowerCase() !== 'set-ui-theme'
    ) {
      return null;
    }

    const themePrefix = themePrefixToken.toLowerCase();
    const normalizedPrefix = this.normalizePrefix(normalizedQuery);
    const matchingThemePresets = CLI_REACT_THEME_PRESET_ORDER.filter(
      (themePreset) => themePrefix.length === 0 || themePreset.startsWith(themePrefix),
    );
    if (matchingThemePresets.length === 0) {
      return null;
    }

    return matchingThemePresets.map((themePreset) => {
      const command = `/workspace set-ui-theme ${themePreset}`;
      return {
        command,
        summary: translate(`cli.reactShell.themePresets.${themePreset}.description`),
        highlightSegments: this.buildHighlightSegments(command, normalizedPrefix),
      };
    });
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
      this.listAllDefinitions()
        .filter((definition) => definition.discoverable !== false)
        .map((definition) => [
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
          kind:
            descriptorSeed.backingExecution ===
            SESSION_MAIN_CAPABILITY_BACKING_EXECUTION.TEMPLATED_AI_WORKFLOW
              ? ('ai_workflow' as const)
              : ('bridge' as const),
          executionMode:
            descriptorSeed.backingExecution ===
            SESSION_MAIN_CAPABILITY_BACKING_EXECUTION.TEMPLATED_AI_WORKFLOW
              ? ('direct' as const)
              : descriptorSeed.handoffExecutionMode ===
                  SESSION_MAIN_HANDOFF_EXECUTION_MODE.DIRECT_EXECUTE
                ? ('direct' as const)
                : ('confirm' as const),
        })),
    ];
  }

  private resolveExecutionMode(
    command: string,
    _argumentTokens: string[],
    defaultMode: SessionSlashCommandExecutionMode,
  ): SessionSlashCommandExecutionMode {
    if (command === '/workflow') {
      return 'direct';
    }

    if (command === '/plan sync') {
      return 'direct';
    }

    if (command === '/connect') {
      return 'direct';
    }

    if (command === '/workspace switch-branch') {
      return 'direct';
    }

    if (command === '/run') {
      return 'direct';
    }

    return defaultMode;
  }

  private resolveDefinition(query: string): SessionSlashCommandDefinition | null {
    const queryTokens = this.resolveQueryTokens(query);
    if (queryTokens.length === 0) {
      return null;
    }

    const definitions = [...this.listAllDefinitions()].sort(
      (leftDefinition, rightDefinition) =>
        rightDefinition.command.length - leftDefinition.command.length,
    );

    return (
      definitions.find((definition) => this.matchesSlashCommandTokens(queryTokens, definition)) ??
      null
    );
  }

  private resolveBridgeArgv(command: string, argumentTokens: string[]): string[] {
    if (command === '/plan sync') {
      return [CliCommandName.PLAN, ...argumentTokens];
    }

    if (command === '/workflow') {
      return [
        CliCommandName.WORKFLOW,
        ...(argumentTokens.length > 0 ? argumentTokens : ['preview']),
      ];
    }

    if (command.startsWith('/workspace')) {
      return [...command.slice(1).split(' '), ...argumentTokens];
    }

    return [command.slice(1), ...argumentTokens];
  }

  private resolveAiWorkflowPrompt(
    command: string,
    argumentTokens: string[],
    translate: (key: string, interpolation?: Record<string, string>) => string,
  ): string {
    if (command === '/deliver') {
      const request = argumentTokens.join(' ').trim();
      return request.length > 0
        ? [
            translate('cli.sessionShell.aiWorkflowPrompts.deliver.requestIntro'),
            translate('cli.sessionShell.aiWorkflowPrompts.deliver.aliasNotice'),
            '',
            translate('cli.sessionShell.aiWorkflowPrompts.deliver.requestLine', { request }),
          ].join('\n')
        : [
            translate('cli.sessionShell.aiWorkflowPrompts.deliver.currentRepoIntro'),
            translate('cli.sessionShell.aiWorkflowPrompts.deliver.aliasNotice'),
          ].join('\n');
    }

    if (command === '/plan') {
      const goal = argumentTokens.join(' ').trim();
      return goal.length > 0
        ? [
            translate('cli.sessionShell.aiWorkflowPrompts.plan.goalIntro'),
            translate('cli.sessionShell.aiWorkflowPrompts.plan.noSyncNotice'),
            '',
            translate('cli.sessionShell.aiWorkflowPrompts.plan.goalLine', { goal }),
          ].join('\n')
        : [
            translate('cli.sessionShell.aiWorkflowPrompts.plan.currentGoalIntro'),
            translate('cli.sessionShell.aiWorkflowPrompts.plan.noSyncNotice'),
          ].join('\n');
    }

    if (command === '/review') {
      const target = argumentTokens.join(' ').trim();
      return target.length > 0
        ? [
            translate('cli.sessionShell.aiWorkflowPrompts.review.scopeIntro'),
            translate('cli.sessionShell.aiWorkflowPrompts.review.focusNotice'),
            translate('cli.sessionShell.aiWorkflowPrompts.review.structuredNotice'),
            '',
            translate('cli.sessionShell.aiWorkflowPrompts.review.scopeLine', { target }),
          ].join('\n')
        : [
            translate('cli.sessionShell.aiWorkflowPrompts.review.currentScopeIntro'),
            translate('cli.sessionShell.aiWorkflowPrompts.review.focusNotice'),
            translate('cli.sessionShell.aiWorkflowPrompts.review.structuredNotice'),
          ].join('\n');
    }

    if (command === '/review verify') {
      const target = argumentTokens.join(' ').trim();
      return target.length > 0
        ? [
            translate('cli.sessionShell.aiWorkflowPrompts.reviewVerify.targetIntro'),
            translate('cli.sessionShell.aiWorkflowPrompts.reviewVerify.recheckNotice'),
            translate('cli.sessionShell.aiWorkflowPrompts.reviewVerify.structuredNotice'),
            '',
            translate('cli.sessionShell.aiWorkflowPrompts.reviewVerify.targetLine', { target }),
          ].join('\n')
        : [
            translate('cli.sessionShell.aiWorkflowPrompts.reviewVerify.currentTargetIntro'),
            translate('cli.sessionShell.aiWorkflowPrompts.reviewVerify.recheckNotice'),
            translate('cli.sessionShell.aiWorkflowPrompts.reviewVerify.structuredNotice'),
          ].join('\n');
    }

    return translate('cli.sessionShell.responses.commandNotExecutable');
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

  private resolveQueryTokens(query: string): string[] {
    return query
      .trim()
      .split(/\s+/u)
      .filter((token) => token.length > 0);
  }

  private resolveArgumentTokens(
    queryTokens: string[],
    definition: SessionSlashCommandDefinition,
  ): string[] {
    const commandTokenCount = definition.command.split(/\s+/u).length;
    return queryTokens.slice(commandTokenCount);
  }

  private matchesSlashCommandTokens(
    queryTokens: string[],
    definition: SessionSlashCommandDefinition,
  ): boolean {
    const commandTokens = definition.command.split(/\s+/u);
    if (queryTokens.length < commandTokens.length) {
      return false;
    }

    return commandTokens.every((commandToken, index) => {
      const queryToken = queryTokens[index];
      if (!queryToken) {
        return false;
      }

      if (index === 0) {
        return this.normalizeSlashCommandToken(queryToken) === commandToken;
      }

      return queryToken.toLowerCase() === commandToken;
    });
  }

  private normalizeSlashCommandToken(token: string): string {
    const normalizedToken = token.toLowerCase();
    return SESSION_SLASH_COMMAND_ALIASES[normalizedToken] ?? normalizedToken;
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
