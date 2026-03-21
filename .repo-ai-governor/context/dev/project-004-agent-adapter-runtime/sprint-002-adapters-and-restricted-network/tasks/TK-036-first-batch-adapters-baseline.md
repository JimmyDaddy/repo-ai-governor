# TK-036 首批 Adapters（Codex Copilot Claude Code）基线

- Status: planned
- Date: 2026-03-21
- Owner: TBD
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

1. `.repo-ai-governor/context/dev/project-004-agent-adapter-runtime/sprint-001-agent-protocol-and-adapter-sdk/tasks/TK-035-sprint-001-exit-acceptance-and-sprint-002-input-constraints.md` (`DA-044`、`DA-045`)
2. `.repo-ai-governor/context/dev/project-004-agent-adapter-runtime/sprint-001-agent-protocol-and-adapter-sdk/tasks/TK-033-agent-protocol-and-capability-matrix-baseline.md` (`DA-042`)
3. `.repo-ai-governor/context/dev/project-004-agent-adapter-runtime/sprint-001-agent-protocol-and-adapter-sdk/tasks/TK-034-adapter-sdk-and-routekey-fallback-baseline.md` (`DA-043`)
4. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-master-execution-plan.md`（`§4.6` 第 4 项）

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
