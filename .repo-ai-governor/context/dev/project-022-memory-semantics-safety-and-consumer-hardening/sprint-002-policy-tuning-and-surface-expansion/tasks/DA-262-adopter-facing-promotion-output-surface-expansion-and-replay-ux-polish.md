# DA-262 adopter-facing promotion output surface expansion and replay ux polish

- Status: active
- Date: 2026-03-27
- Owner: AI-Agent
- Task: `TK-262`
- Project: `project-022-memory-semantics-safety-and-consumer-hardening`
- Sprint: `sprint-002-policy-tuning-and-surface-expansion`

## 1. Delivery Conclusion

1. adopter-facing surface 已从 `TK-258` 的 message / diagnostics baseline 扩展到：
   - `memory_policy` check
   - layered logs summary / detailed
   - replay explain lines 中的 policy facts
   - replay diagnostics artifact summary 中的 policy facts
2. 用户现在可以直接在 `run / replay` 结果中看到：
   - policy overall action
   - warn / redact / block counts
   - promotion outcome / merged count / session projection key

## 2. UX Outcome

1. `run` 不再只告诉用户 promotion 是否发生，也会告诉用户 memory policy 是否发生了 warning / redaction / blocking。
2. `replay` 现在可以在不手动阅读原始 report JSON 的前提下解释 memory policy 与 promotion 结果。
3. 这次扩展仍只消费 contract-safe summary 和 replay diagnostics augmentation，不回退到底层 snapshot。

## 3. Validation

1. `pnpm -s tsc -p tsconfig.json --noEmit`
2. `pnpm exec vitest run apps/cli/test/runtime/replay-explain-builder.test.ts apps/cli/test/runtime/command-experience-builder.test.ts apps/cli/test/cli-governance-runtime.integration.test.ts packages/reporting/test/report-builder.unit.test.ts --maxWorkers=1 --maxConcurrency=1`
3. `node ./scripts/governance/check-artifact-registry-lifecycle.js`
