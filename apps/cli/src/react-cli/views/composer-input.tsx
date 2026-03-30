import { Box, Text } from 'ink';
import type React from 'react';
import {
  CLI_SESSION_SHELL_PROMPT,
  CliSessionShellInputMode,
} from '../../constants/cli-session-shell.constant.js';
import type { ReactCliShellPalette } from '../../types/index.js';

export interface ReactCliComposerInputProps {
  title: string;
  value: string;
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
  placeholder,
  inputMode,
  shellPalette,
}: ReactCliComposerInputProps): React.JSX.Element {
  const promptLabel = CLI_SESSION_SHELL_PROMPT.trim();
  const isSlashMode = inputMode === CliSessionShellInputMode.SLASH_COMMAND;
  const composerTitleColor = isSlashMode ? shellPalette.promptTitleColor : shellPalette.footerColor;

  return (
    <Box flexDirection='column' marginTop={2}>
      <Text bold color={composerTitleColor}>
        {title}
      </Text>
      <Box
        borderStyle='round'
        borderColor={composerTitleColor}
        paddingX={1}
        marginTop={1}
        flexDirection='column'
      >
        <Box>
          <Text bold color={shellPalette.promptTitleColor}>
            {promptLabel}
          </Text>
          {value.length > 0 ? (
            <>
              <Text> </Text>
              <Text color={shellPalette.sectionTitleColor}>{value}</Text>
            </>
          ) : null}
        </Box>
        {value.length === 0 ? (
          <Text dimColor color={shellPalette.helpColor}>
            {placeholder}
          </Text>
        ) : null}
      </Box>
    </Box>
  );
}
