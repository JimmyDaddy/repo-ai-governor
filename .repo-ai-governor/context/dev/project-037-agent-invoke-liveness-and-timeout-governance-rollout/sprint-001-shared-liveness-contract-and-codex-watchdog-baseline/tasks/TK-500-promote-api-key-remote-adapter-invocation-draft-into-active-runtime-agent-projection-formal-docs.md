# TK-500 promote api-key remote adapter invocation draft into active runtime-agent-projection formal docs

- Status: completed
- Date: 2026-04-02
- Owner: AI-Agent
- Priority: P1
- Project: `project-037-agent-invoke-liveness-and-timeout-governance-rollout`
- Sprint: `sprint-001-shared-liveness-contract-and-codex-watchdog-baseline`

## 1. 任务目标

将 `.repo-ai-governor/draft/api-key-remote-adapter-invocation-technical-solution.md` 正式提升为 active technical solution `technical-solution.api-key-remote-adapter-invocation`，并把其 contract delta、provider binding seam、delivery handoff、review artifact 与 follow-up rollout 责任完整落到 `runtime.agent-projection` 正式治理面。

## 2. Depends On

1. `TK-492`
2. `.repo-ai-governor/draft/api-key-remote-adapter-invocation-technical-solution.md`
3. `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`
4. `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`
5. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/technical-solution-module-registry.yaml`
6. `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
7. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/module-overview.md`
8. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-onboarding-contract.md`
9. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-projection-contract.md`
10. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/adapter-health-and-route-probe-contract.md`
11. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-invoke-liveness-contract.md`

## 3. 预期产物

1. active lifecycle entry with `final_paths`
2. updated delivery handoff entry with real follow-up task ownership
3. updated `runtime.agent-projection` formal docs and new remote-api ADR
4. promotion review artifact and handoff artifact
5. planned sprint-002 follow-up task for rollout / delivery verification

## 4. 实施计划

1. 将 draft 中被接受的 `remote_api` transport、provider binding seam、contract delta 与 secret boundary 写入 `runtime.agent-projection` formal docs。
2. 在 lifecycle registry 中把 `technical-solution.api-key-remote-adapter-invocation` 从 `review_pending` 切到 `active`，写入 review evidence 与 `final_paths`。
3. 在 delivery registry 中登记 `followup_required` handoff，并为 planned `sprint-002` 补齐真实承接任务。
4. 生成 resolved promotion review、DA-500 与 task ledger 记录，保证 formal cutover 可回溯。
5. 运行 promotion 所需治理 gate；本窗口为 docs-only，不宣称代码实现已完成。

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

1. 2026-04-02：用户在当前对话中明确同意继续提升该方案，可作为本轮 `promote-approved-solution` 的审批前提。
2. 2026-04-02：已将 `runtime.agent-projection` module overview、onboarding/projection/probe/liveness contracts 同步到 transport-aware / provider-binding-aware 正式语义。
3. 2026-04-02：已新增 `remote-api-transport-and-provider-binding-seam.md` ADR，并同步 module registry / normative-loading-manifest。
4. 2026-04-02：已将 `technical-solution.api-key-remote-adapter-invocation` lifecycle 状态切为 `active`，并补齐 `final_paths`、promotion review path 与 approval metadata。
5. 2026-04-02：已在 delivery registry 中登记 `followup_required` handoff，并在 planned `sprint-002` 中补充 `TK-501` 作为 runtime rollout / delivery verification 承接任务。
6. 2026-04-02：已生成 `resolved_code_review_tk-500-api-key-remote-adapter-invocation-promotion-cutover.md` 与 `DA-500-api-key-remote-adapter-invocation-technical-solution-promotion.md`。
7. 2026-04-02：已通过 `/opt/homebrew/bin/node ./scripts/governance/check-technical-solution-lifecycle-registry.js`。
8. 2026-04-02：已通过 `/opt/homebrew/bin/node ./scripts/governance/check-technical-solution-delivery-registry.js`。
9. 2026-04-02：已通过 `/opt/homebrew/bin/node ./scripts/governance/check-technical-solution-module-graph.js`。
10. 2026-04-02：已通过 `/opt/homebrew/bin/node ./scripts/governance/check-normative-loading-manifest.js --mode block`。
11. 2026-04-02：已通过 `/opt/homebrew/bin/node ./scripts/governance/check-docs-triad-sync.js`。
12. 2026-04-02：已通过 `/opt/homebrew/bin/node ./scripts/governance/check-task-ledger-sync.js`。
13. 2026-04-02：已通过 `/opt/homebrew/bin/node ./scripts/governance/check-sprint-plan-status-sync.js`。
14. 2026-04-02：已通过 `/opt/homebrew/bin/node ./scripts/governance/check-code-review-status-sync.js`。
15. 2026-04-02：已通过 `/opt/homebrew/bin/node ./scripts/governance/check-artifact-registry-lifecycle.js`。
16. 2026-04-02：本窗口仅修改 formal docs / registries / review / task ledger / artifact registry，未修改可执行代码，因此 `pnpm run build` not required。
