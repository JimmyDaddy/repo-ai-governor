# sprint-003-review-workflow-and-verify-removal 计划

- Status: completed
- Date: 2026-04-10
- Project: `project-077-session-main-command-model-rollout`
- Sprint Goal: 固化 `/review` 与 `/review verify` 的 AI fixed workflow 语义，并删除 public `/verify` surface。

## 1. Task Package

1. `TK-732` fix `/review` and `/review verify` as AI fixed workflows
2. `TK-733` remove public `/verify` command and capability surface
3. `TK-734` add `/verify` removal migration guidance and follow-up routing
4. `TK-744` sprint-003 activation and sprint-002 closeout handoff
5. `TK-745` sprint-003 closeout and sprint-004 activation handoff

## 2. Exit Criteria

1. `/review` 与 `/review verify` 的 command model、routing、presenter copy 与 help appendix 都明确属于 AI fixed workflow。
2. public `/verify` 已从 governed capability catalog、session-shell slash surface、CLI public entrypoint 与 README/help 暴露面删除。
3. 旧 verify request 已迁移到 `connect` follow-up、`doctor` mode 或 internal gate，用户可见文案能解释迁移入口。

## 3. Milestones

1. 2026-04-10：sprint 创建，初始状态为 `planned`，等待 sprint-002 clean closeout 后激活。
2. 2026-04-10：`TK-744` 已完成 sprint activation 与 sprint-002 closeout handoff，`sprint-003` 接管为新的 primary execution surface。
3. 2026-04-10：`CR-001 ~ CR-006` resolved 后，`TK-745 / DA-745` 已完成 sprint-003 closeout，并将 primary execution surface 切换到 `sprint-004`。
