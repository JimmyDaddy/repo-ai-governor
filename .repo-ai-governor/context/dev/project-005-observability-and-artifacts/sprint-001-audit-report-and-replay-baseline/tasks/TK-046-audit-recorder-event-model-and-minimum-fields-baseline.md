# TK-046 Audit Recorder 事件模型与最小字段基线

- Status: completed
- Date: 2026-03-21
- Owner: AI-Agent
- Priority: P0
- Project: `project-005-observability-and-artifacts`
- Sprint: `sprint-001-audit-report-and-replay-baseline`

## 1. 任务目标

落地 Audit Recorder 最小字段与统一事件模型并形成结构化审计写入契约。

## 2. Depends On

1. `DA-049`
2. `DA-050`

## 3. 预期产物

1. `DA-057` audit recorder event model baseline 文档。

## 4. Input References

1. `.repo-ai-governor/context/dev/project-004-agent-adapter-runtime/sprint-002-adapters-and-restricted-network/tasks/TK-039-project-004-exit-acceptance-and-project-005-input-constraints.md` (`DA-049`)
2. `.repo-ai-governor/context/dev/project-004-agent-adapter-runtime/sprint-002-adapters-and-restricted-network/tasks/TK-039-project-005-input-constraints-checklist.md` (`DA-050`)
3. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-master-execution-plan.md`（`4.7` 第 1 项）
4. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`（`9.3` 审计事件最小字段）

## 5. 实施计划

1. 定义 Audit 事件统一 schema 与最小必填字段。
2. 明确事件写入时机、执行上下文回链字段与错误语义。
3. 补齐跨模块字段映射规范，避免事件结构漂移。
4. 输出可消费的基线文档与验证命令。

## 6. 验证计划

1. `pnpm run typecheck`
2. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`
3. `pnpm run check`

## 7. 执行记录

1. 2026-03-21：任务创建，状态初始化为 `planned`。
2. 2026-03-21：任务启动，状态切换为 `in_progress`，开始落地审计事件最小字段契约与 `AuditRecorder` 写入/查询能力。
3. 2026-03-21：完成 `AuditRecorder`、事件模型类型、状态常量与单测覆盖，验证 `pnpm run test:packages -- packages/core-session/test/audit-recorder.unit.test.ts packages/core-session/test/shared-session-manager.unit.test.ts --maxWorkers=1 --maxConcurrency=1` 与 `pnpm run typecheck` 通过。
4. 2026-03-21：完成全门禁校验并同步台账，任务状态切换为 `completed`。

## 8. 产出

1. `DA-057` `.repo-ai-governor/context/dev/project-005-observability-and-artifacts/sprint-001-audit-report-and-replay-baseline/tasks/TK-046-audit-recorder-event-model-and-minimum-fields-baseline.md`
2. `packages/core-session/src/audit-recorder.ts`
3. `packages/core-session/src/constants/audit-recorder.constant.ts`
4. `packages/core-session/src/types/interfaces/audit-recorder.interface.ts`
5. `packages/core-session/test/audit-recorder.unit.test.ts`
