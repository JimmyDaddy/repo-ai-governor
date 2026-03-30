import type { AdapterSurface } from '@repo-ai-governor/shared';
import type { CliAgentOnboardingPreset } from '../../constants/cli-agent-onboarding.constant.js';
import type {
  CliInteractiveShellFallbackBehavior,
  CliInteractiveUiMode,
} from '../../constants/cli-interactive-shell.constant.js';
import type { CliReactThemePreset } from '../../constants/cli-react-theme.constant.js';

export interface CliConnectRoleBindingOverride {
  roleId: string;
  primarySurface: AdapterSurface;
  fallbackSurfaces: AdapterSurface[];
}

/**
 * Defines normalized runtime flags consumed by command execution paths.
 */
export interface CliRuntimeDebugOptions {
  interactive?: boolean;
  requestedUiMode?: CliInteractiveUiMode | null;
  requestedUiTheme?: CliReactThemePreset | null;
  uiMode?: CliInteractiveUiMode;
  uiTheme?: CliReactThemePreset;
  uiFallbackBehavior?: CliInteractiveShellFallbackBehavior | null;
  inputTty?: boolean;
  stderrTty?: boolean;
  dryRun: boolean;
  trace: boolean;
  replayPath: string | null;
  adapters?: boolean;
  fix?: boolean;
  presetId?: CliAgentOnboardingPreset | null;
  requestedTools?: AdapterSurface[];
  overwrite?: boolean;
  singleToolAllRoles?: boolean;
  roleBindingOverrides?: CliConnectRoleBindingOverride[];
  recordLedger?: boolean;
  taskId?: string | null;
  restrictedNetwork?: boolean;
  restrictedReason?: string | null;
  allowLocalFallback?: boolean;
  hitlDecision?: string | null;
  hitlDecisionReason?: string | null;
  hitlResumeAction?: string | null;
  hitlDecidedBy?: string | null;
  hitlConstraints?: string[];
}
