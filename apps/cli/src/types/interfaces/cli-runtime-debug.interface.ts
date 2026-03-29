import type {
  CliInteractiveShellFallbackBehavior,
  CliInteractiveUiMode,
} from '../../constants/cli-interactive-shell.constant.js';
import type { CliReactThemePreset } from '../../constants/cli-react-theme.constant.js';

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
