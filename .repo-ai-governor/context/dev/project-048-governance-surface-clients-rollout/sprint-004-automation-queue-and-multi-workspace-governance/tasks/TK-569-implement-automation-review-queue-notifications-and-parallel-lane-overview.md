# TK-569 implement automation review queue notifications and parallel lane overview

- Status: completed
- Date: 2026-04-05
- Task ID: `TK-569`
- Owner: `AI-Agent`
- Priority: `P1`
- Sprint: `sprint-004-automation-queue-and-multi-workspace-governance`
- Project: `project-048-governance-surface-clients-rollout`

## 1. 目标

实现 automation/review queue、notifications 与 parallel lane overview，使 desktop 成为持续使用的 command center。

## 2. Depends On

1. `TK-568`

## 3. Expected Outputs

1. automation inbox surface
2. review queue surface
3. notifications and parallel lane overview

## 4. Execution Notes

1. 2026-04-05：已完成 `LocalOrchestrationServiceQueueOverviewQueryRuntime`，将 automation inbox、review queue、parallel lane、workspace summary 与 notification ownership 全部收敛为 service-owned read model。
2. 2026-04-05：已在 desktop governance console snapshot 中接入 queue overview transport-neutral view-model，并同步更新 desktop support docs、sample contract、desktop smoke 断言与 targeted tests。
