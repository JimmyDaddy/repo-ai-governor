import { buildPromptResult, ensureScopeKind, fail } from './reviewer-prompt-utils.mjs';

function parseArgs(argv) {
  const options = {
    extraDocs: [],
    verification: [],
    reviewFocus: [],
    reviewSurface: [],
    json: false,
    help: false,
    resume: false,
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
      default:
        fail(`Unknown option: --${key}`);
    }
  }

  return options;
}

function printHelp() {
  console.log(`Usage:
  node ./.codex/skills/workspace-scoped-cr-loop/scripts/render-reviewer-subagent-prompt.mjs \\
    --tasks-dir <sprint-tasks-dir> \\
    --scope-kind <task|sprint|project> \\
    --scope-label <scope-id-or-label> \\
    [--cr-task-id CR-001] \\
    [--resume] \\
    [--round-type <initial|post-fix recheck|project-final>] \\
    [--report-slug <slug>] \\
    [--verification "<command>"]... \\
    [--review-surface "<path-or-slice>"]... \\
    [--extra-doc <path>]... \\
    [--review-focus "<note>"]... \\
    [--json]

Notes:
  - If --resume is supplied, the script first tries to reuse the latest
    non-resolved CR task, then the latest active reservation.
  - Prefer allocating the round via bootstrap-cr-round first, then pass through
    --cr-task-id and --report-slug here instead of auto-allocating twice.
  - --review-surface narrows reviewer attention inside the declared scope.`);
}

function ensureRequired(options, key) {
  if (!options[key]) {
    fail(
      `Missing required option: --${key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`,
    );
  }
}

function printTextResult(result) {
  console.log(`CR_TASK_ID=${result.crTaskId}`);
  console.log(`CR_TASK_ID_SOURCE=${result.crTaskIdSource}`);
  if (result.crReservationPath) {
    console.log(`CR_RESERVATION_PATH=${result.crReservationPath}`);
  }
  console.log(`ROUND_NUMBER=${result.roundNumber}`);
  console.log(`REPORT_SLUG=${result.reportSlug}`);
  console.log(`REVIEW_DIR=${result.reviewDir}`);
  console.log(`ENCLOSING_SPRINT_LABEL=${result.enclosingSprintLabel}`);
  console.log(`REVIEW_SURFACE_COUNT=${result.reviewSurface.length}`);

  if (result.reviewSurface.length > 0) {
    console.log('REVIEW_SURFACE:');
    for (const reviewSurfaceEntry of result.reviewSurface) {
      console.log(`- ${reviewSurfaceEntry}`);
    }
  }

  console.log('');
  console.log('--- BEGIN PROMPT ---');
  console.log(result.prompt);
  console.log('--- END PROMPT ---');
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
  ensureScopeKind(options.scopeKind);

  const result = buildPromptResult(options);

  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  printTextResult(result);
}

main();
