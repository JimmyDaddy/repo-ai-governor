# TK-534 implement alt-screen inline overlay fallback runtime and request-user-input seam

- Status: planned
- Date: 2026-04-04
- Owner: AI-Agent
- Priority: P0
- Project: `project-043-cli-session-shell-productization-rollout`
- Sprint: `sprint-002-adaptive-interaction-runtime-and-discoverability`

## 1. 任务目标

在 `TK-533` 冻结的 policy 之上，实现 `alt-screen / inline / overlay / fallback` runtime 与统一的 request-user-input seam，使 interactive shell 的输入层不再按命令散点实现。

## 2. Depends On

1. `TK-533`
2. `apps/cli/src/runtime/interactive-shell/session-shell-runner.ts`
3. `apps/cli/src/runtime/interactive-shell/session-shell-entrypoint-runtime.ts`
4. `.repo-ai-governor/draft/runtime-cli-run-live-react-session-shell-technical-solution.md`

## 3. 预期产物

1. adaptive interaction runtime implementation
2. request-user-input overlay seam
3. 小终端与 fallback regression evidence

## 4. Required Inputs

1. `TK-533`
2. `apps/cli/src/runtime/interactive-shell/session-shell-runner.ts`
3. `apps/cli/src/runtime/interactive-shell/session-shell-entrypoint-runtime.ts`
4. `.repo-ai-governor/draft/runtime-cli-run-live-react-session-shell-technical-solution.md`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-043-cli-session-shell-productization-rollout/plan.md`
2. `.repo-ai-governor/context/dev/project-043-cli-session-shell-productization-rollout/sprint-002-adaptive-interaction-runtime-and-discoverability/plan.md`
3. `.repo-ai-governor/draft/cli-borrowing-analysis-against-claude-code-and-codex.md`

## 6. 实施计划

1. 将 interaction runtime policy 接入 session shell 入口与运行时。
2. 抽出统一 request-user-input seam，替代分散 prompt 拼装。
3. 补齐 alt-screen / inline / small-terminal / fallback 覆盖与回归。

## 7. Development Verification

1. 后续实现窗口需补 interactive shell runtime tests
2. 后续实现窗口需补 small-terminal / fallback regression coverage
3. `node ./scripts/governance/check-task-ledger-sync.js`

## 8. Delivery Verification

1. 后续实现完成并宣告 `completed` 前，必须补 `pnpm run build`
2. 后续实现完成并宣告 `completed` 前，必须补 adaptive runtime / fallback regression evidence
3. 后续实现完成并宣告 `completed` 前，必须通过 `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 9. 执行记录

1. 2026-04-04：任务创建，状态初始化为 `planned`；承接 adaptive runtime 与 request-user-input seam 实现。

## 10. 产出

1. 待执行：adaptive interaction runtime implementation
2. 待执行：request-user-input seam
3. 待执行：small-terminal / fallback regression evidence
