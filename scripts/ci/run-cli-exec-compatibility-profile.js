#!/usr/bin/env node

import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';

const OUTPUT_MODE_PRETTY = 'pretty';
const OUTPUT_MODE_JSON = 'json';
const PROFILE_FULL = 'cli_exec_compatibility_full';
const PROFILE_RUNTIME_FOUNDATION = 'cli_exec_compatibility_runtime_foundation';
const PROFILE_ADAPTER_SLICE = 'cli_exec_compatibility_adapter_slice';
const DEFAULT_HEAD_REF = 'HEAD';
const FALLBACK_PNPM_BINARY = '/opt/homebrew/bin/pnpm';
const DOC_ONLY_PREFIXES = [
  '.repo-ai-governor/',
  '.codex/',
  'docs/',
  'AGENTS.md',
  'CLAUDE.md',
  'README.md',
  'README.zh-CN.md',
];
const ADAPTER_CONFIG = {
  codex: {
    compatibilityTriggerPaths: [
      'packages/adapters/codex/src/codex-agent-adapter.ts',
      'packages/adapters/codex/test/codex-agent-adapter.smoke.test.ts',
    ],
    smokeTestPath: 'packages/adapters/codex/test/codex-agent-adapter.smoke.test.ts',
  },
  'claude-code': {
    compatibilityTriggerPaths: [
      'packages/adapters/claude-code/src/claude-code-agent-adapter.ts',
      'packages/adapters/claude-code/test/claude-code-agent-adapter.smoke.test.ts',
    ],
    smokeTestPath: 'packages/adapters/claude-code/test/claude-code-agent-adapter.smoke.test.ts',
  },
  'github-copilot': {
    compatibilityTriggerPaths: [
      'packages/adapters/github-copilot/src/github-copilot-agent-adapter.ts',
      'packages/adapters/github-copilot/test/github-copilot-agent-adapter.smoke.test.ts',
    ],
    smokeTestPath:
      'packages/adapters/github-copilot/test/github-copilot-agent-adapter.smoke.test.ts',
  },
};
const SHARED_RUNTIME_FOUNDATION_TRIGGER_PATHS = [
  'packages/adapter-sdk/test/native-cli-exec-process-runtime.unit.test.ts',
  'packages/adapter-sdk/test/agent-cli-exec-operations-runtime.unit.test.ts',
  'packages/adapter-sdk/test/native-cli-exec-internal-acp-extension-seam.unit.test.ts',
  'test/native-cli-exec-compatibility-harness.ts',
];
const FULL_PROFILE_TRIGGER_PATHS = [
  'package.json',
  'scripts/ci/run-cli-exec-compatibility-profile.js',
  'test/cli-exec-compatibility-profile.integration.test.ts',
  'packages/adapter-sdk/src/native-cli-exec-process-runtime.ts',
  'packages/adapter-sdk/src/agent-cli-exec-operations-runtime.ts',
  'packages/adapter-sdk/src/native-cli-exec-internal-acp-extension-seam.ts',
  'apps/cli/src/runtime/agent-onboarding-runtime.ts',
  'apps/cli/src/runtime/adapter-verification-runtime.ts',
  'apps/cli/src/runtime/adapter-routing-runtime.ts',
  'apps/cli/src/runtime/connect-workflow-runtime.ts',
  'apps/cli/src/commands/connect-command.ts',
  'apps/cli/src/commands/doctor-command.ts',
  'apps/cli/src/commands/review-verify-command.ts',
  'apps/cli/test/runtime/agent-onboarding-runtime.test.ts',
  'apps/cli/test/runtime/adapter-verification-runtime.test.ts',
  'apps/cli/test/runtime/adapter-routing-runtime.test.ts',
  'apps/cli/test/connect-phase2.integration.test.ts',
];
const FULL_PROFILE_TEST_PATHS = [
  'packages/adapter-sdk/test/native-cli-exec-process-runtime.unit.test.ts',
  'packages/adapter-sdk/test/agent-cli-exec-operations-runtime.unit.test.ts',
  'packages/adapter-sdk/test/native-cli-exec-internal-acp-extension-seam.unit.test.ts',
  'packages/adapters/codex/test/codex-agent-adapter.smoke.test.ts',
  'packages/adapters/claude-code/test/claude-code-agent-adapter.smoke.test.ts',
  'packages/adapters/github-copilot/test/github-copilot-agent-adapter.smoke.test.ts',
  'apps/cli/test/runtime/agent-onboarding-runtime.test.ts',
  'apps/cli/test/runtime/adapter-verification-runtime.test.ts',
  'apps/cli/test/runtime/adapter-routing-runtime.test.ts',
  'apps/cli/test/connect-phase2.integration.test.ts',
];
const RUNTIME_FOUNDATION_PROFILE_TEST_PATHS = [
  'packages/adapter-sdk/test/native-cli-exec-process-runtime.unit.test.ts',
  'packages/adapter-sdk/test/agent-cli-exec-operations-runtime.unit.test.ts',
  'packages/adapter-sdk/test/native-cli-exec-internal-acp-extension-seam.unit.test.ts',
  'packages/adapters/codex/test/codex-agent-adapter.smoke.test.ts',
  'packages/adapters/claude-code/test/claude-code-agent-adapter.smoke.test.ts',
  'packages/adapters/github-copilot/test/github-copilot-agent-adapter.smoke.test.ts',
];

/**
 * @typedef {typeof PROFILE_FULL | typeof PROFILE_RUNTIME_FOUNDATION | typeof PROFILE_ADAPTER_SLICE} CliExecCompatibilityProfileId
 */

/**
 * @typedef {{
 *   outputMode: "pretty" | "json";
 *   dryRun: boolean;
 *   execute: boolean;
 *   changedFiles: string[];
 *   profileId: CliExecCompatibilityProfileId | null;
 *   adapterId: keyof typeof ADAPTER_CONFIG | null;
 *   baseRef: string | null;
 *   headRef: string | null;
 * }} CliExecCompatibilityArguments
 */

/**
 * @typedef {{
 *   profileId: CliExecCompatibilityProfileId | null;
 *   reason:
 *     | "explicit_profile"
 *     | "shared_runtime_or_consumer_changed"
 *     | "cross_adapter_slice_changed"
 *     | "single_adapter_slice_changed"
 *     | "shared_runtime_foundation_changed"
 *     | "docs_only_change"
 *     | "no_cli_exec_runtime_change_detected";
 *   adapterId: keyof typeof ADAPTER_CONFIG | null;
 *   changedFiles: string[];
 *   touchedAdapters: Array<keyof typeof ADAPTER_CONFIG>;
 *   command: string | null;
 *   commandArgs: string[] | null;
 *   source: "explicit" | "git_range" | "working_tree";
 *   baseRef: string | null;
 *   headRef: string | null;
 * }} CliExecCompatibilitySelection
 */

/**
 * Parses CLI flags for compatibility-profile routing.
 * @returns {CliExecCompatibilityArguments}
 */
function parseArguments() {
  const args = process.argv.slice(2);
  /** @type {string[]} */
  const changedFiles = [];
  /** @type {CliExecCompatibilityArguments} */
  const options = {
    outputMode: OUTPUT_MODE_PRETTY,
    dryRun: false,
    execute: false,
    changedFiles,
    profileId: null,
    adapterId: null,
    baseRef: null,
    headRef: null,
  };

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === '--output') {
      const outputMode = args[index + 1]?.trim();
      if (outputMode !== OUTPUT_MODE_PRETTY && outputMode !== OUTPUT_MODE_JSON) {
        throw new Error('Expected "--output" to be followed by "pretty" or "json".');
      }
      options.outputMode = outputMode;
      index += 1;
      continue;
    }
    if (argument === '--changed-file') {
      const changedFile = args[index + 1]?.trim();
      if (!changedFile) {
        throw new Error(
          'Expected "--changed-file" to be followed by one repository-relative path.',
        );
      }
      options.changedFiles.push(changedFile);
      index += 1;
      continue;
    }
    if (argument === '--profile') {
      const profileId = args[index + 1]?.trim();
      if (
        profileId !== PROFILE_FULL &&
        profileId !== PROFILE_RUNTIME_FOUNDATION &&
        profileId !== PROFILE_ADAPTER_SLICE
      ) {
        throw new Error(
          `Expected "--profile" to be one of "${PROFILE_FULL}", "${PROFILE_RUNTIME_FOUNDATION}", or "${PROFILE_ADAPTER_SLICE}".`,
        );
      }
      options.profileId = profileId;
      index += 1;
      continue;
    }
    if (argument === '--adapter') {
      const adapterId = args[index + 1]?.trim();
      if (!adapterId || !(adapterId in ADAPTER_CONFIG)) {
        throw new Error(
          `Expected "--adapter" to be one of: ${Object.keys(ADAPTER_CONFIG).join(', ')}.`,
        );
      }
      options.adapterId = /** @type {keyof typeof ADAPTER_CONFIG} */ (adapterId);
      index += 1;
      continue;
    }
    if (argument === '--base-ref') {
      const baseRef = args[index + 1]?.trim();
      if (!baseRef) {
        throw new Error('Expected "--base-ref" to be followed by one git ref.');
      }
      options.baseRef = baseRef;
      index += 1;
      continue;
    }
    if (argument === '--head-ref') {
      const headRef = args[index + 1]?.trim();
      if (!headRef) {
        throw new Error('Expected "--head-ref" to be followed by one git ref.');
      }
      options.headRef = headRef;
      index += 1;
      continue;
    }
    if (argument === '--dry-run') {
      options.dryRun = true;
      continue;
    }
    if (argument === '--execute') {
      options.execute = true;
    }
  }

  if (options.execute) {
    options.dryRun = false;
  }

  return options;
}

/**
 * Executes one git command and returns trimmed non-empty lines.
 * @param {string[]} args Git CLI arguments.
 * @returns {string[]}
 */
function readGitLines(args) {
  const stdout = execFileSync('git', args, {
    cwd: process.cwd(),
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  return stdout
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

/**
 * Expands raw base-ref seeds into de-duplicated candidate refs.
 * @param {Array<string | null | undefined>} rawValues Candidate seed values.
 * @returns {string[]}
 */
function expandBaseRefCandidates(rawValues) {
  const candidates = [];
  const seedValues = rawValues.filter(
    (value) => typeof value === 'string' && value.trim().length > 0,
  );

  for (const rawValue of seedValues) {
    const trimmedValue = rawValue.trim();
    candidates.push(trimmedValue);
    if (!trimmedValue.startsWith('origin/')) {
      candidates.push(`origin/${trimmedValue}`);
    }
  }

  return Array.from(new Set(candidates));
}

/**
 * Resolves available base-ref candidates for CI or local diff routing.
 * @param {string | null} explicitBaseRef User-provided base ref.
 * @returns {string[]}
 */
function resolveBaseRefCandidates(explicitBaseRef) {
  if (typeof explicitBaseRef === 'string' && explicitBaseRef.trim().length > 0) {
    return expandBaseRefCandidates([explicitBaseRef]);
  }

  const envBaseRef = process.env.REPO_AI_GOVERNOR_AFFECTED_BASE_REF ?? process.env.GITHUB_BASE_REF;
  return expandBaseRefCandidates([envBaseRef]);
}

/**
 * Returns whether one git ref resolves in the current repository.
 * @param {string} gitRef Candidate git ref.
 * @returns {boolean}
 */
function gitRefExists(gitRef) {
  const result = spawnSync('git', ['rev-parse', '--verify', gitRef], {
    cwd: process.cwd(),
    stdio: 'ignore',
  });
  return result.status === 0;
}

/**
 * Normalizes one repo-relative path for classification.
 * @param {string} filePath Raw repo-relative path.
 * @returns {string}
 */
function normalizeRepositoryPath(filePath) {
  return filePath.replace(/\\/gu, '/').replace(/^\.\//u, '');
}

/**
 * Resolves changed files either from explicit overrides, base-ref diff, or working-tree state.
 * @param {CliExecCompatibilityArguments} options Script selection options.
 * @returns {{ changedFiles: string[]; source: "explicit" | "git_range" | "working_tree"; baseRef: string | null; headRef: string | null }}
 */
function resolveChangedFiles(options) {
  if (options.changedFiles.length > 0) {
    return {
      changedFiles: Array.from(new Set(options.changedFiles.map(normalizeRepositoryPath))).sort(),
      source: 'explicit',
      baseRef: null,
      headRef: null,
    };
  }

  const headRef = options.headRef ?? DEFAULT_HEAD_REF;
  const baseRefCandidates = resolveBaseRefCandidates(options.baseRef);
  for (const baseRef of baseRefCandidates) {
    if (!gitRefExists(baseRef)) {
      continue;
    }

    const changedFiles = readGitLines([
      'diff',
      '--name-only',
      '--diff-filter=ACMR',
      `${baseRef}...${headRef}`,
    ]).map(normalizeRepositoryPath);
    return {
      changedFiles: Array.from(new Set(changedFiles)).sort(),
      source: 'git_range',
      baseRef,
      headRef,
    };
  }

  if (typeof options.baseRef === 'string' && options.baseRef.trim().length > 0) {
    throw new Error(`Explicit base ref "${options.baseRef}" could not be resolved locally.`);
  }

  const changedFiles = [
    ...readGitLines(['diff', '--name-only', '--diff-filter=ACMR']),
    ...readGitLines(['diff', '--cached', '--name-only', '--diff-filter=ACMR']),
    ...readGitLines(['ls-files', '--others', '--exclude-standard']),
  ].map(normalizeRepositoryPath);

  return {
    changedFiles: Array.from(new Set(changedFiles)).sort(),
    source: 'working_tree',
    baseRef: null,
    headRef: null,
  };
}

/**
 * Returns whether one path is docs/governance-only and does not require compatibility routing.
 * @param {string} filePath Repository-relative path.
 * @returns {boolean}
 */
function isDocOnlyPath(filePath) {
  return DOC_ONLY_PREFIXES.some((prefix) => filePath === prefix || filePath.startsWith(prefix));
}

/**
 * Returns the adapters touched by the changed-file set.
 * @param {string[]} changedFiles Repository-relative changed files.
 * @returns {Array<keyof typeof ADAPTER_CONFIG>}
 */
function resolveTouchedAdapters(changedFiles) {
  return /** @type {Array<keyof typeof ADAPTER_CONFIG>} */ (
    Object.entries(ADAPTER_CONFIG)
      .filter(([, adapterConfig]) =>
        changedFiles.some((changedFile) =>
          adapterConfig.compatibilityTriggerPaths.includes(changedFile),
        ),
      )
      .map(([adapterId]) => adapterId)
  );
}

/**
 * Returns whether the change set touches full-profile trigger surfaces.
 * @param {string[]} changedFiles Repository-relative changed files.
 * @returns {boolean}
 */
function touchesFullProfileSurface(changedFiles) {
  return changedFiles.some((changedFile) =>
    FULL_PROFILE_TRIGGER_PATHS.some((path) => changedFile === path),
  );
}

/**
 * Returns whether the change set touches shared runtime foundation surfaces.
 * @param {string[]} changedFiles Repository-relative changed files.
 * @returns {boolean}
 */
function touchesSharedRuntimeFoundation(changedFiles) {
  return changedFiles.some((changedFile) =>
    SHARED_RUNTIME_FOUNDATION_TRIGGER_PATHS.some((path) => changedFile === path),
  );
}

/**
 * Builds the exact pnpm exec command for one selected profile.
 * @param {CliExecCompatibilityProfileId} profileId Selected profile id.
 * @param {keyof typeof ADAPTER_CONFIG | null} adapterId Selected adapter when adapter-slice routing is used.
 * @returns {{ command: string; commandArgs: string[] }}
 */
function buildCommandForProfile(profileId, adapterId) {
  const pnpmArgs = ['exec', 'vitest', 'run'];
  if (profileId === PROFILE_FULL) {
    const commandArgs = [...pnpmArgs, ...FULL_PROFILE_TEST_PATHS];
    return { command: `pnpm ${commandArgs.join(' ')}`, commandArgs };
  }
  if (profileId === PROFILE_RUNTIME_FOUNDATION) {
    const commandArgs = [...pnpmArgs, ...RUNTIME_FOUNDATION_PROFILE_TEST_PATHS];
    return { command: `pnpm ${commandArgs.join(' ')}`, commandArgs };
  }
  if (!adapterId) {
    throw new Error(
      'The adapter-slice profile requires "--adapter <codex|claude-code|github-copilot>" or a single-adapter changed-file set.',
    );
  }
  const commandArgs = [...pnpmArgs, ADAPTER_CONFIG[adapterId].smokeTestPath];
  return { command: `pnpm ${commandArgs.join(' ')}`, commandArgs };
}

/**
 * Resolves one compatibility profile from explicit input or trigger-matrix inference.
 * @param {CliExecCompatibilityArguments} options Script selection options.
 * @returns {CliExecCompatibilitySelection}
 */
function resolveSelection(options) {
  const changedFilesResolution = resolveChangedFiles(options);
  const changedFiles = changedFilesResolution.changedFiles;
  const touchedAdapters = resolveTouchedAdapters(changedFiles);

  if (options.profileId) {
    const adapterId =
      options.profileId === PROFILE_ADAPTER_SLICE
        ? (options.adapterId ?? (touchedAdapters.length === 1 ? touchedAdapters[0] : null))
        : null;
    const { command, commandArgs } = buildCommandForProfile(options.profileId, adapterId);
    return {
      profileId: options.profileId,
      reason: 'explicit_profile',
      adapterId,
      changedFiles,
      touchedAdapters,
      command,
      commandArgs,
      source: changedFilesResolution.source,
      baseRef: changedFilesResolution.baseRef,
      headRef: changedFilesResolution.headRef,
    };
  }

  if (changedFiles.length === 0) {
    return {
      profileId: null,
      reason: 'no_cli_exec_runtime_change_detected',
      adapterId: null,
      changedFiles,
      touchedAdapters,
      command: null,
      commandArgs: null,
      source: changedFilesResolution.source,
      baseRef: changedFilesResolution.baseRef,
      headRef: changedFilesResolution.headRef,
    };
  }

  if (changedFiles.every(isDocOnlyPath)) {
    return {
      profileId: null,
      reason: 'docs_only_change',
      adapterId: null,
      changedFiles,
      touchedAdapters,
      command: null,
      commandArgs: null,
      source: changedFilesResolution.source,
      baseRef: changedFilesResolution.baseRef,
      headRef: changedFilesResolution.headRef,
    };
  }

  if (touchesFullProfileSurface(changedFiles)) {
    const { command, commandArgs } = buildCommandForProfile(PROFILE_FULL, null);
    return {
      profileId: PROFILE_FULL,
      reason: 'shared_runtime_or_consumer_changed',
      adapterId: null,
      changedFiles,
      touchedAdapters,
      command,
      commandArgs,
      source: changedFilesResolution.source,
      baseRef: changedFilesResolution.baseRef,
      headRef: changedFilesResolution.headRef,
    };
  }

  if (touchedAdapters.length > 1) {
    const { command, commandArgs } = buildCommandForProfile(PROFILE_RUNTIME_FOUNDATION, null);
    return {
      profileId: PROFILE_RUNTIME_FOUNDATION,
      reason: 'cross_adapter_slice_changed',
      adapterId: null,
      changedFiles,
      touchedAdapters,
      command,
      commandArgs,
      source: changedFilesResolution.source,
      baseRef: changedFilesResolution.baseRef,
      headRef: changedFilesResolution.headRef,
    };
  }

  if (touchesSharedRuntimeFoundation(changedFiles)) {
    const { command, commandArgs } = buildCommandForProfile(PROFILE_RUNTIME_FOUNDATION, null);
    return {
      profileId: PROFILE_RUNTIME_FOUNDATION,
      reason: 'shared_runtime_foundation_changed',
      adapterId: null,
      changedFiles,
      touchedAdapters,
      command,
      commandArgs,
      source: changedFilesResolution.source,
      baseRef: changedFilesResolution.baseRef,
      headRef: changedFilesResolution.headRef,
    };
  }

  if (touchedAdapters.length === 1) {
    const adapterId = touchedAdapters[0];
    const { command, commandArgs } = buildCommandForProfile(PROFILE_ADAPTER_SLICE, adapterId);
    return {
      profileId: PROFILE_ADAPTER_SLICE,
      reason: 'single_adapter_slice_changed',
      adapterId,
      changedFiles,
      touchedAdapters,
      command,
      commandArgs,
      source: changedFilesResolution.source,
      baseRef: changedFilesResolution.baseRef,
      headRef: changedFilesResolution.headRef,
    };
  }

  return {
    profileId: null,
    reason: 'no_cli_exec_runtime_change_detected',
    adapterId: null,
    changedFiles,
    touchedAdapters,
    command: null,
    commandArgs: null,
    source: changedFilesResolution.source,
    baseRef: changedFilesResolution.baseRef,
    headRef: changedFilesResolution.headRef,
  };
}

/**
 * Prints one compatibility-selection summary.
 * @param {CliExecCompatibilitySelection} selection Resolved selection payload.
 * @param {"pretty" | "json"} outputMode Requested output mode.
 */
function printSelection(selection, outputMode) {
  if (outputMode === OUTPUT_MODE_JSON) {
    process.stdout.write(`${JSON.stringify(selection, null, 2)}\n`);
    return;
  }

  const lines = [
    '[cli-exec-compatibility] compatibility profile routing summary',
    `profile=${selection.profileId ?? 'none'} reason=${selection.reason} source=${selection.source}`,
  ];
  if (selection.adapterId) {
    lines.push(`adapter=${selection.adapterId}`);
  }
  if (selection.changedFiles.length > 0) {
    lines.push(`changed_files=${selection.changedFiles.length}`);
    for (const changedFile of selection.changedFiles) {
      lines.push(`- ${changedFile}`);
    }
  } else {
    lines.push('changed_files=0');
  }
  if (selection.command) {
    lines.push(`command=${selection.command}`);
  } else {
    lines.push('command=not_required');
  }
  process.stdout.write(`${lines.join('\n')}\n`);
}

/**
 * Executes the selected command when one profile was resolved.
 * @param {CliExecCompatibilitySelection} selection Selected compatibility route.
 * @returns {number}
 */
function executeSelection(selection) {
  if (!selection.commandArgs) {
    return 0;
  }

  let result = spawnSync('pnpm', selection.commandArgs, {
    cwd: process.cwd(),
    stdio: 'inherit',
    env: process.env,
  });

  if (result.error?.code === 'ENOENT' && existsSync(FALLBACK_PNPM_BINARY)) {
    result = spawnSync(FALLBACK_PNPM_BINARY, selection.commandArgs, {
      cwd: process.cwd(),
      stdio: 'inherit',
      env: process.env,
    });
  }

  if (typeof result.status === 'number') {
    return result.status;
  }
  return 1;
}

try {
  const options = parseArguments();
  const selection = resolveSelection(options);
  printSelection(selection, options.outputMode);

  if (!options.execute) {
    process.exit(0);
  }

  process.exit(executeSelection(selection));
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`[cli-exec-compatibility] ${message}\n`);
  process.exit(1);
}
