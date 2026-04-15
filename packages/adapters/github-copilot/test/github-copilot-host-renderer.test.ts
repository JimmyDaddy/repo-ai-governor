import { PUBLIC_SERVICE_HOST_PACKAGE_EXPORT } from '@repo-ai-governor/shared';
import {
  HostDistributionHandoffBridge,
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
      | 'github_copilot.repo_local'
      | 'github_copilot.cli_plugin'
      | 'github_copilot.github_com_agent',
  ) {
    return new StructuredWorkflowAssetRegistry({
      records: [
        {
          workflowId:
            target === 'github_copilot.repo_local'
              ? 'workspace-code-review-workflow'
              : target === 'github_copilot.cli_plugin'
                ? 'technical-solution-promotion'
                : 'delivery-finisher',
          workflowVersion: '1.0.0',
          workflowStatus: 'active',
          semanticOwnerModule: 'runtime.governance-clients',
          displayName:
            target === 'github_copilot.repo_local'
              ? 'Workspace Code Review Workflow'
              : target === 'github_copilot.cli_plugin'
                ? 'Technical Solution Promotion'
                : 'Delivery Finisher',
          description: 'GitHub Copilot host renderer fixture.',
          canonicalSourceRefs: [
            target === 'github_copilot.repo_local'
              ? '.codex/skills/workspace-code-review-workflow/SKILL.md'
              : target === 'github_copilot.cli_plugin'
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
      registry: createRegistry('github_copilot.repo_local'),
      currentWorkingDirectory: process.cwd(),
    });
    const result = renderer.render({
      host: 'github-copilot',
      target: 'github_copilot.repo_local',
      mode: 'project-local',
      stagedExportRoot: '.repo-ai-governor/generated/hosts/github-copilot',
      exportManifestPath:
        '.repo-ai-governor/generated/hosts/github-copilot/host-export.manifest.json',
      verificationSummaryPath:
        '.repo-ai-governor/generated/hosts/github-copilot/host-verification.summary.json',
    });

    expect(result.exportManifest.host).toBe('github-copilot');
    expect(result.exportManifest.target).toBe('github_copilot.repo_local');
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
      registry: createRegistry('github_copilot.cli_plugin'),
      currentWorkingDirectory: process.cwd(),
    });
    const result = renderer.render({
      host: 'github-copilot',
      target: 'github_copilot.cli_plugin',
      mode: 'plugin-bundle',
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
      registry: createRegistry('github_copilot.github_com_agent'),
      currentWorkingDirectory: process.cwd(),
    });
    const result = renderer.render({
      host: 'github-copilot',
      target: 'github_copilot.github_com_agent',
      mode: 'project-local',
      stagedExportRoot: '.repo-ai-governor/generated/hosts/github-copilot',
      exportManifestPath:
        '.repo-ai-governor/generated/hosts/github-copilot/host-export.manifest.json',
      verificationSummaryPath:
        '.repo-ai-governor/generated/hosts/github-copilot/host-verification.summary.json',
    });

    expect(result.exportManifest.target).toBe('github_copilot.github_com_agent');
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
