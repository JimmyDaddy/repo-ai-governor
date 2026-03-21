# TK-063 project-006 出口验收与 project-007 输入约束

- Status: planned
- Date: 2026-03-22
- Owner: TBD
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

## 6. 验证

1. `node ./scripts/governance/reconcile-artifact-dependencies.js`
2. `node ./scripts/governance/check-task-ledger-sync.js`
3. `node ./scripts/governance/check-sprint-plan-status-sync.js`
4. `node ./scripts/governance/check-artifact-registry-lifecycle.js`
5. `pnpm run check`

## 7. 执行记录

1. 2026-03-22：任务创建，状态初始化为 `planned`。
