# TK-728 add same-surface no-failover regression coverage

- Status: completed
- Date: 2026-04-09
- Owner: AI-Agent
- Priority: P1
- Project: `project-076-transport-selection-authority-rollout`
- Sprint: `sprint-001-contract-and-routing-truth-cutover`

## 1. 任务目标

建立覆盖显式 transport 选择、same-surface no-failover 与 fail-closed next-action 的回归基线。

## 2. Depends On

1. `TK-727`
2. `apps/cli/src/runtime/adapter-routing-runtime.ts`
3. `apps/cli/src/runtime/agent-onboarding-runtime.ts`

## 3. 预期产物

1. transport truth regression tests
2. probe / diagnostics assertions
3. verification baseline note

## 4. Required Inputs

1. `test/`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-onboarding-contract.md`
3. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/adapter-health-and-route-probe-contract.md`

## 5. Traceback References

1. `TK-726`
2. `TK-727`

## 6. 实施计划

1. 为 explicit transport + unavailable transport 增加 fail-closed regression。
2. 覆盖 `config_explicit / inferred_from_remote_api / surface_default` 三种选择来源。
3. 把 next-action-only switch 建模纳入断言。

## 7. Development Verification

1. `pnpm test -- --runInBand`
2. `pnpm -s tsc -p tsconfig.json --noEmit`

## 8. Delivery Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 9. 执行记录

1. 2026-04-09：任务创建，状态初始化为 `planned`。
2. 2026-04-09：已为 onboarding truth、projection truth 与 same-surface no-failover 补齐回归覆盖，覆盖 `config_explicit`、`surface_default` 与显式 `remote_api` 失败不静默改写为 `cli_exec` 的基线。
3. 2026-04-09：新增 `agent-projection-runtime` / core projection service 回归测试，确保 selected transport 及 capability snapshot source 在 runtime 与 projection 间稳定传递。
4. 2026-04-09：已通过 `pnpm run build` 与 sprint-001 targeted vitest 回归集验证测试基线可重复执行。

## 10. 产出

1. `apps/cli/test/runtime/agent-onboarding-runtime.test.ts`
2. `apps/cli/test/runtime/agent-projection-runtime.test.ts`
3. `apps/cli/test/runtime/adapter-verification-runtime.test.ts`
4. `packages/core-agent-projection/test/agent-projection-service.unit.test.ts`
