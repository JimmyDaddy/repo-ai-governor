# TK-223 packaging/install matrix 与 failure-class baseline

- Status: completed
- Date: 2026-03-26
- Owner: AI-Agent
- Priority: P0
- Project: `project-020-adoption-productization-and-upgrade-ux`
- Sprint: `sprint-001-packaging-truthfulness-failure-baseline`

## 1. 任务目标

把 `path / link / tgz` 三种安装模式收敛成可重复执行的 install matrix，并形成 packaged distribution failure taxonomy 与 deterministic diagnosis baseline。

## 2. Depends On

1. `TK-222`
2. `DA-216`
3. `DA-220`

## 3. 预期产物

1. install matrix baseline。
2. failure classes 与 deterministic diagnosis summary。
3. 为 `sprint-002` 输入的 packaged distribution truthfulness baseline。
4. `DA-223`

## 4. 实施计划

1. 明确 `path / link / tgz` 三种安装模式下的最小验证链路。
2. 复现并归类 packaged install / runtime resolution 失败类型。
3. 收敛 fault classes，避免后续 release gate 与文档描述使用模糊失败语义。

## 5. 验证

1. `rg -n "path|link|tgz|failure|truthfulness|clean-room" .repo-ai-governor/context/dev/project-020-adoption-productization-and-upgrade-ux -g '*.md'`

## 6. 执行记录

1. 2026-03-26：任务创建，状态初始化为 `planned`。
2. 2026-03-26：状态切换为 `in_progress`，开始盘点 clean-room / pack / install / release gate 相关脚本与 path/link/tgz 安装矩阵。
3. 2026-03-26：执行 `path`、`link`、`tgz` 三种模式的一轮 clean-room baseline，并补跑 `release:verify-local` packed distribution 验证。
4. 2026-03-26：确认 `path`、`link` 在当前沙箱环境下可稳定通过；`tgz` 在真实网络下同样可通过完整 `--help -> init -> doctor -> check` 链路。
5. 2026-03-26：确认当前 `tgz` 的显式 failure class 不是 README 中旧的 `ERR_MODULE_NOT_FOUND(@repo-ai-governor/cli)`，而是受限网络环境下 `pnpm add <tarball>` 需要解析 `commander/i18next/yaml` 时触发的 install-time registry dependency failure，形成 `DA-223`。
