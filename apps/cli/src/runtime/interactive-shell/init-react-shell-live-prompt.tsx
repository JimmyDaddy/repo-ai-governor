import { ConfirmInput, Select, StatusMessage } from '@inkjs/ui';
import { Box, Text } from 'ink';
import type React from 'react';
import { CliInteractiveShellRunState } from '../../constants/cli-interactive-shell.constant.js';
import { resolveReactCliTheme } from '../../react-cli/theme/react-cli-theme-registry.js';
import type {
  CliInteractiveShellConfirmPrompt,
  CliInteractiveShellSelectPrompt,
  CliInteractiveShellSessionState,
  CliInteractiveShellStatusFrame,
} from '../../types/index.js';

interface CliInteractiveShellFrameProps {
  session: CliInteractiveShellSessionState;
  title: string;
  bodyLines: string[];
  translate: (key: string, interpolation?: Record<string, string>) => string;
  footerShortcuts: string[];
  promptTitle?: string;
  promptBody?: React.JSX.Element;
}

/**
 * Renders the common bordered frame used by live `init` React-shell prompts.
 */
function CliInteractiveShellFrame({
  session,
  title,
  bodyLines,
  translate,
  footerShortcuts,
  promptTitle,
  promptBody,
}: CliInteractiveShellFrameProps): React.JSX.Element {
  const validationSummary = Object.values(session.validationErrors);
  const shellPalette = resolveReactCliTheme(session.uiTheme).shellPalette;

  return (
    <Box
      flexDirection='column'
      borderStyle='round'
      borderColor={shellPalette.borderColor}
      paddingX={1}
      paddingY={0}
    >
      <Text
        bold
        color={shellPalette.titleColor}
      >{`[react-shell:${session.commandName}] ${title}`}</Text>
      <Text
        color={shellPalette.subtitleColor}
      >{`state=${session.runState} ui=${session.uiMode} theme=${session.uiTheme ?? 'governor'} stdout=${session.stdoutContract} stderr=${session.stderrRendering}`}</Text>
      {session.runState === CliInteractiveShellRunState.VALIDATING ? (
        <StatusMessage variant='warning'>
          {translate('cli.reactShell.shared.validationFeedbackRequiresAnotherInputPass')}
        </StatusMessage>
      ) : null}
      {validationSummary.length > 0 ? (
        <Box flexDirection='column' marginTop={1}>
          <Text bold color={shellPalette.attentionColor}>
            {translate('cli.reactShell.shared.attention')}
          </Text>
          <Text
            color={shellPalette.attentionColor}
          >{`validation=${validationSummary.join('; ')}`}</Text>
        </Box>
      ) : null}
      <Box flexDirection='column' marginTop={1}>
        <Text bold color={shellPalette.sectionTitleColor}>
          {translate('cli.reactShell.shared.session')}
        </Text>
        <Text>{`step=${session.currentStepTitle} total_steps=${session.totalSteps}`}</Text>
      </Box>
      <Box flexDirection='column' marginTop={1}>
        <Text bold color={shellPalette.sectionTitleColor}>
          {translate('cli.reactShell.shared.details')}
        </Text>
        {bodyLines.map((line) => (
          <Text key={`details:${line}`}>{line}</Text>
        ))}
      </Box>
      {promptTitle && promptBody ? (
        <Box flexDirection='column' marginTop={1}>
          <Text bold color={shellPalette.promptTitleColor}>
            {promptTitle}
          </Text>
          {promptBody}
        </Box>
      ) : null}
      <Box flexDirection='column' marginTop={1}>
        <Text color={shellPalette.helpColor}>{translate('cli.reactShell.shared.help')}</Text>
        <Text color={shellPalette.helpColor}>
          {translate('cli.reactShell.shared.rendersOnStderrOnly')}
        </Text>
        <Text
          color={shellPalette.helpColor}
        >{`fallback=${session.fallbackBehavior ?? 'none'}`}</Text>
      </Box>
      <Box flexDirection='column' marginTop={1}>
        <Text color={shellPalette.footerColor}>{translate('cli.reactShell.shared.shortcuts')}</Text>
        <Text color={shellPalette.footerColor}>{footerShortcuts.join(' · ')}</Text>
      </Box>
    </Box>
  );
}

/**
 * Renders one status-only frame while the live `init` shell is submitting or finalizing.
 */
export function CliInitReactShellStatusView({
  session,
  title,
  lines,
  translate,
}: CliInteractiveShellStatusFrame): React.JSX.Element {
  return (
    <CliInteractiveShellFrame
      session={session}
      title={title}
      bodyLines={lines}
      translate={translate}
      footerShortcuts={[translate('cli.reactShell.shared.cancel')]}
    />
  );
}

/**
 * Renders one live select prompt for the `init` React shell.
 */
export function CliInitReactShellSelectPromptView({
  session,
  title,
  description,
  options,
  translate,
  onSubmit,
}: CliInteractiveShellSelectPrompt & {
  onSubmit: (value: string) => void;
}): React.JSX.Element {
  return (
    <CliInteractiveShellFrame
      session={session}
      title={title}
      bodyLines={[description]}
      translate={translate}
      promptTitle={translate('cli.reactShell.shared.selection')}
      footerShortcuts={[
        translate('cli.reactShell.shared.moveFocus'),
        translate('cli.reactShell.shared.enterConfirm'),
        translate('cli.reactShell.shared.cancel'),
      ]}
      promptBody={
        <Select options={options} visibleOptionCount={options.length} onChange={onSubmit} />
      }
    />
  );
}

/**
 * Renders one live confirmation prompt for the `init` React shell.
 */
export function CliInitReactShellConfirmPromptView({
  session,
  title,
  promptLabel,
  summaryLines,
  translate,
  onConfirm,
  onCancel,
}: CliInteractiveShellConfirmPrompt & {
  onConfirm: () => void;
  onCancel: () => void;
}): React.JSX.Element {
  return (
    <CliInteractiveShellFrame
      session={session}
      title={title}
      bodyLines={summaryLines}
      translate={translate}
      promptTitle={translate('cli.reactShell.shared.selection')}
      footerShortcuts={[
        translate('cli.reactShell.shared.confirm'),
        translate('cli.reactShell.shared.restart'),
        translate('cli.reactShell.shared.enterConfirm'),
        translate('cli.reactShell.shared.cancel'),
      ]}
      promptBody={
        <Box flexDirection='column'>
          <Text>{promptLabel}</Text>
          <ConfirmInput defaultChoice='confirm' onConfirm={onConfirm} onCancel={onCancel} />
        </Box>
      }
    />
  );
}
