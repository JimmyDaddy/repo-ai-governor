import { execFileSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import { OrchestrationServiceLifecycleStatus } from '@repo-ai-governor/orchestration-service-client';

import {
  assertReadySidecarSmoke,
  assertSupportedCliBackedSmoke,
  extractVsix,
  resolveCliBackedSmokeWorkspaceRoot,
  verifySymlinkPayload,
} from '../scripts/release/verify-vscode-extension-distribution.js';

function countDoctorArtifacts(rootPath: string): number {
  if (!existsSync(rootPath)) {
    return 0;
  }

  const pendingDirectories = [rootPath];
  let artifactCount = 0;

  while (pendingDirectories.length > 0) {
    const currentDirectory = pendingDirectories.pop();
    if (!currentDirectory || !existsSync(currentDirectory)) {
      continue;
    }

    for (const entry of readdirSync(currentDirectory, { withFileTypes: true })) {
      const entryPath = resolve(currentDirectory, entry.name);
      if (entry.isDirectory()) {
        pendingDirectories.push(entryPath);
        continue;
      }

      if (entry.isFile() && /^doctor-\d+\.json$/u.test(entry.name)) {
        artifactCount += 1;
      }
    }
  }

  return artifactCount;
}

function readLayeredLogValue(
  layeredLogs: { detailed?: string[] } | undefined,
  key: string,
): string | null {
  const matchedLine = layeredLogs?.detailed?.find((line) => line.startsWith(`${key}=`));
  if (!matchedLine) {
    return null;
  }

  const value = matchedLine.slice(key.length + 1).trim();
  return value.length > 0 ? value : null;
}

describe('release vscode extension distribution sidecar readiness gate', () => {
  it('accepts ready lifecycle smokes', () => {
    expect(() =>
      assertReadySidecarSmoke('packaged root', {
        serviceLifecycle: OrchestrationServiceLifecycleStatus.READY,
        queueGeneratedAt: '2026-04-18T00:00:00.000Z',
      }),
    ).not.toThrow();
  });

  it.each([
    OrchestrationServiceLifecycleStatus.STARTING,
    OrchestrationServiceLifecycleStatus.STOPPING,
    OrchestrationServiceLifecycleStatus.STOPPED,
  ])('rejects %s lifecycle results', (serviceLifecycle) => {
    expect(() =>
      assertReadySidecarSmoke('packaged root', {
        serviceLifecycle,
        queueGeneratedAt: '2026-04-18T00:00:00.000Z',
      }),
    ).toThrow(
      `packaged root sidecar smoke must report lifecycle "${OrchestrationServiceLifecycleStatus.READY}" before distribution verification can pass (received "${serviceLifecycle}")`,
    );
  });
});

describe('release vscode extension distribution cli-backed readiness gate', () => {
  it('accepts ready cli-backed smokes', () => {
    expect(() =>
      assertSupportedCliBackedSmoke('packaged root', {
        smokeWorkspaceRoot:
          '/tmp/repo-ai-governor-release-verify/cli-backed-smoke-workspaces/packaged-root',
        secureAuthoringDegradedReason: null,
        doctorOperation: 'env_doctor',
        doctorSummary: 'Doctor completed.',
        doctorDiagnosticsPath:
          '/tmp/repo-ai-governor-release-verify/cli-backed-smoke-workspaces/packaged-root/context/diagnostics/doctor/doctor-1.json',
        resolvedWorkspaceRoot:
          '/tmp/repo-ai-governor-release-verify/cli-backed-smoke-workspaces/packaged-root',
      }),
    ).not.toThrow();
  });

  it('rejects degraded secure-authoring results', () => {
    expect(() =>
      assertSupportedCliBackedSmoke('packaged root', {
        smokeWorkspaceRoot:
          '/tmp/repo-ai-governor-release-verify/cli-backed-smoke-workspaces/packaged-root',
        secureAuthoringDegradedReason: 'The embedded Repo AI Governor CLI dependency is missing.',
        doctorOperation: 'env_doctor',
        doctorSummary: 'Doctor completed.',
        doctorDiagnosticsPath:
          '/tmp/repo-ai-governor-release-verify/cli-backed-smoke-workspaces/packaged-root/context/diagnostics/doctor/doctor-1.json',
        resolvedWorkspaceRoot:
          '/tmp/repo-ai-governor-release-verify/cli-backed-smoke-workspaces/packaged-root',
      }),
    ).toThrow('packaged root secure-authoring smoke must not degrade');
  });

  it('rejects empty doctor summaries', () => {
    expect(() =>
      assertSupportedCliBackedSmoke('packaged root', {
        smokeWorkspaceRoot:
          '/tmp/repo-ai-governor-release-verify/cli-backed-smoke-workspaces/packaged-root',
        secureAuthoringDegradedReason: null,
        doctorOperation: 'env_doctor',
        doctorSummary: '',
        doctorDiagnosticsPath:
          '/tmp/repo-ai-governor-release-verify/cli-backed-smoke-workspaces/packaged-root/context/diagnostics/doctor/doctor-1.json',
        resolvedWorkspaceRoot:
          '/tmp/repo-ai-governor-release-verify/cli-backed-smoke-workspaces/packaged-root',
      }),
    ).toThrow('packaged root doctor smoke must return a non-empty summary');
  });

  it('rejects cli-backed smokes when workspace isolation escapes the scratch root', () => {
    expect(() =>
      assertSupportedCliBackedSmoke('packaged root', {
        smokeWorkspaceRoot:
          '/tmp/repo-ai-governor-release-verify/cli-backed-smoke-workspaces/packaged-root',
        secureAuthoringDegradedReason: null,
        doctorOperation: 'env_doctor',
        doctorSummary: 'Doctor completed.',
        doctorDiagnosticsPath:
          '/Users/test/.repo-ai-governor/workspaces/abcd1234/.repo-ai-governor/context/diagnostics/doctor/doctor-1.json',
        resolvedWorkspaceRoot:
          '/Users/test/.repo-ai-governor/workspaces/abcd1234/.repo-ai-governor',
      }),
    ).toThrow('packaged root doctor smoke must resolve workspace_root to');
  });

  it('keeps warn-state doctor totals as evidence instead of treating them as a hard gate', () => {
    expect(() =>
      assertSupportedCliBackedSmoke('packaged root', {
        smokeWorkspaceRoot:
          '/tmp/repo-ai-governor-release-verify/cli-backed-smoke-workspaces/packaged-root',
        secureAuthoringDegradedReason: null,
        doctorOperation: 'env_doctor',
        doctorSummary: 'Doctor completed with attach_mode=read_write.',
        doctorDiagnosticsPath:
          '/tmp/repo-ai-governor-release-verify/cli-backed-smoke-workspaces/packaged-root/context/diagnostics/doctor/doctor-1.json',
        resolvedWorkspaceRoot:
          '/tmp/repo-ai-governor-release-verify/cli-backed-smoke-workspaces/packaged-root',
        doctorCheckTotals: {
          pass: 12,
          warn: 6,
          fail: 0,
        },
      }),
    ).not.toThrow();
  });

  it('resolves cli-backed smoke workspaces under the packaging scratch root', () => {
    const workingRoot = '/tmp/repo-ai-governor-release-verify';

    expect(resolveCliBackedSmokeWorkspaceRoot(workingRoot, 'packaged-root')).toBe(
      '/tmp/repo-ai-governor-release-verify/cli-backed-smoke-workspaces/packaged-root',
    );
    expect(resolveCliBackedSmokeWorkspaceRoot(workingRoot, 'installed vsix')).toBe(
      '/tmp/repo-ai-governor-release-verify/cli-backed-smoke-workspaces/installed-vsix',
    );
  });

  it('keeps real release verification doctor artifacts inside the scratch smoke workspace', () => {
    const tempRoot = mkdtempSync(join(tmpdir(), 'repo-ai-governor-release-verify-'));
    const fakeHome = resolve(tempRoot, 'home');
    const workingRoot = mkdtempSync(
      join(
        resolve(process.cwd(), '.tmp', 'release-vscode-extension-package'),
        'integration-working-root-',
      ),
    );
    const reportPath = resolve(tempRoot, 'distribution-report.json');
    const liveToolManagedRoot = resolve(fakeHome, '.repo-ai-governor', 'workspaces');
    const packagedScratchRoot = resolveCliBackedSmokeWorkspaceRoot(workingRoot, 'packaged-root');
    const installedScratchRoot = resolveCliBackedSmokeWorkspaceRoot(workingRoot, 'installed-vsix');

    try {
      mkdirSync(fakeHome, { recursive: true });
      const doctorArtifactCountBefore = countDoctorArtifacts(liveToolManagedRoot);
      execFileSync('pnpm', ['run', 'build'], {
        cwd: process.cwd(),
        env: {
          ...process.env,
          HOME: fakeHome,
        },
        maxBuffer: 10 * 1024 * 1024,
        stdio: 'pipe',
      });

      execFileSync(
        process.execPath,
        [
          './scripts/release/verify-vscode-extension-distribution.js',
          '--output',
          reportPath,
          '--working-root',
          workingRoot,
        ],
        {
          cwd: process.cwd(),
          env: {
            ...process.env,
            HOME: fakeHome,
          },
          maxBuffer: 10 * 1024 * 1024,
          stdio: 'pipe',
        },
      );

      const doctorArtifactCountAfter = countDoctorArtifacts(liveToolManagedRoot);
      const packagedSnapshot = JSON.parse(
        readFileSync(
          resolve(
            packagedScratchRoot,
            'context',
            'runtime',
            'latest-workspace-operation.snapshot.json',
          ),
          'utf8',
        ),
      ) as {
        result?: {
          layeredLogs?: {
            detailed?: string[];
          };
          artifacts?: Array<{
            id?: string;
            path?: string;
          }>;
        };
      };
      const installedSnapshot = JSON.parse(
        readFileSync(
          resolve(
            installedScratchRoot,
            'context',
            'runtime',
            'latest-workspace-operation.snapshot.json',
          ),
          'utf8',
        ),
      ) as {
        result?: {
          layeredLogs?: {
            detailed?: string[];
          };
          artifacts?: Array<{
            id?: string;
            path?: string;
          }>;
        };
      };
      const packagedDoctorArtifact = packagedSnapshot.result?.artifacts?.find(
        (artifact) => artifact.id === 'doctor_diagnostics',
      )?.path;
      const installedDoctorArtifact = installedSnapshot.result?.artifacts?.find(
        (artifact) => artifact.id === 'doctor_diagnostics',
      )?.path;
      const packagedWorkspaceRoot = readLayeredLogValue(
        packagedSnapshot.result?.layeredLogs,
        'workspace_root',
      );
      const installedWorkspaceRoot = readLayeredLogValue(
        installedSnapshot.result?.layeredLogs,
        'workspace_root',
      );

      expect(doctorArtifactCountAfter).toBe(doctorArtifactCountBefore);
      expect(packagedWorkspaceRoot).toBe(packagedScratchRoot);
      expect(installedWorkspaceRoot).toBe(installedScratchRoot);
      expect(packagedDoctorArtifact).toContain(
        resolve(packagedScratchRoot, 'context', 'diagnostics', 'doctor'),
      );
      expect(installedDoctorArtifact).toContain(
        resolve(installedScratchRoot, 'context', 'diagnostics', 'doctor'),
      );
    } finally {
      rmSync(workingRoot, { recursive: true, force: true });
      rmSync(tempRoot, { recursive: true, force: true });
    }
  }, 420000);
});

describe('release vscode extension distribution extracted-VSIX guard', () => {
  it('extracts one VSIX and rejects disallowed symlink payload', () => {
    const tempRoot = mkdtempSync(join(tmpdir(), 'repo-ai-governor-vsix-'));
    const sourceRoot = resolve(tempRoot, 'source');
    const extensionRoot = resolve(sourceRoot, 'extension');
    const nodeModulesRoot = resolve(extensionRoot, 'node_modules');
    const workingRoot = resolve(tempRoot, 'working');
    const vsixPath = resolve(tempRoot, 'fixture.vsix');

    try {
      mkdirSync(nodeModulesRoot, { recursive: true });
      writeFileSync(resolve(extensionRoot, 'package.json'), '{}\n', 'utf8');
      symlinkSync('../package.json', resolve(nodeModulesRoot, 'install-unsafe-link'));
      execFileSync('zip', ['-y', '-q', '-r', vsixPath, '.'], { cwd: sourceRoot });

      const extractedRoot = extractVsix(vsixPath, workingRoot);

      expect(existsSync(resolve(extractedRoot, 'package.json'))).toBe(true);
      expect(() => verifySymlinkPayload(extractedRoot)).toThrow('install-unsafe symlinks');
    } finally {
      rmSync(tempRoot, { recursive: true, force: true });
    }
  });
});
