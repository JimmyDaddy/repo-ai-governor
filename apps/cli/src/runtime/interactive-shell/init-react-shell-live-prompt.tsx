import { ConfirmInput, Select, StatusMessage } from '@inkjs/ui';
import { Box, Text } from 'ink';
import type React from 'react';
import { CliInteractiveShellRunState } from '../../constants/cli-interactive-shell.constant.js';
import type {
  CliInteractiveShellConfirmPrompt,
  CliInteractiveShellSelectPrompt,
  CliInteractiveShellSessionState,
} from '../../types/index.js';

interface CliInteractiveShellFrameProps {
  session: CliInteractiveShellSessionState;
  title: string;
  bodyLines: string[];
  translate: (key: string, interpolation?: Record<string, string>) => string;
  footerShortcuts: string[];
  promptTitle: string;
  promptBody: React.JSX.Element;
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

  return (
    <Box flexDirection='column' borderStyle='round' paddingX={1} paddingY={0}>
      <Text>{`[react-shell:${session.commandName}] ${title}`}</Text>
      <Text color='gray'>{`state=${session.runState} ui=${session.uiMode} stdout=${session.stdoutContract} stderr=${session.stderrRendering}`}</Text>
      {session.runState === CliInteractiveShellRunState.VALIDATING ? (
        <StatusMessage variant='warning'>
          {translate('cli.reactShell.shared.validationFeedbackRequiresAnotherInputPass')}
        </StatusMessage>
      ) : null}
      {validationSummary.length > 0 ? (
        <Box flexDirection='column' marginTop={1}>
          <Text bold color='yellow'>
            {translate('cli.reactShell.shared.attention')}
          </Text>
          <Text color='yellow'>{`validation=${validationSummary.join('; ')}`}</Text>
        </Box>
      ) : null}
      <Box flexDirection='column' marginTop={1}>
        <Text bold>{translate('cli.reactShell.shared.session')}</Text>
        <Text>{`step=${session.currentStepTitle} total_steps=${session.totalSteps}`}</Text>
      </Box>
      <Box flexDirection='column' marginTop={1}>
        <Text bold>{translate('cli.reactShell.shared.details')}</Text>
        {bodyLines.map((line) => (
          <Text key={`details:${line}`}>{line}</Text>
        ))}
      </Box>
      <Box flexDirection='column' marginTop={1}>
        <Text bold>{promptTitle}</Text>
        {promptBody}
      </Box>
      <Box flexDirection='column' marginTop={1}>
        <Text dimColor>{translate('cli.reactShell.shared.help')}</Text>
        <Text dimColor>{translate('cli.reactShell.shared.rendersOnStderrOnly')}</Text>
        <Text dimColor>{`fallback=${session.fallbackBehavior ?? 'none'}`}</Text>
      </Box>
      <Box flexDirection='column' marginTop={1}>
        <Text dimColor>{translate('cli.reactShell.shared.shortcuts')}</Text>
        <Text dimColor>{footerShortcuts.join(' · ')}</Text>
      </Box>
    </Box>
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
