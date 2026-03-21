# TK-033 Agent 协议与 Capability Matrix 基线

- Status: planned
- Date: 2026-03-21
- Owner: TBD
- Priority: P0
- Project: `project-004-agent-adapter-runtime`
- Sprint: `sprint-001-agent-protocol-and-adapter-sdk`

## 1. 任务目标

建立统一 Agent 协议与 capability matrix 契约并定义超时取消能力语义。

## 2. Depends On

1. `TK-032`
2. `DA-040`

## 3. 预期产物

1. `DA-042` agent protocol and capability matrix baseline 文档。

## 4. Input References

1. `.repo-ai-governor/context/dev/project-004-agent-adapter-runtime/sprint-001-agent-protocol-and-adapter-sdk/tasks/TK-032-role-registry-and-role-profile-lifecycle-baseline.md`
2. `.repo-ai-governor/context/dev/project-003-standards-and-slots/sprint-002-slot-security-and-upgrade-ux/tasks/TK-030-project-004-input-constraints-checklist.md` (`DA-040`)
3. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-master-execution-plan.md`（`§4.6`）
4. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`（`§4.2`、`§9.3`）
5. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md`（`§2`、`§4`）

## 5. 实施计划

1. 抽象统一协议接口：`probe`、`invokeStage`、`streamEvents`、`requestConfirmation`、`cancel`。
2. 定义 capability matrix 字段，覆盖模型调用、流式事件、确认闸口、超时取消、上下文窗口等能力。
3. 规范超时与取消语义，确保 runtime 在不同适配器上行为一致。
4. 给出不支持能力时的降级策略契约，避免运行时异常分叉。

## 6. 验证计划

1. `pnpm run typecheck`
2. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`
3. `pnpm run check`

## 7. 执行记录

1. 2026-03-21：任务创建，状态初始化为 `planned`。
