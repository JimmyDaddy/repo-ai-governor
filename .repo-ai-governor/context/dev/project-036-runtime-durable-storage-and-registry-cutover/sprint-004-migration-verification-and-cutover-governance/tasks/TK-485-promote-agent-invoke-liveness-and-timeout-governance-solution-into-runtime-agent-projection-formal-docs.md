# TK-485 promote agent invoke liveness and timeout governance solution into runtime-agent-projection formal docs

- Status: completed
- Date: 2026-04-02
- Owner: AI-Agent
- Priority: P0
- Project: `project-036-runtime-durable-storage-and-registry-cutover`
- Sprint: `sprint-004-migration-verification-and-cutover-governance`

## 1. 任务目标

将 `agent-invoke-liveness-and-timeout-governance-technical-solution.md` 从 draft 提升为 lifecycle-managed formal solution，并正式并入 `runtime.agent-projection` 模块。

## 2. Depends On

1. `.repo-ai-governor/draft/agent-invoke-liveness-and-timeout-governance-technical-solution.md`
2. 用户在当前对话中对技术方案的显式批准
3. `technical-solution.layered-adapter-health-check-and-route-probe` 已完成的 formal module baseline

## 3. 预期产物

1. 更新后的 `runtime.agent-projection` module overview
2. 新的 agent invoke liveness contract
3. 新的 timeout/liveness governance ADR
4. 更新后的 lifecycle registry
5. 更新后的 delivery registry
6. 更新后的 module registry
7. 更新后的 loading manifest
8. `resolved_code_review_tk-485-agent-invoke-liveness-and-timeout-governance-promotion.md`
9. `DA-485`

## 4. 实施计划

1. 将 invoke liveness / timeout governance 方案作为新的 formal solution 绑定到 `runtime.agent-projection`。
2. 为 process liveness、transport activity、semantic progress、graceful interrupt 与 hard-timeout fuse 统一建模，补齐 contract 与 ADR。
3. 采用 `followup_required` handoff，将后续实现责任显式留在当前 `project-036 / sprint-004` closeout surface。
4. 运行 promotion 所需 governance gates。

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

1. 2026-04-02：任务创建，状态初始化为 `planned`。
2. 2026-04-02：状态切换为 `in_progress`，开始将 invoke liveness / timeout governance draft 正式并入 `runtime.agent-projection`，并同步 lifecycle/module-registry/manifest/delivery handoff。
3. 2026-04-02：已完成 formal docs promotion、review evidence 与 follow-up delivery ownership 收口，所需 lifecycle/delivery/module/manifest/triad/ledger/review/artifact gates 全部通过。
