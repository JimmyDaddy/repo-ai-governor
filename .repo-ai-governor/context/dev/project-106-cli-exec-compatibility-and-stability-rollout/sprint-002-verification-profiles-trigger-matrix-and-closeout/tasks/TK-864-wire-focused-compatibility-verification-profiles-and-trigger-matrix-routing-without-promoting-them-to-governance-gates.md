# TK-864 wire focused compatibility verification profiles and trigger-matrix routing without promoting them to governance gates

- Status: completed
- Date: 2026-04-14
- Owner: AI-Agent
- Priority: P1
- Project: `project-106-cli-exec-compatibility-and-stability-rollout`
- Sprint: `sprint-002-verification-profiles-trigger-matrix-and-closeout`

## 1. 任务目标

把 focused compatibility verification profiles 与 trigger matrix 变成真实 rollout-owned execution route，同时保持它们不升级为新的 governance gate truth。

## 2. Depends On

1. `TK-863`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/native-cli-exec-compatibility-and-stability-productization.md`

## 3. 预期产物

1. focused compatibility profile rollout plan
2. trigger-matrix routing boundary and execution notes
3. synced task ledger once activation begins

## 4. Required Inputs

1. `.repo-ai-governor/context/dev/project-106-cli-exec-compatibility-and-stability-rollout/sprint-001-compatibility-taxonomy-and-regression-harness/tasks/TK-863-sprint-001-exit-acceptance-and-sprint-002-activation-handoff.md`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/native-cli-exec-compatibility-and-stability-productization.md`
3. `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-098-cli-exec-runtime-rollout/plan.md`

## 6. 实施计划

1. 将 compatibility profile 与 trigger matrix 映射成真实 implementation-window 的 verification route。
2. 固定 shared runtime / cross-adapter / adapter-slice 三档 profile 的触发边界。
3. 明确这些 profile 只作为 rollout guidance，不写成新的 governance gate minimum truth。

## 7. Development Verification

1. `pnpm exec vitest run test/cli-exec-compatibility-profile.integration.test.ts --maxWorkers=1 --maxConcurrency=1`
2. `node ./scripts/ci/run-cli-exec-compatibility-profile.js --changed-file packages/adapter-sdk/src/native-cli-exec-process-runtime.ts --output json`
3. `node ./scripts/ci/run-cli-exec-compatibility-profile.js --changed-file packages/adapters/codex/src/codex-agent-adapter.ts --changed-file packages/adapters/claude-code/src/claude-code-agent-adapter.ts --output json`
4. `node ./scripts/ci/run-cli-exec-compatibility-profile.js --changed-file packages/adapters/github-copilot/src/github-copilot-agent-adapter.ts --output json`
5. `node ./scripts/ci/run-cli-exec-compatibility-profile.js --changed-file packages/adapters/codex/README.md --output json`
6. `node ./scripts/ci/run-cli-exec-compatibility-profile.js --changed-file packages/adapters/codex/src/codex-host-renderer.ts --output json`
7. `node ./scripts/ci/run-cli-exec-compatibility-profile.js --changed-file packages/adapter-sdk/test/native-cli-exec-process-runtime.unit.test.ts --output json`
8. `node ./scripts/ci/run-cli-exec-compatibility-profile.js --changed-file test/native-cli-exec-compatibility-harness.ts --output json`

## 8. Delivery Verification

1. `pnpm run build`
2. `pnpm run verify:cli-exec-compatibility -- --profile cli_exec_compatibility_full --execute`
3. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`

## 9. 执行记录

1. 2026-04-14：任务创建，状态初始化为 `planned`。
2. 2026-04-14：sprint-001 clean closeout 后，当前任务状态切换为 `in_progress`，当前 sprint 被激活为新的 primary execution surface；下一步先为 sprint-002 分配本地 `CR-001`，再开始 profile routing implementation。
3. 2026-04-14：已新增 `scripts/ci/run-cli-exec-compatibility-profile.js` 与 `pnpm run verify:cli-exec-compatibility` 入口，把 `full / runtime_foundation / adapter_slice` 三档 profile 变成真实 execution route。
4. 2026-04-14：已新增 `test/cli-exec-compatibility-profile.integration.test.ts`，并用 dry-run 样例验证 shared runtime owner、cross-adapter window 与 single-adapter window 的 trigger-matrix routing。
5. 2026-04-14：fresh reviewer round 1 指出 adapter-slice 命中面过宽；当前已将触发面收窄到真实 `cli_exec` runtime/parser 文件，并补齐 README / host-renderer false-positive regression coverage。
6. 2026-04-14：fresh reviewer round 2 指出 `shared_runtime_foundation_changed` 缺少自动化覆盖；当前已补齐 adapter-sdk test / shared harness 两条 runtime-foundation regression assertions。
7. 2026-04-14：fresh reviewer round 4 指出 shared `adapter-sdk` trigger surface 仍是目录级；当前已将 shared source/test 触发面收窄到 `native-cli-exec-process-runtime`、`agent-cli-exec-operations-runtime` 与 shared harness，并补齐 `agent-capability-evaluator`、`agent-route-runner`、`layered-health-check-runtime` false-positive regression coverage。
8. 2026-04-14：fresh reviewer round 5 指出 adapter-slice 仍包含 `constants / interfaces` contract-only 文件；当前已将 adapter-slice 触发面进一步收窄到各 adapter 的真实 runtime entry 与 smoke test，并补齐 constants/interface false-positive regression coverage。
9. 2026-04-14：fresh reviewer round 6 指出 shared native `cli_exec` internal ACP seam 未进入 trigger matrix，且 handoff artifact 将 adapter-slice 调用方式写成了通用 `<profile-id>` 入口；当前已把 seam source/test 纳入 shared profile、补齐 seam routing 与 explicit adapter-slice invocation regression coverage，并刷新 `DA-865` closeout guidance。
10. 2026-04-14：fresh reviewer round 7 指出 CI `git_range` 分支仍缺少自动化覆盖；当前已新增临时 git repo 的 deterministic regression，锁住 `--base-ref/--head-ref` 路由到 shared full profile 的行为。
11. 2026-04-14：fresh reviewer round 8 指出 compatibility router 自身与 guarding integration suite 变更仍可能绕过 baseline；当前已将 router script 与 integration suite 一并纳入 `cli_exec_compatibility_full` 触发面，并补齐对应 regression coverage。
12. 2026-04-14：fresh reviewer round 9 指出显式无效 `--base-ref` 会静默降级到 working-tree mode；当前已将 explicit base-ref 解析改为 fail-fast，并补齐 invalid-base-ref regression coverage。
13. 2026-04-14：fresh reviewer round 10 指出 explicit invalid `--base-ref` 仍可能被 env base-ref 接管、且 `package.json` verify entrypoint 改动还不会命中 full profile；当前已将显式 ref 解析改为优先 fail-fast，并把 `package.json` 纳入 `cli_exec_compatibility_full` 触发面，同时补齐两条 regression coverage。
14. 2026-04-14：build、full compatibility profile 与 `test:packages` 已在当前 change window 通过，当前任务收口为 `completed`。

## 10. 产出

1. `scripts/ci/run-cli-exec-compatibility-profile.js`
2. `test/cli-exec-compatibility-profile.integration.test.ts`
3. `package.json`
