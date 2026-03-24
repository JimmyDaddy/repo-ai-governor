# TK-102 sprint-002 出口验收与 sprint-003 输入约束

- Status: planned
- Date: 2026-03-24
- Owner: TBD
- Priority: P0
- Project: `project-010-local-model-and-ide-expansion`
- Sprint: `sprint-002-autonomous-mainchain-foundation`

## 1. 任务目标

汇总 sprint-002 自动主链交付证据，完成出口验收，并冻结 sprint-003 的 delivery、blackbox、IDE productionization 输入约束。

## 2. Depends On

1. `TK-099`
2. `TK-100`
3. `TK-101`

## 3. 预期产物

1. `DA-106` sprint-002 出口验收与 sprint-003 输入约束产物文档。

## 4. Input References

1. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/plan.md`
2. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-002-autonomous-mainchain-foundation/plan.md`
3. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-002-autonomous-mainchain-foundation/tasks/TK-099-task-driven-dag-and-run-mainchain-assembly.md`
4. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-002-autonomous-mainchain-foundation/tasks/TK-100-inline-review-chain-and-ledger-backfill-closure.md`
5. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-002-autonomous-mainchain-foundation/tasks/TK-101-hitl-decision-receipt-and-resume-semantics.md`
6. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-master-execution-plan.md`

## 5. 实施计划

1. 汇总 `DA-103`~`DA-105` 的实现与门禁证据，给出 sprint-002 `accept/block` 结论。
2. 冻结 sprint-003 的 delivery rehearsal、blackbox/GA 与 IDE productionization 输入约束。
3. 更新 project 计划里程碑与 sprint 计划状态建议。
4. 回写台账并登记 `DA-106`。

## 6. 验证

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `node ./scripts/governance/check-artifact-registry-lifecycle.js`
4. `pnpm run check`

## 7. 执行记录

1. 2026-03-24：任务创建，状态初始化为 `planned`。

## 8. 产出

1. `DA-106` `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-002-autonomous-mainchain-foundation/tasks/DA-106-sprint-002-exit-acceptance-and-sprint-003-input-constraints.md`
2. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-002-autonomous-mainchain-foundation/tasks/checklist.md`
3. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-002-autonomous-mainchain-foundation/tasks/tasks.csv`
