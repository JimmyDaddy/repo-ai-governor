#!/usr/bin/env node

import { cpSync, existsSync, mkdirSync, rmSync, symlinkSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";

const PROJECT_ROOT = process.cwd();
const COMPILED_CLI_ENTRY_PATH = resolve(PROJECT_ROOT, "dist/bin/repo-ai-governor.js");
const LINK_TYPE = process.platform === "win32" ? "junction" : "dir";

const DISTRIBUTION_MIRRORS = [
  {
    compiledDirectory: resolve(PROJECT_ROOT, "dist/apps/cli"),
    packageDistDirectory: resolve(PROJECT_ROOT, "apps/cli/dist"),
  },
  {
    compiledDirectory: resolve(PROJECT_ROOT, "dist/packages/config"),
    packageDistDirectory: resolve(PROJECT_ROOT, "packages/config/dist"),
  },
  {
    compiledDirectory: resolve(PROJECT_ROOT, "dist/packages/core-change-risk"),
    packageDistDirectory: resolve(PROJECT_ROOT, "packages/core-change-risk/dist"),
  },
  {
    compiledDirectory: resolve(PROJECT_ROOT, "dist/packages/core-memory"),
    packageDistDirectory: resolve(PROJECT_ROOT, "packages/core-memory/dist"),
  },
  {
    compiledDirectory: resolve(PROJECT_ROOT, "dist/packages/core-policy"),
    packageDistDirectory: resolve(PROJECT_ROOT, "packages/core-policy/dist"),
  },
  {
    compiledDirectory: resolve(PROJECT_ROOT, "dist/packages/core-process"),
    packageDistDirectory: resolve(PROJECT_ROOT, "packages/core-process/dist"),
  },
  {
    compiledDirectory: resolve(PROJECT_ROOT, "dist/packages/core-runtime"),
    packageDistDirectory: resolve(PROJECT_ROOT, "packages/core-runtime/dist"),
  },
  {
    compiledDirectory: resolve(PROJECT_ROOT, "dist/packages/core-session"),
    packageDistDirectory: resolve(PROJECT_ROOT, "packages/core-session/dist"),
  },
  {
    compiledDirectory: resolve(PROJECT_ROOT, "dist/packages/memory-providers/fs-csv"),
    packageDistDirectory: resolve(PROJECT_ROOT, "packages/memory-providers/fs-csv/dist"),
  },
  {
    compiledDirectory: resolve(PROJECT_ROOT, "dist/packages/memory-providers/sqlite-fs"),
    packageDistDirectory: resolve(PROJECT_ROOT, "packages/memory-providers/sqlite-fs/dist"),
  },
  {
    compiledDirectory: resolve(PROJECT_ROOT, "dist/packages/memory-store-adapter"),
    packageDistDirectory: resolve(PROJECT_ROOT, "packages/memory-store-adapter/dist"),
  },
  {
    compiledDirectory: resolve(PROJECT_ROOT, "dist/packages/notification-dispatcher"),
    packageDistDirectory: resolve(PROJECT_ROOT, "packages/notification-dispatcher/dist"),
  },
  {
    compiledDirectory: resolve(PROJECT_ROOT, "dist/packages/shared"),
    packageDistDirectory: resolve(PROJECT_ROOT, "packages/shared/dist"),
  },
  {
    compiledDirectory: resolve(PROJECT_ROOT, "dist/packages/slots"),
    packageDistDirectory: resolve(PROJECT_ROOT, "packages/slots/dist"),
  },
  {
    compiledDirectory: resolve(PROJECT_ROOT, "dist/packages/standards"),
    packageDistDirectory: resolve(PROJECT_ROOT, "packages/standards/dist"),
  },
];

const WORKSPACE_PACKAGE_LINKS = [
  {
    packageName: "cli",
    packageRoot: resolve(PROJECT_ROOT, "apps/cli"),
  },
  {
    packageName: "config",
    packageRoot: resolve(PROJECT_ROOT, "packages/config"),
  },
  {
    packageName: "core-change-risk",
    packageRoot: resolve(PROJECT_ROOT, "packages/core-change-risk"),
  },
  {
    packageName: "core-memory",
    packageRoot: resolve(PROJECT_ROOT, "packages/core-memory"),
  },
  {
    packageName: "core-policy",
    packageRoot: resolve(PROJECT_ROOT, "packages/core-policy"),
  },
  {
    packageName: "core-process",
    packageRoot: resolve(PROJECT_ROOT, "packages/core-process"),
  },
  {
    packageName: "core-runtime",
    packageRoot: resolve(PROJECT_ROOT, "packages/core-runtime"),
  },
  {
    packageName: "core-session",
    packageRoot: resolve(PROJECT_ROOT, "packages/core-session"),
  },
  {
    packageName: "memory-provider-fs-csv",
    packageRoot: resolve(PROJECT_ROOT, "packages/memory-providers/fs-csv"),
  },
  {
    packageName: "memory-provider-sqlite-fs",
    packageRoot: resolve(PROJECT_ROOT, "packages/memory-providers/sqlite-fs"),
  },
  {
    packageName: "memory-store-adapter",
    packageRoot: resolve(PROJECT_ROOT, "packages/memory-store-adapter"),
  },
  {
    packageName: "notification-dispatcher",
    packageRoot: resolve(PROJECT_ROOT, "packages/notification-dispatcher"),
  },
  {
    packageName: "shared",
    packageRoot: resolve(PROJECT_ROOT, "packages/shared"),
  },
  {
    packageName: "slots",
    packageRoot: resolve(PROJECT_ROOT, "packages/slots"),
  },
  {
    packageName: "standards",
    packageRoot: resolve(PROJECT_ROOT, "packages/standards"),
  },
];

const DIST_SCOPE_NODE_MODULES = resolve(PROJECT_ROOT, "dist/node_modules/@repo-ai-governor");

/**
 * Asserts that the expected build artifact exists before mirroring runtime assets.
 * @param artifactPath Expected artifact path.
 * @param label Human-readable artifact description.
 */
function assertBuildArtifact(artifactPath, label) {
  if (!existsSync(artifactPath)) {
    throw new Error(`Build output is incomplete: expected ${label} at ${artifactPath}.`);
  }
}

/**
 * Mirrors compiler output into each workspace package-local `dist` directory.
 */
function mirrorPackageDistributions() {
  for (const mirror of DISTRIBUTION_MIRRORS) {
    assertBuildArtifact(mirror.compiledDirectory, "compiled package directory");
    rmSync(mirror.packageDistDirectory, { recursive: true, force: true });
    mkdirSync(dirname(mirror.packageDistDirectory), { recursive: true });
    cpSync(mirror.compiledDirectory, mirror.packageDistDirectory, { recursive: true });
  }
}

/**
 * Creates package links under `dist/node_modules` so compiled runtime can resolve workspace packages.
 */
function linkWorkspacePackagesForDistributionRuntime() {
  rmSync(DIST_SCOPE_NODE_MODULES, { recursive: true, force: true });
  mkdirSync(DIST_SCOPE_NODE_MODULES, { recursive: true });

  for (const workspacePackage of WORKSPACE_PACKAGE_LINKS) {
    assertBuildArtifact(workspacePackage.packageRoot, "workspace package root");
    const linkPath = resolve(DIST_SCOPE_NODE_MODULES, workspacePackage.packageName);
    const linkTarget = relative(dirname(linkPath), workspacePackage.packageRoot);
    symlinkSync(linkTarget, linkPath, LINK_TYPE);
  }
}

assertBuildArtifact(COMPILED_CLI_ENTRY_PATH, "CLI entry");
mirrorPackageDistributions();
linkWorkspacePackagesForDistributionRuntime();
