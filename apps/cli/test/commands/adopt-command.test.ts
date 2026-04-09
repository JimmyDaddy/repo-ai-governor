import { GovernorErrorCode } from '@repo-ai-governor/shared';
import { CliAdoptCommand } from '../../src/commands/adopt-command.js';
import { CliAdoptAction } from '../../src/constants/cli-adopt.constant.js';
import { CliCommandResultCheckId } from '../../src/constants/cli-command-result-check.constant.js';
import { CliGovernanceCheckStatus } from '../../src/constants/cli-governance-runtime.constant.js';
import type { CliCommandExecutorContext } from '../../src/types/index.js';

describe('CliAdoptCommand', () => {
  it('includes verification diagnostics when adopt verification reports blocking checks', async () => {
    const command = new CliAdoptCommand(
      () =>
        ({
          verify: async () => ({
            action: CliAdoptAction.VERIFY,
            repoRoot: '/workspace/repo',
            packId: 'self-host-complete',
            profileId: 'adopter-complete',
            workspaceMode: 'repo_local',
            sourceKind: 'repo_local',
            sourceRef: '/workspace/repo/.repo-ai-governor/adoption-packs/self-host-complete.json',
            hostTargets: ['codex.project_local'],
            verificationStatus: 'fail',
            managedFileCount: 3,
            receiptPath: '/workspace/repo/.repo-ai-governor/adoption/adoption-install.receipt.json',
            verificationSummaryPath:
              '/workspace/repo/.repo-ai-governor/adoption/adoption-verification.summary.json',
            diffReportPath: null,
            writtenArtifacts: [],
            checks: [
              {
                checkId: 'verification-blocker',
                status: 'fail',
                detail: 'missing host manifest',
              },
            ],
          }),
        }) as never,
    );
    const context = {
      options: {
        currentWorkingDirectory: process.cwd(),
        adoptCommandOptions: {
          action: CliAdoptAction.VERIFY,
          packId: 'self-host-complete',
          profileId: 'adopter-complete',
          repoPath: '.',
          hosts: [],
          workspaceMode: null,
          receiptPath: null,
        },
      },
      calculateCheckTotals: (checks: Array<{ status: string }>) => ({
        pass: checks.filter((check) => check.status === CliGovernanceCheckStatus.PASS).length,
        warn: checks.filter((check) => check.status === CliGovernanceCheckStatus.WARN).length,
        fail: checks.filter((check) => check.status === CliGovernanceCheckStatus.FAIL).length,
      }),
      translate: (key: string, interpolation?: Record<string, string>) =>
        key === 'cli.commands.adopt.verifyCompleted'
          ? `Adopt verify completed for ${interpolation?.packId}.`
          : key,
      localizeText: (english: string) => english,
    } as unknown as CliCommandExecutorContext;

    await expect(command.execute(context)).rejects.toMatchObject({
      code: GovernorErrorCode.STANDARDS_PACK_INVALID,
      details: expect.objectContaining({
        checkTotals: {
          pass: 0,
          warn: 0,
          fail: 4,
        },
        blockingChecks: [
          CliCommandResultCheckId.ADOPT_ACTION,
          CliCommandResultCheckId.ADOPT_TARGET,
          'verification-blocker',
          CliCommandResultCheckId.ADOPT_RECEIPT,
        ],
        checks: expect.arrayContaining([
          expect.objectContaining({
            id: 'verification-blocker',
            status: CliGovernanceCheckStatus.FAIL,
            detail: 'missing host manifest',
          }),
        ]),
      }),
    });
  });
});
