import {
  WorkspaceMode,
  buildDefaultGovernorConfig,
  renderGovernorConfigContent,
} from '@repo-ai-governor/config';
import { DEFAULT_MEMORY_RUNTIME_CONFIG } from '@repo-ai-governor/shared';

/**
 * Builds the canonical repo-local self-host governor config seed used by both bootstrap init and
 * managed self-host materialization so first-run bootstrap stays transactionally consistent.
 */
export function buildSelfHostGovernorConfigContent(): string {
  return renderGovernorConfigContent(
    buildDefaultGovernorConfig(
      {
        mode: WorkspaceMode.REPO_LOCAL,
      },
      {
        storeEngine: DEFAULT_MEMORY_RUNTIME_CONFIG.storeEngine,
        storeRoot: DEFAULT_MEMORY_RUNTIME_CONFIG.storeRoot,
      },
    ),
  );
}
