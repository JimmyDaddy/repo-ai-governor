# DA-258 adopter-facing promotion output and replay diagnostics baseline

- Status: active
- Date: 2026-03-27
- Owner: AI-Agent
- Task: `TK-258`
- Project: `project-022-memory-semantics-safety-and-consumer-hardening`
- Sprint: `sprint-001-contract-alignment-safety-and-adopter-output-baseline`

## 1. Delivery Conclusion

1. `runtime-memory-semantics` 的 promotion output 已扩到 adopter-facing CLI surface：
   - `run` message 会在存在 promotion 结果时输出 `memory_promotion / merged / session_projection`
   - `replay` message 会在 replay source 带有 `memorySemantics` 时输出同类摘要
2. replay diagnostics 相邻 surface 已同步消费 promotion output：
   - replay explain lines 会追加 `memory_promotion_*` 与 `memory_session_projection_key`
   - replay diagnostics artifact `summary.memorySemantics` 会持久化 promotion 摘要
3. 这次 rollout 仍只消费 contract-safe promotion output，不回退到底层 snapshot 或 raw memory payload。

## 2. Adopter-Facing Outcome

1. adopter 不再只能打开 `execution_report` JSON 才能知道 promotion 是否发生。
2. `run` / `replay` CLI 输出现在都能直接给出：
   - promotion outcome
   - merged count
   - session projection key
3. replay diagnostics artifact 为后续用户排障保留了同样的 machine-readable summary。

## 3. Changed Surface

1. `apps/cli/src/cli-governance-runtime.ts`
2. `apps/cli/src/runtime/presentation/replay-explain-builder.ts`
3. `apps/cli/src/runtime/presentation/command-experience-builder.ts`
4. `apps/cli/src/runtime/artifacts/runtime-artifact-writer.ts`
5. `apps/cli/test/runtime/replay-explain-builder.test.ts`
6. `apps/cli/test/runtime/command-experience-builder.test.ts`
7. `apps/cli/test/cli-governance-runtime.integration.test.ts`

## 4. Validation

1. `pnpm -s tsc -p tsconfig.json --noEmit`
2. `pnpm exec vitest run apps/cli/test/runtime/replay-explain-builder.test.ts apps/cli/test/runtime/command-experience-builder.test.ts apps/cli/test/cli-governance-runtime.integration.test.ts packages/reporting/test/report-builder.unit.test.ts --maxWorkers=1 --maxConcurrency=1`
3. `pnpm run check`
