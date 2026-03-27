# TK-250 sprint-002 出口验收与 sprint-003 输入约束

- Status: planned
- Date: 2026-03-27
- Owner: AI-Agent
- Priority: P1
- Project: `project-021-memory-semantics-runtime-implementation`
- Sprint: `sprint-002-promotion-pipeline-and-runtime-consumer-rollout`

## 1. 任务目标

完成 `sprint-002` 验收，并冻结 `sprint-003` 的输入约束，避免 `runtime.memory-semantics` rollout 在 consumer 扩张时偏离技术方案边界。

## 2. Depends On

1. `TK-247`
2. `TK-248`
3. `TK-249`

## 3. 预期产物

1. `DA-250`
2. 更新后的 sprint / project 计划与台账真值。

## 4. 实施计划

1. 汇总 promotion pipeline、second consumer rollout 与相关测试证据。
2. 执行 sprint-002 exit acceptance。
3. 冻结 sprint-003 输入约束并同步 project 计划。

## 5. 验证

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `node ./scripts/governance/check-artifact-registry-lifecycle.js`
4. `node ./scripts/governance/check-code-review-status-sync.js`
5. `node ./scripts/governance/check-worktree-review-target.js`
6. `pnpm run check`

## 6. 执行记录

1. 2026-03-27：任务创建，状态初始化为 `planned`。
