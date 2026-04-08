import type { WorkspaceMode } from '@repo-ai-governor/shared';
import type { HostDistributionHost } from '@repo-ai-governor/standards';
import type { CliAdoptAction } from '../../constants/cli-adopt.constant.js';

/**
 * Defines normalized raw options consumed by the `adopt` command executor.
 */
export interface CliAdoptCommandOptions {
  action: CliAdoptAction | null;
  packSelector: string | null;
  repoPath: string | null;
  adoptionProfileId: string | null;
  hosts: HostDistributionHost[];
  workspaceMode: WorkspaceMode | null;
  receiptPath: string | null;
  force: boolean;
}
