# TK-040 门禁分层（Fast Gate/Release Gate）基线

- Status: completed
- Date: 2026-03-21
- Owner: AI-Agent
- Priority: P0
- Project: `project-008-workflow-optimization`
- Sprint: `sprint-001-execution-workflow-optimization`

## 1. 任务目标

定义并落地 `Fast Gate` 与 `Release Gate` 分层门禁基线，缩短开发反馈回路并保持交付质量下限。

## 2. Depends On

1. 无（项目启动任务）

## 3. 预期产物

1. `DA-051` fast gate and release gate layering baseline 文档。

## 4. Input References

1. `.repo-ai-governor/normative_knowledge_sources/archive/repo-ai-governor-workflow-optimization-recommendations.md`（`§2`、`§3`、`§5`，已归档）
2. `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`（`Verification Commands`）
3. `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`（`Daily and Release Cadence`）

## 5. 实施摘要

1. 建立两层门禁执行口径：
   - Fast Gate：`pnpm run typecheck` + `pnpm run check` + `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`
   - Release Gate：沿用 `code_standards.md -> Verification Commands` 全链路命令集合。
2. 明确触发策略：
   - 日常开发提交前至少执行 Fast Gate。
   - 合并前、发布前与高风险改动必须执行 Release Gate。
3. 明确失败处理：
   - Fast Gate 失败：禁止继续推进任务状态，需先修复后重跑。
   - Release Gate 失败：阻断交付；高风险场景需补充 HITL 结论后再评估。
4. 明确误用防护：
   - Fast Gate 仅用于快反馈，不得替代交付级完整验证。

## 6. 产出

1. `DA-051` `.repo-ai-governor/context/dev/project-008-workflow-optimization/sprint-001-execution-workflow-optimization/tasks/TK-040-fast-gate-and-release-gate-layering-baseline.md`
2. `.repo-ai-governor/normative_knowledge_sources/governance/execution-gate-layering-spec.md`
3. `.repo-ai-governor/context/dev/project-008-workflow-optimization/sprint-001-execution-workflow-optimization/review/verified_review_tk-040-fast-gate-and-release-gate-layering-baseline.md`

## 7. 验证

1. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
3. `node ./scripts/governance/check-artifact-registry-lifecycle.js`（通过）

## 8. 执行记录

1. 2026-03-21：任务创建，状态初始化为 `planned`。
2. 2026-03-21：任务启动，状态切换为 `in_progress`，开始定义 Fast/Release Gate 分层与触发策略。
3. 2026-03-21：完成门禁分层基线、触发规则和失败策略，状态切换为 `completed`，并完成 `DA-051` 登记。
