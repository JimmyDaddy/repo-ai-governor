# checklist

- [x] TK-024 Standards Pack Registry 与 Rule Renderer 基线
  - 2026-03-20: 任务启动，状态切换为 `in_progress`，开始实现 `packages/standards` 的 pack registry 与 rule renderer 基线契约。
  - 2026-03-20: 完成交付，新增 `packages/standards` 与 `standards-pack` smoke 覆盖，并通过 `pnpm run typecheck`、`pnpm run test -- standards-pack.smoke.test.ts`、`pnpm run check`。
  - 2026-03-20: 完成批次 CR 复核并修复 `2.1/2.2/2.4`，将复核结论追加到 `review_tk-024-standards-pack-registry-rule-renderer-batch.md`，并复跑 `pnpm run typecheck`、`pnpm run test -- standards-pack.smoke.test.ts`、`pnpm run check` 全通过。
- [x] TK-025 Agents Projector 与 Projection Parity 基线
  - 2026-03-20: 任务范围补充，纳入 `TK-024` 批次 CR `2.3` 技术债收敛（抽象 `packages/standards` 共享 validation helper 并替换重复 `readRequiredString` 实现），与 projector 基线在同一执行窗口完成。
  - 2026-03-20: 任务启动，状态切换为 `in_progress`，开始实现 `agents projector`、projection parity 校验与 `readRequiredString` 共享 helper 收敛。
  - 2026-03-20: 完成交付并切换为 `completed`，新增 `AgentsProjector` 与 `standards-projection-parity` smoke，沉淀 `DA-033` 并通过 `pnpm run typecheck`、`pnpm run test -- standards-projection-parity.smoke.test.ts`、`pnpm run check`。
  - 2026-03-20: 完成批次 CR 复核并修复 `2.1/2.2`，向 `review_tk-025-agents-projector-projection-parity-batch.md` 追加复核结论，并复跑 `pnpm run typecheck`、`pnpm run test -- standards-projection-parity.smoke.test.ts standards-pack.smoke.test.ts`、`pnpm run check` 全通过。
- [x] TK-026 Spec Sync Guard 门禁接线基线
  - 2026-03-20: 任务启动，状态切换为 `in_progress`，开始落地 triad + brief 同步校验脚本、机器可读失败结构输出与门禁接线。
  - 2026-03-20: 完成交付并切换为 `completed`，接入 `gate:docs-triad-sync`（`package.json` + `turbo.json`）并新增 `docs-triad-sync-gate` smoke 覆盖；验证通过 `node ./scripts/governance/check-docs-triad-sync.js`、`pnpm run typecheck`、`pnpm run check`，完成 `DA-034` 登记与 review 归档。
- [x] TK-029 sprint-001 出口验收与 sprint-002 输入约束
  - 2026-03-20: 任务启动，状态切换为 `in_progress`，开始汇总 sprint-001 验收证据并生成 sprint-002 slot/upgrade 输入约束清单。
  - 2026-03-20: 完成 `DA-035` 与 `DA-036` 产出、依赖产物登记与索引回链，并新增 `verified_review_tk-029-sprint-001-exit-acceptance-and-sprint-002-input-constraints.md`。
  - 2026-03-20: 通过 `node ./scripts/governance/reconcile-artifact-dependencies.js` 与 `pnpm run check`，任务状态切换为 `completed`。
  - 2026-03-21: 补齐 `TK-028` 对 `DA-035/DA-036` 的显式回链，并同步更新 `DA-036` 任务输入映射说明，收敛跨 sprint 消费链路台账一致性。
