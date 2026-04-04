# TK-514 activate project-041 and freeze desktop planning constraints

- Status: completed
- Date: 2026-04-04
- Owner: AI-Agent
- Priority: P0
- Project: `project-041-desktop-surface-tech-selection-and-design`
- Sprint: `sprint-001-codex-reference-research-and-shell-selection`

## 1. 任务目标

创建新的桌面端 planning stream，并在不覆盖现有 primary closeout surface 的前提下，将本次工作挂入 `current-context.md` 的并行 active stream，同时冻结本轮选型必须遵守的仓库内约束。

## 2. Depends On

1. `.repo-ai-governor/context/current-context.md`
2. `.repo-ai-governor/normative_knowledge_sources/product-requirements.md`
3. `integrations/desktop/README.md`

## 3. 预期产物

1. 更新后的 `.repo-ai-governor/context/current-context.md`
2. `project-041 / sprint-001` skeleton 与 task ledger 基线

## 4. Required Inputs

1. `.repo-ai-governor/context/current-context.md`
2. `.repo-ai-governor/normative_knowledge_sources/product-requirements.md`
3. `.repo-ai-governor/context/dev/project-014-langgraph-orchestration-runtime-adoption/sprint-001-runtime-adoption-and-migration-baseline/tasks/TK-144-shared-local-orchestration-service-cli-desktop-contract-baseline.md`
4. `.repo-ai-governor/context/dev/project-014-langgraph-orchestration-runtime-adoption/sprint-003-service-backed-execution-and-desktop-transport/tasks/TK-154-orchestration-service-client-transport-neutral-streaming-and-desktop-ready-dto-hardening.md`
5. `.repo-ai-governor/context/dev/project-015-memory-provider-pluginization/sprint-004-shared-loader-and-service-reuse/plan.md`
6. `.repo-ai-governor/context/dev/project-030-runtime-agent-projection-phase-2-productization/sprint-004-ui-consumer-and-rollout-closeout/tasks/TK-428.md`
7. `integrations/desktop/README.md`
8. `integrations/desktop/examples/README.md`

## 5. Development Verification

1. docs/ledger bootstrap only；不涉及 executable code

## 6. Delivery Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `node ./scripts/governance/check-worktree-review-target.js`

## 7. 执行记录

1. 2026-04-04：任务创建，状态初始化为 `planned`。
2. 2026-04-04：执行过程中发现 `current-context.md` 已被另一条 closeout 工作流切到 `project-040-task-ledger-sqlite-canonical-truth-cutover`。
3. 2026-04-04：为避免覆盖现有 primary，本任务将桌面端选型流改为并行 active stream，并顺延编号为 `project-041`。
4. 2026-04-04：冻结本轮 planning 的内部硬约束：继续复用 `sidecar + ipc`、`@repo-ai-governor/orchestration-service-client` DTO/event seam、shared `AgentProjectionPanelViewModel`，desktop renderer 不得直接拥有 runtime internals。

## 8. 产出

1. `.repo-ai-governor/context/current-context.md`
2. `.repo-ai-governor/context/dev/project-041-desktop-surface-tech-selection-and-design/plan.md`
3. `.repo-ai-governor/context/dev/project-041-desktop-surface-tech-selection-and-design/sprint-001-codex-reference-research-and-shell-selection/plan.md`
