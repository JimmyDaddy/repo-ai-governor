import { existsSync } from "node:fs";
import { dirname, resolve as resolvePath } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const WORKSPACE_PACKAGE_DIRECTORY_BY_NAME: Record<string, string> = {
  "core-orchestration-service": "packages/core-orchestration-service",
  "core-runtime-langgraph": "packages/core-runtime-langgraph",
  "orchestration-service-client": "packages/orchestration-service-client",
  shared: "packages/shared",
};

const loaderDirectory = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = resolvePath(loaderDirectory, "..", "..", "..");

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
    (specifier.startsWith("./") || specifier.startsWith("../")) &&
    specifier.endsWith(".js")
  ) {
    const parentPath = fileURLToPath(context.parentURL);
    const tsCandidatePath = resolvePath(dirname(parentPath), specifier.replace(/\.js$/u, ".ts"));
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
    ? resolvePath(workspaceRoot, packageDirectory, "src", `${subpath}.ts`)
    : resolvePath(workspaceRoot, packageDirectory, "src", "index.ts");

  return {
    url: pathToFileURL(targetPath).href,
    shortCircuit: true,
  };
}
