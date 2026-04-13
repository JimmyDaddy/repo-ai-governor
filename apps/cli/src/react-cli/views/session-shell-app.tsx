import { ThemeProvider, defaultTheme } from '@inkjs/ui';
import { Box, Text } from 'ink';
import type React from 'react';
import { CliReactThemePreset } from '../../constants/cli-react-theme.constant.js';
import type { CliSessionShellViewModel } from '../../types/index.js';
import { resolveReactCliTheme } from '../theme/react-cli-theme-registry.js';
import { ReactCliCommandProgressPanel } from './command-progress-panel.js';
import { ReactCliComposerInput } from './composer-input.js';
import { ReactCliSlashCommandPalette } from './slash-command-palette.js';
import { ReactCliTranscriptPane } from './transcript-pane.js';

export interface ReactCliSessionShellAppProps {
  viewModel: CliSessionShellViewModel;
  composerCursorIndex?: number;
}

/**
 * Renders the session-first CLI shell through the shared Ink theme surface.
 */
export function ReactCliSessionShellApp({
  viewModel,
  composerCursorIndex,
}: ReactCliSessionShellAppProps): React.JSX.Element {
  const themeDefinition = resolveReactCliTheme(viewModel.themePreset);
  const shellPalette = themeDefinition.shellPalette;
  const isCopilotTheme = themeDefinition.preset === CliReactThemePreset.COPILOT;
  const shouldRenderWelcome =
    viewModel.transcriptItems.length === 0 && viewModel.composerValue.length === 0;
  const dashboardBadges = buildSessionShellDashboardBadges(viewModel, themeDefinition.preset);
  const dashboardHeroSummary = buildSessionShellDashboardHeroSummary(viewModel);
  const dashboardUtilityLines = buildSessionShellDashboardUtilityLines(viewModel);

  return (
    <ThemeProvider theme={themeDefinition.inkTheme ?? defaultTheme}>
      <Box
        flexDirection='column'
        borderStyle='round'
        borderColor={shellPalette.borderColor}
        paddingX={isCopilotTheme ? 0 : 1}
        paddingY={0}
      >
        <Box flexDirection='row'>
          <Box
            flexDirection='column'
            flexGrow={dashboardUtilityLines.length > 0 ? 3 : 1}
            flexShrink={1}
            borderStyle='round'
            borderColor={isCopilotTheme ? shellPalette.promptTitleColor : shellPalette.titleColor}
            paddingX={1}
          >
            <Text bold color={shellPalette.titleColor}>
              {viewModel.title}
            </Text>
            {dashboardBadges.length > 0 ? (
              <Text color={shellPalette.promptTitleColor}>{dashboardBadges.join(' ')}</Text>
            ) : null}
            <Text color={shellPalette.subtitleColor}>{viewModel.subtitle}</Text>
            <Box marginTop={1}>
              <Text color={shellPalette.borderColor} dimColor>
                {'─'.repeat(30)}
              </Text>
            </Box>
            <Text bold color={shellPalette.sectionTitleColor}>
              {dashboardHeroSummary}
            </Text>
            <Text color={shellPalette.sectionTitleColor}>{viewModel.cwd}</Text>
            <Text color={shellPalette.helpColor}>{viewModel.workspaceSummary}</Text>
          </Box>
          {dashboardUtilityLines.length > 0 ? (
            <>
              <Box width={1}>
                <Text> </Text>
              </Box>
              <Box
                flexDirection='column'
                flexGrow={isCopilotTheme ? 1 : 2}
                flexShrink={1}
                borderStyle='round'
                borderColor={shellPalette.promptTitleColor}
                paddingX={1}
              >
                {dashboardUtilityLines.map((line, index) => (
                  <Text
                    key={`${index}:${line.value}`}
                    bold={line.emphasis}
                    color={line.emphasis ? shellPalette.promptTitleColor : shellPalette.helpColor}
                  >
                    {line.value}
                  </Text>
                ))}
              </Box>
            </>
          ) : null}
        </Box>
        {viewModel.transcriptItems.length > 0 ? (
          <Box
            flexDirection='column'
            marginTop={1}
            borderStyle='round'
            borderColor={shellPalette.subtitleColor}
            paddingX={1}
          >
            <ReactCliTranscriptPane
              title={viewModel.transcriptTitle}
              items={viewModel.transcriptItems}
              shellPalette={shellPalette}
            />
          </Box>
        ) : shouldRenderWelcome ? (
          <ReactCliSessionShellWelcome
            viewModel={viewModel}
            heroSummary={dashboardHeroSummary}
            shellPalette={shellPalette}
            compact={isCopilotTheme}
          />
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
          cursorIndex={composerCursorIndex}
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
      </Box>
    </ThemeProvider>
  );
}

interface SessionShellDashboardUtilityLine {
  emphasis: boolean;
  value: string;
}

function buildSessionShellDashboardBadges(
  viewModel: CliSessionShellViewModel,
  resolvedThemePreset: string,
): string[] {
  return [resolvedThemePreset, viewModel.handoffState].map(
    (value) => `[${formatSessionShellDashboardToken(value)}]`,
  );
}

function buildSessionShellDashboardHeroSummary(viewModel: CliSessionShellViewModel): string {
  if (viewModel.commandPreview) {
    return truncateSessionShellDashboardValue(viewModel.commandPreview);
  }

  if (viewModel.slashPaletteVisible && viewModel.highlightedCommand) {
    return truncateSessionShellDashboardValue(viewModel.highlightedCommand);
  }

  const latestTranscriptItem = viewModel.transcriptItems.at(-1);
  if (latestTranscriptItem) {
    return truncateSessionShellDashboardValue(
      latestTranscriptItem.summaryLine ?? latestTranscriptItem.lines[0] ?? viewModel.subtitle,
    );
  }

  return viewModel.subtitle;
}

function buildSessionShellDashboardUtilityLines(
  viewModel: CliSessionShellViewModel,
): SessionShellDashboardUtilityLine[] {
  const lines = viewModel.promptBarLines.map<SessionShellDashboardUtilityLine>((value, index) => ({
    emphasis: index === 0,
    value: truncateSessionShellDashboardValue(value),
  }));
  const latestTranscriptItem = viewModel.transcriptItems.at(-1);
  const fallbackValue = viewModel.commandPreview
    ? truncateSessionShellDashboardValue(viewModel.commandPreview)
    : viewModel.slashPaletteVisible && viewModel.highlightedCommand
      ? truncateSessionShellDashboardValue(viewModel.highlightedCommand)
      : latestTranscriptItem?.summaryLine
        ? truncateSessionShellDashboardValue(latestTranscriptItem.summaryLine)
        : latestTranscriptItem?.lines[0]
          ? truncateSessionShellDashboardValue(latestTranscriptItem.lines[0])
          : null;

  if (fallbackValue && !lines.some((line) => line.value === fallbackValue)) {
    lines.push({
      emphasis: false,
      value: fallbackValue,
    });
  }

  return lines.slice(0, 3);
}

function formatSessionShellDashboardToken(value: string): string {
  return value.replace(/[_-]+/gu, ' ');
}

function truncateSessionShellDashboardValue(value: string, maximumLength = 54): string {
  return value.length <= maximumLength ? value : `${value.slice(0, maximumLength - 3)}...`;
}

function ReactCliSessionShellWelcome({
  viewModel,
  heroSummary,
  shellPalette,
  compact,
}: {
  viewModel: CliSessionShellViewModel;
  heroSummary: string;
  shellPalette: ReturnType<typeof resolveReactCliTheme>['shellPalette'];
  compact: boolean;
}): React.JSX.Element {
  const welcomeSuggestions = viewModel.slashSuggestions.slice(0, compact ? 4 : 5);
  const welcomePrimaryLine =
    viewModel.commandPreview ?? viewModel.promptBarLines[0] ?? viewModel.workspaceSummary;

  return (
    <Box
      flexDirection='column'
      marginTop={1}
      borderStyle='round'
      borderColor={shellPalette.subtitleColor}
      paddingX={1}
    >
      <Box flexDirection='row'>
        <Box
          flexDirection='column'
          flexGrow={compact ? 2 : 3}
          flexShrink={1}
          borderStyle='round'
          borderColor={shellPalette.borderColor}
          paddingX={1}
        >
          <Text bold color={shellPalette.sectionTitleColor}>
            {viewModel.subtitle}
          </Text>
          <Text color={shellPalette.promptTitleColor}>
            {truncateSessionShellDashboardValue(welcomePrimaryLine)}
          </Text>
          <Box marginTop={1}>
            <Text color={shellPalette.borderColor} dimColor>
              {'─'.repeat(24)}
            </Text>
          </Box>
          <Text color={shellPalette.sectionTitleColor}>{heroSummary}</Text>
          <Text color={shellPalette.sectionTitleColor}>{viewModel.cwd}</Text>
          <Text color={shellPalette.helpColor}>{viewModel.workspaceSummary}</Text>
        </Box>
        <Box width={1}>
          <Text> </Text>
        </Box>
        <Box
          flexDirection='column'
          flexGrow={compact ? 3 : 4}
          flexShrink={1}
          borderStyle='round'
          borderColor={shellPalette.promptTitleColor}
          paddingX={1}
        >
          <Text bold color={shellPalette.promptTitleColor}>
            {viewModel.slashPaletteTitle}
          </Text>
          {welcomeSuggestions.length > 0 ? (
            welcomeSuggestions.map((suggestion) => (
              <Box key={suggestion.command} flexDirection='column' marginTop={1}>
                <Text bold color={shellPalette.sectionTitleColor}>
                  {suggestion.command}
                </Text>
                <Text color={shellPalette.helpColor}>{suggestion.summary}</Text>
              </Box>
            ))
          ) : (
            <Text color={shellPalette.helpColor}>{viewModel.slashPaletteEmptyState}</Text>
          )}
        </Box>
      </Box>
    </Box>
  );
}
