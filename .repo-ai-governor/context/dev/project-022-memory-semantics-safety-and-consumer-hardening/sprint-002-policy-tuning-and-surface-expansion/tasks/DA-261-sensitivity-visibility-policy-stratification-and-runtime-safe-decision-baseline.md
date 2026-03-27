# DA-261 sensitivity visibility policy stratification and runtime-safe decision baseline

- Status: active
- Date: 2026-03-27
- Owner: AI-Agent
- Task: `TK-261`
- Project: `project-022-memory-semantics-safety-and-consumer-hardening`
- Sprint: `sprint-002-policy-tuning-and-surface-expansion`

## 1. Delivery Conclusion

1. `runtime-memory-semantics` 现在具备明确的 machine-readable policy stratification：
   - `allow`
   - `warn`
   - `redact`
   - `block`
2. `MemoryContextAssembler` 已把 raw recalled payload 从执行链路隔离：
   - stage inputs / process globals 只接收 runtime-safe `memoryContext`
   - `selectedRecords` 在 assembly 结果中已按 policy 做安全化处理
3. policy summary 现在会进入：
   - `memoryContext.policySummary`
   - `contractSafeSummary.policySummary`
   - execution report `memorySemantics.contextSummary.policySummary`

## 2. Runtime-Safe Decision Outcome

1. `missing sensitivity labels` => `redact`
2. `forbidden sensitivity labels` => `block`
3. `visibility not allowed for runtime` => `redact`
4. `record-identity-only provenance` => `warn`
5. `allow` 仅用于满足当前 runtime-safe 条件的记录。

## 3. Validation

1. `pnpm -s tsc -p tsconfig.json --noEmit`
2. `pnpm exec vitest run packages/core-memory-semantics/test/memory-semantics.unit.test.ts apps/cli/test/runtime/task-driven-run-runtime.test.ts apps/cli/test/runtime/replay-explain-builder.test.ts apps/cli/test/runtime/command-experience-builder.test.ts apps/cli/test/cli-governance-runtime.integration.test.ts packages/reporting/test/report-builder.unit.test.ts --maxWorkers=1 --maxConcurrency=1`
3. `node ./scripts/governance/run-normative-loading-manifest-gate.js`
