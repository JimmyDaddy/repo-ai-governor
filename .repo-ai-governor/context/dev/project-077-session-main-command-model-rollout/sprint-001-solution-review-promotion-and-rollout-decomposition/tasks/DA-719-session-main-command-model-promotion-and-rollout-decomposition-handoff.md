# DA-719 session-main command-model promotion and rollout decomposition handoff

- Status: active
- Date: 2026-04-10
- Owner: AI-Agent
- Task: `TK-743`
- Project: `project-077-session-main-command-model-rollout`
- Sprint: `sprint-001-solution-review-promotion-and-rollout-decomposition`

## 1. Summary

1. `technical-solution.session-main-prompt-first-command-model` 已进入 `active` lifecycle-managed solution。
2. formal landing 已固定为 `runtime.orchestration` producer + `runtime.cli-interactive-shell` consumer amendments。
3. rollout 已拆解为 `project-077 / sprint-002 ~ sprint-005`，并立即激活 `sprint-002-capability-model-and-plan-workflow-cutover`。
4. public `/verify` 已在 formal truth 中删除；`run` 被保留但正式收窄到 reusable governed execution flow。

## 2. Immediate Activation Recommendation

1. 下一条真正激活的 implementation stream 固定为 `project-077 / sprint-002-capability-model-and-plan-workflow-cutover`。
2. 第一批必须优先冻结：
   - capability interaction model runtime truth
   - `/plan` AI fixed workflow 与 `/plan sync` deterministic bridge
   - natural-language planning routing cutover
3. 在 sprint-002 clean 收口前，不建议抢跑 `/verify` public removal 或 `run` scope narrowing。

## 3. Outputs

1. `.repo-ai-governor/context/dev/project-077-session-main-command-model-rollout/plan.md`
2. `.repo-ai-governor/context/dev/project-077-session-main-command-model-rollout/sprint-002-capability-model-and-plan-workflow-cutover/plan.md`
3. `.repo-ai-governor/context/dev/project-077-session-main-command-model-rollout/sprint-003-review-workflow-and-verify-removal/plan.md`
4. `.repo-ai-governor/context/dev/project-077-session-main-command-model-rollout/sprint-004-run-scope-resolution-and-routing-cutover/plan.md`
5. `.repo-ai-governor/context/dev/project-077-session-main-command-model-rollout/sprint-005-regression-migration-cleanup-and-project-closeout/plan.md`
