# TK-728 add same-surface no-failover regression coverage

- Status: planned
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

## 10. 产出

1. 待执行：regression coverage patch
2. 待执行：verification baseline note
