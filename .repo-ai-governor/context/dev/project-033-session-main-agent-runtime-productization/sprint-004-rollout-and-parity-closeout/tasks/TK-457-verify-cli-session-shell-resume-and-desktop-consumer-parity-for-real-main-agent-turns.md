# TK-457 verify CLI session shell resume and desktop consumer parity for real main-agent turns

- Status: completed
- Date: 2026-03-31
- Owner: AI-Agent
- Priority: P0
- Due: 2026-04-10
- Project: `project-033-session-main-agent-runtime-productization`
- Sprint: `sprint-004-rollout-and-parity-closeout`

## 1. 目标

验证真实 `session.main` turn runtime 在 CLI session shell、resume flow 与 desktop consumer baseline 之间保持一致的 shared-session 语义，而不是只在单一 presenter 上看起来可用。

## 2. 依赖

1. `TK-456`

## 3. 完成标准

1. parity 验证覆盖至少 CLI session shell 与 resume path。
2. desktop consumer baseline 的 contract-level parity 有明确证据或差距登记。
3. 相关验证记录回写 sprint-004 台账。

## 4. 执行记录

1. 2026-03-31：任务创建，状态初始化为 `planned`。
2. 2026-03-31：`sprint-004` 已激活，开始核对 CLI session shell、resume flow 与 desktop consumer baseline 的 shared-session parity seam，并收集 rollout evidence。
3. 2026-03-31：新增 `apps/cli/test/runtime/session-main-parity.integration.test.ts`，通过真实 service-backed `session.main` turn 验证 desktop-ready payload contract，以及 CLI 首次附着与 `resume` 再附着对同一份 canonical session truth 的 recap/backlink parity。
