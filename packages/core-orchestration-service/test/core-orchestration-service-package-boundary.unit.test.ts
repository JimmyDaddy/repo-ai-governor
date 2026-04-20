import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('core orchestration service package boundary', () => {
  it('declares every direct workspace runtime dependency needed by the sidecar entry', () => {
    const packageJson = JSON.parse(
      readFileSync(
        resolve(process.cwd(), 'packages/core-orchestration-service/package.json'),
        'utf8',
      ),
    ) as { dependencies?: Record<string, string> };

    expect(packageJson.dependencies).toMatchObject({
      '@repo-ai-governor/core-memory': 'workspace:*',
      '@repo-ai-governor/core-session': 'workspace:*',
      '@repo-ai-governor/memory-provider-registry': 'workspace:*',
      '@repo-ai-governor/memory-store-adapter': 'workspace:*',
    });
  });
});
