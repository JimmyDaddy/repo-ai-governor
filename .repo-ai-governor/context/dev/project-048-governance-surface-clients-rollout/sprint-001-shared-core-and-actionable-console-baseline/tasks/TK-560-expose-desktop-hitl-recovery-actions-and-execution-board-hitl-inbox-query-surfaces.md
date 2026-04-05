# TK-560 expose desktop hitl recovery actions and execution board hitl inbox query surfaces

- Status: completed
- Date: 2026-04-05
- Task ID: `TK-560`
- Owner: `AI-Agent`
- Priority: `P1`
- Sprint: `sprint-001-shared-core-and-actionable-console-baseline`
- Project: `project-048-governance-surface-clients-rollout`

## 1. 目标

把 desktop 从只读 console 推进为可操作 console，落地 HITL / recovery action seam 与 execution board、HITL inbox query surface。

## 2. Depends On

1. `TK-559`

## 3. Expected Outputs

1. `submitHitlDecision` / `recoverExecution` / `getExecution` / `terminateExecution` bridge
2. execution board query surface
3. HITL inbox query surface

## 4. Execution Notes

1. 2026-04-05：保持 `planned`，等待 `TK-559` 冻结 contract 后再进入实现。
2. 2026-04-05：已完成 `queryExecutionBoard` / `queryHitlInbox` service-owned read model、desktop preload action bridge，以及 `terminateExecution` sidecar/runtime 接线。
