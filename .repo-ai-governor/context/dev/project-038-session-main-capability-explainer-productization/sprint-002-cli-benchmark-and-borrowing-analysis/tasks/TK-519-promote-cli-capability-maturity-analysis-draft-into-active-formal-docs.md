# TK-519 promote cli capability maturity analysis draft into active formal docs

- Status: completed
- Date: 2026-04-04
- Owner: AI-Agent
- Priority: P1
- Project: `project-038-session-main-capability-explainer-productization`
- Sprint: `sprint-002-cli-benchmark-and-borrowing-analysis`

## 1. 任务目标

将 `.repo-ai-governor/draft/cli-capability-maturity-and-baseline-enhancement-priority-analysis.md` 正式提升为 active technical solution `technical-solution.cli-capability-maturity-and-baseline-enhancement-priority`，并把其 CLI command maturity layering、ROI / strategic priority 双视角，以及 `plan / review / review-verify / upgrade` 的 linked follow-up contract policy 一次性落到正式治理面。

## 2. Depends On

1. `.repo-ai-governor/draft/cli-capability-maturity-and-baseline-enhancement-priority-analysis.md`
2. `.repo-ai-governor/draft/session-main-plan-generation-and-ledger-commit-contract.md`
3. `.repo-ai-governor/draft/session-main-review-generation-verification-and-ledger-backfill-contract.md`
4. `.repo-ai-governor/draft/upgrade-analysis-apply-and-rollback-contract.md`
5. `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`
6. `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`
7. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/technical-solution-module-registry.yaml`
8. `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
9. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/module-overview.md`

## 3. 预期产物

1. active lifecycle entry with `final_paths`
2. docs-only delivery handoff entry
3. updated `runtime.cli-interactive-shell` module overview
4. new runtime CLI command maturity ADR
5. promotion review artifact and handoff artifact

## 4. 实施计划

1. 将 draft 中被接受的 maturity layering、双排序逻辑与 thin-baseline command linked-input policy 写入 formal ADR。
2. 在 lifecycle registry 中登记独立 active solution `technical-solution.cli-capability-maturity-and-baseline-enhancement-priority`，写入 review evidence 与 `final_paths`。
3. 在 delivery registry 中登记 `docs_only` handoff，明确本轮只 formalize planning lens，不宣称命令实现已完成。
4. 同步 `runtime.cli-interactive-shell` module overview、module registry 与 normative loading manifest，确保新 ADR 成为正式 active doc。
5. 生成 resolved promotion review、`DA-519` 与 task ledger 记录，保证 formal cutover 可回溯。

## 5. 验证

1. `node ./scripts/governance/check-technical-solution-lifecycle-registry.js`
2. `node ./scripts/governance/check-technical-solution-delivery-registry.js`
3. `node ./scripts/governance/check-technical-solution-module-graph.js`
4. `node ./scripts/governance/check-normative-loading-manifest.js --mode block`
5. `node ./scripts/governance/check-docs-triad-sync.js`
6. `node ./scripts/governance/check-task-ledger-sync.js`
7. `node ./scripts/governance/check-sprint-plan-status-sync.js`
8. `node ./scripts/governance/check-code-review-status-sync.js`
9. `node ./scripts/governance/check-artifact-registry-lifecycle.js`
10. docs-only formal promotion；未修改 `apps/**`、`packages/**`、`bin/**`、`test/**`，因此 `pnpm run build` not required

## 6. 执行记录

1. 2026-04-04：用户在当前对话中明确要求“然后提升 `.repo-ai-governor/draft/cli-capability-maturity-and-baseline-enhancement-priority-analysis.md` 这个技术方案”，可作为本轮 formal cutover 的审批前提。
2. 2026-04-04：已确认 `review / review-verify` 与 `upgrade` companion contract draft 与成熟度分析文保持双向挂链，因此无需额外补写重复关联。
3. 2026-04-04：已新增 `cli-command-capability-maturity-and-baseline-enhancement-priority.md` ADR，并同步 `runtime.cli-interactive-shell` module overview / module registry / normative-loading-manifest。
4. 2026-04-04：已将 `technical-solution.cli-capability-maturity-and-baseline-enhancement-priority` lifecycle 状态切为 `active`，并补齐 `final_paths`、promotion review path 与 approval metadata。
5. 2026-04-04：已在 delivery registry 中登记 `docs_only` handoff，并生成 `DA-519-cli-capability-maturity-analysis-promotion-cutover.md`。
6. 2026-04-04：promotion gates 已全部通过，包括 lifecycle / delivery / module graph / manifest / docs triad / task ledger / sprint plan / code review / artifact lifecycle；本轮仍为 docs-only formal cutover，因此 `pnpm run build` not required。
