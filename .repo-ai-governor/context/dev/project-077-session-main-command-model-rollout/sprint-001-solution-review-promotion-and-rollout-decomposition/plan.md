# sprint-001-solution-review-promotion-and-rollout-decomposition 计划

- Status: completed
- Date: 2026-04-10
- Project: `project-077-session-main-command-model-rollout`
- Sprint Goal: 完成 `technical-solution.session-main-prompt-first-command-model` 的 canonical review、formal promotion 与 rollout decomposition。
- Upstream:
  - `.repo-ai-governor/draft/session-main-prompt-first-command-mental-model-and-deterministic-workflow-split-technical-solution.md`
  - `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`
  - `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-orchestration/module-overview.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/module-overview.md`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements.md`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`

## 1. Scope

1. 建立 `project-077` 的 canonical governance surface，并冻结 solution id / target modules / delivery mode / rollout ownership。
2. 用 fresh reviewer sub-agent 执行 `technical-solution-review` 循环，直到该 draft 无 blocking finding。
3. 用 `technical-solution-promotion` 将 approved solution 正式落地，并同步 delivery handoff 与后续 rollout decomposition。

## 2. Task Package

1. `TK-741` activate project-077 and freeze review-promotion-decomposition scope
2. `TK-742` review session-main prompt-first command-model solution to approval readiness
3. `TK-743` promote solution and decompose rollout into project-077 implementation sprints

## 3. Exit Criteria

1. canonical review artifact `approved_solution_review_session-main-prompt-first-command-model.md` 已给出最终 clean 结论，并把 lifecycle 推进到 `approved`。
2. `runtime.orchestration` formal docs 已新增 command-model ADR 与 capability interaction model contract；`runtime.cli-interactive-shell` formal docs 已完成 consumer-facing amendments。
3. `project-077 / sprint-002 ~ sprint-005` 已实体化，且 delivery registry 固定为 `followup_required` 指向 `project-077 / sprint-002`。
4. `current-context.md` 在 sprint-001 收口后把 primary 切到 `project-077 / sprint-002`，同时保留 `project-076` 并行 active stream。

## 4. Sprint Notes

1. 本 sprint 默认不跑 `pnpm run build`；只有在同窗意外改到 `apps/**`、`packages/**`、`bin/**` 或 `test/**` 时才补跑 build/tsc。
2. 本 sprint 不创建 `CR-xxx`，因为主 review 产物是 technical-solution review artifact，而不是 code-review lifecycle。
3. `/verify` 的删除必须在 promotion 过程中同步 triad 与相关 architecture wording，不允许只删 capability surface 而不更新 product truth。
4. 2026-04-10：promotion、delivery handoff、lifecycle activation、`project-077 / sprint-002 ~ sprint-005` decomposition 与 primary stream 切换已完成；本 sprint 收口为 `completed`。
