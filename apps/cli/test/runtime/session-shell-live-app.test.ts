import {
  CliSessionShellInputActionType,
  CliSessionShellInputMode,
} from '../../src/constants/cli-session-shell.constant.js';
import {
  applyLiveActivityViewport,
  mapSessionShellKeypressToAction,
  mapSessionShellKeypressToViewportCommand,
  resolveLiveActivityViewportCapacity,
  shouldSuppressLiveComposerPreviewEcho,
} from '../../src/react-cli/views/session-shell-live-app.js';

describe('mapSessionShellKeypressToAction', () => {
  it('maps slash typing, long paste, and CJK input into composer changes', () => {
    expect(
      mapSessionShellKeypressToAction({
        input: '/',
        key: {} as never,
        composerValue: '',
        highlightedCommand: null,
        slashPaletteVisible: false,
      }),
    ).toEqual({
      kind: 'action',
      action: {
        type: CliSessionShellInputActionType.COMPOSER_CHANGED,
        value: '/',
      },
      nextComposerValue: '/',
    });

    expect(
      mapSessionShellKeypressToAction({
        input: '?',
        key: {} as never,
        composerValue: '',
        highlightedCommand: null,
        slashPaletteVisible: false,
      }),
    ).toEqual({
      kind: 'action',
      action: {
        type: CliSessionShellInputActionType.COMPOSER_CHANGED,
        value: '?',
      },
      nextComposerValue: '?',
    });

    expect(
      mapSessionShellKeypressToAction({
        input: 'workspace dry-run',
        key: {} as never,
        composerValue: '/',
        highlightedCommand: null,
        slashPaletteVisible: false,
      }),
    ).toEqual({
      kind: 'action',
      action: {
        type: CliSessionShellInputActionType.COMPOSER_CHANGED,
        value: '/workspace dry-run',
      },
      nextComposerValue: '/workspace dry-run',
    });

    expect(
      mapSessionShellKeypressToAction({
        input: '原地刷新',
        key: {} as never,
        composerValue: '',
        highlightedCommand: null,
        slashPaletteVisible: false,
      }),
    ).toEqual({
      kind: 'action',
      action: {
        type: CliSessionShellInputActionType.COMPOSER_CHANGED,
        value: '原地刷新',
      },
      nextComposerValue: '原地刷新',
    });
  });

  it('removes one Unicode code point on backspace and maps session control shortcuts', () => {
    expect(
      mapSessionShellKeypressToAction({
        input: '',
        key: {
          backspace: true,
        } as never,
        composerValue: '原地刷新',
        highlightedCommand: null,
        slashPaletteVisible: false,
      }),
    ).toEqual({
      kind: 'action',
      action: {
        type: CliSessionShellInputActionType.COMPOSER_CHANGED,
        value: '原地刷',
      },
      nextComposerValue: '原地刷',
    });

    expect(
      mapSessionShellKeypressToAction({
        input: 'l',
        key: {
          ctrl: true,
        } as never,
        composerValue: '',
        highlightedCommand: null,
        slashPaletteVisible: false,
      }),
    ).toEqual({
      kind: 'action',
      action: {
        type: CliSessionShellInputActionType.SESSION_CLEAR_SCREEN,
      },
    });

    expect(
      mapSessionShellKeypressToAction({
        input: 'o',
        key: {
          ctrl: true,
        } as never,
        composerValue: '',
        highlightedCommand: null,
        slashPaletteVisible: false,
      }),
    ).toEqual({
      kind: 'action',
      action: {
        type: CliSessionShellInputActionType.SESSION_TOGGLE_LATEST_DETAILS,
      },
    });
  });

  it('maps palette navigation, tab completion, and session exit controls', () => {
    expect(
      mapSessionShellKeypressToAction({
        input: '',
        key: {
          downArrow: true,
        } as never,
        composerValue: '/',
        highlightedCommand: '/workspace',
        slashPaletteVisible: true,
      }),
    ).toEqual({
      kind: 'action',
      action: {
        type: CliSessionShellInputActionType.PALETTE_HIGHLIGHT_NEXT,
      },
    });

    expect(
      mapSessionShellKeypressToAction({
        input: '\t',
        key: {
          tab: false,
        } as never,
        composerValue: '/wo',
        highlightedCommand: '/workspace',
        slashPaletteVisible: true,
      }),
    ).toEqual({
      kind: 'action',
      action: {
        type: CliSessionShellInputActionType.PALETTE_ACCEPT_HIGHLIGHTED,
      },
      nextComposerValue: '/workspace',
    });

    expect(
      mapSessionShellKeypressToAction({
        input: '\r',
        key: {
          return: true,
        } as never,
        composerValue: '/wo',
        highlightedCommand: '/workspace',
        slashPaletteVisible: true,
      }),
    ).toEqual({
      kind: 'action',
      action: {
        type: CliSessionShellInputActionType.PALETTE_ACCEPT_HIGHLIGHTED,
      },
      nextComposerValue: '/workspace',
    });

    expect(
      mapSessionShellKeypressToAction({
        input: '\r',
        key: {
          return: true,
        } as never,
        composerValue: '/workspace dry-run',
        highlightedCommand: '/workspace',
        slashPaletteVisible: true,
      }),
    ).toEqual({
      kind: 'action',
      action: {
        type: CliSessionShellInputActionType.COMPOSER_SUBMITTED,
      },
    });

    expect(
      mapSessionShellKeypressToAction({
        input: '\r',
        key: {
          return: true,
        } as never,
        composerValue: '/workspace set-ui-theme',
        highlightedCommand: '/workspace set-ui-theme calm',
        slashPaletteVisible: true,
      }),
    ).toEqual({
      kind: 'action',
      action: {
        type: CliSessionShellInputActionType.PALETTE_ACCEPT_HIGHLIGHTED,
      },
      nextComposerValue: '/workspace set-ui-theme calm',
    });

    expect(
      mapSessionShellKeypressToAction({
        input: '\r',
        key: {
          return: true,
        } as never,
        composerValue: '/workspace set-ui-theme calm',
        highlightedCommand: '/workspace set-ui-theme calm',
        slashPaletteVisible: true,
      }),
    ).toEqual({
      kind: 'action',
      action: {
        type: CliSessionShellInputActionType.COMPOSER_SUBMITTED,
      },
    });

    expect(
      mapSessionShellKeypressToAction({
        input: '\u0003',
        key: {
          ctrl: true,
        } as never,
        composerValue: '',
        highlightedCommand: null,
        slashPaletteVisible: false,
      }),
    ).toEqual({
      kind: 'interrupt',
    });

    expect(
      mapSessionShellKeypressToAction({
        input: '\u0004',
        key: {
          ctrl: true,
        } as never,
        composerValue: '',
        highlightedCommand: null,
        slashPaletteVisible: false,
      }),
    ).toEqual({
      kind: 'eof',
    });
  });

  it('maps Up/Down to composer history when the slash palette is not active', () => {
    expect(
      mapSessionShellKeypressToAction({
        input: '',
        key: {
          upArrow: true,
        } as never,
        composerValue: 'hel',
        highlightedCommand: null,
        slashPaletteVisible: false,
      }),
    ).toEqual({
      kind: 'action',
      action: {
        type: CliSessionShellInputActionType.COMPOSER_HISTORY_PREVIOUS,
      },
    });

    expect(
      mapSessionShellKeypressToAction({
        input: '',
        key: {
          downArrow: true,
        } as never,
        composerValue: 'hel',
        highlightedCommand: null,
        slashPaletteVisible: false,
      }),
    ).toEqual({
      kind: 'action',
      action: {
        type: CliSessionShellInputActionType.COMPOSER_HISTORY_NEXT,
      },
    });
  });

  it('keeps arrow navigation inside the slash palette even when no suggestion is highlighted', () => {
    expect(
      mapSessionShellKeypressToAction({
        input: '',
        key: {
          upArrow: true,
        } as never,
        composerValue: '/workspce',
        highlightedCommand: null,
        slashPaletteVisible: true,
      }),
    ).toEqual({
      kind: 'action',
      action: {
        type: CliSessionShellInputActionType.PALETTE_HIGHLIGHT_PREVIOUS,
      },
    });

    expect(
      mapSessionShellKeypressToAction({
        input: '',
        key: {
          downArrow: true,
        } as never,
        composerValue: '/workspce',
        highlightedCommand: null,
        slashPaletteVisible: true,
      }),
    ).toEqual({
      kind: 'action',
      action: {
        type: CliSessionShellInputActionType.PALETTE_HIGHLIGHT_NEXT,
      },
    });
  });

  it('maps secure-local capture typing, submit, cancel, and backspace without mutating the composer preview', () => {
    expect(
      mapSessionShellKeypressToAction({
        input: 's',
        key: {} as never,
        composerValue: '',
        inputMode: CliSessionShellInputMode.SECURE_LOCAL,
        highlightedCommand: null,
        slashPaletteVisible: false,
      }),
    ).toEqual({
      kind: 'action',
      action: {
        type: CliSessionShellInputActionType.SECURE_CAPTURE_APPEND,
        value: 's',
      },
    });

    expect(
      mapSessionShellKeypressToAction({
        input: '',
        key: {
          backspace: true,
        } as never,
        composerValue: '',
        inputMode: CliSessionShellInputMode.SECURE_LOCAL,
        highlightedCommand: null,
        slashPaletteVisible: false,
      }),
    ).toEqual({
      kind: 'action',
      action: {
        type: CliSessionShellInputActionType.SECURE_CAPTURE_BACKSPACE,
      },
    });

    expect(
      mapSessionShellKeypressToAction({
        input: '\r',
        key: {
          return: true,
        } as never,
        composerValue: '',
        inputMode: CliSessionShellInputMode.SECURE_LOCAL,
        highlightedCommand: null,
        slashPaletteVisible: false,
      }),
    ).toEqual({
      kind: 'action',
      action: {
        type: CliSessionShellInputActionType.SECURE_CAPTURE_SUBMITTED,
      },
    });

    expect(
      mapSessionShellKeypressToAction({
        input: '\u001b',
        key: {
          escape: true,
        } as never,
        composerValue: '',
        inputMode: CliSessionShellInputMode.SECURE_LOCAL,
        highlightedCommand: null,
        slashPaletteVisible: false,
      }),
    ).toEqual({
      kind: 'action',
      action: {
        type: CliSessionShellInputActionType.SECURE_CAPTURE_CANCELLED,
      },
    });
  });
});

describe('shouldSuppressLiveComposerPreviewEcho', () => {
  it('suppresses secure secret suffix echo before the controller can reject it', () => {
    expect(shouldSuppressLiveComposerPreviewEcho('/secret set openai/api-key sk-live-secret')).toBe(
      true,
    );
    expect(shouldSuppressLiveComposerPreviewEcho('/secret set openai/api-key')).toBe(false);
    expect(shouldSuppressLiveComposerPreviewEcho('/workspace dry-run')).toBe(false);
  });
});

describe('mapSessionShellKeypressToViewportCommand', () => {
  it('maps paging keys into local transcript viewport commands', () => {
    expect(
      mapSessionShellKeypressToViewportCommand({
        pageUp: true,
      } as never),
    ).toBe('page_up');
    expect(
      mapSessionShellKeypressToViewportCommand({
        pageDown: true,
      } as never),
    ).toBe('page_down');
    expect(
      mapSessionShellKeypressToViewportCommand({
        home: true,
      } as never),
    ).toBe('jump_oldest');
    expect(
      mapSessionShellKeypressToViewportCommand({
        end: true,
      } as never),
    ).toBe('jump_latest');
    expect(mapSessionShellKeypressToViewportCommand({} as never)).toBeNull();
  });
});

describe('live activity viewport helpers', () => {
  it('derives one bounded line budget from terminal rows and shell chrome occupancy', () => {
    expect(
      resolveLiveActivityViewportCapacity({
        terminalRows: 36,
        promptBarLineCount: 2,
        slashPaletteVisible: false,
        slashSuggestionCount: 0,
        commandPreviewPresent: false,
        commandProgressPanelPresent: false,
      }),
    ).toBe(23);
    expect(
      resolveLiveActivityViewportCapacity({
        terminalRows: 12,
        promptBarLineCount: 4,
        slashPaletteVisible: true,
        slashSuggestionCount: 8,
        commandPreviewPresent: true,
        commandProgressPanelPresent: true,
      }),
    ).toBe(6);
  });

  it('keeps the full live activity history while rendering only the requested window slice', () => {
    const nextViewModel = applyLiveActivityViewport(
      {
        sessionId: 'session-shell-live-viewport',
        shellMode: 'session_shell',
        inputMode: 'plain_text',
        transcriptItems: [
          {
            id: 'activity:1',
            role: 'system',
            label: 'Live activity',
            lines: Array.from({ length: 10 }, (_, index) => `log line ${String(index + 1)}`),
            renderKind: 'live_activity',
            summaryLine: 'Running · 9s',
          },
        ],
        transcriptTitle: 'History',
        composerValue: '',
        composerTitle: 'Current input',
        composerPlaceholder: 'Type a message, / for commands, or ? for shortcuts.',
        slashQuery: '',
        slashPaletteVisible: false,
        slashSuggestions: [],
        highlightedCommand: null,
        slashPaletteTitle: 'Slash palette',
        slashPaletteEmptyState: 'No slash commands matched.',
        commandPreview: null,
        handoffState: 'idle',
        cwd: '/workspace/repo',
        workspaceSummary: 'workspace_id=repo mode=repo_local',
        outputContract: 'pretty',
        persistenceOwner: 'local_orchestration_service',
        resumeSelector: 'latest',
        foregroundInputOwner: 'ink',
        foregroundFocusTarget: 'composer',
        inputActionContract: [],
        title: 'Repo AI Governor session shell',
        subtitle: 'Session-first preview baseline.',
        promptBarTitle: 'Prompt bar',
        promptBarLines: [],
      } as never,
      {
        maxVisibleDetailLines: 4,
        detailOffsetFromBottom: 3,
      },
    );

    expect(nextViewModel.transcriptItems[0]?.lines).toEqual([
      'log line 4',
      'log line 5',
      'log line 6',
      'log line 7',
    ]);
    expect(nextViewModel.transcriptItems[0]?.summaryLine).toBe('Running · 9s · 4-7/10');
  });
});
