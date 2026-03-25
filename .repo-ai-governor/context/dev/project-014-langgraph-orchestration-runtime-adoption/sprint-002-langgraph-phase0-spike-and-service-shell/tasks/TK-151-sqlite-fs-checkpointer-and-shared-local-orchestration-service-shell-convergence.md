# TK-151 `sqlite-fs` checkpointer 与 shared local orchestration service shell 收敛

- Status: planned
- Date: 2026-03-25
- Owner: AI-Agent
- Priority: P0
- Project: `project-014-langgraph-orchestration-runtime-adoption`
- Sprint: `sprint-002-langgraph-phase0-spike-and-service-shell`

## 1. 任务目标

将 checkpoint 路径收敛到 `sqlite-fs`，并建立 shared local orchestration service 的第一轮 service shell 基线。

## 2. Depends On

1. `TK-148`
2. `TK-149`
3. `TK-150`
4. `DA-144`
5. `DA-145`
6. `DA-146`
7. `DA-149`
8. `DA-150`

## 3. 预期产物

1. `DA-151` `sqlite-fs` checkpointer 与 shared local orchestration service shell 收敛。

## 4. Required Inputs

1. `.repo-ai-governor/context/dev/project-014-langgraph-orchestration-runtime-adoption/sprint-001-runtime-adoption-and-migration-baseline/tasks/DA-144-shared-local-orchestration-service-cli-desktop-contract-baseline.md`
2. `.repo-ai-governor/context/dev/project-014-langgraph-orchestration-runtime-adoption/sprint-001-runtime-adoption-and-migration-baseline/tasks/DA-145-langgraph-phase-0-spike-dual-runtime-parity-and-rollout-plan.md`
3. `.repo-ai-governor/context/dev/project-014-langgraph-orchestration-runtime-adoption/sprint-001-runtime-adoption-and-migration-baseline/tasks/DA-146-sprint-001-exit-acceptance-and-sprint-002-input-constraints.md`
4. `.repo-ai-governor/context/dev/project-014-langgraph-orchestration-runtime-adoption/sprint-002-langgraph-phase0-spike-and-service-shell/tasks/DA-149-file-backed-checkpointer-and-recovery-smoke-baseline.md`
5. `.repo-ai-governor/context/dev/project-014-langgraph-orchestration-runtime-adoption/sprint-002-langgraph-phase0-spike-and-service-shell/tasks/DA-150-langgraph-run-review-hitl-minimal-mainchain-integration.md`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-014-langgraph-orchestration-runtime-adoption/plan.md`
2. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-master-execution-plan.md`
3. `.repo-ai-governor/context/dev/project-014-langgraph-orchestration-runtime-adoption/sprint-002-langgraph-phase0-spike-and-service-shell/plan.md`

## 6. 实施计划

1. 将 checkpoint/provider 路径升级到 `sqlite-fs`，保持 execution/session/recovery 语义一致。
2. 新建 shared local orchestration service shell，先覆盖 `run` 主链所需的最小 execution、streaming、HITL、recovery 入口。
3. 保证 CLI 继续只是 client/presenter，不让 runtime 主状态回流到命令层。
4. 产出 `DA-151`，固定 `sqlite-fs`、service shell 与后续 desktop client 复用边界。

## 7. Development Verification

1. `pnpm -s tsc -p tsconfig.json --noEmit`

## 8. Delivery Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `pnpm run check`

## 9. 执行记录

1. 2026-03-25：任务创建，状态初始化为 `planned`。

## 10. 产出

1. `DA-151` `.repo-ai-governor/context/dev/project-014-langgraph-orchestration-runtime-adoption/sprint-002-langgraph-phase0-spike-and-service-shell/tasks/DA-151-sqlite-fs-checkpointer-and-shared-local-orchestration-service-shell-convergence.md`
