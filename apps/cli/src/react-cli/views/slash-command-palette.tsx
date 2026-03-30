import { Box, Text } from 'ink';
import type React from 'react';
import type { ReactCliShellPalette } from '../../types/index.js';
import type { CliSessionSlashCommandSuggestion } from '../../types/index.js';

const MAX_VISIBLE_SLASH_SUGGESTIONS = 6;
const SLASH_SUMMARY_MAX_COLUMNS = 24;

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
  query: _query,
  highlightedCommand,
  suggestions,
  emptyState,
  shellPalette,
}: ReactCliSlashCommandPaletteProps): React.JSX.Element {
  const visibleSuggestions = resolveVisibleSuggestions(suggestions, highlightedCommand);

  return (
    <Box
      flexDirection='column'
      marginTop={1}
      marginLeft={2}
      borderStyle='round'
      borderColor={shellPalette.promptTitleColor}
      paddingX={1}
    >
      <Text bold color={shellPalette.promptTitleColor}>
        {title}
      </Text>
      {suggestions.length > 0 ? (
        visibleSuggestions.map((suggestion) => (
          <Box key={suggestion.command}>
            <Box>
              <Text
                bold={suggestion.command === highlightedCommand}
                color={
                  suggestion.command === highlightedCommand
                    ? shellPalette.promptTitleColor
                    : shellPalette.helpColor
                }
              >
                {suggestion.command === highlightedCommand ? '› ' : '  '}
              </Text>
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
              <Text color={shellPalette.helpColor}>
                {`  ${truncateSlashSummary(suggestion.summary)}`}
              </Text>
            </Box>
          </Box>
        ))
      ) : (
        <Text color={shellPalette.helpColor}>{emptyState}</Text>
      )}
    </Box>
  );
}

function resolveVisibleSuggestions(
  suggestions: CliSessionSlashCommandSuggestion[],
  highlightedCommand: string | null,
): CliSessionSlashCommandSuggestion[] {
  if (suggestions.length <= MAX_VISIBLE_SLASH_SUGGESTIONS) {
    return suggestions;
  }

  const highlightedIndex = suggestions.findIndex(
    (suggestion) => suggestion.command === highlightedCommand,
  );
  const normalizedIndex = highlightedIndex >= 0 ? highlightedIndex : 0;
  const maxStart = suggestions.length - MAX_VISIBLE_SLASH_SUGGESTIONS;
  const startIndex = Math.min(
    Math.max(normalizedIndex - Math.floor(MAX_VISIBLE_SLASH_SUGGESTIONS / 2), 0),
    maxStart,
  );

  return suggestions.slice(startIndex, startIndex + MAX_VISIBLE_SLASH_SUGGESTIONS);
}

function truncateSlashSummary(summary: string): string {
  if (measureDisplayWidth(summary) <= SLASH_SUMMARY_MAX_COLUMNS) {
    return summary;
  }

  let truncatedSummary = '';
  let currentWidth = 0;
  for (const character of Array.from(summary)) {
    const characterWidth = measureDisplayWidth(character);
    if (currentWidth + characterWidth > SLASH_SUMMARY_MAX_COLUMNS - 3) {
      break;
    }
    truncatedSummary += character;
    currentWidth += characterWidth;
  }

  return `${truncatedSummary}...`;
}

function measureDisplayWidth(value: string): number {
  return Array.from(value).reduce(
    (totalWidth, character) => totalWidth + ((character.codePointAt(0) ?? 0x00) > 0x7f ? 2 : 1),
    0,
  );
}
