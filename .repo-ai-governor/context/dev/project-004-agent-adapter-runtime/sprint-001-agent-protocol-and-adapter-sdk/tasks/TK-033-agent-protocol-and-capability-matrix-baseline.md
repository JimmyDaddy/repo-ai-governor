# TK-033 Agent 协议与 Capability Matrix 基线

- Status: completed
- Date: 2026-03-21
- Owner: AI-Agent
- Priority: P0
- Project: `project-004-agent-adapter-runtime`
- Sprint: `sprint-001-agent-protocol-and-adapter-sdk`

## 1. 任务目标

建立统一 Agent 协议与 capability matrix 契约并定义超时取消能力语义。

## 2. Depends On

1. `TK-032`
2. `DA-040`
3. `DA-041`

## 3. 预期产物

1. `DA-042` agent protocol and capability matrix baseline 文档。

## 4. Input References

1. `.repo-ai-governor/context/dev/project-004-agent-adapter-runtime/sprint-001-agent-protocol-and-adapter-sdk/tasks/TK-032-role-registry-and-role-profile-lifecycle-baseline.md` (`DA-041`)
2. `.repo-ai-governor/context/dev/project-003-standards-and-slots/sprint-002-slot-security-and-upgrade-ux/tasks/TK-030-project-004-input-constraints-checklist.md` (`DA-040`)
3. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-master-execution-plan.md`（`§4.6`）
4. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`（`§4.2`、`§9.3`）
5. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md`（`§2`、`§4`）

## 5. 实施摘要

1. 新增 `packages/adapter-sdk` 基线包，落地统一协议边界：
   - `AgentProtocol` 抽象类，统一 `probe`、`invokeStage`、`streamEvents`、`requestConfirmation`、`cancel` 五个核心方法契约。
   - 协议请求/响应与流式事件类型全部收敛到 `src/types/interfaces/agent-protocol.interface.ts`。
2. 新增 capability matrix 与降级语义常量：
   - 能力集、支持级别、确认决策、取消范围/原因、fallback action 全部采用 enum 统一管理。
   - capability matrix 最小字段覆盖 `capabilityStates + timeout + cancellation + contextWindow`。
3. 新增 `AgentCapabilityEvaluator`：
   - 输出 `unsupported/degraded` 能力差距与标准化 fallback action。
   - 默认策略：`unsupported -> escalate`，`degraded(未放行) -> require_confirmation`。
   - 支持按能力粒度覆写 fallback 规则，便于后续 `routeKey` 主备路由与降级决策消费。
4. 补齐新包接线：
   - 更新 `tsconfig` 与 `vitest` 内部 alias，确保 workspace 内按包名消费 `@repo-ai-governor/adapter-sdk`。
   - 更新 shared 标准错误码，补充 Agent 协议/能力矩阵校验错误编码。

## 6. 产出

1. `packages/adapter-sdk/package.json`
2. `packages/adapter-sdk/README.md`
3. `packages/adapter-sdk/src/constants/agent-protocol.constant.ts`
4. `packages/adapter-sdk/src/constants/index.ts`
5. `packages/adapter-sdk/src/types/interfaces/agent-protocol.interface.ts`
6. `packages/adapter-sdk/src/types/interfaces/index.ts`
7. `packages/adapter-sdk/src/types/index.ts`
8. `packages/adapter-sdk/src/agent-protocol.abstract.ts`
9. `packages/adapter-sdk/src/agent-capability-evaluator.ts`
10. `packages/adapter-sdk/src/index.ts`
11. `packages/adapter-sdk/test/agent-capability-evaluator.unit.test.ts`
12. `packages/shared/src/errors/error-code.constant.ts`
13. `tsconfig.json`
14. `vitest.internal-alias.ts`
15. `.repo-ai-governor/context/dev/project-004-agent-adapter-runtime/sprint-001-agent-protocol-and-adapter-sdk/review/verified_review_tk-033-agent-protocol-and-capability-matrix-baseline.md`
16. `DA-042` `.repo-ai-governor/context/dev/project-004-agent-adapter-runtime/sprint-001-agent-protocol-and-adapter-sdk/tasks/TK-033-agent-protocol-and-capability-matrix-baseline.md`

## 7. 验证

1. `pnpm install`（通过）
2. `pnpm run test:packages -- packages/adapter-sdk/test/agent-capability-evaluator.unit.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
3. `pnpm run typecheck`（通过）
4. `pnpm run check`（通过）

## 8. 执行记录

1. 2026-03-21：任务创建，状态初始化为 `planned`。
2. 2026-03-21：任务启动，状态切换为 `in_progress`，开始落地 `Agent protocol` 与 capability matrix 契约代码基线。
3. 2026-03-21：完成 `adapter-sdk` 协议与 capability matrix 基线、补齐包测与门禁验证，状态切换为 `completed`。
