# TK-050 CLI 输出契约与 non-TTY 自动降级基线

- Status: planned
- Date: 2026-03-21
- Owner: TBD
- Priority: P0
- Project: `project-005-observability-and-artifacts`
- Sprint: `sprint-002-dependency-runtime-and-output-governance`

## 1. 任务目标

落地 `pretty/plain/json` 输出契约与 non-TTY 自动降级并固化错误输出结构字段。

## 2. Depends On

1. `TK-049`
2. `DA-060`
3. `DA-061`

## 3. 预期产物

1. `DA-062` cli output contract and non-tty fallback baseline 文档。

## 4. Input References

1. `.repo-ai-governor/context/dev/project-005-observability-and-artifacts/sprint-001-audit-report-and-replay-baseline/tasks/TK-049-sprint-001-exit-acceptance-and-sprint-002-input-constraints.md` (`DA-060`)
2. `.repo-ai-governor/context/dev/project-005-observability-and-artifacts/sprint-001-audit-report-and-replay-baseline/tasks/TK-049-sprint-002-dependency-runtime-and-output-governance-input-constraints-checklist.md` (`DA-061`)
3. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-master-execution-plan.md`（`4.7` 第 4、5 项）

## 5. 实施计划

1. 定义 `pretty/plain/json` 输出字段契约与稳定 schema。
2. 固化 `--output/--verbosity/--no-color` 行为及默认策略。
3. 建立 non-TTY 自动降级策略与错误输出结构化字段。
4. 补齐 CLI 输出回归验证基线。

## 6. 验证计划

1. `pnpm run typecheck`
2. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`
3. `pnpm run check`

## 7. 执行记录

1. 2026-03-21：任务创建，状态初始化为 `planned`。
