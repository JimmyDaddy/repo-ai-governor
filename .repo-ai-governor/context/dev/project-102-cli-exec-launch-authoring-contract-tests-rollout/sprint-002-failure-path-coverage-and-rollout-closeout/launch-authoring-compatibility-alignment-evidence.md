# launch-authoring compatibility alignment evidence

- Status: `active`
- Date: 2026-04-14
- Owner: `AI-Agent`
- Project: `project-102-cli-exec-launch-authoring-contract-tests-rollout`
- Sprint: `sprint-002-failure-path-coverage-and-rollout-closeout`
- Source Task: `TK-870`

## 1. Summary

1. `project-102 / sprint-002` 把 launch-authoring contract coverage 明确对齐到 `project-106` 已完成的 native `cli_exec` compatibility taxonomy，而不是单独发明新的 failure vocabulary。
2. 本轮实现把 adapter-authored launch truth 回填到两类 failure-path：
   - exec runner 返回结果但未显式带回 `launchDiagnostics`
   - exec runner 直接抛错且 error details 未显式带回 `selectedEntrypoint / shellWrapped / processTreePolicy`
3. 对齐结论保持在 launch-authoring ownership guardrail 范围内：
   - 覆盖 `spawn / parse / non_zero / signal / timeout / abort`
   - 不扩展为 general adapter test strategy
   - 不把 additive launch diagnostics 升格成 minimum contract

## 2. Scenario-Class Alignment

1. `spawn_failed`
   - shared runtime anchor: `packages/adapter-sdk/test/native-cli-exec-process-runtime.unit.test.ts`
   - preserved facts: `launch_diagnostics_preserved`、`adapter_launch_truth_projected`
2. `probe_protocol_parse_failed`
   - adapter anchors:
     - `packages/adapters/codex/test/codex-agent-adapter.smoke.test.ts`
     - `packages/adapters/claude-code/test/claude-code-agent-adapter.smoke.test.ts`
     - `packages/adapters/github-copilot/test/github-copilot-agent-adapter.smoke.test.ts`
   - preserved facts: probe surface launch truth + fallback projection after parse failure
3. `invoke_protocol_parse_failed`
   - adapter anchors:
     - `packages/adapters/codex/test/codex-agent-adapter.smoke.test.ts`
     - `packages/adapters/claude-code/test/claude-code-agent-adapter.smoke.test.ts`
     - `packages/adapters/github-copilot/test/github-copilot-agent-adapter.smoke.test.ts`
   - preserved facts: invoke-surface `selectedEntrypoint / shellWrapped / processTreePolicy`
4. `non_zero_exit`
   - shared runtime anchor: `packages/adapter-sdk/test/native-cli-exec-process-runtime.unit.test.ts`
   - adapter regression anchor: `packages/adapters/claude-code/test/claude-code-agent-adapter.smoke.test.ts`
   - preserved facts: non-zero protocol failure still projects adapter-authored launch truth
5. `signal_exit`
   - shared runtime anchor: `packages/adapter-sdk/test/native-cli-exec-process-runtime.unit.test.ts`
   - preserved facts: signal exit does not erase adapter-authored launch truth
6. `timeout_soft_terminated` / `timeout_hard_terminated`
   - shared runtime anchors: `packages/adapter-sdk/test/native-cli-exec-process-runtime.unit.test.ts`
   - adapter consumer anchors:
     - `packages/adapters/codex/test/codex-agent-adapter.smoke.test.ts`
     - `packages/adapters/claude-code/test/claude-code-agent-adapter.smoke.test.ts`
     - `packages/adapters/github-copilot/test/github-copilot-agent-adapter.smoke.test.ts`
   - preserved facts: launch truth projection + terminate phase + partial output preservation
7. `abort_soft_terminated` / `abort_hard_terminated`
   - shared runtime anchors: `packages/adapter-sdk/test/native-cli-exec-process-runtime.unit.test.ts`
   - adapter consumer anchor: `packages/adapters/codex/test/codex-agent-adapter.smoke.test.ts`
   - preserved facts: abort-phase launch truth projection + terminate phase + partial output preservation

## 3. Scope Guardrail

1. shared harness vocabulary remains limited to launch-authoring ownership checks:
   - `expectProbeLaunchTruthProjected`
   - `expectInvokeLaunchTruthProjected`
   - `expectFallbackEntrypointProjection`
2. 本轮没有引入新的 adapter-wide strategy matrix、capability strategy 或 distribution/readiness surface。
3. compatibility baseline 只作为 scenario-class taxonomy 与 preserved-facts vocabulary 的上游输入；没有把 `project-102` 升格为 `project-106` 的 gate/profile owner。

## 4. Current Window Verification

1. `pnpm exec vitest run packages/adapter-sdk/test/native-cli-exec-process-runtime.unit.test.ts --maxWorkers=1 --maxConcurrency=1`（通过，`1` file / `10` tests）
2. `pnpm exec vitest run packages/adapters/codex/test/codex-agent-adapter.smoke.test.ts --maxWorkers=1 --maxConcurrency=1`（通过，`1` file / `32` tests）
3. `pnpm exec vitest run packages/adapters/claude-code/test/claude-code-agent-adapter.smoke.test.ts --maxWorkers=1 --maxConcurrency=1`（通过，`1` file / `32` tests）
4. `pnpm exec vitest run packages/adapters/github-copilot/test/github-copilot-agent-adapter.smoke.test.ts --maxWorkers=1 --maxConcurrency=1`（通过，`1` file / `19` tests）
5. `pnpm run build`（通过）
6. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过，`145` files / `972` tests）

## 5. Outputs

1. `packages/adapter-sdk/test/native-cli-exec-process-runtime.unit.test.ts`
2. `packages/adapters/codex/src/codex-agent-adapter.ts`
3. `packages/adapters/codex/test/codex-agent-adapter.smoke.test.ts`
4. `packages/adapters/claude-code/src/claude-code-agent-adapter.ts`
5. `packages/adapters/claude-code/test/claude-code-agent-adapter.smoke.test.ts`
6. `packages/adapters/github-copilot/src/github-copilot-agent-adapter.ts`
7. `packages/adapters/github-copilot/test/github-copilot-agent-adapter.smoke.test.ts`
