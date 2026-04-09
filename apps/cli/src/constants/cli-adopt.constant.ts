import { WorkspaceMode } from '@repo-ai-governor/shared';
import { HostDistributionHost } from '@repo-ai-governor/standards';

/**
 * Defines sub-actions supported by the `adopt` command surface.
 */
export enum CliAdoptAction {
  LIST = 'list',
  APPLY = 'apply',
  DIFF = 'diff',
  VERIFY = 'verify',
  UPGRADE = 'upgrade',
  REMOVE = 'remove',
}

/**
 * Re-exports adopt-action values as a validation set.
 */
export const CLI_ADOPT_ACTION_VALUES = new Set<string>(Object.values(CliAdoptAction));

/**
 * Re-exports supported host-family selectors accepted by `adopt`.
 */
export const CLI_ADOPT_HOST_VALUES = new Set<string>(Object.values(HostDistributionHost));

/**
 * Defines workspace modes accepted by `adopt apply`.
 */
export const CLI_ADOPT_WORKSPACE_MODE_VALUES = new Set<string>([
  WorkspaceMode.TOOL_MANAGED,
  WorkspaceMode.REPO_LOCAL,
] satisfies WorkspaceMode[]);
