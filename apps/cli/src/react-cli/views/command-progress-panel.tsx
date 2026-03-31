import {
  EXECUTION_PROGRESS_STATUS_LABELS,
  ExecutionProgressStatus,
} from '@repo-ai-governor/shared';
import { Box, Text } from 'ink';
import type React from 'react';
import type { CliCommandProgressPanelViewModel, ReactCliShellPalette } from '../../types/index.js';

export interface ReactCliCommandProgressPanelProps {
  panel: CliCommandProgressPanelViewModel;
  shellPalette: ReactCliShellPalette;
}

/**
 * Renders one reusable command-progress panel from a transport-neutral running-state seam.
 */
export function ReactCliCommandProgressPanel({
  panel,
  shellPalette,
}: ReactCliCommandProgressPanelProps): React.JSX.Element {
  const summaryParts = [
    panel.currentStepTitle,
    panel.elapsedLabel,
    panel.stepsLabel,
    panel.heartbeatLabel,
  ].filter((value) => Boolean(value)) as string[];

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
      <Text color={shellPalette.subtitleColor}>{panel.statusLine}</Text>
      {summaryParts.length > 0 ? (
        <Text color={shellPalette.footerColor}>{summaryParts.join(' · ')}</Text>
      ) : null}
      {panel.cancelLabel ? (
        <Text color={shellPalette.helpColor} dimColor>
          {panel.cancelLabel}
        </Text>
      ) : null}
      {panel.rows.map((row) => (
        <Box key={row.id} flexDirection='column' marginTop={1}>
          <Text color={resolveRowColor(row.status, shellPalette)}>
            {`${EXECUTION_PROGRESS_STATUS_LABELS[row.status]} · ${row.title}`}
          </Text>
          {row.detail ? <Text color={shellPalette.subtitleColor}>{`  ${row.detail}`}</Text> : null}
        </Box>
      ))}
      {panel.artifacts.length > 0 ? (
        <Box flexDirection='column' marginTop={1}>
          <Text bold color={shellPalette.sectionTitleColor}>
            {panel.artifactsTitle ?? 'Artifacts'}
          </Text>
          {panel.artifacts.map((artifact) => (
            <Text key={artifact.id} color={shellPalette.subtitleColor}>
              {`${artifact.label}: ${artifact.path}`}
            </Text>
          ))}
        </Box>
      ) : null}
      {panel.logLines.length > 0 ? (
        <Box flexDirection='column' marginTop={1}>
          <Text bold color={shellPalette.sectionTitleColor}>
            {panel.logsTitle ?? 'Recent logs'}
          </Text>
          {panel.logLines.map((line) => (
            <Text key={`log:${line}`} color={shellPalette.footerColor}>
              {line}
            </Text>
          ))}
        </Box>
      ) : null}
    </Box>
  );
}

function resolveRowColor(
  status: ExecutionProgressStatus,
  shellPalette: ReactCliShellPalette,
): string {
  if (status === ExecutionProgressStatus.FAILED || status === ExecutionProgressStatus.WARNING) {
    return shellPalette.attentionColor;
  }

  if (status === ExecutionProgressStatus.RUNNING) {
    return shellPalette.titleColor;
  }

  return shellPalette.sectionTitleColor;
}
