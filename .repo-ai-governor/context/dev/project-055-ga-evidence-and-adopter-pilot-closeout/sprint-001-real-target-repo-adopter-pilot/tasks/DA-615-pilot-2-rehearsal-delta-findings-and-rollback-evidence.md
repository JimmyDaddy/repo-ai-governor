# DA-615 pilot-2 rehearsal delta findings and rollback evidence

- Status: completed
- Date: 2026-04-07
- Project: `project-055-ga-evidence-and-adopter-pilot-closeout`
- Sprint: `sprint-001-real-target-repo-adopter-pilot`
- Task: `TK-615`

## 1. Summary

1. `react-native-image-marker-1.1.x` complex pilot 在恢复后的 `1.1.x` baseline 上完成了一次 `upgrade preview/apply/rollback` 与 `workspace dry-run/execute/rollback` acceptance rerun。
2. 这次 acceptance run 总耗时 `5326ms`，`git status` 在 execute/rollback 前后完全一致。
3. execute 后 `doctor` 切到 `workspaceMode=repo_local`；rollback 后恢复 `tool_managed`，且 repo-local `.repo-ai-governor` 被清理。
4. 本文不再声称“原冻结 working copy 在整个执行窗内始终未受影响”；它证明的是恢复后 baseline 的 rerun 通过，并保留了对应 delta findings。

## 2. Execution Note

1. 在正式 acceptance run 前，一次误把 `--workspace-root <repo-root>` 传给 `repo_local` 的操作把 target workspace root 解析成仓库根目录，并移除了原 `/Users/jimmydaddy/study/react-native-image-marker-1.1.x` 路径。
2. 为完成本轮 user-directed pilot，已在同一窗口用现有 `/Users/jimmydaddy/study/react-native-image-marker` clone 的 `origin/1.1.x` 重建该路径，并重新引入两条 baseline dirty files：
   - `example/ios/Podfile.lock`
   - `example/react-native.config.js`
3. 因为原冻结 working copy 已被打断，后续成功结论只针对恢复后的 baseline rerun，不再等价于“冻结仓库在整个窗口中被原样保留”。
4. 这一恢复步骤属于执行环境说明，不计入产品运行时 delta findings。

## 3. Evidence Snapshot

1. Pre-state
   - repo: `/Users/jimmydaddy/study/react-native-image-marker-1.1.x`
   - git status: `1.1.x...origin/1.1.x`
   - dirty files:
     - `example/ios/Podfile.lock`
     - `example/react-native.config.js`
2. Upgrade path
   - preview: `diff_count=0`, `confirmation_count=0`, `apply_readiness=ready`
   - apply: `apply_status=applied`, `verify_status=passed`
   - rollback: `verify_status=passed`
3. Workspace path
   - dry-run target: `/Users/jimmydaddy/study/react-native-image-marker-1.1.x/.repo-ai-governor`
   - execute target: `/Users/jimmydaddy/study/react-native-image-marker-1.1.x/.repo-ai-governor`
   - rollback cleanup: `scratch_cleanup_status=removed`
4. State preservation
   - `preGitStatus` = `postGitStatus`
   - `repoLocalWorkspaceExistsAfterExecute=true`
   - `repoLocalWorkspaceExistsAfterRollback=false`

## 4. Delta Findings

1. 历史 `workspace_migration_scratch_cleanup_gap` 已不再复现；rollback 现在会移除对应 scratch root，而不是残留空目录。
2. `workspace` 产物 locality 仍然是分层的：
   - execute 的 machine-readable stdout 与汇总 evidence 已在 `.tmp/project-055-sprint-001-pilot-2/` 持久化
   - rollback artifact 仍写回 tool-managed workspace
   - repo-local plan/execution artifact 会随 rollback 清理而消失
   这说明用户在 complex repo 排障时仍需跨 `.tmp` 与 tool-managed workspace 查证据。
3. `doctor/check` 的 external-adopter baseline warnings 仍然存在，但与 dirty worktree preservation 或 rollback correctness 无冲突。

## 5. Key Artifacts

1. Upgrade report: `/Users/jimmydaddy/.repo-ai-governor/workspaces/430e90943d37/.repo-ai-governor/context/upgrade/upgrade-1775535817827.report.json`
2. Upgrade apply receipt: `/Users/jimmydaddy/.repo-ai-governor/workspaces/430e90943d37/.repo-ai-governor/context/upgrade/upgrade-apply-1775535818318.apply-receipt.json`
3. Upgrade rollback receipt: `/Users/jimmydaddy/.repo-ai-governor/workspaces/430e90943d37/.repo-ai-governor/context/upgrade/upgrade-rollback-1775535818768.rollback-receipt.json`
4. Workspace dry-run plan: `/Users/jimmydaddy/.repo-ai-governor/workspaces/430e90943d37/.repo-ai-governor/context/workspace/1775535819177-tool_managed-to-repo_local.plan.json`
5. Workspace execute stdout: `.tmp/project-055-sprint-001-pilot-2/workspace-execute.stdout.json`
6. Workspace rollback stdout: `.tmp/project-055-sprint-001-pilot-2/workspace-rollback.stdout.json`
7. Workspace rollback artifact: `/Users/jimmydaddy/.repo-ai-governor/workspaces/430e90943d37/.repo-ai-governor/context/workspace/1775535819607-tool_managed-to-repo_local.rollback.json`
8. Aggregated summary: `.tmp/project-055-sprint-001-pilot-2-rehearsal-summary.json`
