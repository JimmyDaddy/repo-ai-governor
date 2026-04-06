import { GovernorErrorCode } from '@repo-ai-governor/shared';
import { CliHostCommand } from '../../src/commands/host-command.js';
import { CliGovernanceCheckStatus } from '../../src/constants/cli-governance-runtime.constant.js';
import { CliHostAction } from '../../src/constants/cli-host.constant.js';
import type { CliCommandExecutorContext } from '../../src/types/index.js';

describe('CliHostCommand', () => {
  it('maps host export runtime results into a stable command payload', async () => {
    const command = new CliHostCommand(
      () =>
        ({
          export: async () => ({
            action: CliHostAction.EXPORT,
            host: 'codex',
            mode: 'project-local',
            target: 'codex.project_local',
            stagedExportRoot: '/tmp/staged/codex',
            exportManifestPath: '/tmp/staged/codex/host-export.manifest.json',
            verificationSummaryPath: '/tmp/staged/codex/host-verification.summary.json',
            verificationStatus: 'pass',
            workflowIds: ['workspace-code-review-workflow'],
            checks: [
              {
                checkId: 'canonical-source-refs',
                status: 'pass',
                detail: 'canonical_source_refs=1',
              },
            ],
            writtenArtifacts: ['/tmp/staged/codex/host-export.manifest.json'],
            applyReportPath: '/tmp/staged/codex/host-apply.report.json',
            applyRoot: '/workspace/repo',
          }),
        }) as never,
    );
    const context = {
      options: {
        currentWorkingDirectory: process.cwd(),
        hostCommandOptions: {
          action: CliHostAction.EXPORT,
          host: 'codex',
          mode: 'project-local',
          target: 'codex.project_local',
          githubCopilotTarget: null,
          outputDir: null,
          manifestPath: null,
          applyToRepo: '.',
          bundleDir: null,
          handoffBridge: null,
          workflowIds: [],
        },
      },
      calculateCheckTotals: (checks: Array<{ status: string }>) => ({
        pass: checks.filter((check) => check.status === CliGovernanceCheckStatus.PASS).length,
        warn: checks.filter((check) => check.status === CliGovernanceCheckStatus.WARN).length,
        fail: checks.filter((check) => check.status === CliGovernanceCheckStatus.FAIL).length,
      }),
      translate: (key: string, interpolation?: Record<string, string>) =>
        key === 'cli.commands.host.exportCompleted'
          ? `Host export completed for ${interpolation?.target}.`
          : key,
      localizeText: (english: string) => english,
    } as unknown as CliCommandExecutorContext;

    const result = await command.execute(context);

    expect(result.message).toBe('Host export completed for codex.project_local.');
    expect(result.commandResult.operation).toBe('host_export');
    expect(result.commandResult.check_totals).toEqual({
      pass: 4,
      warn: 0,
      fail: 0,
    });
    expect(result.commandResult.artifacts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'host_export_manifest',
          path: '/tmp/staged/codex/host-export.manifest.json',
        }),
        expect.objectContaining({
          id: 'host_apply_report',
          path: '/tmp/staged/codex/host-apply.report.json',
        }),
      ]),
    );
  });

  it('throws when host verification reports blocking checks', async () => {
    const command = new CliHostCommand(
      () =>
        ({
          verify: async () => ({
            action: CliHostAction.VERIFY,
            host: 'github-copilot',
            mode: 'project-local',
            target: 'github_copilot.github_com_agent',
            stagedExportRoot: '/tmp/staged/github-copilot',
            exportManifestPath: '/tmp/staged/github-copilot/host-export.manifest.json',
            verificationSummaryPath: '/tmp/staged/github-copilot/host-verification.summary.json',
            verificationStatus: 'fail',
            workflowIds: ['workspace-code-review-workflow'],
            checks: [
              {
                checkId: 'target-capability',
                status: 'fail',
                detail: 'reserved_target=true',
              },
            ],
            writtenArtifacts: ['/tmp/staged/github-copilot/host-export.manifest.json'],
          }),
        }) as never,
    );
    const context = {
      options: {
        currentWorkingDirectory: process.cwd(),
        hostCommandOptions: {
          action: CliHostAction.VERIFY,
          host: 'github-copilot',
          mode: 'project-local',
          target: 'github_copilot.github_com_agent',
          githubCopilotTarget: 'github-com-agent',
          outputDir: null,
          manifestPath: '/tmp/staged/github-copilot/host-export.manifest.json',
          applyToRepo: null,
          bundleDir: null,
          handoffBridge: null,
          workflowIds: [],
        },
      },
      calculateCheckTotals: (checks: Array<{ status: string }>) => ({
        pass: checks.filter((check) => check.status === CliGovernanceCheckStatus.PASS).length,
        warn: checks.filter((check) => check.status === CliGovernanceCheckStatus.WARN).length,
        fail: checks.filter((check) => check.status === CliGovernanceCheckStatus.FAIL).length,
      }),
      translate: (key: string, interpolation?: Record<string, string>) =>
        key === 'cli.commands.host.verifyCompleted'
          ? `Host verify completed for ${interpolation?.target}.`
          : key,
      localizeText: (english: string) => english,
    } as unknown as CliCommandExecutorContext;

    await expect(command.execute(context)).rejects.toMatchObject({
      code: GovernorErrorCode.STANDARDS_PACK_INVALID,
    });
  });
});
