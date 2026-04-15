import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
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

interface CliJsonOutput {
  command?: string;
  command_result?: {
    operation?: string;
    summary?: string;
    details?: Record<string, string>;
    checks?: Array<{ id?: string; status?: string; detail?: string }>;
    artifacts?: Array<{ id?: string; path?: string }>;
  };
}

interface BootstrapSummaryPayload {
  selectorResolution?: string;
  reentryMode?: string;
  stageOrder?: string[];
  broaderGovernanceAuditFollowUp?: string;
  redirectCommands?: string[];
  diffReportPath?: string | null;
  finalStatus?: string;
  stages?: Array<{ stageId?: string; status?: string; detail?: string }>;
}

function parseJsonOutput(stdoutBuffer: string[]): CliJsonOutput {
  return JSON.parse(stdoutBuffer.join('')) as CliJsonOutput;
}

async function createAmbiguousAdoptionPackManifest(repositoryRoot: string): Promise<void> {
  const adoptionPackRoot = resolve(repositoryRoot, '.repo-ai-governor', 'adoption-packs');
  await mkdir(adoptionPackRoot, { recursive: true });
  await writeFile(
    resolve(adoptionPackRoot, 'ambiguous-adopter-pack.json'),
    `${JSON.stringify(
      {
        schemaVersion: 'adoption-pack-manifest-v1',
        packId: 'ambiguous-adopter-pack',
        packVersion: '1.0.0',
        status: 'active',
        ownerModule: 'runtime.governance-clients',
        profiles: [
          {
            profileId: 'adopter-complete',
            displayName: 'Ambiguous Adopter Complete',
            workflowAssetIds: [],
            commandEntrypoints: ['adopt apply', 'adopt verify'],
            guideEntrypoints: [],
            standardsPackRefs: [],
            hostTargets: ['codex.project_local'],
            bootstrapActions: ['write-adoption-metadata'],
            workspaceModePolicy: 'tool_managed_default',
          },
        ],
        managedAssetGroups: ['management_metadata'],
        managedPaths: ['.repo-ai-governor/adoption/**'],
        canonicalSourceRefs: ['docs/ambiguous-adoption-pack.md'],
        sourcePackRefs: ['pack.ambiguous-adopter-pack@1.0.0'],
        hostTargets: ['codex.project_local'],
        handoffBridge: 'cli_wrapper',
        verificationProfileRefs: ['adoption.verify'],
        upgradePolicy: 'managed_with_drift_report',
        removePolicy: 'managed_with_confirm',
        docsEntrypoints: [],
      },
      null,
      2,
    )}\n`,
    'utf8',
  );
}

async function readLatestBootstrapSummary(
  repositoryRoot: string,
): Promise<{ summaryPath: string; payload: BootstrapSummaryPayload }> {
  const diagnosticsRoot = resolve(
    repositoryRoot,
    '.repo-ai-governor',
    'context',
    'diagnostics',
    'adoption-bootstrap',
  );
  const summaryEntries = (await readdir(diagnosticsRoot))
    .filter((entry) => entry.endsWith('.json'))
    .sort();
  const summaryPath = resolve(diagnosticsRoot, summaryEntries.at(-1) ?? '');
  return {
    summaryPath,
    payload: JSON.parse(await readFile(summaryPath, 'utf8')) as BootstrapSummaryPayload,
  };
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

  it('bootstraps the default built-in pack when the selector is omitted and writes additive summary artifacts', async () => {
    const repositoryRoot = await createAdoptionFixtureRepository();

    try {
      const bootstrapIo = createBufferedIo(repositoryRoot);
      const bootstrapExitCode = await runCli(
        [
          'node',
          'repo-ai-governor',
          '--output',
          'json',
          'adopt',
          'bootstrap',
          '--repo',
          '.',
          '--hosts',
          'codex',
          '--workspace-mode',
          'repo_local',
        ],
        bootstrapIo.io,
      );
      const bootstrapPayload = parseJsonOutput(bootstrapIo.stdoutBuffer);
      const initManifestPath = bootstrapPayload.command_result?.artifacts?.find(
        (artifact) => artifact.id === 'init_manifest',
      )?.path;
      const doctorDiagnosticsPath = bootstrapPayload.command_result?.artifacts?.find(
        (artifact) => artifact.id === 'doctor_diagnostics',
      )?.path;
      const bootstrapSummaryPath = bootstrapPayload.command_result?.artifacts?.find(
        (artifact) => artifact.id === 'adoption_bootstrap_summary',
      )?.path;
      const bootstrapSummary = JSON.parse(
        await readFile(String(bootstrapSummaryPath), 'utf8'),
      ) as BootstrapSummaryPayload;

      expect(bootstrapExitCode).toBe(0);
      expect(bootstrapIo.stderrBuffer.join('')).toBe('');
      expect(bootstrapPayload.command_result?.operation).toBe('adoption_bootstrap');
      expect(bootstrapPayload.command_result?.details?.selector_resolution).toBe(
        'default_built_in',
      );
      expect(bootstrapPayload.command_result?.details?.reentry_mode).toBe('fresh_install');
      expect(bootstrapPayload.command_result?.details?.host_target_count).toBe('1');
      expect(bootstrapPayload.command_result?.summary).toContain('check');
      expect(existsSync(String(initManifestPath))).toBe(true);
      expect(existsSync(String(doctorDiagnosticsPath))).toBe(true);
      expect(existsSync(String(bootstrapSummaryPath))).toBe(true);
      expect(bootstrapSummary.selectorResolution).toBe('default_built_in');
      expect(bootstrapSummary.reentryMode).toBe('fresh_install');
      expect(bootstrapSummary.stageOrder).toEqual(['init', 'doctor', 'apply', 'verify']);
      expect(bootstrapSummary.broaderGovernanceAuditFollowUp).toBe('check');
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
      const bootstrapReceipt = JSON.parse(
        await readFile(
          resolve(
            repositoryRoot,
            '.repo-ai-governor',
            'adoption',
            'installations',
            'repo-ai-governor-adoption-pack',
            'adoption-install.receipt.json',
          ),
          'utf8',
        ),
      ) as {
        hostTargets?: string[];
      };
      expect(bootstrapReceipt.hostTargets).toEqual(['codex.project_local']);
    } finally {
      await rm(repositoryRoot, { recursive: true, force: true });
    }
  });

  it('fails closed when an explicit profile selector is ambiguous across multiple adoption packs', async () => {
    const repositoryRoot = await createAdoptionFixtureRepository();

    try {
      await createAmbiguousAdoptionPackManifest(repositoryRoot);

      const bootstrapIo = createBufferedIo(repositoryRoot);
      const bootstrapExitCode = await runCli(
        [
          'node',
          'repo-ai-governor',
          'adopt',
          'bootstrap',
          'adopter-complete',
          '--repo',
          '.',
          '--workspace-mode',
          'repo_local',
        ],
        bootstrapIo.io,
      );
      const bootstrapJsonIo = createBufferedIo(repositoryRoot);
      const bootstrapJsonExitCode = await runCli(
        [
          'node',
          'repo-ai-governor',
          '--output',
          'json',
          'adopt',
          'bootstrap',
          'adopter-complete',
          '--repo',
          '.',
          '--workspace-mode',
          'repo_local',
        ],
        bootstrapJsonIo.io,
      );
      const bootstrapJsonPayload = JSON.parse(bootstrapJsonIo.stderrBuffer.join('')) as {
        message?: string;
      };
      const { payload: bootstrapSummary } = await readLatestBootstrapSummary(repositoryRoot);

      expect(bootstrapExitCode).toBe(1);
      expect(bootstrapIo.stderrBuffer.join('')).toContain('显式 pack id');
      expect(bootstrapIo.stderrBuffer.join('')).not.toContain('{{packId}}');
      expect(bootstrapJsonExitCode).toBe(1);
      expect(bootstrapJsonPayload.message).toContain('显式 pack id');
      expect(bootstrapJsonPayload.message).not.toContain('{{packId}}');
      expect(bootstrapSummary.finalStatus).toBe('fail');
      expect(bootstrapSummary.stages?.[0]?.detail).toContain('显式 pack id');
    } finally {
      await rm(repositoryRoot, { recursive: true, force: true });
    }
  });

  it('allows clean reruns only for matching clean existing installations', async () => {
    const repositoryRoot = await createAdoptionFixtureRepository();

    try {
      const firstRunIo = createBufferedIo(repositoryRoot);
      const firstRunExitCode = await runCli(
        [
          'node',
          'repo-ai-governor',
          '--output',
          'json',
          'adopt',
          'bootstrap',
          '--repo',
          '.',
          '--workspace-mode',
          'repo_local',
        ],
        firstRunIo.io,
      );

      expect(firstRunExitCode).toBe(0);

      const rerunIo = createBufferedIo(repositoryRoot);
      const rerunExitCode = await runCli(
        [
          'node',
          'repo-ai-governor',
          '--output',
          'json',
          'adopt',
          'bootstrap',
          '--repo',
          '.',
          '--workspace-mode',
          'repo_local',
        ],
        rerunIo.io,
      );
      const rerunPayload = parseJsonOutput(rerunIo.stdoutBuffer);
      const rerunSummaryPath = rerunPayload.command_result?.artifacts?.find(
        (artifact) => artifact.id === 'adoption_bootstrap_summary',
      )?.path;
      const rerunSummary = JSON.parse(
        await readFile(String(rerunSummaryPath), 'utf8'),
      ) as BootstrapSummaryPayload;

      expect(rerunExitCode).toBe(0);
      expect(rerunIo.stderrBuffer.join('')).toBe('');
      expect(rerunPayload.command_result?.details?.reentry_mode).toBe(
        'reuse_existing_installation',
      );
      expect(rerunSummary.reentryMode).toBe('reuse_existing_installation');
    } finally {
      await rm(repositoryRoot, { recursive: true, force: true });
    }
  });

  it('redirects drifted reruns back to diff and upgrade lifecycle commands', async () => {
    const repositoryRoot = await createAdoptionFixtureRepository();

    try {
      const firstRunIo = createBufferedIo(repositoryRoot);
      const firstRunExitCode = await runCli(
        [
          'node',
          'repo-ai-governor',
          'adopt',
          'bootstrap',
          '--repo',
          '.',
          '--workspace-mode',
          'repo_local',
        ],
        firstRunIo.io,
      );

      expect(firstRunExitCode).toBe(0);

      const managedSkillPath = resolve(
        repositoryRoot,
        '.agents',
        'skills',
        'workspace-scoped-cr-loop',
        'SKILL.md',
      );
      await writeFile(managedSkillPath, '# drift\n', 'utf8');

      const rerunIo = createBufferedIo(repositoryRoot);
      const rerunExitCode = await runCli(
        [
          'node',
          'repo-ai-governor',
          'adopt',
          'bootstrap',
          '--repo',
          '.',
          '--workspace-mode',
          'repo_local',
        ],
        rerunIo.io,
      );
      const { payload: rerunSummary } = await readLatestBootstrapSummary(repositoryRoot);

      expect(rerunExitCode).toBe(1);
      expect(rerunIo.stderrBuffer.join('')).toContain('adopt diff/upgrade/remove');
      expect(rerunSummary.reentryMode).toBe('redirect_to_lifecycle');
      expect(rerunSummary.redirectCommands).toEqual([
        'adopt diff',
        'adopt upgrade',
        'adopt remove',
      ]);
      expect(rerunSummary.diffReportPath).not.toBeNull();
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
