# TK-481 promote layered adapter health check and route probe solution into runtime-agent-projection formal docs

- Status: completed
- Date: 2026-04-02
- Owner: AI-Agent
- Priority: P0
- Project: `project-036-runtime-durable-storage-and-registry-cutover`
- Sprint: `sprint-004-migration-verification-and-cutover-governance`

## 1. 任务目标

将 `layered-adapter-health-check-and-route-probe-technical-solution.md` 从 draft 提升为 lifecycle-managed formal solution，并将其正式并入 `runtime.agent-projection` 模块。

## 2. Depends On

1. `.repo-ai-governor/draft/layered-adapter-health-check-and-route-probe-technical-solution.md`
2. 用户在当前对话中对技术方案的显式批准
3. `TK-479` 中已经完成的 Phase A health-check 止血实现

## 3. 预期产物

1. 更新后的 `runtime.agent-projection` module overview
2. 新的 adapter health-check contract
3. 新的 layered route-probe ADR
4. 更新后的 lifecycle registry
5. 更新后的 delivery registry
6. 更新后的 module registry
7. 更新后的 loading manifest
8. `resolved_code_review_tk-481-layered-adapter-health-check-and-route-probe-promotion.md`
9. `DA-481`

## 4. 实施计划

1. 将 layered health-check / route-probe 方案作为新 formal solution 绑定到 `runtime.agent-projection`。
2. 为 install/auth/protocol/semantic/route-capability 统一建模，补齐 contract 与 ADR。
3. 以 `existing_stream` 模式将 delivery ownership 映射到当前 `project-036 / sprint-004`。
4. 基于 formal solution 继续拆分 Phase B/C/D 实施任务。
5. 运行 promotion 所需 governance gates。

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
2. 2026-04-02：状态切换为 `in_progress`，开始将 draft 正式并入 `runtime.agent-projection`，并同步 lifecycle/module-registry/manifest/delivery handoff。
3. 2026-04-02：已完成 formal docs promotion、review evidence、delivery ownership 与 follow-up task decomposition 收口，所需 lifecycle/delivery/module/manifest/triad/ledger/review/artifact gates 全部通过。
