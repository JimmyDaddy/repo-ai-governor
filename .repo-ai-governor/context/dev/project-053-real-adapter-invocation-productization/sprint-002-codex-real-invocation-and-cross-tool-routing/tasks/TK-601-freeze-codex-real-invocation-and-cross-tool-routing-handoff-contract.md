# TK-601 freeze Codex real invocation and cross-tool routing handoff contract

- Status: completed
- Date: 2026-04-06
- Task ID: `TK-601`
- Owner: `AI-Agent`
- Priority: `P1`
- Sprint: `sprint-002-codex-real-invocation-and-cross-tool-routing`
- Project: `project-053-real-adapter-invocation-productization`

## 1. 任务目标

冻结 `Codex` 真实调用与 cross-tool routing handoff contract。

## 2. Depends On

1. `TK-600`

## 3. Expected Outputs

1. Codex real invocation contract
2. cross-tool routing handoff contract
3. product boundary

## 4. Execution Notes

1. 2026-04-06：任务创建，等待 `sprint-001` 稳定后激活。
2. 2026-04-07：`sprint-001` 已完成 boundary commit `e75028f`，任务切换为 `in_progress`，开始冻结 `Codex` 真实调用与 cross-tool routing handoff contract。
3. 2026-04-07：`buildCandidateAdaptersConfig()` 现在会保留已选工具的 `transport`、`remoteApi` 与 `localModel` truth，避免 `connect` candidate 配置在 handoff 时把 `codex` transport contract 漂移成不完整快照。
4. 2026-04-07：真实执行 `node ./dist/bin/repo-ai-governor.js --output json --adapters verify`，结果为 `warn` 且 `required_role_failures=0`；verify diagnostics 已将 `planner` / `architect` / `coder` / `reviewer` / `verifier` 的 primary route 投影为 `codex + cli_exec`，从而冻结当前 `codex` real-path routing truth。
