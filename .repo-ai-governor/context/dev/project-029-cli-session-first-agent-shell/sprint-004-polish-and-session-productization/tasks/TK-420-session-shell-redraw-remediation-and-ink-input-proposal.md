# TK-420 session-shell redraw remediation and Ink-owned input proposal

- Status: completed
- Date: 2026-03-30
- Owner: AI-Agent
- Priority: P0
- Project: `project-029-cli-session-first-agent-shell`
- Sprint: `sprint-004-polish-and-session-productization`

## 1. 任务目标

修复真实手工验收暴露的 session-shell UX 偏差：live shell surface 应原地刷新、`/doctor` 这类安全 handoff 不应额外要求 `/confirm`；同时形成 Ink 接管输入的方案评审，明确 live slash palette / composer 的正式演进路线。

## 2. Depends On

1. `TK-416`
2. `TK-417`

## 3. 预期产物

1. 原地重绘的 session-shell `stderr` renderer
2. safe `cli_handoff` direct-execute policy 修正
3. `/exit` 清理 pending preview 残留
4. Ink-owned input 方案评审文档
5. 目标测试补强

## 4. 实施计划

1. 将 session-shell renderer 从 append-only 输出改为 interactive clear + rerender。
2. 将低副作用 bridge command 从统一 confirm gate 中拆出，仅保留高副作用 handoff 的 preview / confirm。
3. 为 Ink 接管输入补一份结构化方案评审，明确组件边界、迁移步骤、风险与验收标准。

## 5. 验证

1. `pnpm run build`
2. `pnpm exec vitest run apps/cli/test/runtime/session-slash-command-registry.test.ts apps/cli/test/runtime/session-shell-runner.test.ts apps/cli/test/runtime/react-cli-runner.test.ts`
3. `node ./scripts/governance/check-task-ledger-sync.js`
4. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 6. 执行记录

1. 2026-03-30：任务创建，状态初始化为 `planned`。
2. 2026-03-30：已将 session-shell `stderr` renderer 改为 interactive clear + rerender，不再在终端中持续追加整帧输出。
3. 2026-03-30：已将 `/doctor` 调整为 safe direct-execute handoff，并补修 `/exit` 退出时未清理 pending preview 状态的问题。
4. 2026-03-30：已形成 `session-shell-ink-owned-input-solution-review-20260330.md`，把 live slash palette / composer 改造正式收口为 Ink 接管输入的 follow-up 方案。
