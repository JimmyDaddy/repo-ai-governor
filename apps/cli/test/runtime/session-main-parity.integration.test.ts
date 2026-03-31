import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

import { LocalOrchestrationServiceShell } from '@repo-ai-governor/core-orchestration-service';
import {
  OrchestrationSessionEventType,
  OrchestrationSessionRouteId,
  OrchestrationSessionTranscriptRole,
} from '@repo-ai-governor/orchestration-service-client';
import { ErrorOutputEnvironment } from '@repo-ai-governor/shared';
import { CliSessionShellExitReason } from '../../src/constants/cli-session-shell.constant.js';
import { CliSessionShellRunner } from '../../src/runtime/interactive-shell/session-shell-runner.js';
import { CliSessionShellServiceClient } from '../../src/runtime/interactive-shell/session-shell-service-client.js';
import { CliOrchestrationServiceRuntime } from '../../src/runtime/orchestration-service-runtime.js';
import type {
  CliSessionShellPromptAdapter,
  CliSessionShellRunOptions,
  CliSessionShellViewModel,
} from '../../src/types/index.js';

class RecordingSessionShellRenderer {
  public readonly frames: CliSessionShellViewModel[] = [];

  public render(viewModel: CliSessionShellViewModel): void {
    this.frames.push({
      ...viewModel,
      transcriptItems: viewModel.transcriptItems.map((item) => ({
        ...item,
        lines: [...item.lines],
        ...(item.backlinks
          ? { backlinks: item.backlinks.map((backlink) => ({ ...backlink })) }
          : {}),
      })),
      slashSuggestions: viewModel.slashSuggestions.map((suggestion) => ({
        ...suggestion,
        highlightSegments: suggestion.highlightSegments.map((segment) => ({ ...segment })),
      })),
      promptBarLines: [...viewModel.promptBarLines],
    });
  }
}

class StubSessionShellPromptAdapter implements CliSessionShellPromptAdapter {
  private cursor = 0;

  public constructor(private readonly answers: Array<string | null>) {}

  public async readLine(): Promise<string | null> {
    const answer = this.answers[this.cursor] ?? null;
    this.cursor += 1;
    return answer;
  }

  public close(): void {
    return;
  }
}

const SESSION_SHELL_TRANSLATIONS: Record<string, string> = {
  'cli.sessionShell.title': 'Repo AI Governor session shell',
  'cli.sessionShell.subtitle': 'Session shell parity integration test.',
  'cli.sessionShell.sections.transcript': 'History',
  'cli.sessionShell.sections.composer': 'Current input',
  'cli.sessionShell.sections.slashPalette': 'Slash palette',
  'cli.sessionShell.sections.promptBar': 'Prompt bar',
  'cli.sessionShell.composer.placeholder': 'Type a message, / for commands, or ? for shortcuts.',
  'cli.sessionShell.palette.emptyState': 'No slash commands matched.',
  'cli.sessionShell.resumeSelector.latest': 'latest',
  'cli.sessionShell.transcript.systemLabel': 'System',
  'cli.sessionShell.transcript.userLabel': 'You',
  'cli.sessionShell.transcript.assistantLabel': 'Governor',
  'cli.sessionShell.transcript.slashLabel': 'Slash command',
  'cli.sessionShell.promptBar.idleShortcuts': '? shortcuts · /status · Ctrl+D',
  'cli.sessionShell.promptBar.previewShortcuts': '/confirm · /cancel · Esc',
  'cli.sessionShell.promptBar.paletteShortcuts': '↑↓ · Tab/Enter · Esc',
  'cli.sessionShell.commands.exit.summary': 'Exit the foreground shell.',
  'cli.sessionShell.responses.mainTurnSuggestedSlash': 'Suggested next step: {{command}}',
  'cli.sessionShell.responses.mainTurnHandoffPreview': 'Preview: {{preview}}',
  'cli.sessionShell.responses.mainTurnExecutionIntent': 'Intent: {{executionIntent}}',
  'cli.sessionShell.responses.mainTurnRoutingSelection':
    'Routing: surface={{selectedSurface}} selected_by={{selectedBy}}',
  'cli.sessionShell.responses.sessionResumed':
    'Resumed session {{sessionId}} via selector={{resumeSelector}}.',
  'cli.sessionShell.responses.exitBySlash': 'Closed after /exit.',
  'cli.sessionShell.responses.exitBySigint': 'Closed after Ctrl+C.',
  'cli.sessionShell.responses.exitByEof': 'Closed after Ctrl+D.',
  'cli.sessionShell.responses.exitKeepsTranscript': 'Transcript deletion is not performed.',
};

describe('session.main parity integration', () => {
  it('keeps desktop-ready main-agent payload fields stable through the shared session runtime', async () => {
    const temporaryRoot = await mkdtemp(resolve(tmpdir(), 'session-main-parity-'));
    const workspaceRoot = resolve(temporaryRoot, '.repo-ai-governor');
    await mkdir(workspaceRoot, { recursive: true });
    const runtime = createRuntime(workspaceRoot);

    try {
      const started = await runtime.startSession({
        routeId: OrchestrationSessionRouteId.MAIN,
      });
      await runtime.sendSessionTurn({
        sessionId: started.session.sessionId,
        routeId: OrchestrationSessionRouteId.MAIN,
        userMessage: 'connect the tools for this workspace',
        metadata: {
          sessionRoutingPreference: 'claude-code',
        },
      });

      const subscription = await runtime.subscribeSession({
        sessionId: started.session.sessionId,
      });
      const completedEvent = subscription.events.find(
        (event) => event.type === OrchestrationSessionEventType.TURN_COMPLETED,
      );

      expect(completedEvent?.payload).toMatchObject({
        role: OrchestrationSessionTranscriptRole.ASSISTANT,
        routeId: OrchestrationSessionRouteId.MAIN,
        responseMode: 'command_handoff_preview',
        suggestedSlashCommand: '/connect',
        executionIntent: 'connect.adapters.bootstrap',
        selectedSurface: 'claude-code',
        selectedBy: 'session.main.preference',
        sessionRoutingPreferenceApplied: true,
        requiresConfirmation: true,
      });
      expect(completedEvent?.payload.handoffCommandPreview).toBe(
        'repo-ai-governor connect --preset multi-tool-default --output pretty --single-tool-all-roles claude-code',
      );
      expect(completedEvent?.payload.handoffBacklinks).toEqual([
        {
          kind: 'slash_command',
          label: 'slash:/connect',
          target: '/connect',
        },
        {
          kind: 'execution_intent',
          label: 'intent:connect.adapters.bootstrap',
          target: 'connect.adapters.bootstrap',
        },
        {
          kind: 'command_preview',
          label: 'preview',
          target:
            'repo-ai-governor connect --preset multi-tool-default --output pretty --single-tool-all-roles claude-code',
        },
      ]);
    } finally {
      await runtime.dispose();
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });

  it('replays the same real session.main recap when the CLI resumes the latest session shell', async () => {
    const temporaryRoot = await mkdtemp(resolve(tmpdir(), 'session-main-parity-runner-'));
    const workspaceRoot = resolve(temporaryRoot, '.repo-ai-governor');
    await mkdir(workspaceRoot, { recursive: true });
    const runtime = createRuntime(workspaceRoot);
    const sessionClient = new CliSessionShellServiceClient(runtime);

    try {
      const firstRenderer = new RecordingSessionShellRenderer();
      const firstRunner = createRunner(firstRenderer, [
        'connect the tools for this workspace',
        '/exit',
      ]);
      const firstResult = await firstRunner.run(createRunOptions(sessionClient));
      const firstSessionId = firstRenderer.frames[0]?.sessionId;
      const firstRecap = firstResult.transcriptItems.find(
        (item) => item.renderKind === 'command_recap',
      );

      expect(firstResult.exitReason).toBe(CliSessionShellExitReason.SLASH_EXIT);
      expect(firstSessionId).toBeDefined();
      expect(firstRecap).toEqual(
        expect.objectContaining({
          lines: [
            'Suggested next step: /connect',
            'Preview: repo-ai-governor connect --preset multi-tool-default --output pretty',
            'Intent: connect.adapters.bootstrap',
            'Routing: surface=codex selected_by=session.main.intent_router',
          ],
          backlinks: [
            {
              kind: 'slash_command',
              label: 'slash:/connect',
              target: '/connect',
            },
            {
              kind: 'execution_intent',
              label: 'intent:connect.adapters.bootstrap',
              target: 'connect.adapters.bootstrap',
            },
            {
              kind: 'command_preview',
              label: 'preview',
              target: 'repo-ai-governor connect --preset multi-tool-default --output pretty',
            },
          ],
        }),
      );

      const resumedRenderer = new RecordingSessionShellRenderer();
      const resumedRunner = createRunner(resumedRenderer, ['/exit']);
      const resumedResult = await resumedRunner.run(
        createRunOptions(sessionClient, {
          resumeOnStartup: true,
        }),
      );
      const resumedRecap = resumedResult.transcriptItems.find(
        (item) => item.renderKind === 'command_recap',
      );

      expect(resumedResult.exitReason).toBe(CliSessionShellExitReason.SLASH_EXIT);
      expect(resumedRenderer.frames[0]?.sessionId).toBe(firstSessionId);
      expect(
        resumedResult.transcriptItems.some(
          (item) =>
            item.renderKind === 'system_notice' &&
            item.lines.includes(`Resumed session ${firstSessionId ?? ''} via selector=latest.`),
        ),
      ).toBe(true);
      expect(resumedRecap).toEqual(firstRecap);
    } finally {
      await runtime.dispose();
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });
});

function createRuntime(workspaceRoot: string): CliOrchestrationServiceRuntime {
  return new CliOrchestrationServiceRuntime(workspaceRoot, {
    serviceOwnerProvider: async (root) =>
      new LocalOrchestrationServiceShell({
        workspaceRoot: root,
      }),
  });
}

function createRunner(
  renderer: RecordingSessionShellRenderer,
  answers: Array<string | null>,
): CliSessionShellRunner {
  return new CliSessionShellRunner(
    undefined,
    renderer as never,
    () => new StubSessionShellPromptAdapter(answers),
    undefined,
    undefined,
    () => false,
    () => new Date('2026-03-31T12:00:00Z'),
  );
}

function createRunOptions(
  sessionClient: CliSessionShellServiceClient,
  overrides: Partial<CliSessionShellRunOptions> = {},
): CliSessionShellRunOptions {
  return {
    sessionClient,
    currentWorkingDirectory: '/workspace/repo',
    workspaceSummary: 'workspace_id=repo mode=repo_local root=/workspace/repo/.repo-ai-governor',
    outputMode: ErrorOutputEnvironment.PRETTY,
    translate: translateSessionShell,
    ...overrides,
  };
}

function translateSessionShell(key: string, interpolation?: Record<string, string>): string {
  return (SESSION_SHELL_TRANSLATIONS[key] ?? key).replace(
    /\{\{(\w+)\}\}/gu,
    (_match, placeholder: string) => interpolation?.[placeholder] ?? '',
  );
}
