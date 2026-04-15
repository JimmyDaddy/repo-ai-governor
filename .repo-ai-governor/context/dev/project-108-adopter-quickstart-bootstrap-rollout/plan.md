# project-108-adopter-quickstart-bootstrap-rollout 计划

- Status: completed
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

- Status: completed
- Sprint Goal: 冻结 quickstart contract、selector and rerun semantics、bootstrap summary boundary 与 rollout execution plan。
- Task Package: `TK-900`、`TK-901`、`TK-902`、`TK-911`

## 2.2 sprint-002-cli-bootstrap-command-and-consumer-surface-followthrough

- Status: completed
- Sprint Goal: materialize `adopt bootstrap` runtime orchestrator、summary output、help copy 与 consumer docs baseline。
- Task Package: `TK-903`、`TK-904`、`TK-905`、`TK-912`

## 2.3 sprint-003-cleanroom-evidence-and-rollout-closeout

- Status: completed
- Sprint Goal: 补齐 orchestration tests、clean-room evidence、consumer truthfulness closeout 与 project final audit。
- Task Package: `TK-906`、`TK-907`、`TK-908`

## 3. 任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | status |
| --- | --- | --- | --- | --- | --- |
| TK-900 | sprint-001 | freeze adopter quickstart bootstrap contract and rollout boundary | contract/boundary | formal module docs | completed |
| TK-901 | sprint-001 | define bootstrap summary selector and rerun semantics baseline | runtime/summary | TK-900 | completed |
| TK-902 | sprint-001 | plan implementation sequencing and consumer truthfulness follow-up | planning/docs | TK-900、TK-901 | completed |
| TK-911 | sprint-001 | finalize sprint-001 closeout and activate sprint-002 | closeout/activation | CR-001 | completed |
| TK-903 | sprint-002 | implement adopt bootstrap orchestrator and default built-in resolution | cli/runtime | TK-901 | completed |
| TK-904 | sprint-002 | integrate bootstrap summary output help copy and fail-closed rerun guidance | presenter/help | TK-903 | completed |
| TK-905 | sprint-002 | refresh adopter docs truth for quickstart versus check follow-up | docs_playbook | TK-904 | completed |
| TK-912 | sprint-002 | finalize sprint-002 closeout and activate sprint-003 | closeout/activation | CR-001 | completed |
| TK-906 | sprint-003 | add bootstrap orchestration tests and clean-room rehearsal baseline | verification/tests | TK-903、TK-904 | completed |
| TK-907 | sprint-003 | collect rollout evidence and verify installer quickstart truthfulness | evidence/rollout | TK-905、TK-906 | completed |
| TK-908 | sprint-003 | finalize project-108 rollout closeout and completion audit | closeout/final-audit | TK-906、TK-907 | completed |

## 4. 依赖产物策略

1. `TK-900` 先冻结 convenience boundary、`check` follow-up 与 rerun redirect 语义，避免 runtime 实现先行后再返工 contract。
2. `TK-901` 在 `TK-900` 之后收敛 bootstrap summary、selector resolution 与 reentry semantics，确保 presenter 和 artifact 不会抢跑成新的 truth surface。
3. `TK-902` 负责把 command/runtime、docs_playbook 与 clean-room evidence 切成稳定 queue，不在 sprint-001 提前承诺实现完成。
4. `sprint-002` 先落 command/runtime 和 help copy，再刷新 consumer docs truth，避免 docs 先宣称能力再回填命令行为。
5. `sprint-003` 只在 runtime、presenter 与 docs baseline 已落定后推进 tests、clean-room evidence 与 closeout。

## 5. DoD（project-108-adopter-quickstart-bootstrap-rollout）

1. `adopt bootstrap` 的 convenience boundary、selector resolution、rerun redirect 与 additive summary model 已 materialize 为可执行 rollout scope。
2. project/sprint plan、task ledger、review artifacts、`current-context`、completed history 与 delivery registry 已同步到最终 completed / idle 真值。
3. adopter-facing CLI/docs rollout ownership 已被固定到单一 project queue，而不是继续散落在 runtime notes 或 draft handoff 里。
4. `sprint-003` 已在 final clean recheck 与 `TK-908 / DA-908` closeout write-back 后恢复为最终 `completed` 真值，当前默认 primary stream 已清空为 `idle`，且不再保留 planned follow-up stream。

## 6. 里程碑记录

1. 2026-04-15：基于 `technical-solution.adopter-quickstart-bootstrap-command` promotion cutover 创建 `project-108` planned rollout skeleton。
2. 2026-04-15：`sprint-001-quickstart-contract-and-bootstrap-runtime-baseline` 已登记到 `current-context.md -> Planned Follow-Up Streams`，不占用当前 idle primary stream。
3. 2026-04-15：project-level sprint queue 已冻结到 `sprint-003`，并补齐对应 planned scaffold 与 task cards。
4. 2026-04-15：`project-107` 完成最终 closeout 并本地提交后，`sprint-001-quickstart-contract-and-bootstrap-runtime-baseline` 已切换为 active primary stream，开始执行 quickstart contract freeze。
5. 2026-04-15：`TK-900`、`TK-901`、`TK-902` 已完成 quickstart boundary freeze、selector/rerun baseline 与 sprint-002/003 sequencing notes；下一步进入 sprint-001 delegated CR round，再决定 closeout 和 commit。
6. 2026-04-15：`CR-001` 已 clean `resolved`，`TK-911 / DA-901` 已完成 sprint-001 closeout write-back；`current-context` 已切换到 `sprint-002` 作为新的 primary execution surface，`sprint-003` 保持 planned follow-up。
7. 2026-04-15：`TK-903` 已切到 `in_progress`，`sprint-002` 计划状态同步提升为 `active`，进入 `adopt bootstrap` command/runtime 实施窗口。
8. 2026-04-16：`TK-903`、`TK-904`、`TK-905` 已完成 `adopt bootstrap` quickstart、help/i18n 文案与 adopter-facing docs truth refresh；下一步进入 sprint-002 delegated CR round。
9. 2026-04-16：`CR-001` 已 clean `resolved`；`TK-912` 已创建并切换为 `in_progress`，开始执行 sprint-002 closeout write-back、delivery registry 前移与 sprint-003 activation。
10. 2026-04-16：`TK-912 / DA-912` 已完成 sprint-002 closeout write-back；`current-context` 已切换到 `sprint-003` 作为新的 primary execution surface，delivery registry 已前移到 sprint-003 closeout surface。
11. 2026-04-16：`TK-906` 已切换为 `in_progress`，`sprint-003` 计划状态同步提升为 `active`，开始补齐 bootstrap orchestration regression coverage 与 clean-room rehearsal baseline。
12. 2026-04-16：`TK-907` 已切换为 `in_progress`，开始使用构建后的 CLI 执行 quickstart clean-room rehearsal、truthfulness evidence 固化与 support-surface 验证摘要整理。
13. 2026-04-16：`TK-906` 已补齐 explicit selector / multiple receipts / mismatch redirect 的 bootstrap regression coverage，并以 `pnpm run build` + targeted `vitest` 验证通过。
14. 2026-04-16：`TK-907 / DA-907` 已完成 clean-room evidence packet、help surface 验证与 README/playbook/support-matrix truthfulness 复核；`sprint-003` 当前进入统一验证与 delegated CR round 准备窗口。
15. 2026-04-16：`CR-001` 已完成 accepted findings 修复并 `resolved`；fresh clean recheck `CR-002` 未发现新的 actionable findings，当前 sprint-level delegated CR loop 已 clean 收口。
16. 2026-04-16：`TK-908` 已切换为 `in_progress`，开始承接 sprint boundary `pnpm run check`、local commit 与 project-final closeout 输入准备。
17. 2026-04-16：project-final delegated rounds `CR-003` 至 `CR-009` 已完成 accepted finding 修复并 `resolved`，`CR-010` 作为 fresh clean recheck 已确认 project-final boundary 无新的 actionable findings。
18. 2026-04-16：`TK-908 / DA-908` 已完成 final closeout write-back；`project-108` 正式进入 `completed`，并在此里程碑回链 [project-108 completion audit summary](./project-108-adopter-quickstart-bootstrap-rollout-completion-audit-summary.md)。

## 7. 里程碑记录入口

1. [project-108-adopter-quickstart-bootstrap-rollout-completion-audit-summary.md](./project-108-adopter-quickstart-bootstrap-rollout-completion-audit-summary.md)
