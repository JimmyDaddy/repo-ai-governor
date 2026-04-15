import { PUBLIC_SERVICE_HOST_PACKAGE_EXPORT } from '@repo-ai-governor/shared';
import {
  HostDistributionHandoffBridge,
  StructuredWorkflowAssetRegistry,
} from '@repo-ai-governor/standards';
import { CodexHostRenderer } from '../src/codex-host-renderer.js';

describe('CodexHostRenderer', () => {
  function readProjectedJson(
    projectedFiles: Array<{ relativePath: string; content: string }>,
    relativePath: string,
  ): Record<string, unknown> {
    const file = projectedFiles.find((entry) => entry.relativePath === relativePath);
    expect(file).toBeDefined();
    return JSON.parse(file?.content ?? '{}') as Record<string, unknown>;
  }

  function createRegistry(target: 'codex.project_local' | 'codex.plugin') {
    return new StructuredWorkflowAssetRegistry({
      records: [
        {
          workflowId:
            target === 'codex.project_local'
              ? 'workspace-code-review-workflow'
              : 'technical-solution-promotion',
          workflowVersion: '1.0.0',
          workflowStatus: 'active',
          semanticOwnerModule: 'runtime.governance-clients',
          displayName:
            target === 'codex.project_local'
              ? 'Workspace Code Review Workflow'
              : 'Technical Solution Promotion',
          description: 'Codex host renderer fixture.',
          canonicalSourceRefs: [
            target === 'codex.project_local'
              ? '.codex/skills/workspace-code-review-workflow/SKILL.md'
              : '.codex/skills/technical-solution-promotion/SKILL.md',
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

  it('renders a project-local staged export tree with AGENTS and skills', () => {
    const renderer = new CodexHostRenderer({
      registry: createRegistry('codex.project_local'),
      currentWorkingDirectory: process.cwd(),
    });
    const result = renderer.render({
      host: 'codex',
      target: 'codex.project_local',
      mode: 'project-local',
      stagedExportRoot: '.repo-ai-governor/generated/hosts/codex',
      exportManifestPath: '.repo-ai-governor/generated/hosts/codex/host-export.manifest.json',
      verificationSummaryPath:
        '.repo-ai-governor/generated/hosts/codex/host-verification.summary.json',
      applyRoot: '/workspace/repo',
      applyReportPath: '.repo-ai-governor/generated/hosts/codex/host-apply.report.json',
    });

    expect(result.exportManifest.host).toBe('codex');
    expect(result.exportManifest.target).toBe('codex.project_local');
    expect(result.exportManifest.discoveryState).toBe('staged_export');
    expect(result.projectedFiles.some((file) => file.relativePath === 'AGENTS.md')).toBe(true);
    expect(
      result.projectedFiles.some(
        (file) => file.relativePath === '.agents/skills/workspace-code-review-workflow/SKILL.md',
      ),
    ).toBe(true);
    expect(result.projectedFiles.some((file) => file.relativePath === '.mcp.json')).toBe(true);
    expect(
      result.projectedFiles.some(
        (file) => file.relativePath === '.agents/subagents/workspace-code-review-workflow.json',
      ),
    ).toBe(true);
    expect(
      readProjectedJson(
        result.projectedFiles,
        '.agents/subagents/workspace-code-review-workflow.json',
      ),
    ).toEqual(
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
    expect(result.applyReport?.applyRoot).toBe('/workspace/repo');
  });

  it('renders a plugin bundle with plugin manifest, skills, and agents', () => {
    const renderer = new CodexHostRenderer({
      registry: createRegistry('codex.plugin'),
      currentWorkingDirectory: process.cwd(),
    });
    const result = renderer.render({
      host: 'codex',
      target: 'codex.plugin',
      mode: 'plugin-bundle',
      stagedExportRoot: '.repo-ai-governor/generated/hosts/codex',
      exportManifestPath: '.repo-ai-governor/generated/hosts/codex/host-export.manifest.json',
      verificationSummaryPath:
        '.repo-ai-governor/generated/hosts/codex/host-verification.summary.json',
      bundleRoot: '/workspace/bundles/codex',
      packReportPath: '.repo-ai-governor/generated/hosts/codex/host-pack.report.json',
    });

    expect(
      result.projectedFiles.some((file) => file.relativePath === '.codex-plugin/plugin.json'),
    ).toBe(true);
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
    expect(result.projectedFiles.some((file) => file.relativePath === '.mcp.json')).toBe(true);
    expect(readProjectedJson(result.projectedFiles, '.codex-plugin/plugin.json')).toEqual(
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
    expect(result.packReport?.bundleRoot).toBe('/workspace/bundles/codex');
  });
});
