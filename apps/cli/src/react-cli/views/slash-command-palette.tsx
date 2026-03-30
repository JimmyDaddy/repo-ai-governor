import { Box, Text } from 'ink';
import type React from 'react';
import type { ReactCliShellPalette } from '../../types/index.js';
import type { CliSessionSlashCommandSuggestion } from '../../types/index.js';

export interface ReactCliSlashCommandPaletteProps {
  title: string;
  query: string;
  highlightedCommand: string | null;
  suggestions: CliSessionSlashCommandSuggestion[];
  emptyState: string;
  shellPalette: ReactCliShellPalette;
}

/**
 * Renders filtered slash-command suggestions with prefix-highlight segments.
 */
export function ReactCliSlashCommandPalette({
  title,
  query,
  highlightedCommand,
  suggestions,
  emptyState,
  shellPalette,
}: ReactCliSlashCommandPaletteProps): React.JSX.Element {
  return (
    <Box flexDirection='column' marginTop={1}>
      <Text bold color={shellPalette.promptTitleColor}>
        {title}
      </Text>
      <Text color={shellPalette.subtitleColor}>{`query=${query || 'none'}`}</Text>
      {suggestions.length > 0 ? (
        suggestions.map((suggestion) => (
          <Box key={suggestion.command} flexDirection='column' marginTop={1}>
            <Text
              color={
                suggestion.command === highlightedCommand ? shellPalette.titleColor : undefined
              }
            >
              {suggestion.highlightSegments.map((segment, index) => (
                <Text
                  key={`${suggestion.command}:${index}`}
                  bold={segment.highlighted}
                  color={segment.highlighted ? shellPalette.attentionColor : undefined}
                >
                  {segment.text}
                </Text>
              ))}
            </Text>
            <Text color={shellPalette.helpColor}>{suggestion.summary}</Text>
          </Box>
        ))
      ) : (
        <Text color={shellPalette.helpColor}>{emptyState}</Text>
      )}
    </Box>
  );
}
