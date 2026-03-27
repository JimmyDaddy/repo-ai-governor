# DA-237 sprint-004 exit acceptance and project-020 completion recommendation

- Status: active
- Date: 2026-03-27
- Owner: AI-Agent
- Task: `TK-237`
- Project: `project-020-adoption-productization-and-upgrade-ux`
- Sprint: `sprint-004-adopter-pilot-and-documentation-closure`

## 1. Summary

1. `sprint-004` 的 3 条 exit criteria 已全部满足：
   - `playground` 已完成 simple adopter install/init/upgrade/workspace rehearsal，并形成 `DA-235`
   - `react-native-image-marker-1.1.x` 已完成复杂仓库 upgrade/workspace rehearsal，并形成 `DA-236`
   - support matrix / playbook / troubleshooting / known limitations 已基于真实 pilot evidence 完成 truthfulness 回灌
2. 本轮文档闭环已更新：
   - `README.md`
   - `README.zh-CN.md`
   - `docs/local-adoption-playbook.md`
   - `docs/local-adoption-playbook.zh-CN.md`
3. 回灌的真实行为包括：
   - 默认 `init` 先落 `tool_managed`
   - fresh external repo 的 `doctor/check` external baseline warning
   - 非 `pnpm` / dirty repo 的 `dist-binary` 无侵入演练路径
   - workspace artifact locality 仍在 source `tool_managed` 根
   - rollback 后 migration scratch cleanup 尚未完全收口
4. 基于当前证据，`project-020` 已达到 completed；由于下一条主执行流尚未显式激活，`current-context.md` 可暂时保留本 project/sprint 作为 active closeout surface。

## 2. Documentation Closure

1. Quick start / install strategy
   - 新增 `dist` binary/no-install rehearsal 入口，覆盖非 `pnpm` 与 dirty repo 场景
2. Bootstrap truthfulness
   - 明确 `init` 默认采用 `tool_managed`
   - 明确 `doctor baseline_docs missing=5/5` 与 `check script_not_found` 属于当前 external-adopter baseline
3. Workspace lifecycle truthfulness
   - 将 repo-local 切换入口改成显式 `workspace dry-run/execute/rollback`
   - 增加 artifact locality 与 migration scratch cleanup 的已知限制
4. Troubleshooting / known limitations
   - 将 simple/complex pilot 里的 gap 正式收敛为文档化行为边界

## 3. Completion Recommendation

1. `sprint-004-adopter-pilot-and-documentation-closure`：可切换为 `completed`
2. `project-020-adoption-productization-and-upgrade-ux`：可切换为 `completed`
3. 下一条执行面建议：
   - 若后续继续做 adoption polish，可新开 follow-up project，优先处理 workspace artifact locality 与 migration scratch cleanup
   - 若暂无新主线，可保持当前 project 作为 closeout surface，直到下一条 active stream 显式激活

## 4. Validation

1. `pnpm run check`
2. `node ./scripts/governance/check-task-ledger-sync.js`
3. `node ./scripts/governance/check-sprint-plan-status-sync.js`
4. `node ./scripts/governance/check-artifact-registry-lifecycle.js`
5. `node ./scripts/governance/check-code-review-status-sync.js`
6. `node ./scripts/governance/check-worktree-review-target.js`
