# TK-529 decompose cli borrowed capabilities draft into planned implementation rollout project and sprint packages

- Status: completed
- Date: 2026-04-04
- Owner: AI-Agent
- Priority: P1
- Project: `project-038-session-main-capability-explainer-productization`
- Sprint: `sprint-004-cli-borrowed-capabilities-rollout-decomposition`

## 1. 任务目标

把 `.repo-ai-governor/draft/cli-borrowed-capabilities-productization-technical-solution.md` 继续拆成一套可直接激活的 implementation project / sprint / task package，使后续不必再从技术方案草案重新人工整理执行结构。

## 2. Depends On

1. `.repo-ai-governor/draft/cli-borrowed-capabilities-productization-technical-solution.md`
2. `.repo-ai-governor/context/dev/project-038-session-main-capability-explainer-productization/plan.md`
3. `.repo-ai-governor/context/current-context.md`
4. `.repo-ai-governor/normative_knowledge_sources/governance/decomposition-protocol-template.md`

## 3. 预期产物

1. 一个新的 planned implementation project
2. 三条实体 sprint 计划与对应 task package
3. `current-context.md` 中的 planned follow-up stream 登记

## 4. Required Inputs

1. `.repo-ai-governor/draft/cli-borrowed-capabilities-productization-technical-solution.md`
2. `.repo-ai-governor/context/dev/project-038-session-main-capability-explainer-productization/plan.md`
3. `.repo-ai-governor/context/current-context.md`
4. `.repo-ai-governor/normative_knowledge_sources/governance/decomposition-protocol-template.md`

## 5. Traceback References

1. `.repo-ai-governor/draft/cli-borrowing-analysis-against-claude-code-and-codex.md`
2. `.repo-ai-governor/context/dev/project-038-session-main-capability-explainer-productization/sprint-003-cli-borrowed-capabilities-technical-solution-drafting/plan.md`
3. `.repo-ai-governor/context/dev/project-038-session-main-capability-explainer-productization/sprint-003-cli-borrowed-capabilities-technical-solution-drafting/tasks/TK-520-convert-cli-borrowing-analysis-into-feasible-technical-solution-draft.md`

## 6. 实施计划

1. 基于技术方案草案收敛出 implementation project 的阶段边界。
2. 将 phased rollout 重写成实体 `project/sprint/TK` 计划结构。
3. 把 planned stream 同步到 `current-context.md`，并回链到 `project-038`。

## 7. Development Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. docs-only decomposition；当前阶段未修改 `apps/**`、`packages/**`、`bin/**`、`test/**`

## 8. Delivery Verification

1. 当前拆解窗口需通过 `node ./scripts/governance/check-task-ledger-sync.js`
2. 当前拆解窗口需通过 `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. 当前拆解窗口需通过 `node ./scripts/governance/check-worktree-review-target.js`

## 9. 执行记录

1. 2026-04-04：任务创建，状态初始化为 `planned`；范围限定为 docs-only decomposition，不引入新的 runtime 或 CLI 行为变更。
2. 2026-04-04：已新增 planned `project-043-cli-session-shell-productization-rollout`，并完成 `sprint-001 ~ sprint-003` 与 `TK-530 ~ TK-538` 的实体拆解。

## 10. 产出

1. `.repo-ai-governor/context/dev/project-043-cli-session-shell-productization-rollout/plan.md`
2. `.repo-ai-governor/context/dev/project-043-cli-session-shell-productization-rollout/sprint-001-session-lifecycle-and-read-model-foundation/plan.md`
3. `.repo-ai-governor/context/dev/project-043-cli-session-shell-productization-rollout/sprint-002-adaptive-interaction-runtime-and-discoverability/plan.md`
4. `.repo-ai-governor/context/dev/project-043-cli-session-shell-productization-rollout/sprint-003-session-note-and-startup-budget/plan.md`
