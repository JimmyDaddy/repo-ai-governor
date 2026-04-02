# TK-494 promote session-main capability explainer and contextual guidance draft into active interactive-cli formal docs

- Status: completed
- Date: 2026-04-02
- Owner: AI-Agent
- Priority: P1
- Project: `project-037-agent-invoke-liveness-and-timeout-governance-rollout`
- Sprint: `sprint-001-shared-liveness-contract-and-codex-watchdog-baseline`

## 1. 任务目标

将 `.repo-ai-governor/draft/session-main-capability-explainer-and-contextual-command-guidance-technical-solution.md` 以 amendment 方式正式并入现有 active solution `technical-solution.interactive-cli-react-style-cli`，补齐 capability explainer、governed capability catalog、i18n seed/view 分层、shared-session capability metadata 投影，以及 governed capability 与 shell-local builtins 的边界。

## 2. Depends On

1. `.repo-ai-governor/draft/session-main-capability-explainer-and-contextual-command-guidance-technical-solution.md`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/module-overview.md`
3. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/contracts/cli-session-shell-contract.md`
4. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-orchestration/module-overview.md`
5. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-orchestration/adrs/session-main-supervisor-and-role-subagent-collaboration.md`
6. `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`
7. `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`

## 3. 预期产物

1. 更新后的 interactive-shell module overview / session shell contract
2. 更新后的 orchestration module overview / supervisor ADR
3. interactive-cli active solution 的 lifecycle version bump 与 review evidence
4. 对应 promotion review / DA / task-ledger / artifact registry 记录

## 4. 实施计划

1. 以 active solution amendment 方式处理，不将该 draft 升格为新的并列 active solution id。
2. 将 capability explainer 正式落到 `runtime.orchestration` 的 taxonomy、catalog ownership、shared-session metadata 与 execution bridge 边界。
3. 将 CLI shell 的 capability metadata、suggested-action affordance、builtin-vs-governed boundary 写入 `runtime.cli-interactive-shell` formal contract。
4. 同步 lifecycle/delivery/task/review/artifact 证据，保持 promotion 审计链完整。

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

## 6. 执行记录

1. 2026-04-02：任务创建并直接执行；确认该 draft 的最合理正式归宿是并入现有 active solution `technical-solution.interactive-cli-react-style-cli`，而不是新建并列 active solution。
2. 2026-04-02：已同步 `runtime.cli-interactive-shell` 与 `runtime.orchestration` formal docs，补齐 capability explanation taxonomy、catalog ownership、i18n seed/view 分层、shared-session capability metadata，以及 governed capability / shell-local builtin 边界。
3. 2026-04-02：已生成 `resolved_code_review_tk-494-session-main-capability-explainer-and-contextual-guidance-promotion-cutover.md` 与 `DA-494-session-main-capability-explainer-and-contextual-guidance-promotion-cutover.md`。
4. 2026-04-02：已同步 lifecycle version bump、delivery rollout evidence、project-037 sprint ledger 与 artifact registry。
