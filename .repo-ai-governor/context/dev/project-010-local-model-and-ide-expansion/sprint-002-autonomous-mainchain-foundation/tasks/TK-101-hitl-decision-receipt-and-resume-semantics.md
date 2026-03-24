# TK-101 HITL 决策回执与恢复执行语义

- Status: completed
- Date: 2026-03-24
- Owner: AI-Agent
- Priority: P0
- Project: `project-010-local-model-and-ide-expansion`
- Sprint: `sprint-002-autonomous-mainchain-foundation`

## 1. 任务目标

形成 `confirm/escalate -> decision receipt -> resume/terminate/degrade` 的运行时闭环，并将人工决策回灌到同一审计链路。

## 2. Depends On

1. `TK-099`
2. `TK-100`

## 3. 预期产物

1. `DA-105` HITL 决策回执与恢复执行语义产物文档。

## 4. Input References

1. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/plan.md`
2. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-002-autonomous-mainchain-foundation/plan.md`
3. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-002-autonomous-mainchain-foundation/tasks/TK-099-task-driven-dag-and-run-mainchain-assembly.md`
4. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-002-autonomous-mainchain-foundation/tasks/TK-100-inline-review-chain-and-ledger-backfill-closure.md`
5. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-master-execution-plan.md`
6. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`
7. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md`

## 5. 实施计划

1. 定义 decision receipt 最小字段与审计落盘契约。
2. 将人工决策接入 runtime，支持 `resume/terminate/degrade` 三类恢复语义。
3. 为至少 1 条主通知路径与 1 条降级路径提供可验证接线或模拟演练。
4. 补齐报告回链、回放定位与关键集成测试，回写 `DA-105`。
5. 同步台账与 artifact registry。

## 6. 验证

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `pnpm run test:packages -- apps/cli/test packages/notification-dispatcher/test --maxWorkers=1 --maxConcurrency=1`
4. `pnpm run test:integration -- --maxWorkers=1 --maxConcurrency=1`
5. `pnpm run check`

## 7. 执行记录

1. 2026-03-24：任务创建，状态初始化为 `planned`。
2. 2026-03-24：任务启动，开始收敛通知回执、decision receipt 最小字段与 `resume/terminate/degrade` 运行时语义。
3. 2026-03-24：复核 follow-up CR 后，已补齐真实 CLI `--hitl-*` 参数入口、dry-run 下的 HITL 无副作用语义，以及 `taskId + approve` 对 inline review 子链的真实恢复执行。
4. 2026-03-24：已补齐 `reject -> terminate` 与 `revise -> degrade` 的集成回归，并完成 `DA-105`、formal resolved review、artifact registry 与 sprint 台账同步；任务状态更新为 `completed`。

## 8. 产出

1. `DA-105` `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-002-autonomous-mainchain-foundation/tasks/DA-105-hitl-decision-receipt-and-resume-semantics.md`
2. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-002-autonomous-mainchain-foundation/review/resolved_code_review_tk-101-hitl-decision-receipt-and-resume-semantics.md`
3. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-002-autonomous-mainchain-foundation/tasks/checklist.md`
4. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-002-autonomous-mainchain-foundation/tasks/tasks.csv`
