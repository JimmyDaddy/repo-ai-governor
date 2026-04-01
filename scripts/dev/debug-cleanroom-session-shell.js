#!/usr/bin/env node

import { spawn, spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const PACKAGE_BINARY = 'repo-ai-governor';
const DEFAULT_INSTALL_MODE = 'link';
const SUPPORTED_INSTALL_MODE_SET = new Set(['link', 'path']);
const SCRIPT_DIRECTORY = dirname(fileURLToPath(import.meta.url));
const REPOSITORY_ROOT = resolve(SCRIPT_DIRECTORY, '..', '..');
const DIST_CLI_ENTRY_PATH = resolve(REPOSITORY_ROOT, 'dist', 'bin', 'repo-ai-governor.js');
const SKIPPED_SEED_ENTRY_NAME_SET = new Set([
  '.DS_Store',
  '.git',
  '.next',
  '.turbo',
  'coverage',
  'dist',
  'node_modules',
]);

const DEFAULT_REPO_LOCAL_CONFIG_CONTENT = [
  'schemaVersion: "1.1"',
  'workspace:',
  '  mode: repo_local',
  '  migrationPolicy: copy_verify_switch_rollback',
  'i18n:',
  '  runtimeEngine: i18next',
  '  defaultLocale: zh-CN',
  '  fallbackLocale: en-US',
  '  supportedLocales:',
  '    - zh-CN',
  '    - en-US',
  'memory:',
  '  storeEngine: fs_csv',
  '  storeRoot: context/memory',
  '',
].join('\n');

/**
 * Parses CLI options for interactive clean-room debugging.
 * @returns {{
 *   buildBeforeLaunch: boolean;
 *   keepTemp: boolean;
 *   mode: "link" | "path";
 *   passthroughArgs: string[];
 *   repositoryName: string;
 *   seedFrom: string | null;
 * }}
 */
function parseCliOptions() {
  const args = process.argv.slice(2);
  let mode = DEFAULT_INSTALL_MODE;
  let keepTemp = true;
  let buildBeforeLaunch = true;
  let repositoryName = 'cleanroom-session-shell';
  let seedFrom = null;
  /** @type {string[]} */
  const passthroughArgs = [];

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    }

    if (arg === '--mode') {
      const value = args[index + 1]?.trim().toLowerCase();
      if (!value || !SUPPORTED_INSTALL_MODE_SET.has(value)) {
        throw new Error(
          `Expected "--mode" to be one of: ${Array.from(SUPPORTED_INSTALL_MODE_SET).join(', ')}`,
        );
      }
      mode = /** @type {"link" | "path"} */ (value);
      index += 1;
      continue;
    }

    if (arg === '--message') {
      const value = args[index + 1];
      if (typeof value !== 'string' || value.trim().length === 0) {
        throw new Error('Expected a non-empty value after "--message".');
      }
      passthroughArgs.push(value.trim());
      index += 1;
      continue;
    }

    if (arg === '--repository-name') {
      const value = args[index + 1];
      if (typeof value !== 'string' || value.trim().length === 0) {
        throw new Error('Expected a non-empty value after "--repository-name".');
      }
      repositoryName = value.trim();
      index += 1;
      continue;
    }

    if (arg === '--seed-from') {
      const value = args[index + 1];
      if (typeof value !== 'string' || value.trim().length === 0) {
        throw new Error('Expected a non-empty value after "--seed-from".');
      }
      seedFrom = resolve(value.trim());
      index += 1;
      continue;
    }

    if (arg === '--skip-build') {
      buildBeforeLaunch = false;
      continue;
    }

    if (arg === '--keep-temp') {
      keepTemp = true;
      continue;
    }

    if (arg === '--cleanup') {
      keepTemp = false;
      continue;
    }

    if (arg === '--') {
      passthroughArgs.push(...args.slice(index + 1));
      break;
    }

    throw new Error(`Unsupported option: ${arg}`);
  }

  return {
    buildBeforeLaunch,
    keepTemp,
    mode,
    passthroughArgs,
    repositoryName,
    seedFrom,
  };
}

/**
 * Prints script usage.
 */
function printHelp() {
  console.info(
    [
      'Usage:',
      '  node ./scripts/dev/debug-cleanroom-session-shell.js [options] [-- <repo-ai-governor args...>]',
      '',
      'Options:',
      '  --mode <link|path>         Install the current workspace into the clean-room repo (default: link)',
      '  --seed-from <path>         Copy one real project into the clean-room repo before installing governor',
      '  --message <text>           Start the session with one initial user message',
      '  --repository-name <name>   Override the generated clean-room package name',
      '  --skip-build               Reuse the current dist output instead of rebuilding first',
      '  --keep-temp                Preserve the clean-room directory after exit (default)',
      '  --cleanup                  Remove the clean-room directory after exit',
      '  -h, --help                 Show this help text',
      '',
      'Examples:',
      '  pnpm run debug:cleanroom-session-shell',
      '  pnpm run debug:cleanroom-session-shell -- --message "你好"',
      '  pnpm run debug:cleanroom-session-shell -- --seed-from /Users/jimmydaddy/study/playground --message "帮我 cr 代码"',
      '  pnpm run debug:cleanroom-session-shell:path -- --message "帮我 review 代码"',
      '  pnpm run debug:cleanroom-session-shell -- -- doctor --output pretty',
      '',
      'Notes:',
      '  - This script creates a temporary target repository and forces repo_local mode there.',
      '  - When --seed-from is provided, the source project is copied first; node_modules/.git/dist and other heavy transient folders are skipped.',
      '  - Your current machine auth/config stays available to Codex / Claude Code / Copilot.',
      '  - Clean-room artifacts are isolated under the temp repository instead of your main adopter repo.',
    ].join('\n'),
  );
}

/**
 * Runs one setup command and exits on failure.
 * @param {string} command Command binary.
 * @param {string[]} args Command args.
 * @param {{cwd: string; env?: NodeJS.ProcessEnv; label: string}} options Command options.
 */
function runSetupCommand(command, args, options) {
  const startedAtMs = Date.now();
  console.info(`[debug-cleanroom-session-shell] ${options.label}: ${command} ${args.join(' ')}`);
  const result = spawnSync(command, args, {
    cwd: options.cwd,
    env: options.env ?? process.env,
    encoding: 'utf8',
    stdio: 'inherit',
  });
  const durationMs = Date.now() - startedAtMs;

  if (result.error) {
    throw new Error(`${options.label} failed to execute: ${result.error.message}`);
  }

  if (result.status !== 0) {
    throw new Error(`${options.label} failed with exit=${String(result.status ?? 1)}`);
  }

  console.info(`[debug-cleanroom-session-shell] ${options.label}: completed in ${durationMs}ms`);
}

/**
 * Creates the clean-room repository scaffold.
 * @param {string} repositoryPath Absolute target repository path.
 * @param {string} repositoryName Repository package name.
 */
function initializeCleanroomRepository(repositoryPath, repositoryName) {
  mkdirSync(repositoryPath, { recursive: true });
  writeFileSync(
    resolve(repositoryPath, 'package.json'),
    `${JSON.stringify(
      {
        name: repositoryName,
        private: true,
        version: '0.0.0',
        type: 'module',
      },
      null,
      2,
    )}\n`,
    'utf8',
  );

  const governorConfigPath = resolve(repositoryPath, '.repo-ai-governor', 'governor.yaml');
  mkdirSync(dirname(governorConfigPath), { recursive: true });
  writeFileSync(governorConfigPath, DEFAULT_REPO_LOCAL_CONFIG_CONTENT, 'utf8');
}

/**
 * Copies one source project into the clean-room repository while skipping heavyweight transient paths.
 * @param {string} sourcePath Absolute source project path.
 * @param {string} repositoryPath Absolute clean-room repository path.
 */
function seedRepositoryFromPath(sourcePath, repositoryPath) {
  if (!existsSync(sourcePath)) {
    throw new Error(`Seed source path does not exist: ${sourcePath}`);
  }

  mkdirSync(repositoryPath, { recursive: true });
  cpSync(sourcePath, repositoryPath, {
    recursive: true,
    filter: (candidatePath) => !SKIPPED_SEED_ENTRY_NAME_SET.has(basename(candidatePath)),
  });
}

/**
 * Resolves one install specifier for the selected mode.
 * @param {"link" | "path"} mode Install mode.
 * @returns {string}
 */
function resolveInstallSpecifier(mode) {
  if (mode === 'path') {
    return REPOSITORY_ROOT;
  }

  if (mode === 'link') {
    return `link:${REPOSITORY_ROOT}`;
  }

  throw new Error(`Unsupported install mode: ${mode}`);
}

/**
 * Ensures repo-ai-governor dist exists before installation.
 * @param {boolean} buildBeforeLaunch Whether to rebuild first.
 */
function ensureDistributionReady(buildBeforeLaunch) {
  if (buildBeforeLaunch || !existsSync(DIST_CLI_ENTRY_PATH)) {
    runSetupCommand('pnpm', ['run', 'build'], {
      cwd: REPOSITORY_ROOT,
      label: buildBeforeLaunch ? 'build current workspace' : 'build missing dist output',
    });
  }
}

/**
 * Normalizes args forwarded into repo-ai-governor.
 * @param {string[]} passthroughArgs Raw passthrough args.
 * @returns {string[]}
 */
function buildCliArgs(passthroughArgs) {
  const normalizedArgs = [...passthroughArgs];
  const suppressOutputInjection = normalizedArgs.some(
    (arg) => arg === '--help' || arg === '-h' || arg === '--version' || arg === '-V',
  );
  const hasOutputFlag = normalizedArgs.some(
    (arg) => arg === '--output' || arg.startsWith('--output='),
  );

  if (!suppressOutputInjection && !hasOutputFlag) {
    normalizedArgs.push('--output', 'pretty');
  }

  return normalizedArgs;
}

/**
 * Removes the temp root when cleanup is requested.
 * @param {string} tempRoot Absolute temp root.
 */
function cleanupTempRoot(tempRoot) {
  rmSync(tempRoot, { recursive: true, force: true });
}

const options = parseCliOptions();
const tempRoot = mkdtempSync(resolve(tmpdir(), 'repo-ai-governor-session-shell-'));
const repositoryPath = resolve(tempRoot, 'target-repo');
const workspaceRoot = resolve(repositoryPath, '.repo-ai-governor');
const cliArgs = buildCliArgs(options.passthroughArgs);

try {
  ensureDistributionReady(options.buildBeforeLaunch);
  if (options.seedFrom) {
    seedRepositoryFromPath(options.seedFrom, repositoryPath);
  } else {
    initializeCleanroomRepository(repositoryPath, options.repositoryName);
  }
  if (!existsSync(resolve(repositoryPath, 'package.json'))) {
    initializeCleanroomRepository(repositoryPath, options.repositoryName);
  } else {
    const governorConfigPath = resolve(repositoryPath, '.repo-ai-governor', 'governor.yaml');
    mkdirSync(dirname(governorConfigPath), { recursive: true });
    writeFileSync(governorConfigPath, DEFAULT_REPO_LOCAL_CONFIG_CONTENT, 'utf8');
  }
  runSetupCommand('pnpm', ['add', '--save-exact', resolveInstallSpecifier(options.mode)], {
    cwd: repositoryPath,
    label: `install ${options.mode}`,
  });
} catch (error) {
  console.error(
    `[debug-cleanroom-session-shell] setup failed: ${error instanceof Error ? error.message : String(error)}`,
  );
  console.error(`[debug-cleanroom-session-shell] temp_root=${tempRoot}`);
  process.exit(1);
}

console.info('[debug-cleanroom-session-shell] clean-room ready');
console.info(`[debug-cleanroom-session-shell] repository_root=${repositoryPath}`);
console.info(`[debug-cleanroom-session-shell] workspace_root=${workspaceRoot}`);
if (options.seedFrom) {
  console.info(`[debug-cleanroom-session-shell] seed_from=${options.seedFrom}`);
}
console.info(`[debug-cleanroom-session-shell] keep_temp=${options.keepTemp}`);
console.info(
  `[debug-cleanroom-session-shell] launch=pnpm exec ${PACKAGE_BINARY} ${cliArgs.join(' ')}`,
);

if (!process.stdin.isTTY || !process.stdout.isTTY) {
  console.warn(
    '[debug-cleanroom-session-shell] current terminal is not a full TTY; interactive shell features may be limited.',
  );
}

const child = spawn('pnpm', ['exec', PACKAGE_BINARY, ...cliArgs], {
  cwd: repositoryPath,
  env: process.env,
  stdio: 'inherit',
});

const forwardSignal = (signal) => {
  if (!child.killed) {
    child.kill(signal);
  }
};

process.on('SIGINT', forwardSignal);
process.on('SIGTERM', forwardSignal);

child.on('error', (error) => {
  console.error(`[debug-cleanroom-session-shell] launch failed: ${error.message}`);
  console.error(`[debug-cleanroom-session-shell] temp_root=${tempRoot}`);
  process.exit(1);
});

child.on('close', (code, signal) => {
  process.off('SIGINT', forwardSignal);
  process.off('SIGTERM', forwardSignal);

  if (!options.keepTemp) {
    cleanupTempRoot(tempRoot);
  } else {
    console.info(`[debug-cleanroom-session-shell] temp_root preserved at ${tempRoot}`);
  }

  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 1);
});
