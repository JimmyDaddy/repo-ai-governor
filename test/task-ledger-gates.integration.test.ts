import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPOSITORY_ROOT_PATH = resolve(fileURLToPath(new URL('..', import.meta.url)));
const CHECK_TASK_LEDGER_SYNC_SCRIPT_PATH = resolve(
  REPOSITORY_ROOT_PATH,
  'scripts',
  'governance',
  'check-task-ledger-sync.js',
);

describe('check-task-ledger-sync.js', () => {
  it('passes when current-context intentionally has no active stream and primary status is idle', () => {
    const tempRoot = mkdtempSync(resolve(tmpdir(), 'task-ledger-gates-'));

    try {
      mkdirSync(resolve(tempRoot, '.repo-ai-governor', 'context'), { recursive: true });
      writeFileSync(
        resolve(tempRoot, '.repo-ai-governor', 'context', 'current-context.md'),
        `# Workspace Current Context

## Primary Stream

- Status: idle
- Project: \`none\`
- Sprint: \`none\`

## Active Streams

- None currently registered.
`,
        'utf8',
      );

      const stdout = execFileSync(process.execPath, [CHECK_TASK_LEDGER_SYNC_SCRIPT_PATH], {
        cwd: tempRoot,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      expect(stdout).toContain(
        '[gate:task-ledger-sync] No active streams registered; current-context primary stream is idle.',
      );
    } finally {
      rmSync(tempRoot, { recursive: true, force: true });
    }
  });
});
