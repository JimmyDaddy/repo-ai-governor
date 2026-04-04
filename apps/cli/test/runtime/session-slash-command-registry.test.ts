import { CliSessionSlashCommandRegistry } from '../../src/runtime/interactive-shell/session-slash-command-registry.js';

const TRANSLATIONS: Record<string, string> = {
  'cli.sessionShell.commands.help.summary': 'List exposed session-shell commands.',
  'cli.sessionShell.commands.confirm.summary': 'Confirm the current command handoff.',
  'cli.sessionShell.commands.cancel.summary': 'Cancel the current command handoff.',
  'cli.sessionShell.commands.clear.summary': 'Clear the local transcript view.',
  'cli.sessionShell.commands.exit.summary': 'Exit the foreground shell.',
  'cli.sessionShell.commands.resume.summary': 'Resume the current or named session.',
  'cli.sessionShell.commands.sessions.summary': 'List recent active or archived sessions.',
  'cli.sessionShell.commands.fork.summary': 'Fork the current session into a new branch.',
  'cli.sessionShell.commands.archive.summary': 'Archive the current or named session.',
  'cli.sessionShell.commands.unarchive.summary': 'Restore an archived session and attach to it.',
  'cli.sessionShell.commands.history.summary': 'Show recent shell input history.',
  'cli.sessionShell.commands.search.summary': 'Search transcript and history.',
  'cli.sessionShell.commands.multiline.summary': 'Capture one multi-line turn.',
  'cli.sessionShell.commands.status.summary':
    'Show session-shell status and hidden runtime details.',
  'cli.sessionShell.commands.theme.summary': 'Inspect or update the theme.',
  'cli.sessionShell.commands.agent.summary': 'Inspect the current foreground route.',
  'cli.commands.init.description': 'Initialize governor workspace baseline.',
  'cli.commands.workspace.description': 'Plan or execute workspace migration baseline.',
  'sessionMainCapabilities.catalog.connect.summary':
    'Prepare and apply adapter onboarding changes for this workspace.',
  'sessionMainCapabilities.catalog.doctor.summary':
    'Diagnose adapter health, environment readiness, and route blockers.',
  'sessionMainCapabilities.catalog.verify.summary':
    'Verify routing, projection, and adapter readiness truth.',
  'sessionMainCapabilities.catalog.workflow.summary':
    'Preview or enter the governed workflow definition surface.',
  'sessionMainCapabilities.catalog.run.summary':
    'Start a governed execution flow for implementation or workflow work.',
  'sessionMainCapabilities.catalog.plan.summary':
    'Generate or refine a task breakdown for the current goal.',
  'sessionMainCapabilities.catalog.review.summary':
    'Run the governed code-review path for the current scope.',
  'sessionMainCapabilities.catalog.review_verify.summary':
    'Recheck a review report and confirm whether accepted findings are actually fixed.',
};

function translate(key: string): string {
  return TRANSLATIONS[key] ?? key;
}

describe('CliSessionSlashCommandRegistry', () => {
  it('returns a capped launcher shortlist for bare slash input', () => {
    const registry = new CliSessionSlashCommandRegistry();

    const suggestions = registry.suggest('/', translate);

    expect(suggestions.map((suggestion) => suggestion.command)).toEqual([
      '/workspace',
      '/doctor',
      '/verify',
      '/connect',
      '/review',
      '/plan',
      '/run',
      '/help',
    ]);
  });

  it('filters the MVP command set by slash-command prefix', () => {
    const registry = new CliSessionSlashCommandRegistry();

    const suggestions = registry.suggest('/wo', translate);

    expect(suggestions.map((suggestion) => suggestion.command)).toEqual([
      '/workspace',
      '/workflow',
    ]);
    expect(suggestions[0]?.highlightSegments).toEqual([
      { text: '/', highlighted: false },
      { text: 'wo', highlighted: true },
      { text: 'rkspace', highlighted: false },
    ]);
  });

  it('can expand empty-prefix help into the full command catalog', () => {
    const registry = new CliSessionSlashCommandRegistry();

    const suggestions = registry.suggest('/', translate, {
      surface: 'full',
    });

    expect(suggestions.map((suggestion) => suggestion.command)).toContain('/confirm');
    expect(suggestions.map((suggestion) => suggestion.command)).toContain('/sessions');
    expect(suggestions.map((suggestion) => suggestion.command)).toContain('/fork');
    expect(suggestions.map((suggestion) => suggestion.command)).toContain('/archive');
    expect(suggestions.map((suggestion) => suggestion.command)).toContain('/unarchive');
    expect(suggestions.map((suggestion) => suggestion.command)).toContain('/workflow');
    expect(suggestions.map((suggestion) => suggestion.command)).toContain('/review verify');
    expect(suggestions[0]?.command).toBe('/help');
  });

  it('resolves one exact slash command with localized summary text', () => {
    const registry = new CliSessionSlashCommandRegistry();

    expect(registry.findByCommand('/help', translate)).toEqual({
      command: '/help',
      summary: 'List exposed session-shell commands.',
    });
    expect(registry.findByCommand('/review verify latest', translate)).toEqual({
      command: '/review verify',
      summary: 'Recheck a review report and confirm whether accepted findings are actually fixed.',
    });
    expect(registry.findByCommand('/missing', translate)).toBeNull();
  });

  it('normalizes aliases and resolves bridge argv for review verify handoff', () => {
    const registry = new CliSessionSlashCommandRegistry();

    expect(registry.resolveAction('?')).toEqual({
      command: '/help',
      kind: 'builtin',
      summaryKey: 'cli.sessionShell.commands.help.summary',
    });
    expect(registry.resolveAction('/routing main')).toEqual({
      command: '/agent',
      kind: 'builtin',
      summaryKey: 'cli.sessionShell.commands.agent.summary',
    });
    expect(registry.resolveAction('/review verify latest')).toEqual({
      bridgeArgv: ['review-verify', 'latest'],
      command: '/review verify',
      executionMode: 'confirm',
      kind: 'bridge',
      summaryKey: 'sessionMainCapabilities.catalog.review_verify.summary',
    });
    expect(registry.resolveAction('/plan')).toEqual({
      bridgeArgv: ['plan'],
      command: '/plan',
      executionMode: 'direct',
      kind: 'bridge',
      summaryKey: 'sessionMainCapabilities.catalog.plan.summary',
    });
    expect(registry.resolveAction('/workflow')).toEqual({
      bridgeArgv: ['workflow', 'preview'],
      command: '/workflow',
      executionMode: 'direct',
      kind: 'bridge',
      summaryKey: 'sessionMainCapabilities.catalog.workflow.summary',
    });
    expect(registry.resolveAction('/workflow preview')).toEqual({
      bridgeArgv: ['workflow', 'preview'],
      command: '/workflow',
      executionMode: 'direct',
      kind: 'bridge',
      summaryKey: 'sessionMainCapabilities.catalog.workflow.summary',
    });
    expect(registry.resolveAction('/workflow create')).toEqual({
      bridgeArgv: ['workflow', 'create'],
      command: '/workflow',
      executionMode: 'confirm',
      kind: 'bridge',
      summaryKey: 'sessionMainCapabilities.catalog.workflow.summary',
    });
    expect(registry.resolveAction('/connect')).toEqual({
      bridgeArgv: ['connect'],
      command: '/connect',
      executionMode: 'confirm',
      kind: 'bridge',
      summaryKey: 'sessionMainCapabilities.catalog.connect.summary',
    });
    expect(registry.resolveAction('/doctor')).toEqual({
      bridgeArgv: ['doctor'],
      command: '/doctor',
      executionMode: 'direct',
      kind: 'bridge',
      summaryKey: 'sessionMainCapabilities.catalog.doctor.summary',
    });
    expect(registry.resolveAction('/verify')).toEqual({
      bridgeArgv: ['verify'],
      command: '/verify',
      executionMode: 'direct',
      kind: 'bridge',
      summaryKey: 'sessionMainCapabilities.catalog.verify.summary',
    });
  });
});
