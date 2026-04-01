import { type Key, useInput } from 'ink';
import { useEffect, useRef, useState } from 'react';
import { CliSessionShellInputActionType } from '../../constants/cli-session-shell.constant.js';
import type { CliSessionShellInputAction, CliSessionShellViewModel } from '../../types/index.js';
import { ReactCliSessionShellApp } from './session-shell-app.js';

export interface ReactCliSessionShellInteractionHandlers {
  onAction: (action: CliSessionShellInputAction) => void;
  onInterrupt: () => void;
  onEndOfInput: () => void;
}

interface ReactCliSessionShellKeypressContext {
  input: string;
  key: Key;
  composerValue: string;
  highlightedCommand: string | null;
  slashPaletteVisible: boolean;
}

interface ReactCliSessionShellKeypressResolution {
  kind: 'action' | 'interrupt' | 'eof' | 'ignore';
  action?: CliSessionShellInputAction;
  nextComposerValue?: string;
}

/**
 * Translates one Ink keypress into a stable session-shell input action.
 * @param context Raw Ink keypress details plus the current composer/highlight state.
 * @returns Action, interrupt, EOF, or ignore resolution.
 */
export function mapSessionShellKeypressToAction(
  context: ReactCliSessionShellKeypressContext,
): ReactCliSessionShellKeypressResolution {
  const normalizedInput = context.input.toLowerCase();

  if ((context.key.ctrl && normalizedInput === 'c') || context.input === '\u0003') {
    return {
      kind: 'interrupt',
    };
  }

  if ((context.key.ctrl && normalizedInput === 'd') || context.input === '\u0004') {
    return {
      kind: 'eof',
    };
  }

  if (context.key.upArrow) {
    return {
      kind: 'action',
      action: {
        type: shouldNavigatePalette(context)
          ? CliSessionShellInputActionType.PALETTE_HIGHLIGHT_PREVIOUS
          : CliSessionShellInputActionType.COMPOSER_HISTORY_PREVIOUS,
      },
    };
  }

  if (context.key.downArrow) {
    return {
      kind: 'action',
      action: {
        type: shouldNavigatePalette(context)
          ? CliSessionShellInputActionType.PALETTE_HIGHLIGHT_NEXT
          : CliSessionShellInputActionType.COMPOSER_HISTORY_NEXT,
      },
    };
  }

  if (context.key.tab || context.input === '\t') {
    return context.highlightedCommand
      ? {
          kind: 'action',
          action: {
            type: CliSessionShellInputActionType.PALETTE_ACCEPT_HIGHLIGHTED,
          },
          nextComposerValue: context.highlightedCommand,
        }
      : {
          kind: 'ignore',
        };
  }

  if (context.key.escape || context.input === '\u001b') {
    return {
      kind: 'action',
      action: {
        type: CliSessionShellInputActionType.PALETTE_CLOSED,
      },
    };
  }

  if (context.key.return || context.input === '\r' || context.input === '\n') {
    if (shouldAcceptHighlightedCommandOnEnter(context)) {
      return {
        kind: 'action',
        action: {
          type: CliSessionShellInputActionType.PALETTE_ACCEPT_HIGHLIGHTED,
        },
        nextComposerValue: context.highlightedCommand ?? undefined,
      };
    }

    return {
      kind: 'action',
      action: {
        type: CliSessionShellInputActionType.COMPOSER_SUBMITTED,
      },
    };
  }

  if ((context.key.ctrl && normalizedInput === 'l') || context.input === '\u000c') {
    return {
      kind: 'action',
      action: {
        type: CliSessionShellInputActionType.SESSION_CLEAR_SCREEN,
      },
    };
  }

  if ((context.key.ctrl && normalizedInput === 'o') || context.input === '\u000f') {
    return {
      kind: 'action',
      action: {
        type: CliSessionShellInputActionType.SESSION_TOGGLE_LATEST_DETAILS,
      },
    };
  }

  if (context.key.backspace || context.key.delete) {
    const nextComposerValue = Array.from(context.composerValue).slice(0, -1).join('');
    return {
      kind: 'action',
      action: {
        type: CliSessionShellInputActionType.COMPOSER_CHANGED,
        value: nextComposerValue,
      },
      nextComposerValue,
    };
  }

  if (context.input.length > 0 && !context.key.ctrl && !context.key.meta) {
    const nextComposerValue = `${context.composerValue}${context.input}`;
    return {
      kind: 'action',
      action: {
        type: CliSessionShellInputActionType.COMPOSER_CHANGED,
        value: nextComposerValue,
      },
      nextComposerValue,
    };
  }

  return {
    kind: 'ignore',
  };
}

function shouldNavigatePalette(context: ReactCliSessionShellKeypressContext): boolean {
  if (!context.slashPaletteVisible) {
    return false;
  }

  const trimmedComposerValue = context.composerValue.trim();
  return trimmedComposerValue === '?' || trimmedComposerValue.startsWith('/');
}

function shouldAcceptHighlightedCommandOnEnter(
  context: ReactCliSessionShellKeypressContext,
): boolean {
  if (!context.highlightedCommand) {
    return false;
  }

  const trimmedComposerValue = context.composerValue.trim();
  if (trimmedComposerValue === '?') {
    return true;
  }

  if (!trimmedComposerValue.startsWith('/')) {
    return false;
  }

  const commandToken = trimmedComposerValue.split(/\s+/u)[0] ?? '';
  const hasArgumentTokens = trimmedComposerValue.includes(' ');
  if (hasArgumentTokens) {
    return false;
  }

  return commandToken !== context.highlightedCommand;
}

/**
 * Mounts the session-shell surface as one live Ink tree and translates keypresses into actions.
 */
export function ReactCliLiveSessionShellApp({
  viewModel,
  interactionHandlers,
}: {
  viewModel: CliSessionShellViewModel;
  interactionHandlers: ReactCliSessionShellInteractionHandlers;
}): React.JSX.Element {
  const [displayComposerValue, setDisplayComposerValue] = useState(viewModel.composerValue);
  const composerValueRef = useRef(viewModel.composerValue);
  const authoritativeComposerValueRef = useRef(viewModel.composerValue);

  useEffect(() => {
    if (viewModel.composerValue === authoritativeComposerValueRef.current) {
      return;
    }
    authoritativeComposerValueRef.current = viewModel.composerValue;
    composerValueRef.current = viewModel.composerValue;
    setDisplayComposerValue(viewModel.composerValue);
  }, [viewModel.composerValue]);

  useInput((input, key) => {
    const resolution = mapSessionShellKeypressToAction({
      input,
      key,
      composerValue: composerValueRef.current,
      highlightedCommand: viewModel.highlightedCommand,
      slashPaletteVisible: viewModel.slashPaletteVisible,
    });

    if (resolution.nextComposerValue !== undefined) {
      composerValueRef.current = resolution.nextComposerValue;
      setDisplayComposerValue(resolution.nextComposerValue);
    } else if (
      resolution.kind === 'action' &&
      resolution.action?.type === CliSessionShellInputActionType.COMPOSER_SUBMITTED
    ) {
      composerValueRef.current = '';
      setDisplayComposerValue('');
    }

    if (resolution.kind === 'interrupt') {
      interactionHandlers.onInterrupt();
      return;
    }

    if (resolution.kind === 'eof') {
      interactionHandlers.onEndOfInput();
      return;
    }

    if (resolution.kind === 'action' && resolution.action) {
      interactionHandlers.onAction(resolution.action);
    }
  });

  return (
    <ReactCliSessionShellApp
      viewModel={{
        ...viewModel,
        composerValue: displayComposerValue,
      }}
    />
  );
}
