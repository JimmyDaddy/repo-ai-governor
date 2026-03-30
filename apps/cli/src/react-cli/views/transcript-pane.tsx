import { Box, Text } from 'ink';
import type React from 'react';
import { CliSessionTranscriptRole } from '../../constants/cli-session-shell.constant.js';
import type { ReactCliShellPalette } from '../../types/index.js';
import type { CliSessionShellTranscriptItem } from '../../types/index.js';

export interface ReactCliTranscriptPaneProps {
  title: string;
  items: CliSessionShellTranscriptItem[];
  shellPalette: ReactCliShellPalette;
}

/**
 * Renders the session-shell transcript pane from presenter-owned transcript items.
 */
export function ReactCliTranscriptPane({
  title,
  items,
  shellPalette,
}: ReactCliTranscriptPaneProps): React.JSX.Element {
  return (
    <Box flexDirection='column' marginTop={1}>
      <Text bold color={shellPalette.sectionTitleColor}>
        {title}
      </Text>
      {items.map((item) => (
        <Box key={item.id} flexDirection='column' marginTop={1}>
          <Text bold color={resolveTranscriptColor(item.role, shellPalette)}>
            {item.label}
          </Text>
          {item.lines.map((line, index) => (
            <Text key={`${item.id}:${index}`}>{line}</Text>
          ))}
        </Box>
      ))}
    </Box>
  );
}

function resolveTranscriptColor(
  role: CliSessionTranscriptRole,
  shellPalette: ReactCliShellPalette,
): string {
  switch (role) {
    case CliSessionTranscriptRole.SYSTEM:
      return shellPalette.attentionColor;
    case CliSessionTranscriptRole.USER:
      return shellPalette.footerColor;
    case CliSessionTranscriptRole.SLASH_COMMAND:
      return shellPalette.promptTitleColor;
    default:
      return shellPalette.titleColor;
  }
}
