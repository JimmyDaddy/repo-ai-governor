# sprint-002-consumer-surface-adoption-and-rollout-closeout 计划

- Status: completed
- Date: 2026-04-14
- Sprint Goal: 推进 consumer surface adoption，补齐 scenario-driven evidence 并完成 rollout closeout。
- Project: `project-103-cli-exec-additive-diagnostics-consumer-rollout`
- Upstream:
  - `.repo-ai-governor/context/dev/project-103-cli-exec-additive-diagnostics-consumer-rollout/sprint-001-additive-diagnostics-consumer-rollout/plan.md`
  - `.repo-ai-governor/context/dev/project-102-cli-exec-launch-authoring-contract-tests-rollout/plan.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/shared-launch-diagnostics-projection-and-consumer-surfaces.md`

## 1. Scope

1. 将 `launch_diagnostics` 统一接入 `connect / doctor / verify / report` surface。
2. 用 scenario-driven evidence 固定 `spawn_failed / parse_failed / non_zero / signal` 的 consumer 读法。
3. 在 sprint final clean 后完成 `project-103` closeout 与 delivery evidence handoff。

## 2. 任务拆解矩阵（WBS）

| task_id | title | depends_on | status |
| --- | --- | --- | --- |
| TK-874 | adopt launch_diagnostics across connect doctor verify and report surfaces and retire stderr-guess branches | TK-873 | completed |
| TK-875 | produce scenario-driven evidence for spawn-failed parse-failed non-zero and signal consumer mappings | TK-874 | completed |
| TK-876 | finalize project-103 closeout and delivery evidence handoff | TK-874、TK-875、activation-time local CR-001 | completed |

## 3. Exit Criteria

1. `connect / doctor / verify / report` 已拥有统一的 `launch_diagnostics` consumer surface。
2. scenario-driven evidence 已取代 stderr/error-message 猜测路径，成为真实 rollout boundary。
3. 激活该 sprint 时有清晰的本地 `CR-001` 入口与 project-final closeout 边界。

## 4. Sprint Notes

1. 激活后先预留本地 `CR-001`，再开始 implementation 与 reviewer loop。
2. 当前 sprint 只承接 consumer adoption、scenario evidence 与 closeout，不新增 minimum contract fields。
3. `TK-876` 负责 `project-103` final closeout，但只有在 sprint-002 local `CR-001` clean 后才允许完成。
4. 2026-04-14：`TK-873` 已完成 sprint-001 closeout 与 activation handoff；当前 sprint 已切换为 active，`TK-874` 作为新的 implementation 入口切换为 `in_progress`。
5. 2026-04-14：`TK-874 / TK-875` 已完成 shared projection runtime、verificationMatrix/report surface wiring 与 spawn/parse/non-zero/signal consumer evidence；下一步进入本地 `CR-001` fresh reviewer loop。
6. 2026-04-14：`CR-001` accepted findings 已修复，并由 `CR-002` latest fresh clean recheck 收口为 `resolved`；当前 sprint boundary 已通过 focused vitest、`pnpm run build`、`pnpm run test:packages`、ledger/CR sync checks 与 `pnpm run check`。
7. 2026-04-14：本地 sprint boundary commit `feat(project-103-sprint-002): complete sprint and clear cr loop` 已创建；当前在同一 sprint surface 上进入 project-final review 与 closeout write-back。
8. 2026-04-14：project-final `CR-003` latest fresh recheck 未发现新的 actionable finding；`TK-876` 已完成 delivery registry、completion audit 与 next-stream activation write-back，当前 sprint 收口为 `completed`。
