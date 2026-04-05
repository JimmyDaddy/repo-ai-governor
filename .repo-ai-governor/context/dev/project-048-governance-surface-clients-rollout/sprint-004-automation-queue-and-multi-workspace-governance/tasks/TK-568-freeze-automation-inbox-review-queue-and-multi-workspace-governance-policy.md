# TK-568 freeze automation inbox review queue and multi workspace governance policy

- Status: completed
- Date: 2026-04-05
- Task ID: `TK-568`
- Owner: `AI-Agent`
- Priority: `P1`
- Sprint: `sprint-004-automation-queue-and-multi-workspace-governance`
- Project: `project-048-governance-surface-clients-rollout`

## 1. 目标

冻结 automation inbox、review queue、多 workspace governance 与 notification ownership 的正式 contract。

## 2. Expected Outputs

1. queue contract baseline
2. multi-workspace governance policy
3. notification ownership boundary

## 3. Execution Notes

1. 2026-04-05：随 `sprint-004` 激活切换为 `active`，开始冻结 automation inbox、review queue、parallel lane、multi-workspace summary 与 notification ownership 的 service-owned contract。
2. 2026-04-05：已完成 orchestration service client / sidecar / desktop runtime 全链路 `queryQueueOverview` seam 冻结，并正式收敛 `automation inbox / review queue / parallel lane / workspace summary / notification ownership` DTO。
