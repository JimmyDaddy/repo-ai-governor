# TK-446 instrument connect with progress events and cancellable running shell baseline

- Status: completed
- Date: 2026-03-31
- Owner: AI-Agent
- Priority: P0
- Project: `project-032-command-live-progress-react-shell-productization`
- Sprint: `sprint-002-live-command-shell-contract-and-connect-progress`

## 1. 任务目标

让 `connect` 成为第一条 live running shell consumer，发出结构化 progress events，并完成至少一版 `AbortSignal` cancel seam 的 baseline。

## 2. Depends On

1. `TK-445`

## 3. 预期产物

1. `connect-command.ts` progress events
2. live running shell initial consumer path
3. connect-focused smoke/integration evidence

## 4. 验证

1. `pnpm run build`
2. targeted Vitest + connect integration tests
3. `node ./scripts/governance/check-task-ledger-sync.js`
4. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 5. Execution Notes

1. 2026-03-30：在 `TK-445` contract seam 激活后，开始把 `connect` 接为第一条 live running shell consumer，并补齐 progress events / initial cancel seam baseline。
2. 2026-03-30：`connect-command.ts` 已在 candidate build、adapter verification、agent projection、artifact write 四个阶段发出结构化 progress events，并由 `main.ts` 在 React UI 模式下接通 live running shell baseline；定向测试与 `pnpm run build` 已通过。
3. 2026-03-30：补齐 first-ctrl+c cancel-request baseline；`main.ts` 会在 live progress shell 存在时把第一次 `SIGINT` 转为 `AbortController.abort()` 与 `cancel_requested` progress patch，`connect-command.ts` 在关键阶段间检查 `abortSignal` 并收口为 `PROCESS_RUNTIME_CANCELLED`。
4. 2026-03-30：真实 TTY smoke 已验证第一次 `Ctrl+C` 会先显示“已请求取消，正在等待命令退出”，随后在下一次 abort check 收口为“connect 执行已取消。”并返回标准化取消错误。
5. 2026-03-30：已把 `AbortSignal` 深入传递到 `resolveAdapterVerificationForConfig -> CliAdapterVerificationRuntime -> CliLocalModelProbeRuntime`；定向 Vitest、新增 signal 传递/取消单测、`pnpm run build` 与真实 TTY smoke 均已验证 `connect` 在 `校验适配器` 长阶段内部也能更快收口为 `PROCESS_RUNTIME_CANCELLED`。
6. 2026-03-30：已新增 `CliLiveCommandCancelController` 收口两段式 `Ctrl+C` 语义；单测已覆盖“第一次请求取消、第二次强制收口”，并补齐 `cancel.forced` i18n 文案与 build/i18n gates 证据。
7. 2026-03-30：任务完成；`connect` 四阶段 progress events、adapter-stage abort 传播与两段式 `Ctrl+C` cancel baseline 已全部收口，并通过 `pnpm run build`、定向 Vitest、task/sprint/i18n/biome/code-review sync 检查；review 结果写入 `resolved_code_review_tk-445-tk-446-live-command-shell-connect-progress-baseline.md`。
8. 2026-03-30：follow-up CR 修复已完成；local-model probe 对 upstream abort 现在会立即以 `PROCESS_RUNTIME_CANCELLED` 收口，且不再把 AbortError 当作 retryable request error；新增 smoke test 验证取消不吞掉 retry budget，并将 follow-up review 收口为 `resolved_code_review_tk-445-tk-446-live-command-shell-connect-progress-baseline-followup.md`。
9. 2026-03-31：connect closeout recap 可读性 follow-up 已完成；session shell 现在会把 `connect/doctor` 等命令的 handoff 输出压缩为单条主摘要、Agent 路由、关键状态与精简 artifact 展示，避免重复 message、长路径换行与原始 `key=value` 噪音，并已补齐 locale、定向 Vitest、Biome、i18n parity 与 `pnpm run build` 验证。
