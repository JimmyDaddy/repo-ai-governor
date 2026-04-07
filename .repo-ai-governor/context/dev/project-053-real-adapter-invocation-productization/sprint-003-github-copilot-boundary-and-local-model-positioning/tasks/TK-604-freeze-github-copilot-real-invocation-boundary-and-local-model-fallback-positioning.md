# TK-604 freeze GitHub Copilot real invocation boundary and local-model fallback positioning

- Status: completed
- Date: 2026-04-06
- Task ID: `TK-604`
- Owner: `AI-Agent`
- Priority: `P1`
- Sprint: `sprint-003-github-copilot-boundary-and-local-model-positioning`
- Project: `project-053-real-adapter-invocation-productization`

## 1. 任务目标

冻结 `GitHub Copilot` 真实路径边界与 `local-model` fallback positioning，确保对外 truth 不把当前 adapter capability 和 restricted-network fallback 误报为同一支持层级。

## 2. Depends On

1. `TK-603`

## 3. Expected Outputs

1. `GitHub Copilot` real invocation boundary truth
2. `local-model` fallback positioning truth
3. support matrix / playbook 的边界输入

## 4. Required Inputs

1. `.repo-ai-governor/context/current-context.md`
2. `.repo-ai-governor/context/dev/project-053-real-adapter-invocation-productization/plan.md`
3. `.repo-ai-governor/context/dev/project-053-real-adapter-invocation-productization/sprint-003-github-copilot-boundary-and-local-model-positioning/plan.md`
4. `docs/support-matrix.md`
5. `docs/local-adoption-playbook.md`

## 5. Traceback References

1. `docs/support-matrix.zh-CN.md`
2. `docs/local-adoption-playbook.zh-CN.md`
3. `test/first-batch-adapters-route.integration.test.ts`

## 6. 实施计划

1. 审计 `github-copilot` real-path probe / degrade / fallback contract 与 `local-model` 当前定位。
2. 冻结对外 truth，明确 real-path、degraded support、local fallback 的边界差异。
3. 将冻结结果写回任务卡、文档与后续实现输入面。

## 7. Development Verification

1. `pnpm vitest run packages/adapters/github-copilot/test/github-copilot-agent-adapter.smoke.test.ts apps/cli/test/runtime/adapter-verification-runtime.test.ts --maxWorkers=1 --maxConcurrency=1`
2. `pnpm run build`

## 8. Delivery Verification

1. `pnpm vitest run packages/adapters/github-copilot/test/github-copilot-agent-adapter.smoke.test.ts apps/cli/test/runtime/adapter-verification-runtime.test.ts --maxWorkers=1 --maxConcurrency=1`
2. `pnpm run build`
3. `node ./dist/bin/repo-ai-governor.js --output json --adapters verify`

## 9. 执行记录

1. 2026-04-06：任务创建，状态初始化为 `planned`。
2. 2026-04-07：`sprint-002` 已通过 boundary commit `7b165f2` 收口，任务切换为 `in_progress`，开始冻结 `GitHub Copilot` 真实路径边界与 `local-model` fallback positioning。
3. 2026-04-07：完成 `GitHub Copilot` / `local-model` truth freeze：`github-copilot` 正式口径切换为 `Real-path available (environment-gated)`，`local-model` 切换为 `Fallback-only real-path (local-runtime constrained)`；同窗口通过 targeted vitest、`pnpm run build` 与真实 `verify --adapters` 证据确认 `role_tester` 已投影 `transport=cli_exec`。

## 10. 产出

1. `GitHub Copilot` boundary freeze summary：
   - 默认真实 transport 固定为 `cli_exec`。
   - `verify --adapters` 现在会把 `role_tester` 如实投影为 `selected=github-copilot transport=cli_exec`。
   - `copilot --version` 是本地 probe 首选入口，`gh copilot -- --version` 保留为回退入口。
   - quota/auth/probe 失败继续按 degrade / reroute 语义处理，不误报为治理链路失效。
2. `local-model` fallback positioning summary：
   - `ollama` 保持 fallback-only real-path，不提升为 promoted primary lane。
   - endpoint/model 配置存在时保留 endpoint-backed probe/invoke 真值。
   - `tool_calling`、`structured_output`、`confirmation_gate` 仍保持保守或不支持口径。
3. 已刷新对外 truth surface：
   - `docs/support-matrix.md`
   - `docs/support-matrix.zh-CN.md`
   - `docs/local-adoption-playbook.md`
   - `docs/local-adoption-playbook.zh-CN.md`
   - `packages/adapters/github-copilot/README.md`
   - `packages/adapters/local-model/README.md`
4. 验证证据：
   - `pnpm vitest run packages/adapters/github-copilot/test/github-copilot-agent-adapter.smoke.test.ts packages/adapters/local-model/test/local-model-agent-adapter.smoke.test.ts apps/cli/test/cli-governance-runtime.integration.test.ts --maxWorkers=1 --maxConcurrency=1`
   - `pnpm run build`
   - `.tmp/project-053-sprint-003-verify-adapters-tk-604.json`
   - `/Users/jimmydaddy/.repo-ai-governor/workspaces/2cf23e5951f0/.repo-ai-governor/context/diagnostics/verify/verify-1775518207907.json`
