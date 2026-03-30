import { StatusMessage } from '@inkjs/ui';
import { Box, Text } from 'ink';
import type React from 'react';
import type { ReactCliShellPalette } from '../../types/index.js';
import type { ReactCliViewModel } from '../state/react-cli-view-model.interface.js';
import { ReactCliAgentProjectionPanel } from './agent-projection-panel.js';
import { ReactCliCommandProgressPanel } from './command-progress-panel.js';

export interface ReactCliLayoutShellProps {
  viewModel: ReactCliViewModel;
  shellPalette: ReactCliShellPalette;
}

/**
 * Renders the shared React CLI shell frame through Ink primitives and Ink UI status components.
 */
export function ReactCliLayoutShell({
  viewModel,
  shellPalette,
}: ReactCliLayoutShellProps): React.JSX.Element {
  const attentionSection = viewModel.attentionSection;
  const helpSection = viewModel.helpSection;

  return (
    <Box
      flexDirection='column'
      borderStyle='round'
      borderColor={shellPalette.borderColor}
      paddingX={1}
      paddingY={0}
    >
      <Text bold color={shellPalette.titleColor}>
        {viewModel.title}
      </Text>
      {viewModel.subtitle ? (
        <Text color={shellPalette.subtitleColor}>{viewModel.subtitle}</Text>
      ) : null}
      {viewModel.statusMessage ? (
        <StatusMessage variant={viewModel.statusVariant ?? 'info'}>
          {viewModel.statusMessage}
        </StatusMessage>
      ) : null}
      {attentionSection ? (
        <Box flexDirection='column' marginTop={1}>
          <Text bold color={shellPalette.attentionColor}>
            {attentionSection.title}
          </Text>
          {attentionSection.lines.map((line, index) => (
            <Text key={`${attentionSection.title}:${index}`} color={shellPalette.attentionColor}>
              {line}
            </Text>
          ))}
        </Box>
      ) : null}
      {viewModel.commandProgressPanel ? (
        <ReactCliCommandProgressPanel
          panel={viewModel.commandProgressPanel}
          shellPalette={shellPalette}
        />
      ) : null}
      {viewModel.sections.map((section, index) => (
        <Box key={`${section.title}:${index}`} flexDirection='column' marginTop={1}>
          <Text bold color={shellPalette.sectionTitleColor}>
            {section.title}
          </Text>
          {section.lines.map((line, index) => (
            <Text key={`${section.title}:${index}`}>{line}</Text>
          ))}
        </Box>
      ))}
      {viewModel.agentProjectionPanel ? (
        <ReactCliAgentProjectionPanel
          panel={viewModel.agentProjectionPanel}
          shellPalette={shellPalette}
        />
      ) : null}
      {helpSection ? (
        <Box flexDirection='column' marginTop={1}>
          <Text color={shellPalette.helpColor}>{helpSection.title}</Text>
          {helpSection.lines.map((line, index) => (
            <Text key={`${helpSection.title}:${index}`} color={shellPalette.helpColor}>
              {line}
            </Text>
          ))}
        </Box>
      ) : null}
      {viewModel.footerShortcuts.length > 0 ? (
        <Box flexDirection='column' marginTop={1}>
          <Text color={shellPalette.footerColor}>{viewModel.footerShortcutsTitle}</Text>
          <Text color={shellPalette.footerColor}>{viewModel.footerShortcuts.join(' · ')}</Text>
        </Box>
      ) : null}
    </Box>
  );
}
