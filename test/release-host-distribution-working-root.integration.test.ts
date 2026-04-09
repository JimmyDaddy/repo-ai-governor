import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const SCRIPT_PATH = resolve(process.cwd(), 'scripts/release/verify-host-distribution.js');

/**
 * Runs the release verification script against one explicit working-root override.
 * @param workingRoot Requested working-root argument.
 * @returns {import('node:child_process').SpawnSyncReturns<string>}
 */
function runVerifyHostDistribution(workingRoot: string) {
  return spawnSync(process.execPath, [SCRIPT_PATH, '--working-root', workingRoot], {
    cwd: process.cwd(),
    encoding: 'utf8',
  });
}

describe('release host distribution working-root guard', () => {
  it('rejects repository-root cleanup targets before any recursive deletion starts', () => {
    const result = runVerifyHostDistribution('.');

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Unsafe --working-root path:');
    expect(result.stderr).toContain('.tmp/release-host-distribution-validation');
  });

  it('rejects parent-directory cleanup targets outside the dedicated temp subtree', () => {
    const result = runVerifyHostDistribution('..');

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Unsafe --working-root path:');
    expect(result.stderr).toContain('.tmp/release-host-distribution-validation');
  });
});
