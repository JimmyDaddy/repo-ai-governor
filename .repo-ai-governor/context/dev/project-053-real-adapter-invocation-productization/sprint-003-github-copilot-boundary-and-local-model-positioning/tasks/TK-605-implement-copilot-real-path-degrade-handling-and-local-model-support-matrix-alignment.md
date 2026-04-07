# TK-605 implement Copilot real path degrade handling and local-model support matrix alignment

- Status: completed
- Date: 2026-04-06
- Task ID: `TK-605`
- Owner: `AI-Agent`
- Priority: `P1`
- Sprint: `sprint-003-github-copilot-boundary-and-local-model-positioning`
- Project: `project-053-real-adapter-invocation-productization`

## 1. 任务目标

实现 `GitHub Copilot` real path degrade handling，并让 `local-model` support matrix 口径与真实 fallback/runtime truth 对齐。

## 2. Depends On

1. `TK-604`

## 3. Expected Outputs

1. Copilot degrade-handling implementation
2. local-model support matrix alignment
3. docs / verification alignment

## 4. Required Inputs

1. `.repo-ai-governor/context/current-context.md`
2. `.repo-ai-governor/context/dev/project-053-real-adapter-invocation-productization/sprint-003-github-copilot-boundary-and-local-model-positioning/tasks/TK-604-freeze-github-copilot-real-invocation-boundary-and-local-model-fallback-positioning.md`
3. `docs/support-matrix.md`
4. `docs/local-adoption-playbook.md`
5. `apps/cli/src/runtime/adapter-verification-runtime.ts`

## 5. Traceback References

1. `packages/adapters/github-copilot/src/github-copilot-agent-adapter.ts`
2. `packages/adapters/local-model/src/local-model-agent-adapter.ts`
3. `apps/cli/src/runtime/local-model-probe-runtime.ts`

## 6. 实施计划

1. 根据 `TK-604` 冻结的边界收紧 Copilot degrade / fallback handling。
2. 对齐 `local-model` support matrix 与 CLI verify / probe truth。
3. 补齐测试和文档，避免 adapter truth 漂移。

## 7. Development Verification

1. `pnpm vitest run packages/adapters/github-copilot/test/github-copilot-agent-adapter.smoke.test.ts packages/adapters/local-model/test/local-model-agent-adapter.smoke.test.ts apps/cli/test/runtime/adapter-verification-runtime.test.ts --maxWorkers=1 --maxConcurrency=1`
2. `pnpm run build`

## 8. Delivery Verification

1. `pnpm vitest run packages/adapters/github-copilot/test/github-copilot-agent-adapter.smoke.test.ts packages/adapters/local-model/test/local-model-agent-adapter.smoke.test.ts apps/cli/test/runtime/adapter-verification-runtime.test.ts test/first-batch-adapters-route.integration.test.ts --maxWorkers=1 --maxConcurrency=1`
2. `pnpm run build`
3. `node ./dist/bin/repo-ai-governor.js --output json --adapters verify`
4. `node ./dist/bin/repo-ai-governor.js --output json --adapters --dry-run --trace run`

## 9. 执行记录

1. 2026-04-06：任务创建，状态初始化为 `planned`。
2. 2026-04-07：`TK-604` truth freeze 已完成，开始基于新的 `github-copilot` / `local-model` 支持边界补齐 delivery-level dry-run trace、routing acceptance 与文档/证据对齐。
3. 2026-04-07：完成 `github-copilot` / `local-model` runtime truth alignment：`github-copilot` probe health-check 现显式暴露 `transportKind=cli_exec` 与 `requestCancellationMode=not_supported`，`local-model` probe health-check 现显式暴露 `transportKind=baseline`、`model`、`endpointSource=config_explicit` 与 `requestCancellationMode=local_abort_only`；对应 smoke/runtime/integration coverage 与 README / playbook / support matrix truth 同窗口完成刷新。
4. 2026-04-07：Delivery verification 已通过 `pnpm vitest run packages/adapters/github-copilot/test/github-copilot-agent-adapter.smoke.test.ts packages/adapters/local-model/test/local-model-agent-adapter.smoke.test.ts apps/cli/test/runtime/adapter-verification-runtime.test.ts test/first-batch-adapters-route.integration.test.ts --maxWorkers=1 --maxConcurrency=1`、`pnpm run build`、`.tmp/project-053-sprint-003-verify-adapters-tk-605-606.json` 与 `.tmp/project-053-sprint-003-run-dry-run-trace-tk-605-606.json`；fresh verify 已确认 `role_tester selected=github-copilot transport=cli_exec`，dry-run trace 已确认 `execution_id=cli-run-1775518628055` 的 `prepare -> execute -> report` 全链路成功。

## 10. 产出

1. `github-copilot` degrade-handling / probe truth 已补齐：`packages/adapters/github-copilot/src/github-copilot-agent-adapter.ts` 与 `packages/adapters/github-copilot/test/github-copilot-agent-adapter.smoke.test.ts` 现对外固定 `cli_exec` transport 与取消能力边界。
2. `local-model` support matrix alignment 已补齐：`packages/adapters/local-model/src/local-model-agent-adapter.ts` 与 `packages/adapters/local-model/test/local-model-agent-adapter.smoke.test.ts` 现对外固定 fallback-only real-path 所需的 endpoint/model/cancellation truth。
3. docs / verification alignment 已完成：`docs/support-matrix*.md`、`docs/local-adoption-playbook*.md`、`packages/adapters/*/README.md` 与 `.tmp/project-053-sprint-003-verify-adapters-tk-605-606.json`、`.tmp/project-053-sprint-003-run-dry-run-trace-tk-605-606.json` 共同构成当前 sprint-003 的正式证据面。
