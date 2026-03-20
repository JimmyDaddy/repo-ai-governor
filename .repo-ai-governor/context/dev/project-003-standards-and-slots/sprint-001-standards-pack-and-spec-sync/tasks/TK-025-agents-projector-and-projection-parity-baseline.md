# TK-025 Agents Projector 与 Projection Parity 基线

- Status: completed
- Date: 2026-03-20
- Owner: AI-Agent
- Priority: P0
- Project: `project-003-standards-and-slots`
- Sprint: `sprint-001-standards-pack-and-spec-sync`

## 1. 任务目标

建立 `agents projector` 基线，确保 `AGENTS.md` 投影稳定并可追溯来源 pack 与渲染版本。

## 2. Depends On

1. `TK-024`
2. `DA-032`

## 3. 预期产物

1. `DA-033` agents projector and projection parity baseline 文档。

## 4. Input References

1. `.repo-ai-governor/context/dev/project-003-standards-and-slots/sprint-001-standards-pack-and-spec-sync/tasks/TK-024-standards-pack-registry-and-rule-renderer-baseline.md` (`DA-032`)
2. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`（`§4.2.6`）
3. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md`（`§4`）
4. `.repo-ai-governor/context/dev/project-003-standards-and-slots/sprint-001-standards-pack-and-spec-sync/code-review/verified_review_tk-024-standards-pack-registry-rule-renderer-batch.md`（`§2.3` 与 `2026-03-20 复核结论`）

## 5. 实施要点

1. 定义 `agents projector` 投影目标、元数据回链字段与刷新策略。
2. 建立 human/ai/agents 语义一致性校验（projection parity）。
3. 将投影结果纳入审计事件并可回放定位。
4. 收敛 `TK-024` CR `2.3` 技术债：在 `packages/standards` 内抽象共享字符串校验 helper（建议 `utils/validation.util.ts`），替换 registry/renderer 的重复校验实现，并保持错误码语义不变（`STANDARDS_PACK_INVALID` / `RULE_RENDER_INVALID`）。

## 6. 验证

1. `pnpm run typecheck`
2. `pnpm run test -- standards-projection-parity.smoke.test.ts`
3. `pnpm run check`

## 7. 执行记录

1. 2026-03-20：任务启动，状态切换为 `in_progress`，开始实现 `agents projector` 与 projection parity 基线，并同步收敛 `TK-024` CR `2.3` 校验 helper 技术债。
2. 2026-03-20：完成 `AgentsProjector`、projection parity 校验、`AGENTS.md` 投影元数据输出、投影时钟 provider 基线，并新增 `standards-projection-parity` smoke 覆盖。
3. 2026-03-20：完成 CR 复核与台账收敛，状态切换为 `completed`；验证通过 `pnpm run typecheck`、`pnpm run test -- standards-projection-parity.smoke.test.ts`、`pnpm run check`。
4. 2026-03-20：完成批次 CR 复核与修复（`review_tk-025-agents-projector-projection-parity-batch.md`），修复类型层 provider 耦合与投影 metadata key 常量化问题，并复跑门禁通过。

## 8. 产出

1. `packages/standards/src/agents-projector.ts`
2. `packages/standards/src/providers/**`
3. `packages/standards/src/utils/validation.util.ts`
4. `packages/standards/src/rule-renderer.ts`
5. `packages/standards/src/standards-pack-registry.ts`
6. `packages/standards/src/types/interfaces/standards.interface.ts`
7. `test/standards-projection-parity.smoke.test.ts`
8. `.repo-ai-governor/context/dev/project-003-standards-and-slots/sprint-001-standards-pack-and-spec-sync/code-review/verified_review_tk-025-agents-projector-and-projection-parity-baseline.md`
9. `DA-033` `.repo-ai-governor/context/dev/project-003-standards-and-slots/sprint-001-standards-pack-and-spec-sync/tasks/TK-025-agents-projector-and-projection-parity-baseline.md`
