# DA-934 vscode workbench promotion and rollout decomposition handoff

- Status: active
- Date: 2026-04-16
- Owner: AI-Agent
- Task: `TK-934`
- Project: `project-111-vscode-workbench-solution-promotion-and-decomposition`
- Sprint: `sprint-001-promotion-and-rollout-handoff`

## 1. Summary

1. `technical-solution.vscode-full-governance-workbench-and-task-driven-orchestration` 已进入 `active` lifecycle-managed solution。
2. formal landing 已固定为 `runtime.governance-clients` 与 `runtime.orchestration` 的 shared overview 增量，加上三份唯一 final docs：VS Code workbench contract、primary-workbench ADR 与 aggregation facade contract。
3. rollout 已拆解为 `project-112-vscode-governance-workbench-rollout` 的三个 planned sprint。
4. 当前 active truth 只 formalize `VS Code primary workbench / CLI automation-headless substrate / desktop foundation-only secondary surface` 的正式方向，以及 evidence-gated support truth boundary；不宣称代码实现已在本窗口交付完成。

## 2. Immediate Activation Recommendation

1. 下一条真正建议激活的 implementation stream 固定为 `project-112 / sprint-001-phase-a-primary-workbench-baseline`。
2. 第一批必须优先冻结：
   - `vscode_governance_workbench` surface contract 的 service-owned truth boundary
   - `governance workbench aggregation facade` 的 task/review/workflow/automation/adoption query-command seam
   - task/review queue、workbench overview 与 typed DTO/backlink 的 producer-owned baseline
3. 在 `sprint-001` clean 收口前，不建议抢跑 typed CLI bridge 扩张、workflow studio cutover 或 support-truth 改口。

## 3. Outputs

1. `.repo-ai-governor/context/dev/project-112-vscode-governance-workbench-rollout/plan.md`
2. `.repo-ai-governor/context/dev/project-112-vscode-governance-workbench-rollout/sprint-001-phase-a-primary-workbench-baseline/plan.md`
3. `.repo-ai-governor/context/dev/project-112-vscode-governance-workbench-rollout/sprint-002-phase-b-outer-loop-consolidation-and-operations/plan.md`
4. `.repo-ai-governor/context/dev/project-112-vscode-governance-workbench-rollout/sprint-003-phase-c-workflow-studio-and-full-workbench-cutover/plan.md`
