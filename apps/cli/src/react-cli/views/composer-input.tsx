import { Box, Text } from 'ink';
import { useEffect, useState } from 'react';
import type React from 'react';
import {
  CLI_SESSION_SHELL_PROMPT,
  CliSessionShellInputMode,
} from '../../constants/cli-session-shell.constant.js';
import type { ReactCliShellPalette } from '../../types/index.js';

const COMPOSER_CURSOR_BLINK_INTERVAL_MS = 530;

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
  const composerCharacters = Array.from(value);
  const clampedCursorIndex = Math.max(
    0,
    Math.min(cursorIndex ?? composerCharacters.length, composerCharacters.length),
  );
  const cursorCoversCharacter = clampedCursorIndex < composerCharacters.length;
  const valueBeforeCursor = composerCharacters.slice(0, clampedCursorIndex).join('');
  const cursorCharacter = cursorCoversCharacter
    ? (composerCharacters[clampedCursorIndex] ?? '')
    : ' ';
  const valueAfterCursor = cursorCoversCharacter
    ? composerCharacters.slice(clampedCursorIndex + 1).join('')
    : '';
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
          {valueBeforeCursor.length > 0 ? (
            <Text color={shellPalette.sectionTitleColor}>{valueBeforeCursor}</Text>
          ) : null}
          {isCursorVisible ? (
            <Text bold inverse color={shellPalette.sectionTitleColor}>
              {cursorCharacter}
            </Text>
          ) : cursorCoversCharacter ? (
            <Text color={shellPalette.sectionTitleColor}>{cursorCharacter}</Text>
          ) : null}
          {valueAfterCursor.length > 0 ? (
            <Text color={shellPalette.sectionTitleColor}>{valueAfterCursor}</Text>
          ) : null}
        </Box>
        {value.length === 0 ? <Text color={shellPalette.helpColor}>{placeholder}</Text> : null}
      </Box>
    </Box>
  );
}
