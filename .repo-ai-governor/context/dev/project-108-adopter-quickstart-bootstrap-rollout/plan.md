# project-108-adopter-quickstart-bootstrap-rollout 计划

- Status: planned
- Date: 2026-04-15
- Stage Mapping: adopter quickstart bootstrap rollout
- Phase Mapping: sprint-001 contract and runtime baseline / sprint-002 command implementation and consumer surface follow-through / sprint-003 clean-room evidence and rollout closeout
- Upstream:
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/module-overview.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/governance-adoption-pack-install-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/adopter-quickstart-bootstrap-command-and-install-convenience-surface.md`
  - `.repo-ai-governor/draft/approved_solution_review_adopter-quickstart-bootstrap-command.md`

## 1. 目标

1. 将 `adopt bootstrap` 的 convenience boundary、selector semantics、rerun redirect 与 additive summary model 收敛为可执行 rollout scope。
2. 将 follow-up 拆成 runtime orchestration、CLI help and presenter、consumer docs truthfulness 与 clean-room evidence 四条清晰 ownership 线。
3. 为 adopter-facing quickstart 命令提供单一 follow-up stream，避免后续实现把 `check`、`upgrade` 或 cross-pack migration boundary 再次打散。

## 2. Sprint 细化

## 2.1 sprint-001-quickstart-contract-and-bootstrap-runtime-baseline

- Status: planned
- Sprint Goal: 冻结 quickstart contract、selector and rerun semantics、bootstrap summary boundary 与 rollout execution plan。
- Task Package: `TK-900`、`TK-901`、`TK-902`

## 2.2 sprint-002-cli-bootstrap-command-and-consumer-surface-followthrough

- Status: planned
- Sprint Goal: materialize `adopt bootstrap` runtime orchestrator、summary output、help copy 与 consumer docs baseline。
- Task Package: `TK-903`、`TK-904`、`TK-905`

## 2.3 sprint-003-cleanroom-evidence-and-rollout-closeout

- Status: planned
- Sprint Goal: 补齐 orchestration tests、clean-room evidence、consumer truthfulness closeout 与 project final audit。
- Task Package: `TK-906`、`TK-907`、`TK-908`

## 3. 任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | status |
| --- | --- | --- | --- | --- | --- |
| TK-900 | sprint-001 | freeze adopter quickstart bootstrap contract and rollout boundary | contract/boundary | formal module docs | planned |
| TK-901 | sprint-001 | define bootstrap summary selector and rerun semantics baseline | runtime/summary | TK-900 | planned |
| TK-902 | sprint-001 | plan implementation sequencing and consumer truthfulness follow-up | planning/docs | TK-900、TK-901 | planned |
| TK-903 | sprint-002 | implement adopt bootstrap orchestrator and default built-in resolution | cli/runtime | TK-901 | planned |
| TK-904 | sprint-002 | integrate bootstrap summary output help copy and fail-closed rerun guidance | presenter/help | TK-903 | planned |
| TK-905 | sprint-002 | refresh adopter docs truth for quickstart versus check follow-up | docs_playbook | TK-904 | planned |
| TK-906 | sprint-003 | add bootstrap orchestration tests and clean-room rehearsal baseline | verification/tests | TK-903、TK-904 | planned |
| TK-907 | sprint-003 | collect rollout evidence and verify installer quickstart truthfulness | evidence/rollout | TK-905、TK-906 | planned |
| TK-908 | sprint-003 | finalize project-108 rollout closeout and completion audit | closeout/final-audit | TK-906、TK-907 | planned |

## 4. 依赖产物策略

1. `TK-900` 先冻结 convenience boundary、`check` follow-up 与 rerun redirect 语义，避免 runtime 实现先行后再返工 contract。
2. `TK-901` 在 `TK-900` 之后收敛 bootstrap summary、selector resolution 与 reentry semantics，确保 presenter 和 artifact 不会抢跑成新的 truth surface。
3. `TK-902` 负责把 command/runtime、docs_playbook 与 clean-room evidence 切成稳定 queue，不在 sprint-001 提前承诺实现完成。
4. `sprint-002` 先落 command/runtime 和 help copy，再刷新 consumer docs truth，避免 docs 先宣称能力再回填命令行为。
5. `sprint-003` 只在 runtime、presenter 与 docs baseline 已落定后推进 tests、clean-room evidence 与 closeout。

## 5. DoD（project-108-adopter-quickstart-bootstrap-rollout）

1. `adopt bootstrap` 的 convenience boundary、selector resolution、rerun redirect 与 additive summary model 已 materialize 为可执行 rollout scope。
2. planned task ledger、project/sprint plan 与 `current-context -> Planned Follow-Up Streams` 保持同步。
3. adopter-facing CLI/docs rollout ownership 已被固定到单一 project queue，而不是继续散落在 runtime notes 或 draft handoff 里。
4. 后续 implementation window 可以直接基于该 planned stream 激活 execution，而不需要重新解释 formal quickstart direction。

## 6. 里程碑记录

1. 2026-04-15：基于 `technical-solution.adopter-quickstart-bootstrap-command` promotion cutover 创建 `project-108` planned rollout skeleton。
2. 2026-04-15：`sprint-001-quickstart-contract-and-bootstrap-runtime-baseline` 已登记到 `current-context.md -> Planned Follow-Up Streams`，不占用当前 idle primary stream。
3. 2026-04-15：project-level sprint queue 已冻结到 `sprint-003`，并补齐对应 planned scaffold 与 task cards。

## 7. 里程碑记录入口

1. 待 closeout 后补齐。
