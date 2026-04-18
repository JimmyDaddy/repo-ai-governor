import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('vscode extension packaging boundary', () => {
  it('keeps the published tarball separate from the source-checkout-generated packaged extension path', () => {
    const rootPackage = JSON.parse(
      readFileSync(resolve(process.cwd(), 'package.json'), 'utf8'),
    ) as {
      files?: string[];
    };
    const extensionPackage = JSON.parse(
      readFileSync(resolve(process.cwd(), 'apps/vscode-extension/package.json'), 'utf8'),
    ) as {
      name?: string;
      publisher?: string;
      private?: boolean;
      files?: string[];
      main?: string;
      exports?: {
        '.': {
          types?: string;
          default?: string;
        };
      };
      dependencies?: Record<string, string>;
    };
    const workspaceOpsPackage = JSON.parse(
      readFileSync(
        resolve(process.cwd(), 'packages/core-orchestration-service/package.json'),
        'utf8',
      ),
    ) as {
      dependencies?: Record<string, string>;
    };

    expect(extensionPackage.name).toBe('repo-ai-governor-vscode');
    expect(extensionPackage.publisher).toBe('cjhdev');
    expect(extensionPackage.private).toBe(true);
    expect(extensionPackage.main).toBe('./dist/src/extension.js');
    expect(extensionPackage.files ?? []).toEqual(
      expect.arrayContaining([
        'dist',
        'src',
        'node_modules',
        'resources',
        'package.nls.json',
        'package.nls.zh-cn.json',
        'README.md',
      ]),
    );
    expect(extensionPackage.exports?.['.']?.types).toBe('./src/index.ts');
    expect(extensionPackage.exports?.['.']?.default).toBe('./dist/src/index.js');
    expect(extensionPackage.dependencies).toEqual(
      expect.objectContaining({
        '@repo-ai-governor/cli': 'workspace:*',
        '@repo-ai-governor/config': 'workspace:*',
        '@repo-ai-governor/core-orchestration-service': 'workspace:*',
      }),
    );
    expect(workspaceOpsPackage.dependencies).toEqual(
      expect.objectContaining({
        '@repo-ai-governor/config': 'workspace:*',
      }),
    );
    expect(workspaceOpsPackage.dependencies?.['@repo-ai-governor/cli']).toBeUndefined();
    expect(rootPackage.files ?? []).not.toContain('apps/vscode-extension');
    expect(rootPackage.files ?? []).toEqual(
      expect.arrayContaining(['integrations/ide', 'integrations/desktop']),
    );

    const packManifest = JSON.parse(
      execFileSync(
        process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm',
        ['pack', '--json', '--dry-run'],
        {
          cwd: process.cwd(),
          encoding: 'utf8',
        },
      ),
    ) as {
      files?: Array<{
        path?: string;
      }>;
    };
    const packagedPaths = new Set((packManifest.files ?? []).map((entry) => entry.path ?? ''));

    expect(packagedPaths.has('apps/vscode-extension/package.json')).toBe(false);
    expect(packagedPaths.has('apps/vscode-extension/package.nls.json')).toBe(false);
    expect(packagedPaths.has('apps/vscode-extension/package.nls.zh-cn.json')).toBe(false);
    expect(packagedPaths.has('apps/vscode-extension/resources/governor.svg')).toBe(false);
    expect(packagedPaths.has('dist/apps/vscode-extension/src/extension.js')).toBe(true);
  });
});
