import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const CURRENT_CONTEXT_PATH = '.repo-ai-governor/context/current-context.md';
const DEV_CONTEXT_ROOT = '.repo-ai-governor/context/dev';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const BOOTSTRAP_SCRIPT_PATH = resolve(__dirname, 'bootstrap-cr-round.mjs');
const SCOPE_KIND_SET = new Set(['task', 'sprint', 'project']);
const VALUE_OPTIONS = new Set([
  'scope',
  'scope-kind',
  'scope-label',
  'scope-path',
  'tasks-dir',
  'review-dir',
  'round-type',
  'round-number',
  'report-slug',
  'cr-task-id',
  'enclosing-sprint-label',
  'date',
  'owner',
  'priority',
  'title',
  'goal',
  'extra-doc',
  'verification',
  'review-focus',
  'review-surface',
  'depends-on',
  'required-input',
  'traceback',
  'implementation-step',
  'development-verification',
  'delivery-verification',
  'output',
  'suggested-commit-message',
  'commit-message',
  'commit-path',
  'pre-commit-gate',
  'task-ledger-mode',
]);
const BOOLEAN_FLAGS = new Set([
  'help',
  'h',
  'json',
  'resume',
  'no-resume',
  'write-task-card',
  'no-write-task-card',
  'suggest-commit',
  'auto-commit',
  'commit-all',
]);

function fail(message) {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}

function printHelp() {
  process.stdout.write(
    `Usage:
  node ./.codex/skills/workspace-scoped-cr-loop/scripts/resume-or-bootstrap-cr-round.mjs \\
    [--scope <TK-xxx|sprint-xxx|project-xxx|task/sprint/project-path>] \\
    [--tasks-dir <sprint/tasks>] \\
    [--verification "<command>"]... \\
    [--review-surface "<path-or-slice>"]... \\
    [--json]

What this wrapper does:
  - defaults to --resume
  - defaults to --write-task-card
  - infers scope kind/label from --scope when possible
  - infers tasks-dir from current-context or repo context when possible
  - resolves task cards by TK id prefix so TK-xxx-<slug>.md works in this repo
  - forwards the resolved arguments to bootstrap-cr-round.mjs

Common examples:
  node ./.codex/skills/workspace-scoped-cr-loop/scripts/resume-or-bootstrap-cr-round.mjs
  node ./.codex/skills/workspace-scoped-cr-loop/scripts/resume-or-bootstrap-cr-round.mjs --scope TK-615
  node ./.codex/skills/workspace-scoped-cr-loop/scripts/resume-or-bootstrap-cr-round.mjs --scope sprint-001-real-target-repo-adopter-pilot
  node ./.codex/skills/workspace-scoped-cr-loop/scripts/resume-or-bootstrap-cr-round.mjs --scope project-055-ga-evidence-and-adopter-pilot-closeout
  node ./.codex/skills/workspace-scoped-cr-loop/scripts/resume-or-bootstrap-cr-round.mjs --scope .repo-ai-governor/context/dev/project-055-ga-evidence-and-adopter-pilot-closeout/sprint-001-real-target-repo-adopter-pilot/tasks/TK-615-execute-pilot-2-upgrade-workspace-migration-rollback-rehearsal-and-capture-delta-findings.md

Notes:
  - With no --scope, the wrapper defaults to the active sprint in current-context.md.
  - For project scope, if tasks-dir cannot be inferred from the active stream, the wrapper
    falls back to the latest sprint under that project.
  - If repeated TK/sprint/project ids exist, an explicit --tasks-dir is used as the first
    disambiguation hint before falling back to repo-wide search.
  - If repeated task cards still remain after the tasks-dir hint, pass a full --scope-path.
  - Use advanced flags like --round-type / --cr-task-id / --commit-path as needed; they are
    forwarded through to bootstrap-cr-round.mjs.
`,
  );
}

function parseArgs(argv) {
  const options = {
    forwarded: [],
    resume: true,
    writeTaskCard: true,
    help: false,
    json: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (!arg.startsWith('--')) {
      fail(`Unexpected argument: ${arg}`);
    }

    const key = arg.slice(2);

    if (BOOLEAN_FLAGS.has(key)) {
      switch (key) {
        case 'help':
        case 'h':
          options.help = true;
          break;
        case 'json':
          options.json = true;
          options.forwarded.push(arg);
          break;
        case 'resume':
          options.resume = true;
          break;
        case 'no-resume':
          options.resume = false;
          break;
        case 'write-task-card':
          options.writeTaskCard = true;
          break;
        case 'no-write-task-card':
          options.writeTaskCard = false;
          break;
        default:
          options.forwarded.push(arg);
          break;
      }
      continue;
    }

    if (!VALUE_OPTIONS.has(key)) {
      fail(`Unknown option: --${key}`);
    }

    const value = argv[index + 1];
    if (typeof value !== 'string' || value.startsWith('--')) {
      fail(`Missing value for --${key}`);
    }

    switch (key) {
      case 'scope':
        options.scope = value;
        break;
      case 'scope-kind':
        options.scopeKind = value;
        break;
      case 'scope-label':
        options.scopeLabel = value;
        break;
      case 'scope-path':
        options.scopePath = value;
        break;
      case 'tasks-dir':
        options.tasksDir = value;
        break;
      default:
        options.forwarded.push(arg, value);
        break;
    }

    index += 1;
  }

  return options;
}

function readCurrentContextPrimary() {
  const absolutePath = resolve(process.cwd(), CURRENT_CONTEXT_PATH);
  if (!existsSync(absolutePath)) {
    fail(`Current context not found: ${absolutePath}`);
  }

  const content = readFileSync(absolutePath, 'utf8');
  const primaryMatch = content.match(
    /- `primary`: .*?project=`([^`]+)`, sprint=`([^`]+)`, docs=`([^`]+)`, plan=`([^`]+)`, tasks=`([^`]+)`, checklist=`([^`]+)`, csv=`([^`]+)`, review=`([^`]+)`, status=`([^`]+)`/su,
  );

  if (!primaryMatch) {
    fail('Unable to parse primary stream from current-context.md');
  }

  return {
    project: primaryMatch[1],
    sprint: primaryMatch[2],
    docs: primaryMatch[3],
    plan: primaryMatch[4],
    tasks: primaryMatch[5],
    checklist: primaryMatch[6],
    csv: primaryMatch[7],
    review: primaryMatch[8],
    status: primaryMatch[9],
  };
}

function walk(rootPath, onEntry) {
  if (!existsSync(rootPath)) {
    return;
  }

  for (const entry of readdirSync(rootPath, { withFileTypes: true })) {
    const absolutePath = join(rootPath, entry.name);
    onEntry(absolutePath, entry);
    if (entry.isDirectory()) {
      walk(absolutePath, onEntry);
    }
  }
}

function matchesTaskCardFilename(filename, label) {
  return (
    filename === `${label}.md` || (filename.startsWith(`${label}-`) && filename.endsWith('.md'))
  );
}

function findUniqueTaskCard(label) {
  const root = resolve(process.cwd(), DEV_CONTEXT_ROOT);
  const matches = [];

  walk(root, (absolutePath, entry) => {
    if (entry.isFile() && matchesTaskCardFilename(entry.name, label)) {
      matches.push(absolutePath);
    }
  });

  if (matches.length === 0) {
    fail(`Unable to locate task card for ${label}. Provide --tasks-dir or a full --scope-path.`);
  }

  if (matches.length > 1) {
    fail(
      `Multiple task cards matched ${label}. Provide --tasks-dir or a full --scope-path. Matches: ${matches.join(', ')}`,
    );
  }

  return matches[0];
}

function findUniqueDirectory(label) {
  const root = resolve(process.cwd(), DEV_CONTEXT_ROOT);
  const matches = [];

  walk(root, (absolutePath, entry) => {
    if (entry.isDirectory() && basename(absolutePath) === label) {
      matches.push(absolutePath);
    }
  });

  if (matches.length === 0) {
    fail(`Unable to locate directory for ${label}. Provide --tasks-dir or a full --scope-path.`);
  }

  if (matches.length > 1) {
    fail(
      `Multiple directories matched ${label}. Provide --tasks-dir or a full --scope-path. Matches: ${matches.join(', ')}`,
    );
  }

  return matches[0];
}

function listSprintDirectories(projectDir) {
  return readdirSync(projectDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && /^sprint-\d{3}/u.test(entry.name))
    .map((entry) => join(projectDir, entry.name))
    .sort((left, right) => basename(right).localeCompare(basename(left)));
}

function inferScopeFromPath(scopePath) {
  const absolutePath = resolve(process.cwd(), scopePath);

  if (!existsSync(absolutePath)) {
    fail(`Scope path does not exist: ${absolutePath}`);
  }

  const base = basename(absolutePath);

  if (/^TK-\d{3}(?:[^/]*)?\.md$/u.test(base)) {
    return {
      scopeKind: 'task',
      scopeLabel: base.match(/^(TK-\d{3})/u)?.[1] ?? basename(base, '.md'),
      scopePath: absolutePath,
      tasksDir: dirname(absolutePath),
    };
  }

  if (base.startsWith('sprint-')) {
    const tasksDir = join(absolutePath, 'tasks');
    if (!existsSync(tasksDir)) {
      fail(`Sprint path does not contain tasks/: ${absolutePath}`);
    }

    return {
      scopeKind: 'sprint',
      scopeLabel: base,
      scopePath: absolutePath,
      tasksDir,
    };
  }

  if (base.startsWith('project-')) {
    return {
      scopeKind: 'project',
      scopeLabel: base,
      scopePath: absolutePath,
    };
  }

  fail(`Unable to infer scope kind from path: ${absolutePath}`);
}

function inferScopeKindFromLabel(scope) {
  if (/^TK-\d{3}/u.test(scope)) {
    return 'task';
  }

  if (scope.startsWith('sprint-')) {
    return 'sprint';
  }

  if (scope.startsWith('project-')) {
    return 'project';
  }

  return null;
}

function resolveScopeFromInferredPath(inferred, options, primary) {
  if (options.scopeKind && options.scopeKind !== inferred.scopeKind) {
    fail(
      `--scope-kind ${options.scopeKind} conflicts with inferred scope kind ${inferred.scopeKind} from ${inferred.scopePath}.`,
    );
  }

  if (options.scopeLabel && options.scopeLabel !== inferred.scopeLabel) {
    fail(
      `--scope-label ${options.scopeLabel} conflicts with inferred scope label ${inferred.scopeLabel} from ${inferred.scopePath}.`,
    );
  }

  const tasksDir = options.tasksDir
    ? resolve(process.cwd(), options.tasksDir)
    : (inferred.tasksDir ??
      (inferred.scopeKind === 'project'
        ? resolveProjectTasksDir(inferred.scopePath, primary)
        : null));

  if (!tasksDir) {
    fail(`Unable to infer tasks directory for scope path: ${inferred.scopePath}`);
  }

  return {
    scopeKind: inferred.scopeKind,
    scopeLabel: inferred.scopeLabel,
    scopePath: inferred.scopePath,
    tasksDir,
  };
}

function findHintedTaskCard(hintedTasksDir, scopeLabel) {
  const matches = readdirSync(hintedTasksDir)
    .filter((filename) => matchesTaskCardFilename(filename, scopeLabel))
    .sort((left, right) => left.localeCompare(right));

  if (matches.length === 0) {
    return null;
  }

  if (matches.length > 1) {
    fail(
      `Multiple task cards matched ${scopeLabel} inside ${hintedTasksDir}. Provide --scope-path explicitly. Matches: ${matches.join(', ')}`,
    );
  }

  return join(hintedTasksDir, matches[0]);
}

function resolveScopeFromTasksDirHint(scopeKind, scopeLabel, options) {
  if (!options.tasksDir) {
    return null;
  }

  const hintedTasksDir = resolve(process.cwd(), options.tasksDir);
  if (!existsSync(hintedTasksDir)) {
    fail(`Provided --tasks-dir does not exist: ${hintedTasksDir}`);
  }

  if (scopeKind === 'task') {
    const hintedTaskCardPath = findHintedTaskCard(hintedTasksDir, scopeLabel);
    if (hintedTaskCardPath) {
      return {
        scopeKind: 'task',
        scopeLabel,
        scopePath: hintedTaskCardPath,
        tasksDir: hintedTasksDir,
      };
    }

    return null;
  }

  const hintedSprintDir = dirname(hintedTasksDir);
  if (scopeKind === 'sprint' && basename(hintedSprintDir) === scopeLabel) {
    return {
      scopeKind: 'sprint',
      scopeLabel,
      scopePath: hintedSprintDir,
      tasksDir: hintedTasksDir,
    };
  }

  const hintedProjectDir = dirname(hintedSprintDir);
  if (scopeKind === 'project' && basename(hintedProjectDir) === scopeLabel) {
    return {
      scopeKind: 'project',
      scopeLabel,
      scopePath: hintedProjectDir,
      tasksDir: hintedTasksDir,
    };
  }

  return null;
}

function resolveProjectTasksDir(projectDir, primary) {
  const normalizedPrimaryTasks = resolve(process.cwd(), primary.tasks);
  if (
    primary.project === basename(projectDir) &&
    normalizedPrimaryTasks.startsWith(resolve(projectDir))
  ) {
    return normalizedPrimaryTasks;
  }

  for (const sprintDir of listSprintDirectories(projectDir)) {
    const tasksDir = join(sprintDir, 'tasks');
    if (existsSync(tasksDir)) {
      return tasksDir;
    }
  }

  fail(`Unable to infer sprint tasks directory for project scope: ${projectDir}`);
}

function resolveScope(options, primary) {
  if (options.scopePath) {
    const inferred = inferScopeFromPath(options.scopePath);
    return resolveScopeFromInferredPath(inferred, options, primary);
  }

  if (options.scope) {
    const candidateScopePath = resolve(process.cwd(), options.scope);
    if (existsSync(candidateScopePath)) {
      const inferred = inferScopeFromPath(candidateScopePath);
      return resolveScopeFromInferredPath(inferred, options, primary);
    }

    const inferredScopeKind = options.scopeKind ?? inferScopeKindFromLabel(options.scope);
    const scopeLabel = options.scopeLabel ?? options.scope;

    if (!inferredScopeKind || !SCOPE_KIND_SET.has(inferredScopeKind)) {
      fail(
        `Unable to infer scope kind from '${options.scope}'. Supply --scope-kind explicitly or pass a full --scope-path.`,
      );
    }

    const hintedResolution = resolveScopeFromTasksDirHint(inferredScopeKind, scopeLabel, options);
    if (hintedResolution) {
      return hintedResolution;
    }

    if (inferredScopeKind === 'task') {
      const taskCardPath = findUniqueTaskCard(scopeLabel);
      return {
        scopeKind: 'task',
        scopeLabel,
        scopePath: taskCardPath,
        tasksDir: options.tasksDir
          ? resolve(process.cwd(), options.tasksDir)
          : dirname(taskCardPath),
      };
    }

    if (inferredScopeKind === 'sprint') {
      const sprintDir = findUniqueDirectory(scopeLabel);
      return {
        scopeKind: 'sprint',
        scopeLabel,
        scopePath: sprintDir,
        tasksDir: options.tasksDir
          ? resolve(process.cwd(), options.tasksDir)
          : join(sprintDir, 'tasks'),
      };
    }

    const projectDir = findUniqueDirectory(scopeLabel);
    return {
      scopeKind: 'project',
      scopeLabel,
      scopePath: projectDir,
      tasksDir: options.tasksDir
        ? resolve(process.cwd(), options.tasksDir)
        : resolveProjectTasksDir(projectDir, primary),
    };
  }

  const tasksDir = options.tasksDir
    ? resolve(process.cwd(), options.tasksDir)
    : resolve(process.cwd(), primary.tasks);
  const sprintDir = dirname(tasksDir);
  const projectDir = dirname(sprintDir);
  const scopeKind =
    options.scopeKind && SCOPE_KIND_SET.has(options.scopeKind) ? options.scopeKind : 'sprint';

  if (scopeKind === 'task') {
    fail('Task scope requires --scope TK-xxx or --scope-path <task-card>.');
  }

  if (scopeKind === 'project') {
    return {
      scopeKind,
      scopeLabel: options.scopeLabel ?? basename(projectDir),
      scopePath: options.scopePath ? resolve(process.cwd(), options.scopePath) : projectDir,
      tasksDir,
    };
  }

  return {
    scopeKind: 'sprint',
    scopeLabel: options.scopeLabel ?? basename(sprintDir),
    scopePath: options.scopePath ? resolve(process.cwd(), options.scopePath) : sprintDir,
    tasksDir,
  };
}

function validateResolvedScope(resolvedScope) {
  if (!SCOPE_KIND_SET.has(resolvedScope.scopeKind)) {
    fail(`Unsupported resolved scope kind: ${resolvedScope.scopeKind}`);
  }

  if (!existsSync(resolvedScope.tasksDir)) {
    fail(`Resolved tasks directory does not exist: ${resolvedScope.tasksDir}`);
  }

  if (!existsSync(resolvedScope.scopePath)) {
    fail(`Resolved scope path does not exist: ${resolvedScope.scopePath}`);
  }
}

function buildBootstrapArgs(options, resolvedScope) {
  const bootstrapArgs = [
    BOOTSTRAP_SCRIPT_PATH,
    '--tasks-dir',
    resolvedScope.tasksDir,
    '--scope-kind',
    resolvedScope.scopeKind,
    '--scope-label',
    resolvedScope.scopeLabel,
    '--scope-path',
    resolvedScope.scopePath,
  ];

  if (options.resume) {
    bootstrapArgs.push('--resume');
  }

  if (options.writeTaskCard) {
    bootstrapArgs.push('--write-task-card');
  }

  bootstrapArgs.push(...options.forwarded);
  return bootstrapArgs;
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printHelp();
    return;
  }

  const primary = readCurrentContextPrimary();
  const resolvedScope = resolveScope(options, primary);
  validateResolvedScope(resolvedScope);

  const result = spawnSync('node', buildBootstrapArgs(options, resolvedScope), {
    cwd: process.cwd(),
    stdio: 'inherit',
  });

  if (result.error) {
    fail(`Failed to run bootstrap-cr-round.mjs: ${result.error.message}`);
  }

  process.exit(result.status ?? 0);
}

main();
