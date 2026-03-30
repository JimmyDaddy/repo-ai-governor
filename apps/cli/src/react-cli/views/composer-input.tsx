import { Box, Text } from 'ink';
import type React from 'react';
import type { CliSessionShellInputMode } from '../../constants/cli-session-shell.constant.js';
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
  return (
    <Box flexDirection='column' marginTop={1}>
      <Text bold color={shellPalette.sectionTitleColor}>
        {title}
      </Text>
      <Text color={shellPalette.subtitleColor}>{`input_mode=${inputMode}`}</Text>
      {value.length > 0 ? <Text>{value}</Text> : <Text dimColor>{placeholder}</Text>}
    </Box>
  );
}
