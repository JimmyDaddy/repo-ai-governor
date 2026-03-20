# TK-025 Agents Projector 与 Projection Parity 基线

- Status: planned
- Date: 2026-03-20
- Owner: TBD
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

## 5. 实施要点

1. 定义 `agents projector` 投影目标、元数据回链字段与刷新策略。
2. 建立 human/ai/agents 语义一致性校验（projection parity）。
3. 将投影结果纳入审计事件并可回放定位。

## 6. 验证

1. `pnpm run typecheck`
2. `pnpm run test -- standards-projection-parity.smoke.test.ts`
3. `pnpm run check`
