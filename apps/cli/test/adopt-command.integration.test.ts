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

      expect(verifyExitCode).toBe(0);
      expect(verifyIo.stderrBuffer.join('')).toBe('');
      expect(verifyIo.stdoutBuffer.join('')).toContain('adoption_verify');

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

      const configContent = await readFile(
        resolve(repositoryRoot, '.repo-ai-governor', 'governor.yaml'),
        'utf8',
      );
      expect(configContent).toContain('mode: repo_local');

      const verifyIo = createBufferedIo(repositoryRoot);
      const verifyExitCode = await runCli(
        ['node', 'repo-ai-governor', 'adopt', 'verify', '--repo', '.'],
        verifyIo.io,
      );

      expect(verifyExitCode).toBe(0);
      expect(verifyIo.stderrBuffer.join('')).toBe('');
      expect(verifyIo.stdoutBuffer.join('')).toContain('adoption_verify');
    } finally {
      await rm(repositoryRoot, { recursive: true, force: true });
    }
  });
});
