import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const templatePath = join(__dirname, '..', 'references', 'reviewer-subagent-prompt-template.md');
const CR_RESERVATION_DIRNAME = '.cr-round-reservations';

const DEFAULT_REQUIRED_INPUTS = [
  'AGENTS.md',
  '.repo-ai-governor/context/current-context.md',
  '.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml',
  '.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md',
  '.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md',
  '.repo-ai-governor/normative_knowledge_sources/governance/cr-lifecycle-threshold-spec.md',
  '.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md',
  '.repo-ai-governor/normative_knowledge_sources/governance/task-ledger-single-write-source-contract.md',
  '.repo-ai-governor/normative_knowledge_sources/governance/execution-gate-layering-spec.md',
];

export function fail(message) {
  console.error(message);
  process.exit(1);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
}

function matchesTaskCardFilename(filename, taskId) {
  const taskIdPattern = new RegExp(`^${escapeRegExp(taskId)}(?:\\.md|-.*\\.md)$`, 'u');
  return taskIdPattern.test(filename);
}

function parseCrTaskCardFilename(filename) {
  const match = filename.match(/^CR-(\d{3})(?:-.*)?\.md$/u);
  if (!match) {
    return null;
  }

  return {
    id: `CR-${match[1]}`,
    number: Number.parseInt(match[1], 10),
  };
}

function findMatchingTaskCardPaths(tasksDir, taskId) {
  return readdirSync(tasksDir)
    .filter((filename) => matchesTaskCardFilename(filename, taskId))
    .sort((left, right) => left.localeCompare(right))
    .map((filename) => join(tasksDir, filename));
}

function resolveScopedTaskCardPath(tasksDir, taskId) {
  const matches = findMatchingTaskCardPaths(tasksDir, taskId);

  if (matches.length === 0) {
    fail(
      `Task scope ${taskId} did not resolve inside ${tasksDir}. In this repo task cards are often named ${taskId}-<slug>.md; provide --scope-path explicitly when needed.`,
    );
  }

  if (matches.length > 1) {
    fail(
      `Task scope ${taskId} matched multiple task cards inside ${tasksDir}. Provide --scope-path explicitly. Matches: ${matches.join(', ')}`,
    );
  }

  return matches[0];
}

export function ensureScopeKind(scopeKind) {
  const validScopeKinds = new Set(['task', 'sprint', 'project']);

  if (!validScopeKinds.has(scopeKind)) {
    fail(`Invalid --scope-kind '${scopeKind}'. Expected one of: task, sprint, project.`);
  }
}

export function readPromptTemplate() {
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

export function resolveTasksDir(tasksDir) {
  const absolutePath = resolve(tasksDir);

  if (!existsSync(absolutePath)) {
    fail(`Tasks directory does not exist: ${absolutePath}`);
  }

  return absolutePath;
}

export function deriveScopePath(options, tasksDir) {
  if (options.scopePath) {
    return resolve(options.scopePath);
  }

  switch (options.scopeKind) {
    case 'task':
      return resolveScopedTaskCardPath(tasksDir, options.scopeLabel);
    case 'sprint':
      return dirname(tasksDir);
    case 'project':
      return dirname(dirname(tasksDir));
    default:
      fail(`Unsupported scope kind: ${options.scopeKind}`);
  }
}

export function allocateNextCrTaskId(tasksDir) {
  const filenames = readdirSync(tasksDir);
  let highest = 0;

  for (const filename of filenames) {
    const parsed = parseCrTaskCardFilename(filename);
    if (parsed) {
      highest = Math.max(highest, parsed.number);
    }
  }

  const next = highest + 1;
  return {
    number: next,
    id: `CR-${String(next).padStart(3, '0')}`,
  };
}

function validateCrTaskId(crTaskId) {
  if (!/^CR-\d{3}$/u.test(crTaskId)) {
    fail(`Invalid --cr-task-id '${crTaskId}'. Expected format CR-001.`);
  }
}

function parseCrNumber(crTaskId) {
  validateCrTaskId(crTaskId);
  return Number.parseInt(crTaskId.slice(3), 10);
}

function getReservationDirectory(tasksDir) {
  return join(tasksDir, CR_RESERVATION_DIRNAME);
}

function getReservationPath(tasksDir, crTaskId) {
  return join(getReservationDirectory(tasksDir), `${crTaskId}.json`);
}

function listCrTaskCardFiles(tasksDir) {
  return readdirSync(tasksDir)
    .filter((filename) => parseCrTaskCardFilename(filename) !== null)
    .sort((left, right) => left.localeCompare(right));
}

function findExistingCrTaskCardPath(tasksDir, crTaskId) {
  const matches = listCrTaskCardFiles(tasksDir)
    .filter((filename) => {
      const parsed = parseCrTaskCardFilename(filename);
      return parsed?.id === crTaskId;
    })
    .map((filename) => join(tasksDir, filename));

  if (matches.length === 0) {
    return null;
  }

  return matches[0];
}

function readTaskCardMetadataValue(content, key) {
  const metadataPattern = new RegExp(`^- ${key}:\\s*\`?([^\\n\`]+)\`?\\s*$`, 'mu');
  const match = content.match(metadataPattern);
  return match?.[1]?.trim() ?? null;
}

function readCrTaskSummary(taskCardPath) {
  const content = readFileSync(taskCardPath, 'utf8');
  const filename = basename(taskCardPath);
  const filenameCrTask = parseCrTaskCardFilename(filename);
  const headingMatch = content.match(/^#\s+(CR-\d{3})\s+(.+)$/mu);
  const statusMatch = content.match(/^- Status:\s*`?([^`\n]+)`?/mu);
  const reportSlugMatch = content.match(/code_review_([A-Za-z0-9-]+)\.md/u);
  const crTaskId = headingMatch?.[1]?.trim() ?? filenameCrTask?.id ?? basename(taskCardPath, '.md');

  return {
    crTaskId,
    number: parseCrNumber(crTaskId),
    status: statusMatch?.[1]?.trim() ?? '',
    reportSlug: reportSlugMatch?.[1]?.trim() ?? null,
    title: headingMatch?.[2]?.trim() ?? '',
    project: readTaskCardMetadataValue(content, 'Project'),
    sprint: readTaskCardMetadataValue(content, 'Sprint'),
    scopeKind: readTaskCardMetadataValue(content, 'Scope Kind'),
    scopeLabel: readTaskCardMetadataValue(content, 'Scope Label'),
    roundType: readTaskCardMetadataValue(content, 'Round Type'),
    taskCardPath,
    content,
  };
}

function matchesLegacyRoundScope(candidate, expectedScopeKind, expectedScopeLabel) {
  if (!expectedScopeKind || !expectedScopeLabel) {
    return false;
  }

  if (candidate.title.startsWith(`${expectedScopeLabel} `)) {
    return true;
  }

  if (expectedScopeKind === 'sprint') {
    return candidate.sprint === expectedScopeLabel;
  }

  return false;
}

function matchesRoundScope(candidate, rawOptions) {
  const expectedScopeKind =
    typeof rawOptions.scopeKind === 'string' ? rawOptions.scopeKind.trim() : null;
  const expectedScopeLabel =
    typeof rawOptions.scopeLabel === 'string' ? rawOptions.scopeLabel.trim() : null;
  const expectedRoundType =
    typeof rawOptions.roundType === 'string' ? rawOptions.roundType.trim() : null;

  if (!expectedScopeKind && !expectedScopeLabel) {
    return true;
  }

  if (candidate.scopeKind && expectedScopeKind && candidate.scopeKind !== expectedScopeKind) {
    return false;
  }

  if (candidate.scopeLabel && expectedScopeLabel && candidate.scopeLabel !== expectedScopeLabel) {
    return false;
  }

  if (candidate.roundType && expectedRoundType && candidate.roundType !== expectedRoundType) {
    return false;
  }

  if (candidate.scopeKind || candidate.scopeLabel || candidate.roundType) {
    const scopeKindMatches = !expectedScopeKind || candidate.scopeKind === expectedScopeKind;
    const scopeLabelMatches = !expectedScopeLabel || candidate.scopeLabel === expectedScopeLabel;
    const roundTypeMatches =
      !expectedRoundType || !candidate.roundType || candidate.roundType === expectedRoundType;

    return scopeKindMatches && scopeLabelMatches && roundTypeMatches;
  }

  return matchesLegacyRoundScope(candidate, expectedScopeKind, expectedScopeLabel);
}

function findLatestOpenCrTask(tasksDir, rawOptions) {
  const openTaskStatuses = new Set(['review_pending', 'verified']);
  const taskSummaries = listCrTaskCardFiles(tasksDir).map((filename) =>
    readCrTaskSummary(join(tasksDir, filename)),
  );
  const openRounds = taskSummaries.filter(
    (summary) => openTaskStatuses.has(summary.status) && matchesRoundScope(summary, rawOptions),
  );

  if (openRounds.length === 0) {
    return null;
  }

  return openRounds.sort((left, right) => right.number - left.number)[0];
}

function readReservationFile(reservationPath) {
  const content = readFileSync(reservationPath, 'utf8');

  try {
    const parsed = JSON.parse(content);
    const crTaskId = String(parsed.crTaskId ?? '');
    validateCrTaskId(crTaskId);

    return {
      crTaskId,
      number: parseCrNumber(crTaskId),
      reportSlug:
        typeof parsed.reportSlug === 'string' && parsed.reportSlug.trim().length > 0
          ? parsed.reportSlug.trim()
          : null,
      scopeKind: typeof parsed.scopeKind === 'string' ? parsed.scopeKind.trim() : null,
      scopeLabel: typeof parsed.scopeLabel === 'string' ? parsed.scopeLabel.trim() : null,
      roundType: typeof parsed.roundType === 'string' ? parsed.roundType.trim() : null,
      createdAt: typeof parsed.createdAt === 'string' ? parsed.createdAt.trim() : null,
      reservationPath,
    };
  } catch (error) {
    fail(
      `Invalid CR reservation file ${reservationPath}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

function listCrReservations(tasksDir) {
  const reservationDir = getReservationDirectory(tasksDir);

  if (!existsSync(reservationDir)) {
    return [];
  }

  const reservationFiles = readdirSync(reservationDir)
    .filter((filename) => /^CR-\d{3}\.json$/u.test(filename))
    .sort((left, right) => left.localeCompare(right));
  const reservations = [];

  for (const filename of reservationFiles) {
    const reservationPath = join(reservationDir, filename);
    const reservation = readReservationFile(reservationPath);
    const taskCardPath = findExistingCrTaskCardPath(tasksDir, reservation.crTaskId);

    if (taskCardPath) {
      unlinkSync(reservationPath);
      continue;
    }

    reservations.push(reservation);
  }

  return reservations;
}

function findLatestReservation(tasksDir, rawOptions) {
  const reservations = listCrReservations(tasksDir).filter((reservation) =>
    matchesRoundScope(reservation, rawOptions),
  );
  if (reservations.length === 0) {
    return null;
  }

  return reservations.sort((left, right) => right.number - left.number)[0];
}

function lookupExistingCrRound(tasksDir, crTaskId) {
  const taskCardPath = findExistingCrTaskCardPath(tasksDir, crTaskId);
  if (taskCardPath) {
    return {
      source: 'task-card',
      ...readCrTaskSummary(taskCardPath),
      reservationPath: null,
    };
  }

  const reservationPath = getReservationPath(tasksDir, crTaskId);
  if (existsSync(reservationPath)) {
    return {
      source: 'reservation',
      ...readReservationFile(reservationPath),
    };
  }

  return null;
}

function reserveNextCrRound(tasksDir, rawOptions) {
  mkdirSync(getReservationDirectory(tasksDir), { recursive: true });
  const existingTaskNumbers = listCrTaskCardFiles(tasksDir).map((filename) => {
    const parsed = parseCrTaskCardFilename(filename);
    return parsed?.number ?? 0;
  });
  const existingReservationNumbers = listCrReservations(tasksDir).map(
    (reservation) => reservation.number,
  );
  let nextNumber = Math.max(0, ...existingTaskNumbers, ...existingReservationNumbers) + 1;
  const reportSlug = rawOptions.reportSlug || buildDefaultReportSlug();

  while (true) {
    const crTaskId = `CR-${String(nextNumber).padStart(3, '0')}`;
    const reservationPath = getReservationPath(tasksDir, crTaskId);
    const payload = {
      crTaskId,
      reportSlug,
      scopeKind: rawOptions.scopeKind ?? null,
      scopeLabel: rawOptions.scopeLabel ?? null,
      roundType: rawOptions.roundType ?? null,
      createdAt: new Date().toISOString(),
    };

    try {
      writeFileSync(reservationPath, `${JSON.stringify(payload, null, 2)}\n`, {
        encoding: 'utf8',
        flag: 'wx',
      });
      return {
        id: crTaskId,
        number: nextNumber,
        reportSlug,
        source: 'auto-allocated-reserved',
        reservationPath,
        taskCardPath: null,
      };
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'EEXIST') {
        nextNumber += 1;
        continue;
      }

      throw error;
    }
  }
}

function releaseReservation(tasksDir, crTaskId) {
  const reservationPath = getReservationPath(tasksDir, crTaskId);
  if (existsSync(reservationPath)) {
    unlinkSync(reservationPath);
  }
}

function resolveCrRound(tasksDir, rawOptions) {
  if (typeof rawOptions.crTaskId === 'string' && rawOptions.crTaskId.trim().length > 0) {
    const explicitCrTaskId = rawOptions.crTaskId.trim();
    validateCrTaskId(explicitCrTaskId);
    const existingRound = lookupExistingCrRound(tasksDir, explicitCrTaskId);

    return {
      id: explicitCrTaskId,
      number: parseCrNumber(explicitCrTaskId),
      reportSlug: rawOptions.reportSlug || existingRound?.reportSlug || buildDefaultReportSlug(),
      source: 'explicit',
      reservationPath: existingRound?.reservationPath ?? null,
      taskCardPath: existingRound?.taskCardPath ?? null,
    };
  }

  if (rawOptions.resume) {
    const openRound = findLatestOpenCrTask(tasksDir, rawOptions);
    if (openRound) {
      return {
        id: openRound.crTaskId,
        number: openRound.number,
        reportSlug: rawOptions.reportSlug || openRound.reportSlug || buildDefaultReportSlug(),
        source: 'resume-open-cr',
        reservationPath: null,
        taskCardPath: openRound.taskCardPath,
      };
    }

    const reservedRound = findLatestReservation(tasksDir, rawOptions);
    if (reservedRound) {
      return {
        id: reservedRound.crTaskId,
        number: reservedRound.number,
        reportSlug: rawOptions.reportSlug || reservedRound.reportSlug || buildDefaultReportSlug(),
        source: 'resume-reservation',
        reservationPath: reservedRound.reservationPath,
        taskCardPath: null,
      };
    }
  }

  return reserveNextCrRound(tasksDir, rawOptions);
}

export function resolveCrTaskId(tasksDir, explicitCrTaskId) {
  if (typeof explicitCrTaskId === 'string' && explicitCrTaskId.trim().length > 0) {
    validateCrTaskId(explicitCrTaskId.trim());
    return {
      number: Number.parseInt(explicitCrTaskId.slice(3), 10),
      id: explicitCrTaskId.trim(),
      source: 'explicit',
    };
  }

  const allocated = allocateNextCrTaskId(tasksDir);
  return {
    ...allocated,
    source: 'auto-allocated',
  };
}

function formatTimestampPart(value) {
  return String(value).padStart(2, '0');
}

export function formatIsoDate(date = new Date()) {
  const year = date.getFullYear();
  const month = formatTimestampPart(date.getMonth() + 1);
  const day = formatTimestampPart(date.getDate());

  return `${year}-${month}-${day}`;
}

export function buildDefaultReportSlug(date = new Date()) {
  const year = date.getFullYear();
  const month = formatTimestampPart(date.getMonth() + 1);
  const day = formatTimestampPart(date.getDate());
  const hour = formatTimestampPart(date.getHours());
  const minute = formatTimestampPart(date.getMinutes());

  return `working-tree-${year}${month}${day}-${hour}${minute}`;
}

export function buildVerificationBaseline(verification) {
  if (verification.length === 0) {
    return '- No verification commands were supplied.';
  }

  return verification.map((command) => `- ${command}`).join('\n');
}

export function buildReviewFocus(reviewFocus) {
  if (reviewFocus.length === 0) {
    return '- No extra focus areas were supplied.';
  }

  return reviewFocus.map((item) => `- ${item}`).join('\n');
}

export function buildReviewSurface(reviewSurface) {
  if (reviewSurface.length === 0) {
    return '- Canonical scope root only; no narrower review surface was supplied.';
  }

  return reviewSurface.map((item) => `- ${item}`).join('\n');
}

export function buildExtraDocs(extraDocs) {
  if (extraDocs.length === 0) {
    return 'none';
  }

  return extraDocs.join(', ');
}

export function renderPrompt(template, values) {
  let prompt = template;

  for (const [key, value] of Object.entries(values)) {
    prompt = prompt.replaceAll(`<${key}>`, value);
  }

  return prompt;
}

export function buildPromptResult(rawOptions) {
  ensureScopeKind(rawOptions.scopeKind);

  const tasksDir = resolveTasksDir(rawOptions.tasksDir);
  const sprintDir = dirname(tasksDir);
  const projectDir = dirname(sprintDir);
  const reviewDir = rawOptions.reviewDir
    ? resolve(rawOptions.reviewDir)
    : join(sprintDir, 'review');
  const enclosingSprintLabel = rawOptions.enclosingSprintLabel || basename(sprintDir);
  const projectLabel = basename(projectDir);
  const scopePath = deriveScopePath(rawOptions, tasksDir);

  if (!existsSync(scopePath)) {
    fail(`Scope path does not exist: ${scopePath}`);
  }

  if (!existsSync(reviewDir)) {
    fail(`Review directory does not exist: ${reviewDir}`);
  }

  const crRound = resolveCrRound(tasksDir, rawOptions);
  const roundNumber = rawOptions.roundNumber || String(crRound.number);
  const reportSlug = crRound.reportSlug;
  const roundType = rawOptions.roundType || 'initial';
  const template = readPromptTemplate();
  const defaultReviewSurface = buildDefaultReviewSurface({
    scopeKind: rawOptions.scopeKind,
    scopePath,
    tasksDir,
    commitPaths: rawOptions.commitPaths ?? [],
  });
  const reviewSurface =
    rawOptions.reviewSurface?.length > 0 ? rawOptions.reviewSurface : defaultReviewSurface;

  const prompt = renderPrompt(template, {
    scope_kind: rawOptions.scopeKind,
    scope_label: rawOptions.scopeLabel,
    scope_path: scopePath,
    enclosing_sprint_label: enclosingSprintLabel,
    review_dir: reviewDir,
    round_type: roundType,
    round_number: roundNumber,
    cr_task_id: crRound.id,
    report_slug: reportSlug,
    verification_baseline: buildVerificationBaseline(rawOptions.verification),
    extra_normative_docs: buildExtraDocs(rawOptions.extraDocs),
    review_focus: buildReviewFocus(rawOptions.reviewFocus),
    review_surface: buildReviewSurface(reviewSurface),
  });

  return {
    crTaskId: crRound.id,
    crTaskIdSource: crRound.source,
    crReservationPath: crRound.reservationPath,
    existingTaskCardPath: crRound.taskCardPath ?? null,
    roundNumber,
    reportSlug,
    reviewDir,
    enclosingSprintLabel,
    projectLabel,
    sprintDir,
    projectDir,
    tasksDir,
    scopeKind: rawOptions.scopeKind,
    scopeLabel: rawOptions.scopeLabel,
    scopePath,
    roundType,
    extraDocs: rawOptions.extraDocs,
    verification: rawOptions.verification,
    reviewFocus: rawOptions.reviewFocus,
    reviewSurface,
    prompt,
  };
}

function uniqueValues(values) {
  return [...new Set(values)];
}

function buildNumberedList(items, fallback = '待补充') {
  const normalizedItems = items.length > 0 ? items : [fallback];

  return normalizedItems.map((item, index) => `${index + 1}. ${item}`).join('\n');
}

function buildCrTitle({ scopeKind, scopeLabel, roundType, roundNumber }) {
  if (roundType === 'project-final') {
    return `${scopeLabel} final delegated review loop round ${roundNumber}`;
  }

  if (roundType === 'post-fix recheck') {
    return `${scopeLabel} delegated recheck loop round ${roundNumber}`;
  }

  if (scopeKind === 'task') {
    return `${scopeLabel} delegated review loop round ${roundNumber}`;
  }

  if (scopeKind === 'project') {
    return `${scopeLabel} project delegated review loop round ${roundNumber}`;
  }

  return `${scopeLabel} delegated review loop round ${roundNumber}`;
}

function extractProjectToken(projectLabel) {
  const match = projectLabel.match(/^(project-\d{3})/u);
  return match ? match[1] : projectLabel;
}

function extractSprintToken(scopeLabel) {
  const match = scopeLabel.match(/^(sprint-\d{3})/u);
  return match ? match[1] : scopeLabel;
}

function buildDefaultCommitMessage({ scopeKind, scopeLabel, projectLabel }) {
  const projectToken = extractProjectToken(projectLabel);

  if (scopeKind === 'task') {
    return `feat(${scopeLabel}): complete task and clear cr loop`;
  }

  if (scopeKind === 'project') {
    return `chore(${projectToken}): complete project and clear final cr loop`;
  }

  const sprintToken = extractSprintToken(scopeLabel);
  return `chore(${projectToken}-${sprintToken}): complete sprint and clear cr loop`;
}

function buildCrGoal({ scopeKind, scopeLabel, roundNumber }) {
  if (scopeKind === 'task') {
    return `对 ${scopeLabel} 当前实现结果发起第 ${roundNumber} 轮 fresh code review，确认不存在阻止该任务进入 clean state 的 actionable findings。`;
  }

  if (scopeKind === 'project') {
    return `对 ${scopeLabel} 当前 closeout-ready state 发起第 ${roundNumber} 轮项目级 fresh code review，确认不存在阻止该 project 进入 final closeout 的 actionable findings。`;
  }

  return `对 ${scopeLabel} 当前实现/收口面发起第 ${roundNumber} 轮 fresh code review，确认不存在阻止该 sprint 进入 closeout 的 actionable findings。`;
}

function buildExpectedOutputs({ scopeLabel, crTaskId, reportPaths, taskCardPath }) {
  return [
    `${scopeLabel} 当前轮次 CR 报告`,
    `与报告同步的 \`${crTaskId}\` task card / canonical task-ledger sqlite / rendered checklist/tasks.csv`,
    `建议 review 文档路径：\`${basename(reportPaths.pending)}\`、\`${basename(reportPaths.verified)}\`、\`${basename(reportPaths.resolved)}\``,
    `任务卡路径：\`${taskCardPath}\``,
  ];
}

function buildDefaultDependsOn({ scopeKind, scopeLabel, roundType }) {
  if (roundType === 'project-final') {
    return [`${scopeLabel} final sprint clean state`];
  }

  if (scopeKind === 'task') {
    return [`\`${scopeLabel}\` 当前实现结果`];
  }

  if (scopeKind === 'project') {
    return [`\`${scopeLabel}\` 当前 project-level closeout-ready state`];
  }

  return [`\`${scopeLabel}\` in-scope implementation tasks`];
}

function buildDefaultImplementationPlan() {
  return [
    '调起全新子 agent 执行当前边界的 fresh review。',
    '主 agent 复核 findings，并将结论推进到 `verified`。',
    '对 `accepted` findings 进行修复、验证并推进到 `resolved`。',
  ];
}

function buildDefaultExecutionRecord(date) {
  return [`${date}：任务创建，状态初始化为 \`review_pending\`。`];
}

export function buildReviewArtifactPaths(reviewDir, reportSlug) {
  return {
    pending: join(reviewDir, `code_review_${reportSlug}.md`),
    verified: join(reviewDir, `verified_code_review_${reportSlug}.md`),
    resolved: join(reviewDir, `resolved_code_review_${reportSlug}.md`),
  };
}

function buildDefaultRequiredInputs(extraDocs) {
  return uniqueValues([...DEFAULT_REQUIRED_INPUTS, ...extraDocs]);
}

function buildDefaultReviewSurface({ scopeKind, scopePath, tasksDir, commitPaths }) {
  const normalizedTasksDir = relative(process.cwd(), tasksDir).replace(/\\/gu, '/');
  const normalizedScopePath = relative(process.cwd(), scopePath).replace(/\\/gu, '/');
  const surfaces = [];

  if (commitPaths.length > 0) {
    for (const commitPath of commitPaths) {
      const normalizedCommitPath = relative(process.cwd(), resolve(commitPath)).replace(
        /\\/gu,
        '/',
      );
      surfaces.push(`Boundary-owned path: ${normalizedCommitPath}`);
    }
  }

  surfaces.push(`Canonical ${scopeKind} scope root: ${normalizedScopePath}`);
  surfaces.push(`Owning sprint tasks directory: ${normalizedTasksDir}`);

  return uniqueValues(surfaces);
}

function buildDefaultTracebackReferences({ sprintDir, projectDir, scopeKind }) {
  const references = [join(sprintDir, 'plan.md')];

  if (scopeKind === 'project') {
    references.unshift(join(projectDir, 'plan.md'));
  }

  references.push('.codex/skills/workspace-code-review-workflow/SKILL.md');
  references.push('.codex/skills/workspace-delivery-finisher/SKILL.md');

  return references;
}

function buildDefaultDeliveryGovernanceCommands(tasksDir) {
  const normalizedTasksDir = relative(process.cwd(), tasksDir).replace(/\\/gu, '/');

  return [
    `node ./scripts/governance/sync-task-ledger.js --tasks-dir "${normalizedTasksDir}"`,
    'node ./scripts/governance/check-code-review-status-sync.js',
    'node ./scripts/governance/check-task-ledger-sync.js',
    'node ./scripts/governance/check-sprint-plan-status-sync.js',
    'node ./scripts/governance/check-worktree-review-target.js',
  ];
}

function buildDefaultDeliveryVerification(deliveryVerification, verification, tasksDir) {
  if (deliveryVerification.length > 0) {
    return deliveryVerification;
  }

  return uniqueValues([...verification, ...buildDefaultDeliveryGovernanceCommands(tasksDir)]);
}

export function buildTaskCardMarkdown(rawOptions) {
  const promptResult = buildPromptResult(rawOptions);
  const date = rawOptions.date || formatIsoDate();
  const owner = rawOptions.owner || 'AI-Agent';
  const priority =
    rawOptions.priority ||
    (promptResult.scopeKind === 'project' || promptResult.roundType === 'project-final'
      ? 'P2'
      : 'P1');
  const title =
    rawOptions.title ||
    buildCrTitle({
      scopeKind: promptResult.scopeKind,
      scopeLabel: promptResult.scopeLabel,
      roundType: promptResult.roundType,
      roundNumber: promptResult.roundNumber,
    });
  const goal =
    rawOptions.goal ||
    buildCrGoal({
      scopeKind: promptResult.scopeKind,
      scopeLabel: promptResult.scopeLabel,
      roundNumber: promptResult.roundNumber,
    });
  const reportPaths = buildReviewArtifactPaths(promptResult.reviewDir, promptResult.reportSlug);
  const taskCardPath =
    promptResult.existingTaskCardPath || join(promptResult.tasksDir, `${promptResult.crTaskId}.md`);
  const suggestedCommitMessage =
    rawOptions.suggestedCommitMessage ||
    buildDefaultCommitMessage({
      scopeKind: promptResult.scopeKind,
      scopeLabel: promptResult.scopeLabel,
      projectLabel: promptResult.projectLabel,
    });

  const requiredInputs =
    rawOptions.requiredInputs.length > 0
      ? rawOptions.requiredInputs
      : buildDefaultRequiredInputs(promptResult.extraDocs);
  const tracebackReferences =
    rawOptions.tracebackReferences.length > 0
      ? rawOptions.tracebackReferences
      : buildDefaultTracebackReferences({
          sprintDir: promptResult.sprintDir,
          projectDir: promptResult.projectDir,
          scopeKind: promptResult.scopeKind,
        });
  const dependsOn =
    rawOptions.dependsOn.length > 0
      ? rawOptions.dependsOn
      : buildDefaultDependsOn({
          scopeKind: promptResult.scopeKind,
          scopeLabel: promptResult.scopeLabel,
          roundType: promptResult.roundType,
        });
  const implementationPlan =
    rawOptions.implementationSteps.length > 0
      ? rawOptions.implementationSteps
      : buildDefaultImplementationPlan();
  const developmentVerification =
    rawOptions.developmentVerification.length > 0
      ? rawOptions.developmentVerification
      : promptResult.verification;
  const deliveryVerification = buildDefaultDeliveryVerification(
    rawOptions.deliveryVerification,
    promptResult.verification,
    promptResult.tasksDir,
  );
  const outputs =
    rawOptions.outputs.length > 0
      ? rawOptions.outputs
      : buildExpectedOutputs({
          scopeLabel: promptResult.scopeLabel,
          crTaskId: promptResult.crTaskId,
          reportPaths,
          taskCardPath,
        });
  const executionRecord = buildDefaultExecutionRecord(date);
  const producedArtifacts = [reportPaths.pending, taskCardPath];

  const markdown = `# ${promptResult.crTaskId} ${title}

- Status: \`review_pending\`
- Date: ${date}
- Owner: \`${owner}\`
- Priority: \`${priority}\`
- Project: \`${promptResult.projectLabel}\`
- Sprint: \`${promptResult.enclosingSprintLabel}\`
- Scope Kind: \`${promptResult.scopeKind}\`
- Scope Label: \`${promptResult.scopeLabel}\`
- Round Type: \`${promptResult.roundType}\`

## 1. 任务目标

${goal}

## 2. Depends On

${buildNumberedList(dependsOn)}

## 3. 预期产物

${buildNumberedList(outputs)}

## 4. Required Inputs

${buildNumberedList(requiredInputs)}

## 5. Traceback References

${buildNumberedList(tracebackReferences, '不适用')}

## 6. 实施计划

${buildNumberedList(implementationPlan)}

## 7. Development Verification

${buildNumberedList(developmentVerification, '待补充开发验证命令')}

## 8. Delivery Verification

${buildNumberedList(deliveryVerification, '待补充交付验证命令')}

## 9. 执行记录

${buildNumberedList(executionRecord)}

## 10. 产出

${buildNumberedList(producedArtifacts)}
`;

  return {
    ...promptResult,
    date,
    owner,
    priority,
    title,
    goal,
    taskCardPath,
    reportPaths,
    requiredInputs,
    tracebackReferences,
    dependsOn,
    implementationPlan,
    developmentVerification,
    deliveryVerification,
    outputs,
    markdown,
    suggestedCommitMessage,
  };
}

export function finalizeCrRoundReservation(result) {
  if (!result?.crTaskId) {
    return;
  }

  releaseReservation(result.tasksDir, result.crTaskId);
}
