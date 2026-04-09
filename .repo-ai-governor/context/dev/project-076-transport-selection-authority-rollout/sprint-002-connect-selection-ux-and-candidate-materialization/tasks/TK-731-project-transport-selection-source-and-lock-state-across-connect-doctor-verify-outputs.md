# TK-731 project transport selection source and lock state across connect-doctor-verify outputs

- Status: planned
- Date: 2026-04-09
- Owner: AI-Agent
- Priority: P1
- Project: `project-076-transport-selection-authority-rollout`
- Sprint: `sprint-002-connect-selection-ux-and-candidate-materialization`

## 1. 任务目标

在 `connect / doctor / verify` 输出中稳定投影 `transport_selection_source` 与 `transport_selection_locked`。

## 2. Depends On

1. `TK-730`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-onboarding-contract.md`

## 3. 预期产物

1. output projection patch
2. diagnostics field alignment
3. presenter-safe transport selection truth

## 4. Required Inputs

1. `apps/cli/src/runtime/agent-onboarding-runtime.ts`
2. `apps/cli/src/runtime/adapter-routing-runtime.ts`
3. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-onboarding-contract.md`

## 5. Traceback References

1. `TK-726`
2. `TK-730`

## 6. 实施计划

1. 在 onboarding / diagnostics payload 中暴露 selection source 与 lock state。
2. 保持 presenter / consumer 对 canonical truth 的单向消费。
3. 确保显式 transport 失败仍保留 attempted transport truth。

## 7. Development Verification

1. `pnpm -s tsc -p tsconfig.json --noEmit`
2. `pnpm test -- --runInBand`

## 8. Delivery Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 9. 执行记录

1. 2026-04-09：任务创建，状态初始化为 `planned`。

## 10. 产出

1. 待执行：output projection patch
2. 待执行：diagnostics alignment note
