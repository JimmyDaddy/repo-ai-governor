# TK-235 `playground` adopter pilot baseline

- Status: completed
- Date: 2026-03-27
- Owner: AI-Agent
- Priority: P0
- Project: `project-020-adoption-productization-and-upgrade-ux`
- Sprint: `sprint-004-adopter-pilot-and-documentation-closure`

## 1. 任务目标

在简单仓库 `/Users/jimmydaddy/study/playground` 上完成一次 adopter-facing 接入与 upgrade/workspace rehearsal，收敛首次接入真值与基础 UX gap。

## 2. Depends On

1. `TK-234`
2. `DA-234`

## 3. 预期产物

1. `playground` pilot 运行记录。
2. 接入、升级、workspace rehearsal gap register。
3. 对 support matrix / playbook 的回灌建议。

## 4. 实施计划

1. 在 `playground` 仓库执行 install / init / doctor/check 基线验证。
2. 执行 `upgrade` schema diff 与 confirmation review。
3. 执行 `workspace` dry-run / execute / rollback rehearsal，并记录 CLI 与 artifact truthfulness。

## 5. 验证

1. 目标仓库内的安装与 CLI 运行记录。
2. `repo-ai-governor` 侧 task/artifact ledger 同步。

## 6. 执行记录

1. 2026-03-27：任务创建，状态初始化为 `planned`。
2. 2026-03-27：状态切换为 `in_progress`，开始以 `playground` 作为首个 adopter pilot 仓库收敛首次接入真值。
3. 2026-03-27：在 `/Users/jimmydaddy/study/playground` 完成 `pnpm install -> repo-ai-governor init/doctor/check/upgrade`，确认默认首次接入会落到 `tool_managed` workspace，且 `doctor`/`check` 会出现 external-adopter 基线 warning。
4. 2026-03-27：完成 `workspace --workspace-action dry-run/execute/rollback --workspace-mode repo_local` 演练，确认 cutover/rollback 可闭环，但暴露了 help surface、artifact locality 与 rollback 后 migration scratch 残留等 UX gap；结果已沉淀到 `DA-235`。
