# TK-493 align active invoke liveness formal solution with amended orchestration projection and diagnostics boundaries

- Status: completed
- Date: 2026-04-02
- Owner: AI-Agent
- Priority: P1
- Project: `project-037-agent-invoke-liveness-and-timeout-governance-rollout`
- Sprint: `sprint-001-shared-liveness-contract-and-codex-watchdog-baseline`

## 1. 任务目标

将已经处于 `active` 状态的 `technical-solution.agent-invoke-liveness-and-timeout-governance` formal docs 同步到最新 draft 中补充的两类约束：

1. invoke liveness 必须投影到 orchestration service execution summary / event stream。
2. `doctor/verify` 的 preflight diagnostics 与 invoke runtime diagnostics 必须显式分层。

## 2. Depends On

1. `.repo-ai-governor/draft/agent-invoke-liveness-and-timeout-governance-technical-solution.md`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-invoke-liveness-contract.md`
3. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/agent-invoke-liveness-and-timeout-governance.md`
4. `.repo-ai-governor/context/dev/project-036-runtime-durable-storage-and-registry-cutover/sprint-004-migration-verification-and-cutover-governance/tasks/DA-485-agent-invoke-liveness-and-timeout-governance-technical-solution-promotion.md`

## 3. 预期产物

1. 更新后的 active formal contract
2. 更新后的 active ADR
3. 与 amendment 范围一致的 sprint ledger 记录

## 4. 实施计划

1. 核对 lifecycle / delivery registry，确认该方案已完成 formal promotion，当前动作属于 active solution amendment 而不是首次 promotion。
2. 将 draft 中新增的 orchestration projection requirement 与 diagnostics boundary requirement 同步到 contract / ADR。
3. 仅在 formal docs 语义边界发生变化时同步 project-037 sprint ledger；不重开 lifecycle 状态，不登记新的 final path。

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

1. 2026-04-02：任务创建并直接执行；识别到该方案已在 lifecycle registry 中处于 `active`，因此本轮以 active formal solution amendment 处理。
2. 2026-04-02：已同步 formal contract 与 ADR，补充 orchestration service projection requirement 和 `doctor/verify` 与 runtime diagnostics 的职责分层。
3. 2026-04-02：已生成 `DA-493-active-invoke-liveness-formal-solution-amendment-alignment.md`，用于记录本次 active solution amendment 的范围与验证结果。
4. 2026-04-02：已通过 targeted governance checks：technical-solution lifecycle/delivery/module/manifest/docs-triad + task-ledger/sprint-status/code-review/artifact-lifecycle。
