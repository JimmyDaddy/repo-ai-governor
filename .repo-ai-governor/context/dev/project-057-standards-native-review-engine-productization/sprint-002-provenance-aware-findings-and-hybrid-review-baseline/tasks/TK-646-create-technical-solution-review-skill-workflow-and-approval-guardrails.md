# TK-646 创建 technical-solution-review skill workflow 与 approval guardrails

- Status: completed
- Date: 2026-04-07
- Owner: `AI-Agent`
- Priority: `P1`
- Project: `project-057-standards-native-review-engine-productization`
- Sprint: `sprint-002-provenance-aware-findings-and-hybrid-review-baseline`

## 1. 任务目标

创建 repo-local `technical-solution-review` workflow，使仓库内技术方案在进入 promotion 前能够通过统一的 `draft -> review_pending -> approved` 评审闭环，并与 `technical-solution-promotion` 保持清晰衔接。

## 2. Depends On

1. `technical-solution.lifecycle-and-promotion-governance`
2. `.codex/skills/technical-solution-promotion/SKILL.md`

## 3. 预期产物

1. `.codex/skills/technical-solution-review/SKILL.md`
2. `.codex/skills/technical-solution-review/agents/openai.yaml`
3. `AGENTS.md`

## 4. Required Inputs

1. `.codex/skills/workspace-scoped-cr-loop/SKILL.md`
2. `.codex/skills/technical-solution-promotion/SKILL.md`
3. `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`
4. `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
5. `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-057-standards-native-review-engine-productization/plan.md`
2. `.repo-ai-governor/context/dev/project-017-technical-solution-modularization/sprint-004-skillized-promotion-workflow/tasks/TK-195-technical-solution-promotion-skill-workflow-and-trigger-mapping.md`

## 6. 实施计划

1. 参考 `workspace-scoped-cr-loop` 的 phase-based workflow，抽取适用于技术方案评审的 resolve / review / approve / handoff 骨架。
2. 创建 `technical-solution-review` skill，明确 trigger mapping、required inputs、review artifact contract、lifecycle state write-back 与 promotion handoff。
3. 更新 `AGENTS.md` 与 active sprint plan，使新流程成为可发现、可追踪的仓库级 workflow 入口。

## 7. Development Verification

1. 校对 skill frontmatter、trigger mapping 与生命周期状态是否覆盖 `prepare-review`、`review-draft-solution`、`re-review-after-updates`、`approve-reviewed-solution`。
2. 校对 `agents/openai.yaml` 与 `AGENTS.md` 是否都已暴露新 skill 的入口与用途。

## 8. Delivery Verification

1. `python3 /Users/jimmydaddy/.codex/skills/.system/skill-creator/scripts/quick_validate.py .codex/skills/technical-solution-review`
2. `node ./scripts/governance/check-task-ledger-sync.js`
3. `node ./scripts/governance/check-sprint-plan-status-sync.js`
4. `node ./scripts/governance/check-code-review-status-sync.js`

## 9. 执行记录

1. 2026-04-07：任务创建，状态初始化为 `planned`。
2. 2026-04-07：已在 `.codex/skills/technical-solution-review/` 初始化新的 repo-local skill 骨架，并默认落在仓库本地 `.codex/skills` 而非 `$CODEX_HOME/skills`。
3. 2026-04-07：已完成 `technical-solution-review` workflow，覆盖 scope resolve、review loop、approval handoff、promotion interlock、review artifact contract 与 lifecycle guardrails。
4. 2026-04-07：已同步 `AGENTS.md`、active sprint plan 与 task ledger，并通过 skill 校验与相关 ledger/status 检查。

## 10. 产出

1. `.codex/skills/technical-solution-review/SKILL.md` 已定义方案 review phases、artifact lifecycle、guardrails、verification 与 portable prompt。
2. `.codex/skills/technical-solution-review/agents/openai.yaml` 已提供 display name、short description 与默认调用提示。
3. `AGENTS.md` 已补充 repo-local skill 入口，使技术方案评审流程与 promotion workflow 形成清晰分工。
