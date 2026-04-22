# DA-1037 vscode direct workbench promotion and rollout decomposition handoff

- Status: active
- Date: 2026-04-22
- Owner: AI-Agent
- Task: `TK-1037`
- Project: `project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout`
- Sprint: `sprint-001-direct-hitl-and-runtime-lanes-baseline`

## 1. Summary

1. `technical-solution.vscode-direct-workbench-orchestration-runtime-hitl` 已从 `approved` 推进为 lifecycle-managed formal solution。
2. formal landing 已固定为：
   - `runtime.governance-clients` 的 overview 增量、`vscode-governance-workbench-surface` contract 增量与新的 direct-workbench ADR
   - `runtime.orchestration` 的 overview 增量、aggregation facade contract 增量与新的 direct-workbench runtime contract
3. implementation follow-up 已拆解为 `project-121` 的三个 planned sprint。
4. 当前 active truth 只 formalize direct authoring / runtime lanes / HITL cockpit 的 owner split、contract delta 与 follow-up queue；不宣称这些更强 surface 已在 public support truth 中完成。

## 2. Immediate Activation Recommendation

1. 下一条真正建议激活的 implementation stream 固定为 `project-121 / sprint-001-direct-hitl-and-runtime-lanes-baseline`。
2. 第一批必须优先冻结：
   - `queryHitlDecisionPacket / queryRoleLaneStatus / querySessionContinuity` 的 service-owned seam
   - `risk_facts[] + default_timeout_action + backlinks[]` 的 decision-packet contract
   - `Runtime Lanes` 与 `HITL Decision Cockpit` 的 projection-only boundary
3. 在 `sprint-001` clean 收口前，不建议抢跑 workflow draft-session authoring、richer graph editing 或更强 support-truth 改口。

## 3. Outputs

1. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/vscode-direct-workbench-authoring-runtime-lanes-and-hitl-decision-cockpit.md`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-orchestration/contracts/direct-workbench-orchestration-runtime-hitl-contract.md`
3. `.repo-ai-governor/context/dev/project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout/plan.md`
4. `.repo-ai-governor/context/dev/project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout/sprint-001-direct-hitl-and-runtime-lanes-baseline/plan.md`
5. `.repo-ai-governor/context/dev/project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout/sprint-002-workflow-authoring-draft-session-baseline/plan.md`
6. `.repo-ai-governor/context/dev/project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout/sprint-003-richer-graph-editing-and-support-truth-readiness/plan.md`
