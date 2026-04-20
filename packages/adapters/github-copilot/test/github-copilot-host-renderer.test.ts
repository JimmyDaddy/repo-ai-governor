import { PUBLIC_SERVICE_HOST_PACKAGE_EXPORT } from '@repo-ai-governor/shared';
import {
  HostDistributionHandoffBridge,
  HostDistributionHost,
  HostDistributionMode,
  HostDistributionTarget,
  StructuredWorkflowAssetRegistry,
} from '@repo-ai-governor/standards';
import { GithubCopilotHostRenderer } from '../src/github-copilot-host-renderer.js';

describe('GithubCopilotHostRenderer', () => {
  function readProjectedJson(
    projectedFiles: Array<{ relativePath: string; content: string }>,
    relativePath: string,
  ): Record<string, unknown> {
    const file = projectedFiles.find((entry) => entry.relativePath === relativePath);
    expect(file).toBeDefined();
    return JSON.parse(file?.content ?? '{}') as Record<string, unknown>;
  }

  function createRegistry(
    target:
      | HostDistributionTarget.GITHUB_COPILOT_REPO_LOCAL
      | HostDistributionTarget.GITHUB_COPILOT_CLI_PLUGIN
      | HostDistributionTarget.GITHUB_COPILOT_GITHUB_COM_AGENT,
  ) {
    return new StructuredWorkflowAssetRegistry({
      records: [
        {
          workflowId:
            target === HostDistributionTarget.GITHUB_COPILOT_REPO_LOCAL
              ? 'workspace-code-review-workflow'
              : target === HostDistributionTarget.GITHUB_COPILOT_CLI_PLUGIN
                ? 'technical-solution-promotion'
                : 'delivery-finisher',
          workflowVersion: '1.0.0',
          workflowStatus: 'active',
          semanticOwnerModule: 'runtime.governance-clients',
          displayName:
            target === HostDistributionTarget.GITHUB_COPILOT_REPO_LOCAL
              ? 'Workspace Code Review Workflow'
              : target === HostDistributionTarget.GITHUB_COPILOT_CLI_PLUGIN
                ? 'Technical Solution Promotion'
                : 'Delivery Finisher',
          description: 'GitHub Copilot host renderer fixture.',
          canonicalSourceRefs: [
            target === HostDistributionTarget.GITHUB_COPILOT_REPO_LOCAL
              ? '.codex/skills/workspace-code-review-workflow/SKILL.md'
              : target === HostDistributionTarget.GITHUB_COPILOT_CLI_PLUGIN
                ? '.codex/skills/technical-solution-promotion/SKILL.md'
                : '.codex/skills/workspace-delivery-finisher/SKILL.md',
          ],
          sourcePackRefs: ['pack.workspace.host'],
          hostTargetMatrix: [target],
          triggerHints: ['host'],
          inputs: ['scope'],
          artifacts: ['projection'],
          riskTier: 'medium',
          handoffBridge: HostDistributionHandoffBridge.CLI_WRAPPER,
          handoffTarget: 'repo-ai-governor review',
          verificationProfileRefs: ['host.verify'],
          driftChecks: ['host.content-drift'],
        },
      ],
    });
  }

  it('renders repo-local host assets with instructions, skills, agents, and AGENTS.md', () => {
    const renderer = new GithubCopilotHostRenderer({
      registry: createRegistry(HostDistributionTarget.GITHUB_COPILOT_REPO_LOCAL),
      currentWorkingDirectory: process.cwd(),
    });
    const result = renderer.render({
      host: HostDistributionHost.GITHUB_COPILOT,
      target: HostDistributionTarget.GITHUB_COPILOT_REPO_LOCAL,
      mode: HostDistributionMode.PROJECT_LOCAL,
      stagedExportRoot: '.repo-ai-governor/generated/hosts/github-copilot',
      exportManifestPath:
        '.repo-ai-governor/generated/hosts/github-copilot/host-export.manifest.json',
      verificationSummaryPath:
        '.repo-ai-governor/generated/hosts/github-copilot/host-verification.summary.json',
    });

    expect(result.exportManifest.host).toBe(HostDistributionHost.GITHUB_COPILOT);
    expect(result.exportManifest.target).toBe(HostDistributionTarget.GITHUB_COPILOT_REPO_LOCAL);
    expect(result.projectedFiles.some((file) => file.relativePath === 'AGENTS.md')).toBe(true);
    expect(
      result.projectedFiles.some((file) => file.relativePath === '.github/copilot-instructions.md'),
    ).toBe(true);
    expect(
      result.projectedFiles.some(
        (file) =>
          file.relativePath ===
          '.github/instructions/workspace-code-review-workflow.instructions.md',
      ),
    ).toBe(true);
    expect(
      result.projectedFiles.some(
        (file) => file.relativePath === '.github/skills/workspace-code-review-workflow/SKILL.md',
      ),
    ).toBe(true);
    expect(
      result.projectedFiles.some(
        (file) => file.relativePath === '.github/agents/workspace-code-review-workflow.agent.md',
      ),
    ).toBe(true);
    expect(result.projectedFiles.some((file) => file.relativePath === '.github/mcp.json')).toBe(
      true,
    );
    expect(readProjectedJson(result.projectedFiles, '.github/mcp.json')).toEqual(
      expect.objectContaining({
        mcpServers: expect.objectContaining({
          'repo-ai-governor': expect.objectContaining({
            packageExport: PUBLIC_SERVICE_HOST_PACKAGE_EXPORT,
          }),
        }),
      }),
    );
  });

  it('renders Copilot CLI plugin assets with plugin manifest, hooks, and mcp', () => {
    const renderer = new GithubCopilotHostRenderer({
      registry: createRegistry(HostDistributionTarget.GITHUB_COPILOT_CLI_PLUGIN),
      currentWorkingDirectory: process.cwd(),
    });
    const result = renderer.render({
      host: HostDistributionHost.GITHUB_COPILOT,
      target: HostDistributionTarget.GITHUB_COPILOT_CLI_PLUGIN,
      mode: HostDistributionMode.PLUGIN_BUNDLE,
      stagedExportRoot: '.repo-ai-governor/generated/hosts/github-copilot',
      exportManifestPath:
        '.repo-ai-governor/generated/hosts/github-copilot/host-export.manifest.json',
      verificationSummaryPath:
        '.repo-ai-governor/generated/hosts/github-copilot/host-verification.summary.json',
    });

    expect(result.projectedFiles.some((file) => file.relativePath === 'plugin.json')).toBe(true);
    expect(
      result.projectedFiles.some(
        (file) => file.relativePath === 'skills/technical-solution-promotion/SKILL.md',
      ),
    ).toBe(true);
    expect(
      result.projectedFiles.some(
        (file) => file.relativePath === 'agents/technical-solution-promotion.agent.md',
      ),
    ).toBe(true);
    expect(result.projectedFiles.some((file) => file.relativePath === 'hooks/hooks.json')).toBe(
      true,
    );
    expect(result.projectedFiles.some((file) => file.relativePath === '.mcp.json')).toBe(true);
    expect(readProjectedJson(result.projectedFiles, 'plugin.json')).toEqual(
      expect.objectContaining({
        serviceHostPackageExport: PUBLIC_SERVICE_HOST_PACKAGE_EXPORT,
      }),
    );
    expect(readProjectedJson(result.projectedFiles, '.mcp.json')).toEqual(
      expect.objectContaining({
        mcpServers: expect.objectContaining({
          'repo-ai-governor': expect.objectContaining({
            packageExport: PUBLIC_SERVICE_HOST_PACKAGE_EXPORT,
          }),
        }),
      }),
    );
  });

  it('renders GitHub.com agent assets without plugin packaging assumptions', () => {
    const renderer = new GithubCopilotHostRenderer({
      registry: createRegistry(HostDistributionTarget.GITHUB_COPILOT_GITHUB_COM_AGENT),
      currentWorkingDirectory: process.cwd(),
    });
    const result = renderer.render({
      host: HostDistributionHost.GITHUB_COPILOT,
      target: HostDistributionTarget.GITHUB_COPILOT_GITHUB_COM_AGENT,
      mode: HostDistributionMode.PROJECT_LOCAL,
      stagedExportRoot: '.repo-ai-governor/generated/hosts/github-copilot',
      exportManifestPath:
        '.repo-ai-governor/generated/hosts/github-copilot/host-export.manifest.json',
      verificationSummaryPath:
        '.repo-ai-governor/generated/hosts/github-copilot/host-verification.summary.json',
    });

    expect(result.exportManifest.target).toBe(
      HostDistributionTarget.GITHUB_COPILOT_GITHUB_COM_AGENT,
    );
    expect(
      result.projectedFiles.some((file) => file.relativePath === '.github/copilot-instructions.md'),
    ).toBe(true);
    expect(
      result.projectedFiles.some(
        (file) => file.relativePath === '.github/agents/delivery-finisher.agent.md',
      ),
    ).toBe(true);
    expect(
      result.projectedFiles.some((file) => file.relativePath === '.github/hooks/hooks.json'),
    ).toBe(true);
    expect(result.projectedFiles.some((file) => file.relativePath === '.github/mcp.json')).toBe(
      true,
    );
    expect(readProjectedJson(result.projectedFiles, '.github/mcp.json')).toEqual(
      expect.objectContaining({
        mcpServers: expect.objectContaining({
          'repo-ai-governor': expect.objectContaining({
            packageExport: PUBLIC_SERVICE_HOST_PACKAGE_EXPORT,
          }),
        }),
      }),
    );
  });
});
