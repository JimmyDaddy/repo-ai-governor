# project-077-session-main-command-model-rollout 计划

- Status: completed
- Date: 2026-04-10
- Stage Mapping: technical solution review / promotion / command-model rollout
- Phase Mapping: solution review and promotion / capability model cutover / review workflow and verify removal / run scope resolution / regression migration and closeout
- Upstream:
  - `.repo-ai-governor/draft/session-main-prompt-first-command-mental-model-and-deterministic-workflow-split-technical-solution.md`
  - `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`
  - `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-orchestration/module-overview.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/module-overview.md`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements.md`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/context/dev/project-076-transport-selection-authority-rollout/plan.md`

## 1. 目标

1. 先把 `technical-solution.session-main-prompt-first-command-model` 从 draft 推进到 approved，再正式提升为独立 active lifecycle solution。
2. promotion 以 `runtime.orchestration` 为 formal source of truth，新增 command-model ADR 与 capability interaction model contract，并对 `runtime.cli-interactive-shell` 做 consumer-facing amendments。
3. 在同一治理窗口内把实现 follow-up 拆成真实 rollout project：`project-077 / sprint-002 ~ sprint-005`。
4. 在 sprint-001 收口前不改写 `project-076` 的 primary stream 与未完成 CR；`project-077` 先作为并行 docs-only governance stream 存在。

## 2. Sprint 细化

## 2.1 sprint-001-solution-review-promotion-and-rollout-decomposition

- Status: completed
- Sprint Goal: 完成 `technical-solution.session-main-prompt-first-command-model` 的 review、promotion 与 rollout decomposition，并把 primary 切换准备到 `project-077 / sprint-002`。
- Task Package: `TK-741`、`TK-742`、`TK-743`

## 2.2 sprint-002-capability-model-and-plan-workflow-cutover

- Status: completed
- Sprint Goal: 冻结 capability interaction model contract，并完成 `/plan` 产品化工作流、`/plan sync` bridge 与 planning routing cutover。
- Task Package: `TK-729`、`TK-730`、`TK-731`

## 2.3 sprint-003-review-workflow-and-verify-removal

- Status: completed
- Sprint Goal: 固化 `/review` 与 `/review verify` 的 AI fixed workflow 语义，并删除 public `/verify` surface。
- Task Package: `TK-744`、`TK-732`、`TK-733`、`TK-734`、`TK-745`

## 2.4 sprint-004-run-scope-resolution-and-routing-cutover

- Status: completed
- Sprint Goal: 收窄 `run` 的 public semantics，并切断 generic implementation ask -> `/run` 的默认桥接。
- Task Package: `TK-735`、`TK-736`、`TK-737`

## 2.5 sprint-005-regression-migration-cleanup-and-project-closeout

- Status: completed
- Sprint Goal: 清除 `/verify` 残余引用、补齐回归矩阵，并完成 `project-077` closeout。
- Task Package: `TK-738`、`TK-739`、`TK-740`

## 3. 任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | status |
|---|---|---|---|---|---|
| TK-741 | sprint-001 | activate project-077 and freeze review-promotion-decomposition scope | governance/bootstrap | approved user plan + current context | completed |
| TK-742 | sprint-001 | review session-main prompt-first command-model solution to approval readiness | docs/review + lifecycle | TK-741 | completed |
| TK-743 | sprint-001 | promote solution and decompose rollout into project-077 implementation sprints | docs/promotion + planning/decomposition | TK-742 | completed |
| TK-729 | sprint-002 | freeze session.main capability interaction model contract | runtime contract / catalog truth | TK-743 | completed |
| TK-730 | sprint-002 | cut over capability catalog explainer and discoverability to the new plan workflow model | orchestration / presenter / docs truth | TK-729 | completed |
| TK-731 | sprint-002 | cut over planning routing and slash surfaces to `/plan` workflow plus `/plan sync` bridge | routing / slash / session.main | TK-730 | completed |
| TK-744 | sprint-003 | activate sprint-003 and close out sprint-002 primary surface | governance / handoff / context routing | CR-001 | completed |
| TK-732 | sprint-003 | fix `/review` and `/review verify` as AI fixed workflows | review lifecycle / routing / presenter | TK-731 | completed |
| TK-733 | sprint-003 | remove public `/verify` command and capability surface | public command removal / migration | TK-732 | completed |
| TK-734 | sprint-003 | add `/verify` removal migration guidance and follow-up routing | explainer / copy / internal gate follow-up | TK-733 | completed |
| TK-745 | sprint-003 | sprint-003 closeout and sprint-004 activation handoff | governance / handoff / context routing | CR-006 | completed |
| TK-735 | sprint-004 | retain `run` as reusable governed execution flow only | command semantics / docs / contract alignment | TK-734 | completed |
| TK-736 | sprint-004 | cut generic implementation asks away from default `/run` handoff | routing / explainer / help | TK-735 | completed |
| TK-737 | sprint-004 | align run presenter CLI wording and architecture wording | presenter / help / docs sync | TK-736 | completed |
| TK-746 | sprint-004 | sprint-004 closeout and sprint-005 activation handoff | governance / handoff / context routing | CR-002 | completed |
| TK-738 | sprint-005 | remove remaining hidden `/verify` shims and docs residue | cleanup / docs / i18n | TK-737 | completed |
| TK-739 | sprint-005 | add end-to-end regressions for plan review run and verify removal paths | regression coverage / integration tests | TK-738 | completed |
| TK-740 | sprint-005 | finalize delivery rollout closeout and project completion audit | closeout / delivery registry / audit | TK-739 | completed |

## 4. 依赖产物策略

1. sprint-001 是 docs-only governance sprint，不进入 `workspace-scoped-cr-loop`。
2. 本项目不并入也不 supersede `technical-solution.interactive-cli-react-style-cli`；本次 promotion 保持独立 `solution_id`。
3. `project-076` 保持原样；本项目只在 `current-context.md` 中追加并行 stream，而不改动其主执行流与遗留 CR。
4. implementation rollout task ids 按用户冻结的 `TK-729 ~ TK-740` 写入后续 sprint-002 ~ sprint-005 计划包；sprint-001 只承载 review/promotion/decomposition 治理任务。
5. public `/verify` removal 只删除 session.main / public CLI discoverability；`runtime.agent-projection` readiness、binding truth 与 internal gate 继续保留。
6. `run` 在本项目内保留，但必须收窄到 reusable governed workflow / task-driven execution flow，不能继续承接 generic implementation ask。

## 5. DoD（project-077）

1. `technical-solution.session-main-prompt-first-command-model` 已具备 canonical review artifact，并推进到 `approved`。
2. formal docs、lifecycle / delivery / module / manifest / triad 更新已同步完成，solution 进入 `active`。
3. `project-077 / sprint-002 ~ sprint-005` 的 plan/tasks/checklist/tasks.csv/task cards 已生成，覆盖 `/plan` 产品化、`/review verify` fixed workflow、public `/verify` removal、`/run` scope narrowing 与最终回归收口。
4. `current-context.md` 已在 sprint-001 完成后把 primary 切换到 `project-077 / sprint-002`，同时保留 `project-076` 并行 stream 不被改写。
5. `workspace-scoped-cr-loop` 将从 `project-077 / sprint-002` 起按 project scope 执行，实现任务每个 clean boundary 都要经过 fresh reviewer sub-agent CR round。

## 6. 里程碑记录

1. 2026-04-10：用户固定 `technical-solution.session-main-prompt-first-command-model` 为独立 lifecycle solution，并要求按 `review -> promotion -> decomposition -> workspace-scoped-cr-loop` 全链路执行。
2. 2026-04-10：创建 `project-077 / sprint-001` docs-only governance stream，并将其登记为与 `project-076` 并行的 active stream。
3. 2026-04-10：完成 `technical-solution.session-main-prompt-first-command-model` promotion cutover，formal landing 固定为 `runtime.orchestration` producer + `runtime.cli-interactive-shell` consumer amendments。
4. 2026-04-10：implementation rollout 任务包已实体化到 `sprint-002 ~ sprint-005`，并通过 `DA-719` 将 primary execution surface 切换到 `project-077 / sprint-002`。
5. 2026-04-10：`sprint-002` 已在 `CR-001` resolved 后完成，`TK-744 / DA-744` 将 primary execution surface 切换到 `project-077 / sprint-003`。
6. 2026-04-10：`sprint-003` 已在 `CR-006` resolved 后完成，`TK-745 / DA-745` 将 primary execution surface 切换到 `project-077 / sprint-004`。
7. 2026-04-10：`sprint-004` 已在 `CR-002` clean recheck 后完成，`TK-746 / DA-746` 将 primary execution surface 切换到 `project-077 / sprint-005`，并将 `TK-738` 激活为新的 implementation boundary。
8. 2026-04-10：`TK-738`、`TK-739` 已完成，`CR-001` 在 fresh reviewer 子 agent clean verdict 后 resolved，`sprint-005` 的 implementation / review boundary 全部收口。
9. 2026-04-10：`TK-740 / DA-740` 已完成 final delivery closeout package 组装并回链 [project-077 completion audit summary](./project-077-session-main-command-model-rollout-completion-audit-summary.md)；当前由 latest project-final clean recheck round 承担 fresh reviewer gate，project 继续保持 `active` 直到最后一轮 reviewer clean resolved。
10. 2026-04-10：`CR-006` clean recheck 已 `resolved`，并修复 final round metadata drift；`project-077 / sprint-005 / TK-740 / delivery` 已同步恢复最终 `completed` 真值，`current-context` 临时保留该 stream 作为 active closeout surface。
11. 2026-04-10：fresh project-final clean round `CR-007` 返回 `CLEAN` verdict，`project-077` completion audit、delivery registry 与 task ledger 已追加 latest clean evidence，项目正式结项。
