# TK-491 deliver invoke liveness regression budgets cutover governance and rollout closeout

- Status: planned
- Date: 2026-04-02
- Owner: AI-Agent
- Priority: P0
- Project: `project-037-agent-invoke-liveness-and-timeout-governance-rollout`
- Sprint: `sprint-003-graceful-interrupt-cutover-and-governance-closeout`

## 1. 任务目标

完成 invoke-liveness rollout 的 timeout budget matrix、回归矩阵、cutover governance、回滚边界与项目 closeout 验收收口。

## 2. Depends On

1. `TK-490`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-invoke-liveness-contract.md`
3. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/agent-invoke-liveness-and-timeout-governance.md`

## 3. 预期产物

1. route / role / surface timeout budget matrix
2. invoke-liveness regression suite 与 gate 清单
3. cutover / rollback / partial-output closeout 指南
4. doctor/verify / delivery gate 验收证据
5. `project-037` completion closeout 输入

## 4. 实施计划

1. 为 direct-answer、reviewer、verifier、tester、local-model 等路径冻结分层 budget baseline。
2. 建立覆盖 timeout、stall、graceful interrupt、hard terminate、partial output 的 regression matrix。
3. 收口 cutover governance、rollback 边界、artifact evidence 与 release gate 解释语义。
4. 完成 `project-037` 的最终验收、CR 收口与 completion audit 输入。

## 5. 验证

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `pnpm run check`
4. invoke-liveness 相关集成 / end-to-end 回归矩阵

## 6. 执行记录

1. 2026-04-02：任务创建，状态初始化为 `planned`。
