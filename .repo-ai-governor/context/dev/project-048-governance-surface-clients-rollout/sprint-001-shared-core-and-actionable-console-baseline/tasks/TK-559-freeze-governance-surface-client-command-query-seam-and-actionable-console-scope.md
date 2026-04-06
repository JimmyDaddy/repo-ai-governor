# TK-559 freeze governance surface client command query seam and actionable console scope

- Status: completed
- Date: 2026-04-05
- Task ID: `TK-559`
- Owner: `AI-Agent`
- Priority: `P1`
- Sprint: `sprint-001-shared-core-and-actionable-console-baseline`
- Project: `project-048-governance-surface-clients-rollout`

## 1. 目标

冻结 desktop actionable console 所需的 command/query seam、surface split、identifier semantics 与 acceptance scope。

## 2. Expected Outputs

1. desktop preload / service client command seam delta
2. actionable console query model baseline
3. acceptance scope for sprint-001

## 3. Execution Notes

1. 2026-04-05：已作为 sprint-001 首个 active task 启动，负责冻结 `getExecution` / `submitHitlDecision` / `recoverExecution` / `terminateExecution` 与 execution board / HITL inbox / handoff target 的 service-owned contract。
2. 2026-04-05：已完成 `packages/orchestration-service-client`、`packages/core-orchestration-service`、`apps/desktop` 三层 contract 冻结，并同步 `integrations/desktop/**` baseline 文档与 smoke sample。
