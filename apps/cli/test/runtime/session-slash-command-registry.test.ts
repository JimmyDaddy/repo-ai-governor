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
  'cli.sessionShell.commands.planSync.summary':
    'Preview or commit deterministic sprint-ledger projection for an existing plan.',
  'cli.sessionShell.commands.status.summary':
    'Show session-shell status and hidden runtime details.',
  'cli.sessionShell.commands.theme.summary': 'Inspect or update the theme.',
  'cli.sessionShell.commands.agent.summary': 'Inspect the current foreground route.',
  'cli.commands.init.description': 'Initialize governor workspace baseline.',
  'cli.commands.config.description': 'Inspect or update user-level default configuration.',
  'cli.commands.secret.description': 'Manage secret entries through configured local backends.',
  'cli.commands.workspace.description': 'Plan or execute workspace migration baseline.',
  'cli.commands.workspace.actionGuideDryRun':
    'Preview the workspace migration plan; requires --workspace-mode <repo_local|tool_managed>.',
  'cli.commands.workspace.actionGuideExecute':
    'Apply the workspace migration plan for the selected workspace mode.',
  'cli.commands.workspace.actionGuideRollback':
    'Restore the previous workspace surface from a saved --workspace-plan artifact.',
  'cli.commands.workspace.actionGuideClearConfig':
    'Remove the current governor workspace config so init can rebuild a clean baseline.',
  'cli.commands.workspace.actionGuideSetUiTheme':
    'Open the session-shell theme selector or persist one explicit workspace/global theme.',
  'cli.reactShell.themePresets.governor.description':
    'Cool blue-gray default palette with higher contrast for governance-focused information.',
  'cli.reactShell.themePresets.copilot.description':
    'Compact blue-black shell inspired by GitHub Copilot surfaces.',
  'cli.reactShell.themePresets.catppuccin.description':
    'Vivid pastel palette for a more expressive shell surface.',
  'cli.reactShell.themePresets.calm.description': 'Soft low-contrast palette for longer sessions.',
  'cli.reactShell.themePresets.tokyo-night.description':
    'Electric midnight blues with crisp cyan-violet highlights.',
  'cli.reactShell.themePresets.kanagawa.description':
    'Muted Japanese-ink palette with warm neutrals and soft gold accents.',
  'cli.reactShell.themePresets.flexoki.description':
    'Warm ink-on-paper contrast with readable amber and teal accents.',
  'sessionMainCapabilities.catalog.branch_switch.summary':
    'Switch the current repository to an existing local git branch through the governed workspace flow.',
  'sessionMainCapabilities.catalog.connect.summary':
    'Prepare and apply adapter onboarding changes for this workspace.',
  'sessionMainCapabilities.catalog.doctor.summary':
    'Diagnose adapter health, environment readiness, and route blockers.',
  'sessionMainCapabilities.catalog.workflow.summary':
    'Preview or enter the governed workflow definition surface.',
  'sessionMainCapabilities.catalog.run.summary':
    'Start a reusable governed workflow or task-driven execution flow.',
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
      '/workspace switch-branch',
      '/doctor',
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
      '/workspace dry-run',
      '/workspace execute',
      '/workspace rollback',
      '/workspace clear-config',
      '/workspace switch-branch',
      '/workspace set-ui-theme',
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

    expect(suggestions.map((suggestion) => suggestion.command)).not.toContain('/confirm');
    expect(suggestions.map((suggestion) => suggestion.command)).not.toContain('/cancel');
    expect(suggestions.map((suggestion) => suggestion.command)).toContain('/sessions');
    expect(suggestions.map((suggestion) => suggestion.command)).toContain('/fork');
    expect(suggestions.map((suggestion) => suggestion.command)).toContain('/archive');
    expect(suggestions.map((suggestion) => suggestion.command)).toContain('/unarchive');
    expect(suggestions.map((suggestion) => suggestion.command)).toContain('/workflow');
    expect(suggestions.map((suggestion) => suggestion.command)).toContain('/plan sync');
    expect(suggestions.map((suggestion) => suggestion.command)).toContain('/config');
    expect(suggestions.map((suggestion) => suggestion.command)).toContain('/secret');
    expect(suggestions.map((suggestion) => suggestion.command)).toContain('/workspace dry-run');
    expect(suggestions.map((suggestion) => suggestion.command)).toContain('/workspace execute');
    expect(suggestions.map((suggestion) => suggestion.command)).toContain('/workspace rollback');
    expect(suggestions.map((suggestion) => suggestion.command)).toContain(
      '/workspace clear-config',
    );
    expect(suggestions.map((suggestion) => suggestion.command)).toContain(
      '/workspace switch-branch',
    );
    expect(suggestions.map((suggestion) => suggestion.command)).toContain(
      '/workspace set-ui-theme',
    );
    expect(suggestions.map((suggestion) => suggestion.command)).toContain('/review verify');
    expect(suggestions[0]?.command).toBe('/help');
  });

  it('surfaces nested workspace actions when the query narrows under /workspace', () => {
    const registry = new CliSessionSlashCommandRegistry();

    const suggestions = registry.suggest('/workspace s', translate);

    expect(suggestions.map((suggestion) => suggestion.command)).toEqual([
      '/workspace switch-branch',
      '/workspace set-ui-theme',
    ]);
  });

  it('surfaces theme preset choices when the query narrows under /workspace set-ui-theme', () => {
    const registry = new CliSessionSlashCommandRegistry();

    expect(registry.suggest('/workspace set-ui-theme', translate)).toEqual([
      {
        command: '/workspace set-ui-theme governor',
        summary:
          'Cool blue-gray default palette with higher contrast for governance-focused information.',
        highlightSegments: [
          { text: '/', highlighted: false },
          { text: 'workspace set-ui-theme', highlighted: true },
          { text: ' governor', highlighted: false },
        ],
      },
      {
        command: '/workspace set-ui-theme copilot',
        summary: 'Compact blue-black shell inspired by GitHub Copilot surfaces.',
        highlightSegments: [
          { text: '/', highlighted: false },
          { text: 'workspace set-ui-theme', highlighted: true },
          { text: ' copilot', highlighted: false },
        ],
      },
      {
        command: '/workspace set-ui-theme catppuccin',
        summary: 'Vivid pastel palette for a more expressive shell surface.',
        highlightSegments: [
          { text: '/', highlighted: false },
          { text: 'workspace set-ui-theme', highlighted: true },
          { text: ' catppuccin', highlighted: false },
        ],
      },
      {
        command: '/workspace set-ui-theme calm',
        summary: 'Soft low-contrast palette for longer sessions.',
        highlightSegments: [
          { text: '/', highlighted: false },
          { text: 'workspace set-ui-theme', highlighted: true },
          { text: ' calm', highlighted: false },
        ],
      },
      {
        command: '/workspace set-ui-theme tokyo-night',
        summary: 'Electric midnight blues with crisp cyan-violet highlights.',
        highlightSegments: [
          { text: '/', highlighted: false },
          { text: 'workspace set-ui-theme', highlighted: true },
          { text: ' tokyo-night', highlighted: false },
        ],
      },
      {
        command: '/workspace set-ui-theme kanagawa',
        summary: 'Muted Japanese-ink palette with warm neutrals and soft gold accents.',
        highlightSegments: [
          { text: '/', highlighted: false },
          { text: 'workspace set-ui-theme', highlighted: true },
          { text: ' kanagawa', highlighted: false },
        ],
      },
      {
        command: '/workspace set-ui-theme flexoki',
        summary: 'Warm ink-on-paper contrast with readable amber and teal accents.',
        highlightSegments: [
          { text: '/', highlighted: false },
          { text: 'workspace set-ui-theme', highlighted: true },
          { text: ' flexoki', highlighted: false },
        ],
      },
    ]);

    expect(registry.suggest('/workspace set-ui-theme c', translate)).toEqual([
      {
        command: '/workspace set-ui-theme copilot',
        summary: 'Compact blue-black shell inspired by GitHub Copilot surfaces.',
        highlightSegments: [
          { text: '/', highlighted: false },
          { text: 'workspace set-ui-theme c', highlighted: true },
          { text: 'opilot', highlighted: false },
        ],
      },
      {
        command: '/workspace set-ui-theme catppuccin',
        summary: 'Vivid pastel palette for a more expressive shell surface.',
        highlightSegments: [
          { text: '/', highlighted: false },
          { text: 'workspace set-ui-theme c', highlighted: true },
          { text: 'atppuccin', highlighted: false },
        ],
      },
      {
        command: '/workspace set-ui-theme calm',
        summary: 'Soft low-contrast palette for longer sessions.',
        highlightSegments: [
          { text: '/', highlighted: false },
          { text: 'workspace set-ui-theme c', highlighted: true },
          { text: 'alm', highlighted: false },
        ],
      },
    ]);
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
    expect(registry.findByCommand('/workspace switch-branch main', translate)).toEqual({
      command: '/workspace switch-branch',
      summary:
        'Switch the current repository to an existing local git branch through the governed workspace flow.',
    });
    expect(registry.findByCommand('/config set ui.react.theme calm', translate)).toEqual({
      command: '/config',
      summary: 'Inspect or update user-level default configuration.',
    });
    expect(registry.findByCommand('/secret set api.token abc', translate)).toEqual({
      command: '/secret',
      summary: 'Manage secret entries through configured local backends.',
    });
    expect(
      registry.findByCommand('/workspace dry-run --workspace-mode repo_local', translate),
    ).toEqual({
      command: '/workspace dry-run',
      summary:
        'Preview the workspace migration plan; requires --workspace-mode <repo_local|tool_managed>.',
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
      aiWorkflowPrompt: [
        'Run the standard review-verification workflow for the following target.',
        'Recheck the existing review artifact or fix result and determine whether accepted findings are actually resolved.',
        'Return a structured verification result rather than an open-ended expert discussion.',
        '',
        'Verification target: latest',
      ].join('\n'),
      command: '/review verify',
      executionMode: 'direct',
      kind: 'ai_workflow',
      summaryKey: 'sessionMainCapabilities.catalog.review_verify.summary',
    });
    expect(registry.resolveAction('/plan')).toEqual({
      aiWorkflowPrompt:
        'Use the standard planning template to create an execution plan for the current goal. Do not sync anything to the sprint ledger yet.',
      command: '/plan',
      executionMode: 'direct',
      kind: 'ai_workflow',
      summaryKey: 'sessionMainCapabilities.catalog.plan.summary',
    });
    expect(registry.resolveAction('/plan ship a tetris clone')).toEqual({
      aiWorkflowPrompt: [
        'Use the standard planning template to create an execution plan for the following goal.',
        'Do not sync anything to the sprint ledger yet.',
        '',
        'Goal: ship a tetris clone',
      ].join('\n'),
      command: '/plan',
      executionMode: 'direct',
      kind: 'ai_workflow',
      summaryKey: 'sessionMainCapabilities.catalog.plan.summary',
    });
    expect(registry.resolveAction('/PLAN Fix API naming in README.md')).toEqual({
      aiWorkflowPrompt: [
        'Use the standard planning template to create an execution plan for the following goal.',
        'Do not sync anything to the sprint ledger yet.',
        '',
        'Goal: Fix API naming in README.md',
      ].join('\n'),
      command: '/plan',
      executionMode: 'direct',
      kind: 'ai_workflow',
      summaryKey: 'sessionMainCapabilities.catalog.plan.summary',
    });
    expect(registry.resolveAction('/plan sync')).toEqual({
      bridgeArgv: ['plan'],
      command: '/plan sync',
      executionMode: 'direct',
      kind: 'bridge',
      summaryKey: 'cli.sessionShell.commands.planSync.summary',
    });
    expect(registry.resolveAction('/plan sync commit preview.json --confirm-plan approve')).toEqual(
      {
        bridgeArgv: ['plan', 'commit', 'preview.json', '--confirm-plan', 'approve'],
        command: '/plan sync',
        executionMode: 'direct',
        kind: 'bridge',
        summaryKey: 'cli.sessionShell.commands.planSync.summary',
      },
    );
    expect(registry.resolveAction('/config set ui.react.theme calm')).toEqual({
      bridgeArgv: ['config', 'set', 'ui.react.theme', 'calm'],
      command: '/config',
      executionMode: 'direct',
      kind: 'bridge',
      summaryKey: 'cli.commands.config.description',
    });
    expect(registry.resolveAction('/secret set api.token')).toEqual({
      command: '/secret set',
      kind: 'secure_local_secret_capture',
      secureLocalSecretCapture: {
        action: 'set',
        keyName: 'api.token',
        displayCommand: '/secret set api.token',
        rejectedSuffix: false,
      },
      summaryKey: 'cli.commands.secret.description',
    });
    expect(registry.resolveAction('/secret set api.token super-secret')).toEqual({
      command: '/secret set',
      kind: 'secure_local_secret_capture',
      secureLocalSecretCapture: {
        action: 'set',
        keyName: 'api.token',
        displayCommand: '/secret set api.token',
        rejectedSuffix: true,
      },
      summaryKey: 'cli.commands.secret.description',
    });
    expect(registry.resolveAction('/secret set --help')).toEqual({
      bridgeArgv: ['secret', 'set', '--help'],
      command: '/secret',
      executionMode: 'direct',
      kind: 'bridge',
      summaryKey: 'cli.commands.secret.description',
    });
    expect(registry.resolveAction('/secret set -h')).toEqual({
      bridgeArgv: ['secret', 'set', '-h'],
      command: '/secret',
      executionMode: 'direct',
      kind: 'bridge',
      summaryKey: 'cli.commands.secret.description',
    });
    expect(registry.resolveAction('/SECRET list')).toEqual({
      bridgeArgv: ['secret', 'list'],
      command: '/secret',
      executionMode: 'direct',
      kind: 'bridge',
      summaryKey: 'cli.commands.secret.description',
    });
    expect(
      registry.resolveAction(
        '/PLAN SYNC commit ./Context/Plan/MyPreview.preview.json --confirm-plan approve',
      ),
    ).toEqual({
      bridgeArgv: [
        'plan',
        'commit',
        './Context/Plan/MyPreview.preview.json',
        '--confirm-plan',
        'approve',
      ],
      command: '/plan sync',
      executionMode: 'direct',
      kind: 'bridge',
      summaryKey: 'cli.sessionShell.commands.planSync.summary',
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
      executionMode: 'direct',
      kind: 'bridge',
      summaryKey: 'sessionMainCapabilities.catalog.workflow.summary',
    });
    expect(registry.resolveAction('/workspace switch-branch main')).toEqual({
      bridgeArgv: ['workspace', 'switch-branch', 'main'],
      command: '/workspace switch-branch',
      executionMode: 'direct',
      kind: 'bridge',
      summaryKey: 'sessionMainCapabilities.catalog.branch_switch.summary',
    });
    expect(registry.resolveAction('/workspace dry-run --workspace-mode repo_local')).toEqual({
      bridgeArgv: ['workspace', 'dry-run', '--workspace-mode', 'repo_local'],
      command: '/workspace dry-run',
      executionMode: 'direct',
      kind: 'bridge',
      summaryKey: 'cli.commands.workspace.actionGuideDryRun',
    });
    expect(registry.resolveAction('/workspace set-ui-theme calm --theme-scope workspace')).toEqual({
      bridgeArgv: ['workspace', 'set-ui-theme', 'calm', '--theme-scope', 'workspace'],
      command: '/workspace set-ui-theme',
      executionMode: 'direct',
      kind: 'bridge',
      summaryKey: 'cli.commands.workspace.actionGuideSetUiTheme',
    });
    expect(registry.resolveAction('/connect')).toEqual({
      bridgeArgv: ['connect'],
      command: '/connect',
      executionMode: 'direct',
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
  });

  it('keeps /review on the AI fixed workflow path and /run on the governed bridge path', () => {
    const registry = new CliSessionSlashCommandRegistry();

    expect(registry.resolveAction('/review')).toEqual({
      aiWorkflowPrompt: [
        'Run the standard governed code-review workflow for the current working scope.',
        'Focus on user-visible regressions, behavior risk, and missing tests.',
        'Return a structured review-style result instead of a free-form expert brainstorm.',
      ].join('\n'),
      command: '/review',
      executionMode: 'direct',
      kind: 'ai_workflow',
      summaryKey: 'sessionMainCapabilities.catalog.review.summary',
    });
    expect(registry.resolveAction('/review current diff')).toEqual({
      aiWorkflowPrompt: [
        'Run the standard governed code-review workflow for the following scope.',
        'Focus on user-visible regressions, behavior risk, and missing tests.',
        'Return a structured review-style result instead of a free-form expert brainstorm.',
        '',
        'Review scope: current diff',
      ].join('\n'),
      command: '/review',
      executionMode: 'direct',
      kind: 'ai_workflow',
      summaryKey: 'sessionMainCapabilities.catalog.review.summary',
    });
    expect(registry.resolveAction('/run')).toEqual({
      bridgeArgv: ['run'],
      command: '/run',
      executionMode: 'direct',
      kind: 'bridge',
      summaryKey: 'sessionMainCapabilities.catalog.run.summary',
    });
    expect(registry.resolveAction('/run reusable-rollout')).toEqual({
      bridgeArgv: ['run', 'reusable-rollout'],
      command: '/run',
      executionMode: 'direct',
      kind: 'bridge',
      summaryKey: 'sessionMainCapabilities.catalog.run.summary',
    });
  });
});
