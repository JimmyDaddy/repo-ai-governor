import { stderr } from 'node:process';
import { type Key, useInput } from 'ink';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  CliSessionShellInputActionType,
  CliSessionShellInputMode,
} from '../../constants/cli-session-shell.constant.js';
import {
  applyAcceptedRoleMention,
  isRoleMentionSuggestion,
  resolveTrailingRoleMentionQuery,
} from '../../runtime/interactive-shell/session-role-mention-registry.js';
import { CliSessionSlashCommandRegistry } from '../../runtime/interactive-shell/session-slash-command-registry.js';
import type { CliSessionShellInputAction, CliSessionShellViewModel } from '../../types/index.js';
import { ReactCliSessionShellApp } from './session-shell-app.js';
import { MAX_VISIBLE_SLASH_SUGGESTIONS } from './slash-command-palette.js';

export interface ReactCliSessionShellInteractionHandlers {
  onAction: (action: CliSessionShellInputAction) => void;
  onInterrupt: () => void;
  onEndOfInput: () => void;
}

interface ReactCliSessionShellKeypressContext {
  input: string;
  key: Key;
  composerValue: string;
  composerCursorIndex?: number;
  inputMode?: CliSessionShellInputMode;
  highlightedCommand: string | null;
  slashPaletteVisible: boolean;
}

interface ReactCliSessionShellKeypressResolution {
  kind: 'action' | 'interrupt' | 'eof' | 'ignore';
  action?: CliSessionShellInputAction;
  nextComposerValue?: string;
  nextComposerCursorIndex?: number;
}

export type ReactCliSessionShellViewportCommand =
  | 'page_up'
  | 'page_down'
  | 'jump_oldest'
  | 'jump_latest';

export interface ReactCliSessionShellLiveActivityViewportOptions {
  maxVisibleDetailLines: number;
  detailOffsetFromBottom: number;
}

const LIVE_SESSION_SHELL_SLASH_COMMAND_REGISTRY = new CliSessionSlashCommandRegistry();

/**
 * Resolves one transcript-viewport command from a raw Ink keypress.
 * @param key Raw Ink keypress metadata.
 * @returns Viewport command when the key should scroll the running transcript window.
 */
export function mapSessionShellKeypressToViewportCommand(
  key: Key,
): ReactCliSessionShellViewportCommand | null {
  if (key.pageUp) {
    return 'page_up';
  }

  if (key.pageDown) {
    return 'page_down';
  }

  if (key.home) {
    return 'jump_oldest';
  }

  if (key.end) {
    return 'jump_latest';
  }

  return null;
}

/**
 * Estimates how many live-activity detail lines should stay visible in the dynamic viewport.
 * @param options Terminal and shell chrome inputs that reduce available transcript rows.
 * @returns Bounded visible detail-line budget.
 */
export function resolveLiveActivityViewportCapacity(options: {
  terminalRows?: number;
  promptBarLineCount: number;
  slashPaletteVisible: boolean;
  slashSuggestionCount: number;
  commandPreviewPresent: boolean;
  commandProgressPanelPresent: boolean;
}): number {
  const terminalRows = options.terminalRows ?? 24;
  const slashPaletteRows = options.slashPaletteVisible
    ? Math.min(options.slashSuggestionCount, MAX_VISIBLE_SLASH_SUGGESTIONS) + 3
    : 0;
  const commandPreviewRows = options.commandPreviewPresent ? 1 : 0;
  const commandProgressRows = options.commandProgressPanelPresent ? 8 : 0;
  const reservedRows =
    11 + options.promptBarLineCount + slashPaletteRows + commandPreviewRows + commandProgressRows;

  return Math.max(6, Math.min(24, terminalRows - reservedRows));
}

/**
 * Applies one bounded live-activity viewport onto the latest dynamic session-shell transcript.
 * @param viewModel Latest presenter-owned session-shell view model.
 * @param viewport Live-activity viewport settings.
 * @returns Cloned view model with the latest live-activity item sliced to the visible window.
 */
export function applyLiveActivityViewport(
  viewModel: CliSessionShellViewModel,
  viewport: ReactCliSessionShellLiveActivityViewportOptions,
): CliSessionShellViewModel {
  const liveActivityItemIndex = [...viewModel.transcriptItems]
    .map((item, index) => ({ item, index }))
    .reverse()
    .find(({ item }) => item.renderKind === 'live_activity')?.index;

  if (liveActivityItemIndex === undefined) {
    return viewModel;
  }

  const liveActivityItem = viewModel.transcriptItems[liveActivityItemIndex];
  if (!liveActivityItem || liveActivityItem.lines.length <= viewport.maxVisibleDetailLines) {
    return viewModel;
  }

  const totalDetailLines = liveActivityItem.lines.length;
  const clampedOffset = Math.max(
    0,
    Math.min(viewport.detailOffsetFromBottom, totalDetailLines - viewport.maxVisibleDetailLines),
  );
  const sliceEnd = totalDetailLines - clampedOffset;
  const sliceStart = Math.max(0, sliceEnd - viewport.maxVisibleDetailLines);
  const visibleLines = liveActivityItem.lines.slice(sliceStart, sliceEnd);
  const nextSummaryLine =
    `${liveActivityItem.summaryLine ?? ''} · ${String(sliceStart + 1)}-${String(sliceEnd)}/${String(totalDetailLines)}`.trim();
  const transcriptItems = [...viewModel.transcriptItems];
  transcriptItems[liveActivityItemIndex] = {
    ...liveActivityItem,
    lines: visibleLines,
    summaryLine: nextSummaryLine,
  };

  return {
    ...viewModel,
    transcriptItems,
  };
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
  const composerCharacters = Array.from(context.composerValue);
  const composerLength = composerCharacters.length;
  const composerCursorIndex = Math.max(
    0,
    Math.min(context.composerCursorIndex ?? composerLength, composerLength),
  );
  const shouldExposeCursorIndex = context.composerCursorIndex !== undefined;

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

  if (context.inputMode === CliSessionShellInputMode.SECURE_LOCAL) {
    return mapSecureLocalCaptureKeypressToAction(context);
  }

  if (context.key.leftArrow) {
    return {
      kind: 'ignore',
      nextComposerCursorIndex: Math.max(composerCursorIndex - 1, 0),
    };
  }

  if (context.key.rightArrow) {
    return {
      kind: 'ignore',
      nextComposerCursorIndex: Math.min(composerCursorIndex + 1, composerLength),
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
          nextComposerValue: resolveAcceptedPaletteComposerValue(context),
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
        nextComposerValue:
          context.highlightedCommand === null
            ? undefined
            : resolveAcceptedPaletteComposerValue(context),
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
    const nextComposerCharacters = [...composerCharacters];
    // Ink reports DEL (0x7f), which many terminals send for Backspace, as `key.delete`.
    // Prefer backward deletion here so the common terminal Backspace behavior stays correct.
    const removeIndex = composerCursorIndex - 1;
    if (removeIndex < 0 || removeIndex >= composerLength) {
      return {
        kind: 'ignore',
        ...(shouldExposeCursorIndex ? { nextComposerCursorIndex: composerCursorIndex } : {}),
      };
    }
    nextComposerCharacters.splice(removeIndex, 1);
    const nextComposerValue = nextComposerCharacters.join('');
    const nextComposerCursorIndex = Math.max(composerCursorIndex - 1, 0);
    return {
      kind: 'action',
      action: {
        type: CliSessionShellInputActionType.COMPOSER_CHANGED,
        value: nextComposerValue,
      },
      nextComposerValue,
      ...(shouldExposeCursorIndex ? { nextComposerCursorIndex } : {}),
    };
  }

  if (context.input.length > 0 && !context.key.ctrl && !context.key.meta) {
    const nextComposerCharacters = [...composerCharacters];
    const insertedCharacters = Array.from(context.input);
    nextComposerCharacters.splice(composerCursorIndex, 0, ...insertedCharacters);
    const nextComposerValue = nextComposerCharacters.join('');
    const nextComposerCursorIndex = composerCursorIndex + insertedCharacters.length;
    return {
      kind: 'action',
      action: {
        type: CliSessionShellInputActionType.COMPOSER_CHANGED,
        value: nextComposerValue,
      },
      nextComposerValue,
      ...(shouldExposeCursorIndex ? { nextComposerCursorIndex } : {}),
    };
  }

  return {
    kind: 'ignore',
  };
}

/**
 * Prevents raw secret suffix bytes from entering live composer-local state before controller rejection.
 * @param nextComposerValue Candidate composer value derived from the latest keypress.
 * @returns True when the live shell must not echo the candidate into local presenter refs/state.
 */
export function shouldSuppressLiveComposerPreviewEcho(nextComposerValue: string): boolean {
  return (
    LIVE_SESSION_SHELL_SLASH_COMMAND_REGISTRY.resolveSecureLocalSecretCapture(nextComposerValue)
      ?.rejectedSuffix === true
  );
}

function mapSecureLocalCaptureKeypressToAction(
  context: ReactCliSessionShellKeypressContext,
): ReactCliSessionShellKeypressResolution {
  const normalizedInput = context.input.toLowerCase();

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

  if (context.key.escape || context.input === '\u001b') {
    return {
      kind: 'action',
      action: {
        type: CliSessionShellInputActionType.SECURE_CAPTURE_CANCELLED,
      },
    };
  }

  if (context.key.return || context.input === '\r' || context.input === '\n') {
    return {
      kind: 'action',
      action: {
        type: CliSessionShellInputActionType.SECURE_CAPTURE_SUBMITTED,
      },
    };
  }

  if (context.key.backspace || context.key.delete) {
    return {
      kind: 'action',
      action: {
        type: CliSessionShellInputActionType.SECURE_CAPTURE_BACKSPACE,
      },
    };
  }

  if (context.input.length > 0 && !context.key.ctrl && !context.key.meta) {
    return {
      kind: 'action',
      action: {
        type: CliSessionShellInputActionType.SECURE_CAPTURE_APPEND,
        value: context.input,
      },
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
  return (
    trimmedComposerValue === '?' ||
    trimmedComposerValue.startsWith('/') ||
    resolveTrailingRoleMentionQuery(context.composerValue) !== null
  );
}

function shouldAcceptHighlightedCommandOnEnter(
  context: ReactCliSessionShellKeypressContext,
): boolean {
  if (!context.highlightedCommand || !context.slashPaletteVisible) {
    return false;
  }

  if (isRoleMentionSuggestion(context.highlightedCommand)) {
    const activeMentionQuery = resolveTrailingRoleMentionQuery(context.composerValue);
    if (!activeMentionQuery) {
      return false;
    }

    const normalizedMentionQuery = activeMentionQuery.toLowerCase();
    const normalizedHighlightedMention = context.highlightedCommand.toLowerCase();
    return (
      normalizedHighlightedMention !== normalizedMentionQuery &&
      normalizedHighlightedMention.startsWith(normalizedMentionQuery)
    );
  }

  const normalizedComposerValue = normalizeSlashComposerValue(context.composerValue);
  const normalizedHighlightedCommand = normalizeSlashComposerValue(context.highlightedCommand);
  if (normalizedComposerValue === '?') {
    return true;
  }

  if (!normalizedComposerValue.startsWith('/')) {
    return false;
  }

  return (
    normalizedHighlightedCommand !== normalizedComposerValue &&
    normalizedHighlightedCommand.startsWith(normalizedComposerValue)
  );
}

function normalizeSlashComposerValue(value: string): string {
  return value
    .trim()
    .split(/\s+/u)
    .filter((token) => token.length > 0)
    .join(' ');
}

function resolveAcceptedPaletteComposerValue(
  context: ReactCliSessionShellKeypressContext,
): string | undefined {
  if (!context.highlightedCommand) {
    return undefined;
  }

  return isRoleMentionSuggestion(context.highlightedCommand)
    ? applyAcceptedRoleMention(context.composerValue, context.highlightedCommand)
    : context.highlightedCommand;
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
  const [displayComposerCursorIndex, setDisplayComposerCursorIndex] = useState(
    Array.from(viewModel.composerValue).length,
  );
  const [liveActivityDetailOffsetFromBottom, setLiveActivityDetailOffsetFromBottom] = useState(0);
  const composerValueRef = useRef(viewModel.composerValue);
  const composerCursorIndexRef = useRef(Array.from(viewModel.composerValue).length);
  const authoritativeComposerValueRef = useRef(viewModel.composerValue);
  const lastLiveActivityItemIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (viewModel.composerValue === authoritativeComposerValueRef.current) {
      return;
    }
    authoritativeComposerValueRef.current = viewModel.composerValue;
    composerValueRef.current = viewModel.composerValue;
    composerCursorIndexRef.current = Array.from(viewModel.composerValue).length;
    setDisplayComposerValue(viewModel.composerValue);
    setDisplayComposerCursorIndex(composerCursorIndexRef.current);
  }, [viewModel.composerValue]);

  const liveActivityItem = useMemo(
    () =>
      [...viewModel.transcriptItems].reverse().find((item) => item.renderKind === 'live_activity'),
    [viewModel.transcriptItems],
  );
  const liveActivityViewportCapacity = useMemo(
    () =>
      resolveLiveActivityViewportCapacity({
        terminalRows: stderr.rows,
        promptBarLineCount: viewModel.promptBarLines.length,
        slashPaletteVisible: viewModel.slashPaletteVisible,
        slashSuggestionCount: viewModel.slashSuggestions.length,
        commandPreviewPresent: viewModel.commandPreview !== null,
        commandProgressPanelPresent: viewModel.commandProgressPanel !== undefined,
      }),
    [
      viewModel.commandPreview,
      viewModel.commandProgressPanel,
      viewModel.promptBarLines.length,
      viewModel.slashPaletteVisible,
      viewModel.slashSuggestions.length,
    ],
  );
  const liveActivityMaxOffset = Math.max(
    0,
    (liveActivityItem?.lines.length ?? 0) - liveActivityViewportCapacity,
  );
  const liveActivityViewportPageSize = Math.max(1, liveActivityViewportCapacity - 1);

  useEffect(() => {
    const nextLiveActivityItemId = liveActivityItem?.id ?? null;
    if (nextLiveActivityItemId !== lastLiveActivityItemIdRef.current) {
      lastLiveActivityItemIdRef.current = nextLiveActivityItemId;
      setLiveActivityDetailOffsetFromBottom(0);
      return;
    }

    setLiveActivityDetailOffsetFromBottom((currentOffset) =>
      Math.min(currentOffset, liveActivityMaxOffset),
    );
  }, [liveActivityItem?.id, liveActivityMaxOffset]);

  useInput((input, key) => {
    const viewportCommand = mapSessionShellKeypressToViewportCommand(key);
    if (viewportCommand && liveActivityItem) {
      if (viewportCommand === 'page_up') {
        setLiveActivityDetailOffsetFromBottom((currentOffset) =>
          Math.min(currentOffset + liveActivityViewportPageSize, liveActivityMaxOffset),
        );
        return;
      }

      if (viewportCommand === 'page_down') {
        setLiveActivityDetailOffsetFromBottom((currentOffset) =>
          Math.max(currentOffset - liveActivityViewportPageSize, 0),
        );
        return;
      }

      if (viewportCommand === 'jump_oldest') {
        setLiveActivityDetailOffsetFromBottom(liveActivityMaxOffset);
        return;
      }

      setLiveActivityDetailOffsetFromBottom(0);
      return;
    }

    const resolution = mapSessionShellKeypressToAction({
      input,
      key,
      composerValue: composerValueRef.current,
      composerCursorIndex: composerCursorIndexRef.current,
      inputMode: viewModel.inputMode,
      highlightedCommand: viewModel.highlightedCommand,
      slashPaletteVisible: viewModel.slashPaletteVisible,
    });

    if (
      resolution.nextComposerValue !== undefined &&
      !(
        resolution.action?.type === CliSessionShellInputActionType.COMPOSER_CHANGED &&
        shouldSuppressLiveComposerPreviewEcho(resolution.nextComposerValue)
      )
    ) {
      composerValueRef.current = resolution.nextComposerValue;
      setDisplayComposerValue(resolution.nextComposerValue);
      const nextComposerCursorIndex =
        resolution.nextComposerCursorIndex ?? Array.from(resolution.nextComposerValue).length;
      composerCursorIndexRef.current = nextComposerCursorIndex;
      setDisplayComposerCursorIndex(nextComposerCursorIndex);
    } else if (
      resolution.kind === 'action' &&
      resolution.action?.type === CliSessionShellInputActionType.COMPOSER_SUBMITTED
    ) {
      composerValueRef.current = '';
      composerCursorIndexRef.current = 0;
      setDisplayComposerValue('');
      setDisplayComposerCursorIndex(0);
    } else if (resolution.nextComposerCursorIndex !== undefined) {
      composerCursorIndexRef.current = resolution.nextComposerCursorIndex;
      setDisplayComposerCursorIndex(resolution.nextComposerCursorIndex);
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
      viewModel={applyLiveActivityViewport(
        {
          ...viewModel,
          composerValue: displayComposerValue,
        },
        {
          maxVisibleDetailLines: liveActivityViewportCapacity,
          detailOffsetFromBottom: liveActivityDetailOffsetFromBottom,
        },
      )}
      composerCursorIndex={displayComposerCursorIndex}
    />
  );
}
