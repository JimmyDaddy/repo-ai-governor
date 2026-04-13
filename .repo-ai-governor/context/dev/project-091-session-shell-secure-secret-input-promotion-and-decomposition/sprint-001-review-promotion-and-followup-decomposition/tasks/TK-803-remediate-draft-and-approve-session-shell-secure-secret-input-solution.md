# TK-803 remediate draft and approve session-shell secure secret input solution

- Status: completed
- Date: 2026-04-12
- Owner: AI-Agent
- Priority: P0
- Project: `project-091-session-shell-secure-secret-input-promotion-and-decomposition`
- Sprint: `sprint-001-review-promotion-and-followup-decomposition`

## 1. 任务目标

修订 secure secret input draft，清除上一轮 blocking finding，并产出 clean approved review artifact 以推进 lifecycle 到 `approved`。

## 2. Depends On

1. `TK-802`
2. `.repo-ai-governor/context/dev/project-090-session-shell-secure-secret-input-solution-review/sprint-001-draft-review-and-lifecycle-writeback/review/solution_review_session-shell-secure-secret-input-and-redacted-command-handoff.md`

## 3. 预期产物

1. 更新后的 draft
2. approved review artifact
3. 更新后的 lifecycle registry

## 4. Required Inputs

1. `.repo-ai-governor/draft/session-shell-secure-secret-input-and-redacted-command-handoff-technical-solution.md`
2. `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`
3. `.repo-ai-governor/context/dev/project-090-session-shell-secure-secret-input-solution-review/sprint-001-draft-review-and-lifecycle-writeback/review/solution_review_session-shell-secure-secret-input-and-redacted-command-handoff.md`
4. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/contracts/cli-session-shell-contract.md`
5. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/local-user-config-and-secret-command-contract.md`

## 5. Traceback References

1. `.codex/skills/technical-solution-review/SKILL.md`
2. `.codex/skills/technical-solution-promotion/SKILL.md`

## 6. 实施计划

1. 把 draft 收敛为 Phase A-only formal scope，并移除 `entry.cli` 作为 target module truth。
2. 明确 secure route 的 pre-commit suffix interception 与 secure-capture transition。
3. 产出 clean approved review artifact，并将 lifecycle 同步推进到 `approved`。

## 7. Development Verification

1. review baseline refresh：draft + prior review artifact + affected formal docs

## 8. Delivery Verification

1. `node ./scripts/governance/check-technical-solution-lifecycle-registry.js`

## 9. 执行记录

1. 2026-04-12：任务创建并在同一窗口完成，按上一轮 2 条 blocker 直接修订 draft。
2. 2026-04-12：已明确 `/secret set <keyName>` 的 secure-capture transition、pre-commit suffix rejection、Phase-A-only scope 与 formal landing boundary。
3. 2026-04-12：approved review artifact 已确认无 blocking finding，lifecycle 已推进到 `approved`，`final_paths` 仍由后续 promotion 任务补写。

## 10. 产出

1. `/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/draft/session-shell-secure-secret-input-and-redacted-command-handoff-technical-solution.md`
2. `/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-091-session-shell-secure-secret-input-promotion-and-decomposition/sprint-001-review-promotion-and-followup-decomposition/review/approved_solution_review_session-shell-secure-secret-input-and-redacted-command-handoff.md`
3. `/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`
