import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

interface PackageJsonShape {
  scripts: Record<string, string>;
}

interface ReleasePolicyChannel {
  name: string;
  requiredChecks: string[];
}

interface ReleasePolicyShape {
  channels: ReleasePolicyChannel[];
  rollbackRehearsal: {
    entryCommand: string;
  };
  gaCandidateUnifiedGate: {
    entryCommand: string;
    requiredCheckGroups: string[];
  };
}

/**
 * Reads one JSON file from repository root.
 * @param relativePath Repository-relative file path.
 * @returns Parsed JSON payload.
 */
function readJsonFile<T>(relativePath: string): T {
  const absolutePath = resolve(process.cwd(), relativePath);
  return JSON.parse(readFileSync(absolutePath, 'utf8')) as T;
}

/**
 * Collects the verification commands that release notes should surface.
 * @param policyConfig Parsed release policy config.
 * @returns Ordered unique command list.
 */
function collectExpectedVerificationCommands(policyConfig: ReleasePolicyShape): string[] {
  const commands: string[] = [];
  const seenCommands = new Set<string>();
  const appendCommand = (command: string) => {
    if (seenCommands.has(command)) {
      return;
    }
    seenCommands.add(command);
    commands.push(command);
  };

  for (const channel of policyConfig.channels) {
    for (const requiredCheck of channel.requiredChecks) {
      appendCommand(requiredCheck);
    }
  }

  appendCommand(policyConfig.rollbackRehearsal.entryCommand);
  appendCommand(policyConfig.gaCandidateUnifiedGate.entryCommand);
  return commands;
}

describe('release governance wiring', () => {
  it('routes release:ga-check through the unified GA gate while keeping a non-recursive entry check', () => {
    const packageJson = readJsonFile<PackageJsonShape>('package.json');
    const policyConfig = readJsonFile<ReleasePolicyShape>(
      'scripts/release/release-governance-policy.json',
    );

    expect(packageJson.scripts['release:ga-entry-check']).toContain('release:candidate');
    expect(packageJson.scripts['release:ga-check']).toContain('release:ga-candidate-unified-gate');
    expect(packageJson.scripts['release:ga-check']).not.toBe(
      packageJson.scripts['release:ga-entry-check'],
    );
    expect(policyConfig.gaCandidateUnifiedGate.requiredCheckGroups).toContain(
      'release-ga-entry-check',
    );
    expect(policyConfig.gaCandidateUnifiedGate.requiredCheckGroups).not.toContain(
      'release-ga-check',
    );
  });

  it('renders verification commands from policy channels and GA gate config', () => {
    const policyConfig = readJsonFile<ReleasePolicyShape>(
      'scripts/release/release-governance-policy.json',
    );
    const outputPath = resolve(process.cwd(), '.tmp/test-release-governance-wiring-notes.md');

    try {
      const result = spawnSync(
        process.execPath,
        ['scripts/release/render-release-notes.js', '--output', outputPath],
        {
          cwd: process.cwd(),
          encoding: 'utf8',
        },
      );

      expect(result.status).toBe(0);
      expect(existsSync(outputPath)).toBe(true);

      const markdown = readFileSync(outputPath, 'utf8');
      const expectedCommands = collectExpectedVerificationCommands(policyConfig);

      for (const expectedCommand of expectedCommands) {
        expect(markdown).toContain(`- \`${expectedCommand}\``);
      }
    } finally {
      rmSync(outputPath, { force: true });
    }
  });
});
