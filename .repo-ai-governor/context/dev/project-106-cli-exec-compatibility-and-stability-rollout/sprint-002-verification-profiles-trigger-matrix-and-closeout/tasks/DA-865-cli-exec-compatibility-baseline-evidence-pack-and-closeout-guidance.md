# DA-865 cli-exec compatibility baseline evidence pack and closeout guidance

- Status: `active`
- Date: 2026-04-14
- Owner: `AI-Agent`
- Project: `project-106-cli-exec-compatibility-and-stability-rollout`
- Source Task: `TK-865`

## 1. Summary

1. `project-106 / sprint-002` 已把 focused compatibility verification profiles 从 ADR 文字层落成真实 execution route：`scripts/ci/run-cli-exec-compatibility-profile.js`。
2. 运行入口固定为：
   - `cli_exec_compatibility_full` / `cli_exec_compatibility_runtime_foundation`: `pnpm run verify:cli-exec-compatibility -- --profile <profile-id> --execute`
   - `cli_exec_compatibility_adapter_slice`: `pnpm run verify:cli-exec-compatibility -- --profile cli_exec_compatibility_adapter_slice --adapter <adapter-id> --execute`
   - dry-run / trigger-matrix probing: `node ./scripts/ci/run-cli-exec-compatibility-profile.js --changed-file <path> --output json`
3. trigger matrix 现在有可回放的路由行为，同时保持在 runtime guidance 层，没有写回 `governance.execution-gates` formal truth。

## 2. Trigger Matrix Evidence

1. shared runtime owner / consumer 路由到 `cli_exec_compatibility_full`：
   - sample inputs: `packages/adapter-sdk/src/native-cli-exec-process-runtime.ts`、`packages/adapter-sdk/src/native-cli-exec-internal-acp-extension-seam.ts`、`scripts/ci/run-cli-exec-compatibility-profile.js`、`test/cli-exec-compatibility-profile.integration.test.ts`、`package.json`
   - routed reason: `shared_runtime_or_consumer_changed`
   - exact command: `pnpm exec vitest run packages/adapter-sdk/test/native-cli-exec-process-runtime.unit.test.ts packages/adapter-sdk/test/agent-cli-exec-operations-runtime.unit.test.ts packages/adapter-sdk/test/native-cli-exec-internal-acp-extension-seam.unit.test.ts packages/adapters/codex/test/codex-agent-adapter.smoke.test.ts packages/adapters/claude-code/test/claude-code-agent-adapter.smoke.test.ts packages/adapters/github-copilot/test/github-copilot-agent-adapter.smoke.test.ts apps/cli/test/runtime/agent-onboarding-runtime.test.ts apps/cli/test/runtime/adapter-verification-runtime.test.ts apps/cli/test/runtime/adapter-routing-runtime.test.ts apps/cli/test/connect-phase2.integration.test.ts`
2. cross-adapter window 路由到 `cli_exec_compatibility_runtime_foundation`：
   - sample inputs: `packages/adapters/codex/src/codex-agent-adapter.ts` + `packages/adapters/claude-code/src/claude-code-agent-adapter.ts`
   - routed reason: `cross_adapter_slice_changed`
   - exact command: `pnpm exec vitest run packages/adapter-sdk/test/native-cli-exec-process-runtime.unit.test.ts packages/adapter-sdk/test/agent-cli-exec-operations-runtime.unit.test.ts packages/adapter-sdk/test/native-cli-exec-internal-acp-extension-seam.unit.test.ts packages/adapters/codex/test/codex-agent-adapter.smoke.test.ts packages/adapters/claude-code/test/claude-code-agent-adapter.smoke.test.ts packages/adapters/github-copilot/test/github-copilot-agent-adapter.smoke.test.ts`
3. single-adapter window 路由到 `cli_exec_compatibility_adapter_slice`：
   - sample input: `packages/adapters/github-copilot/src/github-copilot-agent-adapter.ts`
   - routed reason: `single_adapter_slice_changed`
   - exact command: `pnpm exec vitest run packages/adapters/github-copilot/test/github-copilot-agent-adapter.smoke.test.ts`
4. adapter package 内的非 runtime surface 不再误触发 compatibility profile：
   - sample inputs: `packages/adapters/codex/README.md`、`packages/adapters/codex/src/codex-host-renderer.ts`、`packages/adapters/codex/src/constants/codex-agent-adapter.constant.ts`、`packages/adapters/codex/src/types/interfaces/codex-agent-adapter.interface.ts`
   - routed reason: `no_cli_exec_runtime_change_detected`
   - exact result: `profileId: null`
5. shared `adapter-sdk` 内的非 native `cli_exec` surface 也不会再误触发 compatibility profile：
   - sample inputs: `packages/adapter-sdk/src/agent-capability-evaluator.ts`、`packages/adapter-sdk/src/agent-route-runner.ts`、`packages/adapter-sdk/test/agent-capability-evaluator.unit.test.ts`、`packages/adapter-sdk/test/layered-health-check-runtime.unit.test.ts`
   - routed reason: `no_cli_exec_runtime_change_detected`
   - exact result: `profileId: null`

## 3. Current Window Verification Evidence

1. `pnpm exec vitest run test/cli-exec-compatibility-profile.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过，`1` file / `24` tests；包含 explicit invalid `--base-ref` fail-fast 与 explicit-invalid-plus-env-valid regression）
2. `pnpm run build`（通过）
3. `pnpm run verify:cli-exec-compatibility -- --profile cli_exec_compatibility_full --execute`（通过，`10` files / `151` tests）
4. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过，`145` files / `972` tests）
5. `node ./scripts/ci/run-cli-exec-compatibility-profile.js --changed-file packages/adapters/codex/README.md --output json`（通过，返回 `profileId: null`）
6. `node ./scripts/ci/run-cli-exec-compatibility-profile.js --changed-file packages/adapters/codex/src/codex-host-renderer.ts --output json`（通过，返回 `profileId: null`）
7. `node ./scripts/ci/run-cli-exec-compatibility-profile.js --changed-file packages/adapters/codex/src/constants/codex-agent-adapter.constant.ts --output json`（通过，返回 `profileId: null`）
8. `node ./scripts/ci/run-cli-exec-compatibility-profile.js --changed-file packages/adapters/codex/src/types/interfaces/codex-agent-adapter.interface.ts --output json`（通过，返回 `profileId: null`）
9. `node ./scripts/ci/run-cli-exec-compatibility-profile.js --changed-file packages/adapter-sdk/src/agent-capability-evaluator.ts --output json`（通过，返回 `profileId: null`）
10. `node ./scripts/ci/run-cli-exec-compatibility-profile.js --changed-file packages/adapter-sdk/test/agent-capability-evaluator.unit.test.ts --output json`（通过，返回 `profileId: null`）
11. `node ./scripts/ci/run-cli-exec-compatibility-profile.js --changed-file packages/adapter-sdk/src/native-cli-exec-internal-acp-extension-seam.ts --output json`（通过，返回 `profileId: cli_exec_compatibility_full`）
12. `node ./scripts/ci/run-cli-exec-compatibility-profile.js --changed-file packages/adapter-sdk/test/native-cli-exec-internal-acp-extension-seam.unit.test.ts --output json`（通过，返回 `profileId: cli_exec_compatibility_runtime_foundation`）
13. `node ./scripts/ci/run-cli-exec-compatibility-profile.js --changed-file packages/adapter-sdk/test/native-cli-exec-process-runtime.unit.test.ts --output json`（通过，返回 `profileId: cli_exec_compatibility_runtime_foundation`）
14. `node ./scripts/ci/run-cli-exec-compatibility-profile.js --changed-file test/native-cli-exec-compatibility-harness.ts --output json`（通过，返回 `profileId: cli_exec_compatibility_runtime_foundation`）
15. `pnpm run verify:cli-exec-compatibility -- --profile cli_exec_compatibility_adapter_slice --adapter codex --execute`（通过，返回 codex smoke execution）
16. `node ./scripts/ci/run-cli-exec-compatibility-profile.js --changed-file scripts/ci/run-cli-exec-compatibility-profile.js --output json`（通过，返回 `profileId: cli_exec_compatibility_full`）
17. `node ./scripts/ci/run-cli-exec-compatibility-profile.js --changed-file test/cli-exec-compatibility-profile.integration.test.ts --output json`（通过，返回 `profileId: cli_exec_compatibility_full`）
18. `node ./scripts/ci/run-cli-exec-compatibility-profile.js --changed-file package.json --output json`（通过，返回 `profileId: cli_exec_compatibility_full`）

## 4. Future Runtime Window Guidance

1. 变更窗口开始时先用 dry-run 路由器确定最小 required profile：`node ./scripts/ci/run-cli-exec-compatibility-profile.js --changed-file <path> --output json`。
2. 若窗口触及 shared runtime owner、shared lifecycle/termination logic 或 launch-diagnostics consumer，则 closeout 前必须执行 `cli_exec_compatibility_full`。
3. shared native `cli_exec` runtime 的 internal ACP extension seam 与其 unit test 继续归 shared profile 集合：source 变更走 `cli_exec_compatibility_full`，unit-test 变更走 `cli_exec_compatibility_runtime_foundation`。
4. compatibility router 本身与 guarding integration suite 也归 `cli_exec_compatibility_full`；trigger matrix 或 profile command list 发生变更时，不允许绕过 native `cli_exec` baseline。
5. `package.json` 中的 `verify:cli-exec-compatibility` entrypoint 变更也归 `cli_exec_compatibility_full`；profile command alias 改动不允许绕过 native `cli_exec` baseline。
6. 当显式提供 `--base-ref` / `--head-ref` 以走 git-range routing 时，必须优先校验 explicit `base-ref`；若该 ref 在当前仓库不可解析，直接 fail-fast，不允许被 env base-ref 悄悄接管，也不允许静默回退到 working-tree mode。
7. `cli_exec_compatibility_adapter_slice` 只适用于每个 adapter 的 `cli_exec` runtime/parser 源文件与对应 smoke tests；执行时必须提供 `--adapter <adapter-id>`，或先用单 adapter changed-file set 通过 dry-run 决定 target adapter。host renderer、distribution constants、README、package metadata 等非 runtime surface 默认返回 `profileId: null`。
8. 若只执行 `cli_exec_compatibility_adapter_slice`，必须在 `tasks.csv`、CR artifact 或 completion audit 中显式记录“为什么允许不跑更高 profile”。
9. 若结论是“native cli_exec baseline remained green”，则 closeout / project-final evidence 一律回链 `cli_exec_compatibility_full`，不得只引用 adapter-slice 成功。
10. 若后续需要把这些 profile 升格成正式 gate truth，必须单独开启新的 `technical solution / promotion` 窗口，而不是在 runtime rollout 中隐式升级。

## 5. Outputs

1. `scripts/ci/run-cli-exec-compatibility-profile.js`
2. `test/cli-exec-compatibility-profile.integration.test.ts`
3. `package.json`
