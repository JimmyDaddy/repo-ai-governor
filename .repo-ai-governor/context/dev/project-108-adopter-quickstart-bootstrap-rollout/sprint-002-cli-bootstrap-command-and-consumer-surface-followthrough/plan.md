# sprint-002-cli-bootstrap-command-and-consumer-surface-followthrough 计划

- Status: planned
- Date: 2026-04-15
- Sprint Goal: materialize `adopt bootstrap` runtime orchestrator、summary output、help copy 与 consumer docs baseline。
- Project: `project-108-adopter-quickstart-bootstrap-rollout`
- Upstream:
  - `.repo-ai-governor/context/dev/project-108-adopter-quickstart-bootstrap-rollout/plan.md`
  - `.repo-ai-governor/context/dev/project-108-adopter-quickstart-bootstrap-rollout/sprint-001-quickstart-contract-and-bootstrap-runtime-baseline/plan.md`
  - `.repo-ai-governor/context/dev/project-108-adopter-quickstart-bootstrap-rollout/sprint-001-quickstart-contract-and-bootstrap-runtime-baseline/tasks/DA-900-adopter-quickstart-bootstrap-promotion-and-rollout-handoff.md`

## 1. Scope

1. 在 `apps/cli` 落 `adopt bootstrap` orchestrator、default built-in resolution 与 fail-closed rerun redirect。
2. 接入 bootstrap summary output、help copy 与 user-facing guidance，保持 `check` explicit follow-up wording。
3. 将 adopter-facing docs truth refresh 压缩成同一 sprint 的 consumer baseline，而不是另起平行 quickstart narrative。

## 2. 任务拆解矩阵（WBS）

| task_id | title | depends_on | status |
| --- | --- | --- | --- |
| TK-903 | implement adopt bootstrap orchestrator and default built-in resolution | TK-901 | planned |
| TK-904 | integrate bootstrap summary output help copy and fail-closed rerun guidance | TK-903 | planned |
| TK-905 | refresh adopter docs truth for quickstart versus check follow-up | TK-904 | planned |

## 3. Exit Criteria

1. runtime/presenter/docs 三条 task ownership 已固定到 `TK-903 ~ TK-905`，且 planned ledger 同步完成。
2. `adopt bootstrap` 的 runtime scope、help copy 与 docs truth refresh 已具备下一窗口激活所需的最小 task surface。
3. 本 sprint 继续保持 planned，不切换 active execution。

## 4. Sprint Notes

1. docs truth refresh 必须跟随 runtime/help baseline，而不是先于命令行为单独对外宣称。
2. 若后续直接激活 `sprint-002`，仍需先完成 `sprint-001` 的 scope freeze 与 first-hop handoff。
