# TK-630 定义 standards-guided reviewer handoff contract 与 adapter-neutral projection seam

- Status: completed
- Date: 2026-04-06
- Owner: `AI-Agent`
- Priority: `P1`
- Project: `project-057-standards-native-review-engine-productization`
- Sprint: `sprint-003-standards-guided-reviewer-handoff-and-source-aware-closure`

## 1. 任务目标

把当前“让 reviewer 去读 standards markdown”的软约定升级为结构化 handoff contract，并保证该 contract 能被 `runtime.agent-projection` 投影到不同 adapter surface。

## 2. Depends On

1. `TK-621`
2. `TK-629`

## 3. 预期产物

1. standards-guided reviewer request contract
2. reviewer output normalization 约束
3. adapter-neutral projection seam 说明

## 4. Required Inputs

1. `.codex/skills/workspace-scoped-cr-loop/references/reviewer-subagent-prompt-template.md`
2. `.codex/skills/workspace-scoped-cr-loop/SKILL.md`
3. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-orchestration/adrs/standards-native-review-engine-and-provenance-aware-cr.md`
4. `.repo-ai-governor/draft/scoped-delegated-cr-loop-productization-technical-solution.md`

## 5. Traceback References

1. `.repo-ai-governor/draft/standards-native-code-review-engine-follow-up-technical-solution.md`
2. `.repo-ai-governor/context/dev/project-057-standards-native-review-engine-productization/plan.md`

## 6. 实施计划

1. 定义 projected rules、deterministic findings、uncovered rule ids 与 review surface 的结构化 handoff request。
2. 约束 delegated reviewer 仅输出未覆盖规则对应的 findings 与显式 risk observations。
3. 明确 adapter renderer 仅负责 transport view，而不是 reviewer prompt 的事实源。

## 7. Development Verification

1. 检查 handoff contract 是否足以替代 raw markdown-only reviewer prompt。
2. 检查 contract 是否仍保持 adapter-neutral，不绑定 Codex 专有参数。

## 8. Delivery Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `pnpm run build`

## 9. 执行记录

1. 2026-04-06：任务创建，状态初始化为 `planned`。
2. 2026-04-07：`TK-647` 完成 sprint-002 closeout 后被激活为 `in_progress`，作为 `project-057 / sprint-003` 的首个执行边界。
3. 2026-04-07：已将 delegated reviewer handoff 明确为结构化 contract，并让 `workspace-scoped-cr-loop` 的 bootstrap/render prompt 输出把 markdown prompt 降级为 transport view；CLI `hybridReviewContext` 也开始保留结构化 delegated handoff 请求。

## 10. 产出

1. 已完成：standards-guided reviewer handoff contract
2. 已完成：adapter-neutral projection seam 说明
