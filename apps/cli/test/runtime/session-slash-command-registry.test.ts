import { CliSessionSlashCommandRegistry } from '../../src/runtime/interactive-shell/session-slash-command-registry.js';

const TRANSLATIONS: Record<string, string> = {
  'cli.sessionShell.commands.help.summary': 'List exposed session-shell commands.',
  'cli.sessionShell.commands.confirm.summary': 'Confirm the current command handoff.',
  'cli.sessionShell.commands.cancel.summary': 'Cancel the current command handoff.',
  'cli.sessionShell.commands.clear.summary': 'Clear the local transcript view.',
  'cli.sessionShell.commands.exit.summary': 'Exit the foreground shell.',
  'cli.sessionShell.commands.resume.summary': 'Resume the current or named session.',
  'cli.sessionShell.commands.history.summary': 'Show recent shell input history.',
  'cli.sessionShell.commands.search.summary': 'Search transcript and history.',
  'cli.sessionShell.commands.multiline.summary': 'Capture one multi-line turn.',
  'cli.sessionShell.commands.theme.summary': 'Inspect or update the theme.',
  'cli.sessionShell.commands.agent.summary': 'Inspect the current foreground route.',
  'cli.commands.init.description': 'Initialize governor workspace baseline.',
  'cli.commands.connect.description': 'Generate adapter onboarding diagnostics baseline.',
  'cli.commands.doctor.description': 'Run environment diagnostics baseline.',
  'cli.commands.workspace.description': 'Plan or execute workspace migration baseline.',
  'cli.commands.workflow.description': 'Preview or edit workflow definitions.',
  'cli.commands.run.description': 'Execute process runtime baseline.',
  'cli.commands.plan.description': 'Generate or update execution plan baseline.',
  'cli.commands.review.description': 'Generate code review baseline output.',
};

function translate(key: string): string {
  return TRANSLATIONS[key] ?? key;
}

describe('CliSessionSlashCommandRegistry', () => {
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

  it('resolves one exact slash command with localized summary text', () => {
    const registry = new CliSessionSlashCommandRegistry();

    expect(registry.findByCommand('/help', translate)).toEqual({
      command: '/help',
      summary: 'List exposed session-shell commands.',
    });
    expect(registry.findByCommand('/missing', translate)).toBeNull();
  });

  it('normalizes aliases and resolves bridge argv for review verify handoff', () => {
    const registry = new CliSessionSlashCommandRegistry();

    expect(registry.resolveAction('/routing main')).toEqual({
      command: '/agent',
      kind: 'builtin',
      summaryKey: 'cli.sessionShell.commands.agent.summary',
    });
    expect(registry.resolveAction('/review verify latest')).toEqual({
      bridgeArgv: ['review-verify', 'latest'],
      command: '/review',
      kind: 'bridge',
      summaryKey: 'cli.commands.review.description',
    });
  });
});
