# DA-1038 sprint-001 closeout and sprint-002 activation handoff

- Status: active
- Date: 2026-04-22
- Owner: AI-Agent
- Task: `TK-1038`
- Project: `project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout`
- Sprint: `sprint-001-direct-hitl-and-runtime-lanes-baseline`

## 1. Summary

1. `sprint-001-direct-hitl-and-runtime-lanes-baseline` 已完成 direct HITL cockpit / runtime-lane contract freeze、service-owned query seam implementation、VS Code runtime lanes + HITL cockpit baseline，以及 delegated CR loop clean 收口。
2. `CR-018` 作为 fresh clean recheck 未发现新的 actionable findings；当前只保留“未用 live pre-upgrade sidecar binary 实机覆盖旧 sidecar backward-compatibility”的 residual risk note。
3. `project-121` primary execution surface 已切换到 `sprint-002-workflow-authoring-draft-session-baseline`；该 sprint 现作为新的 primary stream 登记在 `current-context.md`，但 sprint plan 与 task aggregate 继续保持 `planned`，直到 `TK-1046` 真正开工。
4. `sprint-003-richer-graph-editing-and-support-truth-readiness` 继续保留为 planned follow-up，不与当前 sprint-002 execution window 交错执行；public/support truth 仍保持 fail-closed，不提前 uplift。

## 2. Handoff Boundary

1. `sprint-002` 必须直接消费 sprint-001 已冻结的 `queryRoleLaneStatus / querySessionContinuity / queryHitlDecisionPacket` service-owned seam 与 direct-workbench DTO baseline，不得回退到 extension-local runtime truth 或 CLI summary-only bridge。
2. sprint-002 的固定执行顺序保持为 `TK-1046 -> TK-1047 -> TK-1048 -> TK-1039 -> TK-1040`；只有在 workflow draft-session mutation/runtime、schema-first authoring 与 conflict-safe revision handling materialize 后，才允许进入 richer graph-editing 讨论。
3. closeout write-back 本身只修改 governance docs、ledger 与 execution context truth，因此 `TK-1038` 不单独要求新增 build evidence；但本 sprint 的代码边界已在 `CR-018` clean 收口前完成 `pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`、`pnpm run check:ide-entry-smoke` 与相应 governance gate 验证，且本地 boundary commit 仍需通过 `pnpm run check`。

## 3. Outputs

1. `.repo-ai-governor/context/current-context.md`
2. `.repo-ai-governor/context/completed-streams-history.md`
3. `.repo-ai-governor/context/dev/project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout/plan.md`
4. `.repo-ai-governor/context/dev/project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout/sprint-001-direct-hitl-and-runtime-lanes-baseline/plan.md`
5. `.repo-ai-governor/context/dev/project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout/sprint-001-direct-hitl-and-runtime-lanes-baseline/review/resolved_code_review_working-tree-20260422-1703.md`
6. `.repo-ai-governor/context/dev/project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout/sprint-002-workflow-authoring-draft-session-baseline/plan.md`
