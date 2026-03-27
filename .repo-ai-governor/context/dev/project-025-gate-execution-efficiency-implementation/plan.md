# project-025-gate-execution-efficiency-implementation 计划

- Status: active
- Date: 2026-03-27
- Stage Mapping: Post-Stage-9 governance gate execution efficiency implementation
- Phase Mapping: Governance Gate Orchestration / Package Graph / Incremental Build / CI Matrix

## 1. 目标

1. 将 `governance.execution-gates` formal solution 拆成真实 project，并以可执行 sprint/phase 承接后续实现。
2. 先完成 `repo-global gate` 与 `check:fast` 的 phase-1 baseline，再推进 package-level gate、TS project references 与 affected gate planner。
3. 在不破坏现有 `check` 完整语义的前提下，逐步把 gate 执行从“根包单体 orchestrator”迁移到“repo-global / package-local / heavy-runtime”三层执行模型。
4. 保持 project/sprint/task/delivery/master-plan truth 与 formal solution handoff 一致。

## 2. Sprint 细化

## 2.1 sprint-001-repo-global-parallelization-and-fast-check-baseline

- Status: completed
- Sprint Goal: 完成整套方案的 project decomposition，并建立 `repo-global gate decoupling + check:fast` 的 phase-1 baseline。
- Task Package: `TK-279`、`TK-280`、`TK-281`、`TK-282`。
- Exit Criteria:
  1. `project-025` skeleton 已建立，`current-context.md` 已切换到新的 active primary stream，并将 `project-024 / sprint-001` 迁入 completed history。
  2. `gate execution efficiency` 全方案已拆成多 sprint project plan，而不是继续停留在 formal docs 的 phase 列表。
  3. `repo-global gate` 与 `build` 依赖边界已被明确收敛为 sprint-001 的实现窗口。
  4. `check:fast`、runner profile split 与 observability baseline 的当前 sprint 执行面已明确。

## 2.2 sprint-002-package-level-gates-and-build-graph-cutover

- Status: completed
- Sprint Goal: 将核心 package 的 `build / typecheck / test:unit` 下沉到 package-level，并让 Turbo 真正消费 workspace package graph 与 cache policy。
- Task Package: `TK-283`、`TK-284`、`TK-285`。
- Input Constraints:
  1. 先选择核心 package pilot，不做一次性全仓大爆炸迁移。
  2. package-level scripts 不得破坏现有根级 `check` 的完整兼容性。
  3. cache policy 的切换应与 build outputs / package boundaries 一起落地，避免伪命中。

## 2.3 sprint-003-project-references-affected-check-and-ci-matrix

- Status: planned
- Sprint Goal: 落地 TS project references、affected gate planner 与 CI matrix，完成 project-025 closeout。
- Task Package: `TK-286`、`TK-287`、`TK-288`。
- Input Constraints:
  1. 仅在 package-level build/typecheck/test pilot 稳定后，才进入 project references。
  2. `affected` planner 首版优先采用粗粒度 diff routing，不追求理论最优。
  3. CI matrix 需保持 full gate 仍可作为最终权威入口。

## 3. 任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | status |
|---|---|---|---|---|---|
| TK-279 | sprint-001 | project-025 激活与 project-024 closeout handoff | bootstrap/governance | project-024 completion audit,project-024 sprint-001 completed | completed |
| TK-280 | sprint-001 | gate execution efficiency 全方案 project decomposition 与 phase mapping baseline | planning/baseline | TK-279,DA-277,.repo-ai-governor/draft/gate-execution-efficiency-optimization-plan.md | completed |
| TK-281 | sprint-001 | repo-global gate build dependency decoupling 与 check:fast baseline | gate/orchestration | TK-280,package.json,turbo.json,scripts/ci/run-gate-check.js | completed |
| TK-282 | sprint-001 | root gate runner profile split 与 observability baseline | cli/runner | TK-280,package.json,scripts/ci/run-gate-check.js | completed |
| TK-283 | sprint-002 | package-level build typecheck test pilot 与 core package cutover | package-graph | TK-281,TK-282,apps/cli/package.json,packages/core-memory-semantics/package.json,packages/reporting/package.json | completed |
| TK-284 | sprint-002 | turbo package graph 与 cache policy cutover | build-system | TK-283,turbo.json,tsconfig.build.json | completed |
| TK-285 | sprint-002 | sprint-002 出口验收与 sprint-003 输入约束 | acceptance/baseline | TK-283,TK-284 | completed |
| TK-286 | sprint-003 | ts project references 与 incremental build baseline | ts/build | TK-285,tsconfig.json,tsconfig.build.json | planned |
| TK-287 | sprint-003 | affected gate planner 与 ci matrix rollout | ci/orchestration | TK-286,scripts/ci/run-affected-check.js | planned |
| TK-288 | sprint-003 | sprint-003 出口验收与 project-025 completion closeout | acceptance/closeout | TK-286,TK-287 | planned |

## 4. 依赖产物策略

1. `project-025` 启动默认消费：
   - `.repo-ai-governor/draft/gate-execution-efficiency-optimization-plan.md`
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/governance-execution-gates/module-overview.md`
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/governance-execution-gates/contracts/gate-execution-profile-contract.md`
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/governance-execution-gates/adrs/repo-global-package-heavy-gate-stratification.md`
   - `project-024-gate-execution-efficiency-technical-solution-promotion-completion-audit-summary.md`
2. `sprint-001` 只承接 project decomposition 与 phase-1 baseline，不提前把 package graph / TS references / CI matrix 一次性压进首个 sprint。
3. `sprint-002` 必须在 phase-1 边界稳定后，才进入 package-level script 与 cache policy cutover。
4. `sprint-003` 必须在 package-level pilot 稳定后，才进入 TS project references 与 affected planner。

## 5. DoD（project-025）

1. `repo-global / package-local / heavy-runtime` 三层 gate execution model 已从 formal guidance 落成真实仓库执行面。
2. `check:fast` 与 `check:affected` 已建立稳定入口，且不伪装成完整 gate 成功。
3. 核心 package 的 build/typecheck/test 已进入 package graph 与增量执行路径。
4. TS project references、affected planner 与 CI matrix 已形成 project closeout 级证据。

## 6. 里程碑记录

1. 2026-03-27：创建 `project-025-gate-execution-efficiency-implementation`，并通过 `TK-279 / DA-279` 将 active execution surface 从 `project-024 / sprint-001` closeout 切换到新的 implementation 主线。
2. 2026-03-27：通过 `TK-280 / DA-280` 完成整套方案的 project decomposition，将 formal solution 的四个 phase 收敛为三段真实 sprint。
3. 2026-03-27：完成 `sprint-001` phase-1 baseline 收口，并将主执行流切换到 `sprint-002-package-level-gates-and-build-graph-cutover`。
4. 2026-03-28：通过 `TK-283` 完成 `packages/core-memory-semantics` 的首个 package-level build/typecheck/test pilot，并将 `TK-284` 推进到 Turbo package graph / cache policy cutover。
5. 2026-03-28：通过 `TK-284` 沿 `shared -> memory-store-adapter -> core-memory -> core-memory-semantics` 依赖链打通 Turbo package graph / cache policy pilot，并将 `TK-285` 切换为当前活跃验收任务。
6. 2026-03-28：完成 `code_review_working-tree-20260328` 复核与收口，接受并修复 `TK-283 / TK-284` 的两项脚本健壮性问题，并将 CR 生命周期推进到 `resolved`。
7. 2026-03-28：`TK-285` sprint-002 出口验收完成，4 项 exit criteria 全部满足，sprint-003 输入约束清单已冻结，sprint-002 切换为 `completed`。
