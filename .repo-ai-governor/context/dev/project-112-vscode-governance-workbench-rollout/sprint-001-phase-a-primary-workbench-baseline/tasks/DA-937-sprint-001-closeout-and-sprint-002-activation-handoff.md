# DA-937 sprint-001 closeout and sprint-002 activation handoff

- Status: completed
- Date: 2026-04-17
- Project: `project-112-vscode-governance-workbench-rollout`
- Sprint: `sprint-001-phase-a-primary-workbench-baseline`
- Task: `TK-937`

## 1. Summary

1. `sprint-001-phase-a-primary-workbench-baseline` 已完成 clean closeout-ready evidence 收口。
2. `TK-936` 已切换为 `completed`，`CR-001 ~ CR-003` 已全部进入 `resolved`，且 latest fresh reviewer round `CR-003` 返回 clean verdict。
3. sprint-002 的下一条执行边界已固定为 `TK-938`，重点转向 automation queue、artifact workbench、multi-workspace overview 与 typed CLI bridge governance baseline。

## 2. Closed Evidence

1. `TK-936`：VS Code primary workbench baseline、task/review queue seam 与 service-owned projection contract 已在 `apps/vscode-extension/**` 冻结为 Phase A runtime truth。
2. `CR-001`：修复 capability metadata contract drift 与 review-queue fallback coverage gap，并把 frozen capability taxonomy 与 formal contract 对齐。
3. `CR-002`：修复 review-only queue item 错误回退到最新 execution detail 的行为，同时补 execution/HITL re-anchor 的 stale `reviewSourcePath` 清理链与真实 `OPEN_REVIEW_DETAIL` 回归测试。
4. `CR-003`：fresh clean reviewer round 未发现新的 actionable finding，确认 sprint-001 当前 scope 已满足进入 closeout 的评审门槛。

## 3. Activation Handoff

1. 下一条 primary execution surface 应切换到 `project-112 / sprint-002-phase-b-outer-loop-consolidation-and-operations`。
2. 下一条 implementation task 应激活 `TK-938 land outer-loop consolidation and typed cli bridge governance baseline`。
3. sprint-002 实施必须延续 sprint-001 已冻结的治理边界：
   - VS Code surface 继续只消费 service-owned query/command seam，不直接读取 `.repo-ai-governor/**` canonical workspace files。
   - automation queue、artifact workbench 与 multi-workspace overview 必须复用现有 `queryQueueOverview` / aggregation facade truth，不在 extension 侧重建 queue truth。
   - typed CLI bridge 只能作为 temporary path，且每条 bridge 都必须携带 receipt/backlink 与显式 exit criteria。

## 4. Outputs

1. `.repo-ai-governor/context/dev/project-112-vscode-governance-workbench-rollout/plan.md`
2. `.repo-ai-governor/context/dev/project-112-vscode-governance-workbench-rollout/sprint-001-phase-a-primary-workbench-baseline/plan.md`
3. `.repo-ai-governor/context/dev/project-112-vscode-governance-workbench-rollout/sprint-002-phase-b-outer-loop-consolidation-and-operations/plan.md`
4. `.repo-ai-governor/context/current-context.md`
5. `.repo-ai-governor/context/completed-streams-history.md`
6. `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`

## 5. Verification Note

1. 本 closeout 窗口已复用 latest fresh reviewer clean round、`pnpm run build`、4 个 VS Code extension 定向 vitest，以及 task-ledger/review-lifecycle/sprint-plan/worktree-review-target gates 的同窗口证据。
2. `pnpm run check`、delivery-registry gate 与 artifact-registry lifecycle gate 已在 sprint-002 active truth 写回后同窗口通过，可直接进入 sprint-001 boundary commit。
3. closeout 期间额外执行 `node ./scripts/governance/run-artifact-lifecycle-maintenance.js`，将 `DA-934` 的 open dependent task 从已关闭的 `TK-936` 收紧为当前活动的 `TK-938|TK-940`，并把超出窗口的旧 artifact backlog 自动整理到 archive，避免 artifact registry 与 sprint activation truth 再次漂移。
