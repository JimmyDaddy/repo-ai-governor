# DA-256 workspace-user layer contract alignment and future capability downgrade

- Status: active
- Date: 2026-03-27
- Owner: AI-Agent
- Task: `TK-256`
- Project: `project-022-memory-semantics-safety-and-consumer-hardening`
- Sprint: `sprint-001-contract-alignment-safety-and-adopter-output-baseline`

## 1. Delivery Conclusion

1. `runtime-memory-semantics` 已把 `workspace / user` 从默认 active recall baseline 中降级为 reserved capability：
   - 默认 recall constants 不再把这两层视作默认 active path
   - module overview / recall contract / ADR 与当前实现边界保持一致
2. 这次变更没有删除 `workspace / user` 作为逻辑层枚举，只是停止把它们表现成当前已实现能力。
3. `task-driven runtime` 的默认 recall request 现在只请求：
   - `execution`
   - `session`
   - `normative`

## 2. Contract Truth Outcome

1. `core-memory` substrate 当前仍只有：
   - `normative`
   - `execution`
   - `session`
2. 因此 `workspace / user` 在当前 `v1` 中只能作为 reserved capability 保留，避免形成“文档已承诺、实现未落地”的漂移。
3. 若未来需要落地 `workspace / user`，必须通过新 sprint 显式实现 substrate、ownership seam 与 consumer evidence。

## 3. Changed Surface

1. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-memory-semantics/module-overview.md`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-memory-semantics/contracts/memory-recall-policy-contract.md`
3. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-memory-semantics/adrs/working-memory-and-canonical-source-boundary.md`
4. `packages/core-memory-semantics/src/constants/memory-semantics.constant.ts`
5. `apps/cli/test/runtime/task-driven-run-runtime.test.ts`

## 4. Validation

1. `pnpm -s tsc -p tsconfig.json --noEmit`
2. `pnpm exec vitest run packages/core-memory-semantics/test/memory-semantics.unit.test.ts apps/cli/test/runtime/task-driven-run-runtime.test.ts --maxWorkers=1 --maxConcurrency=1`
3. `node ./scripts/governance/check-technical-solution-delivery-registry.js`
4. `pnpm run check`
