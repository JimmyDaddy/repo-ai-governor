import { stderr } from 'node:process';
import { type Key, useInput } from 'ink';
import { useEffect, useMemo, useRef, useState } from 'react';
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

export type ReactCliSessionShellViewportCommand =
  | 'page_up'
  | 'page_down'
  | 'jump_oldest'
  | 'jump_latest';

export interface ReactCliSessionShellLiveActivityViewportOptions {
  maxVisibleDetailLines: number;
  detailOffsetFromBottom: number;
}

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
    ? Math.min(options.slashSuggestionCount, 6) + 3
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
  const [liveActivityDetailOffsetFromBottom, setLiveActivityDetailOffsetFromBottom] = useState(0);
  const composerValueRef = useRef(viewModel.composerValue);
  const authoritativeComposerValueRef = useRef(viewModel.composerValue);
  const lastLiveActivityItemIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (viewModel.composerValue === authoritativeComposerValueRef.current) {
      return;
    }
    authoritativeComposerValueRef.current = viewModel.composerValue;
    composerValueRef.current = viewModel.composerValue;
    setDisplayComposerValue(viewModel.composerValue);
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
    />
  );
}
