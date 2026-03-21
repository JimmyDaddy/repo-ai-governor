# TK-038 integrations/ide 骨架与多入口命令包装基线

- Status: completed
- Date: 2026-03-21
- Owner: AI-Agent
- Priority: P1
- Project: `project-004-agent-adapter-runtime`
- Sprint: `sprint-002-adapters-and-restricted-network`

## 1. 任务目标

建立 `integrations/ide` 骨架并统一多入口规范注入与命令包装约定。

## 2. Depends On

1. `TK-034`
2. `TK-036`
3. `DA-043`
4. `DA-045`

## 3. 预期产物

1. `DA-048` ide integration skeleton baseline 文档。

## 4. Input References

1. `.repo-ai-governor/context/dev/project-004-agent-adapter-runtime/sprint-001-agent-protocol-and-adapter-sdk/tasks/TK-034-adapter-sdk-and-routekey-fallback-baseline.md` (`DA-043`)
2. `.repo-ai-governor/context/dev/project-004-agent-adapter-runtime/sprint-001-agent-protocol-and-adapter-sdk/tasks/TK-035-sprint-002-adapters-and-restricted-network-input-constraints-checklist.md` (`DA-045`)
3. `.repo-ai-governor/context/dev/project-004-agent-adapter-runtime/sprint-002-adapters-and-restricted-network/tasks/TK-036-first-batch-adapters-baseline.md` (`DA-046`)
4. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-master-execution-plan.md`（`§4.6` 第 7 项）
5. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md`（`§2` Entry Layer）

## 5. 实施计划

1. 创建 `integrations/ide` 目录骨架与入口约定。
2. 定义多入口共享的规范注入协议，避免在 IDE 入口重复维护规则文案。
3. 统一命令包装参数约定，确保 CLI 与 IDE 入口输出契约一致。
4. 产出扩展说明，明确新增 IDE 适配时的最小实现约束。

## 6. 验证计划

1. `pnpm run typecheck`
2. `pnpm run test:integration -- --maxWorkers=1 --maxConcurrency=1`
3. `pnpm run check`

## 7. 执行记录

1. 2026-03-21：任务创建，状态初始化为 `planned`。
2. 2026-03-21：任务启动，状态切换为 `in_progress`，开始建立 `integrations/ide` 骨架与 CLI 统一命令包装契约。
3. 2026-03-21：完成 `integrations/ide` 骨架目录、命令包装与规范注入契约文件落地，补齐 `apps/cli` IDE wrapper 实现与单测，任务状态切换为 `completed`。
