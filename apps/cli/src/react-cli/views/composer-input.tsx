import { Box, Text } from 'ink';
import { useEffect, useState } from 'react';
import type React from 'react';
import {
  CLI_SESSION_SHELL_PROMPT,
  CliSessionShellInputMode,
} from '../../constants/cli-session-shell.constant.js';
import { ReactCliComposerTokenKind } from '../../constants/react-cli-composer-token.constant.js';
import type { ReactCliShellPalette } from '../../types/index.js';
import { segmentComposerInput } from './composer-token-segmentation.js';

const COMPOSER_CURSOR_BLINK_INTERVAL_MS = 530;

interface ComposerGlyph {
  character: string;
  color: string;
}

interface ComposerGlyphGroup {
  color: string;
  text: string;
}

export interface ReactCliComposerInputProps {
  title: string;
  value: string;
  cursorIndex?: number;
  placeholder: string;
  inputMode: CliSessionShellInputMode;
  shellPalette: ReactCliShellPalette;
}

/**
 * Renders the presenter-owned composer state for the session-shell surface.
 */
export function ReactCliComposerInput({
  title,
  value,
  cursorIndex,
  placeholder,
  inputMode,
  shellPalette,
}: ReactCliComposerInputProps): React.JSX.Element {
  const [isCursorVisible, setIsCursorVisible] = useState(true);
  const promptLabel = CLI_SESSION_SHELL_PROMPT.trim();
  const isSlashMode = inputMode === CliSessionShellInputMode.SLASH_COMMAND;
  const isSecureMode = inputMode === CliSessionShellInputMode.SECURE_LOCAL;
  const shouldRenderComposerTitle = isSecureMode && title.trim().length > 0;
  const composerGlyphs = buildComposerGlyphs(value, shellPalette, isSlashMode);
  const clampedCursorIndex = Math.max(
    0,
    Math.min(cursorIndex ?? composerGlyphs.length, composerGlyphs.length),
  );
  const cursorCoversCharacter = clampedCursorIndex < composerGlyphs.length;
  const valueBeforeCursor = composerGlyphs.slice(0, clampedCursorIndex);
  const cursorGlyph = cursorCoversCharacter ? (composerGlyphs[clampedCursorIndex] ?? null) : null;
  const cursorCharacter = cursorGlyph?.character ?? ' ';
  const cursorColor = cursorGlyph?.color ?? shellPalette.composerTokenPalette.plain;
  const valueAfterCursor = cursorCoversCharacter
    ? composerGlyphs.slice(clampedCursorIndex + 1)
    : [];
  const composerTitleColor = isSlashMode
    ? shellPalette.promptTitleColor
    : isSecureMode
      ? shellPalette.sectionTitleColor
      : shellPalette.footerColor;

  useEffect(() => {
    const cursorResetSnapshot = `${clampedCursorIndex}:${value.length}`;
    setIsCursorVisible(cursorResetSnapshot.length > 0);
  }, [clampedCursorIndex, value.length]);

  useEffect(() => {
    const blinkTimer = setInterval(() => {
      setIsCursorVisible((currentVisibility) => !currentVisibility);
    }, COMPOSER_CURSOR_BLINK_INTERVAL_MS);

    return () => {
      clearInterval(blinkTimer);
    };
  }, []);

  return (
    <Box flexDirection='column' marginTop={shouldRenderComposerTitle ? 2 : 1}>
      {shouldRenderComposerTitle ? (
        <Text bold color={composerTitleColor}>
          {title}
        </Text>
      ) : null}
      <Box
        borderStyle='round'
        borderColor={composerTitleColor}
        paddingX={1}
        marginTop={shouldRenderComposerTitle ? 1 : 0}
        flexDirection='column'
      >
        <Box>
          <Text bold color={shellPalette.promptTitleColor}>
            {promptLabel}
          </Text>
          <Text> </Text>
          {renderComposerGlyphs(valueBeforeCursor, 'before')}
          {isCursorVisible ? (
            <Text bold inverse color={cursorColor}>
              {cursorCharacter}
            </Text>
          ) : cursorCoversCharacter ? (
            <Text color={cursorColor}>{cursorCharacter}</Text>
          ) : null}
          {renderComposerGlyphs(valueAfterCursor, 'after')}
        </Box>
        {value.length === 0 ? <Text color={shellPalette.helpColor}>{placeholder}</Text> : null}
      </Box>
    </Box>
  );
}

function buildComposerGlyphs(
  value: string,
  shellPalette: ReactCliShellPalette,
  highlightSlashCommands: boolean,
): ComposerGlyph[] {
  const glyphs: ComposerGlyph[] = [];
  for (const segment of segmentComposerInput(value, { highlightSlashCommands })) {
    const color = resolveComposerTokenColor(segment.kind, shellPalette);
    for (const character of Array.from(segment.text)) {
      glyphs.push({ character, color });
    }
  }
  return glyphs;
}

function renderComposerGlyphs(
  glyphs: ComposerGlyph[],
  keyPrefix: string,
): React.JSX.Element[] | null {
  if (glyphs.length === 0) {
    return null;
  }

  return collapseComposerGlyphs(glyphs).map((group, index) => (
    <Text key={`${keyPrefix}:${index}:${group.color}`} color={group.color}>
      {group.text}
    </Text>
  ));
}

function collapseComposerGlyphs(glyphs: ComposerGlyph[]): ComposerGlyphGroup[] {
  const groups: ComposerGlyphGroup[] = [];

  for (const glyph of glyphs) {
    const previousGroup = groups.at(-1);
    if (previousGroup?.color === glyph.color) {
      previousGroup.text += glyph.character;
      continue;
    }

    groups.push({
      color: glyph.color,
      text: glyph.character,
    });
  }

  return groups;
}

function resolveComposerTokenColor(
  tokenKind: ReactCliComposerTokenKind,
  shellPalette: ReactCliShellPalette,
): string {
  switch (tokenKind) {
    case ReactCliComposerTokenKind.SLASH_COMMAND:
      return shellPalette.composerTokenPalette.slash;
    case ReactCliComposerTokenKind.ROLE_MENTION:
      return shellPalette.composerTokenPalette.mention;
    default:
      return shellPalette.composerTokenPalette.plain;
  }
}
