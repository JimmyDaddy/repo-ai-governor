import { type Key, useInput } from 'ink';
import { useEffect, useRef } from 'react';
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
        type: CliSessionShellInputActionType.PALETTE_HIGHLIGHT_PREVIOUS,
      },
    };
  }

  if (context.key.downArrow) {
    return {
      kind: 'action',
      action: {
        type: CliSessionShellInputActionType.PALETTE_HIGHLIGHT_NEXT,
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
  const composerValueRef = useRef(viewModel.composerValue);

  useEffect(() => {
    composerValueRef.current = viewModel.composerValue;
  }, [viewModel.composerValue]);

  useInput((input, key) => {
    const resolution = mapSessionShellKeypressToAction({
      input,
      key,
      composerValue: composerValueRef.current,
      highlightedCommand: viewModel.highlightedCommand,
    });

    if (resolution.nextComposerValue !== undefined) {
      composerValueRef.current = resolution.nextComposerValue;
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

  return <ReactCliSessionShellApp viewModel={viewModel} />;
}
