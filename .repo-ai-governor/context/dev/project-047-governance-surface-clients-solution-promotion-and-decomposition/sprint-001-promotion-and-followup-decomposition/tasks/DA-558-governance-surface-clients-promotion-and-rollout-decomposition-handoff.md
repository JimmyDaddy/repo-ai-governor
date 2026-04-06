# DA-558 governance surface clients promotion and rollout decomposition handoff

- Status: active
- Date: 2026-04-05
- Owner: AI-Agent
- Task: `TK-558`
- Project: `project-047-governance-surface-clients-solution-promotion-and-decomposition`
- Sprint: `sprint-001-promotion-and-followup-decomposition`

## 1. Summary

1. `technical-solution.governance-surface-clients` 已成为 active lifecycle-managed solution。
2. 实现 follow-up 已拆解为 `project-048-governance-surface-clients-rollout`。
3. rollout 顺序正式冻结为：
   - sprint-001：shared core + actionable desktop console baseline
   - sprint-002：VS Code editor companion MVP
   - sprint-003：desktop governance evidence surface
   - sprint-004：automation queue + multi-workspace governance

## 2. Immediate Activation Recommendation

1. 先激活 `sprint-001-shared-core-and-actionable-console-baseline`。
2. 第一批必须优先补 command seam：
   - `submitHitlDecision`
   - `recoverExecution`
   - `getExecution`
   - `terminateExecution`
   - handoff contract
3. 在 `sprint-001` 未收口前，不建议抢跑 `VS Code` 插件或 automation queue。

## 3. Outputs

1. `.repo-ai-governor/context/dev/project-048-governance-surface-clients-rollout/plan.md`
2. `.repo-ai-governor/context/dev/project-048-governance-surface-clients-rollout/sprint-001-shared-core-and-actionable-console-baseline/plan.md`
3. `.repo-ai-governor/context/dev/project-048-governance-surface-clients-rollout/sprint-002-vscode-editor-companion-mvp/plan.md`
4. `.repo-ai-governor/context/dev/project-048-governance-surface-clients-rollout/sprint-003-desktop-governance-evidence-surface/plan.md`
5. `.repo-ai-governor/context/dev/project-048-governance-surface-clients-rollout/sprint-004-automation-queue-and-multi-workspace-governance/plan.md`
