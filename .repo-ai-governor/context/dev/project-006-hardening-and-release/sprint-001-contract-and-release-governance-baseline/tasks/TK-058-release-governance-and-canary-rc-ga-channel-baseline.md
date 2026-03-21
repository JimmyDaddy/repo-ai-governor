# TK-058 发布治理策略与 canary-rc-ga 通道基线

- Status: planned
- Date: 2026-03-22
- Owner: TBD
- Priority: P0
- Project: `project-006-hardening-and-release`
- Sprint: `sprint-001-contract-and-release-governance-baseline`

## 1. 任务目标

固化 Stage 7 发布治理策略：lockstep + independent 版本边界、`canary -> rc -> ga` 通道、失败回退触发条件。

## 2. Depends On

1. `TK-056`
2. `TK-057`

## 3. 预期产物

1. `DA-069` 发布治理与通道策略基线文档。

## 4. Input References

1. `.repo-ai-governor/context/dev/project-006-hardening-and-release/plan.md`
2. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-master-execution-plan.md`（`4.8`）
3. `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`

## 5. 实施计划

1. 明确 lockstep（`core-*`、`adapter-sdk`、`shared`）与 independent（`adapters/*`、`providers/*`）发布边界。
2. 定义 canary/rc/ga 进入与退出标准及门禁依赖。
3. 定义回滚触发条件与最小审计证据要求。

## 6. 验证

1. `pnpm run release:check`
2. `pnpm run release:ga-check`
3. `pnpm run check`

## 7. 执行记录

1. 2026-03-22：任务创建，状态初始化为 `planned`。
