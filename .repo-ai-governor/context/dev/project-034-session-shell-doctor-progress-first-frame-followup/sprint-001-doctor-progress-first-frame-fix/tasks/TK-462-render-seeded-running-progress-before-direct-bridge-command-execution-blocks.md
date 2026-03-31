# TK-462 render seeded running progress before direct bridge command execution blocks

- Status: completed
- Owner: AI-Agent
- Priority: P1
- Project: `project-034-session-shell-doctor-progress-first-frame-followup`
- Sprint: `sprint-001-doctor-progress-first-frame-fix`
- Date: 2026-03-31

## 1. 任务目标

1. 让 session shell 在 direct bridge command 的 seeded running dock 建立后立刻渲染一帧。
2. 补一个不依赖 nested progress event 的回归测试，锁定 `/doctor` 的 first-frame progress visibility。

## 2. 背景

用户反馈 session shell 内执行 `/doctor` 时没有明显的进度显示。排查后确认 direct bridge command 在 `seedRunningState()` 后未必会立即 render，一旦 nested command body 很快进入同步工作段，用户就可能在第一条 nested progress event 到来前看不到任何 running dock。

## 3. 实现摘要

1. 更新 `apps/cli/src/runtime/interactive-shell/session-shell-runner.ts`，移除 “仅当 panel 为空才 render” 的条件，在 `seedRunningState()` 与 `startTicking()` 后无条件 `renderActiveSurface(viewModel)`。
2. 在 `apps/cli/test/runtime/session-shell-runner.test.ts` 新增 regression case，验证 direct bridge command 即使不发 nested progress event，也会先看到 `Running progress` seeded panel。

## 4. 验证

1. `pnpm exec vitest run apps/cli/test/runtime/session-shell-runner.test.ts apps/cli/test/runtime/session-shell-live-app.test.ts`
2. `pnpm run build`

## 5. 风险与备注

1. 手工 session-shell 复现被当前本地环境的 memory store 写入失败挡住，CLI 直接 fallback 到 help output；因此本次主要依据 targeted regression 与 build 证据收敛。
