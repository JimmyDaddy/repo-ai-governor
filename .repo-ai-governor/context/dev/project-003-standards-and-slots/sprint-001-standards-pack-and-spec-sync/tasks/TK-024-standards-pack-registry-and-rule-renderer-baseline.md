# TK-024 Standards Pack Registry 与 Rule Renderer 基线

- Status: planned
- Date: 2026-03-20
- Owner: TBD
- Priority: P0
- Project: `project-003-standards-and-slots`
- Sprint: `sprint-001-standards-pack-and-spec-sync`

## 1. 任务目标

建立 Standards Pack 的 `pack registry` 与 `rule renderer` 基线，实现同一规则资产向 human/ai/agents 三视图的统一渲染入口。

## 2. Depends On

1. `TK-020`
2. `DA-030`
3. `DA-031`

## 3. 预期产物

1. `DA-032` standards pack registry and rule renderer baseline 文档。

## 4. Input References

1. `.repo-ai-governor/context/dev/project-002-governance-core/sprint-002-policy-hitl-and-notification-baseline/tasks/TK-020-sprint-002-governance-core-exit-acceptance-baseline.md` (`DA-030`)
2. `.repo-ai-governor/context/dev/project-002-governance-core/sprint-002-policy-hitl-and-notification-baseline/tasks/TK-020-project-003-input-constraints-checklist.md` (`DA-031`)
3. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`（`§4.2.6`、`§5.4`）
4. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md`（`§2`、`§4`、`§6`）

## 5. 实施要点

1. 定义 `pack registry` 最小字段、来源优先级与合并策略。
2. 定义 `rule renderer` 统一输入输出契约。
3. 建立 human/ai/agents 三视图渲染入口并保留语义 ID 回链。
4. 约束多语言渲染依赖同一语义键，不允许语义分叉。

## 6. 验证

1. `pnpm run typecheck`
2. `pnpm run test -- standards-pack.smoke.test.ts`
3. `pnpm run check`
