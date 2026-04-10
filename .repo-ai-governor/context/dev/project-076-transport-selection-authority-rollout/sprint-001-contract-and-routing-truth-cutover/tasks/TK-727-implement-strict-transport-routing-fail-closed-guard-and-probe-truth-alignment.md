# TK-727 implement strict transport routing fail-closed guard and probe truth alignment

- Status: completed
- Date: 2026-04-09
- Owner: AI-Agent
- Priority: P0
- Project: `project-076-transport-selection-authority-rollout`
- Sprint: `sprint-001-contract-and-routing-truth-cutover`

## 1. 任务目标

把同一 surface 内禁止静默 transport failover 的规则落实到 runtime / probe 行为与 fail-closed diagnostics。

## 2. Depends On

1. `TK-726`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-projection-contract.md`
3. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/adapter-health-and-route-probe-contract.md`

## 3. 预期产物

1. strict transport routing runtime guard
2. probe truth alignment
3. fail-closed diagnostics / reason propagation

## 4. Required Inputs

1. `apps/cli/src/runtime/adapter-routing-runtime.ts`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-projection-contract.md`
3. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/adapter-health-and-route-probe-contract.md`

## 5. Traceback References

1. `.repo-ai-governor/draft/transport-selection-authority-and-strict-routing-follow-up-technical-solution.md`
2. `.repo-ai-governor/context/dev/project-075-transport-selection-authority-promotion-and-decomposition/sprint-001-promotion-and-followup-decomposition/tasks/DA-718-transport-selection-authority-promotion-and-rollout-decomposition-handoff.md`

## 6. 实施计划

1. 在 runtime route selection 上区分 explicit transport 与 cross-surface fallback。
2. 保证 probe truth 不会被同 surface 的 alternate transport success 覆盖。
3. 让 presenter / diagnostics 只通过 next actions 建议人工切换。

## 7. Development Verification

1. `pnpm -s tsc -p tsconfig.json --noEmit`
2. `pnpm test -- --runInBand`

## 8. Delivery Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 9. 执行记录

1. 2026-04-09：任务创建，状态初始化为 `planned`。
2. 2026-04-09：已把 selected transport / provider / vendor binding / model / capability snapshot source 投影到 CLI projection surfaces，保证 runtime、probe 与 presenter 消费同一套 transport truth。
3. 2026-04-09：已补齐显式 `remote_api` 失败时的 fail-closed 投影与 diagnostics 语义，避免同 surface `cli_exec` 成功结果覆盖显式 transport 选择失败。
4. 2026-04-09：已通过 `pnpm run build` 与 sprint-001 targeted vitest 回归集验证 runtime / projection truth 对齐。

## 10. 产出

1. `apps/cli/src/runtime/agent-projection-runtime.ts`
2. `packages/core-agent-projection/src/agent-projection-service.ts`
3. `packages/core-agent-projection/src/types/interfaces/agent-projection.interface.ts`
4. `apps/cli/test/runtime/adapter-verification-runtime.test.ts`
