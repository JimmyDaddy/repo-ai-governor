import { CliSessionShellInputActionType } from '../../src/constants/cli-session-shell.constant.js';
import { mapSessionShellKeypressToAction } from '../../src/react-cli/views/session-shell-live-app.js';

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
});
