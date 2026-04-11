import { ThemeProvider, defaultTheme } from '@inkjs/ui';
import { Box, Text } from 'ink';
import type React from 'react';
import type { CliSessionShellViewModel } from '../../types/index.js';
import { resolveReactCliTheme } from '../theme/react-cli-theme-registry.js';
import { ReactCliCommandProgressPanel } from './command-progress-panel.js';
import { ReactCliComposerInput } from './composer-input.js';
import { ReactCliPromptBar } from './prompt-bar.js';
import { ReactCliSlashCommandPalette } from './slash-command-palette.js';
import { ReactCliTranscriptPane } from './transcript-pane.js';

export interface ReactCliSessionShellAppProps {
  viewModel: CliSessionShellViewModel;
}

/**
 * Renders the session-first CLI shell through the shared Ink theme surface.
 */
export function ReactCliSessionShellApp({
  viewModel,
}: ReactCliSessionShellAppProps): React.JSX.Element {
  const themeDefinition = resolveReactCliTheme(viewModel.themePreset);
  const shellPalette = themeDefinition.shellPalette;

  return (
    <ThemeProvider theme={themeDefinition.inkTheme ?? defaultTheme}>
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
        {viewModel.transcriptItems.length > 0 ? (
          <>
            <ReactCliTranscriptPane
              title={viewModel.transcriptTitle}
              items={viewModel.transcriptItems}
              shellPalette={shellPalette}
            />
            <Box marginTop={1}>
              <Text color={shellPalette.footerColor}>{'─'.repeat(23)}</Text>
            </Box>
          </>
        ) : null}
        {viewModel.commandProgressPanel ? (
          <ReactCliCommandProgressPanel
            panel={viewModel.commandProgressPanel}
            shellPalette={shellPalette}
          />
        ) : null}
        <ReactCliComposerInput
          title={viewModel.composerTitle}
          value={viewModel.composerValue}
          placeholder={viewModel.composerPlaceholder}
          inputMode={viewModel.inputMode}
          shellPalette={shellPalette}
        />
        {viewModel.slashPaletteVisible ? (
          <ReactCliSlashCommandPalette
            title={viewModel.slashPaletteTitle}
            query={viewModel.slashQuery}
            highlightedCommand={viewModel.highlightedCommand}
            suggestions={viewModel.slashSuggestions}
            emptyState={viewModel.commandPreview ?? viewModel.slashPaletteEmptyState}
            shellPalette={shellPalette}
          />
        ) : null}
        {viewModel.commandPreview && !viewModel.slashPaletteVisible ? (
          <Box marginTop={1}>
            <Text bold color={shellPalette.sectionTitleColor}>
              {viewModel.commandPreview}
            </Text>
          </Box>
        ) : null}
        <ReactCliPromptBar
          title={viewModel.promptBarTitle}
          lines={viewModel.promptBarLines}
          shellPalette={shellPalette}
        />
      </Box>
    </ThemeProvider>
  );
}
