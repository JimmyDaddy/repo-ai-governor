import { Box, Text } from 'ink';
import type React from 'react';
import type { ReactCliShellPalette } from '../../types/index.js';

export interface ReactCliPromptBarProps {
  title: string;
  lines: string[];
  shellPalette: ReactCliShellPalette;
}

/**
 * Renders the persistent session-shell prompt bar and runtime hints.
 */
export function ReactCliPromptBar({
  title,
  lines,
  shellPalette,
}: ReactCliPromptBarProps): React.JSX.Element {
  return (
    <Box flexDirection='column' marginTop={1}>
      <Text color={shellPalette.footerColor}>{title}</Text>
      {lines.map((line) => (
        <Text key={`${title}:${line}`} color={shellPalette.footerColor}>
          {line}
        </Text>
      ))}
    </Box>
  );
}
