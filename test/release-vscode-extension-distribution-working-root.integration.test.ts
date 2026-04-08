import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const SCRIPT_PATH = resolve(process.cwd(), 'scripts/release/pack-vscode-extension.js');

/**
 * Runs the VS Code extension packaging script against one explicit working-root override.
 * @param workingRoot Requested working-root argument.
 * @returns {import('node:child_process').SpawnSyncReturns<string>}
 */
function runPackVscodeExtension(workingRoot: string) {
  return spawnSync(process.execPath, [SCRIPT_PATH, '--working-root', workingRoot], {
    cwd: process.cwd(),
    encoding: 'utf8',
  });
}

describe('release vscode extension distribution working-root guard', () => {
  it('rejects repository-root cleanup targets before packaging starts', () => {
    const result = runPackVscodeExtension('.');

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Unsafe --working-root path:');
    expect(result.stderr).toContain('.tmp/release-vscode-extension-package');
  });

  it('rejects parent-directory cleanup targets outside the dedicated temp subtree', () => {
    const result = runPackVscodeExtension('..');

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Unsafe --working-root path:');
    expect(result.stderr).toContain('.tmp/release-vscode-extension-package');
  });
});
