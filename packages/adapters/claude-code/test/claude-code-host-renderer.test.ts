import {
  HostDistributionHandoffBridge,
  StructuredWorkflowAssetRegistry,
} from '@repo-ai-governor/standards';
import { ClaudeCodeHostRenderer } from '../src/claude-code-host-renderer.js';

describe('ClaudeCodeHostRenderer', () => {
  function createRegistry(target: 'claude_code.project_local' | 'claude_code.plugin') {
    return new StructuredWorkflowAssetRegistry({
      records: [
        {
          workflowId:
            target === 'claude_code.project_local'
              ? 'workspace-code-review-workflow'
              : 'technical-solution-promotion',
          workflowVersion: '1.0.0',
          workflowStatus: 'active',
          semanticOwnerModule: 'runtime.governance-clients',
          displayName:
            target === 'claude_code.project_local'
              ? 'Workspace Code Review Workflow'
              : 'Technical Solution Promotion',
          description: 'Claude Code host renderer fixture.',
          canonicalSourceRefs: [
            target === 'claude_code.project_local'
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

  it('renders a project-local staged export tree with .claude skills and settings', () => {
    const renderer = new ClaudeCodeHostRenderer({
      registry: createRegistry('claude_code.project_local'),
      currentWorkingDirectory: process.cwd(),
    });
    const result = renderer.render({
      host: 'claude-code',
      target: 'claude_code.project_local',
      mode: 'project-local',
      stagedExportRoot: '.repo-ai-governor/generated/hosts/claude-code',
      exportManifestPath: '.repo-ai-governor/generated/hosts/claude-code/host-export.manifest.json',
      verificationSummaryPath:
        '.repo-ai-governor/generated/hosts/claude-code/host-verification.summary.json',
    });

    expect(result.exportManifest.host).toBe('claude-code');
    expect(result.exportManifest.target).toBe('claude_code.project_local');
    expect(
      result.projectedFiles.some(
        (file) => file.relativePath === '.claude/skills/workspace-code-review-workflow/SKILL.md',
      ),
    ).toBe(true);
    expect(
      result.projectedFiles.some((file) => file.relativePath === '.claude/settings.json'),
    ).toBe(true);
    expect(
      result.projectedFiles.some((file) => file.relativePath === '.claude/hooks/hooks.json'),
    ).toBe(true);
    expect(
      result.projectedFiles.some(
        (file) => file.relativePath === '.claude/agents/workspace-code-review-workflow.agent.md',
      ),
    ).toBe(true);
    expect(result.projectedFiles.some((file) => file.relativePath === '.mcp.json')).toBe(true);
  });

  it('renders a plugin bundle with plugin manifest, skills, agents, and hooks', () => {
    const renderer = new ClaudeCodeHostRenderer({
      registry: createRegistry('claude_code.plugin'),
      currentWorkingDirectory: process.cwd(),
    });
    const result = renderer.render({
      host: 'claude-code',
      target: 'claude_code.plugin',
      mode: 'plugin-bundle',
      stagedExportRoot: '.repo-ai-governor/generated/hosts/claude-code',
      exportManifestPath: '.repo-ai-governor/generated/hosts/claude-code/host-export.manifest.json',
      verificationSummaryPath:
        '.repo-ai-governor/generated/hosts/claude-code/host-verification.summary.json',
    });

    expect(
      result.projectedFiles.some((file) => file.relativePath === '.claude-plugin/plugin.json'),
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
    expect(result.projectedFiles.some((file) => file.relativePath === 'hooks/hooks.json')).toBe(
      true,
    );
    expect(result.projectedFiles.some((file) => file.relativePath === '.mcp.json')).toBe(true);
  });
});
