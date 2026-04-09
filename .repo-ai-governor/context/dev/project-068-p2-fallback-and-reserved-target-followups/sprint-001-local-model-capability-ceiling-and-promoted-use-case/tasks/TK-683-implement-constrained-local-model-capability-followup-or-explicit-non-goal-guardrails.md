# TK-683 implement constrained local-model capability follow-up or explicit non-goal guardrails

- Status: completed
- Date: 2026-04-08
- Owner: `AI-Agent`
- Priority: `P2`
- Project: `project-068-p2-fallback-and-reserved-target-followups`
- Sprint: `sprint-001-local-model-capability-ceiling-and-promoted-use-case`

## 1. 任务目标

根据 `TK-682` 的判断，执行有限的 `local-model` capability follow-up，或用显式 non-goal guardrails 固定其支持边界。

## 2. Depends On

1. `TK-682`
2. 当前 local-model adapter baseline

## 3. 预期产物

1. constrained follow-up or explicit guardrails
2. reserved-target input
3. updated support narrative

## 4. Required Inputs

1. `.repo-ai-governor/context/dev/project-068-p2-fallback-and-reserved-target-followups/sprint-001-local-model-capability-ceiling-and-promoted-use-case/tasks/TK-682-freeze-local-model-capability-ceiling-and-promoted-use-case-contract.md`
2. `.repo-ai-governor/context/dev/project-053-real-adapter-invocation-productization/project-053-real-adapter-invocation-productization-completion-audit-summary.md`
3. `.repo-ai-governor/normative_knowledge_sources/product-requirements.md`

## 5. Traceback References

1. `.repo-ai-governor/draft/repo-ai-governor-current-surface-gap-guide-project-sprint-task-decomposition.md`
2. `.repo-ai-governor/context/dev/project-061-current-surface-gap-task-decomposition-draft/project-061-current-surface-gap-task-decomposition-draft-completion-audit-summary.md`

## 6. 实施计划

1. 落实 constrained local-model follow-up 或 non-goal guardrails。
2. 刷新 support narrative。
3. 为 `sprint-002` 的 reserved-target contract 准备输入。

## 7. Development Verification

1. local-model support verification
2. support narrative review

## 8. Delivery Verification

1. fallback support check
2. `pnpm run build`

## 9. 执行记录

1. 2026-04-08：任务创建，状态初始化为 `planned`。
2. 2026-04-08：已选择 explicit non-goal guardrail 路径，而不是扩张新的 `local-model` productization seam：当前 docs/support-truth 统一收口为 restricted-network / explicit local fallback only。
3. 2026-04-08：已在 `packages/adapters/local-model/README.md`、`docs/local-adoption-playbook*.md`、`docs/support-matrix*.md` 与 `docs/maintainer-validation-playbook*.md` 中同步写明非目标边界，不再允许把 `local-model` 误读成 repository-review reviewer delegation 或 `tool_calling` / `structured_output` / `confirmation_gate` required-role 的等价替代品。
4. 2026-04-08：已完成 guardrail truth review：当前 contract 已同时回链到 local-model adapter README、adopter support-truth、maintainer validation notes 与 support matrix；本轮未修改可执行代码，因此 build not required。
5. 2026-04-08：guardrail refresh 已完成；当前 sprint 下一边界进入 fresh reviewer CR loop，状态切换为 `completed`。

## 10. 产出

1. `/Users/jimmydaddy/study/ai-governor/packages/adapters/local-model/README.md`
2. `/Users/jimmydaddy/study/ai-governor/docs/local-adoption-playbook.md`
3. `/Users/jimmydaddy/study/ai-governor/docs/local-adoption-playbook.zh-CN.md`
4. `/Users/jimmydaddy/study/ai-governor/docs/support-matrix.md`
5. `/Users/jimmydaddy/study/ai-governor/docs/support-matrix.zh-CN.md`
6. `/Users/jimmydaddy/study/ai-governor/docs/maintainer-validation-playbook.md`
7. `/Users/jimmydaddy/study/ai-governor/docs/maintainer-validation-playbook.zh-CN.md`
