# TK-037 Restricted Network Mode 降级执行基线

- Status: completed
- Date: 2026-03-21
- Owner: AI-Agent
- Priority: P0
- Project: `project-004-agent-adapter-runtime`
- Sprint: `sprint-002-adapters-and-restricted-network`

## 1. 任务目标

建立外网受限场景降级语义并保障本地治理、流程编排与台账写入可运行。

## 2. Depends On

1. `TK-034`
2. `TK-036`
3. `DA-043`
4. `DA-045`

## 3. 预期产物

1. `DA-047` restricted network mode baseline 文档。

## 4. Input References

1. `.repo-ai-governor/context/dev/project-004-agent-adapter-runtime/sprint-001-agent-protocol-and-adapter-sdk/tasks/TK-034-adapter-sdk-and-routekey-fallback-baseline.md` (`DA-043`)
2. `.repo-ai-governor/context/dev/project-004-agent-adapter-runtime/sprint-001-agent-protocol-and-adapter-sdk/tasks/TK-035-sprint-002-adapters-and-restricted-network-input-constraints-checklist.md` (`DA-045`)
3. `.repo-ai-governor/context/dev/project-004-agent-adapter-runtime/sprint-002-adapters-and-restricted-network/tasks/TK-036-first-batch-adapters-baseline.md` (`DA-046`)
4. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-master-execution-plan.md`（`§4.6` 第 6 项）
5. `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`（`§4` 受限网络场景边界）

## 5. 实施计划

1. 定义 Restricted Network Mode 触发条件与降级状态模型。
2. 约束外部模型不可达时的 fallback 路径，保持本地门禁、状态机与台账能力可用。
3. 预留本地模型接入点，确保后续扩展不破坏当前契约。
4. 输出可观测审计字段，记录降级触发原因与执行结果。

## 6. 验证计划

1. `pnpm run typecheck`
2. `pnpm run test:integration -- --maxWorkers=1 --maxConcurrency=1`
3. `pnpm run check`

## 7. 执行记录

1. 2026-03-21：任务创建，状态初始化为 `planned`。
2. 2026-03-21：任务启动，状态切换为 `in_progress`，开始落地 restricted network 触发条件、降级审计字段与本地 fallback 执行路径。
3. 2026-03-21：完成 `adapter-sdk` restricted network 降级语义实现与本地 fallback 链路接线，补齐 package smoke 与跨包 integration 验证，任务状态切换为 `completed`。
