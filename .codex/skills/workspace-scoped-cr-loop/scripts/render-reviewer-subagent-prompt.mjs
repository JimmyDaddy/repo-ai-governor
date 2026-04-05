import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DEFAULT_CURRENT_CONTEXT_PATH = '.repo-ai-governor/context/current-context.md';
const templatePath = join(__dirname, '..', 'references', 'reviewer-subagent-prompt-template.md');

function fail(message) {
  console.error(message);
  process.exit(1);
}

function readTemplate() {
  if (!existsSync(templatePath)) {
    fail(`Missing reviewer prompt template: ${templatePath}`);
  }

  const content = readFileSync(templatePath, 'utf8');
  const match = content.match(/## Copyable Prompt\s+```text\n([\s\S]*?)```/u);
  if (!match) {
    fail('Unable to extract copyable prompt block from reviewer prompt template.');
  }

  return match[1].trim();
}

function parseArgs(argv) {
  const options = {
    extraDocs: [],
    verification: [],
    reviewFocus: [],
    json: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

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
      case 'repo-root':
        options.repoRoot = value;
        break;
      case 'current-context':
        options.currentContextPath = value;
        break;
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
      default:
        fail(`Unknown option: --${key}`);
    }
  }

  return options;
}

function ensureRequired(options, key) {
  if (!options[key]) {
    const flagName = key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
    fail(`Missing required option: --${flagName}`);
  }
}

function resolveRepoRoot(repoRoot) {
  const absolutePath = resolve(repoRoot ?? process.cwd());
  if (!existsSync(absolutePath)) {
    fail(`Repository root does not exist: ${absolutePath}`);
  }

  return absolutePath;
}

function resolvePathWithinRepo(repoRoot, inputPath) {
  return resolve(repoRoot, inputPath);
}

function resolveTasksDir(repoRoot, tasksDir) {
  const absolutePath = resolvePathWithinRepo(repoRoot, tasksDir);
  if (!existsSync(absolutePath)) {
    fail(`Tasks directory does not exist: ${absolutePath}`);
  }

  return absolutePath;
}

function deriveScopePath(options, repoRoot, tasksDir) {
  if (options.scopePath) {
    return resolvePathWithinRepo(repoRoot, options.scopePath);
  }

  switch (options.scopeKind) {
    case 'task':
      return resolve(tasksDir, `${options.scopeLabel}.md`);
    case 'sprint':
      return dirname(tasksDir);
    case 'project':
      return dirname(dirname(tasksDir));
    default:
      fail(`Unsupported scope kind: ${options.scopeKind}`);
  }
}

function allocateNextCrTaskId(tasksDir) {
  const filenames = readdirSync(tasksDir);
  let highest = 0;

  for (const filename of filenames) {
    const match = filename.match(/^CR-(\d{3})\.md$/u);
    if (match) {
      highest = Math.max(highest, Number.parseInt(match[1], 10));
    }
  }

  const next = highest + 1;
  return {
    number: next,
    id: `CR-${String(next).padStart(3, '0')}`,
  };
}

function formatTimestampPart(value) {
  return String(value).padStart(2, '0');
}

function buildDefaultReportSlug() {
  const now = new Date();
  const year = now.getFullYear();
  const month = formatTimestampPart(now.getMonth() + 1);
  const day = formatTimestampPart(now.getDate());
  const hour = formatTimestampPart(now.getHours());
  const minute = formatTimestampPart(now.getMinutes());

  return `working-tree-${year}${month}${day}-${hour}${minute}`;
}

function buildVerificationBaseline(verification) {
  if (verification.length === 0) {
    return '- No verification commands were supplied.';
  }

  return verification.map((command) => `- ${command}`).join('\n');
}

function buildReviewFocus(reviewFocus) {
  if (reviewFocus.length === 0) {
    return '- No extra focus areas were supplied.';
  }

  return reviewFocus.map((item) => `- ${item}`).join('\n');
}

function buildExtraDocs(extraDocs) {
  if (extraDocs.length === 0) {
    return 'none';
  }

  return extraDocs.join(', ');
}

function normalizeSectionHeading(headingText) {
  return headingText
    .replace(/^\d+(?:\.\d+)*\.?\s*/u, '')
    .trim()
    .toLowerCase();
}

function extractMarkdownSection(content, headingText) {
  const normalizedHeadingText = normalizeSectionHeading(headingText);
  const headingPattern = /^##\s+([^\n]+)$/gmu;
  const headingMatches = Array.from(content.matchAll(headingPattern));

  for (let index = 0; index < headingMatches.length; index += 1) {
    const headingMatch = headingMatches[index];
    const rawHeadingText = headingMatch[1]?.trim() ?? '';
    const headingIndex = headingMatch.index;
    if (
      typeof headingIndex !== 'number' ||
      normalizeSectionHeading(rawHeadingText) !== normalizedHeadingText
    ) {
      continue;
    }

    const sectionStart = headingIndex + headingMatch[0].length;
    const sectionEnd = headingMatches[index + 1]?.index ?? content.length;
    return content.slice(sectionStart, sectionEnd).trim();
  }

  return '';
}

function readSectionMetadataField(sectionContent, label) {
  const labelPattern = label.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
  const fieldMatch = sectionContent.match(new RegExp(`^- ${labelPattern}:\\s*(.+)$`, 'mu'));
  if (!fieldMatch) {
    return null;
  }

  const rawValue = fieldMatch[1]?.trim() ?? '';
  const backtickMatch = rawValue.match(/^`([^`]+)`$/u);
  return backtickMatch ? backtickMatch[1].trim() : rawValue;
}

function resolveReviewRoutingFromCurrentContext(repoRoot, currentContextPath) {
  if (!existsSync(currentContextPath)) {
    fail(`Current context file not found: ${currentContextPath}`);
  }

  const currentContextContent = readFileSync(currentContextPath, 'utf8');
  const worktreeReviewTarget = readSectionMetadataField(
    extractMarkdownSection(currentContextContent, 'Worktree Review Target'),
    'Review records',
  );
  if (worktreeReviewTarget && worktreeReviewTarget !== 'none') {
    return {
      reviewDir: resolvePathWithinRepo(repoRoot, worktreeReviewTarget),
      reviewSourceKind: 'worktree-review-target',
    };
  }

  const primaryStreamReviewDirectory = readSectionMetadataField(
    extractMarkdownSection(currentContextContent, 'Primary Stream'),
    'Review records',
  );
  if (primaryStreamReviewDirectory && primaryStreamReviewDirectory !== 'none') {
    return {
      reviewDir: resolvePathWithinRepo(repoRoot, primaryStreamReviewDirectory),
      reviewSourceKind: 'primary-stream',
    };
  }

  fail(
    'No canonical review directory could be resolved from current-context.md. Provide --review-dir or activate a stream / Worktree Review Target first.',
  );
}

function resolveReviewDirectory(options, repoRoot) {
  if (options.reviewDir) {
    return {
      reviewDir: resolvePathWithinRepo(repoRoot, options.reviewDir),
      reviewSourceKind: 'explicit',
    };
  }

  const currentContextPath = resolvePathWithinRepo(
    repoRoot,
    options.currentContextPath ?? DEFAULT_CURRENT_CONTEXT_PATH,
  );
  return resolveReviewRoutingFromCurrentContext(repoRoot, currentContextPath);
}

function renderPrompt(template, values) {
  let prompt = template;

  for (const [key, value] of Object.entries(values)) {
    prompt = prompt.replaceAll(`<${key}>`, value);
  }

  return prompt;
}

function printTextResult(result) {
  process.stdout.write(
    [
      `CR_TASK_ID=${result.crTaskId}`,
      `ROUND_NUMBER=${result.roundNumber}`,
      `REPORT_SLUG=${result.reportSlug}`,
      `REVIEW_DIR=${result.reviewDir}`,
      `REVIEW_SOURCE_KIND=${result.reviewSourceKind}`,
      `ENCLOSING_SPRINT_LABEL=${result.enclosingSprintLabel}`,
      '',
      '--- BEGIN PROMPT ---',
      result.prompt,
      '--- END PROMPT ---',
      '',
    ].join('\n'),
  );
}

function main() {
  const options = parseArgs(process.argv.slice(2));

  ensureRequired(options, 'tasksDir');
  ensureRequired(options, 'scopeKind');
  ensureRequired(options, 'scopeLabel');

  const validScopeKinds = new Set(['task', 'sprint', 'project']);
  if (!validScopeKinds.has(options.scopeKind)) {
    fail(`Invalid --scope-kind '${options.scopeKind}'. Expected one of: task, sprint, project.`);
  }

  const repoRoot = resolveRepoRoot(options.repoRoot);
  const tasksDir = resolveTasksDir(repoRoot, options.tasksDir);
  const sprintDir = dirname(tasksDir);
  const { reviewDir, reviewSourceKind } = resolveReviewDirectory(options, repoRoot);
  const enclosingSprintLabel = options.enclosingSprintLabel || basename(sprintDir);
  const scopePath = deriveScopePath(options, repoRoot, tasksDir);

  if (!existsSync(scopePath)) {
    fail(`Scope path does not exist: ${scopePath}`);
  }

  if (!existsSync(reviewDir)) {
    fail(`Review directory does not exist: ${reviewDir}`);
  }

  const { id: crTaskId, number: nextCrNumber } = allocateNextCrTaskId(tasksDir);
  const roundNumber = options.roundNumber || String(nextCrNumber);
  const reportSlug = options.reportSlug || buildDefaultReportSlug();
  const roundType = options.roundType || 'initial';

  const template = readTemplate();
  const prompt = renderPrompt(template, {
    scope_kind: options.scopeKind,
    scope_label: options.scopeLabel,
    scope_path: scopePath,
    enclosing_sprint_label: enclosingSprintLabel,
    review_dir: reviewDir,
    review_source_kind: reviewSourceKind,
    round_type: roundType,
    round_number: roundNumber,
    cr_task_id: crTaskId,
    report_slug: reportSlug,
    verification_baseline: buildVerificationBaseline(options.verification),
    extra_normative_docs: buildExtraDocs(options.extraDocs),
    review_focus: buildReviewFocus(options.reviewFocus),
  });

  const result = {
    crTaskId,
    roundNumber,
    reportSlug,
    reviewDir,
    reviewSourceKind,
    enclosingSprintLabel,
    scopeKind: options.scopeKind,
    scopeLabel: options.scopeLabel,
    scopePath,
    roundType,
    extraDocs: options.extraDocs,
    verification: options.verification,
    reviewFocus: options.reviewFocus,
    prompt,
  };

  if (options.json) {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return;
  }

  printTextResult(result);
}

main();
