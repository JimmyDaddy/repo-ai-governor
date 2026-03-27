# DA-235 playground adopter pilot baseline and gap register

- Status: active
- Date: 2026-03-27
- Owner: AI-Agent
- Task: `TK-235`
- Project: `project-020-adoption-productization-and-upgrade-ux`
- Sprint: `sprint-004-adopter-pilot-and-documentation-closure`

## 1. Summary

1. 在简单仓库 `/Users/jimmydaddy/study/playground` 上，`link:` 安装路径可稳定完成 `pnpm install` 与 `pnpm exec repo-ai-governor --help`，adopter-facing CLI 可以直接运行。
2. `init`、`doctor`、`check`、`upgrade` 都能成功执行，但首次接入默认落到 `tool_managed` workspace：`/Users/jimmydaddy/.repo-ai-governor/workspaces/63cc611d2937/.repo-ai-governor`，不会在目标仓库内立即生成 `.repo-ai-governor`。
3. `upgrade` 在简单仓库上返回 `decision=allow`、`diffs=0`、`confirmation_items=0`，说明当前 schema analysis 路径对低复杂度 adopter 已经可用。
4. `workspace --workspace-action dry-run/execute/rollback --workspace-mode repo_local` 能完整闭环：
   - dry-run 正确推导目标根路径为 `/Users/jimmydaddy/study/playground/.repo-ai-governor`
   - execute 后重新运行 `doctor/check` 时，CLI 已切换到 `repo_local`
   - rollback 后再次运行 `doctor/init` 时，CLI 已恢复到 `tool_managed`

## 2. Evidence

1. Install / CLI baseline
   - `pnpm install`
   - `pnpm exec repo-ai-governor --help`
2. First-contact bootstrap
   - `pnpm exec repo-ai-governor init --output json`
   - `pnpm exec repo-ai-governor doctor --output json`
   - `pnpm exec repo-ai-governor check --output json`
3. Upgrade rehearsal
   - `pnpm exec repo-ai-governor upgrade --output json`
   - report: `/Users/jimmydaddy/.repo-ai-governor/workspaces/63cc611d2937/.repo-ai-governor/context/upgrade/upgrade-1774541921719.report.json`
4. Workspace rehearsal
   - dry-run: `pnpm exec repo-ai-governor workspace --workspace-action dry-run --workspace-mode repo_local --output json`
   - execute: `pnpm exec repo-ai-governor workspace --workspace-action execute --workspace-mode repo_local --output json`
   - rollback: `pnpm exec repo-ai-governor workspace --workspace-action rollback --workspace-plan /Users/jimmydaddy/.repo-ai-governor/workspaces/63cc611d2937/.repo-ai-governor/context/workspace/1774541976276-tool_managed-to-repo_local.plan.json --output json`
5. Workspace artifacts
   - dry-run plan: `/Users/jimmydaddy/.repo-ai-governor/workspaces/63cc611d2937/.repo-ai-governor/context/workspace/1774541958306-tool_managed-to-repo_local.plan.json`
   - execute plan: `/Users/jimmydaddy/.repo-ai-governor/workspaces/63cc611d2937/.repo-ai-governor/context/workspace/1774541976276-tool_managed-to-repo_local.plan.json`
   - execute execution: `/Users/jimmydaddy/.repo-ai-governor/workspaces/63cc611d2937/.repo-ai-governor/context/workspace/1774541976276-tool_managed-to-repo_local.execution.json`
   - rollback artifact: `/Users/jimmydaddy/.repo-ai-governor/workspaces/63cc611d2937/.repo-ai-governor/context/workspace/1774541976276-tool_managed-to-repo_local.rollback.json`

## 3. Observations

1. 默认首次接入体验是“CLI 可用，但治理面默认在用户 home 下的 tool-managed workspace”，这对首次 adopter 并不直观。
2. `doctor` 在 `tool_managed` 与 `repo_local` 两个阶段都给出 `baseline_docs missing=5/5` warning；这更像 external-adopter 基线现象，而不是仓库故障。
3. `check` 在简单 adopter 仓库中给出 4 条 `script_not_found` warning，分别对应自托管仓库里的 governance scripts；这说明当前 `check` 口径仍偏向 self-host repo，而不是外部 adopter repo。
4. `workspace --help` 只显示一句概述，没有把 `--workspace-action / --workspace-mode / --workspace-root / --workspace-plan` 这些实际必需参数暴露出来；首次用户需要依赖 root help、文档或猜测。
5. `workspace execute` 虽然成功把 active workspace 切到 repo-local，但输出里的 plan/execution/rollback artifact 仍然主要指向原 `tool_managed` 根路径；行为可用，但位置对 adopter 不直观。
6. rollback 后目标仓库下的 `.repo-ai-governor` 已被清理，CLI 也重新解析回 `tool_managed`，但 `.repo-ai-governor-migration/<migration-id>/backup` scratch 目录仍然残留在目标仓库中。

## 4. Gap Register

1. `init_default_surface_gap`
   - 表现：首次 `init` 成功，但目标仓库内没有任何治理面文件。
   - 影响：新 adopter 很容易误判“init 没生效”。
2. `doctor_external_baseline_docs_warning_gap`
   - 表现：`doctor` 立即报告 `baseline_docs missing=5/5`。
   - 影响：如果 playbook/troubleshooting 不明确解释，这条 warning 会被误读为 bootstrap failure。
3. `check_self_host_bias_gap`
   - 表现：外部 adopter 仓库运行 `check` 时，默认得到 `check-task-ledger-sync`、`check-sprint-plan-status-sync`、`check-code-review-status-sync`、`check-docs-triad-sync` 的 `script_not_found` warning。
   - 影响：当前 `check` 还没有把 external-adopter baseline 与 self-host baseline 清晰区分开。
4. `workspace_help_surface_gap`
   - 表现：子命令 help 没有直接暴露 workspace migration 所需参数。
   - 影响：用户难以仅凭 `repo-ai-governor workspace --help` 完成 dry-run/execute/rollback。
5. `workspace_artifact_locality_gap`
   - 表现：execute/rollback 产物主要写回原 `tool_managed` 根，而不是当前切换目标。
   - 影响：artifact path 虽然可用，但与 adopter 当前关注的 repo-local 工作区面脱节。
6. `workspace_migration_scratch_cleanup_gap`
   - 表现：rollback 后仍残留 `.repo-ai-governor-migration/<migration-id>/backup`。
   - 影响：目标仓库会留下中间态目录，影响回滚“清理完成”的直觉。

## 5. Recommended Follow-Up

1. 在 support matrix / playbook 中明确写出：
   - 默认 `init` 采用 `tool_managed`
   - 需要 repo-local 工作区时，应显式执行 `workspace --workspace-action dry-run|execute --workspace-mode repo_local`
2. 在 troubleshooting / known limitations 中把以下现象标成已知外部 adopter 基线：
   - `doctor` 的 `baseline_docs missing=5/5`
   - `check` 的 governance `script_not_found`
3. 在 CLI 文档或 command help 中补一组最小 workspace 示例，避免用户只能从 root help 或代码里反推参数。
4. 在 `TK-237` 中决定是否要把 workspace artifact 改为跟随 active/target workspace root；若不改，至少要把 artifact locality 写进文档。
5. 在后续 workspace cleanup 修复中处理 `.repo-ai-governor-migration` scratch 残留问题。

## 6. Exit Judgment

1. `TK-235` 的 exit goal 已满足：`playground` 已完成 install / init / doctor / check / upgrade / workspace rehearsal，并形成 gap register。
2. 这次 pilot 证明外部 adopter 路径“可用但仍不够直观”；后续不应再猜测，而应把这些真实 gap 回灌到 `TK-236` 与 `TK-237` 的 docs/gates closure。
