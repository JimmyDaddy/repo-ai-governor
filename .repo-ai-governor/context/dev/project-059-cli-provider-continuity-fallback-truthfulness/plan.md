# project-059-cli-provider-continuity-fallback-truthfulness 计划

- Status: completed
- Date: 2026-04-08
- Stage Mapping: cli interaction hardening follow-up
- Phase Mapping: provider continuation fallback presenter truthfulness
- Upstream:
  - `.repo-ai-governor/context/dev/project-058-cli-session-continuity-and-claude-recovery/plan.md`
  - `.repo-ai-governor/context/dev/project-043-cli-session-shell-productization-rollout/plan.md`

## 1. 目标

1. 修正 CLI transcript / presenter 在 provider backend continuation `unsupported` 但 lightweight session fallback 已生效时仍按问题口吻展示的 truthfulness 缺口。
2. 为 provider continuation summary 补充足够的 presenter-safe fallback 真值，让 UI 能区分“连续性已通过轻量摘要保住”和“连续性确实不可用”。
3. 以最小实现边界完成本轮 follow-up，并在同一窗口收口验证与治理写回。

## 2. Sprint 细化

## 2.1 sprint-001-unsupported-fallback-presenter-alignment

- Status: completed
- Sprint Goal: 让 unsupported provider continuation 在 fallback 已生效时不再被 CLI 继续显示成未修复问题。
- Task Package: `TK-655`、`TK-656`

## 3. 任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | status |
|---|---|---|---|---|---|
| TK-655 | sprint-001 | implement provider continuation fallback-aware presenter truthfulness | cli/runtime/presenter | project-058 traceback | completed |
| TK-656 | sprint-001 | finalize project-059 closeout and clear the active primary stream | closeout/final-audit | TK-655 | completed |

## 4. 依赖产物策略

1. provider continuation summary 继续保持 presenter-safe，不暴露 provider raw handle 或额外 durable truth 面。
2. unsupported 场景必须区分“已有 lightweight session note fallback”与“没有 fallback”两类状态，避免把 truthful degrade 继续报成未解决问题。
3. 文案与 presenter 行为必须和 runtime 真值保持一致，不通过单纯隐藏状态来掩盖真实能力边界。

## 5. DoD（project-059）

1. 当 provider continuation `unsupported` 且已有 lightweight session note fallback 时，CLI transcript 不再把该场景呈现为未修复问题。
2. 当 provider continuation `unsupported` 且没有 fallback 时，CLI 仍能保留 truthful unsupported 提示。
3. 至少具备 targeted regression evidence，且同窗口 `pnpm run build` 通过。

## 6. 里程碑记录

1. 2026-04-08：基于用户复测反馈创建 `project-059 / sprint-001` active stream，用于修正 provider continuation fallback presenter truthfulness。
2. 2026-04-08：`TK-655` 已完成，为 presenter-safe provider continuation summary 补入 fallback-active 真值，并将 unsupported + fallback-active transcript 改为“连续性已通过轻量摘要保住”的展示语义；targeted tests 与 `pnpm run build` 已通过。
3. 2026-04-08：`TK-656 / DA-656` 已完成最终 closeout write-back，`project-059` 正式进入 `completed`，并在此里程碑回链 [project-059 completion audit summary](./project-059-cli-provider-continuity-fallback-truthfulness-completion-audit-summary.md)。
