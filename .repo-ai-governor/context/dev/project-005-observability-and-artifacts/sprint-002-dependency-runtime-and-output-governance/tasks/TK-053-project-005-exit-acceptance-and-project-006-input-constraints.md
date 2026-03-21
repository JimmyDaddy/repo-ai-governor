# TK-053 project-005 出口验收与 project-006 输入约束

- Status: completed
- Date: 2026-03-22
- Owner: AI-Agent
- Priority: P0
- Project: `project-005-observability-and-artifacts`
- Sprint: `sprint-002-dependency-runtime-and-output-governance`

## 1. 任务目标

形成 project-005 统一验收基线并沉淀 project-006 输入约束清单。

## 2. Depends On

1. `TK-050`
2. `TK-051`
3. `TK-052`
4. `DA-062`
5. `DA-063`
6. `DA-064`

## 3. 预期产物

1. `DA-065` project-005 exit acceptance baseline 文档。
2. `DA-066` project-006 输入约束清单。

## 4. Input References

1. `.repo-ai-governor/context/dev/project-005-observability-and-artifacts/sprint-002-dependency-runtime-and-output-governance/tasks/TK-050-cli-output-contract-and-non-tty-fallback-baseline.md` (`DA-062`)
2. `.repo-ai-governor/context/dev/project-005-observability-and-artifacts/sprint-002-dependency-runtime-and-output-governance/tasks/TK-051-i18n-parity-fallback-gate-and-output-locale-replay-baseline.md` (`DA-063`)
3. `.repo-ai-governor/context/dev/project-005-observability-and-artifacts/sprint-002-dependency-runtime-and-output-governance/tasks/TK-052-audit-privacy-governance-retention-masking-export-delete-baseline.md` (`DA-064`)
4. `.repo-ai-governor/context/dev/project-005-observability-and-artifacts/plan.md`
5. `.repo-ai-governor/context/dev/project-006-hardening-and-release/plan.md`
6. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-master-execution-plan.md`（`4.8`）
7. `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`（`CS-021`、`CS-023`、`CS-024`）

## 5. 实施计划

1. 汇总 Stage 6 能力验收证据并形成 project-005 出口结论。
2. 输出 project-006 启动前输入约束，覆盖契约测试、稳定性与发布治理前置条件。
3. 对接 artifact registry，补齐 `DA-065` 与 `DA-066` 的登记与回链。
4. 回写 project 里程碑入口并完成台账同步。

## 6. project-005 出口验收基线（DA-065）

1. CLI 输出契约与 non-TTY 降级能力
   - 验收结果：通过
   - 验证证据：`DA-062`、`verified_review_tk-050-cli-output-contract-and-non-tty-fallback-baseline.md`、`resolved_code_review_working-tree-20260322-0409.md`
2. i18n parity/fallback 门禁与 output_locale 回放定位
   - 验收结果：通过
   - 验证证据：`DA-063`、`verified_review_tk-051-i18n-parity-fallback-gate-and-output-locale-replay-baseline.md`
3. 审计隐私治理（保留/脱敏/导出删除）能力
   - 验收结果：通过
   - 验证证据：`DA-064`、`verified_review_tk-052-audit-privacy-governance-retention-masking-export-delete-baseline.md`、`resolved_code_review_working-tree-20260322-0449.md`
4. Artifact Registry 单一事实源与 triad 口径同步
   - 验收结果：通过
   - 验证证据：`verified_review_tk-054-artifact-registry-single-source-cleanup.md`、`verified_review_tk-055-artifact-registry-triad-canonical-source-sync.md`
5. 台账一致性与生命周期治理
   - 验收结果：通过
   - 验证证据：`node ./scripts/governance/reconcile-artifact-dependencies.js`、`node ./scripts/governance/check-task-ledger-sync.js`、`node ./scripts/governance/check-sprint-plan-status-sync.js`、`node ./scripts/governance/check-artifact-registry-lifecycle.js`
6. 项目完成态审计入口
   - 验收结果：通过
   - 验证证据：`.repo-ai-governor/context/dev/project-005-observability-and-artifacts/project-005-completion-audit-summary.md`

## 7. project-006 输入约束总览

1. 已输出 `DA-066` 作为 `project-006-hardening-and-release` 启动前统一输入约束清单。
2. 约束覆盖范围：
   - Stage 6 产物可消费性（`DA-062`、`DA-063`、`DA-064`、`DA-065`）；
   - 契约测试分层与发布治理前置条件（`canary -> rc -> ga`）；
   - 受限网络/离线降级回归与 artifact lifecycle 主/归档治理约束。
3. `project-006` 启动时应优先消费 `DA-065` 与 `DA-066`，避免在 Stage 7 重复定义 Stage 6 已完成治理语义。

## 8. 验证

1. `node ./scripts/governance/reconcile-artifact-dependencies.js`（通过）
2. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
3. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
4. `node ./scripts/governance/check-artifact-registry-lifecycle.js`（通过）
5. `pnpm run check`（通过）

## 9. 执行记录

1. 2026-03-21：任务创建，状态初始化为 `planned`。
2. 2026-03-22：任务启动，状态切换为 `in_progress`，开始汇总 `DA-062/DA-063/DA-064` 验收证据并生成 `project-006` 输入约束清单（`DA-066`）。
3. 2026-03-22：完成 `DA-066`（project-006 输入约束清单）、`project-005` 完成态审计摘要与 project/sprint 里程碑回链更新。
4. 2026-03-22：完成 artifact registry 登记、依赖回填与门禁复核，任务状态切换为 `completed`。

## 10. 产出

1. `DA-065` `.repo-ai-governor/context/dev/project-005-observability-and-artifacts/sprint-002-dependency-runtime-and-output-governance/tasks/TK-053-project-005-exit-acceptance-and-project-006-input-constraints.md`
2. `DA-066` `.repo-ai-governor/context/dev/project-005-observability-and-artifacts/sprint-002-dependency-runtime-and-output-governance/tasks/TK-053-project-006-input-constraints-checklist.md`
3. `.repo-ai-governor/context/dev/project-005-observability-and-artifacts/project-005-completion-audit-summary.md`
4. `.repo-ai-governor/context/dev/project-005-observability-and-artifacts/plan.md`
5. `.repo-ai-governor/context/dev/project-006-hardening-and-release/plan.md`
6. `.repo-ai-governor/context/artifact-registry/artifacts.csv`
7. `.repo-ai-governor/context/dev/project-005-observability-and-artifacts/sprint-002-dependency-runtime-and-output-governance/review/verified_review_tk-053-project-005-exit-acceptance-and-project-006-input-constraints.md`
