# TK-047 Report Builder 与 Replay/Explain 基线

- Status: completed
- Date: 2026-03-21
- Owner: AI-Agent
- Priority: P0
- Project: `project-005-observability-and-artifacts`
- Sprint: `sprint-001-audit-report-and-replay-baseline`

## 1. 任务目标

落地 Report Builder 与 Replay/Explain 能力并建立可回放定位链路。

## 2. Depends On

1. `TK-046`
2. `DA-057`

## 3. 预期产物

1. `DA-058` report builder and replay explain baseline 文档。

## 4. Input References

1. `.repo-ai-governor/context/dev/project-005-observability-and-artifacts/sprint-001-audit-report-and-replay-baseline/tasks/TK-046-audit-recorder-event-model-and-minimum-fields-baseline.md` (`DA-057`)
2. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-master-execution-plan.md`（`4.7` 第 2 项）
3. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`（报告与回放能力说明）

## 5. 实施计划

1. 定义报告聚合模型与解释输出结构。
2. 建立 replay 输入、回放快照与定位索引约定。
3. 打通 execution/session 维度的证据回链语义。
4. 输出回放链路最小验证样例。

## 6. 验证计划

1. `pnpm run typecheck`
2. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`
3. `pnpm run check`

## 7. 执行记录

1. 2026-03-21：任务创建，状态初始化为 `planned`。
2. 2026-03-21：任务启动，状态切换为 `in_progress`，开始落地 `ReportBuilder` 与 `ReplayExplainer` 基线能力。
3. 2026-03-21：完成 `packages/reporting` 基线实现（报告聚合、回放索引与 explain 输出）并补齐 `report-builder/replay-explainer` 单测。
4. 2026-03-21：完成 `pnpm run test:packages -- packages/reporting/test/report-builder.unit.test.ts packages/reporting/test/replay-explainer.unit.test.ts --maxWorkers=1 --maxConcurrency=1`、`pnpm run typecheck`、`pnpm run check` 验证并切换任务为 `completed`。

## 8. 产出

1. `DA-058` `.repo-ai-governor/context/dev/project-005-observability-and-artifacts/sprint-001-audit-report-and-replay-baseline/tasks/TK-047-report-builder-and-replay-explain-baseline.md`
2. `packages/reporting/src/report-builder.ts`
3. `packages/reporting/src/replay-explainer.ts`
4. `packages/reporting/test/report-builder.unit.test.ts`
5. `packages/reporting/test/replay-explainer.unit.test.ts`
