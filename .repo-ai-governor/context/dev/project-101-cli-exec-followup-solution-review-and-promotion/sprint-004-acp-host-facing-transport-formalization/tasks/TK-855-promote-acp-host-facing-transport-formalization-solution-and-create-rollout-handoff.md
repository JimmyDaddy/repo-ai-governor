# TK-855 promote ACP host-facing transport formalization solution and create rollout handoff

- Status: completed
- Date: 2026-04-13
- Owner: AI-Agent
- Priority: P0
- Project: `project-101-cli-exec-followup-solution-review-and-promotion`
- Sprint: `sprint-004-acp-host-facing-transport-formalization`

## 1. 任务目标

将 `technical-solution.acp-host-facing-transport-formalization` 从 `approved` 推进到 `active`，并同步 formal docs、delivery handoff 与 `project-105` planned rollout skeleton。

## 2. Depends On

1. `TK-854`
2. `technical-solution.acp-host-facing-transport-formalization`

## 3. 预期产物

1. new ACP host-facing ADR
2. updated lifecycle / delivery / module registry / manifest
3. `project-105` planned follow-up skeleton
4. promotion handoff artifact

## 4. Required Inputs

1. `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`
2. `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`
3. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/technical-solution-module-registry.yaml`
4. `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
5. `.codex/skills/technical-solution-promotion/SKILL.md`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-101-cli-exec-followup-solution-review-and-promotion/sprint-004-acp-host-facing-transport-formalization/review/solution_review_acp-host-facing-transport-formalization.md`

## 6. 实施计划

1. 将 approved review 结论 materialize 到 shared overview / contract clarification 与新的 ACP host-facing ADR。
2. 更新 lifecycle / delivery / module-registry / manifest，并将 `final_paths` 固定到 ADR。
3. 创建 `project-105` planned rollout skeleton，写入 delivery handoff 与 `current-context -> Planned Follow-Up Streams`。

## 7. Development Verification

1. `node ./scripts/governance/check-technical-solution-lifecycle-registry.js`
2. `node ./scripts/governance/check-technical-solution-delivery-registry.js`
3. `node ./scripts/governance/check-technical-solution-module-graph.js`
4. `node ./scripts/governance/check-normative-loading-manifest.js --mode block`

## 8. Delivery Verification

1. `node ./scripts/governance/check-docs-triad-sync.js`
2. `node ./scripts/governance/check-task-ledger-sync.js`
3. `node ./scripts/governance/check-sprint-plan-status-sync.js`
4. `node ./scripts/governance/check-code-review-status-sync.js`
5. `node ./scripts/governance/check-artifact-registry-lifecycle.js`
6. `node ./scripts/governance/check-worktree-review-target.js`

## 9. 执行记录

1. 2026-04-13：任务创建，状态初始化为 `planned`。
2. 2026-04-13：`TK-854` approved 后切换为 `in_progress`，开始 materialize ACP host-facing ADR、shared docs clarification、delivery handoff 与 `project-105` planned rollout skeleton。
3. 2026-04-13：已完成 ACP host-facing ADR、lifecycle / delivery / module-registry / manifest、DA-855、resolved promotion review、artifact registration 与 `project-105` planned rollout handoff；promotion gates clean 后交接 `TK-856` final closeout。

## 10. 产出

1. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/acp-host-facing-transport-formalization-and-distribution-boundary.md`
2. `.repo-ai-governor/context/dev/project-101-cli-exec-followup-solution-review-and-promotion/sprint-004-acp-host-facing-transport-formalization/tasks/DA-855-acp-host-facing-transport-formalization-promotion-cutover.md`
3. `.repo-ai-governor/context/dev/project-101-cli-exec-followup-solution-review-and-promotion/sprint-004-acp-host-facing-transport-formalization/review/resolved_code_review_tk-855-acp-host-facing-transport-formalization-promotion-cutover.md`
4. `.repo-ai-governor/context/dev/project-105-acp-host-facing-transport-rollout/plan.md`
