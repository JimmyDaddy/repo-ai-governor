# DA-266 adopter-facing surface follow-through and project closeout recommendation baseline

- Status: active
- Date: 2026-03-27
- Owner: AI-Agent
- Task: `TK-266`
- Project: `project-022-memory-semantics-safety-and-consumer-hardening`
- Sprint: `sprint-003-seam-follow-through-or-project-closeout`

## 1. Recommendation Conclusion

1. 当前 adopter-facing surface 的正式结论为：**直接 closeout，不再继续 follow-through 扩张**。
2. `TK-258` 与 `TK-262` 已把 `runtime.memory-semantics` 的 adopter-facing surface 收敛到本轮项目目标所需的可见度：
   - `run / replay` message 中的 `memory_policy` 与 `memory_promotion`
   - layered logs summary / detailed 中的 policy facts
   - replay explain lines 与 diagnostics summary 中的 policy / promotion facts
3. 当前仓库内不存在需要继续在 `project-022` 范围内新增 adopter-facing consumer 的强证据；若未来需要扩展到新的 CLI/documentation/playbook surface，应新开 follow-up stream，而不是继续堆积到本 sprint。

## 2. Evidence Snapshot

1. `DA-258` 已建立 adopter-facing `run / replay` promotion output 与 diagnostics baseline。
2. `DA-262` 已把 surface 扩展到 `memory_policy` check、layered logs、replay explain 与 diagnostics summary。
3. 当前 delivery handoff 的 consumer surfaces 仍稳定为 `runtime_service + adopter_cli`，与现有 rollout 证据一致。
4. 2026-03-27 重新运行了针对 adopter-facing surface 的定向验证：
   - `apps/cli/test/cli-governance-runtime.integration.test.ts`
   - `apps/cli/test/runtime/replay-explain-builder.test.ts`
   - `apps/cli/test/runtime/command-experience-builder.test.ts`
   - `packages/reporting/test/report-builder.unit.test.ts`

## 3. Follow-Up Advice

1. 若未来出现新的 adopter-facing consumer demand，必须先明确 consumer owner 与 contract-safe shape，再新开 stream 承接。
2. 本轮 closeout 不应把 surface 扩张与 `workspace/user` seam 实现绑定，避免 scope 漫游回到长期记忆层实现。

## 4. Validation

1. `pnpm -s tsc -p tsconfig.json --noEmit`
2. `pnpm exec vitest run apps/cli/test/cli-governance-runtime.integration.test.ts apps/cli/test/runtime/replay-explain-builder.test.ts apps/cli/test/runtime/command-experience-builder.test.ts packages/reporting/test/report-builder.unit.test.ts --maxWorkers=1 --maxConcurrency=1`
3. `node ./scripts/governance/check-technical-solution-delivery-registry.js`
4. `node ./scripts/governance/run-normative-loading-manifest-gate.js`
