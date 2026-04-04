# sprint-001-upgrade-controlled-apply-and-rollback 计划

- Status: completed
- Date: 2026-04-04
- Project: `project-042-cli-command-thin-baseline-enhancement-rollout`
- Sprint Goal: 将 `upgrade` 从 analyze-only baseline 提升为 preview/confirm/apply/verify/rollback 的受控命令链路。

## 1. Task Package

1. `TK-520` freeze upgrade controlled apply state machine and artifact contracts baseline
2. `TK-521` implement upgrade explicit confirm controlled apply and verify receipts
3. `TK-522` add upgrade rollback execution path interactive shell presenter and regression acceptance

## 2. Exit Criteria

1. `upgrade` 的 analyze preview、confirmation、apply、verify、rollback 状态机边界已冻结为统一实现输入。
2. apply 必须以 preview 为前置，并保留 receipt / verify / rollback artifact，而不是隐式写回 config。
3. interactive shell / CLI presenter 已能对 confirmation、apply result 与 rollback hint 做一致呈现，不泄露非 presenter-safe mutation truth。
4. sprint 台账、delivery handoff 与 current-context planned stream 已与本次 decomposition 保持同步。

## 3. Milestones

1. 2026-04-04：创建 `sprint-001-upgrade-controlled-apply-and-rollback`，作为 `project-042` 的首个 planned execution sprint。
2. 2026-04-04：完成 `TK-520`、`TK-521`、`TK-522` 任务卡拆解，并将 `project-042 / sprint-001` 登记到 `current-context.md` planned follow-up streams。
3. 2026-04-04：用户要求开始执行 `project-042`；当前 sprint 已切换为 active，并以 `TK-520` 作为首个 in-flight 任务。
4. 2026-04-04：已完成 `upgrade` preview/confirm/apply/verify/rollback 闭环、CLI presenter/i18n 收口、定向回归与 build evidence，`TK-520~522` 全部切换为 `completed`。
