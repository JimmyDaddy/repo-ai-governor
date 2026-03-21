# TK-034 Adapter SDK 与 routeKey 主备路由基线

- Status: planned
- Date: 2026-03-21
- Owner: TBD
- Priority: P0
- Project: `project-004-agent-adapter-runtime`
- Sprint: `sprint-001-agent-protocol-and-adapter-sdk`

## 1. 任务目标

交付 Adapter SDK 基线并定义 `routeKey` 主备路由与降级回退策略。

## 2. Depends On

1. `TK-032`
2. `TK-033`

## 3. 预期产物

1. `DA-043` adapter sdk and routeKey fallback baseline 文档。

## 4. Input References

1. `.repo-ai-governor/context/dev/project-004-agent-adapter-runtime/sprint-001-agent-protocol-and-adapter-sdk/tasks/TK-032-role-registry-and-role-profile-lifecycle-baseline.md`
2. `.repo-ai-governor/context/dev/project-004-agent-adapter-runtime/sprint-001-agent-protocol-and-adapter-sdk/tasks/TK-033-agent-protocol-and-capability-matrix-baseline.md`
3. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-master-execution-plan.md`（`§4.6` 第 5 项）
4. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`（`§4.2`）
5. `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`（`CS-022`、`CS-024`）

## 5. 实施计划

1. 定义 Adapter SDK 包结构与公共接口边界，统一错误码和审计字段。
2. 实现 `routeKey` 主路由、备路由与降级回退语义。
3. 约束 adapter 错误映射，确保输出使用标准化错误模型。
4. 提供最小 smoke 验证入口，作为后续首批 adapters 的复用底座。

## 6. 验证计划

1. `pnpm run typecheck`
2. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`
3. `pnpm run check`

## 7. 执行记录

1. 2026-03-21：任务创建，状态初始化为 `planned`。
