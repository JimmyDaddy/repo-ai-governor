# project-030-runtime-agent-projection-phase-2-productization 计划

- Status: active
- Date: 2026-03-30
- Stage Mapping: Runtime agent projection phase-2 productization follow-up
- Phase Mapping: technical solution / connect apply / smoke gate and presenters / UI consumer
- Upstream:
  - `.repo-ai-governor/draft/runtime-agent-projection-phase-2-productization-technical-solution.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/module-overview.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-onboarding-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-projection-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/multi-tool-onboarding-and-role-agent-projection-cutover.md`
  - `.repo-ai-governor/context/dev/project-028-multi-ai-tools-onboarding-role-agent-projection/project-028-multi-ai-tools-onboarding-role-agent-projection-completion-audit-summary.md`

## 1. 目标

1. 为 `runtime.agent-projection` 补齐 phase-2 productization 方案，解决 `connect` 只有 candidate 而无官方 apply 的 adopter 断点。
2. 为 candidate config 增加 diff / merge explain 与 rollback-safe apply 路径，避免用户手工比对并直接覆写活动 `governor.yaml`。
3. 强化 `connect -> doctor -> verify -> run --dry-run --trace` 的 adopter smoke gate，并补充真实外部仓库演练自动化。
4. 提升 `agentView` 的 presenter 语义，并为 desktop / richer UI 增加一个正式 consumer baseline。

## 2. Sprint 细化

## 2.1 sprint-001-technical-solution-and-phase-map

- Status: completed
- Sprint Goal: 产出 phase-2 technical solution draft、完成 formal promotion cutover，并落地 project activation baseline 与 implementation phase map。
- Task Package: `TK-422`、`TK-423`、`TK-442`。

## 2.2 sprint-002-connect-apply-and-diagnostics-contract

- Status: completed
- Sprint Goal: 实现 `connect diff` / `connect apply`、rollback snapshot 与 diff / merge explain artifacts。
- Task Package: `TK-424`、`TK-425`。

## 2.3 sprint-003-smoke-gate-and-agent-view-presentation

- Status: completed
- Sprint Goal: 强化 adopter smoke gate，并把 `agentView` presenter 升级到 CLI pretty / session shell。
- Task Package: `TK-426`、`TK-427`。

## 2.4 sprint-004-ui-consumer-and-rollout-closeout

- Status: planned
- Sprint Goal: 增加一个正式 UI consumer baseline，并完成 docs / review / rollout closeout。
- Task Package: `TK-428`、`TK-429`。

## 3. 任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | status |
|---|---|---|---|---|---|
| TK-422 | sprint-001 | draft runtime-agent-projection phase-2 technical solution | docs/technical-solution | `.repo-ai-governor/context/dev/project-028-multi-ai-tools-onboarding-role-agent-projection/project-028-multi-ai-tools-onboarding-role-agent-projection-completion-audit-summary.md` | completed |
| TK-423 | sprint-001 | activate follow-up project and phase map | planning/governance | TK-422 | completed |
| TK-442 | sprint-001 | promote runtime-agent-projection phase-2 technical solution into formal module docs | docs/promotion | TK-422,TK-423 | completed |
| TK-424 | sprint-002 | implement connect diff, apply, and rollback receipt workflow | runtime/connect-apply | TK-423 | completed |
| TK-425 | sprint-002 | emit candidate diff and merge explain artifacts | runtime/diagnostics | TK-424 | completed |
| TK-426 | sprint-003 | strengthen adopter onboarding smoke gate and external repo rehearsal automation | verification/adoption | TK-424,TK-425 | completed |
| TK-427 | sprint-003 | enrich agentView presenter in pretty and session-shell surfaces | cli/presenter | TK-425 | completed |
| TK-428 | sprint-004 | add formal UI consumer baseline for desktop and richer UI surfaces | ui/consumer | TK-427 | planned |
| TK-429 | sprint-004 | close docs, review, and rollout evidence for phase-2 productization | docs/rollout | TK-426,TK-427,TK-428 | planned |

## 4. 依赖产物策略

1. `project-030` 默认消费正式 `runtime.agent-projection` module docs，以及新的 phase-2 draft。
2. `sprint-001` 先完成 phase-2 draft 的 formal promotion cutover，再由后续 sprint 承接 implementation 与 adopter productization。
3. 本项目承接 follow-up implementation 与 adopter productization，不回退或改写 project-028 的 completed truth。
4. 任务编号固定保留在 `TK-422 ~ TK-429` 与 `TK-442`，避免与 `project-028` / `project-029` / `project-031` 已占用号段冲突。

## 4.1 推荐执行顺序

1. `project-030 / sprint-002` 与 `sprint-003` 应先于 `project-031` 执行，优先补齐 `connect apply`、candidate diff / merge explain、adopter smoke gate 与 shared `agentView` presenter。
2. `project-031` 再承接 Ink-owned input productization，这样 session shell 可以直接消费已经稳定的 projection / presenter 语义，避免输入层与展示层并行重构。
3. `project-030 / sprint-004` 推荐在 `project-031` 默认 cutover 后执行，以便 formal UI consumer baseline 优先复用新的 session shell surface，而不是落到即将过时的旧前台输入结构。
4. 综上，锁定跨项目执行顺序为 `project-030 / sprint-002 -> project-030 / sprint-003 -> project-031 / sprint-001~004 -> project-030 / sprint-004`。

## 5. DoD（project-030）

1. `connect` 具备显式 candidate apply 路径，且 apply 默认可回滚、可审计、可验证。
2. candidate config 具备稳定的 diff / merge explain artifacts 与 human-readable summary。
3. adopter smoke gate 能稳定覆盖 `connect -> doctor -> verify -> run --dry-run --trace` 全链路。
4. `agentView` 在 CLI pretty / session shell 中可以直观看到 `selected_by`、fallback 原因与 capability gap。
5. 至少有一个正式 UI consumer baseline 可以消费 projection view-model，而不是只停留在数据面 ready。
6. `runtime.agent-projection` 的 phase-2 方案已正式写回 lifecycle-managed module docs、registry 与 manifest。

## 6. 里程碑记录

1. 2026-03-30：创建 `project-030-runtime-agent-projection-phase-2-productization`，作为 `runtime.agent-projection` 的 phase-2 follow-up stream。
2. 2026-03-30：完成 `TK-422 ~ TK-423`，产出 phase-2 technical solution draft、implementation phase map，并将 `current-context.md` primary stream 从 `project-028 / sprint-004` closeout surface 切换到 `project-030 / sprint-001`。
3. 2026-03-30：完成 `TK-442`，将 phase-2 draft 正式提升到 `runtime.agent-projection` lifecycle-managed module docs，并完成 lifecycle / delivery / module-registry / manifest / artifact / review 同步。
4. 2026-03-30：完成 `project-030` 与 `project-031` 的跨项目优先级复核，锁定推荐执行顺序为 `project-030 sprint-002/003 -> project-031 -> project-030 sprint-004`。
5. 2026-03-30：激活 `sprint-002-connect-apply-and-diagnostics-contract`，建立 `sprint-002` / `sprint-003` task ledger，开始执行 `TK-424 ~ TK-427`。
6. 2026-03-30：完成 `sprint-002` 与 `sprint-003`，落地 `connect diff/apply`、candidate diff/merge explain、adopter smoke automation 与 shared agentView presenter；`project-030` 下一条待执行流切换为 `sprint-004-ui-consumer-and-rollout-closeout`。
7. 2026-03-30：`project-031 / sprint-001` 已激活；`project-030 / sprint-003` closeout surface 从 `current-context.md` 移除并迁入 completed history，保留 `sprint-004` 为 planned follow-up。
