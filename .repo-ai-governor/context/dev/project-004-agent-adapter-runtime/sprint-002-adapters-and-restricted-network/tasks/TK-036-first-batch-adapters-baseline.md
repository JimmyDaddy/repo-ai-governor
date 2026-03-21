# TK-036 首批 Adapters（Codex Copilot Claude Code）基线

- Status: completed
- Date: 2026-03-21
- Owner: AI-Agent
- Priority: P0
- Project: `project-004-agent-adapter-runtime`
- Sprint: `sprint-002-adapters-and-restricted-network`

## 1. 任务目标

交付 `codex` `github-copilot` `claude-code` 首批 adapters 基线并接入统一协议与策略。

## 2. Depends On

1. `TK-035`
2. `DA-044`
3. `DA-045`

## 3. 预期产物

1. `DA-046` first batch adapters baseline 文档。

## 4. Input References

1. `.repo-ai-governor/context/dev/project-004-agent-adapter-runtime/sprint-001-agent-protocol-and-adapter-sdk/tasks/TK-035-sprint-001-exit-acceptance-and-sprint-002-input-constraints.md` (`DA-044`)
2. `.repo-ai-governor/context/dev/project-004-agent-adapter-runtime/sprint-001-agent-protocol-and-adapter-sdk/tasks/TK-035-sprint-002-adapters-and-restricted-network-input-constraints-checklist.md` (`DA-045`)
3. `.repo-ai-governor/context/dev/project-004-agent-adapter-runtime/sprint-001-agent-protocol-and-adapter-sdk/tasks/TK-033-agent-protocol-and-capability-matrix-baseline.md` (`DA-042`)
4. `.repo-ai-governor/context/dev/project-004-agent-adapter-runtime/sprint-001-agent-protocol-and-adapter-sdk/tasks/TK-034-adapter-sdk-and-routekey-fallback-baseline.md` (`DA-043`)
5. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-master-execution-plan.md`（`§4.6` 第 4 项）

## 5. 实施计划

1. 基于 Adapter SDK 落地三类适配器的最小实现与能力声明。
2. 对齐统一错误模型与审计字段，避免 adapter 侧语义分叉。
3. 建立 capability matrix 对齐检查，确保三类 adapter 的核心能力映射一致。
4. 输出 smoke 验证样例，作为后续扩展适配器的回归基线。

## 6. 验证计划

1. `pnpm run typecheck`
2. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`
3. `pnpm run check`

## 7. 执行记录

1. 2026-03-21：任务创建，状态初始化为 `planned`。
2. 2026-03-21：任务启动，状态切换为 `in_progress`，开始搭建 `codex/github-copilot/claude-code` 首批 adapter 基线与能力声明对齐路径。
3. 2026-03-21：完成 `packages/adapters/{codex,github-copilot,claude-code}` 首批适配器骨架与 smoke 测试，验证 `pnpm run typecheck` 与 `pnpm run test:packages -- packages/adapters/codex/test/codex-agent-adapter.smoke.test.ts packages/adapters/github-copilot/test/github-copilot-agent-adapter.smoke.test.ts packages/adapters/claude-code/test/claude-code-agent-adapter.smoke.test.ts --maxWorkers=1 --maxConcurrency=1` 通过。
4. 2026-03-21：新增跨包集成测试 `test/first-batch-adapters-route.integration.test.ts`，验证 `AgentRouteRunner + codex/github-copilot/claude-code` 路由与降级链路，`pnpm run test:integration -- test/first-batch-adapters-route.integration.test.ts --maxWorkers=1 --maxConcurrency=1` 通过。
5. 2026-03-21：完成复核问题修复并执行收尾交付（commit: `788aaef`），任务状态切换为 `completed`，`DA-046` 进入 artifact registry active 集。
