# project-035-session-main-supervisor-and-role-subagent-productization 计划

- Status: active
- Date: 2026-03-31
- Stage Mapping: Session.main supervisor path-C follow-up
- Phase Mapping: Technical solution promotion / answer supervisor bootstrap / role-subagent collaboration / streaming and host parity
- Upstream:
  - `.repo-ai-governor/draft/session-main-agent-answer-and-command-handoff-technical-solution.md`
  - `.repo-ai-governor/context/dev/project-033-session-main-agent-runtime-productization/project-033-session-main-agent-runtime-productization-completion-audit-summary.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-orchestration/module-overview.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-orchestration/adrs/session-main-supervisor-and-role-subagent-collaboration.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/module-overview.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/contracts/cli-session-shell-contract.md`

## 1. 目标

1. 将 `session.main supervisor + role subagents / handoffs` draft 正式提升为 lifecycle-managed module docs。
2. 为 `session.main` 建立 path-C 的真实 follow-up execution surface，而不再把 path-A metadata router 误当作最终主 agent 形态。
3. 保持 CLI / future desktop 继续只消费 shared session DTO 与 transcript presenter seam，不旁路 orchestration runtime。
4. 让 connected roles 从静态 projection descriptor 逐步升级为 supervisor 可调度的前台 subagents，同时继续服从 command handoff 与 risk/policy 边界。

## 2. Sprint 细化

## 2.1 sprint-001-technical-solution-promotion-and-phase-map

- Status: completed
- Sprint Goal: 将 `session.main` supervisor 方案正式写回 `runtime.orchestration + runtime.cli-interactive-shell`，并创建后续 bootstrap sprint truth。
- Task Package: `TK-464`。

## 2.2 sprint-002-answer-supervisor-and-role-subagent-bootstrap

- Status: active
- Sprint Goal: productize `session.main` supervisor 的 direct answer bootstrap、single-role subagent path 与 command handoff governance baseline。
- Task Package: `TK-465`、`TK-466`。

## 2.3 sprint-003-role-collaboration-and-handoff-productization

- Status: planned
- Sprint Goal: 将 `session.main` 从单条试点 subagent 扩展到可审计的多 role collaboration，并稳定 natural-language command handoff 的协作与 recap 语义。
- Task Package: `TK-467`、`TK-468`。

## 2.4 sprint-004-streaming-and-host-parity

- Status: planned
- Sprint Goal: 为 supervisor runtime 补齐 streaming、sidecar/desktop host parity 与 remote-role seam 预留。
- Task Package: `TK-469`、`TK-470`。

## 3. 任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | status |
|---|---|---|---|---|---|
| TK-464 | sprint-001 | promote session.main supervisor and role-subagent solution into formal module docs | docs/promotion | `.repo-ai-governor/draft/session-main-agent-answer-and-command-handoff-technical-solution.md` | completed |
| TK-465 | sprint-002 | bootstrap service-owned session.main supervisor and direct answer path | runtime/session-main | TK-464 | planned |
| TK-466 | sprint-002 | productize role-subagent collaboration and command handoff governance baseline | runtime/session-main | TK-465 | planned |
| TK-467 | sprint-003 | stabilize serial role collaboration and interaction-mode routing | runtime/session-main | TK-466 | planned |
| TK-468 | sprint-003 | expand parallel role fan-out and collaboration recap presentation semantics | runtime/session-main | TK-467 | planned |
| TK-469 | sprint-004 | map supervisor streaming events into shared session deltas and running presentation | runtime/session-events | TK-468 | planned |
| TK-470 | sprint-004 | align supervisor runtime across embedded sidecar and desktop consumer hosts | runtime/host-parity | TK-469 | planned |

## 4. 依赖产物策略

1. `project-033` 保留为 path-A productization 的完成态事实链，不因本项目启动而被改写为“方案 C 已实现”。
2. `project-035` 承接的是 path-C 正式方向：`service-owned supervisor + role subagents / handoffs`，并允许 Phase A 先以 bootstrap slice 落地。
3. `runtime.orchestration` 负责 supervisor lifecycle 与 shared session truth；`runtime.cli-interactive-shell` 只负责消费和呈现 turn outcome。
4. `runtime.agent-projection` 继续提供 projection truth；role subagent 只能从 projection 派生，不能反向成为新的 canonical source。
5. `project-035` 不只覆盖前台接入，还显式包含：
   - Phase A：direct answer + single-role bootstrap
   - Phase B：serial/parallel role collaboration + handoff productization
   - Phase C：streaming + embedded/sidecar/desktop parity

## 4.1 激活分层说明

1. `connect`
   - 生成 candidate config 与 companion artifacts
   - 默认 non-mutating，不直接激活活动 role binding
2. `connect apply`
   - 把 candidate 写回活动 `governor.yaml`
   - 从这一步开始，显式命令面与后台 runtime 已可消费新的 `routing.roleBindings`
3. `project-035 / sprint-002`
   - 才开始让前台 `session.main` supervisor 真正消费这些 activated role bindings
   - 第一阶段只要求 direct answer + `1` 条 single-role subagent path
4. `project-035 / sprint-003`
   - 才进入多 role serial/parallel collaboration
5. `project-035 / sprint-004`
   - 再补 streaming、sidecar 与 desktop parity

一句话收口：

1. `connect apply` 激活的是配置真值和后台执行真值。
2. `session.main` 前台直接把 connected roles 当 subagents 调起来，是 `project-035` 的后续 productization 范围。

## 4.2 角色边界说明

1. `session.main main agent`
   - 前台入口 supervisor
   - 决定 direct answer / follow-up / handoff / delegate / collaborate
2. `planner` role
   - 是被 supervisor 调度的专业角色之一
   - 不等于前台 main agent
3. backend workflow planner
   - 属于后台正式流程节点
   - 服务于 `run / workflow / review` 等流程执行，不等于前台对话入口

因此：

1. `main agent` 与 `planner` 不应合并成同一个概念。
2. 更合理的关系是：`main agent = 总控`，`planner = subagent`，`workflow planner = 后台流程节点`。

## 5. DoD（project-035）

1. `session.main supervisor` 方向已在 formal module docs 中明确分配到 `runtime.orchestration` 与 `runtime.cli-interactive-shell`。
2. technical-solution lifecycle / delivery / module-registry / manifest / review / artifact / sprint ledger 已与这次 promotion 保持同步。
3. `project-035` 已明确拆成 4 个 sprint，分别覆盖 promotion、bootstrap、multi-role collaboration 与 streaming/host parity。
4. 至少一条 direct answer path、一条 single-role delegate path、一条 multi-role collaboration path 与一条 host parity path 都已在任务层有明确承接面。
5. delivery registry 不再把这条正式方向误报为“已 rollout 完成”。

## 6. 里程碑记录

1. 2026-03-31：创建 `project-035-session-main-supervisor-and-role-subagent-productization`，承接 `session.main supervisor + role subagents / handoffs` 的技术方案正式化与后续 productization。
2. 2026-03-31：完成 `TK-464`，把 draft 正式写回 `runtime.orchestration` 与 `runtime.cli-interactive-shell` module docs，并同步 lifecycle / delivery / module-registry / manifest / review / artifact。
3. 2026-03-31：创建 planned `sprint-002-answer-supervisor-and-role-subagent-bootstrap`，冻结 `TK-465 ~ TK-466` 作为 direct answer bootstrap 与 role-subagent collaboration follow-up package。
4. 2026-03-31：根据“项目不应只停留在前台接入”的范围校准，新增 planned `sprint-003-role-collaboration-and-handoff-productization` 与 `sprint-004-streaming-and-host-parity`，将 serial/parallel collaboration、streaming 与 host parity 正式写入 roadmap。
5. 2026-03-31：补充激活分层与角色边界说明，明确 `connect apply` 负责激活配置/后台执行真值，而 `session.main` 前台直接使用 connected roles 则从 `sprint-002` 起逐步 productize；同时明确 `main agent`、`planner` role 与 backend workflow planner 的职责分层。
6. 2026-03-31：显式激活 `sprint-002-answer-supervisor-and-role-subagent-bootstrap`，将 `project-035` 的主执行面从 promotion closeout 切换到 Phase A bootstrap implementation。
7. 2026-03-31：完成 `TK-465`；`session.main` bootstrap 现已具备真实 direct answer、shared session `interactionMode` 元数据回灌，以及 CLI/resume direct-answer parity 证据。
