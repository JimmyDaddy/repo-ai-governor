# TK-300 sprint-003 出口验收与 sprint-004 输入约束

- Status: completed
- Date: 2026-03-28
- Owner: AI-Agent
- Priority: P1
- Project: `project-026-prd-gap-remediation`
- Sprint: `sprint-003-p1-productization-closure-extended`

## 1. 任务目标

完成 `sprint-003` 的出口验收，并冻结 `sprint-004` 所需输入约束与遗留风险。

## 2. Depends On

1. `TK-298`
2. `TK-299`

## 3. 预期产物

1. sprint-003 出口验收结论
2. sprint-004 输入约束
3. 遗留风险与建议

## 4. sprint-003 出口判断

1. Python / Go 最小治理模板：`accept`
2. `upgrade/workspace lifecycle` adopter UX 打磨：`accept`
3. sprint-003 总体结论：`accept`

说明：
`sprint-003-p1-productization-closure-extended` 的两项 exit criteria 已全部达成；当前不存在阻断进入 `sprint-004` 的已知产品化基线缺口。

## 5. sprint-004 输入约束（冻结）

1. `sprint-004` 在沉淀正式支持矩阵与 GA 证据时，必须把 `pythonMinimalGovernancePack` / `goMinimalGovernancePack` 视作当前最小官方模板基线，不得绕过 `StandardsPackRegistry` 另起平行 contract。
2. `upgrade/workspace lifecycle` 的 pretty output、artifact 语义与 playbook truthfulness 现在已形成对外口径；后续 GA 文档与 smoke 记录必须沿用这套术语，不得重新引入“只看底层 JSON artifact 才能操作”的工程化描述。
3. `sprint-004` 的支持矩阵与 clean-room smoke 需继续保持 `test/public-package-exports.integration.test.ts`、`test/i18n-translation-key-coverage.integration.test.ts` 以及 `apps/cli/test/cli-output-contract.integration.test.ts` 的稳定绿灯，避免模板与文档扩张造成回归。

## 6. 实施计划

1. 汇总 `TK-298` 与 `TK-299` 的证据与验证结果。
2. 对照 sprint-003 exit criteria 做完成性核查。
3. 输出 sprint-004 输入约束与后续建议。

## 7. 验证命令

1. `pnpm run typecheck`
2. `node ./scripts/governance/check-task-ledger-sync.js`
3. `node ./scripts/governance/check-sprint-plan-status-sync.js`
4. `node ./scripts/governance/check-worktree-review-target.js`

## 8. 执行记录

1. 2026-03-27：任务创建，状态初始化为 `planned`。
2. 2026-03-28：状态切换为 `in_progress`，开始汇总 `TK-298` 与 `TK-299` 的证据并冻结 `sprint-004` 输入约束。
3. 2026-03-28：已完成 sprint-003 出口验收，确认模板与 UX 两项 exit criteria 全部达成，并冻结 `sprint-004` 延续 GA 证据沉淀的输入约束。
