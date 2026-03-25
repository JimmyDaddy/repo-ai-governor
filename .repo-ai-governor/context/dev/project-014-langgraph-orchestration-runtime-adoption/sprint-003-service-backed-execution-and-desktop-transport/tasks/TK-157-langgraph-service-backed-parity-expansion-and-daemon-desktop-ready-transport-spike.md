# TK-157 LangGraph service-backed parity 扩围与 daemon/desktop-ready transport spike

- Status: completed
- Date: 2026-03-25
- Owner: AI-Agent
- Priority: P0
- Project: `project-014-langgraph-orchestration-runtime-adoption`
- Sprint: `sprint-003-service-backed-execution-and-desktop-transport`

## 1. 任务目标

将 `LangGraph` cutover parity 从 sprint-002 的 in-process shell 路径扩围到 service-backed execution 路径，并验证 daemon/desktop-ready transport seam 的最小可行形态。

## 2. Depends On

1. `TK-153`
2. `TK-154`
3. `TK-155`
4. `TK-156`
5. `DA-145`
6. `DA-152`

## 3. 预期产物

1. `DA-157` LangGraph service-backed parity 扩围与 daemon/desktop-ready transport spike。

## 4. Required Inputs

1. `.repo-ai-governor/context/dev/project-014-langgraph-orchestration-runtime-adoption/sprint-001-runtime-adoption-and-migration-baseline/tasks/DA-145-langgraph-phase-0-spike-dual-runtime-parity-and-rollout-plan.md`
2. `.repo-ai-governor/context/dev/project-014-langgraph-orchestration-runtime-adoption/sprint-002-langgraph-phase0-spike-and-service-shell/tasks/DA-148-process-runtime-facade-backend-selector-and-cutover-parity-harness-baseline.md`
3. `.repo-ai-governor/context/dev/project-014-langgraph-orchestration-runtime-adoption/sprint-002-langgraph-phase0-spike-and-service-shell/tasks/DA-152-sprint-002-exit-acceptance-and-sprint-003-input-constraints.md`
4. `.repo-ai-governor/context/dev/project-014-langgraph-orchestration-runtime-adoption/sprint-003-service-backed-execution-and-desktop-transport/tasks/TK-154-orchestration-service-client-transport-neutral-streaming-and-desktop-ready-dto-hardening.md`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-014-langgraph-orchestration-runtime-adoption/plan.md`
2. `.repo-ai-governor/context/dev/project-014-langgraph-orchestration-runtime-adoption/sprint-003-service-backed-execution-and-desktop-transport/plan.md`
3. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`
4. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-master-execution-plan.md`

## 6. 实施计划

1. 将 parity compare 的比较面扩围到 service-backed execution 输出、event stream、checkpoint/recovery 与 HITL lifecycle。
2. 验证 daemon-ready 或 desktop-ready transport seam 的最小 host 模型，但不在本任务内做完整独立进程产品化。
3. 明确 legacy comparison path 的保留/移除条件，避免 cutover 验证长期悬挂。
4. 产出 `DA-157`，记录 service-backed parity 结论与 transport spike 的后续 rollout 约束。

## 7. Development Verification

1. `pnpm -s tsc -p tsconfig.json --noEmit`

## 8. Delivery Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `pnpm run check`

## 9. 执行记录

1. 2026-03-25：任务创建，状态初始化为 `planned`。
2. 2026-03-25：状态切换为 `in_progress`，开始冻结 service-backed parity compare 面、daemon/desktop-ready transport spike 选项与 `TK-156` 依赖阻断边界。
3. 2026-03-25：已产出 `DA-157` 滚动草案；当前比较面和 transport seam 已冻结，但最终 parity 结论仍阻塞于 `TK-156` 的 CLI service-client cutover。
4. 2026-03-25：已完成 service-backed parity 扩围与 transport spike 收口，新增 orchestration service provider seam、sidecar/ipc 与 daemon/http host descriptor unit smoke、`run/review/review-verify` 的 service-backed parity integration 覆盖，并将 `DA-157` 与 review 收口为最终结论。

## 10. 产出

1. `DA-157` `.repo-ai-governor/context/dev/project-014-langgraph-orchestration-runtime-adoption/sprint-003-service-backed-execution-and-desktop-transport/tasks/DA-157-langgraph-service-backed-parity-expansion-and-daemon-desktop-ready-transport-spike.md`
