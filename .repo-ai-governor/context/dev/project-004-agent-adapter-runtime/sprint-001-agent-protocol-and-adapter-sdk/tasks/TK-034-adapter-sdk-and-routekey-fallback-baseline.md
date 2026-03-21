# TK-034 Adapter SDK 与 routeKey 主备路由基线

- Status: completed
- Date: 2026-03-21
- Owner: AI-Agent
- Priority: P0
- Project: `project-004-agent-adapter-runtime`
- Sprint: `sprint-001-agent-protocol-and-adapter-sdk`

## 1. 任务目标

交付 Adapter SDK 基线并定义 `routeKey` 主备路由与降级回退策略。

## 2. Depends On

1. `TK-032`
2. `TK-033`
3. `DA-041`
4. `DA-042`

## 3. 预期产物

1. `DA-043` adapter sdk and routeKey fallback baseline 文档。

## 4. Input References

1. `.repo-ai-governor/context/dev/project-004-agent-adapter-runtime/sprint-001-agent-protocol-and-adapter-sdk/tasks/TK-032-role-registry-and-role-profile-lifecycle-baseline.md` (`DA-041`)
2. `.repo-ai-governor/context/dev/project-004-agent-adapter-runtime/sprint-001-agent-protocol-and-adapter-sdk/tasks/TK-033-agent-protocol-and-capability-matrix-baseline.md` (`DA-042`)
3. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-master-execution-plan.md`（`§4.6` 第 5 项）
4. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`（`§4.2`）
5. `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`（`CS-022`、`CS-024`）

## 5. 实施摘要

1. 在 `packages/adapter-sdk` 落地 routeKey 路由基线组件：
   - `AgentRouteRegistry`：维护 `routeKey -> primary/fallback` 策略并做配置规范化与校验。
   - `AgentRouteRunner`：执行主备路由选择、探测可用性、能力评估与降级回退，并产出结构化审计记录。
2. 补齐主备路由与降级语义：
   - 按 `primary -> fallback[]` 顺序尝试可用 surface。
   - 能力不满足时按 `fallbackActions` 决策：支持 `use_fallback_surface` 继续降级；其余动作输出标准化阻断错误。
3. 建立 adapter 错误映射基线：
   - 新增 `AgentProtocolErrorMapper`，统一 `probe/invoke/stream/confirmation/cancel` 错误映射到标准 `GovernorErrorCode`。
   - 新增 `shared` 错误码覆盖 route/adapter protocol 常见失败场景。
4. 提供 smoke 验证入口：
   - 新增 `agent-route-runner.smoke.test.ts` 覆盖 primary 命中、surface 不可用回退、能力不满足回退、无可用 surface 失败、invoke 映射失败等路径。

## 6. 产出

1. `packages/adapter-sdk/src/types/interfaces/agent-route.interface.ts`
2. `packages/adapter-sdk/src/agent-route-registry.ts`
3. `packages/adapter-sdk/src/agent-route-runner.ts`
4. `packages/adapter-sdk/src/agent-protocol-error-mapper.ts`
5. `packages/adapter-sdk/src/constants/agent-protocol.constant.ts`（新增 route 选择来源与 skip reason 常量）
6. `packages/adapter-sdk/src/constants/index.ts`
7. `packages/adapter-sdk/src/types/interfaces/agent-protocol.interface.ts`
8. `packages/adapter-sdk/src/types/interfaces/index.ts`
9. `packages/adapter-sdk/src/types/index.ts`
10. `packages/adapter-sdk/src/index.ts`
11. `packages/adapter-sdk/test/agent-route-runner.smoke.test.ts`
12. `packages/adapter-sdk/test/agent-capability-evaluator.unit.test.ts`（补充兼容适配）
13. `packages/shared/src/errors/error-code.constant.ts`（新增 Adapter SDK 路由/协议错误码）
14. `.repo-ai-governor/context/dev/project-004-agent-adapter-runtime/sprint-001-agent-protocol-and-adapter-sdk/review/verified_review_tk-034-adapter-sdk-and-routekey-fallback-baseline.md`
15. `DA-043` `.repo-ai-governor/context/dev/project-004-agent-adapter-runtime/sprint-001-agent-protocol-and-adapter-sdk/tasks/TK-034-adapter-sdk-and-routekey-fallback-baseline.md`

## 7. 验证

1. `pnpm run test:packages -- packages/adapter-sdk/test/agent-capability-evaluator.unit.test.ts packages/adapter-sdk/test/agent-route-runner.smoke.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
2. `pnpm run typecheck`（通过）
3. `pnpm run check`（通过）

## 8. 执行记录

1. 2026-03-21：任务创建，状态初始化为 `planned`。
2. 2026-03-21：任务启动，状态切换为 `in_progress`，开始落地 `routeKey` 主备路由、降级回退与错误映射基线。
3. 2026-03-21：完成 `adapter-sdk` 路由与回退基线、smoke 验证与错误映射收敛，状态切换为 `completed`。
