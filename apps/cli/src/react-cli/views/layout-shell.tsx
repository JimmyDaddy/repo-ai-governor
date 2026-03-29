import { StatusMessage } from '@inkjs/ui';
import { Box, Text } from 'ink';
import type React from 'react';
import type { ReactCliViewModel } from '../state/react-cli-view-model.interface.js';

export interface ReactCliLayoutShellProps {
  viewModel: ReactCliViewModel;
}

/**
 * Renders the shared React CLI shell frame through Ink primitives and Ink UI status components.
 */
export function ReactCliLayoutShell({ viewModel }: ReactCliLayoutShellProps): React.JSX.Element {
  const attentionSection = viewModel.attentionSection;
  const helpSection = viewModel.helpSection;

  return (
    <Box flexDirection='column' borderStyle='round' paddingX={1} paddingY={0}>
      <Text>{viewModel.title}</Text>
      {viewModel.subtitle ? <Text color='gray'>{viewModel.subtitle}</Text> : null}
      {viewModel.statusMessage ? (
        <StatusMessage variant={viewModel.statusVariant ?? 'info'}>
          {viewModel.statusMessage}
        </StatusMessage>
      ) : null}
      {attentionSection ? (
        <Box flexDirection='column' marginTop={1}>
          <Text bold color='yellow'>
            {attentionSection.title}
          </Text>
          {attentionSection.lines.map((line, index) => (
            <Text key={`${attentionSection.title}:${index}`} color='yellow'>
              {line}
            </Text>
          ))}
        </Box>
      ) : null}
      {viewModel.sections.map((section, index) => (
        <Box key={`${section.title}:${index}`} flexDirection='column' marginTop={1}>
          <Text bold>{section.title}</Text>
          {section.lines.map((line, index) => (
            <Text key={`${section.title}:${index}`}>{line}</Text>
          ))}
        </Box>
      ))}
      {helpSection ? (
        <Box flexDirection='column' marginTop={1}>
          <Text dimColor>{helpSection.title}</Text>
          {helpSection.lines.map((line, index) => (
            <Text key={`${helpSection.title}:${index}`} dimColor>
              {line}
            </Text>
          ))}
        </Box>
      ) : null}
      {viewModel.footerShortcuts.length > 0 ? (
        <Box flexDirection='column' marginTop={1}>
          <Text dimColor>{viewModel.footerShortcutsTitle}</Text>
          <Text dimColor>{viewModel.footerShortcuts.join(' · ')}</Text>
        </Box>
      ) : null}
    </Box>
  );
}
