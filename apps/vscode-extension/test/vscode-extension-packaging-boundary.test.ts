import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('vscode extension packaging boundary', () => {
  it('keeps the extension on the source-checkout support path only', () => {
    const rootPackage = JSON.parse(
      readFileSync(resolve(process.cwd(), 'package.json'), 'utf8'),
    ) as {
      files?: string[];
    };
    const extensionPackage = JSON.parse(
      readFileSync(resolve(process.cwd(), 'apps/vscode-extension/package.json'), 'utf8'),
    ) as {
      private?: boolean;
      main?: string;
      exports?: {
        '.': {
          default?: string;
        };
      };
    };

    expect(extensionPackage.private).toBe(true);
    expect(extensionPackage.main).toBe('../../dist/apps/vscode-extension/src/extension.js');
    expect(extensionPackage.exports?.['.']?.default).toBe(
      '../../dist/apps/vscode-extension/src/index.js',
    );
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
    expect(
      Array.from(packagedPaths).some((path) =>
        path.startsWith('dist/node_modules/@repo-ai-governor/vscode-extension/'),
      ),
    ).toBe(false);
    expect(packagedPaths.has('dist/apps/vscode-extension/src/extension.js')).toBe(true);
  });
});
