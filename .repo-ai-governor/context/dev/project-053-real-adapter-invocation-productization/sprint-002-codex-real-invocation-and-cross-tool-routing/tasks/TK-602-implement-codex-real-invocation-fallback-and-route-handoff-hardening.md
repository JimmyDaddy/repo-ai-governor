# TK-602 implement Codex real invocation fallback and route handoff hardening

- Status: completed
- Date: 2026-04-06
- Task ID: `TK-602`
- Owner: `AI-Agent`
- Priority: `P1`
- Sprint: `sprint-002-codex-real-invocation-and-cross-tool-routing`
- Project: `project-053-real-adapter-invocation-productization`

## 1. 任务目标

实现 `Codex` 真实调用 fallback 与 route handoff hardening。

## 2. Depends On

1. `TK-601`

## 3. Expected Outputs

1. Codex fallback
2. route handoff hardening
3. hardening evidence

## 4. Execution Notes

1. 2026-04-06：任务创建，等待 `TK-601` 完成。
2. 2026-04-07：`dispatchRunStageWithAdapterRoute()` 现在把 adapter invoke timeout 对齐到 runtime stage budget，并在 `dryRun=true` 且 stage 未显式声明 policy 时注入 `chat_only + forbidden` 的 read-only execution policy，避免 `codex` 在 dry-run execute path 上被 30s invoke budget 过早截断。
3. 2026-04-07：task-driven run assembly 现在会为非变更型阶段显式附带 read-only execution policy，并为 `codex` dry-run stage prompt 添加 fast-path simulation contract，要求直接返回 `status=simulated` / `sideEffects=none` 的紧凑结果，而不是展开仓库执行。
4. 2026-04-07：定向验证通过：`pnpm vitest run packages/adapters/codex/test/codex-agent-adapter.smoke.test.ts apps/cli/test/runtime/task-driven-run-runtime.test.ts apps/cli/test/runtime/agent-onboarding-runtime.test.ts test/first-batch-adapters-route.integration.test.ts --maxWorkers=1 --maxConcurrency=1`、`pnpm vitest run apps/cli/test/cli-governance-runtime.integration.test.ts -t "aligns adapter invoke timeout with the run-stage timeout budget for baseline prepare stages" --maxWorkers=1 --maxConcurrency=1` 与同窗口 `pnpm run build` 全部通过。
