# TK-520 freeze upgrade controlled apply state machine and artifact contracts baseline

- Status: completed
- Date: 2026-04-04
- Owner: AI-Agent
- Priority: P0
- Project: `project-042-cli-command-thin-baseline-enhancement-rollout`
- Sprint: `sprint-001-upgrade-controlled-apply-and-rollback`

## 1. 任务目标

冻结 `upgrade` 的 preview/confirm/apply/verify/rollback 状态机、artifact 命名与集中常量治理边界，使后续实现不再在 `apps/cli`、`packages/config` 与 presenter 层各自演化独立语义。

## 2. Depends On

1. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/adrs/cli-command-capability-maturity-and-baseline-enhancement-priority.md`
2. `.repo-ai-governor/draft/upgrade-analysis-apply-and-rollback-contract.md`
3. `apps/cli/src/commands/upgrade-command.ts`
4. `packages/config/src/upgrade-schema-diff-service.ts`

## 3. 预期产物

1. `upgrade` apply/rollback 有限集合与 artifact contract 对齐方案
2. confirmation / apply readiness / apply status 的集中常量落点
3. 后续 `TK-521 / TK-522` 的实现边界冻结

## 4. Required Inputs

1. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/adrs/cli-command-capability-maturity-and-baseline-enhancement-priority.md`
2. `.repo-ai-governor/draft/upgrade-analysis-apply-and-rollback-contract.md`
3. `apps/cli/src/commands/upgrade-command.ts`
4. `packages/config/src/upgrade-schema-diff-service.ts`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-038-session-main-capability-explainer-productization/sprint-002-cli-benchmark-and-borrowing-analysis/tasks/DA-519-cli-capability-maturity-analysis-promotion-cutover.md`
2. `.repo-ai-governor/context/dev/project-042-cli-command-thin-baseline-enhancement-rollout/plan.md`
3. `.repo-ai-governor/context/dev/project-042-cli-command-thin-baseline-enhancement-rollout/sprint-001-upgrade-controlled-apply-and-rollback/plan.md`

## 6. 实施计划

1. 盘点当前 `upgrade` analyze path 与 companion contract 的差异。
2. 冻结 preview/apply/rollback receipt 所需的状态机与 artifact 边界。
3. 明确 enum/constant / i18n 在 `upgrade` 实现中的单写源位置。

## 7. Development Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. docs-only decomposition；当前阶段未修改 `apps/**`、`packages/**`、`bin/**`、`test/**`

## 8. Delivery Verification

1. 当前拆解窗口需通过 `node ./scripts/governance/check-task-ledger-sync.js`
2. 当前拆解窗口需通过 `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. 后续实现完成并宣告 `completed` 前，必须补 `pnpm run build` 与 `upgrade` 定向回归证据

## 9. 执行记录

1. 2026-04-04：任务创建，状态初始化为 `planned`；承接 `upgrade` command 的状态机冻结与 contract 对齐，不在本任务里直接实现 apply path。
2. 2026-04-04：开始执行；先同步 `current-context`、project/sprint plan 与 sprint 台账真值，然后对读 `upgrade` contract、`upgrade-command` 与 companion runtime/input surface。
3. 2026-04-04：已冻结 `upgrade` 的 action/confirmation/apply-readiness/apply-status/verify-status/rollback-source/receipt artifact id 等有限集合，并补齐 `main.ts` 参数解析、command registration 与 runtime option seam，为 `TK-521/TK-522` 提供单写源实现边界。

## 10. 产出

1. 已完成：`apps/cli/src/constants/cli-upgrade.constant.ts`，集中收口 `upgrade` action / confirmation / readiness / receipt / rollback 有限集合。
2. 已完成：`apps/cli/src/types/interfaces/cli-upgrade-command.interface.ts` 与 `main.ts` / runtime option wiring，冻结 `upgrade` raw argv -> runtime seam。
3. 已完成：`upgrade` preview/apply/rollback artifact contract 对齐到 `report / auto-migrated-config / rollback-snapshot / apply-receipt / verify / rollback-receipt` 闭环。
