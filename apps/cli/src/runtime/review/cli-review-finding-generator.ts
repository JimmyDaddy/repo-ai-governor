import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import {
  type ChangeRiskEvaluationResult,
  type ChangeRiskReason,
  ChangeRiskReasonCode,
} from '@repo-ai-governor/core-change-risk';
import {
  ReviewFindingSourceType,
  ReviewRuleExecutionMode,
  phaseAReviewRuleRegistry,
} from '@repo-ai-governor/standards';
import {
  CLI_REVIEW_FINDING_SEVERITY_PRIORITY,
  CLI_REVIEW_TODO_MARKERS,
  CliReviewFindingRuleId,
  CliReviewFindingSeverity,
} from '../../constants/cli-review.constant.js';
import type { CliReviewFinding } from '../../types/interfaces/cli-review-command.interface.js';

/**
 * Owns heuristic finding generation for the CLI review lifecycle baseline.
 *
 * Why this exists:
 * review/review-verify need deterministic, replayable findings from local scope facts without
 * scattering risk-reason mapping, marker scanning, and test-coverage heuristics across commands.
 */
export class CliReviewFindingGenerator {
  public constructor(
    private readonly repositoryRoot: string,
    private readonly localizeText: (english: string, chinese: string) => string,
  ) {}

  /**
   * Generates structured review findings from changed-path heuristics and shared risk facts.
   * @param options Review scope facts captured before artifact persistence.
   * @returns Stable sorted findings suitable for markdown + transport projection.
   */
  public async generateFindings(options: {
    changedPaths: string[];
    riskEvaluation: ChangeRiskEvaluationResult;
  }): Promise<CliReviewFinding[]> {
    const findings = new Map<string, CliReviewFinding>();

    for (const riskReason of options.riskEvaluation.riskReasons) {
      const finding = this.createRiskReasonFinding(riskReason, options.changedPaths);
      if (finding) {
        findings.set(finding.fingerprint, finding);
      }
    }

    for (const todoFinding of await this.collectTodoMarkerFindings(options.changedPaths)) {
      findings.set(todoFinding.fingerprint, todoFinding);
    }

    const missingTestCoverageFinding = this.createMissingTestCoverageFinding(options.changedPaths);
    if (missingTestCoverageFinding) {
      findings.set(missingTestCoverageFinding.fingerprint, missingTestCoverageFinding);
    }

    return Array.from(findings.values()).sort((left, right) => {
      const severityDelta =
        CLI_REVIEW_FINDING_SEVERITY_PRIORITY[left.severity] -
        CLI_REVIEW_FINDING_SEVERITY_PRIORITY[right.severity];
      if (severityDelta !== 0) {
        return severityDelta;
      }

      const fileDelta = left.file.localeCompare(right.file);
      if (fileDelta !== 0) {
        return fileDelta;
      }

      return (left.line ?? 0) - (right.line ?? 0);
    });
  }

  private createRiskReasonFinding(
    riskReason: ChangeRiskReason,
    changedPaths: string[],
  ): CliReviewFinding | null {
    switch (riskReason.code) {
      case ChangeRiskReasonCode.LOCKFILE_DELTA:
        return this.createFinding({
          ruleId: CliReviewFindingRuleId.LOCKFILE_DELTA,
          sourceType: ReviewFindingSourceType.RISK_INFERENCE,
          executionMode: ReviewRuleExecutionMode.DETERMINISTIC,
          severity: CliReviewFindingSeverity.P2,
          file: this.findFirstMatchingPath(changedPaths, (path) => path.endsWith('pnpm-lock.yaml')),
          title: this.localizeText(
            'Lockfile delta needs dependency validation',
            '锁文件变更需要依赖验证',
          ),
          summary: this.localizeText(
            'The working tree changed pnpm-lock.yaml, so dependency resolution may have shifted beyond the reviewed source edits.',
            '当前变更触及 pnpm-lock.yaml，说明依赖解析结果可能已经超出源代码改动本身。',
          ),
          impact: this.localizeText(
            'Without install/build/test evidence, later environments can diverge from the reviewed behavior.',
            '如果没有 install/build/test 证据，后续环境里的真实行为可能与当前评审结论不一致。',
          ),
          suggestedAction: this.localizeText(
            'Review the lockfile delta and attach install/build/test evidence before delivery.',
            '请核对锁文件差异，并在交付前补齐 install/build/test 证据。',
          ),
          evidence: riskReason.evidence,
        });
      case ChangeRiskReasonCode.MIGRATION_DETECTED:
        return this.createFinding({
          ruleId: CliReviewFindingRuleId.MIGRATION_DETECTED,
          sourceType: ReviewFindingSourceType.RISK_INFERENCE,
          executionMode: ReviewRuleExecutionMode.DETERMINISTIC,
          severity: CliReviewFindingSeverity.P1,
          file: this.findFirstMatchingPath(
            changedPaths,
            (path) => path.includes('migration') || path.includes('migrations'),
          ),
          title: this.localizeText(
            'Migration change needs explicit governance review',
            '迁移类改动需要显式治理复核',
          ),
          summary: this.localizeText(
            'The current scope contains migration-related paths, which the product baseline treats as high-risk changes.',
            '当前评审范围包含 migration 相关路径，按产品基线应视为高风险改动。',
          ),
          impact: this.localizeText(
            'Unreviewed migration changes can create irreversible runtime or data-state drift.',
            '未被显式复核的迁移改动可能带来不可逆的运行时或数据状态漂移。',
          ),
          suggestedAction: this.localizeText(
            'Require explicit maintainer review and validate rollback/recovery evidence before applying the migration.',
            '请先完成显式 maintainer 复核，并在应用前验证回滚/恢复证据。',
          ),
          evidence: riskReason.evidence,
        });
      case ChangeRiskReasonCode.CI_WORKFLOW_CHANGED:
        return this.createFinding({
          ruleId: CliReviewFindingRuleId.CI_WORKFLOW_CHANGED,
          sourceType: ReviewFindingSourceType.RISK_INFERENCE,
          executionMode: ReviewRuleExecutionMode.DETERMINISTIC,
          severity: CliReviewFindingSeverity.P1,
          file: this.findFirstMatchingPath(changedPaths, (path) =>
            path.includes('.github/workflows/'),
          ),
          title: this.localizeText(
            'CI workflow change needs maintainer review',
            'CI 工作流变更需要 maintainer 复核',
          ),
          summary: this.localizeText(
            'The current scope modifies CI workflow files, which can silently alter release and verification behavior.',
            '当前评审范围改动了 CI workflow 文件，这会静默改变发布与验证行为。',
          ),
          impact: this.localizeText(
            'A workflow regression can bypass governance gates or block delivery after merge.',
            '一旦 workflow 回归，可能在合并后绕过治理门禁，或直接阻塞交付。',
          ),
          suggestedAction: this.localizeText(
            'Require explicit maintainer review and rerun the affected CI quality gates before merge.',
            '请先完成 maintainer 复核，并在合并前重跑受影响的 CI 质量门禁。',
          ),
          evidence: riskReason.evidence,
        });
      case ChangeRiskReasonCode.RELEASE_SCRIPT_CHANGED:
        return this.createFinding({
          ruleId: CliReviewFindingRuleId.RELEASE_SCRIPT_CHANGED,
          sourceType: ReviewFindingSourceType.RISK_INFERENCE,
          executionMode: ReviewRuleExecutionMode.DETERMINISTIC,
          severity: CliReviewFindingSeverity.P1,
          file: this.findFirstMatchingPath(changedPaths, (path) =>
            path.includes('scripts/release'),
          ),
          title: this.localizeText(
            'Release script change needs explicit validation',
            '发布脚本变更需要显式验证',
          ),
          summary: this.localizeText(
            'The current scope changes release automation, so delivery semantics may differ from previous audited runs.',
            '当前评审范围修改了 release automation，交付语义可能与之前审计过的运行结果不同。',
          ),
          impact: this.localizeText(
            'A release-script regression can publish the wrong artifact or skip required governance checks.',
            '发布脚本回归可能导致错误产物被发布，或跳过必要的治理检查。',
          ),
          suggestedAction: this.localizeText(
            'Validate the release flow in a rehearsal path and require explicit maintainer approval before rollout.',
            '请先在 rehearsal 路径中验证发布流程，并在 rollout 前获得显式 maintainer 批准。',
          ),
          evidence: riskReason.evidence,
        });
      case ChangeRiskReasonCode.SENSITIVE_PATH_CHANGED:
        return this.createFinding({
          ruleId: CliReviewFindingRuleId.SENSITIVE_PATH_CHANGED,
          sourceType: ReviewFindingSourceType.RISK_INFERENCE,
          executionMode: ReviewRuleExecutionMode.DETERMINISTIC,
          severity: CliReviewFindingSeverity.P1,
          file: this.findFirstMatchingPath(changedPaths, (path) =>
            [
              '.github/workflows/',
              'infra/',
              'infrastructure/',
              'deploy/',
              'scripts/release',
              'secrets/',
            ].some((segment) => path.includes(segment)),
          ),
          title: this.localizeText(
            'Sensitive path change needs explicit approval',
            '敏感路径变更需要显式批准',
          ),
          summary: this.localizeText(
            'The current scope touches paths that the governance baseline treats as sensitive surfaces.',
            '当前评审范围触及治理基线认定的敏感路径。',
          ),
          impact: this.localizeText(
            'Changes on sensitive surfaces can affect deployment, security posture, or irreversible repository behavior.',
            '敏感面上的改动可能直接影响部署、安全态势或不可逆的仓库行为。',
          ),
          suggestedAction: this.localizeText(
            'Route this change through explicit human approval and attach rollback evidence before delivery.',
            '请将这类改动纳入显式人工批准路径，并在交付前补齐回滚证据。',
          ),
          evidence: riskReason.evidence,
        });
      default:
        return null;
    }
  }

  private async collectTodoMarkerFindings(changedPaths: string[]): Promise<CliReviewFinding[]> {
    const findings: CliReviewFinding[] = [];

    for (const changedPath of changedPaths) {
      if (!this.isTextReviewPath(changedPath)) {
        continue;
      }

      const absolutePath = resolve(this.repositoryRoot, changedPath);
      if (!existsSync(absolutePath)) {
        continue;
      }

      let fileContent: string;
      try {
        fileContent = await readFile(absolutePath, 'utf8');
      } catch {
        continue;
      }

      const lines = fileContent.split(/\r?\n/u);
      for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
        const line = lines[lineIndex] ?? '';
        const matchedMarker = CLI_REVIEW_TODO_MARKERS.find((marker) => line.includes(marker));
        if (!matchedMarker) {
          continue;
        }

        findings.push(
          this.createFinding({
            ruleId: CliReviewFindingRuleId.CS_003_UNRESOLVED_MARKERS,
            sourceType: ReviewFindingSourceType.DETERMINISTIC_RULE,
            executionMode: ReviewRuleExecutionMode.DETERMINISTIC,
            severity: CliReviewFindingSeverity.P2,
            file: changedPath,
            line: lineIndex + 1,
            title: this.localizeText(
              'Unresolved TODO/FIXME/HACK marker remains in reviewed scope',
              '评审范围内仍存在未收口的 TODO/FIXME/HACK 标记',
            ),
            summary: this.localizeText(
              `The changed file still contains marker ${matchedMarker}, which should either be resolved or explicitly tracked before delivery.`,
              `变更文件中仍保留 ${matchedMarker} 标记，按基线要求应在交付前解决或被显式记录。`,
            ),
            impact: this.localizeText(
              'Outstanding implementation markers weaken delivery confidence and can hide incomplete behavior behind an apparently finished review result.',
              '未收口的实现标记会削弱交付可信度，也可能让表面完成的评审结果掩盖真实的未完成行为。',
            ),
            suggestedAction: this.localizeText(
              'Resolve the marker or move it into explicit known-risk tracking before closing the review artifact.',
              '请在关闭 review artifact 前解决该标记，或把它迁移到显式的已知风险记录里。',
            ),
            evidence: [`${changedPath}:${lineIndex + 1}`],
          }),
        );
      }
    }

    return findings;
  }

  private createMissingTestCoverageFinding(changedPaths: string[]): CliReviewFinding | null {
    const codePaths = changedPaths.filter((changedPath) => this.isCodePath(changedPath));
    if (codePaths.length === 0) {
      return null;
    }

    const hasMatchingTestChanges = changedPaths.some((changedPath) => this.isTestPath(changedPath));
    if (hasMatchingTestChanges) {
      return null;
    }

    const primaryCodePath = codePaths[0] ?? changedPaths[0] ?? 'unknown';
    return this.createFinding({
      ruleId: CliReviewFindingRuleId.CODE_CHANGE_WITHOUT_TEST_CHANGE,
      sourceType: ReviewFindingSourceType.RISK_INFERENCE,
      executionMode: ReviewRuleExecutionMode.DETERMINISTIC,
      severity: CliReviewFindingSeverity.P2,
      file: primaryCodePath,
      title: this.localizeText(
        'Code change is missing matching test updates',
        '代码改动缺少匹配的测试更新',
      ),
      summary: this.localizeText(
        'The reviewed scope changes executable code paths, but the current working tree does not include matching test-file updates.',
        '当前评审范围改动了可执行代码路径，但 working tree 里没有对应的测试文件更新。',
      ),
      impact: this.localizeText(
        'Without targeted regression coverage, review verification can accept a change that still fails in integration or release gates.',
        '如果缺少定向回归覆盖，review verification 可能会接受一个在 integration 或 release gate 中仍会失败的改动。',
      ),
      suggestedAction: this.localizeText(
        'Add or update the affected tests, then rerun review/review-verify with the new evidence in scope.',
        '请补充或更新受影响的测试，然后在新证据进入范围后重新执行 review/review-verify。',
      ),
      evidence: codePaths.slice(0, 5),
    });
  }

  private createFinding(options: {
    ruleId: CliReviewFindingRuleId;
    sourceType: ReviewFindingSourceType;
    executionMode: ReviewRuleExecutionMode;
    severity: CliReviewFindingSeverity;
    file: string;
    title: string;
    summary: string;
    impact: string;
    suggestedAction: string;
    evidence: string[];
    line?: number;
  }): CliReviewFinding {
    const fingerprint = `${options.ruleId}:${options.file}:${options.line ?? 0}`;
    const findingId = fingerprint
      .replace(/[^a-zA-Z0-9]+/gu, '-')
      .replace(/^-+/u, '')
      .replace(/-+$/u, '')
      .toLowerCase();
    const projectedRule = phaseAReviewRuleRegistry.getRule(options.ruleId);

    return {
      findingId,
      fingerprint,
      ruleId: options.ruleId,
      sourceType: options.sourceType,
      executionMode: options.executionMode,
      severity: options.severity,
      ...(projectedRule
        ? {
            semanticKey: projectedRule.semanticKey,
            standardsSourceRefs: projectedRule.standardsSourceRefs,
            ...(projectedRule.projectedPackRefs
              ? { projectedPackRefs: projectedRule.projectedPackRefs }
              : {}),
          }
        : {
            standardsSourceRefs: [],
          }),
      title: options.title,
      file: options.file,
      ...(typeof options.line === 'number' ? { line: options.line } : {}),
      summary: options.summary,
      impact: options.impact,
      suggestedAction: options.suggestedAction,
      evidence: options.evidence,
    };
  }

  private findFirstMatchingPath(
    changedPaths: string[],
    predicate: (changedPath: string) => boolean,
  ): string {
    return changedPaths.find(predicate) ?? changedPaths[0] ?? 'working-tree';
  }

  private isCodePath(changedPath: string): boolean {
    return (
      /^(apps|packages|bin)\//u.test(changedPath) &&
      /\.(ts|tsx|js|jsx|mjs|cjs)$/u.test(changedPath) &&
      !this.isTestPath(changedPath)
    );
  }

  private isTestPath(changedPath: string): boolean {
    return (
      /(^|\/)(test|tests)\//u.test(changedPath) ||
      /\.(test|spec)\.(ts|tsx|js|jsx|mjs|cjs)$/u.test(changedPath)
    );
  }

  private isTextReviewPath(changedPath: string): boolean {
    return /\.(ts|tsx|js|jsx|json|md|yaml|yml|txt|sh)$/u.test(changedPath);
  }
}
