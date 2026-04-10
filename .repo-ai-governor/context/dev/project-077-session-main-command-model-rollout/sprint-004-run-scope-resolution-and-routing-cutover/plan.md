# sprint-004-run-scope-resolution-and-routing-cutover 计划

- Status: completed
- Date: 2026-04-10
- Project: `project-077-session-main-command-model-rollout`
- Sprint Goal: 保留 `run`，但把 public wording 固定为 reusable governed execution flow，并切断 generic implementation ask 的默认 `/run` 抢占。

## 1. Task Package

1. `TK-735` retain `run` as reusable governed execution flow only
2. `TK-736` cut generic implementation asks away from default `/run` handoff
3. `TK-737` align run presenter CLI wording and architecture wording

## 2. Exit Criteria

1. `run` 的 capability catalog / help / presenter / docs wording 一致收窄到 reusable governed execution flow / task-driven execution flow。
2. generic implementation asks 优先走 direct answer、planner workflow、review/workflow guidance，而不是默认桥接 `/run`。
3. `run` 仍保持 public command，但不再被表述成“所有执行类请求的总入口”。

## 3. Milestones

1. 2026-04-10：sprint 创建，初始状态为 `planned`，等待 sprint-003 clean closeout 后激活。
2. 2026-04-10：`TK-745 / DA-745` 已完成 sprint-003 closeout 与 sprint-004 activation handoff，`sprint-004` 接管为新的 primary execution surface。
3. 2026-04-10：`CR-001` 修复 accepted finding 后，`CR-002` 完成 clean recheck；`TK-746 / DA-746` 已将 sprint-004 正式收口，并把 primary execution surface 切换到 `sprint-005`。
