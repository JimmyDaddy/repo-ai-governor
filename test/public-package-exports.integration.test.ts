import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

interface PublicPackageAuditTarget {
  packageName: string;
  packageDirectory: string;
}

interface PackageJsonExportsShape {
  '.': {
    types: string;
    default: string;
  };
}

const PUBLIC_PACKAGE_AUDIT_TARGETS: PublicPackageAuditTarget[] = [
  {
    packageName: '@repo-ai-governor/adapter-sdk',
    packageDirectory: 'packages/adapter-sdk',
  },
  {
    packageName: '@repo-ai-governor/memory-store-adapter',
    packageDirectory: 'packages/memory-store-adapter',
  },
  {
    packageName: '@repo-ai-governor/notification-dispatcher',
    packageDirectory: 'packages/notification-dispatcher',
  },
  {
    packageName: '@repo-ai-governor/orchestration-service-client',
    packageDirectory: 'packages/orchestration-service-client',
  },
  {
    packageName: '@repo-ai-governor/reporting',
    packageDirectory: 'packages/reporting',
  },
  {
    packageName: '@repo-ai-governor/shared',
    packageDirectory: 'packages/shared',
  },
];

const PACKAGE_EXPORTS_BASELINE: PackageJsonExportsShape = {
  '.': {
    types: './src/index.ts',
    default: './dist/src/index.js',
  },
};

const IMPORT_SCAN_ROOTS = ['apps', 'packages', 'test'];
const IMPORT_SCAN_FILES = ['README.md', 'README.zh-CN.md'];
const SOURCE_FILE_EXTENSION_PATTERN = /\.(md|ts)$/u;

/**
 * Recursively collects repository files used by public-package import audit.
 * @param rootPath Directory or file path to inspect.
 * @returns Sorted absolute file paths.
 */
function collectAuditFiles(rootPath: string): string[] {
  if (!existsSync(rootPath)) {
    return [];
  }

  const stats = statSync(rootPath);
  if (stats.isFile()) {
    return SOURCE_FILE_EXTENSION_PATTERN.test(rootPath) ? [rootPath] : [];
  }

  const collectedFiles: string[] = [];
  for (const entryName of readdirSync(rootPath)) {
    if (entryName === 'dist' || entryName === 'node_modules' || entryName === '.git') {
      continue;
    }

    const entryPath = resolve(rootPath, entryName);
    collectedFiles.push(...collectAuditFiles(entryPath));
  }

  return collectedFiles.sort((left, right) => left.localeCompare(right, 'en'));
}

/**
 * Reads and parses one package.json file.
 * @param packageDirectory Package root directory.
 * @returns Parsed package.json payload.
 */
function readPackageJson(packageDirectory: string): Record<string, unknown> {
  const packageJsonPath = resolve(process.cwd(), packageDirectory, 'package.json');
  return JSON.parse(readFileSync(packageJsonPath, 'utf8')) as Record<string, unknown>;
}

describe('public package exports audit', () => {
  it('keeps all six public packages on one explicit root export entry', () => {
    for (const auditTarget of PUBLIC_PACKAGE_AUDIT_TARGETS) {
      const packageJson = readPackageJson(auditTarget.packageDirectory);
      const srcIndexPath = resolve(process.cwd(), auditTarget.packageDirectory, 'src/index.ts');

      expect(packageJson.name).toBe(auditTarget.packageName);
      expect(packageJson.exports).toEqual(PACKAGE_EXPORTS_BASELINE);
      expect(existsSync(srcIndexPath)).toBe(true);
      expect(readFileSync(srcIndexPath, 'utf8')).toContain('export');
    }
  });

  it('keeps repo consumers on root imports instead of deep package subpaths', () => {
    const auditFiles = [
      ...IMPORT_SCAN_ROOTS.flatMap((rootPath) =>
        collectAuditFiles(resolve(process.cwd(), rootPath)),
      ),
      ...IMPORT_SCAN_FILES.flatMap((filePath) =>
        collectAuditFiles(resolve(process.cwd(), filePath)),
      ),
    ];

    const deepImportMatches: string[] = [];
    for (const auditFile of auditFiles) {
      const content = readFileSync(auditFile, 'utf8');
      for (const auditTarget of PUBLIC_PACKAGE_AUDIT_TARGETS) {
        const deepImportPattern = new RegExp(`${auditTarget.packageName}/[^"'\\s)]+`, 'u');
        const matchedImport = content.match(deepImportPattern)?.[0];
        if (matchedImport) {
          deepImportMatches.push(`${auditFile}:${matchedImport}`);
        }
      }
    }

    expect(deepImportMatches).toEqual([]);
  });
});
