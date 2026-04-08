# TK-682 freeze local-model capability ceiling and promoted use-case contract

- Status: completed
- Date: 2026-04-08
- Owner: `AI-Agent`
- Priority: `P2`
- Project: `project-068-p2-fallback-and-reserved-target-followups`
- Sprint: `sprint-001-local-model-capability-ceiling-and-promoted-use-case`

## 1. 任务目标

冻结 `local-model` capability ceiling 与 promoted use-case contract，明确它的保守支持边界。

## 2. Depends On

1. `project-066` recommended
2. `DA-696`

## 3. 预期产物

1. capability ceiling contract
2. promoted use-case statement
3. follow-up input

## 4. Required Inputs

1. `.repo-ai-governor/context/dev/project-053-real-adapter-invocation-productization/plan.md`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/current-surface-baseline-classification-and-followup-decomposition.md`
3. `.repo-ai-governor/context/dev/project-072-current-surface-priority-promotion-and-decomposition/sprint-001-promotion-and-formal-followup-decomposition/tasks/DA-696-current-surface-priority-promotion-and-followup-decomposition-handoff.md`

## 5. Traceback References

1. `.repo-ai-governor/draft/repo-ai-governor-current-app-feature-implementation-vs-baseline-priority-assessment.md`
2. `.repo-ai-governor/context/dev/project-053-real-adapter-invocation-productization/project-053-real-adapter-invocation-productization-completion-audit-summary.md`

## 6. 实施计划

1. 冻结 `local-model` capability ceiling。
2. 明确 promoted use case 与 non-goal。
3. 将后续 implementation/boundary work 交给 `TK-683`。

## 7. Development Verification

1. support-boundary review
2. use-case consistency review

## 8. Delivery Verification

1. local-model support-truth check
2. `pnpm run build`

## 9. 执行记录

1. 2026-04-08：任务创建，状态初始化为 `planned`。
2. 2026-04-08：`project-066` final closeout 完成后，本任务作为当前 primary stream 起点被激活，状态切换为 `in_progress`；接下来先冻结 `local-model` 的 promoted use case、capability ceiling 与 explicit non-goal contract。
3. 2026-04-08：已正式冻结 `local-model` 的 promoted use case：只面向 restricted-network 或 operator-selected local fallback、且 route requirement 保持 capability-compatible 纯文本基线的场景；它不是 promoted primary coder/reviewer lane。
4. 2026-04-08：当前 capability ceiling 已写死到公开 contract：`tool_calling`、`structured_output`、`confirmation_gate` 维持 unsupported，`parallel_task` / `streaming` / `cancellation` 维持 degraded；repository-review reviewer delegation 在只剩 `local-model` fallback 时继续保持 guard。
5. 2026-04-08：已完成 docs truth 对齐：`packages/adapters/local-model/README.md`、`docs/local-adoption-playbook*.md`、`docs/support-matrix*.md` 与 `docs/maintainer-validation-playbook*.md` 现在共用同一条 promoted use-case / capability ceiling contract；本轮未修改可执行代码，因此 build not required。
6. 2026-04-08：contract freeze 已完成；后续 explicit non-goal guardrail 与 support narrative refresh 已交给并由 `TK-683` 同窗吸收，当前 sprint 的 next boundary 是 fresh reviewer CR loop，状态切换为 `completed`。

## 10. 产出

1. `/Users/jimmydaddy/study/ai-governor/packages/adapters/local-model/README.md`
2. `/Users/jimmydaddy/study/ai-governor/docs/local-adoption-playbook.md`
3. `/Users/jimmydaddy/study/ai-governor/docs/local-adoption-playbook.zh-CN.md`
4. `/Users/jimmydaddy/study/ai-governor/docs/support-matrix.md`
5. `/Users/jimmydaddy/study/ai-governor/docs/support-matrix.zh-CN.md`
