# TK-063 project-006 出口验收与 project-007 输入约束

- Status: completed
- Date: 2026-03-22
- Owner: AI-Agent
- Priority: P0
- Project: `project-006-hardening-and-release`
- Sprint: `sprint-002-resilience-and-ga-readiness`

## 1. 任务目标

汇总 project-006 交付证据，形成 Stage 7 出口验收基线并沉淀 project-007 启动输入约束。

## 2. Depends On

1. `TK-060`
2. `TK-061`
3. `TK-062`
4. `DA-072`
5. `DA-073`
6. `DA-074`

## 3. 预期产物

1. `DA-075` project-006 出口验收基线文档。
2. `DA-076` project-007 输入约束清单。

## 4. Input References

1. `.repo-ai-governor/context/dev/project-006-hardening-and-release/sprint-002-resilience-and-ga-readiness/tasks/TK-060-restricted-network-and-offline-degrade-regression-baseline.md`
2. `.repo-ai-governor/context/dev/project-006-hardening-and-release/sprint-002-resilience-and-ga-readiness/tasks/TK-061-rollback-rehearsal-and-recovery-playbook-baseline.md`
3. `.repo-ai-governor/context/dev/project-006-hardening-and-release/sprint-002-resilience-and-ga-readiness/tasks/TK-062-ga-candidate-unified-gate-baseline.md`
4. `.repo-ai-governor/context/dev/project-007-platformization/plan.md`

## 5. 实施计划

1. 汇总 Stage 7 核心证据并输出 project-006 出口验收结论。
2. 输出 project-007 输入约束，避免 Stage 8 重复定义 Stage 7 已确认能力边界。
3. 完成 artifact registry 登记、台账同步与 project 里程碑回链。

## 6. project-006 出口验收基线（DA-075）

1. 受限网络与离线降级稳定性回归
   - 验收结果：通过
   - 验证证据：`DA-072`、`pnpm run test:resilience`
2. 回滚演练与恢复流程
   - 验收结果：通过
   - 验证证据：`DA-073`、`pnpm run release:rollback-rehearsal`、当前运行窗口生成的 `.tmp/ci/release/rollback-rehearsal-report.json`
3. GA 候选联合门禁
   - 验收结果：通过
   - 验证证据：`DA-074`、`pnpm run release:ga-candidate-unified-gate`、当前运行窗口生成的 `.tmp/ci/release/ga-candidate-unified-gate-report.json`
4. 台账一致性与产物生命周期治理
   - 验收结果：通过
   - 验证证据：`node ./scripts/governance/reconcile-artifact-dependencies.js`、`node ./scripts/governance/check-task-ledger-sync.js`、`node ./scripts/governance/check-sprint-plan-status-sync.js`、`node ./scripts/governance/check-artifact-registry-lifecycle.js`
5. 项目完成态审计入口
   - 验收结果：通过
   - 验证证据：`.repo-ai-governor/context/dev/project-006-hardening-and-release/project-006-hardening-and-release-completion-audit-summary.md`

## 7. project-007 输入约束总览

1. 已输出 `DA-076` 作为 `project-007-platformization` 启动前统一输入约束清单。
2. 约束覆盖范围：
   - Stage 7 产物可消费性（`DA-072`、`DA-073`、`DA-074`、`DA-075`）；
   - 发布治理与回滚演练执行入口稳定性（`release:rollback-rehearsal`、`release:ga-candidate-unified-gate`）；
   - 任务台账与产物生命周期治理边界（`CS-021`、`CS-023`）。
3. `project-007` 启动时应优先消费 `DA-075` 与 `DA-076`，避免平台化阶段重复定义 Stage 7 已固化语义。

## 8. 验证

1. `node ./scripts/governance/reconcile-artifact-dependencies.js`
2. `node ./scripts/governance/check-task-ledger-sync.js`
3. `node ./scripts/governance/check-sprint-plan-status-sync.js`
4. `node ./scripts/governance/check-artifact-registry-lifecycle.js`
5. `pnpm run check`

## 9. 执行记录

1. 2026-03-22：任务创建，状态初始化为 `planned`。
2. 2026-03-22：任务启动，状态切换为 `active`，开始汇总 `DA-072/DA-073/DA-074` 验收证据并生成 `project-007` 输入约束清单。
3. 2026-03-22：完成 `DA-076`（project-007 输入约束清单）与 `project-006` 完成态审计摘要、project/sprint 里程碑回链更新。
4. 2026-03-22：完成 artifact registry 登记、依赖回填与门禁复核，任务状态切换为 `completed`。

## 10. 产出

1. `DA-075` `.repo-ai-governor/context/dev/project-006-hardening-and-release/sprint-002-resilience-and-ga-readiness/tasks/TK-063-project-006-exit-acceptance-and-project-007-input-constraints.md`
2. `DA-076` `.repo-ai-governor/context/dev/project-006-hardening-and-release/sprint-002-resilience-and-ga-readiness/tasks/TK-063-project-007-input-constraints-checklist.md`
3. `.repo-ai-governor/context/dev/project-006-hardening-and-release/project-006-hardening-and-release-completion-audit-summary.md`
4. `.repo-ai-governor/context/dev/project-006-hardening-and-release/plan.md`
5. `.repo-ai-governor/context/dev/project-006-hardening-and-release/sprint-002-resilience-and-ga-readiness/plan.md`
6. `.repo-ai-governor/context/artifact-registry/artifacts.csv`
