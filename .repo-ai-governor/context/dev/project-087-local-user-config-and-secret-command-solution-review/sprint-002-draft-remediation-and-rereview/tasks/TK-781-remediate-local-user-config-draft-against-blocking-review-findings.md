# TK-781 remediate local-user-config draft against blocking review findings

- Status: completed
- Date: 2026-04-11
- Owner: `AI-Agent`
- Priority: `P1`
- Project: `project-087-local-user-config-and-secret-command-solution-review`
- Sprint: `sprint-002-draft-remediation-and-rereview`

## 1. 任务目标

按上一轮 canonical technical-solution review 的两条 blocking finding 直接修订 draft，使其在 formal landing / lifecycle relationship 与 canonical onboarding truth 映射上形成可 promotion-ready 的明确方案。

## 2. Depends On

1. `TK-779`
2. `.repo-ai-governor/context/dev/project-087-local-user-config-and-secret-command-solution-review/sprint-001-draft-review-and-lifecycle-writeback/review/solution_review_local-user-config-and-secret-backed-command-configuration.md`

## 3. 预期产物

1. 修订后的 `.repo-ai-governor/draft/local-user-config-and-secret-backed-command-configuration-technical-solution.md`
2. 明确的 formal landing / companion-solution relationship
3. 明确的 `user-config -> enabled_tools[] / configured_remote_api / selected_*` 映射

## 4. Required Inputs

1. `.repo-ai-governor/draft/local-user-config-and-secret-backed-command-configuration-technical-solution.md`
2. `.repo-ai-governor/context/dev/project-087-local-user-config-and-secret-command-solution-review/sprint-001-draft-review-and-lifecycle-writeback/review/solution_review_local-user-config-and-secret-backed-command-configuration.md`
3. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-onboarding-contract.md`
4. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-projection-contract.md`
5. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/remote-api-transport-and-provider-binding-seam.md`
6. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/module-overview.md`

## 5. Traceback References

1. `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`
2. `.repo-ai-governor/context/dev/project-087-local-user-config-and-secret-command-solution-review/plan.md`

## 6. 实施计划

1. 把 formal landing 收敛到 `runtime.agent-projection` producer + `runtime.governance-clients` consumer 的 split ownership，并写清与 `technical-solution.api-key-remote-adapter-invocation` 的 companion relationship。
2. 把 `user-config` authoring path 明确改写为可机械映射到 `enabled_tools[] / configured_remote_api / AgentDescriptor.selected_*` 的形式。
3. 补齐 `workspace.mode_preference` 的 boundary，避免它被误读为 repo truth override。

## 7. Development Verification

1. docs/source cross-check：draft、review artifact、agent-onboarding contract、agent-projection contract、remote-api ADR、runtime-governance-clients overview

## 8. Delivery Verification

1. `node ./scripts/governance/sync-task-ledger.js --task-id TK-781 --tasks-dir ".repo-ai-governor/context/dev/project-087-local-user-config-and-secret-command-solution-review/sprint-002-draft-remediation-and-rereview/tasks" --result "Revised the draft to declare split module ownership and map user-config defaults into canonical onboarding/projection truth." --verify "docs/source cross-check: review artifact + onboarding/projection contracts + remote-api ADR + governance-clients overview" --review-delta "Prepared the draft for re-review-after-updates without changing runtime code or formal docs."`
2. docs-only remediation window：未修改 `apps/**`、`packages/**`、`bin/**`、`test/**`，因此 `pnpm run build` not required

## 9. 执行记录

1. 2026-04-11：任务创建，状态初始化为 `in_progress`，目标是按 `TK-779` 的两条 blocking finding 直接修订 draft。
2. 2026-04-11：已把 formal landing 收敛到 `runtime.agent-projection` producer + `runtime.governance-clients` consumer，并明确该方案是 `technical-solution.api-key-remote-adapter-invocation` 的 companion follow-up。
3. 2026-04-11：已把 user-config authoring path 改写为 `tools.<surface>.remoteApi.*` 并补齐它到 `enabled_tools[] / configured_remote_api / selected_*` 的 canonical truth mapping；任务完成。

## 10. 产出

1. `/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/draft/local-user-config-and-secret-backed-command-configuration-technical-solution.md`
