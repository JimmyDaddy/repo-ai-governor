# TK-282 root gate runner profile split 与 observability baseline

- Status: planned
- Date: 2026-03-27
- Owner: AI-Agent
- Priority: P1
- Project: `project-025-gate-execution-efficiency-implementation`
- Sprint: `sprint-001-repo-global-parallelization-and-fast-check-baseline`

## 1. 任务目标

建立 `full / fast / affected` 的 root gate runner profile split，并补齐对应的 execution observability baseline。

## 2. Depends On

1. `TK-280`
2. `package.json`
3. `scripts/ci/run-gate-check.js`

## 3. 预期产物

1. profile-aware root gate runner
2. `check:fast` / `check:affected` 入口
3. 对应的日志/summary baseline

## 4. 实施计划

1. 为 root gate runner 增加 profile routing。
2. 明确 `errors-only` / `full` 等输出与 profile 的组合关系。
3. 给后续 `affected` planner 留出明确入口，而不是未来再次大改根 runner。
