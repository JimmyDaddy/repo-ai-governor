# DA-736 sprint-002 closeout and sprint-003 activation handoff

- Status: completed
- Date: 2026-04-10
- Project: `project-076-transport-selection-authority-rollout`
- Sprint: `sprint-002-connect-selection-ux-and-candidate-materialization`
- Task: `TK-736`

## 1. Summary

1. `sprint-002-connect-selection-ux-and-candidate-materialization` 已完成 closeout。
2. `.repo-ai-governor/context/current-context.md` 已从 `sprint-002-connect-selection-ux-and-candidate-materialization` 切换到 `sprint-003-evidence-gated-docs-and-adopter-truth`。
3. `TK-732` 已激活为 `in_progress`，作为 `project-076` 的下一条执行边界。

## 2. Closed Evidence

1. `TK-729`：`connect` per-tool transport authoring surface 已收口。
2. `TK-730`：candidate config explicit transport materialization 与 unsupported combination fail-closed 已收口。
3. `TK-731`：projection / diagnostics truth 与 `configured_remote_api` split 已收口。
4. `CR-001`：sprint-scoped review round 1 已 resolved，accepted findings 已在同窗修复并复验通过。
5. `CR-002`：迟到 reviewer `[P1]` schema validation finding 已修复并完成同窗 build + regression 复验。
6. `CR-003`：fresh delegated reviewer recheck 已返回 clean verdict，确认当前 sprint-002 surface 不存在新的 actionable finding。

## 3. Activation Result

1. `project-076 / sprint-002` 已写入 `.repo-ai-governor/context/completed-streams-history.md`。
2. `project-076 / sprint-003` 已在 `.repo-ai-governor/context/current-context.md` 中成为 active primary stream。
3. `project plan` 已更新为：
   - `sprint-002` = `completed`
   - `sprint-003` = `active`
4. `TK-732` 已切换为 `in_progress`，开始承接 clean-room / verify evidence surface 的实现。

## 4. Verification Note

1. 本 closeout / activation 窗口只修改 docs / ledger / review lifecycle / context routing surface，没有新增可执行代码变更。
2. 由于同一交付窗口内已经包含 `apps/**` / `packages/**` / `test/**` 代码变更，本次 closeout 继续沿用同窗 `pnpm run build` 与 `pnpm run check` 作为最终 delivery evidence。
