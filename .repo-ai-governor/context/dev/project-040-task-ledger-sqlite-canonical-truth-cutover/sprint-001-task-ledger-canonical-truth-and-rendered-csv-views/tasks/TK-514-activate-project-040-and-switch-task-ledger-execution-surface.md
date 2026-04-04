# TK-514 activate project-040 and switch task-ledger execution surface

- Status: completed
- Date: 2026-04-04
- Owner: AI-Agent
- Priority: P0
- Project: `project-040-task-ledger-sqlite-canonical-truth-cutover`
- Sprint: `sprint-001-task-ledger-canonical-truth-and-rendered-csv-views`

## 1. 任务目标

创建本轮 task ledger sqlite canonical truth cutover 的独立 execution surface，并将当前工作从 `project-039` closeout surface 切换到 `project-040`。

## 2. Depends On

1. `.repo-ai-governor/context/current-context.md`
2. `.repo-ai-governor/context/completed-streams-history.md`
3. `project-039-provider-session-reuse-and-backend-conversation-continuity-rollout`

## 3. 预期产物

1. `project-040` skeleton
2. 更新后的 `current-context.md`
3. 更新后的 `completed-streams-history.md`

## 4. 实施计划

1. 创建 `project-040 / sprint-001 / tasks / review` 骨架。
2. 将 `project-039` 从 active closeout surface 迁入 completed history。
3. 将 `project-040` 登记为新的 primary execution surface。

## 5. 验证

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 6. 执行记录

1. 2026-04-04：任务创建，状态初始化为 `planned`。
2. 2026-04-04：状态切换为 `in_progress`，开始创建 `project-040` skeleton 并切换 current-context/completed-history。
3. 2026-04-04：已完成 `project-040` skeleton、current-context 切换与 `project-039` completed history 迁移。
