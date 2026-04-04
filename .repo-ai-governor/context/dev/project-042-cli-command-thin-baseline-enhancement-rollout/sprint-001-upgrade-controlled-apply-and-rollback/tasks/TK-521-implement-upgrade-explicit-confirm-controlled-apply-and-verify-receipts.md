# TK-521 implement upgrade explicit confirm controlled apply and verify receipts

- Status: completed
- Date: 2026-04-04
- Owner: AI-Agent
- Priority: P0
- Project: `project-042-cli-command-thin-baseline-enhancement-rollout`
- Sprint: `sprint-001-upgrade-controlled-apply-and-rollback`

## 1. 任务目标

在 `TK-520` 冻结的状态机之上，为 `upgrade` 落成 explicit confirm、controlled apply 与 verify receipt 闭环，使其从 analyze-only 提升为真正可受控执行的命令链路。

## 2. Depends On

1. `TK-520`
2. `.repo-ai-governor/draft/upgrade-analysis-apply-and-rollback-contract.md`
3. `apps/cli/src/commands/upgrade-command.ts`

## 3. 预期产物

1. `upgrade` preview -> confirm -> apply -> verify receipt baseline
2. 受控 apply 的 artifact persistence 与 presenter-safe result
3. 为 rollback 铺平前置 receipt / snapshot truth

## 4. Required Inputs

1. `.repo-ai-governor/draft/upgrade-analysis-apply-and-rollback-contract.md`
2. `apps/cli/src/commands/upgrade-command.ts`
3. `packages/config/src/upgrade-schema-diff-service.ts`
4. `packages/shared/src/i18n/locales/en-us.ts`
5. `packages/shared/src/i18n/locales/zh-cn.ts`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-042-cli-command-thin-baseline-enhancement-rollout/plan.md`
2. `.repo-ai-governor/context/dev/project-042-cli-command-thin-baseline-enhancement-rollout/sprint-001-upgrade-controlled-apply-and-rollback/plan.md`
3. `.repo-ai-governor/context/dev/project-042-cli-command-thin-baseline-enhancement-rollout/sprint-001-upgrade-controlled-apply-and-rollback/tasks/TK-520-freeze-upgrade-controlled-apply-state-machine-and-artifact-contracts-baseline.md`

## 6. 实施计划

1. 在 CLI/runtime 层引入 explicit confirm gating。
2. 把 apply 写回和 verify receipt 收敛为正式 artifact。
3. 为 `TK-522` 的 rollback path 保留稳定 rollback reference。

## 7. Development Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. 代码实现阶段需补 `pnpm run build` 与针对 `upgrade` 的定向回归；当前拆解阶段 not required

## 8. Delivery Verification

1. 后续完成实现时必须补 `pnpm run build`
2. 后续完成实现时必须补 `upgrade` preview/confirm/apply/verify 定向回归证据
3. 交付前需回链 receipt / verify artifact 的实际落点

## 9. 执行记录

1. 2026-04-04：任务创建，状态初始化为 `planned`；承接 `upgrade` explicit confirm / controlled apply / verify receipt 实现。
2. 2026-04-04：已实现 `upgrade preview -> explicit confirm -> apply -> verify receipt` 闭环；apply 现在要求 preview report linkage、source drift 校验与 `--confirm-upgrade approve|reject`，并在 verify 失败时保留恢复证据。

## 10. 产出

1. 已完成：`apps/cli/src/commands/upgrade-command.ts` 中的 explicit confirm gating、report linkage 校验与 controlled apply 写回。
2. 已完成：`*.apply-receipt.json` 与 `*.verify.json` artifact baseline，以及 verify-failed 时的恢复闭环。
3. 已完成：CLI / JSON / React shell presenter-safe apply result 输出与定向集成测试。
