# DA-718 transport-selection-authority promotion and rollout decomposition handoff

- Status: active
- Date: 2026-04-09
- Owner: AI-Agent
- Task: `TK-725`
- Project: `project-075-transport-selection-authority-promotion-and-decomposition`
- Sprint: `sprint-001-promotion-and-followup-decomposition`

## 1. Summary

1. `technical-solution.transport-selection-authority-and-strict-routing` 已成为 active lifecycle-managed solution。
2. formal docs 已明确把 `transport` 视为 authoritative user selection，并禁止同一 surface 内的静默 transport failover。
3. 实现 follow-up 已拆解为 `project-076-transport-selection-authority-rollout`。
4. `docs/support-matrix*` 与 `docs/local-adoption-playbook*` 的 public wording uplift 仍受 evidence gate 约束，不在本轮 promotion 自动升级。

## 2. Immediate Activation Recommendation

1. 先激活 `sprint-001-contract-and-routing-truth-cutover`。
2. 第一批必须优先补 `enabled_tools[]` canonical truth、probe fail-closed 行为与 same-surface no-failover regression coverage。
3. 在 `sprint-003-evidence-gated-docs-and-adopter-truth` 之前，不建议抢跑 public docs wording uplift。

## 3. Outputs

1. `.repo-ai-governor/context/dev/project-076-transport-selection-authority-rollout/plan.md`
2. `.repo-ai-governor/context/dev/project-076-transport-selection-authority-rollout/sprint-001-contract-and-routing-truth-cutover/plan.md`
3. `.repo-ai-governor/context/dev/project-076-transport-selection-authority-rollout/sprint-002-connect-selection-ux-and-candidate-materialization/plan.md`
4. `.repo-ai-governor/context/dev/project-076-transport-selection-authority-rollout/sprint-003-evidence-gated-docs-and-adopter-truth/plan.md`
