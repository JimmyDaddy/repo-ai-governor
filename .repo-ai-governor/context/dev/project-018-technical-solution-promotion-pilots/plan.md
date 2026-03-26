# project-018-technical-solution-promotion-pilots 计划

- Status: completed
- Date: 2026-03-26
- Stage Mapping: Cross-stage normative consumption follow-up
- Phase Mapping: Technical Solution Promotion / Consumption Proof

## 1. 目标

1. 使用真实 `draft` 执行一次端到端 promotion，验证 lifecycle/module/manifest/ledger workflow 不是空壳。
2. 将 `memory-provider-pluginization` 方案从“仅存在于 draft + project-015 证据链”提升为 lifecycle-managed final solution。
3. 把 active closeout surface 从已完成的 `project-017` 切换到显式 promotion pilot stream，避免 completed project 长期占用默认执行面。
4. 对不满足 promotion 条件的 draft，产出正式的 prepare-promotion readiness 与 blocker register，避免把错误边界直接推进到 final。
5. 对“formal docs 已存在但 lifecycle 未激活”的历史 draft 执行 promotion backfill，验证 promotion workflow 也能安全消费遗留方案。
6. 当 runtime/package truthfulness 与新的产品预期发生偏移时，通过 follow-up sprint 收敛 hard dependency、runtime contract 说明与 distribution truthfulness。

## 2. Sprint 细化

## 2.1 sprint-001-memory-provider-pluginization-promotion-pilot

- Status: completed
- Sprint Goal: 以 `memory-provider-pluginization-technical-solution.md` 为真实 promotion 试点，补齐 `runtime.memory-provider-loading` 的正式文档表达，并将对应 lifecycle entry 切换到 `active`。
- Task Package: `TK-198`、`TK-199`、`TK-200`、`TK-201`。
- Exit Criteria:
  1. `project-018` skeleton 已建立，`current-context.md` 已切换到 promotion pilot stream，并将 `project-017 / sprint-004` 迁入 completed history。
  2. `runtime.memory-provider-loading` 的正式模块文档已吸收 plugin policy、resolution priority 与 distribution truthfulness。
  3. `technical-solution.memory-provider-pluginization` 已写入 review evidence、final paths 与 activation metadata，并切换到 `active`。
  4. promotion 所需 lifecycle/module/manifest/ledger gates 已通过，并生成项目完成态审计摘要。

## 2.2 sprint-002-memory-module-promotion-readiness

- Status: completed
- Sprint Goal: 对 `memory-module-technical-solution.md` 执行 prepare-promotion，明确其应该落到新的 memory semantics 模块，而不是继续指向 `runtime.memory-provider-loading`。
- Task Package: `TK-202`、`TK-203`、`TK-204`、`TK-205`。
- Exit Criteria:
  1. `project-018` 已在 reopen 后切换到 `sprint-002`，并将 `sprint-001` 迁入 completed history。
  2. 已形成 `memory-module` 的 bounded-context assessment，明确推荐的新模块边界与依赖关系。
  3. 已形成正式的 prepare-promotion readiness 与 blocker register，明确为什么当前不能直接 promote。
4. sprint-002 验收与 `project-018` 再次 closeout 已完成。

## 2.3 sprint-003-langgraph-orchestration-promotion-backfill

- Status: completed
- Sprint Goal: 将 `.repo-ai-governor/draft/langgraph-orchestration-technical-solution.md` 从 archived draft backfill 为 lifecycle-managed final solution，并明确其 formal landing zone 为 `runtime.orchestration`。
- Task Package: `TK-206`、`TK-207`、`TK-208`、`TK-209`。
- Exit Criteria:
  1. `project-018` 已在 reopen 后切换到 `sprint-003`，并将 `sprint-002` 迁入 completed history。
  2. `runtime.orchestration` 的正式模块文档已明确承载 LangGraph primary path、parity harness 退回迁移工具、`sidecar + ipc` baseline、`daemon + http` optional follow-up 与 checkpoint/thread state 非 canonical source 约束。
  3. `technical-solution.langgraph-orchestration-direction` 已具备 review evidence、final paths 与 activation metadata，并从 `archived` 切换为 `active`。
  4. lifecycle/module/manifest/task/review/artifact gates 已通过，并生成新的 project-018 完成态审计摘要。

## 2.4 sprint-004-langgraph-hard-dependency-truthfulness-cutover

- Status: completed
- Sprint Goal: 将 `core-runtime-langgraph` 从 `optional peer + binding seam` 收敛为 direct dependency baseline，并同步 bundled vendor contract verification 的 truthfulness 口径。
- Task Package: `TK-210`、`TK-211`、`TK-212`、`TK-213`。
- Exit Criteria:
  1. `project-018` 已在 reopen 后切换到 `sprint-004`，并将 `sprint-003` 迁入 completed history。
  2. `packages/core-runtime-langgraph/package.json` 与 `pnpm-lock.yaml` 已将 `@langchain/langgraph` 收敛为 direct dependency。
  3. `LangGraphCommunityVendorBinding`、相关类型、测试与 README 已从 optional peer 语义切换到 bundled dependency contract verification。
  4. task/review/artifact gates 已通过，并生成新的 project-018 完成态审计摘要。

## 3. 任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | status |
|---|---|---|---|---|---|
| TK-198 | sprint-001 | project-018 激活与 memory-provider promotion pilot handoff | bootstrap/governance | project-017 completion,project-015 completion audit | completed |
| TK-199 | sprint-001 | runtime.memory-provider-loading 正式文档回填与 promotion doc cutover | runtime/docs | TK-198,DA-175,DA-176,.repo-ai-governor/draft/memory-provider-pluginization-technical-solution.md | completed |
| TK-200 | sprint-001 | memory-provider technical solution lifecycle、module-registry 与 manifest promotion cutover | governance/docs | TK-199,DA-171,DA-173,DA-177 | completed |
| TK-201 | sprint-001 | sprint-001 出口验收与 project-018 completion assessment | acceptance/baseline | TK-198,TK-199,TK-200,DA-198,DA-199,DA-200 | completed |
| TK-202 | sprint-002 | sprint-002 激活与 project-018 reopen handoff | bootstrap/governance | DA-201,project-018 sprint-001 completion audit | completed |
| TK-203 | sprint-002 | memory-module bounded-context assessment 与 target-module realignment recommendation | architecture/docs | TK-202,.repo-ai-governor/draft/memory-module-technical-solution.md,.repo-ai-governor/draft/memory-module-community-practices-and-design-reference.md | completed |
| TK-204 | sprint-002 | memory-module prepare-promotion readiness baseline 与 blocker register | governance/baseline | TK-203,DA-203 | completed |
| TK-205 | sprint-002 | sprint-002 出口验收与 project-018 re-closeout | acceptance/baseline | TK-202,TK-203,TK-204,DA-202,DA-203,DA-204 | completed |
| TK-206 | sprint-003 | sprint-003 激活与 project-018 reopen handoff | bootstrap/governance | DA-205,project-018 sprint-002 completion audit | completed |
| TK-207 | sprint-003 | runtime.orchestration 正式文档对齐与 LangGraph promotion evidence backfill | runtime/docs | TK-206,.repo-ai-governor/draft/langgraph-orchestration-technical-solution.md,project-014 completion,project-016 completion | completed |
| TK-208 | sprint-003 | LangGraph technical solution lifecycle promotion cutover | governance/docs | TK-207,DA-207,resolved_code_review_working-tree-20260325-1314.md | completed |
| TK-209 | sprint-003 | sprint-003 出口验收与 project-018 final re-closeout | acceptance/baseline | TK-206,TK-207,TK-208,DA-206,DA-207,DA-208 | completed |
| TK-210 | sprint-004 | sprint-004 激活与 project-018 reopen handoff | bootstrap/governance | DA-209,project-018 sprint-003 completion audit | completed |
| TK-211 | sprint-004 | core-runtime-langgraph 直连依赖切换与 vendor binding contract 对齐 | runtime/package | TK-210,packages/core-runtime-langgraph/package.json,pnpm-lock.yaml | completed |
| TK-212 | sprint-004 | LangGraph package truthfulness 文档与 rollout 约束同步 | docs/governance | TK-211,DA-211,project-016 completion | completed |
| TK-213 | sprint-004 | sprint-004 出口验收与 project-018 re-closeout | acceptance/baseline | TK-210,TK-211,TK-212,DA-210,DA-211,DA-212 | completed |

## 4. 依赖产物策略

1. `project-018` 启动默认消费：
   - `.repo-ai-governor/draft/memory-provider-pluginization-technical-solution.md`
   - `project-015-memory-provider-pluginization-completion-audit-summary.md`
   - `DA-171`
   - `DA-172`
   - `DA-173`
   - `DA-175`
   - `DA-176`
   - `DA-177`
   - `DA-197`
2. `sprint-002` reopen 额外消费：
   - `.repo-ai-governor/draft/memory-module-technical-solution.md`
   - `.repo-ai-governor/draft/memory-module-community-practices-and-design-reference.md`
   - `DA-201`
3. `sprint-003` reopen 额外消费：
   - `.repo-ai-governor/draft/langgraph-orchestration-technical-solution.md`
   - `project-014-langgraph-orchestration-runtime-adoption-completion-audit-summary.md`
   - `project-016-langgraph-runtime-productization-completion-audit-summary.md`
   - `DA-205`
4. `sprint-004` reopen 额外消费：
   - `DA-209`
   - `project-016-langgraph-runtime-productization-completion-audit-summary.md`
   - `packages/core-runtime-langgraph/package.json`
   - `packages/core-runtime-langgraph/src/langgraph-community-vendor-binding.ts`
5. 本项目只做真实 promotion pilot、promotion backfill、truthfulness follow-up 与 prepare-promotion readiness，不重写既有实现 history。

## 5. DoD（project-018）

1. 至少 2 份真实 draft 已完成 promotion，其中至少 1 份属于“formal docs 已存在但 lifecycle 未激活”的历史 backfill 场景。
2. `runtime.memory-provider-loading` 的正式文档已覆盖 plugin policy、resolution source 与 distribution truthfulness。
3. `runtime.orchestration` 已成为 LangGraph 历史 draft 的正式 landing zone，并明确 graph-first primary path、host surface baseline 与 canonical-source 边界。
4. `core-runtime-langgraph` 的 package/runtime truthfulness 已与“默认随包分发 `@langchain/langgraph`”的新产品预期对齐，同时不伪造“官方 vendor execution 内核已完全接管”的错误语义。
5. `technical-solution-lifecycle-registry.yaml`、`technical-solution-module-registry.yaml`、`normative-loading-manifest.yaml`、task ledger、review 与 artifact registry 保持同步。
6. 对尚未具备 promotion 条件的 draft，已形成结构化 blocker register，而不是错误地强行切成 final。
7. `current-context / completed history / projects overview / master execution plan / dev index` 与实际 active surface 完全同步。

## 6. 里程碑记录

1. 2026-03-26：创建 `project-018-technical-solution-promotion-pilots`，将 `project-017 / sprint-004` 从 active closeout surface 迁入 completed history，并切换到 `sprint-001-memory-provider-pluginization-promotion-pilot`。
2. 2026-03-26：通过 `TK-199 / DA-199` 回填 `runtime.memory-provider-loading` 的正式模块文档，使其覆盖 plugin policy、resolution priority 与 distribution truthfulness。
3. 2026-03-26：通过 `TK-200 / DA-200` 完成 `technical-solution.memory-provider-pluginization` 的 lifecycle promotion cutover，并同步 module registry / manifest。
4. 2026-03-26：通过 `TK-201 / DA-201` 完成 sprint-001 验收与 `project-018` 完成态审计。
5. 2026-03-26：reopen `project-018` 执行 `sprint-002-memory-module-promotion-readiness`，形成 `DA-202` ~ `DA-205`、`memory-module` 的 bounded-context assessment 与 prepare-promotion blocker baseline，并产出新的项目完成态审计摘要 `project-018-technical-solution-promotion-pilots-completion-audit-summary-sprint-002-memory-module-readiness.md`。
6. 2026-03-26：reopen `project-018` 执行 `sprint-003-langgraph-orchestration-promotion-backfill`，完成 `DA-206` ~ `DA-209`、`technical-solution.langgraph-orchestration-direction` 的 lifecycle promotion cutover，并产出新的项目完成态审计摘要 `project-018-technical-solution-promotion-pilots-completion-audit-summary-sprint-003-langgraph-orchestration-promotion-backfill.md`。
7. 2026-03-26：reopen `project-018` 执行 `sprint-004-langgraph-hard-dependency-truthfulness-cutover`，完成 `DA-210` ~ `DA-213`、`core-runtime-langgraph` 的 direct dependency cutover 与 truthfulness 对齐，并产出新的项目完成态审计摘要 `project-018-technical-solution-promotion-pilots-completion-audit-summary-sprint-004-langgraph-hard-dependency-truthfulness-cutover.md`。
