# TK-196 promotion guardrails、portable prompt 与 repo alignment

- Status: completed
- Date: 2026-03-26
- Owner: AI-Agent
- Priority: P0
- Project: `project-017-technical-solution-modularization`
- Sprint: `sprint-004-skillized-promotion-workflow`

## 1. 任务目标

补齐 promotion skill 的 guardrails、portable prompt、UI metadata，并与仓库当前 lifecycle/module/manifest 治理保持一致。

## 2. Depends On

1. `TK-195`
2. `DA-194`

## 3. 预期产物

1. `agents/openai.yaml`
2. portable prompt
3. promotion guardrails
4. `DA-196`

## 4. 实施计划

1. 为 skill 增补 guardrails，禁止无 review 或绕过 gate 的 promotion。
2. 提供 portable prompt，便于其他 agent surface 复用。
3. 为 skill 生成 UI metadata，并与 SKILL 主体保持一致。

## 5. 验证

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-code-review-status-sync.js`

## 6. 执行记录

1. 2026-03-26：任务创建，状态初始化为 `planned`。
2. 2026-03-26：状态切换为 `in_progress`，开始补齐 guardrails、portable prompt 与 `agents/openai.yaml`。
3. 2026-03-26：已完成 guardrails、portable prompt、UI metadata 与 repo alignment，形成 `DA-196`。
