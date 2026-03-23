#!/usr/bin/env node

import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";

const PROJECT_ROOT = process.cwd();
const COMPILED_CLI_ENTRY_PATH = resolve(PROJECT_ROOT, "dist/bin/repo-ai-governor.js");
const DIST_SCOPE_NODE_MODULES = resolve(PROJECT_ROOT, "dist/node_modules/@repo-ai-governor");

const DISTRIBUTION_PACKAGES = [
  {
    packageName: "cli",
    packageRoot: resolve(PROJECT_ROOT, "apps/cli"),
    compiledDirectory: resolve(PROJECT_ROOT, "dist/apps/cli"),
    packageDistDirectory: resolve(PROJECT_ROOT, "apps/cli/dist"),
  },
  {
    packageName: "adapter-sdk",
    packageRoot: resolve(PROJECT_ROOT, "packages/adapter-sdk"),
    compiledDirectory: resolve(PROJECT_ROOT, "dist/packages/adapter-sdk"),
    packageDistDirectory: resolve(PROJECT_ROOT, "packages/adapter-sdk/dist"),
  },
  {
    packageName: "adapter-codex",
    packageRoot: resolve(PROJECT_ROOT, "packages/adapters/codex"),
    compiledDirectory: resolve(PROJECT_ROOT, "dist/packages/adapters/codex"),
    packageDistDirectory: resolve(PROJECT_ROOT, "packages/adapters/codex/dist"),
  },
  {
    packageName: "adapter-github-copilot",
    packageRoot: resolve(PROJECT_ROOT, "packages/adapters/github-copilot"),
    compiledDirectory: resolve(PROJECT_ROOT, "dist/packages/adapters/github-copilot"),
    packageDistDirectory: resolve(PROJECT_ROOT, "packages/adapters/github-copilot/dist"),
  },
  {
    packageName: "adapter-claude-code",
    packageRoot: resolve(PROJECT_ROOT, "packages/adapters/claude-code"),
    compiledDirectory: resolve(PROJECT_ROOT, "dist/packages/adapters/claude-code"),
    packageDistDirectory: resolve(PROJECT_ROOT, "packages/adapters/claude-code/dist"),
  },
  {
    packageName: "adapter-local-model",
    packageRoot: resolve(PROJECT_ROOT, "packages/adapters/local-model"),
    compiledDirectory: resolve(PROJECT_ROOT, "dist/packages/adapters/local-model"),
    packageDistDirectory: resolve(PROJECT_ROOT, "packages/adapters/local-model/dist"),
  },
  {
    packageName: "config",
    packageRoot: resolve(PROJECT_ROOT, "packages/config"),
    compiledDirectory: resolve(PROJECT_ROOT, "dist/packages/config"),
    packageDistDirectory: resolve(PROJECT_ROOT, "packages/config/dist"),
  },
  {
    packageName: "core-change-risk",
    packageRoot: resolve(PROJECT_ROOT, "packages/core-change-risk"),
    compiledDirectory: resolve(PROJECT_ROOT, "dist/packages/core-change-risk"),
    packageDistDirectory: resolve(PROJECT_ROOT, "packages/core-change-risk/dist"),
  },
  {
    packageName: "core-memory",
    packageRoot: resolve(PROJECT_ROOT, "packages/core-memory"),
    compiledDirectory: resolve(PROJECT_ROOT, "dist/packages/core-memory"),
    packageDistDirectory: resolve(PROJECT_ROOT, "packages/core-memory/dist"),
  },
  {
    packageName: "core-policy",
    packageRoot: resolve(PROJECT_ROOT, "packages/core-policy"),
    compiledDirectory: resolve(PROJECT_ROOT, "dist/packages/core-policy"),
    packageDistDirectory: resolve(PROJECT_ROOT, "packages/core-policy/dist"),
  },
  {
    packageName: "core-process",
    packageRoot: resolve(PROJECT_ROOT, "packages/core-process"),
    compiledDirectory: resolve(PROJECT_ROOT, "dist/packages/core-process"),
    packageDistDirectory: resolve(PROJECT_ROOT, "packages/core-process/dist"),
  },
  {
    packageName: "core-runtime",
    packageRoot: resolve(PROJECT_ROOT, "packages/core-runtime"),
    compiledDirectory: resolve(PROJECT_ROOT, "dist/packages/core-runtime"),
    packageDistDirectory: resolve(PROJECT_ROOT, "packages/core-runtime/dist"),
  },
  {
    packageName: "core-session",
    packageRoot: resolve(PROJECT_ROOT, "packages/core-session"),
    compiledDirectory: resolve(PROJECT_ROOT, "dist/packages/core-session"),
    packageDistDirectory: resolve(PROJECT_ROOT, "packages/core-session/dist"),
  },
  {
    packageName: "memory-provider-fs-csv",
    packageRoot: resolve(PROJECT_ROOT, "packages/memory-providers/fs-csv"),
    compiledDirectory: resolve(PROJECT_ROOT, "dist/packages/memory-providers/fs-csv"),
    packageDistDirectory: resolve(PROJECT_ROOT, "packages/memory-providers/fs-csv/dist"),
  },
  {
    packageName: "memory-provider-sqlite-fs",
    packageRoot: resolve(PROJECT_ROOT, "packages/memory-providers/sqlite-fs"),
    compiledDirectory: resolve(PROJECT_ROOT, "dist/packages/memory-providers/sqlite-fs"),
    packageDistDirectory: resolve(PROJECT_ROOT, "packages/memory-providers/sqlite-fs/dist"),
  },
  {
    packageName: "memory-store-adapter",
    packageRoot: resolve(PROJECT_ROOT, "packages/memory-store-adapter"),
    compiledDirectory: resolve(PROJECT_ROOT, "dist/packages/memory-store-adapter"),
    packageDistDirectory: resolve(PROJECT_ROOT, "packages/memory-store-adapter/dist"),
  },
  {
    packageName: "notification-dispatcher",
    packageRoot: resolve(PROJECT_ROOT, "packages/notification-dispatcher"),
    compiledDirectory: resolve(PROJECT_ROOT, "dist/packages/notification-dispatcher"),
    packageDistDirectory: resolve(PROJECT_ROOT, "packages/notification-dispatcher/dist"),
  },
  {
    packageName: "reporting",
    packageRoot: resolve(PROJECT_ROOT, "packages/reporting"),
    compiledDirectory: resolve(PROJECT_ROOT, "dist/packages/reporting"),
    packageDistDirectory: resolve(PROJECT_ROOT, "packages/reporting/dist"),
  },
  {
    packageName: "shared",
    packageRoot: resolve(PROJECT_ROOT, "packages/shared"),
    compiledDirectory: resolve(PROJECT_ROOT, "dist/packages/shared"),
    packageDistDirectory: resolve(PROJECT_ROOT, "packages/shared/dist"),
  },
  {
    packageName: "slots",
    packageRoot: resolve(PROJECT_ROOT, "packages/slots"),
    compiledDirectory: resolve(PROJECT_ROOT, "dist/packages/slots"),
    packageDistDirectory: resolve(PROJECT_ROOT, "packages/slots/dist"),
  },
  {
    packageName: "standards",
    packageRoot: resolve(PROJECT_ROOT, "packages/standards"),
    compiledDirectory: resolve(PROJECT_ROOT, "dist/packages/standards"),
    packageDistDirectory: resolve(PROJECT_ROOT, "packages/standards/dist"),
  },
];

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
  for (const distributionPackage of DISTRIBUTION_PACKAGES) {
    assertBuildArtifact(distributionPackage.compiledDirectory, "compiled package directory");
    rmSync(distributionPackage.packageDistDirectory, { recursive: true, force: true });
    mkdirSync(dirname(distributionPackage.packageDistDirectory), { recursive: true });
    cpSync(distributionPackage.compiledDirectory, distributionPackage.packageDistDirectory, {
      recursive: true,
    });
  }
}

/**
 * Creates self-contained runtime package snapshots under `dist/node_modules`.
 *
 * Why this exists:
 * released tarballs should resolve internal workspace packages without relying
 * on source-workspace paths that do not exist in clean-room environments.
 */
function materializeWorkspacePackagesForDistributionRuntime() {
  rmSync(DIST_SCOPE_NODE_MODULES, { recursive: true, force: true });
  mkdirSync(DIST_SCOPE_NODE_MODULES, { recursive: true });

  for (const distributionPackage of DISTRIBUTION_PACKAGES) {
    const packageJsonPath = resolve(distributionPackage.packageRoot, "package.json");
    assertBuildArtifact(packageJsonPath, "workspace package manifest");
    assertBuildArtifact(distributionPackage.compiledDirectory, "compiled package directory");

    const runtimePackageRoot = resolve(DIST_SCOPE_NODE_MODULES, distributionPackage.packageName);
    const runtimePackageDistDirectory = resolve(runtimePackageRoot, "dist");
    rmSync(runtimePackageRoot, { recursive: true, force: true });
    mkdirSync(runtimePackageRoot, { recursive: true });
    cpSync(packageJsonPath, resolve(runtimePackageRoot, "package.json"));
    cpSync(distributionPackage.compiledDirectory, runtimePackageDistDirectory, { recursive: true });
  }
}

assertBuildArtifact(COMPILED_CLI_ENTRY_PATH, "CLI entry");
mirrorPackageDistributions();
materializeWorkspacePackagesForDistributionRuntime();
