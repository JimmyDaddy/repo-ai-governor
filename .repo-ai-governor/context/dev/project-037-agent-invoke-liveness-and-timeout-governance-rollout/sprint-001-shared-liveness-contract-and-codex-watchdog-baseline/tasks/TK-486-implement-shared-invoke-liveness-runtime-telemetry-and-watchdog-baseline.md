# TK-486 implement shared invoke liveness runtime telemetry and watchdog baseline

- Status: planned
- Date: 2026-04-02
- Owner: AI-Agent
- Priority: P0
- Project: `project-037-agent-invoke-liveness-and-timeout-governance-rollout`
- Sprint: `sprint-001-shared-liveness-contract-and-codex-watchdog-baseline`

## 1. 任务目标

在 `packages/adapter-sdk`、shared runtime 与主调用链上建立统一的 invoke-liveness state machine、reason code、timeout budget 与 telemetry hook baseline。

## 2. Depends On

1. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-invoke-liveness-contract.md`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/agent-invoke-liveness-and-timeout-governance.md`
3. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/adapter-health-and-route-probe-contract.md`

## 3. 预期产物

1. shared invoke-liveness runtime baseline
2. 稳定状态机与 reason code 常量
3. role / route / surface timeout budget 基线
4. transport activity / semantic progress / terminal completion telemetry hook
5. adapter / CLI consumer 可复用的 typed projection seam

## 4. 实施计划

1. 在 `adapter-sdk` 中定义 shared invoke-liveness runtime、状态机、budget model 与 stable reason code。
2. 为 child-process / stream / event 驱动 adapter 提供统一的 signal update API。
3. 将 system heartbeat 与真实 transport / semantic 事件显式分层，避免 presenter-local 文案继续误判续命。
4. 为 `session.main` / diagnostics / shell consumer 提供最小可消费快照结构。

## 5. 验证

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `pnpm run build`
4. `adapter-sdk + shared runtime + session.main runtime` 相关定向测试集合

## 6. 执行记录

1. 2026-04-02：任务创建，状态初始化为 `planned`。
