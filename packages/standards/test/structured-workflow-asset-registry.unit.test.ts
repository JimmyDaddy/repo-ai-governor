import {
  HostDistributionDiscoveryState,
  HostDistributionHandoffBridge,
  HostDistributionHost,
  HostDistributionMode,
  HostDistributionTarget,
  type HostRendererRenderInput,
  HostVerificationStatus,
  type StructuredWorkflowAssetRecord,
  StructuredWorkflowAssetRegistry,
} from '../src/index.js';

describe('StructuredWorkflowAssetRegistry', () => {
  const workflowFixtures: StructuredWorkflowAssetRecord[] = [
    {
      workflowId: 'workspace-code-review-workflow',
      workflowVersion: '1.0.0',
      workflowStatus: 'active',
      semanticOwnerModule: 'runtime.governance-clients',
      displayName: 'Workspace Code Review Workflow',
      description: 'Runs repository-local review flow.',
      canonicalSourceRefs: ['.codex/skills/workspace-code-review-workflow/SKILL.md', 'AGENTS.md'],
      sourcePackRefs: ['pack.official.workflow-review@1.0.0'],
      hostTargetMatrix: [
        HostDistributionTarget.CODEX_PROJECT_LOCAL,
        HostDistributionTarget.CLAUDE_CODE_PROJECT_LOCAL,
        HostDistributionTarget.GITHUB_COPILOT_REPO_LOCAL,
      ],
      triggerHints: ['review'],
      inputs: ['review scope'],
      artifacts: ['review report'],
      riskTier: 'medium',
      handoffBridge: HostDistributionHandoffBridge.CLI_WRAPPER,
      handoffTarget: 'repo-ai-governor review',
      verificationProfileRefs: ['verify.review'],
      driftChecks: ['check.project-local.skills'],
    },
    {
      workflowId: 'workspace-delivery-finisher',
      workflowVersion: '1.0.0',
      workflowStatus: 'active',
      semanticOwnerModule: 'runtime.governance-clients',
      displayName: 'Workspace Delivery Finisher',
      description: 'Runs repository-local delivery closeout flow.',
      canonicalSourceRefs: ['.codex/skills/workspace-delivery-finisher/SKILL.md', 'AGENTS.md'],
      sourcePackRefs: ['pack.official.workflow-review@1.0.0'],
      hostTargetMatrix: [
        HostDistributionTarget.CODEX_PLUGIN,
        HostDistributionTarget.CLAUDE_CODE_PLUGIN,
        HostDistributionTarget.GITHUB_COPILOT_CLI_PLUGIN,
        HostDistributionTarget.GITHUB_COPILOT_GITHUB_COM_AGENT,
      ],
      triggerHints: ['delivery'],
      inputs: ['delivery scope'],
      artifacts: ['delivery receipt'],
      riskTier: 'high',
      handoffBridge: HostDistributionHandoffBridge.MCP,
      handoffTarget: 'governor.delivery_closeout',
      verificationProfileRefs: ['verify.delivery'],
      driftChecks: ['check.plugin.skills'],
    },
  ];

  it('registers workflows and preserves deterministic workflow ordering', () => {
    const registry = new StructuredWorkflowAssetRegistry({
      records: [...workflowFixtures],
    });

    expect(registry.list()).toHaveLength(2);
    expect(registry.list()[0]?.workflowId).toBe('workspace-code-review-workflow');
    expect(registry.list()[1]?.workflowId).toBe('workspace-delivery-finisher');
  });

  it('renders a project-local export with manifest, apply report, and verification summary', () => {
    const registry = new StructuredWorkflowAssetRegistry({
      records: [...workflowFixtures],
    });

    const renderInput: HostRendererRenderInput = {
      host: HostDistributionHost.CODEX,
      mode: HostDistributionMode.PROJECT_LOCAL,
      target: HostDistributionTarget.CODEX_PROJECT_LOCAL,
      stagedExportRoot: '.repo-ai-governor/generated/hosts/codex',
      exportManifestPath: '.repo-ai-governor/generated/hosts/codex/host-export-manifest.json',
      verificationSummaryPath:
        '.repo-ai-governor/generated/hosts/codex/host-verification-summary.json',
      applyRoot: '/Users/jimmydaddy/study/ai-governor',
      applyReportPath: '.repo-ai-governor/generated/hosts/codex/host-apply-report.json',
      discoveryState: HostDistributionDiscoveryState.HOST_DISCOVERABLE,
      handoffBridge: HostDistributionHandoffBridge.CLI_WRAPPER,
    };

    const renderResult = registry.render(renderInput);

    expect(renderResult.exportManifest.host).toBe(HostDistributionHost.CODEX);
    expect(renderResult.exportManifest.mode).toBe(HostDistributionMode.PROJECT_LOCAL);
    expect(renderResult.exportManifest.target).toBe(HostDistributionTarget.CODEX_PROJECT_LOCAL);
    expect(renderResult.exportManifest.targetCapabilities.host).toBe(HostDistributionHost.CODEX);
    expect(renderResult.exportManifest.targetCapabilities.supportsApplyToRepo).toBe(true);
    expect(renderResult.exportManifest.targetCapabilities.supportedModes).toEqual([
      HostDistributionMode.PROJECT_LOCAL,
    ]);
    expect(renderResult.projectedFiles).toHaveLength(1);
    expect(renderResult.applyReport?.applyRoot).toBe('/Users/jimmydaddy/study/ai-governor');
    expect(renderResult.applyReport?.status).toBe(HostVerificationStatus.PASS);
    expect(renderResult.verificationSummary.status).toBe(HostVerificationStatus.PASS);
  });

  it('describes the reserved GitHub.com Copilot agent target contract', () => {
    const registry = new StructuredWorkflowAssetRegistry({
      records: [...workflowFixtures],
    });

    const targetCapabilities = registry.describeTargetCapabilities(
      HostDistributionTarget.GITHUB_COPILOT_GITHUB_COM_AGENT,
    );

    expect(targetCapabilities.host).toBe(HostDistributionHost.GITHUB_COPILOT);
    expect(targetCapabilities.supportedModes).toEqual([]);
    expect(targetCapabilities.supportedDiscoveryStates).toEqual([
      HostDistributionDiscoveryState.STAGED_EXPORT,
    ]);
    expect(targetCapabilities.supportedHandoffBridges).toEqual([
      HostDistributionHandoffBridge.CLI_WRAPPER,
    ]);
    expect(targetCapabilities.supportsApplyToRepo).toBe(false);
    expect(targetCapabilities.supportsBundlePackaging).toBe(false);
    expect(targetCapabilities.isMvpTarget).toBe(false);
  });
});
