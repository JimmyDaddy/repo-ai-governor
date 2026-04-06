import { existsSync, readdirSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { dirname, relative, resolve } from 'node:path';
import {
  type CliReviewLifecycleStatus,
  CliReviewScopeMode,
} from '../../constants/cli-review.constant.js';
import type {
  CliCommandExecutorContext,
  CliReviewStreamContext,
} from '../../types/interfaces/index.js';

interface CliReviewTaskCardMetadata {
  date: string;
  owner: string;
  priority: string;
  project: string | null;
  sprint: string | null;
}

interface CliManagedReviewTaskContext {
  tasksDirPath: string;
  currentContextPath: string | null;
  projectId: string | null;
  sprintId: string | null;
  sourceTaskCardPath: string | null;
}

interface CliReviewTaskCardRecord {
  reviewTaskId: string;
  reviewTaskCardPath: string;
}

/**
 * Owns CLI-managed `CR-xxx` task-card allocation and lifecycle synchronization.
 *
 * Why this exists:
 * product review commands now need the same task-card truth surface as the repo-local
 * governance workflow instead of only producing markdown review artifacts and CSV backfill.
 */
export class CliReviewTaskCardRuntime {
  public constructor(
    private readonly repositoryRoot: string,
    private readonly workspaceRoot: string,
  ) {}

  /**
   * Resolves whether the current review invocation can write canonical `CR-xxx` task cards.
   * @param options Active stream metadata plus optional task-scoped source id.
   * @returns Managed task context or `null` when the current workspace lacks a task surface.
   */
  public async resolveManagedContext(options: {
    streamContext: CliReviewStreamContext;
    scopeTaskId: string | null;
  }): Promise<CliManagedReviewTaskContext | null> {
    if (options.streamContext.tasksDirPath) {
      const derivedIds = this.deriveProjectAndSprintFromTasksDir(
        options.streamContext.tasksDirPath,
      );
      return {
        tasksDirPath: options.streamContext.tasksDirPath,
        currentContextPath: options.streamContext.currentContextPath,
        projectId: options.streamContext.projectId ?? derivedIds.projectId,
        sprintId: options.streamContext.sprintId ?? derivedIds.sprintId,
        sourceTaskCardPath:
          options.scopeTaskId && options.scopeTaskId.trim().length > 0
            ? this.findTaskCardPath(
                resolve(this.workspaceRoot, 'context', 'dev'),
                options.scopeTaskId,
              )
            : null,
      };
    }

    if (!options.scopeTaskId || options.scopeTaskId.trim().length === 0) {
      return null;
    }

    const sourceTaskCardPath = this.findTaskCardPath(
      resolve(this.workspaceRoot, 'context', 'dev'),
      options.scopeTaskId,
    );
    if (!sourceTaskCardPath) {
      return null;
    }

    const taskCardContent = await readFile(sourceTaskCardPath, 'utf8');
    const metadata = this.parseMetadataSection(taskCardContent);
    const derivedIds = this.deriveProjectAndSprintFromTasksDir(dirname(sourceTaskCardPath));
    return {
      tasksDirPath: dirname(sourceTaskCardPath),
      currentContextPath: options.streamContext.currentContextPath,
      projectId: this.readMetadataValue(metadata, 'Project') || derivedIds.projectId,
      sprintId: this.readMetadataValue(metadata, 'Sprint') || derivedIds.sprintId,
      sourceTaskCardPath,
    };
  }

  /**
   * Allocates and writes one new canonical `CR-xxx` task card for the current review round.
   * @param context Command execution context.
   * @param options Review scope, status, and artifact metadata.
   * @returns Task-card id plus path.
   */
  public async createReviewTaskCard(
    context: CliCommandExecutorContext,
    options: {
      managedContext: CliManagedReviewTaskContext;
      reviewMode: CliReviewScopeMode;
      scopeTaskId: string | null;
      reviewSlug: string;
      reviewStatus: CliReviewLifecycleStatus;
      occurredAt: string;
      reviewArtifactPath: string;
      requestPath: string;
    },
  ): Promise<CliReviewTaskCardRecord> {
    const reviewTaskId = this.allocateNextReviewTaskId(options.managedContext.tasksDirPath);
    const title = this.buildTitle({
      reviewMode: options.reviewMode,
      scopeTaskId: options.scopeTaskId,
      reviewSlug: options.reviewSlug,
    });
    const reviewTaskCardPath = resolve(
      options.managedContext.tasksDirPath,
      `${reviewTaskId}-${this.slugifyTitle(title)}.md`,
    );
    const dateOnly = options.occurredAt.slice(0, 10);
    const executionRecords = [
      `${dateOnly}: review created ${reviewTaskId} and initialized status to ${options.reviewStatus}.`,
    ];
    const outputs = [
      this.toRepositoryRelativePath(options.reviewArtifactPath),
      this.toRepositoryRelativePath(options.requestPath),
    ];

    await context.artifactWriter.writeTextArtifact(
      reviewTaskCardPath,
      this.renderTaskCard({
        reviewTaskId,
        title,
        status: options.reviewStatus,
        metadata: {
          date: dateOnly,
          owner: 'repo-ai-governor CLI',
          priority: 'P1',
          project: options.managedContext.projectId,
          sprint: options.managedContext.sprintId,
        },
        reviewMode: options.reviewMode,
        scopeTaskId: options.scopeTaskId,
        reviewSlug: options.reviewSlug,
        currentContextPath: options.managedContext.currentContextPath,
        sourceTaskCardPath: options.managedContext.sourceTaskCardPath,
        executionRecords,
        outputs,
      }),
    );

    return {
      reviewTaskId,
      reviewTaskCardPath,
    };
  }

  /**
   * Updates one existing managed review task card to match the latest lifecycle state.
   * @param context Command execution context.
   * @param options Existing task identity plus new lifecycle metadata.
   * @returns Resolved task-card identity after the update.
   */
  public async updateReviewTaskCard(
    context: CliCommandExecutorContext,
    options: {
      managedContext: CliManagedReviewTaskContext | null;
      reviewTaskId: string;
      reviewTaskCardPath?: string | null;
      reviewMode: CliReviewScopeMode;
      scopeTaskId: string | null;
      reviewSlug: string;
      reviewStatus: CliReviewLifecycleStatus;
      occurredAt: string;
      reviewArtifactPath: string;
      requestPath?: string | null;
      verifyResultPath?: string | null;
      ledgerBackfillPath?: string | null;
      executionNote: string;
    },
  ): Promise<CliReviewTaskCardRecord | null> {
    const managedContext =
      options.managedContext ??
      (options.reviewTaskCardPath
        ? {
            tasksDirPath: dirname(options.reviewTaskCardPath),
            currentContextPath: null,
            projectId: null,
            sprintId: null,
            sourceTaskCardPath: null,
          }
        : null);
    if (!managedContext) {
      return null;
    }

    const title = this.buildTitle({
      reviewMode: options.reviewMode,
      scopeTaskId: options.scopeTaskId,
      reviewSlug: options.reviewSlug,
    });
    const reviewTaskCardPath =
      (typeof options.reviewTaskCardPath === 'string' && options.reviewTaskCardPath.length > 0
        ? options.reviewTaskCardPath
        : this.findTaskCardPath(managedContext.tasksDirPath, options.reviewTaskId)) ??
      resolve(
        managedContext.tasksDirPath,
        `${options.reviewTaskId}-${this.slugifyTitle(title)}.md`,
      );
    const existingContent = existsSync(reviewTaskCardPath)
      ? await readFile(reviewTaskCardPath, 'utf8')
      : null;
    const metadata = this.resolveMetadata(existingContent, {
      occurredAt: options.occurredAt.slice(0, 10),
      projectId: managedContext.projectId,
      sprintId: managedContext.sprintId,
    });
    const executionRecords = this.mergeUniqueItems(
      this.parseSectionList(existingContent, '执行记录'),
      [options.executionNote],
    );
    const outputs = this.mergeUniqueItems(this.parseSectionList(existingContent, '产出'), [
      this.toRepositoryRelativePath(options.reviewArtifactPath),
      ...(options.requestPath ? [this.toRepositoryRelativePath(options.requestPath)] : []),
      ...(options.verifyResultPath
        ? [this.toRepositoryRelativePath(options.verifyResultPath)]
        : []),
      ...(options.ledgerBackfillPath
        ? [this.toRepositoryRelativePath(options.ledgerBackfillPath)]
        : []),
    ]);

    await context.artifactWriter.writeTextArtifact(
      reviewTaskCardPath,
      this.renderTaskCard({
        reviewTaskId: options.reviewTaskId,
        title,
        status: options.reviewStatus,
        metadata,
        reviewMode: options.reviewMode,
        scopeTaskId: options.scopeTaskId,
        reviewSlug: options.reviewSlug,
        currentContextPath: managedContext.currentContextPath,
        sourceTaskCardPath: managedContext.sourceTaskCardPath,
        executionRecords,
        outputs,
      }),
    );

    return {
      reviewTaskId: options.reviewTaskId,
      reviewTaskCardPath,
    };
  }

  private resolveMetadata(
    existingContent: string | null,
    defaults: {
      occurredAt: string;
      projectId: string | null;
      sprintId: string | null;
    },
  ): CliReviewTaskCardMetadata {
    const metadata = this.parseMetadataSection(existingContent ?? '');
    return {
      date: this.readMetadataValue(metadata, 'Date') || defaults.occurredAt,
      owner: this.readMetadataValue(metadata, 'Owner') || 'repo-ai-governor CLI',
      priority: this.readMetadataValue(metadata, 'Priority') || 'P1',
      project: this.readMetadataValue(metadata, 'Project') || defaults.projectId,
      sprint: this.readMetadataValue(metadata, 'Sprint') || defaults.sprintId,
    };
  }

  private renderTaskCard(options: {
    reviewTaskId: string;
    title: string;
    status: CliReviewLifecycleStatus;
    metadata: CliReviewTaskCardMetadata;
    reviewMode: CliReviewScopeMode;
    scopeTaskId: string | null;
    reviewSlug: string;
    currentContextPath: string | null;
    sourceTaskCardPath: string | null;
    executionRecords: string[];
    outputs: string[];
  }): string {
    const scopeLabel =
      options.reviewMode === CliReviewScopeMode.TASK_SCOPE && options.scopeTaskId
        ? `task ${options.scopeTaskId}`
        : `working tree (${options.reviewSlug})`;
    const dependsOn = options.scopeTaskId
      ? [`\`${options.scopeTaskId}\``]
      : ['`repo-ai-governor review` command invocation'];
    const requiredInputs = this.compactList([
      options.currentContextPath
        ? `\`${this.toRepositoryRelativePath(options.currentContextPath)}\``
        : null,
      options.sourceTaskCardPath
        ? `\`${this.toRepositoryRelativePath(options.sourceTaskCardPath)}\``
        : null,
      '`review lifecycle artifact generated by the same command chain`',
    ]);
    const tracebackReferences = this.compactList([
      options.sourceTaskCardPath
        ? `\`${this.toRepositoryRelativePath(options.sourceTaskCardPath)}\``
        : null,
      options.currentContextPath
        ? `\`${this.toRepositoryRelativePath(options.currentContextPath)}\``
        : null,
    ]);
    const outputLines =
      options.outputs.length > 0
        ? options.outputs.map((item) => `\`${item}\``)
        : ['待执行：review outputs'];

    return [
      `# ${options.reviewTaskId} ${options.title}`,
      '',
      `- Status: ${options.status}`,
      `- Date: ${options.metadata.date}`,
      `- Owner: ${options.metadata.owner}`,
      `- Priority: ${options.metadata.priority}`,
      `- Project: \`${options.metadata.project ?? 'unknown-project'}\``,
      `- Sprint: \`${options.metadata.sprint ?? 'unknown-sprint'}\``,
      '',
      '## 1. 任务目标',
      '',
      `为 ${scopeLabel} 的 review lifecycle 提供独立的 \`${options.reviewTaskId}\` 真值，并让任务卡状态与 review artifact 保持同步。`,
      '',
      '## 2. Depends On',
      '',
      ...dependsOn.map((item, index) => `${index + 1}. ${item}`),
      '',
      '## 3. 预期产物',
      '',
      '1. 与当前评审轮次绑定的 `CR-xxx` 任务卡',
      '2. 同步状态的 review lifecycle artifact',
      '3. 与任务卡一致的 checklist / tasks.csv 派生视图',
      '',
      '## 4. Required Inputs',
      '',
      ...requiredInputs.map((item, index) => `${index + 1}. ${item}`),
      '',
      '## 5. Traceback References',
      '',
      ...(tracebackReferences.length > 0
        ? tracebackReferences.map((item, index) => `${index + 1}. ${item}`)
        : ['1. 不适用']),
      '',
      '## 6. 实施计划',
      '',
      '1. 为当前 review round 分配独立 `CR-xxx` 编号。',
      '2. 让任务卡状态与 review artifact 生命周期保持一致。',
      '3. 同步 `tasks/checklist.md` 与 `tasks/tasks.csv` 的派生视图。',
      '',
      '## 7. Development Verification',
      '',
      '1. `repo-ai-governor review-verify --output json`',
      '',
      '## 8. Delivery Verification',
      '',
      '1. `node ./scripts/governance/check-task-ledger-sync.js`',
      '2. `node ./scripts/governance/check-code-review-status-sync.js`',
      '',
      '## 9. 执行记录',
      '',
      ...options.executionRecords.map((item, index) => `${index + 1}. ${item}`),
      '',
      '## 10. 产出',
      '',
      ...outputLines.map((item, index) => `${index + 1}. ${item}`),
      '',
    ].join('\n');
  }

  private buildTitle(options: {
    reviewMode: CliReviewScopeMode;
    scopeTaskId: string | null;
    reviewSlug: string;
  }): string {
    if (options.reviewMode === CliReviewScopeMode.TASK_SCOPE && options.scopeTaskId) {
      return `review lifecycle for ${options.scopeTaskId}`;
    }

    return `working tree review lifecycle ${options.reviewSlug}`;
  }

  private allocateNextReviewTaskId(tasksDirPath: string): string {
    let highest = 0;
    if (!existsSync(tasksDirPath)) {
      return 'CR-001';
    }

    for (const fileName of readdirSync(tasksDirPath)) {
      const match = fileName.match(/^CR-(\d{3})(?:[-.]|$)/u);
      if (match) {
        highest = Math.max(highest, Number.parseInt(match[1], 10));
      }
    }

    return `CR-${String(highest + 1).padStart(3, '0')}`;
  }

  private findTaskCardPath(rootDirectory: string, taskId: string): string | null {
    const pendingDirectories = [rootDirectory];

    while (pendingDirectories.length > 0) {
      const currentDirectory = pendingDirectories.pop();
      if (!currentDirectory || !existsSync(currentDirectory)) {
        continue;
      }

      for (const entry of readdirSync(currentDirectory, { withFileTypes: true })) {
        const entryPath = resolve(currentDirectory, entry.name);
        if (entry.isDirectory()) {
          pendingDirectories.push(entryPath);
          continue;
        }

        if (
          entry.isFile() &&
          (entry.name === `${taskId}.md` ||
            (entry.name.startsWith(`${taskId}-`) && entry.name.endsWith('.md')))
        ) {
          return entryPath;
        }
      }
    }

    return null;
  }

  private deriveProjectAndSprintFromTasksDir(tasksDirPath: string): {
    projectId: string | null;
    sprintId: string | null;
  } {
    const normalizedPath = tasksDirPath.replace(/\\/gu, '/').replace(/\/+$/u, '');
    const match = normalizedPath.match(/context\/dev\/([^/]+)\/([^/]+)\/tasks$/u);
    return {
      projectId: match?.[1] ?? null,
      sprintId: match?.[2] ?? null,
    };
  }

  private parseMetadataSection(content: string): Map<string, string> {
    const metadata = new Map<string, string>();
    for (const line of content.split(/\r?\n/u)) {
      if (line.startsWith('## ')) {
        break;
      }

      const metadataMatch = line.match(/^- ([^:]+):\s*(.+)$/u);
      if (!metadataMatch) {
        continue;
      }

      metadata.set(metadataMatch[1].trim(), metadataMatch[2].trim());
    }

    return metadata;
  }

  private readMetadataValue(metadata: Map<string, string>, key: string): string {
    return (metadata.get(key) ?? '').replace(/^`(.+)`$/u, '$1').trim();
  }

  private normalizeSectionHeading(headingText: string): string {
    return headingText
      .replace(/^\d+(?:\.\d+)*\.?\s*/u, '')
      .trim()
      .toLowerCase();
  }

  private extractSection(content: string, headingText: string): string {
    const normalizedHeadingText = this.normalizeSectionHeading(headingText);
    const headingPattern = /^##\s+([^\n]+)$/gmu;
    const headingMatches = Array.from(content.matchAll(headingPattern));

    for (let index = 0; index < headingMatches.length; index += 1) {
      const currentHeadingMatch = headingMatches[index];
      const rawHeadingText = currentHeadingMatch[1]?.trim() ?? '';
      const currentHeadingIndex = currentHeadingMatch.index;
      if (typeof currentHeadingIndex !== 'number') {
        continue;
      }

      if (this.normalizeSectionHeading(rawHeadingText) !== normalizedHeadingText) {
        continue;
      }

      const sectionStart = currentHeadingIndex + currentHeadingMatch[0].length;
      const sectionEnd = headingMatches[index + 1]?.index ?? content.length;
      return content.slice(sectionStart, sectionEnd).trim();
    }

    return '';
  }

  private parseSectionList(content: string | null, headingText: string): string[] {
    if (!content) {
      return [];
    }

    return this.extractSection(content, headingText)
      .split(/\r?\n/u)
      .map((line) => line.trim())
      .filter((line) => /^\d+\.\s+/u.test(line) || /^[-*]\s+/u.test(line))
      .map((line) =>
        line
          .replace(/^\d+\.\s+/u, '')
          .replace(/^[-*]\s+/u, '')
          .trim(),
      )
      .filter((line) => line.length > 0);
  }

  private mergeUniqueItems(current: string[], next: string[]): string[] {
    return [...new Set([...current, ...next.filter((item) => item.length > 0)])];
  }

  private compactList(values: Array<string | null>): string[] {
    return values.filter((value): value is string => typeof value === 'string' && value.length > 0);
  }

  private slugifyTitle(title: string): string {
    const normalized = title
      .normalize('NFKD')
      .replace(/[^\w\s-]/gu, ' ')
      .toLowerCase()
      .trim()
      .replace(/[\s_-]+/gu, '-')
      .replace(/^-+|-+$/gu, '');

    return normalized.length > 0 ? normalized : 'review-lifecycle';
  }

  private toRepositoryRelativePath(targetPath: string): string {
    return relative(this.repositoryRoot, targetPath).replace(/\\/gu, '/');
  }
}
