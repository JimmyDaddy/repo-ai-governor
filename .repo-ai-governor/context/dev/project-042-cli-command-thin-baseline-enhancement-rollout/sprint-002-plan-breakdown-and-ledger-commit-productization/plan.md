# sprint-002-plan-breakdown-and-ledger-commit-productization 计划

- Status: completed
- Date: 2026-04-04
- Project: `project-042-cli-command-thin-baseline-enhancement-rollout`
- Sprint Goal: 将 `plan` 从 snapshot artifact 提升为结构化 breakdown、preview/confirm 与 governed ledger commit 的正式命令链路。

## 1. Task Package

1. `TK-523` implement structured plan breakdown generation and preview surface
2. `TK-524` implement plan explicit commit and governed ledger projection
3. `TK-525` align plan cli explainability i18n and regression acceptance

## 2. Exit Criteria

1. `plan` 已能基于明确输入生成结构化 task breakdown，而不是只输出快照类 artifact。
2. `plan` commit 必须通过 preview/confirm gating，并受控写入 sprint ledger，而不是隐式落账。
3. CLI presenter、i18n、台账投影与回归证据已经形成单写源闭环。
4. sprint-002 的任务卡、checklist、tasks.csv 与 project-042 WBS 保持同步。

## 3. Milestones

1. 2026-04-04：创建 `sprint-002-plan-breakdown-and-ledger-commit-productization` 作为 `project-042` 第二阶段 planned sprint。
2. 2026-04-04：完成 `TK-523`、`TK-524`、`TK-525` 任务卡拆解，并为后续激活预留标准台账骨架。
3. 2026-04-04：`sprint-001 upgrade` 已完成，当前 sprint 正式激活为 primary execution stream，并以 `TK-523` 作为首个 in-flight 任务。
4. 2026-04-04：完成 `plan` structured preview / explicit commit / governed ledger projection / presenter & i18n / runtime-output-e2e-example 验证闭环，并通过 `pnpm run build`、`check-i18n-parity-fallback`、`check-task-ledger-sync`、`check-sprint-plan-status-sync` 与黑盒 e2e。

## 4. Completion Evidence

1. `pnpm exec vitest run apps/cli/test/cli-governance-runtime.integration.test.ts -t "plan|dispatches extracted init/check/plan/upgrade/workspace/run commands through the facade registry"`
2. `pnpm exec vitest run apps/cli/test/cli-output-contract.integration.test.ts -t "plan"`
3. `pnpm exec vitest run test/e2e/blackbox-governance-flow.e2e.test.ts -t "plan -> run -> review -> review-verify -> replay"`
4. `node ./scripts/governance/check-i18n-parity-fallback.js`
5. `node ./scripts/governance/check-task-ledger-sync.js`
6. `node ./scripts/governance/check-sprint-plan-status-sync.js`
7. `node ./scripts/examples/check-examples-smoke.js`
8. `node ./scripts/examples/check-examples-runtime.js`
9. `pnpm run build`
