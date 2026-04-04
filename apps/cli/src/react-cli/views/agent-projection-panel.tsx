import { AgentProjectionPanelStatusVariant } from '@repo-ai-governor/reporting';
import { Box, Text } from 'ink';
import type React from 'react';
import type {
  CliAgentProjectionPanelRowViewModel,
  CliAgentProjectionPanelViewModel,
  ReactCliShellPalette,
} from '../../types/index.js';

export interface ReactCliAgentProjectionPanelProps {
  panel: CliAgentProjectionPanelViewModel;
  shellPalette: ReactCliShellPalette;
}

/**
 * Renders one reusable agent-projection panel from a transport-neutral view-model seam.
 */
export function ReactCliAgentProjectionPanel({
  panel,
  shellPalette,
}: ReactCliAgentProjectionPanelProps): React.JSX.Element {
  return (
    <Box
      flexDirection='column'
      marginTop={1}
      borderStyle='round'
      borderColor={shellPalette.borderColor}
      paddingX={1}
    >
      <Text bold color={shellPalette.sectionTitleColor}>
        {panel.title}
      </Text>
      <Text color={shellPalette.subtitleColor}>{panel.summaryLine}</Text>
      {panel.summaryBadges.length > 0 ? (
        <Text color={shellPalette.footerColor}>{panel.summaryBadges.join(' · ')}</Text>
      ) : null}
      {panel.rows.map((row) => (
        <Box key={row.id} flexDirection='column' marginTop={1}>
          <Text bold color={resolveRowColor(row, shellPalette)}>
            {row.title}
          </Text>
          {row.detailLines.map((line, index) => (
            <Text key={`${row.id}:${index}`} color={shellPalette.subtitleColor}>
              {`  ${line}`}
            </Text>
          ))}
        </Box>
      ))}
      {panel.footerNote ? (
        <Text color={shellPalette.helpColor} dimColor>
          {panel.footerNote}
        </Text>
      ) : null}
    </Box>
  );
}

function resolveRowColor(
  row: CliAgentProjectionPanelRowViewModel,
  shellPalette: ReactCliShellPalette,
): string {
  if (
    row.statusVariant === AgentProjectionPanelStatusVariant.WARNING ||
    row.statusVariant === AgentProjectionPanelStatusVariant.ERROR
  ) {
    return shellPalette.attentionColor;
  }

  return shellPalette.sectionTitleColor;
}
