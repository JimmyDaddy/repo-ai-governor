# DA-236 react-native-image-marker complex adopter pilot and gap register

- Status: active
- Date: 2026-03-27
- Owner: AI-Agent
- Task: `TK-236`
- Project: `project-020-adoption-productization-and-upgrade-ux`
- Sprint: `sprint-004-adopter-pilot-and-documentation-closure`

## 1. Summary

1. 在复杂仓库 `/Users/jimmydaddy/study/react-native-image-marker-1.1.x` 上，已完成一轮真实 `upgrade` 与 `workspace lifecycle` rehearsal，覆盖：
   - `init`
   - `doctor`
   - `check`
   - `upgrade`
   - `workspace --workspace-action dry-run --workspace-mode repo_local`
   - `workspace --workspace-action execute --workspace-mode repo_local`
   - `workspace --workspace-action rollback --workspace-plan <plan>`
2. 这次 pilot 刻意没有先改目标仓库的依赖清单，而是直接使用发布态 CLI 入口 `/Users/jimmydaddy/study/ai-governor/dist/bin/repo-ai-governor.js`，避免在一个已有 Yarn/node_modules/dirty worktree 的 React Native 仓库里引入额外 package-manager 变量。
3. 默认首次接入仍然落到 `tool_managed` workspace：`/Users/jimmydaddy/.repo-ai-governor/workspaces/430e90943d37/.repo-ai-governor`；只有显式执行 workspace execute 后，CLI 才切换到仓库内 `.repo-ai-governor`。
4. rollback 后，CLI 成功恢复为 `tool_managed` 解析状态，且目标仓库原有脏工作树仍保持为：
   - `example/ios/Podfile.lock`
   - `example/react-native.config.js`

## 2. Evidence

1. Initial repository state
   - `git status --short --branch`
   - result: `1.1.x...origin/1.1.x` with 2 existing modified files
2. Bootstrap and analysis
   - `node /Users/jimmydaddy/study/ai-governor/dist/bin/repo-ai-governor.js init --output json`
   - `node /Users/jimmydaddy/study/ai-governor/dist/bin/repo-ai-governor.js doctor --output json`
   - `node /Users/jimmydaddy/study/ai-governor/dist/bin/repo-ai-governor.js check --output json`
   - `node /Users/jimmydaddy/study/ai-governor/dist/bin/repo-ai-governor.js upgrade --output json`
3. Workspace rehearsal
   - dry-run plan: `/Users/jimmydaddy/.repo-ai-governor/workspaces/430e90943d37/.repo-ai-governor/context/workspace/1774542566537-tool_managed-to-repo_local.plan.json`
   - execute artifact: `/Users/jimmydaddy/.repo-ai-governor/workspaces/430e90943d37/.repo-ai-governor/context/workspace/1774542566537-tool_managed-to-repo_local.execution.json`
   - rollback artifact: `/Users/jimmydaddy/.repo-ai-governor/workspaces/430e90943d37/.repo-ai-governor/context/workspace/1774542566537-tool_managed-to-repo_local.rollback.json`
4. Post-execute repo-local confirmation
   - `doctor` resolved `workspaceMode=repo_local`
   - repo-local root existed at `/Users/jimmydaddy/study/react-native-image-marker-1.1.x/.repo-ai-governor`
5. Post-rollback confirmation
   - `.repo-ai-governor` removed
   - `doctor` resolved back to `workspaceMode=tool_managed`
   - `git status --short --branch` returned the same 2 pre-existing modified files

## 3. Observations

1. 对复杂仓库而言，`init` 不会污染现有 worktree；它只在用户 home 下创建默认 `tool_managed` workspace。
2. `upgrade` 在复杂仓库上仍然是 `decision=allow`、`diffs=0`、`confirmation_items=0`，说明当前 upgrade 分析只针对 governor schema，自身不会因为目标仓库复杂度升高而产生额外 diff。
3. `workspace dry-run/execute/rollback` 在已有 React Native/Yarn 脏工作树上可以稳定闭环，且未改动原本已修改的 tracked files。
4. execute 后，CLI 的 `doctor/check` 确实跟随到了 repo-local 配置；这证明切换不仅是 artifact 生成，而是 active workspace selector 真正切换了。
5. rollback 后，target repo 下的 `.repo-ai-governor` 被清理，但 `.repo-ai-governor-migration/<migration-id>/backup` 空目录仍然残留。
6. 与 simple pilot 一样，workspace execute/rollback 的正式 artifacts 仍然写回原 `tool_managed` workspace，而不是当前 repo-local 根。
7. 这次 pilot 没有验证 `pnpm add` / `link` / `tgz` 安装面，因为该仓库原本是 Yarn-managed 且已有本地依赖状态；这里验证的是“发布态 CLI 对复杂仓库的 upgrade/workspace 行为”，不是“包管理器接入路径”。

## 4. Gap Register

1. `non_pnpm_adopter_entry_gap`
   - 表现：当前官方文档默认用 `pnpm add` 作为 adopter 安装入口，但复杂仓库是 Yarn-managed；为了避免额外污染，本次只能直接调用 dist binary。
   - 影响：对 Yarn/npm 主导仓库，当前文档没有给出一个“最小扰动 rehearsal path”。
2. `default_tool_managed_first_contact_gap`
   - 表现：`init` 成功后，复杂仓库内仍看不到本地治理面。
   - 影响：大型历史仓库里，这更容易被误解为“工具没有接入到目标仓库”。
3. `external_baseline_warning_gap`
   - 表现：`doctor` 仍给出 `baseline_docs missing=5/5`，`check` 仍给出 4 条 governance `script_not_found` warning。
   - 影响：在复杂仓库里，这些 warning 更需要被明确标为 external-adopter baseline，而不是 repo failure。
4. `workspace_artifact_locality_gap`
   - 表现：repo-local execute/rollback 之后，artifact 主要仍位于 `tool_managed` 根路径。
   - 影响：复杂仓库使用者在排障时需要跨两个 workspace 面找计划、执行和回滚证据。
5. `workspace_migration_scratch_cleanup_gap`
   - 表现：rollback 后仍残留 `.repo-ai-governor-migration/<migration-id>/backup` 空目录。
   - 影响：在大型仓库里会留下中间态痕迹，增加“是否已经完全回滚”的认知负担。

## 5. Recommended Follow-Up

1. 在 playbook / troubleshooting 中增加一条“非 pnpm 或已有历史依赖图的仓库如何做最小扰动 rehearsal”说明。
2. 在 known limitations 中明确：
   - 默认 `init` 会优先使用 `tool_managed`
   - 复杂仓库若想切到 repo-local，需要显式执行 `workspace dry-run/execute`
3. 将 `doctor/check` 的 external-adopter baseline warning 写成文档化预期，而不是让用户自行猜测。
4. 在 `TK-237` 中决定 workspace artifacts 是不是要跟随 active workspace root；如果不改，至少把 “artifacts remain under tool-managed source root” 写清楚。
5. 后续应修复 rollback 后的 `.repo-ai-governor-migration` scratch cleanup，或至少在 rollback 输出里明确说明残留目录的语义。

## 6. Exit Judgment

1. `TK-236` 的目标已经满足：复杂仓库上的 `upgrade` 与 `workspace lifecycle` rehearsal 已完成，并形成了复杂仓库特有 gap register。
2. 这次 pilot 证明当前复杂仓库路径在行为上是稳定的，但 adopter 文档和 troubleshooting 还缺少 package-manager-neutral rehearsal guidance 与 external-baseline warning 解释。
