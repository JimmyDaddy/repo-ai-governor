# TK-056 跨包契约测试矩阵基线

- Status: planned
- Date: 2026-03-22
- Owner: TBD
- Priority: P0
- Project: `project-006-hardening-and-release`
- Sprint: `sprint-001-contract-and-release-governance-baseline`

## 1. 任务目标

建立 Stage 7 跨包契约测试矩阵，统一关键模块契约入口、失败语义与回归边界。

## 2. Depends On

1. `DA-065`
2. `DA-066`

## 3. 预期产物

1. `DA-067` 跨包契约测试矩阵基线文档与执行入口说明。

## 4. Input References

1. `.repo-ai-governor/context/dev/project-006-hardening-and-release/plan.md`
2. `.repo-ai-governor/context/dev/project-005-observability-and-artifacts/sprint-002-dependency-runtime-and-output-governance/tasks/TK-053-project-005-exit-acceptance-and-project-006-input-constraints.md`（`DA-065`）
3. `.repo-ai-governor/context/dev/project-005-observability-and-artifacts/sprint-002-dependency-runtime-and-output-governance/tasks/TK-053-project-006-input-constraints-checklist.md`（`DA-066`）
4. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-master-execution-plan.md`（`4.8`）
5. `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`（`CS-024`）

## 5. 实施计划

1. 定义模块覆盖清单：`adapter-sdk`、`memory-store-adapter`、`artifact-registry`、`notification-dispatcher`、`process DSL/IR`、`risk-policy`、`standards projection parity`。
2. 定义契约测试入口、固定输出字段与失败分级（block/warn）语义。
3. 将执行入口纳入 sprint 台账与后续 GA 联合门禁输入链路。

## 6. 验证

1. `pnpm run test:integration -- --maxWorkers=1 --maxConcurrency=1`
2. `pnpm run check`

## 7. 执行记录

1. 2026-03-22：任务创建，状态初始化为 `planned`。
