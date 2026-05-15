import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

import {
  CliClaudeCodeExecFixtureEnvironmentKey,
  CliClaudeCodeExecFixtureMode,
} from '../src/constants/claude-code-exec-fixture.constant.js';
import {
  CliCodexExecFixtureEnvironmentKey,
  CliCodexExecFixtureMode,
} from '../src/constants/codex-exec-fixture.constant.js';
import {
  CliGithubCopilotExecFixtureEnvironmentKey,
  CliGithubCopilotExecFixtureMode,
} from '../src/constants/github-copilot-exec-fixture.constant.js';
import { runCli } from '../src/main.js';

function createBufferedIo(
  currentWorkingDirectory: string,
  environment: NodeJS.ProcessEnv = process.env,
): {
  stdoutBuffer: string[];
  stderrBuffer: string[];
  io: {
    stdout: (value: string) => void;
    stderr: (value: string) => void;
    cwd: () => string;
    env: () => NodeJS.ProcessEnv;
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
      env: () => environment,
    },
  };
}

function createDeterministicCliEnvironment(overrides: NodeJS.ProcessEnv = {}): NodeJS.ProcessEnv {
  return {
    ...Object.fromEntries(
      Object.entries(process.env).filter(([environmentKey]) => {
        return !environmentKey.startsWith('REPO_AI_GOVERNOR_');
      }),
    ),
    [CliCodexExecFixtureEnvironmentKey.ENABLE_FIXTURES]: '1',
    [CliCodexExecFixtureEnvironmentKey.EXEC_FIXTURE]: CliCodexExecFixtureMode.SUCCESS,
    [CliClaudeCodeExecFixtureEnvironmentKey.EXEC_FIXTURE]: CliClaudeCodeExecFixtureMode.SUCCESS,
    [CliGithubCopilotExecFixtureEnvironmentKey.EXEC_FIXTURE]:
      CliGithubCopilotExecFixtureMode.SUCCESS,
    ...overrides,
  };
}

async function createAdoptionFixtureRepository(): Promise<string> {
  const repositoryRoot = await mkdtemp(resolve(tmpdir(), 'repo-ai-governor-adopt-cli-'));
  await writeFile(resolve(repositoryRoot, 'README.md'), '# Fixture Repository\n', 'utf8');
  return repositoryRoot;
}

async function createBootstrapInvokerWorkspace(): Promise<{
  invokerRoot: string;
  targetRepositoryRoot: string;
}> {
  const invokerRoot = await mkdtemp(resolve(tmpdir(), 'repo-ai-governor-adopt-invoker-'));
  await mkdir(resolve(invokerRoot, '.git'), { recursive: true });
  const targetRepositoryRoot = resolve(invokerRoot, 'target-repo');
  await mkdir(targetRepositoryRoot, { recursive: true });
  await writeFile(
    resolve(targetRepositoryRoot, 'README.md'),
    '# Target Fixture Repository\n',
    'utf8',
  );
  return {
    invokerRoot,
    targetRepositoryRoot,
  };
}

interface CliJsonOutput {
  command?: string;
  diagnostics?: {
    workspaceMode?: string;
    workspaceRoot?: string;
  };
  command_result?: {
    operation?: string;
    summary?: string;
    details?: Record<string, string>;
    checks?: Array<{ id?: string; status?: string; detail?: string }>;
    artifacts?: Array<{ id?: string; path?: string }>;
  };
}

interface BootstrapSummaryPayload {
  repoRoot?: string;
  workspaceRoot?: string;
  selectorResolution?: string;
  reentryMode?: string;
  stageOrder?: string[];
  broaderGovernanceAuditFollowUp?: string;
  bootstrapDoctorDiagnosticsPath?: string | null;
  redirectCommands?: string[];
  diffReportPath?: string | null;
  finalStatus?: string;
  stages?: Array<{ stageId?: string; status?: string; detail?: string }>;
}

interface AdoptionInstallReceiptPayload {
  appliedProfileId?: string;
  managedFileRecords?: Array<{
    relativePath?: string;
    checksumSha256?: string;
    seedChecksumSha256?: string | null;
    ownershipClass?: string;
    driftPolicy?: string;
    gitPolicy?: string;
    placeholderPolicy?: string;
  }>;
  hostTargets?: string[];
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
      const bootstrapDoctorDiagnosticsPath = bootstrapPayload.command_result?.artifacts?.find(
        (artifact) => artifact.id === 'bootstrap_doctor_diagnostics',
      )?.path;
      const bootstrapSummaryPath = bootstrapPayload.command_result?.artifacts?.find(
        (artifact) => artifact.id === 'adoption_bootstrap_summary',
      )?.path;
      const bootstrapSummary = JSON.parse(
        await readFile(String(bootstrapSummaryPath), 'utf8'),
      ) as BootstrapSummaryPayload;
      const expectedWorkspaceRoot = resolve(repositoryRoot, '.repo-ai-governor');

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
      expect(String(initManifestPath)).toContain(expectedWorkspaceRoot);
      expect(existsSync(String(bootstrapDoctorDiagnosticsPath))).toBe(true);
      expect(String(bootstrapDoctorDiagnosticsPath)).toContain(expectedWorkspaceRoot);
      expect(existsSync(String(bootstrapSummaryPath))).toBe(true);
      expect(String(bootstrapSummaryPath)).toContain(expectedWorkspaceRoot);
      expect(bootstrapSummary.repoRoot).toBe(repositoryRoot);
      expect(bootstrapSummary.workspaceRoot).toBe(expectedWorkspaceRoot);
      expect(bootstrapSummary.selectorResolution).toBe('default_built_in');
      expect(bootstrapSummary.reentryMode).toBe('fresh_install');
      expect(bootstrapSummary.stageOrder).toEqual(['init', 'doctor', 'apply', 'verify']);
      expect(bootstrapSummary.bootstrapDoctorDiagnosticsPath).toBe(
        String(bootstrapDoctorDiagnosticsPath),
      );
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

  it('bootstraps the explicit self-host profile with a transaction-consistent governor baseline', async () => {
    const repositoryRoot = await createAdoptionFixtureRepository();

    try {
      const bootstrapIo = createBufferedIo(repositoryRoot, createDeterministicCliEnvironment());
      const bootstrapExitCode = await runCli(
        [
          'node',
          'repo-ai-governor',
          '--output',
          'json',
          'adopt',
          'bootstrap',
          '--adoption-profile',
          'self-host-complete',
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
      const bootstrapSummaryPath = bootstrapPayload.command_result?.artifacts?.find(
        (artifact) => artifact.id === 'adoption_bootstrap_summary',
      )?.path;
      const bootstrapSummary = JSON.parse(
        await readFile(String(bootstrapSummaryPath), 'utf8'),
      ) as BootstrapSummaryPayload;
      const receiptPath = resolve(
        repositoryRoot,
        '.repo-ai-governor',
        'adoption',
        'installations',
        'repo-ai-governor-adoption-pack',
        'adoption-install.receipt.json',
      );
      const governorConfigPath = resolve(repositoryRoot, '.repo-ai-governor', 'governor.yaml');
      const governorConfigContent = await readFile(governorConfigPath, 'utf8');
      const governorConfigChecksum = createHash('sha256')
        .update(governorConfigContent)
        .digest('hex');
      const bootstrapReceipt = JSON.parse(
        await readFile(receiptPath, 'utf8'),
      ) as AdoptionInstallReceiptPayload;
      const governorManagedRecord = bootstrapReceipt.managedFileRecords?.find(
        (record) => record.relativePath === '.repo-ai-governor/governor.yaml',
      );

      expect(bootstrapExitCode).toBe(0);
      expect(bootstrapIo.stderrBuffer.join('')).toBe('');
      expect(bootstrapPayload.command_result?.details?.reentry_mode).toBe('fresh_install');
      expect(bootstrapSummary.reentryMode).toBe('fresh_install');
      expect(bootstrapReceipt.appliedProfileId).toBe('self-host-complete');
      expect(bootstrapReceipt.hostTargets).toEqual(['codex.project_local']);
      expect(governorManagedRecord?.checksumSha256).toBe(governorConfigChecksum);
      expect(governorConfigContent).toContain('mode: repo_local');
      expect(governorConfigContent).toContain('storeEngine: sqlite_fs');
      expect(governorConfigContent).toContain('storeRoot: context/memory');
      expect(governorConfigContent).toContain('adapters:');
      expect(governorConfigContent).toContain('roleId: planner');
      expect(governorConfigContent).toContain('primarySurface: codex');
      expect(governorConfigContent).toContain('toolId: claude-code');
    } finally {
      await rm(repositoryRoot, { recursive: true, force: true });
    }
  });

  it('lets explicit self-host bootstrap flow directly into first-run connect onboarding', async () => {
    const repositoryRoot = await createAdoptionFixtureRepository();
    const deterministicEnvironment = createDeterministicCliEnvironment();

    try {
      const bootstrapIo = createBufferedIo(repositoryRoot, deterministicEnvironment);
      const bootstrapExitCode = await runCli(
        [
          'node',
          'repo-ai-governor',
          '--output',
          'json',
          'adopt',
          'bootstrap',
          '--adoption-profile',
          'self-host-complete',
          '--repo',
          '.',
          '--hosts',
          'codex',
          '--workspace-mode',
          'repo_local',
        ],
        bootstrapIo.io,
      );

      const connectIo = createBufferedIo(repositoryRoot, deterministicEnvironment);
      const connectExitCode = await runCli(
        [
          'node',
          'repo-ai-governor',
          '--locale',
          'en-US',
          '--output',
          'json',
          'connect',
          '--preset',
          'multi-tool-default',
          '--tools',
          'codex,claude-code',
        ],
        connectIo.io,
      );
      const connectPayload = JSON.parse(connectIo.stdoutBuffer.join('')) as {
        status?: string;
        error_code?: string;
        command_result?: {
          operation?: string;
          details?: Record<string, string | boolean | null>;
        };
      };
      const persistedConfigContent = await readFile(
        resolve(repositoryRoot, '.repo-ai-governor', 'governor.yaml'),
        'utf8',
      );

      expect(bootstrapExitCode).toBe(0);
      expect(connectExitCode).toBe(0);
      expect(connectIo.stderrBuffer.join('')).toBe('');
      expect(connectPayload.status).toBe('success');
      expect(connectPayload.error_code).toBeUndefined();
      expect(connectPayload.command_result?.operation).toBe('adapter_connect');
      expect(connectPayload.command_result?.details?.candidate_apply_ready).toBe(true);
      expect(persistedConfigContent).toContain('adapters:');
      expect(persistedConfigContent).toContain('roleId: planner');
      expect(persistedConfigContent).toContain('toolId: codex');
      expect(persistedConfigContent).toContain('toolId: claude-code');

      const connectApplyIo = createBufferedIo(repositoryRoot, deterministicEnvironment);
      const connectApplyExitCode = await runCli(
        ['node', 'repo-ai-governor', '--output', 'json', 'connect', 'apply', '--latest'],
        connectApplyIo.io,
      );
      const connectApplyPayload = JSON.parse(connectApplyIo.stdoutBuffer.join('')) as {
        status?: string;
        command_result?: {
          operation?: string;
          details?: Record<string, string | boolean | null>;
        };
      };
      expect(connectApplyExitCode).toBe(0);
      expect(connectApplyPayload.status).toBe('success');
      expect(connectApplyPayload.command_result?.operation).toBe('adapter_connect_apply');
      expect(typeof connectApplyPayload.command_result?.details?.apply_receipt_path).toBe('string');

      const verifyIo = createBufferedIo(repositoryRoot, deterministicEnvironment);
      const verifyExitCode = await runCli(
        ['node', 'repo-ai-governor', '--output', 'json', 'adopt', 'verify', '--repo', '.'],
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
        activationPhase?: string;
        activationPhaseRecords?: Array<{ phaseId?: string; status?: string }>;
      };
      expect(verifyExitCode).toBe(0);
      expect(verificationSummary.activationPhase).toBe('authoring_started');
      expect(
        verificationSummary.activationPhaseRecords?.some(
          (record) => record.phaseId === 'adapter_connected' && record.status === 'completed',
        ),
      ).toBe(true);

      const diffIo = createBufferedIo(repositoryRoot, deterministicEnvironment);
      const diffExitCode = await runCli(
        ['node', 'repo-ai-governor', '--output', 'json', 'adopt', 'diff', '--repo', '.'],
        diffIo.io,
      );
      const diffPayload = JSON.parse(diffIo.stdoutBuffer.join('')) as {
        status?: string;
        error_code?: string;
        command_result?: {
          operation?: string;
          details?: Record<string, string | boolean | null>;
          artifacts?: Array<{ id?: string; path?: string }>;
        };
      };

      expect(diffExitCode).toBe(0);
      expect(diffIo.stderrBuffer.join('')).toBe('');
      expect(diffPayload.status).toBe('success');
      expect(diffPayload.error_code).toBeUndefined();
      expect(diffPayload.command_result?.operation).toBe('adoption_diff');
      const diffReportPath = diffPayload.command_result?.artifacts?.find(
        (artifact) => artifact.id === 'adoption_diff_report',
      )?.path;
      const diffReport = JSON.parse(await readFile(String(diffReportPath), 'utf8')) as {
        status?: string;
        records?: Array<unknown>;
        verificationSummary?: {
          driftDetected?: boolean;
        };
      };

      expect(diffReport.status).toBe('pass');
      expect(diffReport.records).toEqual([]);
      expect(diffReport.verificationSummary?.driftDetected).toBe(false);

      const driftedConfigContent = await readFile(
        resolve(repositoryRoot, '.repo-ai-governor', 'governor.yaml'),
        'utf8',
      );
      await writeFile(
        resolve(repositoryRoot, '.repo-ai-governor', 'governor.yaml'),
        driftedConfigContent.replace(
          'storeRoot: context/memory',
          'storeRoot: context/memory-drifted',
        ),
        'utf8',
      );

      const driftedVerifyIo = createBufferedIo(repositoryRoot, deterministicEnvironment);
      const driftedVerifyExitCode = await runCli(
        ['node', 'repo-ai-governor', '--output', 'json', 'adopt', 'verify', '--repo', '.'],
        driftedVerifyIo.io,
      );
      const driftedVerificationSummary = JSON.parse(
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
        activationPhase?: string;
        activationPhaseRecords?: Array<{
          phaseId?: string;
          status?: string;
          blockingReasons?: string[];
        }>;
      };

      expect(driftedVerifyExitCode).toBe(0);
      expect(driftedVerificationSummary.activationPhase).toBe('authoring_started');
      expect(
        driftedVerificationSummary.activationPhaseRecords?.some(
          (record) =>
            record.phaseId === 'adapter_connected' &&
            record.status === 'in_progress' &&
            record.blockingReasons?.includes('connect_apply_not_recorded'),
        ),
      ).toBe(true);
    } finally {
      await rm(repositoryRoot, { recursive: true, force: true });
    }
  });

  it('anchors bootstrap auto-bootstrap artifacts to the explicit --repo target instead of the invoker repo', async () => {
    const { invokerRoot, targetRepositoryRoot } = await createBootstrapInvokerWorkspace();
    const isolatedHome = await mkdtemp(resolve(tmpdir(), 'repo-ai-governor-home-'));

    try {
      const bootstrapIo = createBufferedIo(invokerRoot, {
        ...process.env,
        HOME: isolatedHome,
      });
      const bootstrapExitCode = await runCli(
        [
          'node',
          'repo-ai-governor',
          '--output',
          'json',
          'adopt',
          'bootstrap',
          '--repo',
          'target-repo',
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
      const bootstrapDoctorDiagnosticsPath = bootstrapPayload.command_result?.artifacts?.find(
        (artifact) => artifact.id === 'bootstrap_doctor_diagnostics',
      )?.path;
      const bootstrapSummaryPath = bootstrapPayload.command_result?.artifacts?.find(
        (artifact) => artifact.id === 'adoption_bootstrap_summary',
      )?.path;
      const bootstrapSummary = JSON.parse(
        await readFile(String(bootstrapSummaryPath), 'utf8'),
      ) as BootstrapSummaryPayload;
      const expectedWorkspaceRoot = resolve(targetRepositoryRoot, '.repo-ai-governor');

      expect(bootstrapExitCode).toBe(0);
      expect(existsSync(String(initManifestPath))).toBe(true);
      expect(existsSync(String(bootstrapDoctorDiagnosticsPath))).toBe(true);
      expect(existsSync(String(bootstrapSummaryPath))).toBe(true);
      expect(String(initManifestPath)).toContain(expectedWorkspaceRoot);
      expect(String(bootstrapDoctorDiagnosticsPath)).toContain(expectedWorkspaceRoot);
      expect(String(bootstrapSummaryPath)).toContain(expectedWorkspaceRoot);
      expect(bootstrapPayload.diagnostics?.workspaceMode).toBe('repo_local');
      expect(bootstrapPayload.diagnostics?.workspaceRoot).toBe(expectedWorkspaceRoot);
      expect(bootstrapSummary.workspaceRoot).toBe(expectedWorkspaceRoot);
      expect(existsSync(resolve(invokerRoot, '.repo-ai-governor', 'context', 'bootstrap'))).toBe(
        false,
      );
      expect(existsSync(resolve(invokerRoot, '.repo-ai-governor', 'context', 'diagnostics'))).toBe(
        false,
      );
      expect(existsSync(resolve(invokerRoot, '.repo-ai-governor', 'governor.yaml'))).toBe(false);
      expect(existsSync(resolve(isolatedHome, '.repo-ai-governor'))).toBe(false);
    } finally {
      await rm(isolatedHome, { recursive: true, force: true });
      await rm(invokerRoot, { recursive: true, force: true });
    }
  });

  it('reuses explicit profile selector resolution when the selector uniquely matches the built-in pack', async () => {
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
          'adopter-complete',
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
      const bootstrapSummaryPath = bootstrapPayload.command_result?.artifacts?.find(
        (artifact) => artifact.id === 'adoption_bootstrap_summary',
      )?.path;
      const bootstrapSummary = JSON.parse(
        await readFile(String(bootstrapSummaryPath), 'utf8'),
      ) as BootstrapSummaryPayload;

      expect(bootstrapExitCode).toBe(0);
      expect(bootstrapIo.stderrBuffer.join('')).toBe('');
      expect(bootstrapPayload.command_result?.details?.selector_resolution).toBe(
        'explicit_profile_alias',
      );
      expect(bootstrapPayload.command_result?.details?.reentry_mode).toBe('fresh_install');
      expect(bootstrapPayload.command_result?.details?.host_target_count).toBe('1');
      expect(bootstrapPayload.command_result?.details?.bootstrap_doctor_diagnostics_path).toContain(
        '.repo-ai-governor/context/diagnostics/adoption-bootstrap/doctor/bootstrap-doctor-',
      );
      expect(bootstrapSummary.selectorResolution).toBe('explicit_profile_alias');
      expect(bootstrapSummary.reentryMode).toBe('fresh_install');
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

  it('blocks bootstrap reruns when multiple adoption receipts already exist', async () => {
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

      const installationsRoot = resolve(
        repositoryRoot,
        '.repo-ai-governor',
        'adoption',
        'installations',
      );
      const primaryReceiptPath = resolve(
        installationsRoot,
        'repo-ai-governor-adoption-pack',
        'adoption-install.receipt.json',
      );
      const duplicateReceiptPath = resolve(
        installationsRoot,
        'repo-ai-governor-adoption-pack-duplicate',
        'adoption-install.receipt.json',
      );
      await mkdir(resolve(installationsRoot, 'repo-ai-governor-adoption-pack-duplicate'), {
        recursive: true,
      });
      await writeFile(duplicateReceiptPath, await readFile(primaryReceiptPath, 'utf8'), 'utf8');

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
      expect(rerunSummary.reentryMode).toBe('blocked_by_existing_receipts');
      expect(rerunSummary.redirectCommands).toEqual([
        'adopt diff',
        'adopt upgrade',
        'adopt remove',
      ]);
      expect(rerunSummary.finalStatus).toBe('fail');
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

  it('redirects mismatched existing installs back to diff and upgrade lifecycle commands', async () => {
    const repositoryRoot = await createAdoptionFixtureRepository();

    try {
      const firstRunIo = createBufferedIo(repositoryRoot);
      const firstRunExitCode = await runCli(
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
          '--hosts',
          'codex',
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
      expect(rerunSummary.finalStatus).toBe('fail');
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
      const receiptPath = resolve(
        repositoryRoot,
        '.repo-ai-governor',
        'adoption',
        'installations',
        'repo-ai-governor-adoption-pack',
        'adoption-install.receipt.json',
      );
      const selfHostReceipt = JSON.parse(
        await readFile(receiptPath, 'utf8'),
      ) as AdoptionInstallReceiptPayload;
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
      const gitignoreRecommendationPath = resolve(
        repositoryRoot,
        '.repo-ai-governor',
        'adoption',
        'installations',
        'repo-ai-governor-adoption-pack',
        'self-host.gitignore-recommendation.txt',
      );
      const governorReceiptRecord = selfHostReceipt.managedFileRecords?.find(
        (record) => record.relativePath === '.repo-ai-governor/governor.yaml',
      );
      const codeStandardsReceiptRecord = selfHostReceipt.managedFileRecords?.find(
        (record) =>
          record.relativePath ===
          '.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md',
      );
      const taskLedgerReceiptRecord = selfHostReceipt.managedFileRecords?.find(
        (record) =>
          record.relativePath === '.repo-ai-governor/context/dev/sqlite/task-ledger.sqlite',
      );
      const taskLedgerDatabase = new DatabaseSync(
        resolve(
          repositoryRoot,
          '.repo-ai-governor',
          'context',
          'dev',
          'sqlite',
          'task-ledger.sqlite',
        ),
        {
          readonly: true,
        },
      );
      expect(configContent).toContain('mode: repo_local');
      expect(codeStandardsContent).toContain('- Status: draft');
      expect(codeStandardsContent).toContain('- Placeholder Status: replace_before_execution');
      expect(maintenanceGuideContent).toContain('- Status: draft');
      expect(maintenanceGuideContent).toContain('- Placeholder Status: replace_before_execution');
      expect(existsSync(gitignoreRecommendationPath)).toBe(true);
      expect(governorReceiptRecord).toMatchObject({
        ownershipClass: 'canonical_runtime_writable',
        driftPolicy: 'provenance_only',
      });
      expect(codeStandardsReceiptRecord).toMatchObject({
        ownershipClass: 'starter_editable',
        driftPolicy: 'placeholder_aware',
        placeholderPolicy: 'adopter_owned',
      });
      expect(taskLedgerReceiptRecord).toMatchObject({
        ownershipClass: 'canonical_runtime_writable',
        gitPolicy: 'opt_in_ignore_recommendation',
      });
      expect(
        taskLedgerDatabase.prepare('SELECT COUNT(*) AS total FROM task_ledger_sources').get() as {
          total?: number;
        },
      ).toMatchObject({
        total: 1,
      });
      expect(
        taskLedgerDatabase
          .prepare(
            'SELECT source_path AS sourcePath, row_count AS rowCount FROM task_ledger_sources',
          )
          .get() as {
          sourcePath?: string;
          rowCount?: number;
        },
      ).toMatchObject({
        sourcePath: expect.stringContaining(
          '.repo-ai-governor/context/dev/project-template/sprint-template/tasks/tasks.csv',
        ),
        rowCount: 1,
      });
      expect(
        taskLedgerDatabase
          .prepare(
            'SELECT task_id AS taskId, project AS projectId, sprint AS sprintId, status AS taskStatus FROM task_ledger_rows',
          )
          .get() as {
          taskId?: string;
          projectId?: string;
          sprintId?: string;
          taskStatus?: string;
        },
      ).toMatchObject({
        taskId: 'TK-001',
        projectId: 'project-template',
        sprintId: 'sprint-template',
        taskStatus: 'planned',
      });
      taskLedgerDatabase.close();

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
        activationPhase?: string;
        activationPhaseStatus?: string;
        activationPhaseRecords?: Array<{
          phaseId: string;
          status: string;
          placeholderPaths?: string[];
          nextActions?: string[];
        }>;
        operatorNextActions?: string[];
        checks: Array<{ checkId: string; status: string; detail: string }>;
      };
      const templateSeededReadinessCheck = verificationSummary.checks.find(
        (check) => check.checkId === 'self-host-readiness:template_seeded',
      );
      const authoringStartedReadinessCheck = verificationSummary.checks.find(
        (check) => check.checkId === 'self-host-readiness:authoring_started',
      );
      const adapterConnectedReadinessCheck = verificationSummary.checks.find(
        (check) => check.checkId === 'self-host-readiness:adapter_connected',
      );
      const executionReadyReadinessCheck = verificationSummary.checks.find(
        (check) => check.checkId === 'self-host-readiness:execution_ready',
      );
      const executionPreflightCheck = verificationSummary.checks.find(
        (check) => check.checkId === 'self-host-execution-preflight',
      );

      expect(verifyExitCode).toBe(0);
      expect(verifyIo.stderrBuffer.join('')).toBe('');
      expect(verifyIo.stdoutBuffer.join('')).toContain('adoption_verify');
      expect(verificationSummary.status).toBe('warn');
      expect(verificationSummary.activationPhase).toBe('authoring_started');
      expect(verificationSummary.activationPhaseStatus).toBe('in_progress');
      expect(templateSeededReadinessCheck).toMatchObject({
        status: 'pass',
      });
      expect(authoringStartedReadinessCheck).toMatchObject({
        status: 'warn',
      });
      expect(authoringStartedReadinessCheck?.detail).toContain(
        '.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md',
      );
      expect(adapterConnectedReadinessCheck).toMatchObject({
        status: 'warn',
      });
      expect(adapterConnectedReadinessCheck?.detail).toContain('connect_apply_not_recorded');
      expect(executionReadyReadinessCheck).toMatchObject({
        status: 'warn',
      });
      expect(executionPreflightCheck).toMatchObject({
        status: 'warn',
      });
      expect(executionPreflightCheck?.detail).toContain('execution_preflight_signal=blocked');
      expect(
        verificationSummary.activationPhaseRecords?.some(
          (record) => record.phaseId === 'adapter_connected' && record.status === 'in_progress',
        ),
      ).toBe(true);
      expect(
        verificationSummary.operatorNextActions?.some((action) =>
          action.includes('connect apply --latest'),
        ),
      ).toBe(true);
      expect(verificationSummary.operatorNextActions?.[0]).toContain(
        'repo-local self-host starter surfaces',
      );
      expect(verificationSummary.operatorNextActions?.[0]).toContain(
        '.repo-ai-governor/context/dev/project-template/plan.md',
      );
      expect(verificationSummary.operatorNextActions?.[0]).toContain(
        'activationPhaseRecords[].placeholderPaths',
      );
      expect(
        verificationSummary.operatorNextActions?.some((action) =>
          action.includes('canonical readiness verdict'),
        ),
      ).toBe(true);
      expect(
        verificationSummary.operatorNextActions?.some((action) =>
          action.includes('run --dry-run --trace'),
        ),
      ).toBe(true);

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
      const doctorTemplateSeededReadinessCheck = doctorPayload.command_result?.checks?.find(
        (check) => check.id === 'self-host-readiness:template_seeded',
      );
      const doctorAuthoringStartedReadinessCheck = doctorPayload.command_result?.checks?.find(
        (check) => check.id === 'self-host-readiness:authoring_started',
      );
      const doctorAdapterConnectedReadinessCheck = doctorPayload.command_result?.checks?.find(
        (check) => check.id === 'self-host-readiness:adapter_connected',
      );
      const doctorExecutionReadyReadinessCheck = doctorPayload.command_result?.checks?.find(
        (check) => check.id === 'self-host-readiness:execution_ready',
      );
      const doctorExecutionPreflightCheck = doctorPayload.command_result?.checks?.find(
        (check) => check.id === 'self-host-execution-preflight',
      );

      expect(doctorExitCode).toBe(0);
      expect(doctorIo.stderrBuffer.join('')).toBe('');
      expect(doctorPayload.command).toBe('doctor');
      expect(doctorTemplateSeededReadinessCheck).toMatchObject({
        status: 'pass',
      });
      expect(doctorAuthoringStartedReadinessCheck).toMatchObject({
        status: 'warn',
      });
      expect(doctorAuthoringStartedReadinessCheck?.detail).toContain('reflected_from=adopt_verify');
      expect(doctorAdapterConnectedReadinessCheck).toMatchObject({
        status: 'warn',
      });
      expect(doctorExecutionReadyReadinessCheck).toMatchObject({
        status: 'warn',
      });
      expect(doctorExecutionPreflightCheck).toMatchObject({
        status: 'warn',
      });
      expect(doctorExecutionPreflightCheck?.detail).toContain('reflected_from=adopt_verify');
      expect(doctorExecutionPreflightCheck?.detail).toContain('blocked_groups=');
      expect(doctorExecutionPreflightCheck?.detail).toContain('authoring_started');
      expect(doctorExecutionPreflightCheck?.detail).toContain('execution_ready');
      expect(doctorExecutionPreflightCheck?.detail).toContain(
        'placeholder_paths=.repo-ai-governor/context/completed-streams-history.md',
      );
      expect(
        doctorDiagnosticsPayload.checks?.some(
          (check) =>
            check.id === 'self-host-readiness:authoring_started' && check.status === 'warn',
        ),
      ).toBe(true);
      expect(
        doctorDiagnosticsPayload.checks?.some(
          (check) => check.id === 'self-host-execution-preflight' && check.status === 'warn',
        ),
      ).toBe(true);

      const checkIo = createBufferedIo(repositoryRoot);
      const checkExitCode = await runCli(
        ['node', 'repo-ai-governor', '--output', 'json', 'check'],
        checkIo.io,
      );
      const checkPayload = JSON.parse(checkIo.stdoutBuffer.join('')) as {
        command?: string;
        command_result?: {
          checks?: Array<{ id?: string; status?: string; detail?: string }>;
        };
      };
      const checkActivationSummary = checkPayload.command_result?.checks?.find(
        (check) => check.id === 'self-host-activation-summary',
      );
      const checkAuthoringStarted = checkPayload.command_result?.checks?.find(
        (check) => check.id === 'self-host-check:authoring_started',
      );

      expect(checkExitCode).toBe(0);
      expect(checkActivationSummary).toMatchObject({
        status: 'warn',
      });
      expect(checkActivationSummary?.detail).toContain('consumed_from=adopt_verify');
      expect(checkActivationSummary?.detail).toContain('当前 self-host activation 摘要');
      expect(checkAuthoringStarted).toMatchObject({
        status: 'warn',
      });
      expect(checkAuthoringStarted?.detail).toContain('broader_governance_audit=phase_blocked');
      expect(checkAuthoringStarted?.detail).toContain('Self-host readiness 阶段');

      const localizedCheckIo = createBufferedIo(repositoryRoot);
      const localizedCheckExitCode = await runCli(
        ['node', 'repo-ai-governor', '--locale', 'zh-CN', '--output', 'json', 'check'],
        localizedCheckIo.io,
      );
      const localizedCheckPayload = JSON.parse(localizedCheckIo.stdoutBuffer.join('')) as {
        command_result?: {
          summary?: string;
          checks?: Array<{ id?: string; status?: string; detail?: string }>;
        };
      };
      const localizedConfigSourceCheck = localizedCheckPayload.command_result?.checks?.find(
        (check) => check.id === 'config_source',
      );
      const localizedCheckNextActions =
        localizedCheckPayload.command_result?.checks?.filter(
          (check) => check.id === 'self-host-check-next-action',
        ) ?? [];
      expect(localizedCheckExitCode).toBe(0);
      expect(localizedCheckPayload.command_result?.summary).toContain('治理检查完成：通过=');
      expect(localizedConfigSourceCheck?.detail).toBe('已加载仓库配置');
      expect(
        localizedCheckNextActions.some(
          (check) =>
            check.detail?.includes(
              '运行 `repo-ai-governor connect --preset multi-tool-default --tools codex,claude-code`',
            ) ||
            check.detail?.includes('请先完成') ||
            check.detail?.includes('请先 apply 一份 connect candidate') ||
            check.detail?.includes('请重新执行 `repo-ai-governor adopt verify --repo .`'),
        ),
      ).toBe(true);
    } finally {
      await rm(repositoryRoot, { recursive: true, force: true });
    }
  });

  it('localizes default-config and missing-script check details for zh-CN output', async () => {
    const repositoryRoot = await createAdoptionFixtureRepository();

    try {
      const checkIo = createBufferedIo(repositoryRoot, createDeterministicCliEnvironment());
      const checkExitCode = await runCli(
        ['node', 'repo-ai-governor', '--locale', 'zh-CN', '--output', 'json', 'check'],
        checkIo.io,
      );
      const checkPayload = JSON.parse(checkIo.stdoutBuffer.join('')) as {
        command_result?: {
          summary?: string;
          checks?: Array<{ id?: string; status?: string; detail?: string }>;
        };
      };
      const configSourceCheck = checkPayload.command_result?.checks?.find(
        (check) => check.id === 'config_source',
      );
      const missingScriptChecks =
        checkPayload.command_result?.checks?.filter(
          (check) =>
            typeof check.id === 'string' &&
            check.id.startsWith('check-') &&
            check.detail === '未找到治理脚本',
        ) ?? [];

      expect(checkExitCode).toBe(0);
      expect(checkPayload.command_result?.summary).toContain('治理检查完成：通过=');
      expect(configSourceCheck?.detail).toBe('当前使用默认配置；如需显式配置请运行 `init`。');
      expect(missingScriptChecks.length).toBeGreaterThan(0);
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

  it('fails check when canonical self-host verify already recorded fail rows', async () => {
    const repositoryRoot = await createAdoptionFixtureRepository();

    try {
      const applyIo = createBufferedIo(repositoryRoot, createDeterministicCliEnvironment());
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

      await rm(
        resolve(
          repositoryRoot,
          '.repo-ai-governor',
          'normative_knowledge_sources',
          'governance',
          'code_standards.md',
        ),
        { force: true },
      );

      const verifyIo = createBufferedIo(repositoryRoot, createDeterministicCliEnvironment());
      const verifyExitCode = await runCli(
        ['node', 'repo-ai-governor', 'adopt', 'verify', '--repo', '.'],
        verifyIo.io,
      );
      const checkIo = createBufferedIo(repositoryRoot, createDeterministicCliEnvironment());
      const checkExitCode = await runCli(
        ['node', 'repo-ai-governor', '--output', 'json', 'check'],
        checkIo.io,
      );
      const checkErrorPayload = JSON.parse(checkIo.stderrBuffer.join('')) as {
        status?: string;
        error_code?: string;
        message?: string;
      };

      expect(verifyExitCode).toBe(1);
      expect(checkExitCode).toBe(1);
      expect(checkIo.stdoutBuffer.join('')).toBe('');
      expect(checkErrorPayload.status).toBe('error');
      expect(checkErrorPayload.error_code).toBe('UNKNOWN');
      expect(checkErrorPayload.message).toContain(
        'managed:.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md',
      );

      const localizedCheckIo = createBufferedIo(
        repositoryRoot,
        createDeterministicCliEnvironment(),
      );
      const localizedCheckExitCode = await runCli(
        ['node', 'repo-ai-governor', '--locale', 'zh-CN', '--output', 'json', 'check'],
        localizedCheckIo.io,
      );
      const localizedCheckErrorPayload = JSON.parse(localizedCheckIo.stderrBuffer.join('')) as {
        status?: string;
        error_code?: string;
        message?: string;
      };

      expect(localizedCheckExitCode).toBe(1);
      expect(localizedCheckIo.stdoutBuffer.join('')).toBe('');
      expect(localizedCheckErrorPayload.status).toBe('error');
      expect(localizedCheckErrorPayload.error_code).toBe('UNKNOWN');
      expect(localizedCheckErrorPayload.message).toContain('治理检查失败：');
      expect(localizedCheckErrorPayload.message).toContain(
        'managed:.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md',
      );
    } finally {
      await rm(repositoryRoot, { recursive: true, force: true });
    }
  });

  it('does not treat starter-editable or canonical-runtime-writable self-host surfaces as install drift', async () => {
    const repositoryRoot = await createAdoptionFixtureRepository();

    try {
      const applyIo = createBufferedIo(repositoryRoot, createDeterministicCliEnvironment());
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

      await writeFile(
        resolve(
          repositoryRoot,
          '.repo-ai-governor',
          'normative_knowledge_sources',
          'governance',
          'code_standards.md',
        ),
        '# Code Standards\n\nEdited by adopter.\n',
        'utf8',
      );
      const seededGovernorConfigPath = resolve(
        repositoryRoot,
        '.repo-ai-governor',
        'governor.yaml',
      );
      const seededGovernorConfigContent = await readFile(seededGovernorConfigPath, 'utf8');
      await writeFile(
        seededGovernorConfigPath,
        seededGovernorConfigContent.replace(
          'storeRoot: context/memory',
          'storeRoot: context/memory-edited',
        ),
        'utf8',
      );

      const diffIo = createBufferedIo(repositoryRoot, createDeterministicCliEnvironment());
      const diffExitCode = await runCli(
        ['node', 'repo-ai-governor', '--output', 'json', 'adopt', 'diff', '--repo', '.'],
        diffIo.io,
      );
      expect(diffExitCode).toBe(0);
      if (diffExitCode !== 0) {
        expect(diffIo.stderrBuffer.join('')).toBe('');
        return;
      }
      expect(diffIo.stderrBuffer.join('')).toBe('');
      const diffPayload = JSON.parse(diffIo.stdoutBuffer.join('')) as {
        status?: string;
        command_result?: {
          artifacts?: Array<{ id?: string; path?: string }>;
        };
      };
      const diffReportPath = diffPayload.command_result?.artifacts?.find(
        (artifact) => artifact.id === 'adoption_diff_report',
      )?.path;
      const diffReport = JSON.parse(await readFile(String(diffReportPath), 'utf8')) as {
        records?: Array<unknown>;
      };
      expect(diffPayload.status).toBe('success');
      expect(diffReport.records).toEqual([]);
    } finally {
      await rm(repositoryRoot, { recursive: true, force: true });
    }
  });

  it('preserves starter-editable and canonical-runtime-writable self-host edits during upgrade', async () => {
    const repositoryRoot = await createAdoptionFixtureRepository();

    try {
      const applyIo = createBufferedIo(repositoryRoot, createDeterministicCliEnvironment());
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

      const codeStandardsPath = resolve(
        repositoryRoot,
        '.repo-ai-governor',
        'normative_knowledge_sources',
        'governance',
        'code_standards.md',
      );
      const editedCodeStandardsContent = '# Code Standards\n\nEdited by adopter before upgrade.\n';
      await writeFile(codeStandardsPath, editedCodeStandardsContent, 'utf8');

      const governorConfigPath = resolve(repositoryRoot, '.repo-ai-governor', 'governor.yaml');
      const seededGovernorConfigContent = await readFile(governorConfigPath, 'utf8');
      const editedGovernorConfigContent = seededGovernorConfigContent.replace(
        'storeRoot: context/memory',
        'storeRoot: context/memory-edited',
      );
      await writeFile(governorConfigPath, editedGovernorConfigContent, 'utf8');

      const upgradeIo = createBufferedIo(repositoryRoot, createDeterministicCliEnvironment());
      const upgradeExitCode = await runCli(
        ['node', 'repo-ai-governor', 'adopt', 'upgrade', 'adopter-complete', '--repo', '.'],
        upgradeIo.io,
      );

      expect(upgradeExitCode).toBe(0);
      expect(upgradeIo.stderrBuffer.join('')).toBe('');
      expect(upgradeIo.stdoutBuffer.join('')).toContain('adoption_upgrade');
      expect(await readFile(codeStandardsPath, 'utf8')).toBe(editedCodeStandardsContent);
      expect(await readFile(governorConfigPath, 'utf8')).toBe(editedGovernorConfigContent);

      const diffIo = createBufferedIo(repositoryRoot, createDeterministicCliEnvironment());
      const diffExitCode = await runCli(
        ['node', 'repo-ai-governor', '--output', 'json', 'adopt', 'diff', '--repo', '.'],
        diffIo.io,
      );

      expect(diffExitCode).toBe(0);
      expect(diffIo.stderrBuffer.join('')).toBe('');
      const diffPayload = JSON.parse(diffIo.stdoutBuffer.join('')) as {
        status?: string;
        command_result?: {
          artifacts?: Array<{ id?: string; path?: string }>;
        };
      };
      const diffReportPath = diffPayload.command_result?.artifacts?.find(
        (artifact) => artifact.id === 'adoption_diff_report',
      )?.path;
      const diffReport = JSON.parse(await readFile(String(diffReportPath), 'utf8')) as {
        records?: Array<unknown>;
      };

      expect(diffPayload.status).toBe('success');
      expect(diffReport.records).toEqual([]);

      const receiptPath = resolve(
        repositoryRoot,
        '.repo-ai-governor',
        'adoption',
        'installations',
        'repo-ai-governor-adoption-pack',
        'adoption-install.receipt.json',
      );
      const receipt = JSON.parse(
        await readFile(receiptPath, 'utf8'),
      ) as AdoptionInstallReceiptPayload;
      const codeStandardsRecord = receipt.managedFileRecords?.find(
        (record) =>
          record.relativePath ===
          '.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md',
      );
      const governorConfigRecord = receipt.managedFileRecords?.find(
        (record) => record.relativePath === '.repo-ai-governor/governor.yaml',
      );

      expect(codeStandardsRecord?.ownershipClass).toBe('starter_editable');
      expect(governorConfigRecord?.ownershipClass).toBe('canonical_runtime_writable');
    } finally {
      await rm(repositoryRoot, { recursive: true, force: true });
    }
  });

  it('preserves canonical-runtime-writable self-host edits during force upgrade', async () => {
    const repositoryRoot = await createAdoptionFixtureRepository();

    try {
      const applyIo = createBufferedIo(repositoryRoot, createDeterministicCliEnvironment());
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

      const codeStandardsPath = resolve(
        repositoryRoot,
        '.repo-ai-governor',
        'normative_knowledge_sources',
        'governance',
        'code_standards.md',
      );
      const editedCodeStandardsContent =
        '# Code Standards\n\nEdited by adopter before force upgrade.\n';
      await writeFile(codeStandardsPath, editedCodeStandardsContent, 'utf8');

      const governorConfigPath = resolve(repositoryRoot, '.repo-ai-governor', 'governor.yaml');
      const seededGovernorConfigContent = await readFile(governorConfigPath, 'utf8');
      const editedGovernorConfigContent = seededGovernorConfigContent.replace(
        'storeRoot: context/memory',
        'storeRoot: context/memory-edited',
      );
      await writeFile(governorConfigPath, editedGovernorConfigContent, 'utf8');

      const forceUpgradeIo = createBufferedIo(repositoryRoot, createDeterministicCliEnvironment());
      const forceUpgradeExitCode = await runCli(
        [
          'node',
          'repo-ai-governor',
          'adopt',
          'upgrade',
          'adopter-complete',
          '--repo',
          '.',
          '--force',
        ],
        forceUpgradeIo.io,
      );

      expect(forceUpgradeExitCode).toBe(0);
      expect(forceUpgradeIo.stderrBuffer.join('')).toBe('');
      expect(forceUpgradeIo.stdoutBuffer.join('')).toContain('adoption_upgrade');
      expect(await readFile(codeStandardsPath, 'utf8')).toBe(editedCodeStandardsContent);
      expect(await readFile(governorConfigPath, 'utf8')).toBe(editedGovernorConfigContent);
    } finally {
      await rm(repositoryRoot, { recursive: true, force: true });
    }
  });

  it('surfaces missing self-host starter and canonical surfaces as drift and blocks silent reseed', async () => {
    const repositoryRoot = await createAdoptionFixtureRepository();

    try {
      const applyIo = createBufferedIo(repositoryRoot, createDeterministicCliEnvironment());
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

      const codeStandardsPath = resolve(
        repositoryRoot,
        '.repo-ai-governor',
        'normative_knowledge_sources',
        'governance',
        'code_standards.md',
      );
      const governorConfigPath = resolve(repositoryRoot, '.repo-ai-governor', 'governor.yaml');
      await rm(codeStandardsPath, { force: true });
      await rm(governorConfigPath, { force: true });

      const diffIo = createBufferedIo(repositoryRoot, createDeterministicCliEnvironment());
      const diffExitCode = await runCli(
        ['node', 'repo-ai-governor', '--output', 'json', 'adopt', 'diff', '--repo', '.'],
        diffIo.io,
      );
      const diffPayload = JSON.parse(diffIo.stderrBuffer.join('')) as {
        error_code?: string;
      };
      const diffReportPath = resolve(
        repositoryRoot,
        '.repo-ai-governor',
        'adoption',
        'installations',
        'repo-ai-governor-adoption-pack',
        'adoption-diff.report.json',
      );
      const diffReport = JSON.parse(await readFile(diffReportPath, 'utf8')) as {
        status?: string;
        records?: Array<{
          relativePath?: string;
          diffKind?: string;
          ownershipClass?: string;
          driftPolicy?: string;
        }>;
        verificationSummary?: {
          driftDetected?: boolean;
        };
      };

      expect(diffExitCode).toBe(1);
      expect(diffPayload.error_code).toBe('STANDARDS_PACK_INVALID');
      expect(existsSync(diffReportPath)).toBe(true);
      expect(diffReport.status).toBe('fail');
      expect(diffReport.records).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            relativePath:
              '.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md',
            diffKind: 'missing',
            ownershipClass: 'starter_editable',
            driftPolicy: 'placeholder_aware',
          }),
          expect.objectContaining({
            relativePath: '.repo-ai-governor/governor.yaml',
            diffKind: 'missing',
            ownershipClass: 'canonical_runtime_writable',
            driftPolicy: 'provenance_only',
          }),
        ]),
      );
      expect(diffReport.verificationSummary?.driftDetected).toBe(true);

      const verifyIo = createBufferedIo(repositoryRoot, createDeterministicCliEnvironment());
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
        status?: string;
        checks?: Array<{ checkId?: string; status?: string; actualValue?: string }>;
      };

      expect(verifyExitCode).toBe(1);
      expect(verifyIo.stderrBuffer.join('')).toContain('STANDARDS_PACK_INVALID');
      expect(verificationSummary.status).toBe('fail');
      expect(verificationSummary.checks).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            checkId:
              'managed:.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md',
            status: 'fail',
            actualValue: 'missing',
          }),
          expect.objectContaining({
            checkId: 'managed:.repo-ai-governor/governor.yaml',
            status: 'fail',
            actualValue: 'missing',
          }),
        ]),
      );

      const upgradeIo = createBufferedIo(repositoryRoot, createDeterministicCliEnvironment());
      const upgradeExitCode = await runCli(
        ['node', 'repo-ai-governor', 'adopt', 'upgrade', 'adopter-complete', '--repo', '.'],
        upgradeIo.io,
      );

      expect(upgradeExitCode).toBe(1);
      expect(upgradeIo.stderrBuffer.join('')).toContain('governor.yaml');
      expect(existsSync(codeStandardsPath)).toBe(false);
      expect(existsSync(governorConfigPath)).toBe(false);

      const forceUpgradeIo = createBufferedIo(repositoryRoot, createDeterministicCliEnvironment());
      const forceUpgradeExitCode = await runCli(
        [
          'node',
          'repo-ai-governor',
          'adopt',
          'upgrade',
          'adopter-complete',
          '--repo',
          '.',
          '--force',
        ],
        forceUpgradeIo.io,
      );

      expect(forceUpgradeExitCode).toBe(1);
      expect(forceUpgradeIo.stderrBuffer.join('')).toContain('governor.yaml');
      expect(existsSync(codeStandardsPath)).toBe(false);
      expect(existsSync(governorConfigPath)).toBe(false);
    } finally {
      await rm(repositoryRoot, { recursive: true, force: true });
    }
  });

  it('fails closed when self-host remove would delete canonical runtime truth', async () => {
    const repositoryRoot = await createAdoptionFixtureRepository();

    try {
      const applyIo = createBufferedIo(repositoryRoot, createDeterministicCliEnvironment());
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

      const removeIo = createBufferedIo(repositoryRoot, createDeterministicCliEnvironment());
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
      expect(removeIo.stderrBuffer.join('')).toContain('canonical_runtime_writable');
      expect(existsSync(resolve(repositoryRoot, '.repo-ai-governor', 'governor.yaml'))).toBe(true);
    } finally {
      await rm(repositoryRoot, { recursive: true, force: true });
    }
  });
});
