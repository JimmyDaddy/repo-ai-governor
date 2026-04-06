import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { isAbsolute, relative, resolve } from 'node:path';

import {
  buildTaskCardMarkdown,
  fail,
  finalizeCrRoundReservation,
} from './reviewer-prompt-utils.mjs';

const DEFAULT_PRE_COMMIT_GATE = 'pnpm run check';
const DEFAULT_TASK_LEDGER_CONTRACT_PATH =
  '.repo-ai-governor/normative_knowledge_sources/governance/task-ledger-single-write-source-contract.md';
const TASK_LEDGER_MODES = new Set([
  'contract-default',
  'tk-plus-derived-ledgers',
  'sqlite-canonical',
]);

function parseArgs(argv) {
  const options = {
    extraDocs: [],
    verification: [],
    reviewFocus: [],
    reviewSurface: [],
    dependsOn: [],
    requiredInputs: [],
    tracebackReferences: [],
    implementationSteps: [],
    developmentVerification: [],
    deliveryVerification: [],
    outputs: [],
    commitPaths: [],
    json: false,
    writeTaskCard: false,
    suggestCommit: false,
    autoCommit: false,
    commitAll: false,
    help: false,
    resume: false,
    preCommitGate: DEFAULT_PRE_COMMIT_GATE,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--help' || arg === '-h') {
      options.help = true;
      continue;
    }

    if (arg === '--resume') {
      options.resume = true;
      continue;
    }

    if (arg === '--json') {
      options.json = true;
      continue;
    }

    if (arg === '--write-task-card') {
      options.writeTaskCard = true;
      continue;
    }

    if (arg === '--suggest-commit') {
      options.suggestCommit = true;
      continue;
    }

    if (arg === '--auto-commit') {
      options.autoCommit = true;
      continue;
    }

    if (arg === '--commit-all') {
      options.commitAll = true;
      continue;
    }

    if (!arg.startsWith('--')) {
      fail(`Unexpected argument: ${arg}`);
    }

    const key = arg.slice(2);
    const value = argv[index + 1];

    if (value === undefined || value.startsWith('--')) {
      fail(`Missing value for --${key}`);
    }

    index += 1;

    switch (key) {
      case 'tasks-dir':
        options.tasksDir = value;
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
      case 'review-dir':
        options.reviewDir = value;
        break;
      case 'round-type':
        options.roundType = value;
        break;
      case 'round-number':
        options.roundNumber = value;
        break;
      case 'report-slug':
        options.reportSlug = value;
        break;
      case 'cr-task-id':
        options.crTaskId = value;
        break;
      case 'enclosing-sprint-label':
        options.enclosingSprintLabel = value;
        break;
      case 'extra-doc':
        options.extraDocs.push(value);
        break;
      case 'verification':
        options.verification.push(value);
        break;
      case 'review-focus':
        options.reviewFocus.push(value);
        break;
      case 'review-surface':
        options.reviewSurface.push(value);
        break;
      case 'date':
        options.date = value;
        break;
      case 'owner':
        options.owner = value;
        break;
      case 'priority':
        options.priority = value;
        break;
      case 'title':
        options.title = value;
        break;
      case 'goal':
        options.goal = value;
        break;
      case 'depends-on':
        options.dependsOn.push(value);
        break;
      case 'required-input':
        options.requiredInputs.push(value);
        break;
      case 'traceback':
        options.tracebackReferences.push(value);
        break;
      case 'implementation-step':
        options.implementationSteps.push(value);
        break;
      case 'development-verification':
        options.developmentVerification.push(value);
        break;
      case 'delivery-verification':
        options.deliveryVerification.push(value);
        break;
      case 'output':
        options.outputs.push(value);
        break;
      case 'suggested-commit-message':
      case 'commit-message':
        options.suggestedCommitMessage = value;
        break;
      case 'commit-path':
        options.commitPaths.push(value);
        break;
      case 'pre-commit-gate':
        options.preCommitGate = value;
        break;
      case 'task-ledger-mode':
        options.taskLedgerMode = value;
        break;
      default:
        fail(`Unknown option: --${key}`);
    }
  }

  return options;
}

function printHelp() {
  console.log(`Usage:
  node ./.codex/skills/workspace-scoped-cr-loop/scripts/bootstrap-cr-round.mjs \\
    --tasks-dir <sprint-tasks-dir> \\
    --scope-kind <task|sprint|project> \\
    --scope-label <scope-id-or-label> \\
    [--cr-task-id CR-001] \\
    [--resume] \\
    [--round-type <initial|post-fix recheck|project-final>] \\
    [--verification "<command>"]... \\
    [--review-surface "<path-or-slice>"]... \\
    [--write-task-card] [--json] [--suggest-commit] [--auto-commit]

High-value flags:
  --resume             Reuse the latest open CR round or active reservation before allocating a new one.
  --cr-task-id         Reuse an already allocated CR id instead of allocating again.
  --review-surface     Declare exact paths/slices the reviewer should prioritize.
  --write-task-card    Materialize the generated CR task card as the authoritative round record.
  --commit-path        Constrain boundary commit staging scope; repeatable.

Notes:
  - This script is the preferred authoritative allocator for CR rounds.
  - If --resume is supplied, the script first tries to reuse the latest
    non-resolved CR task, then the latest active reservation.
  - If you later call render-reviewer-subagent-prompt.mjs, pass through the
    returned --cr-task-id and --report-slug to avoid double allocation.`);
}

function resolveTaskLedgerMode(options) {
  const requestedMode = options.taskLedgerMode ?? 'contract-default';

  if (!TASK_LEDGER_MODES.has(requestedMode)) {
    fail(
      `Invalid --task-ledger-mode '${requestedMode}'. Expected one of: ${Array.from(TASK_LEDGER_MODES).join(', ')}`,
    );
  }

  const contractPath = resolve(process.cwd(), DEFAULT_TASK_LEDGER_CONTRACT_PATH);
  let contractDetectedMode = 'tk-plus-derived-ledgers';
  let contractWarning = null;

  if (existsSync(contractPath)) {
    const contractContent = readFileSync(contractPath, 'utf8');

    if (
      contractContent.includes('sqlite 作为 canonical') ||
      contractContent.includes('sqlite-first canonical') ||
      contractContent.includes('sqlite 作为任务信息的真值') ||
      contractContent.includes('canonical sqlite truth') ||
      contractContent.includes('canonical ledger truth') ||
      contractContent.includes('task ledger 的 canonical sqlite truth') ||
      contractContent.includes('task-ledger canonical sqlite cutover') ||
      contractContent.includes('rendered `tasks.csv`') ||
      contractContent.includes('rendered `tasks/checklist.md`')
    ) {
      contractDetectedMode = 'sqlite-canonical';
    } else if (
      contractContent.includes('sqlite 作为 machine-readable projection/read-model') ||
      contractContent.includes('sqlite projection 只服务审计、查询与后续 sqlite cutover 演练') ||
      contractContent.includes('当前仓库已接入 task-ledger sqlite projection/read-model')
    ) {
      contractDetectedMode = 'tk-plus-derived-ledgers';
    } else {
      contractWarning =
        'Unable to infer task-ledger mode from the governance contract; defaulting to tk-plus-derived-ledgers.';
    }
  } else {
    contractWarning =
      'Task-ledger governance contract not found; defaulting to tk-plus-derived-ledgers.';
  }

  const resolvedMode = requestedMode === 'contract-default' ? contractDetectedMode : requestedMode;
  const warnings = [];

  if (contractWarning) {
    warnings.push(contractWarning);
  }

  if (requestedMode !== 'contract-default' && requestedMode !== contractDetectedMode) {
    warnings.push(
      `Explicit --task-ledger-mode ${requestedMode} overrides governance-contract mode ${contractDetectedMode}; repair the contract if this reflects the new canonical truth model.`,
    );
  }

  if (resolvedMode === 'sqlite-canonical' && requestedMode !== 'contract-default') {
    warnings.push(
      'This script does not perform sqlite task-ledger writes automatically; use the emitted guidance to update the canonical sqlite surface before refreshing derived views.',
    );
  }

  return {
    id: resolvedMode,
    source:
      requestedMode === 'contract-default'
        ? `governance-contract:${DEFAULT_TASK_LEDGER_CONTRACT_PATH}`
        : `explicit:${requestedMode}`,
    warning: warnings.length > 0 ? warnings.join(' ') : null,
  };
}

function ensureRequired(options, key) {
  if (!options[key]) {
    fail(
      `Missing required option: --${key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`,
    );
  }
}

function run(command, args, cwd, { allowFailure = false } = {}) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
  });

  if (result.error) {
    fail(`Failed to run ${command}: ${result.error.message}`);
  }

  if (!allowFailure && result.status !== 0) {
    const stderr = result.stderr?.trim();
    fail(stderr && stderr.length > 0 ? stderr : `${command} exited with status ${result.status}`);
  }

  return result;
}

function runShell(command, cwd) {
  const result = spawnSync(command, [], {
    cwd,
    encoding: 'utf8',
    shell: true,
    stdio: 'inherit',
  });

  if (result.error) {
    fail(`Failed to run shell command '${command}': ${result.error.message}`);
  }

  return result;
}

function getGitRoot(cwd) {
  const result = run('git', ['rev-parse', '--show-toplevel'], cwd, {
    allowFailure: true,
  });

  if (result.status !== 0) {
    return null;
  }

  return realpathSync(result.stdout.trim());
}

function getCurrentBranch(gitRoot) {
  return run('git', ['branch', '--show-current'], gitRoot).stdout.trim();
}

function parseStatusLine(line) {
  if (line.trim().length === 0) {
    return null;
  }

  const status = line.slice(0, 2);
  const rawPath = line.slice(3).trim();
  const path = rawPath.includes(' -> ') ? rawPath.split(' -> ').at(-1) : rawPath;

  return {
    status,
    path,
  };
}

function listChangedFiles(gitRoot) {
  const output = run('git', ['status', '--porcelain=v1', '--untracked-files=all'], gitRoot).stdout;

  return output
    .split(/\r?\n/u)
    .map(parseStatusLine)
    .filter((entry) => entry !== null);
}

function normalizeCommitPaths(commitPaths, gitRoot) {
  return commitPaths.map((commitPath) => {
    const absolutePath = isAbsolute(commitPath)
      ? resolve(commitPath)
      : resolve(process.cwd(), commitPath);
    const normalizedAbsolutePath = existsSync(absolutePath)
      ? realpathSync(absolutePath)
      : absolutePath;
    const relativePath = relative(gitRoot, normalizedAbsolutePath);

    if (
      relativePath.length === 0 ||
      relativePath === '.' ||
      (!relativePath.startsWith('..') && !isAbsolute(relativePath))
    ) {
      return relativePath.length === 0 ? '.' : relativePath;
    }

    fail(`Commit path is outside the git root: ${commitPath}`);
  });
}

function isPathOwned(filePath, ownedPath) {
  if (ownedPath === '.') {
    return true;
  }

  const relativePath = relative(ownedPath, filePath);

  return (
    relativePath.length === 0 ||
    relativePath === '.' ||
    (!relativePath.startsWith('..') && !isAbsolute(relativePath))
  );
}

function buildStageCommand(stageStrategy, stagePaths) {
  if (stageStrategy === 'all') {
    return 'git add .';
  }

  const quotedPaths = stagePaths.map((stagePath) => `"${stagePath}"`).join(' ');
  return `git add -- ${quotedPaths}`;
}

function buildCommitCommand(commitMessage) {
  const escapedMessage = commitMessage.replaceAll('"', '\\"');
  return `git commit -m "${escapedMessage}"`;
}

function analyzeCommitSuggestion(result, options) {
  const gitRoot = getGitRoot(process.cwd());

  if (gitRoot === null) {
    return {
      available: false,
      reason: 'Current working directory is not inside a git repository.',
      preCommitGate: options.preCommitGate,
      changedFiles: [],
      ownedFiles: [],
      outsideOwnedFiles: [],
      stageStrategy: null,
      stagePaths: [],
      stageCommand: null,
      commitCommand: null,
      canAutoCommit: false,
      requiresExplicitScope: true,
      gitRoot: null,
      branch: null,
    };
  }

  const changedEntries = listChangedFiles(gitRoot);
  const changedFiles = changedEntries.map((entry) => entry.path);
  const branch = getCurrentBranch(gitRoot);

  if (changedFiles.length === 0) {
    return {
      available: true,
      reason: 'No working-tree changes detected; no commit is needed.',
      preCommitGate: options.preCommitGate,
      changedFiles: [],
      ownedFiles: [],
      outsideOwnedFiles: [],
      stageStrategy: null,
      stagePaths: [],
      stageCommand: null,
      commitCommand: null,
      canAutoCommit: false,
      requiresExplicitScope: false,
      gitRoot,
      branch,
    };
  }

  let stageStrategy = 'all';
  let stagePaths = [];
  let ownedFiles = changedFiles;
  let outsideOwnedFiles = [];
  let requiresExplicitScope = false;
  let reason = 'Boundary commit suggestion is ready.';
  let canAutoCommit = true;

  if (options.commitAll) {
    stageStrategy = 'all';
    stagePaths = [];
    reason = 'Commit suggestion targets the full working tree because --commit-all was supplied.';
  } else if (options.commitPaths.length > 0) {
    stageStrategy = 'paths';
    stagePaths = normalizeCommitPaths(options.commitPaths, gitRoot);
    ownedFiles = changedFiles.filter((filePath) =>
      stagePaths.some((ownedPath) => isPathOwned(filePath, ownedPath)),
    );
    outsideOwnedFiles = changedFiles.filter(
      (filePath) => !stagePaths.some((ownedPath) => isPathOwned(filePath, ownedPath)),
    );

    if (ownedFiles.length === 0) {
      canAutoCommit = false;
      reason =
        'None of the current working-tree changes fall under the supplied --commit-path set.';
    } else if (outsideOwnedFiles.length > 0) {
      canAutoCommit = false;
      reason =
        'Working tree contains changes outside the supplied --commit-path set; refusing automatic commit.';
    }
  } else {
    requiresExplicitScope = true;
    canAutoCommit = false;
    reason =
      'No --commit-path or --commit-all was supplied. Suggestion is available, but automatic commit is disabled until the boundary staging scope is explicit.';
  }

  const stageCommand = buildStageCommand(
    stageStrategy,
    stageStrategy === 'paths' ? stagePaths : [],
  );
  const commitCommand = buildCommitCommand(result.suggestedCommitMessage);

  return {
    available: true,
    reason,
    preCommitGate: options.preCommitGate,
    changedFiles,
    ownedFiles,
    outsideOwnedFiles,
    stageStrategy,
    stagePaths,
    stageCommand,
    commitCommand,
    canAutoCommit,
    requiresExplicitScope,
    gitRoot,
    branch,
  };
}

function printCommitSuggestion(commitSuggestion) {
  console.log('');
  console.log('--- BEGIN COMMIT PLAN ---');
  console.log(
    `COMMIT_READY=${commitSuggestion.available && commitSuggestion.changedFiles.length > 0}`,
  );
  console.log(`COMMIT_AUTO_ALLOWED=${commitSuggestion.canAutoCommit}`);
  console.log(`PRE_COMMIT_GATE=${commitSuggestion.preCommitGate}`);
  console.log(`COMMIT_REASON=${commitSuggestion.reason}`);

  if (commitSuggestion.gitRoot) {
    console.log(`GIT_ROOT=${commitSuggestion.gitRoot}`);
  }

  if (commitSuggestion.branch) {
    console.log(`GIT_BRANCH=${commitSuggestion.branch}`);
  }

  if (commitSuggestion.stageCommand) {
    console.log(`STAGE_COMMAND=${commitSuggestion.stageCommand}`);
  }

  if (commitSuggestion.commitCommand) {
    console.log(`COMMIT_COMMAND=${commitSuggestion.commitCommand}`);
  }

  if (commitSuggestion.changedFiles.length > 0) {
    console.log('CHANGED_FILES:');
    for (const filePath of commitSuggestion.changedFiles) {
      console.log(`- ${filePath}`);
    }
  }

  if (commitSuggestion.outsideOwnedFiles.length > 0) {
    console.log('OUTSIDE_OWNED_FILES:');
    for (const filePath of commitSuggestion.outsideOwnedFiles) {
      console.log(`- ${filePath}`);
    }
  }

  console.log('--- END COMMIT PLAN ---');
}

function tryAutoCommit(result, commitSuggestion, options) {
  if (!options.autoCommit) {
    return {
      attempted: false,
      committed: false,
      reason: 'Auto commit was not requested.',
    };
  }

  if (!commitSuggestion.available) {
    return {
      attempted: true,
      committed: false,
      reason: commitSuggestion.reason,
    };
  }

  if (commitSuggestion.changedFiles.length === 0) {
    return {
      attempted: true,
      committed: false,
      reason: 'No working-tree changes detected; no commit was created.',
    };
  }

  if (!commitSuggestion.canAutoCommit) {
    return {
      attempted: true,
      committed: false,
      reason: commitSuggestion.reason,
    };
  }

  const gateResult = runShell(commitSuggestion.preCommitGate, commitSuggestion.gitRoot);
  if (gateResult.status !== 0) {
    return {
      attempted: true,
      committed: false,
      reason: `Pre-commit gate failed: ${commitSuggestion.preCommitGate}`,
      gatePassed: false,
    };
  }

  if (commitSuggestion.stageStrategy === 'all') {
    run('git', ['add', '.'], commitSuggestion.gitRoot);
  } else {
    run('git', ['add', '--', ...commitSuggestion.stagePaths], commitSuggestion.gitRoot);
  }

  const stagedCheck = run('git', ['diff', '--cached', '--quiet'], commitSuggestion.gitRoot, {
    allowFailure: true,
  });

  if (stagedCheck.status === 0) {
    return {
      attempted: true,
      committed: false,
      reason: 'No staged diff remained after applying the boundary stage command.',
      gatePassed: true,
    };
  }

  run('git', ['commit', '-m', result.suggestedCommitMessage], commitSuggestion.gitRoot);

  const commitHash = run(
    'git',
    ['rev-parse', '--short', 'HEAD'],
    commitSuggestion.gitRoot,
  ).stdout.trim();

  return {
    attempted: true,
    committed: true,
    reason: 'Boundary commit created successfully.',
    gatePassed: true,
    commitHash,
    branch: commitSuggestion.branch,
    commitMessage: result.suggestedCommitMessage,
  };
}

function buildCommitEvidence(result, commitSuggestion, autoCommit, taskLedgerMode) {
  if (!autoCommit.committed || !autoCommit.commitHash || !autoCommit.commitMessage) {
    return {
      available: false,
      reason: 'No successful boundary commit is available for evidence suggestions.',
    };
  }

  const date = result.date;
  const branch = autoCommit.branch || commitSuggestion.branch || 'unknown';
  const gate = commitSuggestion.preCommitGate || DEFAULT_PRE_COMMIT_GATE;
  const commitRef = `${branch}@${autoCommit.commitHash}`;
  const taskCardExecutionRecord = `${date}：已完成当前 boundary 本地提交收口，commit \`${autoCommit.commitHash}\`（\`${autoCommit.commitMessage}\`，分支 \`${branch}\`），并通过 pre-commit gate \`${gate}\`。`;
  const canonicalLedgerSummary = `记录当前 boundary 本地提交收口：commit \`${autoCommit.commitHash}\`（\`${autoCommit.commitMessage}\`，分支 \`${branch}\`）`;
  const canonicalLedgerVerify = `\`${gate}\` && \`git rev-parse --short HEAD\` && \`git log -1 --pretty=%s\``;
  const derivedLedgerFollowUp =
    taskLedgerMode.id === 'sqlite-canonical'
      ? '请通过 canonical `TK/CR` + `sync-task-ledger.js` 写回 sqlite truth，再确认 rendered checklist / tasks.csv 与 task-ledger sync checks 全绿。'
      : '在 `TK/CR + checklist/tasks.csv` 写回后，刷新 sqlite projection，并执行 task-ledger sync / projection sync 校验。';

  const legacyLedgerHints =
    taskLedgerMode.id === 'tk-plus-derived-ledgers'
      ? {
          checklistEntry: taskCardExecutionRecord,
          tasksCsvResult: canonicalLedgerSummary,
          tasksCsvVerify: canonicalLedgerVerify,
        }
      : null;

  return {
    available: true,
    commitRef,
    taskLedgerMode,
    taskCardExecutionRecord,
    canonicalLedgerSummary,
    canonicalLedgerVerify,
    derivedLedgerFollowUp,
    ...(legacyLedgerHints ?? {}),
    warning: taskLedgerMode.warning,
  };
}

function printTextResult(result, options, commitSuggestion, autoCommit, commitEvidence) {
  console.log(`CR_TASK_ID=${result.crTaskId}`);
  console.log(`CR_TASK_ID_SOURCE=${result.crTaskIdSource}`);
  if (result.crReservationPath) {
    console.log(`CR_RESERVATION_PATH=${result.crReservationPath}`);
  }
  console.log(`ROUND_NUMBER=${result.roundNumber}`);
  console.log(`REPORT_SLUG=${result.reportSlug}`);
  console.log(`TASK_CARD_PATH=${result.taskCardPath}`);
  console.log(`PENDING_REVIEW_PATH=${result.reportPaths.pending}`);
  console.log(`VERIFIED_REVIEW_PATH=${result.reportPaths.verified}`);
  console.log(`RESOLVED_REVIEW_PATH=${result.reportPaths.resolved}`);
  console.log(`SUGGESTED_COMMIT_MESSAGE=${result.suggestedCommitMessage}`);
  console.log(`REVIEW_SURFACE_COUNT=${result.reviewSurface.length}`);

  if (result.reviewSurface.length > 0) {
    console.log('REVIEW_SURFACE:');
    for (const reviewSurfaceEntry of result.reviewSurface) {
      console.log(`- ${reviewSurfaceEntry}`);
    }
  }

  if (options.suggestCommit || options.autoCommit) {
    printCommitSuggestion(commitSuggestion);
  }

  if (options.autoCommit) {
    console.log('');
    console.log('--- BEGIN AUTO COMMIT RESULT ---');
    console.log(`AUTO_COMMIT_ATTEMPTED=${autoCommit.attempted}`);
    console.log(`AUTO_COMMIT_CREATED=${autoCommit.committed}`);
    console.log(`AUTO_COMMIT_REASON=${autoCommit.reason}`);

    if (autoCommit.commitHash) {
      console.log(`AUTO_COMMIT_HASH=${autoCommit.commitHash}`);
    }

    if (autoCommit.commitMessage) {
      console.log(`AUTO_COMMIT_MESSAGE=${autoCommit.commitMessage}`);
    }

    console.log('--- END AUTO COMMIT RESULT ---');
  }

  if (commitEvidence.available) {
    console.log('');
    console.log('--- BEGIN CANONICAL LEDGER WRITE-BACK SUGGESTIONS ---');
    console.log(`COMMIT_REF=${commitEvidence.commitRef}`);
    console.log(`TASK_LEDGER_MODE=${commitEvidence.taskLedgerMode.id}`);
    console.log(`TASK_LEDGER_MODE_SOURCE=${commitEvidence.taskLedgerMode.source}`);
    console.log(`TASK_CARD_EXECUTION_RECORD=${commitEvidence.taskCardExecutionRecord}`);
    console.log(`CANONICAL_LEDGER_SUMMARY=${commitEvidence.canonicalLedgerSummary}`);
    console.log(`CANONICAL_LEDGER_VERIFY=${commitEvidence.canonicalLedgerVerify}`);
    console.log(`DERIVED_LEDGER_FOLLOW_UP=${commitEvidence.derivedLedgerFollowUp}`);

    if (commitEvidence.checklistEntry) {
      console.log(`CHECKLIST_ENTRY=${commitEvidence.checklistEntry}`);
    }

    if (commitEvidence.tasksCsvResult) {
      console.log(`TASKS_CSV_RESULT=${commitEvidence.tasksCsvResult}`);
    }

    if (commitEvidence.tasksCsvVerify) {
      console.log(`TASKS_CSV_VERIFY=${commitEvidence.tasksCsvVerify}`);
    }

    if (commitEvidence.warning) {
      console.log(`TASK_LEDGER_WARNING=${commitEvidence.warning}`);
    }

    console.log('--- END CANONICAL LEDGER WRITE-BACK SUGGESTIONS ---');
  }

  console.log('');
  console.log('--- BEGIN TASK CARD ---');
  console.log(result.markdown.trimEnd());
  console.log('--- END TASK CARD ---');
  console.log('');
  console.log('--- BEGIN REVIEWER PROMPT ---');
  console.log(result.prompt);
  console.log('--- END REVIEWER PROMPT ---');
}

function maybeWriteTaskCard(result, shouldWrite) {
  if (!shouldWrite) {
    return;
  }

  if (existsSync(result.taskCardPath)) {
    if (
      result.crTaskIdSource === 'resume-open-cr' ||
      (result.crTaskIdSource === 'explicit' && result.existingTaskCardPath)
    ) {
      return;
    }

    fail(`Task card already exists: ${result.taskCardPath}`);
  }

  writeFileSync(result.taskCardPath, result.markdown, 'utf8');
  finalizeCrRoundReservation(result);
}

function main() {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    printHelp();
    return;
  }

  ensureRequired(options, 'tasksDir');
  ensureRequired(options, 'scopeKind');
  ensureRequired(options, 'scopeLabel');

  const result = buildTaskCardMarkdown(options);
  maybeWriteTaskCard(result, options.writeTaskCard);
  const commitSuggestion = analyzeCommitSuggestion(result, options);
  const autoCommit = tryAutoCommit(result, commitSuggestion, options);
  const taskLedgerMode = resolveTaskLedgerMode(options);
  const commitEvidence = buildCommitEvidence(result, commitSuggestion, autoCommit, taskLedgerMode);

  const finalResult = {
    ...result,
    taskLedgerMode,
    commitSuggestion,
    autoCommit,
    commitEvidence,
  };

  if (options.json) {
    console.log(JSON.stringify(finalResult, null, 2));
    return;
  }

  printTextResult(result, options, commitSuggestion, autoCommit, commitEvidence);
}

main();
