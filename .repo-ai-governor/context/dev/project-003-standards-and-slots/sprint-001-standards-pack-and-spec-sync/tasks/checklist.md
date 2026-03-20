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
- [ ] TK-026 Spec Sync Guard 门禁接线基线
- [ ] TK-029 sprint-001 出口验收与 sprint-002 输入约束
