import { existsSync } from 'node:fs';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

import { runCli } from '../src/main.js';

function createBufferedIo(currentWorkingDirectory: string): {
  stdoutBuffer: string[];
  stderrBuffer: string[];
  io: {
    stdout: (value: string) => void;
    stderr: (value: string) => void;
    cwd: () => string;
  };
} {
  const stdoutBuffer: string[] = [];
  const stderrBuffer: string[] = [];

  return {
    stdoutBuffer,
    stderrBuffer,
    io: {
      stdout: (value: string) => {
        stdoutBuffer.push(value);
      },
      stderr: (value: string) => {
        stderrBuffer.push(value);
      },
      cwd: () => currentWorkingDirectory,
    },
  };
}

async function createAdoptionFixtureRepository(): Promise<string> {
  const repositoryRoot = await mkdtemp(resolve(tmpdir(), 'repo-ai-governor-adopt-cli-'));
  await writeFile(resolve(repositoryRoot, 'README.md'), '# Fixture Repository\n', 'utf8');
  return repositoryRoot;
}

describe('adopt command integration', () => {
  it('applies a built-in adoption pack into a clean repository without source-local skills', async () => {
    const repositoryRoot = await createAdoptionFixtureRepository();

    try {
      const applyIo = createBufferedIo(repositoryRoot);
      const applyExitCode = await runCli(
        [
          'node',
          'repo-ai-governor',
          'adopt',
          'apply',
          'adopter-complete',
          '--repo',
          '.',
          '--hosts',
          'codex,github-copilot',
        ],
        applyIo.io,
      );

      expect(applyExitCode).toBe(0);
      expect(applyIo.stderrBuffer.join('')).toBe('');
      expect(
        existsSync(
          resolve(repositoryRoot, '.agents', 'skills', 'workspace-scoped-cr-loop', 'SKILL.md'),
        ),
      ).toBe(true);
      expect(
        existsSync(
          resolve(
            repositoryRoot,
            '.github',
            'skills',
            'workspace-code-review-workflow',
            'SKILL.md',
          ),
        ),
      ).toBe(true);
      expect(
        existsSync(
          resolve(repositoryRoot, '.repo-ai-governor', 'adoption', 'docs', 'README.adoption.md'),
        ),
      ).toBe(true);
      expect(
        existsSync(
          resolve(repositoryRoot, '.repo-ai-governor', 'adoption', 'guides', 'connect.md'),
        ),
      ).toBe(true);
      expect(
        existsSync(
          resolve(
            repositoryRoot,
            '.repo-ai-governor',
            'adoption',
            'installations',
            'repo-ai-governor-adoption-pack',
            'adoption-install.receipt.json',
          ),
        ),
      ).toBe(true);

      const verifyIo = createBufferedIo(repositoryRoot);
      const verifyExitCode = await runCli(
        ['node', 'repo-ai-governor', 'adopt', 'verify', '--repo', '.'],
        verifyIo.io,
      );
      const verificationSummary = JSON.parse(
        await readFile(
          resolve(
            repositoryRoot,
            '.repo-ai-governor',
            'adoption',
            'installations',
            'repo-ai-governor-adoption-pack',
            'adoption-verification.summary.json',
          ),
          'utf8',
        ),
      ) as {
        status: string;
        checks: Array<{ checkId: string }>;
      };

      expect(verifyExitCode).toBe(0);
      expect(verifyIo.stderrBuffer.join('')).toBe('');
      expect(verifyIo.stdoutBuffer.join('')).toContain('adoption_verify');
      expect(verificationSummary.status).toBe('pass');
      expect(
        verificationSummary.checks.some((check) =>
          check.checkId.startsWith('self-host-readiness:'),
        ),
      ).toBe(false);
      expect(
        verificationSummary.checks.some(
          (check) => check.checkId === 'self-host-execution-preflight',
        ),
      ).toBe(false);

      const managedSkillPath = resolve(
        repositoryRoot,
        '.agents',
        'skills',
        'workspace-scoped-cr-loop',
        'SKILL.md',
      );
      const originalSkillContent = await readFile(managedSkillPath, 'utf8');
      await writeFile(managedSkillPath, '# drift\n', 'utf8');

      const diffIo = createBufferedIo(repositoryRoot);
      const diffExitCode = await runCli(
        ['node', 'repo-ai-governor', 'adopt', 'diff', '--repo', '.'],
        diffIo.io,
      );

      expect(diffExitCode).toBe(1);
      expect(diffIo.stderrBuffer.join('')).toContain('STANDARDS_PACK_INVALID');
      expect(
        existsSync(
          resolve(
            repositoryRoot,
            '.repo-ai-governor',
            'adoption',
            'installations',
            'repo-ai-governor-adoption-pack',
            'adoption-diff.report.json',
          ),
        ),
      ).toBe(true);

      const removeIo = createBufferedIo(repositoryRoot);
      const removeExitCode = await runCli(
        [
          'node',
          'repo-ai-governor',
          'adopt',
          'remove',
          'adopter-complete',
          '--repo',
          '.',
          '--force',
        ],
        removeIo.io,
      );

      expect(removeExitCode).toBe(1);
      expect(removeIo.stderrBuffer.join('')).toContain('STANDARDS_PACK_INVALID');
      expect(
        existsSync(
          resolve(
            repositoryRoot,
            '.repo-ai-governor',
            'adoption',
            'installations',
            'repo-ai-governor-adoption-pack',
            'adoption-install.receipt.json',
          ),
        ),
      ).toBe(true);

      await writeFile(managedSkillPath, originalSkillContent, 'utf8');

      const cleanRemoveIo = createBufferedIo(repositoryRoot);
      const cleanRemoveExitCode = await runCli(
        [
          'node',
          'repo-ai-governor',
          'adopt',
          'remove',
          'adopter-complete',
          '--repo',
          '.',
          '--force',
        ],
        cleanRemoveIo.io,
      );

      expect(cleanRemoveExitCode).toBe(0);
      expect(cleanRemoveIo.stderrBuffer.join('')).toBe('');
      expect(
        existsSync(
          resolve(repositoryRoot, '.agents', 'skills', 'workspace-scoped-cr-loop', 'SKILL.md'),
        ),
      ).toBe(false);
    } finally {
      await rm(repositoryRoot, { recursive: true, force: true });
    }
  });

  it('applies the default multi-host profile and upgrades a clean installation', async () => {
    const repositoryRoot = await createAdoptionFixtureRepository();

    try {
      const applyIo = createBufferedIo(repositoryRoot);
      const applyExitCode = await runCli(
        ['node', 'repo-ai-governor', 'adopt', 'apply', 'adopter-complete', '--repo', '.'],
        applyIo.io,
      );

      expect(applyExitCode).toBe(0);
      expect(applyIo.stderrBuffer.join('')).toBe('');
      expect(
        existsSync(
          resolve(repositoryRoot, '.agents', 'skills', 'workspace-scoped-cr-loop', 'SKILL.md'),
        ),
      ).toBe(true);
      expect(
        existsSync(
          resolve(repositoryRoot, '.claude', 'skills', 'workspace-scoped-cr-loop', 'SKILL.md'),
        ),
      ).toBe(true);
      expect(
        existsSync(
          resolve(repositoryRoot, '.github', 'skills', 'workspace-scoped-cr-loop', 'SKILL.md'),
        ),
      ).toBe(true);

      const agentsContent = await readFile(resolve(repositoryRoot, 'AGENTS.md'), 'utf8');
      expect(agentsContent).toContain('Codex Host Projection');
      expect(agentsContent).toContain('GitHub Copilot Host Projection');

      const mcpContent = await readFile(resolve(repositoryRoot, '.mcp.json'), 'utf8');
      expect(mcpContent).toContain('"supportedHosts"');
      expect(mcpContent).toContain('"claude-code"');
      expect(mcpContent).toContain('"codex"');
      const receiptPath = resolve(
        repositoryRoot,
        '.repo-ai-governor',
        'adoption',
        'installations',
        'repo-ai-governor-adoption-pack',
        'adoption-install.receipt.json',
      );
      const receipt = JSON.parse(await readFile(receiptPath, 'utf8')) as {
        hostTarget: string;
        hostTargets?: string[];
      };
      expect(receipt.hostTargets).toHaveLength(3);
      expect(receipt.hostTargets).toEqual(
        expect.arrayContaining([
          'codex.project_local',
          'claude_code.project_local',
          'github_copilot.repo_local',
        ]),
      );
      expect(receipt.hostTargets?.[0]).toBe(receipt.hostTarget);

      await writeFile(
        receiptPath,
        `${JSON.stringify(
          {
            ...receipt,
            hostTargets: undefined,
          },
          null,
          2,
        )}\n`,
        'utf8',
      );

      const verifyIo = createBufferedIo(repositoryRoot);
      const verifyExitCode = await runCli(
        ['node', 'repo-ai-governor', 'adopt', 'verify', '--repo', '.'],
        verifyIo.io,
      );

      expect(verifyExitCode).toBe(0);
      expect(verifyIo.stderrBuffer.join('')).toBe('');
      expect(verifyIo.stdoutBuffer.join('')).toContain('adoption_verify');

      const upgradeIo = createBufferedIo(repositoryRoot);
      const upgradeExitCode = await runCli(
        ['node', 'repo-ai-governor', 'adopt', 'upgrade', 'adopter-complete', '--repo', '.'],
        upgradeIo.io,
      );

      expect(upgradeExitCode).toBe(0);
      expect(upgradeIo.stderrBuffer.join('')).toBe('');
      expect(upgradeIo.stdoutBuffer.join('')).toContain('adoption_upgrade');

      const upgradedReceipt = JSON.parse(await readFile(receiptPath, 'utf8')) as {
        hostTargets?: string[];
      };
      expect(upgradedReceipt.hostTargets).toHaveLength(3);
    } finally {
      await rm(repositoryRoot, { recursive: true, force: true });
    }
  });

  it('bootstraps self-host repo-local surfaces and sqlite registries', async () => {
    const repositoryRoot = await createAdoptionFixtureRepository();

    try {
      const applyIo = createBufferedIo(repositoryRoot);
      const applyExitCode = await runCli(
        [
          'node',
          'repo-ai-governor',
          'adopt',
          'apply',
          'adopter-complete',
          '--adoption-profile',
          'self-host-complete',
          '--repo',
          '.',
          '--workspace-mode',
          'repo_local',
          '--hosts',
          'codex',
        ],
        applyIo.io,
      );

      expect(applyExitCode).toBe(0);
      expect(applyIo.stderrBuffer.join('')).toBe('');
      expect(existsSync(resolve(repositoryRoot, '.repo-ai-governor', 'governor.yaml'))).toBe(true);
      expect(
        existsSync(resolve(repositoryRoot, '.repo-ai-governor', 'context', 'current-context.md')),
      ).toBe(true);
      expect(existsSync(resolve(repositoryRoot, '.repo-ai-governor', 'draft', 'README.md'))).toBe(
        true,
      );
      expect(
        existsSync(
          resolve(
            repositoryRoot,
            '.repo-ai-governor',
            'context',
            'dev',
            'project-template',
            'plan.md',
          ),
        ),
      ).toBe(true);
      expect(
        existsSync(
          resolve(
            repositoryRoot,
            '.repo-ai-governor',
            'context',
            'dev',
            'project-template',
            'sprint-template',
            'tasks',
            'tasks.csv',
          ),
        ),
      ).toBe(true);
      expect(
        existsSync(
          resolve(
            repositoryRoot,
            '.repo-ai-governor',
            'context',
            'dev',
            'sqlite',
            'task-ledger.sqlite',
          ),
        ),
      ).toBe(true);
      expect(
        existsSync(
          resolve(
            repositoryRoot,
            '.repo-ai-governor',
            'context',
            'artifact-registry',
            'sqlite',
            'artifact-registry.sqlite',
          ),
        ),
      ).toBe(true);
      expect(
        existsSync(
          resolve(
            repositoryRoot,
            '.repo-ai-governor',
            'normative_knowledge_sources',
            'technical-solutions',
            'technical-solution-module-registry.yaml',
          ),
        ),
      ).toBe(true);
      expect(
        existsSync(
          resolve(
            repositoryRoot,
            '.repo-ai-governor',
            'normative_knowledge_sources',
            'governance',
            'code_standards.md',
          ),
        ),
      ).toBe(true);
      expect(
        existsSync(
          resolve(
            repositoryRoot,
            '.repo-ai-governor',
            'normative_knowledge_sources',
            'governance',
            'long-term-maintenance-guide.md',
          ),
        ),
      ).toBe(true);

      const configContent = await readFile(
        resolve(repositoryRoot, '.repo-ai-governor', 'governor.yaml'),
        'utf8',
      );
      const codeStandardsContent = await readFile(
        resolve(
          repositoryRoot,
          '.repo-ai-governor',
          'normative_knowledge_sources',
          'governance',
          'code_standards.md',
        ),
        'utf8',
      );
      const maintenanceGuideContent = await readFile(
        resolve(
          repositoryRoot,
          '.repo-ai-governor',
          'normative_knowledge_sources',
          'governance',
          'long-term-maintenance-guide.md',
        ),
        'utf8',
      );
      expect(configContent).toContain('mode: repo_local');
      expect(codeStandardsContent).toContain('- Status: draft');
      expect(codeStandardsContent).toContain('- Placeholder Status: replace_before_execution');
      expect(maintenanceGuideContent).toContain('- Status: draft');
      expect(maintenanceGuideContent).toContain('- Placeholder Status: replace_before_execution');

      const verifyIo = createBufferedIo(repositoryRoot);
      const verifyExitCode = await runCli(
        ['node', 'repo-ai-governor', 'adopt', 'verify', '--repo', '.'],
        verifyIo.io,
      );
      const verificationSummary = JSON.parse(
        await readFile(
          resolve(
            repositoryRoot,
            '.repo-ai-governor',
            'adoption',
            'installations',
            'repo-ai-governor-adoption-pack',
            'adoption-verification.summary.json',
          ),
          'utf8',
        ),
      ) as {
        status: string;
        checks: Array<{ checkId: string; status: string; detail: string }>;
      };
      const governanceRulesReadinessCheck = verificationSummary.checks.find(
        (check) => check.checkId === 'self-host-readiness:governance_rules_ready',
      );
      const productDirectionReadinessCheck = verificationSummary.checks.find(
        (check) => check.checkId === 'self-host-readiness:product_direction_ready',
      );
      const executionSurfaceReadinessCheck = verificationSummary.checks.find(
        (check) => check.checkId === 'self-host-readiness:execution_surface_ready',
      );
      const executionPreflightCheck = verificationSummary.checks.find(
        (check) => check.checkId === 'self-host-execution-preflight',
      );

      expect(verifyExitCode).toBe(0);
      expect(verifyIo.stderrBuffer.join('')).toBe('');
      expect(verifyIo.stdoutBuffer.join('')).toContain('adoption_verify');
      expect(verificationSummary.status).toBe('warn');
      expect(governanceRulesReadinessCheck).toMatchObject({
        status: 'warn',
      });
      expect(governanceRulesReadinessCheck?.detail).toContain(
        '.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md',
      );
      expect(productDirectionReadinessCheck).toMatchObject({
        status: 'warn',
      });
      expect(productDirectionReadinessCheck?.detail).toContain(
        '.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md',
      );
      expect(executionSurfaceReadinessCheck).toMatchObject({
        status: 'warn',
      });
      expect(executionSurfaceReadinessCheck?.detail).toContain(
        '.repo-ai-governor/context/current-context.md',
      );
      expect(executionPreflightCheck).toMatchObject({
        status: 'warn',
      });
      expect(executionPreflightCheck?.detail).toContain('execution_preflight_signal=blocked');

      const doctorIo = createBufferedIo(repositoryRoot);
      const doctorExitCode = await runCli(
        ['node', 'repo-ai-governor', '--output', 'json', 'doctor'],
        doctorIo.io,
      );
      const doctorPayload = JSON.parse(doctorIo.stdoutBuffer.join('')) as {
        command?: string;
        command_result?: {
          checks?: Array<{ id?: string; status?: string; detail?: string }>;
          artifacts?: Array<{ id?: string; path?: string }>;
        };
      };
      const doctorDiagnosticsArtifactPath = doctorPayload.command_result?.artifacts?.find(
        (artifact) => artifact.id === 'doctor_diagnostics',
      )?.path;
      const doctorDiagnosticsPayload = JSON.parse(
        await readFile(String(doctorDiagnosticsArtifactPath), 'utf8'),
      ) as {
        checks?: Array<{ id?: string; status?: string; detail?: string }>;
      };
      const doctorGovernanceRulesReadinessCheck = doctorPayload.command_result?.checks?.find(
        (check) => check.id === 'self-host-readiness:governance_rules_ready',
      );
      const doctorProductDirectionReadinessCheck = doctorPayload.command_result?.checks?.find(
        (check) => check.id === 'self-host-readiness:product_direction_ready',
      );
      const doctorExecutionSurfaceReadinessCheck = doctorPayload.command_result?.checks?.find(
        (check) => check.id === 'self-host-readiness:execution_surface_ready',
      );
      const doctorExecutionPreflightCheck = doctorPayload.command_result?.checks?.find(
        (check) => check.id === 'self-host-execution-preflight',
      );

      expect(doctorExitCode).toBe(0);
      expect(doctorIo.stderrBuffer.join('')).toBe('');
      expect(doctorPayload.command).toBe('doctor');
      expect(doctorGovernanceRulesReadinessCheck).toMatchObject({
        status: 'warn',
      });
      expect(doctorGovernanceRulesReadinessCheck?.detail).toContain(
        '.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md',
      );
      expect(doctorProductDirectionReadinessCheck).toMatchObject({
        status: 'warn',
      });
      expect(doctorProductDirectionReadinessCheck?.detail).toContain(
        '.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md',
      );
      expect(doctorExecutionSurfaceReadinessCheck).toMatchObject({
        status: 'warn',
      });
      expect(doctorExecutionSurfaceReadinessCheck?.detail).toContain(
        '.repo-ai-governor/context/current-context.md',
      );
      expect(doctorExecutionPreflightCheck).toMatchObject({
        status: 'warn',
      });
      expect(doctorExecutionPreflightCheck?.detail).toContain('execution_preflight_signal=blocked');
      expect(
        doctorDiagnosticsPayload.checks?.some(
          (check) =>
            check.id === 'self-host-readiness:governance_rules_ready' && check.status === 'warn',
        ),
      ).toBe(true);
      expect(
        doctorDiagnosticsPayload.checks?.some(
          (check) => check.id === 'self-host-execution-preflight' && check.status === 'warn',
        ),
      ).toBe(true);
    } finally {
      await rm(repositoryRoot, { recursive: true, force: true });
    }
  });

  it('keeps doctor diagnostic output available when an adoption receipt is malformed', async () => {
    const repositoryRoot = await createAdoptionFixtureRepository();

    try {
      const applyIo = createBufferedIo(repositoryRoot);
      const applyExitCode = await runCli(
        [
          'node',
          'repo-ai-governor',
          'adopt',
          'apply',
          'adopter-complete',
          '--adoption-profile',
          'self-host-complete',
          '--repo',
          '.',
          '--workspace-mode',
          'repo_local',
          '--hosts',
          'codex',
        ],
        applyIo.io,
      );
      const receiptPath = resolve(
        repositoryRoot,
        '.repo-ai-governor',
        'adoption',
        'installations',
        'repo-ai-governor-adoption-pack',
        'adoption-install.receipt.json',
      );

      expect(applyExitCode).toBe(0);
      expect(applyIo.stderrBuffer.join('')).toBe('');

      await writeFile(receiptPath, '{bad json\n', 'utf8');

      const doctorIo = createBufferedIo(repositoryRoot);
      const doctorExitCode = await runCli(
        ['node', 'repo-ai-governor', '--output', 'json', 'doctor'],
        doctorIo.io,
      );
      const doctorPayload = JSON.parse(doctorIo.stdoutBuffer.join('')) as {
        command?: string;
        command_result?: {
          checks?: Array<{ id?: string; status?: string; detail?: string }>;
          artifacts?: Array<{ id?: string; path?: string }>;
        };
      };
      const doctorDiagnosticsArtifactPath = doctorPayload.command_result?.artifacts?.find(
        (artifact) => artifact.id === 'doctor_diagnostics',
      )?.path;
      const doctorDiagnosticsPayload = JSON.parse(
        await readFile(String(doctorDiagnosticsArtifactPath), 'utf8'),
      ) as {
        checks?: Array<{ id?: string; status?: string; detail?: string }>;
      };
      const invalidReceiptCheck = doctorPayload.command_result?.checks?.find(
        (check) => check.id === 'adoption-receipt-diagnostics',
      );

      expect(doctorExitCode).toBe(0);
      expect(doctorIo.stderrBuffer.join('')).toBe('');
      expect(doctorPayload.command).toBe('doctor');
      expect(invalidReceiptCheck).toMatchObject({
        status: 'fail',
      });
      expect(invalidReceiptCheck?.detail).toContain('receipt_state=invalid');
      expect(invalidReceiptCheck?.detail).toContain('code=STANDARDS_PACK_INVALID');
      expect(invalidReceiptCheck?.detail).toContain(receiptPath);
      expect(
        doctorDiagnosticsPayload.checks?.some(
          (check) => check.id === 'adoption-receipt-diagnostics' && check.status === 'fail',
        ),
      ).toBe(true);
    } finally {
      await rm(repositoryRoot, { recursive: true, force: true });
    }
  });
});
