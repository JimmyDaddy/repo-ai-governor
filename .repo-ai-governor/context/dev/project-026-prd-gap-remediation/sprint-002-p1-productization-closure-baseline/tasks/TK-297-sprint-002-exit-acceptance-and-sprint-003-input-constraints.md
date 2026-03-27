# TK-297 sprint-002 出口验收与 sprint-003 输入约束

- Status: completed
- Date: 2026-03-28
- Owner: AI-Agent
- Priority: P1
- Project: `project-026-prd-gap-remediation`
- Sprint: `sprint-002-p1-productization-closure-baseline`

## 1. 任务目标

完成 `sprint-002` 的出口验收，确认 `sprint-003` 的输入约束、遗留风险与执行顺序。

## 2. Depends On

1. `TK-293`
2. `TK-294`
3. `TK-295`
4. `TK-296`

## 3. 预期产物

1. sprint-002 出口验收结论
2. sprint-003 输入约束清单
3. 遗留风险与建议

## 4. sprint-002 出口判断

1. Standards Pack 三视图端到端链路：`accept`
2. i18n zh-CN/en parity 与 CLI 翻译键覆盖：`accept`
3. 6 个 public 包 `exports` root entry 合约：`accept`
4. 团队共享 Standards Pack 分发路径文档与示例：`accept`
5. sprint-002 总体结论：`accept`

说明：
`sprint-002-p1-productization-closure-baseline` 的四项 exit criteria 已全部达成；当前不存在阻断进入 `sprint-003` 的已知基线缺口。

## 5. sprint-003 输入约束（冻结）

1. Python / Go 最小治理模板必须沿用 `official -> team -> repository` 的 pack layering 口径，不得先引入与 README 不一致的新 loader 契约。
2. `upgrade/workspace lifecycle` UX 打磨不得破坏 `test/i18n-translation-key-coverage.integration.test.ts`、`test/public-package-exports.integration.test.ts` 与既有 parity gate 的绿灯基线。
3. 根级 `AGENTS.md` 目前仍是手工维护入口；若 `sprint-003` 触及自动投影写回，必须显式补齐 owner/runtime contract，而不能隐式假设已存在 projector loader。
4. 公开包消费仍只允许 root import；后续扩展不得通过 README 示例或代码实现重新引入深层路径导入依赖。

## 6. 实施计划

1. 汇总 `TK-293 ~ TK-296` 的验证与证据。
2. 对照 sprint exit criteria 做完成性核查。
3. 输出 sprint-003 输入约束。

## 7. 验证命令

1. `pnpm vitest run --config vitest.integration.config.ts test/i18n-parity-fallback-gate.integration.test.ts test/i18n-translation-key-coverage.integration.test.ts test/public-package-exports.integration.test.ts`
2. `pnpm run typecheck`
3. `node ./scripts/governance/check-task-ledger-sync.js`
4. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 8. 执行记录

1. 2026-03-27：任务创建，状态初始化为 `planned`。
2. 2026-03-28：状态切换为 `in_progress`，开始汇总 `TK-293 ~ TK-296` 的验证结果并冻结 `sprint-003` 输入约束。
3. 2026-03-28：已完成 sprint-002 出口验收，确认四项 exit criteria 全部达成，并冻结 `sprint-003` 需延续的 i18n / public exports / standards distribution baseline。
