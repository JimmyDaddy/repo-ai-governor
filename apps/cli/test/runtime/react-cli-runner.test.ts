import { AgentProjectionPanelStatusVariant } from '@repo-ai-governor/reporting';
import { ErrorOutputEnvironment, Locale } from '@repo-ai-governor/shared';
import { CliCommandName } from '../../src/constants/cli-command.constant.js';
import {
  CliInteractiveShellRunState,
  CliInteractiveShellStderrRenderingMode,
  CliInteractiveUiMode,
} from '../../src/constants/cli-interactive-shell.constant.js';
import { CliReactThemePreset } from '../../src/constants/cli-react-theme.constant.js';
import {
  CLI_SESSION_SHELL_INPUT_ACTION_CONTRACT,
  CliSessionShellForegroundFocusTarget,
  CliSessionShellForegroundInputOwner,
  CliSessionShellHandoffState,
  CliSessionShellInputMode,
  CliSessionShellMode,
  CliSessionShellPersistenceOwner,
  CliSessionTranscriptRole,
} from '../../src/constants/cli-session-shell.constant.js';
import { ReactCliRunner, ReactCliStderrFramePresenter } from '../../src/react-cli/index.js';
import { CliInteractiveShellStderrRenderer } from '../../src/runtime/interactive-shell/interactive-shell-stderr-renderer.js';
import { CliSessionShellStderrRenderer } from '../../src/runtime/interactive-shell/session-shell-stderr-renderer.js';
import type { CliInteractiveShellSessionState } from '../../src/types/index.js';

function normalizeRenderedOutput(output: string): string {
  return output.replace(/[│╭╮╰╯─═]/gu, ' ').replace(/\s+/gu, ' ');
}

describe('ReactCliRunner', () => {
  it('renders shared shell frames through Ink and Ink UI', () => {
    const runner = new ReactCliRunner();
    const output = runner.renderFrame({
      title: '[react-shell:init] Bootstrap workspace defaults',
      subtitle: 'state=editing ui=react stdout=pretty stderr=stderr_only',
      statusMessage: 'Validation feedback requires another input pass.',
      statusVariant: AgentProjectionPanelStatusVariant.WARNING,
      attentionSection: {
        title: 'Attention',
        lines: ['Adapter verification: warn'],
      },
      sections: [
        {
          title: 'Session',
          lines: ['step=Step 1 of 3: Workspace mode total_steps=3'],
        },
        {
          title: 'Details',
          lines: ['Choose where Repo AI Governor should keep its managed workspace metadata.'],
        },
      ],
      agentProjectionPanel: {
        title: 'Agent projection',
        summaryLine:
          'agents=2, surfaces=2, fallback=1, degraded=1, blocked=0, gaps=1, session=none',
        summaryBadges: ['fallback=1', 'degraded=1', 'blocked=0', 'session=none'],
        rows: [
          {
            id: 'coder:coder-default',
            title: 'coder -> github-copilot',
            detailLines: [
              'profile=coder-default selected_by=fallback status=warn',
              'capability_gap=degraded:tool_calling',
            ],
            statusVariant: AgentProjectionPanelStatusVariant.WARNING,
          },
        ],
      },
      helpSection: {
        title: 'Help',
        lines: ['Use --ui none to disable the shared shell.'],
      },
      footerShortcutsTitle: 'Shortcuts',
      footerShortcuts: ['Enter submit', 'Ctrl+C cancel'],
    });

    expect(output).toContain('[react-shell:init] Bootstrap workspace defaults');
    expect(output).toContain('Validation feedback requires another input pass.');
    expect(output).toContain('Attention');
    expect(output).toContain('Agent projection');
    expect(output).toContain('coder -> github-copilot');
    expect(output).toContain('Help');
    expect(output).toContain('Shortcuts');
  });

  it('renders leveled command progress logs with visible severity labels', () => {
    const runner = new ReactCliRunner();
    const output = normalizeRenderedOutput(
      runner.renderFrame({
        title: '[react-shell:doctor] doctor',
        subtitle: 'state=running ui=react stdout=pretty',
        commandProgressPanel: {
          title: 'Running progress',
          runState: 'running',
          statusLine: 'Doctor diagnostics are ready.',
          logsTitle: 'Recent logs',
          cancelCapability: 'supported',
          cancelLabel: 'Press Ctrl+C to request cancellation.',
          rows: [],
          artifacts: [],
          logEntries: [
            {
              text: 'doctor preflight fallback active',
              level: 'warning',
              label: 'WARN',
            },
            {
              text: 'doctor diagnostics ready',
              level: 'success',
              label: 'SUCCESS',
            },
          ],
          logLines: ['doctor preflight fallback active', 'doctor diagnostics ready'],
        },
        sections: [],
        footerShortcutsTitle: 'Shortcuts',
        footerShortcuts: ['Esc exit'],
      }),
    );

    expect(output).toContain('Running progress');
    expect(output).toContain('Recent logs');
    expect(output).toContain('[WARN] doctor preflight fallback active');
    expect(output).toContain('[SUCCESS] doctor diagnostics ready');
  });

  it('renders the session-shell frame through the shared Ink runner', () => {
    const runner = new ReactCliRunner();
    const output = runner.renderSessionShellFrame({
      sessionId: 'session-shell-preview-123',
      shellMode: CliSessionShellMode.SESSION_SHELL,
      inputMode: CliSessionShellInputMode.PLAIN_TEXT,
      transcriptItems: [
        {
          id: 'system:1',
          role: CliSessionTranscriptRole.SYSTEM,
          label: 'System',
          lines: ['Session shell foundation is active.'],
          renderKind: 'system_notice',
        },
        {
          id: 'user:2',
          role: CliSessionTranscriptRole.USER,
          label: 'You',
          lines: ['hello governor'],
          renderKind: 'plain_text',
        },
        {
          id: 'system:3',
          role: CliSessionTranscriptRole.SYSTEM,
          label: 'Live activity',
          lines: ['Inspecting workspace state.', 'Tool: repo_status - Reading git status.'],
          renderKind: 'live_activity',
          summaryLine: 'Running · 0s',
        },
      ],
      transcriptTitle: 'History',
      composerTitle: 'Input',
      composerValue: '',
      composerPlaceholder: 'Type a message or / command.',
      slashQuery: '/wo',
      slashPaletteVisible: true,
      slashSuggestions: [
        {
          command: '/workspace',
          summary: 'Plan or execute workspace migration baseline.',
          highlightSegments: [
            { text: '/', highlighted: false },
            { text: 'wo', highlighted: true },
            { text: 'rkspace', highlighted: false },
          ],
        },
      ],
      highlightedCommand: '/workspace',
      slashPaletteTitle: 'Slash palette',
      slashPaletteEmptyState: 'No slash commands matched.',
      commandPreview: 'preview=/workspace state=preview_only',
      handoffState: CliSessionShellHandoffState.PREVIEWING,
      cwd: '/workspace/repo',
      workspaceSummary: 'workspace_id=repo mode=repo_local',
      outputContract: ErrorOutputEnvironment.PRETTY,
      persistenceOwner: CliSessionShellPersistenceOwner.LOCAL_ORCHESTRATION_SERVICE,
      resumeSelector: 'latest',
      foregroundInputOwner: CliSessionShellForegroundInputOwner.READLINE_FALLBACK,
      foregroundFocusTarget: CliSessionShellForegroundFocusTarget.COMPOSER,
      inputActionContract: [...CLI_SESSION_SHELL_INPUT_ACTION_CONTRACT],
      title: 'Repo AI Governor',
      subtitle: 'Session-first preview baseline.',
      promptBarTitle: 'Prompt bar',
      promptBarLines: ['/confirm · /cancel · Esc'],
    });

    expect(output).toContain('Repo AI Governor');
    expect(output).toContain('Session shell foundation is active.');
    expect(output).toContain('History');
    expect(output).toContain('Type a message or / command.');
    expect(output).toContain('Live activity');
    expect(output).toContain('Running · 0s');
    expect(output).toContain('Inspecting workspace state.');
    expect(output).toContain('>');
    expect(output).toContain('/workspace');
    expect(output).toContain('› ');
    expect(output).toContain('Session-first preview baseline.');
    expect(output).toContain('/workspace/repo');
    expect(output).toContain('workspace_id=repo mode=repo_local');
    expect(output).not.toContain('Prompt bar');
    expect(output).not.toContain('session_id=');
    expect(output).not.toContain('shell_mode=');
    expect(output).not.toContain('query=');
    expect(output).toContain('/confirm · /cancel · Esc');
  });

  it('renders secure-local capture guidance without reflecting secret text or length', () => {
    const runner = new ReactCliRunner();
    const output = runner.renderSessionShellFrame({
      sessionId: 'session-shell-secure-capture-123',
      shellMode: CliSessionShellMode.SECURE_LOCAL_CAPTURE,
      inputMode: CliSessionShellInputMode.SECURE_LOCAL,
      transcriptItems: [
        {
          id: 'system:1',
          role: CliSessionTranscriptRole.SYSTEM,
          label: 'System',
          lines: [
            'Secure local capture is active for /secret set openai/api-key. Typed input stays hidden on this device.',
          ],
          renderKind: 'system_notice',
        },
      ],
      transcriptTitle: 'History',
      composerTitle: 'Secure input',
      composerValue: '',
      composerPlaceholder: 'Secret input stays hidden while you type.',
      slashQuery: '',
      slashPaletteVisible: false,
      slashSuggestions: [],
      highlightedCommand: null,
      slashPaletteTitle: 'Slash palette',
      slashPaletteEmptyState: 'No slash commands matched.',
      commandPreview:
        'Secure local capture is active for /secret set openai/api-key. Typed input stays hidden on this device.',
      handoffState: CliSessionShellHandoffState.IDLE,
      cwd: '/workspace/repo',
      workspaceSummary: 'workspace_id=repo mode=repo_local',
      outputContract: ErrorOutputEnvironment.PRETTY,
      persistenceOwner: CliSessionShellPersistenceOwner.LOCAL_ORCHESTRATION_SERVICE,
      resumeSelector: 'latest',
      foregroundInputOwner: CliSessionShellForegroundInputOwner.INK,
      foregroundFocusTarget: CliSessionShellForegroundFocusTarget.SECURE_CAPTURE,
      inputActionContract: [...CLI_SESSION_SHELL_INPUT_ACTION_CONTRACT],
      secureCapture: {
        displayCommand: '/secret set openai/api-key',
        keyName: 'openai/api-key',
      },
      title: 'Repo AI Governor',
      subtitle: 'Session-first preview baseline.',
      promptBarTitle: 'Prompt bar',
      promptBarLines: ['Enter submit · Esc cancel · Ctrl+D'],
    });

    expect(output).toContain('Secure input');
    expect(output).toContain('Secret input stays hidden while you type.');
    expect(output).toContain('Enter submit · Esc cancel · Ctrl+D');
    expect(output).not.toContain('sk-live-secret');
  });

  it('renders a welcome screen for empty sessions and supports the copilot theme preset', () => {
    const runner = new ReactCliRunner();
    const output = runner.renderSessionShellFrame({
      sessionId: 'session-shell-empty-welcome',
      shellMode: CliSessionShellMode.SESSION_SHELL,
      inputMode: CliSessionShellInputMode.PLAIN_TEXT,
      transcriptItems: [],
      transcriptTitle: 'History',
      composerTitle: 'Input',
      composerValue: '',
      composerPlaceholder: 'Type a message or / command.',
      slashQuery: '',
      slashPaletteVisible: false,
      slashSuggestions: [
        {
          command: '/workspace',
          summary: 'Plan or execute workspace migration baseline.',
          highlightSegments: [{ text: '/workspace', highlighted: false }],
        },
        {
          command: '/doctor',
          summary: 'Diagnose adapter health, environment readiness, and route blockers.',
          highlightSegments: [{ text: '/doctor', highlighted: false }],
        },
      ],
      highlightedCommand: '/workspace',
      slashPaletteTitle: 'Slash palette',
      slashPaletteEmptyState: 'No slash commands matched.',
      commandPreview: null,
      handoffState: CliSessionShellHandoffState.IDLE,
      cwd: '/workspace/repo',
      workspaceSummary: 'workspace_id=repo mode=repo_local',
      outputContract: ErrorOutputEnvironment.PRETTY,
      persistenceOwner: CliSessionShellPersistenceOwner.LOCAL_ORCHESTRATION_SERVICE,
      resumeSelector: 'latest',
      foregroundInputOwner: CliSessionShellForegroundInputOwner.INK,
      foregroundFocusTarget: CliSessionShellForegroundFocusTarget.COMPOSER,
      inputActionContract: [...CLI_SESSION_SHELL_INPUT_ACTION_CONTRACT],
      title: 'Repo AI Governor',
      subtitle: 'Session-first preview baseline.',
      promptBarTitle: 'Prompt bar',
      promptBarLines: ['? shortcuts · /status · Ctrl+D'],
      themePreset: CliReactThemePreset.COPILOT,
    });

    expect(output).toContain('Repo AI Governor');
    expect(output).toContain('[copilot]');
    expect(output).toContain('Session-first preview baseline.');
    expect(output).toContain('/workspace/repo');
    expect(output).toContain('/workspace');
    expect(output).toContain('/doctor');
    expect(output).toContain('Type a message or / command.');
    expect(output).not.toContain('History');
  });

  it('renders markdown answers, structured command recap, and collaboration recap transcript items', () => {
    const runner = new ReactCliRunner();
    const output = runner.renderSessionShellFrame({
      sessionId: 'session-shell-markdown-456',
      shellMode: CliSessionShellMode.SESSION_SHELL,
      inputMode: CliSessionShellInputMode.PLAIN_TEXT,
      transcriptItems: [
        {
          id: 'assistant:1',
          role: CliSessionTranscriptRole.ASSISTANT,
          label: 'Governor',
          lines: ['# Delivery plan\n- inspect current stream\n- run build'],
          renderKind: 'markdown',
          markdownSource: '# Delivery plan\n- inspect current stream\n- run build',
        },
        {
          id: 'assistant:2',
          role: CliSessionTranscriptRole.ASSISTANT,
          label: 'Governor',
          lines: [
            'Suggested next step: /connect',
            'Preview: repo-ai-governor connect --output pretty',
            'Intent: connect.adapters.bootstrap',
          ],
          renderKind: 'command_recap',
          backlinks: [
            {
              kind: 'slash_command',
              label: 'slash:/connect',
              target: '/connect',
            },
          ],
        },
        {
          id: 'assistant:3',
          role: CliSessionTranscriptRole.ASSISTANT,
          label: 'Governor',
          lines: [
            'Parallel role fan-out completed.',
            'Active role: architect · reviewer · verifier (count=3)',
            'Synthesis: parallel_analysis',
            'Execution surface: architect:ollama | reviewer:ollama | verifier:ollama',
            'Execution surface selection switched to a fallback automatically.',
          ],
          renderKind: 'collaboration_recap',
          markdownSource:
            '## Architect + Reviewer + Verifier Parallel Analysis\n\n### Architect\n\n- architecture risk\n\n### Reviewer\n\n- review risk\n\n### Verifier\n\n- verification risk',
          details: {
            title: 'Execution details',
            summaryLine: '▶ Collapsed · 2 entries · Ctrl+O to open',
            lines: [
              'reviewer: Running command: git diff --stat',
              'reviewer: Completed todo: inspect patch',
            ],
            expanded: false,
          },
        },
      ],
      transcriptTitle: 'History',
      composerTitle: 'Input',
      composerValue: '',
      composerPlaceholder: 'Type a message or / command.',
      slashQuery: '',
      slashPaletteVisible: false,
      slashSuggestions: [],
      highlightedCommand: null,
      slashPaletteTitle: 'Slash palette',
      slashPaletteEmptyState: 'No slash commands matched.',
      commandPreview: null,
      handoffState: CliSessionShellHandoffState.IDLE,
      cwd: '/workspace/repo',
      workspaceSummary: 'workspace_id=repo mode=repo_local',
      outputContract: ErrorOutputEnvironment.PRETTY,
      persistenceOwner: CliSessionShellPersistenceOwner.LOCAL_ORCHESTRATION_SERVICE,
      resumeSelector: 'latest',
      foregroundInputOwner: CliSessionShellForegroundInputOwner.INK,
      foregroundFocusTarget: CliSessionShellForegroundFocusTarget.COMPOSER,
      inputActionContract: [...CLI_SESSION_SHELL_INPUT_ACTION_CONTRACT],
      title: 'Repo AI Governor',
      subtitle: 'Session-first preview baseline.',
      promptBarTitle: 'Prompt bar',
      promptBarLines: ['? shortcuts · /status · Ctrl+D'],
    });
    const normalizedOutput = normalizeRenderedOutput(output);

    expect(output).toContain('Delivery plan');
    expect(output).toContain('- inspect current stream');
    expect(output).toContain('Suggested next step: /connect');
    expect(output).toContain('[Preview]');
    expect(output).toContain('repo-ai-governor connect --output pretty');
    expect(output).toContain('[Intent]');
    expect(output).toContain('connect.adapters.bootstrap');
    expect(output).toContain('role collaboration');
    expect(output).toContain('[Active role]');
    expect(output).toContain('- architect');
    expect(output).toContain('- reviewer');
    expect(output).toContain('- verifier (count=3)');
    expect(output).toContain('[Synthesis]');
    expect(output).toContain('parallel_analysis');
    expect(output).toContain('[Execution surface]');
    expect(output).toContain('architect:ollama | reviewer:ollama | verifier:ollama');
    expect(normalizedOutput).toContain(
      'Execution surface selection switched to a fallback automatically.',
    );
    expect(output).toContain('Execution details');
    expect(output).toContain('Collapsed · 2 entries · Ctrl+O to open');
    expect(output).toContain('Architect + Reviewer + Verifier Parallel Analysis');
    expect(output).toContain('Related');
    expect(output).toContain('- slash:/connect -> /connect');
  });

  it('right-aligns user-authored transcript items, keeps assistant output on the left, and hides speaker labels', () => {
    const runner = new ReactCliRunner();
    const output = runner.renderSessionShellFrame(
      {
        sessionId: 'session-shell-alignment-789',
        shellMode: CliSessionShellMode.SESSION_SHELL,
        inputMode: CliSessionShellInputMode.PLAIN_TEXT,
        transcriptItems: [
          {
            id: 'assistant:1',
            role: CliSessionTranscriptRole.ASSISTANT,
            label: 'Assistant label should stay hidden',
            lines: ['assistant output anchor'],
            renderKind: 'plain_text',
          },
          {
            id: 'user:2',
            role: CliSessionTranscriptRole.USER,
            label: 'User label should stay hidden',
            lines: ['user message anchor'],
            renderKind: 'plain_text',
          },
          {
            id: 'slash:3',
            role: CliSessionTranscriptRole.SLASH_COMMAND,
            label: 'Slash Command',
            lines: ['/workspace migrate anchor'],
            renderKind: 'plain_text',
          },
        ],
        transcriptTitle: 'History',
        composerTitle: 'Input',
        composerValue: '',
        composerPlaceholder: 'Type a message or / command.',
        slashQuery: '',
        slashPaletteVisible: false,
        slashSuggestions: [],
        highlightedCommand: null,
        slashPaletteTitle: 'Slash palette',
        slashPaletteEmptyState: 'No slash commands matched.',
        commandPreview: null,
        handoffState: CliSessionShellHandoffState.IDLE,
        cwd: '/workspace/repo',
        workspaceSummary: 'workspace_id=repo mode=repo_local',
        outputContract: ErrorOutputEnvironment.PRETTY,
        persistenceOwner: CliSessionShellPersistenceOwner.LOCAL_ORCHESTRATION_SERVICE,
        resumeSelector: 'latest',
        foregroundInputOwner: CliSessionShellForegroundInputOwner.INK,
        foregroundFocusTarget: CliSessionShellForegroundFocusTarget.COMPOSER,
        inputActionContract: [...CLI_SESSION_SHELL_INPUT_ACTION_CONTRACT],
        title: 'Repo AI Governor',
        subtitle: 'Session-first preview baseline.',
        promptBarTitle: 'Prompt bar',
        promptBarLines: ['? shortcuts · /status · Ctrl+D'],
      },
      {
        columns: 120,
      },
    );

    const lines = output.split('\n');
    const assistantLine = lines.find((line) => line.includes('assistant output anchor'));
    const userLine = lines.find((line) => line.includes('user message anchor'));
    const slashLine = lines.find((line) => line.includes('/workspace migrate anchor'));

    expect(output).not.toContain('Assistant label should stay hidden');
    expect(output).not.toContain('User label should stay hidden');
    expect(assistantLine).toBeDefined();
    expect(userLine).toBeDefined();
    expect(slashLine).toBeDefined();
    expect(userLine?.indexOf('user message anchor') ?? -1).toBeGreaterThan(
      assistantLine?.indexOf('assistant output anchor') ?? -1,
    );
    expect(slashLine?.indexOf('/workspace migrate anchor') ?? -1).toBeGreaterThan(
      assistantLine?.indexOf('assistant output anchor') ?? -1,
    );
  });

  it('renders live activity lines with compact source tags instead of raw log prefixes', () => {
    const runner = new ReactCliRunner();
    const output = runner.renderSessionShellFrame({
      sessionId: 'session-shell-live-activity-compact',
      shellMode: CliSessionShellMode.SESSION_SHELL,
      inputMode: CliSessionShellInputMode.PLAIN_TEXT,
      transcriptItems: [
        {
          id: 'system:activity',
          role: CliSessionTranscriptRole.SYSTEM,
          label: 'Live activity',
          lines: [
            'reviewer: Codex repository review is running; waiting for CLI output.',
            'Tool: git - Reading diff summary.',
            'codex stderr: Not inside a trusted directory.',
          ],
          renderKind: 'live_activity',
          summaryLine: 'Running · 12s',
        },
      ],
      transcriptTitle: 'History',
      composerTitle: 'Input',
      composerValue: '',
      composerPlaceholder: 'Type a message or / command.',
      slashQuery: '',
      slashPaletteVisible: false,
      slashSuggestions: [],
      highlightedCommand: null,
      slashPaletteTitle: 'Slash palette',
      slashPaletteEmptyState: 'No slash commands matched.',
      commandPreview: null,
      handoffState: CliSessionShellHandoffState.IDLE,
      cwd: '/workspace/repo',
      workspaceSummary: 'workspace_id=repo mode=repo_local',
      outputContract: ErrorOutputEnvironment.PRETTY,
      persistenceOwner: CliSessionShellPersistenceOwner.LOCAL_ORCHESTRATION_SERVICE,
      resumeSelector: 'latest',
      foregroundInputOwner: CliSessionShellForegroundInputOwner.INK,
      foregroundFocusTarget: CliSessionShellForegroundFocusTarget.COMPOSER,
      inputActionContract: [...CLI_SESSION_SHELL_INPUT_ACTION_CONTRACT],
      title: 'Repo AI Governor',
      subtitle: 'Session-first preview baseline.',
      promptBarTitle: 'Prompt bar',
      promptBarLines: ['? shortcuts · /status · Ctrl+D'],
    });
    const normalizedOutput = normalizeRenderedOutput(output);

    expect(output).toContain('[reviewer]');
    expect(normalizedOutput).toContain(
      'Codex repository review is running; waiting for CLI output.',
    );
    expect(output).toContain('[git]');
    expect(output).toContain('Reading diff summary.');
    expect(output).toContain('[codex stderr]');
    expect(output).toContain('Not inside a trusted directory.');
  });

  it('renders system-origin live activity lines with a distinct system tag', () => {
    const runner = new ReactCliRunner();
    const output = runner.renderSessionShellFrame({
      sessionId: 'session-shell-live-activity-system-tag',
      shellMode: CliSessionShellMode.SESSION_SHELL,
      inputMode: CliSessionShellInputMode.PLAIN_TEXT,
      transcriptItems: [
        {
          id: 'system:activity',
          role: CliSessionTranscriptRole.SYSTEM,
          label: 'Live activity',
          lines: [
            'reviewer system: Codex repository review is still running (15s elapsed); waiting for CLI output.',
            'reviewer: Inspecting changed files before drafting findings',
          ],
          renderKind: 'live_activity',
          summaryLine: 'Running · 15s',
        },
      ],
      transcriptTitle: 'History',
      composerTitle: 'Input',
      composerValue: '',
      composerPlaceholder: 'Type a message or / command.',
      slashQuery: '',
      slashPaletteVisible: false,
      slashSuggestions: [],
      highlightedCommand: null,
      slashPaletteTitle: 'Slash palette',
      slashPaletteEmptyState: 'No slash commands matched.',
      commandPreview: null,
      handoffState: CliSessionShellHandoffState.IDLE,
      cwd: '/workspace/repo',
      workspaceSummary: 'workspace_id=repo mode=repo_local',
      outputContract: ErrorOutputEnvironment.PRETTY,
      persistenceOwner: CliSessionShellPersistenceOwner.LOCAL_ORCHESTRATION_SERVICE,
      resumeSelector: 'latest',
      foregroundInputOwner: CliSessionShellForegroundInputOwner.INK,
      foregroundFocusTarget: CliSessionShellForegroundFocusTarget.COMPOSER,
      inputActionContract: [...CLI_SESSION_SHELL_INPUT_ACTION_CONTRACT],
      title: 'Repo AI Governor',
      subtitle: 'Session-first preview baseline.',
      promptBarTitle: 'Prompt bar',
      promptBarLines: ['? shortcuts · /status · Ctrl+D'],
    });

    expect(output).toContain('[reviewer system]');
    expect(output).toContain('Codex repository review is still running');
    expect(output).toContain('waiting for CLI output.');
    expect(output).toContain('[reviewer]');
    expect(output).toContain('Inspecting changed files before drafting findings');
  });

  it('mounts the session-shell tree through Ink for live stderr rendering', () => {
    const fakeInstance = {
      rerender: vi.fn(),
    };
    const renderLiveTree = vi.fn(() => fakeInstance);
    const runner = new ReactCliRunner(renderLiveTree as never);

    const instance = runner.mountSessionShell(
      {
        sessionId: 'session-shell-preview-ink',
        shellMode: CliSessionShellMode.SESSION_SHELL,
        inputMode: CliSessionShellInputMode.PLAIN_TEXT,
        transcriptItems: [],
        transcriptTitle: 'History',
        composerTitle: 'Input',
        composerValue: '',
        composerPlaceholder: 'Type a message or / command.',
        slashQuery: '',
        slashPaletteVisible: false,
        slashSuggestions: [],
        highlightedCommand: null,
        slashPaletteTitle: 'Slash palette',
        slashPaletteEmptyState: 'No slash commands matched.',
        commandPreview: null,
        handoffState: CliSessionShellHandoffState.IDLE,
        cwd: '/workspace/repo',
        workspaceSummary: 'workspace_id=repo mode=repo_local',
        outputContract: ErrorOutputEnvironment.PRETTY,
        persistenceOwner: CliSessionShellPersistenceOwner.LOCAL_ORCHESTRATION_SERVICE,
        resumeSelector: 'latest',
        foregroundInputOwner: CliSessionShellForegroundInputOwner.INK,
        foregroundFocusTarget: CliSessionShellForegroundFocusTarget.COMPOSER,
        inputActionContract: [...CLI_SESSION_SHELL_INPUT_ACTION_CONTRACT],
        title: 'Repo AI Governor',
        subtitle: 'Session-first preview baseline.',
        promptBarTitle: 'Prompt bar',
        promptBarLines: ['? shortcuts · /status · Ctrl+D'],
      },
      {
        stdout: process.stderr,
      },
    );

    expect(renderLiveTree).toHaveBeenCalledTimes(1);
    expect(instance).toBe(fakeInstance);
  });

  it('mounts the live session-shell tree with interaction handlers', () => {
    const fakeInstance = {
      rerender: vi.fn(),
    };
    const renderLiveTree = vi.fn(() => fakeInstance);
    const runner = new ReactCliRunner(renderLiveTree as never);
    const interactionHandlers = {
      onAction: vi.fn(),
      onInterrupt: vi.fn(),
      onEndOfInput: vi.fn(),
    };

    const instance = runner.mountLiveSessionShell(
      {
        sessionId: 'session-shell-live-ink',
        shellMode: CliSessionShellMode.SESSION_SHELL,
        inputMode: CliSessionShellInputMode.PLAIN_TEXT,
        transcriptItems: [],
        transcriptTitle: 'History',
        composerTitle: 'Input',
        composerValue: '',
        composerPlaceholder: 'Type a message or / command.',
        slashQuery: '',
        slashPaletteVisible: false,
        slashSuggestions: [],
        highlightedCommand: null,
        slashPaletteTitle: 'Slash palette',
        slashPaletteEmptyState: 'No slash commands matched.',
        commandPreview: null,
        handoffState: CliSessionShellHandoffState.IDLE,
        cwd: '/workspace/repo',
        workspaceSummary: 'workspace_id=repo mode=repo_local',
        outputContract: ErrorOutputEnvironment.PRETTY,
        persistenceOwner: CliSessionShellPersistenceOwner.LOCAL_ORCHESTRATION_SERVICE,
        resumeSelector: 'latest',
        foregroundInputOwner: CliSessionShellForegroundInputOwner.INK,
        foregroundFocusTarget: CliSessionShellForegroundFocusTarget.COMPOSER,
        inputActionContract: [...CLI_SESSION_SHELL_INPUT_ACTION_CONTRACT],
        title: 'Repo AI Governor',
        subtitle: 'Session-first preview baseline.',
        promptBarTitle: 'Prompt bar',
        promptBarLines: ['? shortcuts · /status · Ctrl+D'],
      },
      interactionHandlers,
      {
        stdout: process.stderr,
      },
    );

    expect(renderLiveTree).toHaveBeenCalledTimes(1);
    expect(instance).toBe(fakeInstance);
  });

  it('hides the slash palette section when the presenter marks it closed', () => {
    const runner = new ReactCliRunner();
    const output = runner.renderSessionShellFrame({
      sessionId: 'session-shell-hidden-palette',
      shellMode: CliSessionShellMode.SESSION_SHELL,
      inputMode: CliSessionShellInputMode.SLASH_COMMAND,
      transcriptItems: [],
      transcriptTitle: 'History',
      composerTitle: 'Input',
      composerValue: '/wo',
      composerPlaceholder: 'Type a message or / command.',
      slashQuery: '',
      slashPaletteVisible: false,
      slashSuggestions: [],
      highlightedCommand: null,
      slashPaletteTitle: 'Slash palette',
      slashPaletteEmptyState: 'No slash commands matched.',
      commandPreview: null,
      handoffState: CliSessionShellHandoffState.IDLE,
      cwd: '/workspace/repo',
      workspaceSummary: 'workspace_id=repo mode=repo_local',
      outputContract: ErrorOutputEnvironment.PRETTY,
      persistenceOwner: CliSessionShellPersistenceOwner.LOCAL_ORCHESTRATION_SERVICE,
      resumeSelector: 'latest',
      foregroundInputOwner: CliSessionShellForegroundInputOwner.INK,
      foregroundFocusTarget: CliSessionShellForegroundFocusTarget.COMPOSER,
      inputActionContract: [...CLI_SESSION_SHELL_INPUT_ACTION_CONTRACT],
      title: 'Repo AI Governor',
      subtitle: 'Session-first preview baseline.',
      promptBarTitle: 'Prompt bar',
      promptBarLines: ['Shortcuts: /help, /exit, Ctrl+C, Ctrl+D.'],
    });

    expect(output).not.toContain('Slash palette');
    expect(output).toContain('/wo');
  });

  it('renders enough slash-palette rows to keep the full /workspace nested action set on one page', () => {
    const runner = new ReactCliRunner();
    const output = runner.renderSessionShellFrame({
      sessionId: 'session-shell-workspace-palette',
      shellMode: CliSessionShellMode.COMMAND_PALETTE,
      inputMode: CliSessionShellInputMode.SLASH_COMMAND,
      transcriptItems: [],
      transcriptTitle: 'History',
      composerTitle: 'Input',
      composerValue: '/workspace',
      composerPlaceholder: 'Type a message or / command.',
      slashQuery: '/workspace',
      slashPaletteVisible: true,
      slashSuggestions: [
        {
          command: '/workspace',
          summary: 'Plan or execute workspace migration baseline.',
          highlightSegments: [{ text: '/workspace', highlighted: false }],
        },
        {
          command: '/workspace dry-run',
          summary: 'Preview the workspace migration plan.',
          highlightSegments: [{ text: '/workspace dry-run', highlighted: false }],
        },
        {
          command: '/workspace execute',
          summary: 'Apply the workspace migration plan.',
          highlightSegments: [{ text: '/workspace execute', highlighted: false }],
        },
        {
          command: '/workspace rollback',
          summary: 'Restore the previous workspace surface.',
          highlightSegments: [{ text: '/workspace rollback', highlighted: false }],
        },
        {
          command: '/workspace clear-config',
          summary: 'Remove the current governor workspace config.',
          highlightSegments: [{ text: '/workspace clear-config', highlighted: false }],
        },
        {
          command: '/workspace switch-branch',
          summary: 'Switch the current repository branch.',
          highlightSegments: [{ text: '/workspace switch-branch', highlighted: false }],
        },
        {
          command: '/workspace set-ui-theme',
          summary: 'Open the selector or persist one theme.',
          highlightSegments: [{ text: '/workspace set-ui-theme', highlighted: false }],
        },
        {
          command: '/workflow',
          summary: 'Preview or enter the governed workflow definition surface.',
          highlightSegments: [{ text: '/workflow', highlighted: false }],
        },
      ],
      highlightedCommand: '/workspace',
      slashPaletteTitle: 'Slash palette',
      slashPaletteEmptyState: 'No slash commands matched.',
      commandPreview: null,
      handoffState: CliSessionShellHandoffState.IDLE,
      cwd: '/workspace/repo',
      workspaceSummary: 'workspace_id=repo mode=repo_local',
      outputContract: ErrorOutputEnvironment.PRETTY,
      persistenceOwner: CliSessionShellPersistenceOwner.LOCAL_ORCHESTRATION_SERVICE,
      resumeSelector: 'latest',
      foregroundInputOwner: CliSessionShellForegroundInputOwner.INK,
      foregroundFocusTarget: CliSessionShellForegroundFocusTarget.PALETTE,
      inputActionContract: [...CLI_SESSION_SHELL_INPUT_ACTION_CONTRACT],
      title: 'Repo AI Governor',
      subtitle: 'Session-first preview baseline.',
      promptBarTitle: 'Prompt bar',
      promptBarLines: ['↑↓ · Tab/Enter · Esc'],
    });

    expect(output).toContain('/workspace dry-run');
    expect(output).toContain('/workspace execute');
    expect(output).toContain('/workspace rollback');
    expect(output).toContain('/workspace clear-config');
    expect(output).toContain('/workspace switch-branch');
    expect(output).toContain('/workspace set-ui-theme');
    expect(output).toContain('/workflow');
  });
});

describe('ReactCliStderrFramePresenter', () => {
  it('writes one rendered shared shell frame to stderr', () => {
    const buffer: string[] = [];
    const presenter = new ReactCliStderrFramePresenter((value) => {
      buffer.push(value);
    });

    presenter.write({
      title: '[react-shell:connect] Connect adapters and capture diagnostics',
      subtitle: 'ui=react stdout=pretty descriptor=cli.connect.summary.m2',
      sections: [
        {
          title: 'Summary',
          lines: ['Connect completed.'],
        },
      ],
      footerShortcutsTitle: 'Shortcuts',
      footerShortcuts: ['stdout summary follows'],
    });

    expect(buffer.join('')).toContain(
      '[react-shell:connect] Connect adapters and capture diagnostics',
    );
    expect(buffer.join('')).toContain('stdout summary follows');
  });

  it('uses the resolved terminal width when rendering stderr frames', () => {
    const renderFrame = vi.fn(() => 'rendered frame');
    const presenter = new ReactCliStderrFramePresenter(
      () => undefined,
      {
        renderFrame,
      } as unknown as ReactCliRunner,
      () => 132,
    );

    presenter.write({
      title: '[react-shell:connect] Connect adapters and capture diagnostics',
      sections: [
        {
          title: 'Summary',
          lines: ['Connect completed.'],
        },
      ],
      footerShortcutsTitle: 'Shortcuts',
      footerShortcuts: ['stdout summary follows'],
    });

    expect(renderFrame).toHaveBeenCalledWith(
      expect.objectContaining({
        title: '[react-shell:connect] Connect adapters and capture diagnostics',
      }),
      {
        columns: 132,
      },
    );
  });
});

describe('CliInteractiveShellStderrRenderer', () => {
  it('routes session frames through the shared React CLI runner', () => {
    const buffer: string[] = [];
    const interpolate = (template: string, interpolation?: Record<string, string>) =>
      template.replace(/\{\{(\w+)\}\}/g, (_match, key: string) => interpolation?.[key] ?? '');
    const renderer = new CliInteractiveShellStderrRenderer(
      (value) => {
        buffer.push(value);
      },
      undefined,
      {
        translate: (key, interpolation) => {
          const translations: Record<string, string> = {
            'cli.reactShell.shared.unmountedState':
              'unmounted state={{state}} fallback={{fallback}}',
            'cli.reactShell.shared.lifecycle': 'Lifecycle',
            'cli.reactShell.shared.session': 'Session',
            'cli.reactShell.shared.details': 'Details',
            'cli.reactShell.shared.validationFeedbackRequiresAnotherInputPass':
              'Validation feedback requires another input pass.',
            'cli.reactShell.shared.attention': 'Attention',
            'cli.reactShell.shared.help': 'Help',
            'cli.reactShell.shared.shortcuts': 'Shortcuts',
            'cli.reactShell.shared.rendersOnStderrOnly': 'React shell renders on stderr only.',
            'cli.reactShell.shared.enterConfirm': 'Enter confirm',
            'cli.reactShell.shared.restart': 'N restart',
            'cli.reactShell.shared.submit': 'Enter submit',
            'cli.reactShell.shared.cancel': 'Ctrl+C cancel',
          };
          return interpolate(translations[key] ?? key, interpolation);
        },
      },
    );

    const session: CliInteractiveShellSessionState = {
      uiMode: CliInteractiveUiMode.REACT,
      commandName: CliCommandName.INIT,
      descriptorId: 'cli.init.bootstrap.m1',
      runState: CliInteractiveShellRunState.EDITING,
      currentStepTitle: 'Step 1 of 3: Workspace mode',
      totalSteps: 3,
      formValues: {},
      validationErrors: {},
      stderrRendering: CliInteractiveShellStderrRenderingMode.STDERR_ONLY,
      stdoutContract: ErrorOutputEnvironment.PRETTY,
      locale: Locale.EN_US,
      fallbackBehavior: null,
    };

    renderer.renderFrame({
      session,
      title: 'Bootstrap workspace defaults',
      lines: ['Choose where Repo AI Governor should keep its managed workspace metadata.'],
    });
    renderer.renderUnmount({
      ...session,
      runState: CliInteractiveShellRunState.SUCCESS,
    });

    const output = buffer.join('');
    expect(output).toContain('[react-shell:init] Bootstrap workspace defaults');
    expect(output).toContain(
      'Choose where Repo AI Governor should keep its managed workspace metadata.',
    );
    expect(output).toContain('unmounted state=success fallback=none');
  });
});

describe('CliSessionShellStderrRenderer', () => {
  it('clears the viewport before re-rendering interactive session-shell frames', () => {
    const buffer: string[] = [];
    const clearViewport = vi.fn(() => {
      buffer.push('[clear]');
    });
    const renderSessionShellFrame = vi.fn(() => 'rendered session frame');
    const renderer = new CliSessionShellStderrRenderer(
      (value) => {
        buffer.push(value);
      },
      {
        renderSessionShellFrame,
      } as unknown as ReactCliRunner,
      () => 120,
      () => true,
      clearViewport,
    );

    renderer.render({
      sessionId: 'session-shell-preview-456',
      shellMode: CliSessionShellMode.SESSION_SHELL,
      inputMode: CliSessionShellInputMode.PLAIN_TEXT,
      transcriptItems: [],
      transcriptTitle: 'History',
      composerTitle: 'Input',
      composerValue: '',
      composerPlaceholder: 'Type a message or / command.',
      slashQuery: '',
      slashPaletteVisible: false,
      slashSuggestions: [],
      highlightedCommand: null,
      slashPaletteTitle: 'Slash palette',
      slashPaletteEmptyState: 'No slash commands matched.',
      commandPreview: null,
      handoffState: CliSessionShellHandoffState.IDLE,
      cwd: '/workspace/repo',
      workspaceSummary: 'workspace_id=repo mode=repo_local',
      outputContract: ErrorOutputEnvironment.PRETTY,
      persistenceOwner: CliSessionShellPersistenceOwner.LOCAL_ORCHESTRATION_SERVICE,
      resumeSelector: 'latest',
      foregroundInputOwner: CliSessionShellForegroundInputOwner.READLINE_FALLBACK,
      foregroundFocusTarget: CliSessionShellForegroundFocusTarget.COMPOSER,
      inputActionContract: [...CLI_SESSION_SHELL_INPUT_ACTION_CONTRACT],
      title: 'Repo AI Governor',
      subtitle: 'Session-first preview baseline.',
      promptBarTitle: 'Prompt bar',
      promptBarLines: ['Shortcuts: /help, /exit, Ctrl+C, Ctrl+D.'],
    });

    expect(clearViewport).toHaveBeenCalledTimes(1);
    expect(renderSessionShellFrame).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionId: 'session-shell-preview-456',
      }),
      {
        columns: 120,
      },
    );
    expect(buffer).toContain('[clear]');
    expect(buffer.at(-1)).toBe('rendered session frame\n');
  });
});
