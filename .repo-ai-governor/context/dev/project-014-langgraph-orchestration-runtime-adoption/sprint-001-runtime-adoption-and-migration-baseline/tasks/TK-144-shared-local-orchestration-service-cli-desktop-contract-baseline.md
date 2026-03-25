# TK-144 shared local orchestration service（CLI + desktop）契约基线

- Status: completed
- Date: 2026-03-25
- Owner: AI-Agent
- Priority: P0
- Project: `project-014-langgraph-orchestration-runtime-adoption`
- Sprint: `sprint-001-runtime-adoption-and-migration-baseline`

## 1. 任务目标

冻结 `CLI` 与未来 `desktop client` 共用的 `shared local orchestration service` 的接口边界、状态所有权、streaming/HITL/resume 路径与部署形态约束。

## 2. Depends On

1. `TK-142`
2. `DA-142`
3. `TK-143`
4. `DA-143`

## 3. 预期产物

1. `DA-144` shared local orchestration service 契约基线。

## 4. Required Inputs

1. `.repo-ai-governor/context/dev/project-014-langgraph-orchestration-runtime-adoption/sprint-001-runtime-adoption-and-migration-baseline/tasks/DA-142-langgraph-runtime-adoption-and-migration-baseline.md`
2. `.repo-ai-governor/context/dev/project-014-langgraph-orchestration-runtime-adoption/sprint-001-runtime-adoption-and-migration-baseline/tasks/DA-143-process-runtime-to-langgraph-adapter-boundary-and-state-contract-baseline.md`
3. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`
4. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md`
5. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-master-execution-plan.md`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-013-remote-provider-and-adapter-ops/project-013-remote-provider-and-adapter-ops-completion-audit-summary.md`
2. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/project-010-local-model-and-ide-expansion-completion-audit-summary.md`
3. `.repo-ai-governor/draft/langgraph-orchestration-technical-solution.md`

## 6. 实施计划

1. 定义 service owner、CLI client、desktop client 的职责与状态边界。
2. 定义执行 API、streaming API、HITL resume API、execution list/recovery API 的最小合同。
3. 冻结本地部署假设、进程模型、Node/runtime 约束与 sidecar/service 备选路径。
4. 产出 `DA-144` 并作为后续 runtime modernization 的服务边界输入。

## 7. Development Verification

1. `pnpm -s tsc -p tsconfig.json --noEmit`

## 8. Delivery Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `pnpm run check`

## 9. 执行记录

1. 2026-03-25：任务创建，状态初始化为 `planned`。
2. 2026-03-25：完成 `DA-144`，已冻结 service owner、CLI/desktop client、execution/streaming/HITL/recovery API、部署形态与单一 runtime owner 约束。

## 10. 产出

1. `DA-144` `.repo-ai-governor/context/dev/project-014-langgraph-orchestration-runtime-adoption/sprint-001-runtime-adoption-and-migration-baseline/tasks/DA-144-shared-local-orchestration-service-cli-desktop-contract-baseline.md`
