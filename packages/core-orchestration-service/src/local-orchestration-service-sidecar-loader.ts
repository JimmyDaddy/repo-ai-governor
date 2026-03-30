import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, resolve as resolvePath } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const loaderDirectory = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = resolvePath(loaderDirectory, '..', '..', '..');
const WORKSPACE_PACKAGE_DIRECTORY_BY_NAME = resolveWorkspacePackageDirectoryMap();

function resolveWorkspacePackageDirectoryMap(): Record<string, string> {
  const packageRoots = [
    resolvePath(workspaceRoot, 'packages'),
    resolvePath(workspaceRoot, 'packages', 'memory-providers'),
  ];
  const packageDirectoryByName: Record<string, string> = {};

  for (const packageRoot of packageRoots) {
    if (!existsSync(packageRoot)) {
      continue;
    }

    for (const entry of readdirSync(packageRoot, { withFileTypes: true })) {
      if (!entry.isDirectory()) {
        continue;
      }

      const packageDirectory = resolvePath(packageRoot, entry.name);
      const packageManifestPath = resolvePath(packageDirectory, 'package.json');
      if (!existsSync(packageManifestPath)) {
        continue;
      }

      const packageName = readWorkspacePackageName(packageManifestPath);
      if (!packageName?.startsWith('@repo-ai-governor/')) {
        continue;
      }

      packageDirectoryByName[packageName.replace('@repo-ai-governor/', '')] =
        packageDirectory.replace(`${workspaceRoot}/`, '');
    }
  }

  return packageDirectoryByName;
}

function readWorkspacePackageName(packageManifestPath: string): string | undefined {
  try {
    const parsedManifest = JSON.parse(readFileSync(packageManifestPath, 'utf8')) as {
      name?: unknown;
    };
    return typeof parsedManifest.name === 'string' ? parsedManifest.name : undefined;
  } catch {
    return undefined;
  }
}

export async function resolve(
  specifier: string,
  context: { parentURL?: string },
  nextResolve: (
    specifier: string,
    context: { parentURL?: string },
  ) => Promise<{ url: string; shortCircuit?: boolean }>,
): Promise<{ url: string; shortCircuit?: boolean }> {
  if (
    context.parentURL &&
    (specifier.startsWith('./') || specifier.startsWith('../')) &&
    specifier.endsWith('.js')
  ) {
    const parentPath = fileURLToPath(context.parentURL);
    const tsCandidatePath = resolvePath(dirname(parentPath), specifier.replace(/\.js$/u, '.ts'));
    if (existsSync(tsCandidatePath)) {
      return {
        url: pathToFileURL(tsCandidatePath).href,
        shortCircuit: true,
      };
    }
  }

  const workspacePackageMatch = specifier.match(/^@repo-ai-governor\/([^/]+)(?:\/(.+))?$/u);
  if (!workspacePackageMatch) {
    return nextResolve(specifier, context);
  }

  const packageName = workspacePackageMatch[1];
  const subpath = workspacePackageMatch[2];
  const packageDirectory = packageName
    ? WORKSPACE_PACKAGE_DIRECTORY_BY_NAME[packageName]
    : undefined;
  if (!packageDirectory) {
    return nextResolve(specifier, context);
  }

  const targetPath = subpath
    ? resolvePath(workspaceRoot, packageDirectory, 'src', `${subpath}.ts`)
    : resolvePath(workspaceRoot, packageDirectory, 'src', 'index.ts');

  return {
    url: pathToFileURL(targetPath).href,
    shortCircuit: true,
  };
}
