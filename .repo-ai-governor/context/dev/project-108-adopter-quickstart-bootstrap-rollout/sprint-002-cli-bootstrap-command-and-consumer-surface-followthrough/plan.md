# sprint-002-cli-bootstrap-command-and-consumer-surface-followthrough 计划

- Status: completed
- Date: 2026-04-15
- Sprint Goal: materialize `adopt bootstrap` runtime orchestrator、summary output、help copy 与 consumer docs baseline。
- Project: `project-108-adopter-quickstart-bootstrap-rollout`
- Upstream:
  - `.repo-ai-governor/context/dev/project-108-adopter-quickstart-bootstrap-rollout/plan.md`
  - `.repo-ai-governor/context/dev/project-108-adopter-quickstart-bootstrap-rollout/sprint-001-quickstart-contract-and-bootstrap-runtime-baseline/plan.md`
  - `.repo-ai-governor/context/dev/project-108-adopter-quickstart-bootstrap-rollout/sprint-001-quickstart-contract-and-bootstrap-runtime-baseline/tasks/DA-900-adopter-quickstart-bootstrap-promotion-and-rollout-handoff.md`

## 1. Scope

1. 在 `apps/cli` 落 `adopt bootstrap` orchestrator、default built-in resolution 与 fail-closed rerun redirect。
2. 接入 additive bootstrap summary output、help copy 与 user-facing guidance，保持 `check` explicit follow-up wording，并明确 selector resolution / rerun mode 只是 handoff diagnostics 而不是新的 canonical install truth。
3. 将 adopter-facing docs truth refresh 压缩成同一 sprint 的 consumer baseline，而不是另起平行 quickstart narrative。

## 2. 任务拆解矩阵（WBS）

| task_id | title | depends_on | status |
| --- | --- | --- | --- |
| TK-903 | implement adopt bootstrap orchestrator and default built-in resolution | TK-901 | completed |
| TK-904 | integrate bootstrap summary output help copy and fail-closed rerun guidance | TK-903 | completed |
| TK-905 | refresh adopter docs truth for quickstart versus check follow-up | TK-904 | completed |
| TK-912 | finalize sprint-002 closeout and activate sprint-003 | CR-001 | completed |

## 3. Exit Criteria

1. runtime/presenter/docs 三条 task ownership 已固定到 `TK-903 ~ TK-905`，且 planned ledger 同步完成。
2. `adopt bootstrap` 的 runtime scope、help copy 与 docs truth refresh 已具备下一窗口激活所需的最小 task surface。
3. 本 sprint 已进入 active execution，closeout 前不得回退到 planned。

## 4. Sprint Notes

1. docs truth refresh 必须跟随 runtime/help baseline，而不是先于命令行为单独对外宣称。
2. 若后续直接激活 `sprint-002`，仍需先完成 `sprint-001` 的 scope freeze 与 first-hop handoff。
3. omitted selector 只允许回落官方 built-in pack；explicit selector ambiguity 必须保持 fail-closed，不得在 sprint-002 重新发明 resolver 语义。
4. 2026-04-15：`TK-911 / DA-901` 已完成 sprint-001 closeout write-back；当前 sprint 已登记为 `current-context` 的 primary execution surface，但在 `TK-903` 正式开工前，sprint plan 与 task aggregate 继续保持 `planned`。
5. 2026-04-15：`TK-903` 已开工，sprint plan 正式切换为 `active`；后续状态推进统一通过 task-card truth + `sync-task-ledger.js` 回写。
6. 2026-04-15：`TK-904` 与 `TK-905` 已进入实现窗口，当前 sprint 开始同步刷新 bootstrap summary/help copy 与 adopter-facing docs truth。
7. 2026-04-16：`TK-903 ~ TK-905` 已完成本轮实现与验证；下一步基于当前变更窗口启动 sprint-002 delegated CR round。
8. 2026-04-16：`CR-001` 已 clean `resolved`；`TK-912` 已创建并切换为 `in_progress`，当前 sprint 进入 closeout write-back 与 sprint-003 activation 窗口。
9. 2026-04-16：`TK-912 / DA-912` 已完成 sprint-002 closeout、delivery registry 前移与 sprint-003 activation；当前 sprint 已恢复为最终 `completed` 真值。
