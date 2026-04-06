import type {
  HostDistributionHandoffBridge,
  HostDistributionHost,
  HostDistributionMode,
  HostDistributionTarget,
} from '@repo-ai-governor/standards';
import type {
  CliGithubCopilotTargetOption,
  CliHostAction,
} from '../../constants/cli-host.constant.js';

/**
 * Defines normalized raw options consumed by the `host` command executor.
 */
export interface CliHostCommandOptions {
  action: CliHostAction | null;
  host: HostDistributionHost | null;
  mode: HostDistributionMode | null;
  target: HostDistributionTarget | null;
  githubCopilotTarget: CliGithubCopilotTargetOption | null;
  outputDir: string | null;
  manifestPath: string | null;
  applyToRepo: string | null;
  bundleDir: string | null;
  handoffBridge: HostDistributionHandoffBridge | null;
  workflowIds: string[];
}
