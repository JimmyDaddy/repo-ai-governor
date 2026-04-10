# DA-735 sprint-001 closeout and sprint-002 activation handoff

- Status: completed
- Date: 2026-04-09
- Project: `project-076-transport-selection-authority-rollout`
- Sprint: `sprint-001-contract-and-routing-truth-cutover`
- Task: `TK-735`

## 1. Summary

1. `sprint-001-contract-and-routing-truth-cutover` 已完成 closeout。
2. `.repo-ai-governor/context/current-context.md` 已从 `sprint-001-contract-and-routing-truth-cutover` 切换到 `sprint-002-connect-selection-ux-and-candidate-materialization`。
3. `TK-729` 已激活为 `in_progress`，作为 `project-076` 的下一条执行边界。

## 2. Closed Evidence

1. `TK-726`：`enabled_tools[]` canonical onboarding truth 与 compatibility bridge 已收口。
2. `TK-727`：strict routing / projection truth alignment 已收口。
3. `TK-728`：same-surface no-failover regression baseline 已建立。
4. `CR-001`：sprint-scoped review 已 resolved，唯一 accepted finding 已在同窗修复并复验通过。

## 3. Activation Result

1. `project-076 / sprint-001` 已写入 `.repo-ai-governor/context/completed-streams-history.md`。
2. `project-076 / sprint-002` 已在 `.repo-ai-governor/context/current-context.md` 中成为 active primary stream。
3. `project plan` 已更新为：
   - `sprint-001` = `completed`
   - `sprint-002` = `active`
4. `TK-729` 已切换为 `in_progress`，开始承接 connect transport authoring surface 的实现。

## 4. Verification Note

1. 本 closeout / activation 窗口只修改 docs / ledger / review lifecycle / context routing surface，没有新增可执行代码变更。
2. 由于同一交付窗口内已经包含 `apps/**` / `packages/**` / `test/**` 代码变更，本次 closeout 继续沿用同窗 `pnpm run build` 与 `pnpm run check` 作为最终 delivery evidence。
