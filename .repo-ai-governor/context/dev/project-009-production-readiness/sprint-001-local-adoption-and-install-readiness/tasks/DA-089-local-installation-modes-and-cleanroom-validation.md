# DA-089 本地安装模式（path/tgz/link）与 clean-room 验证基线

- Status: active
- Date: 2026-03-22
- Producer Task: `TK-077`
- Project: `project-009-production-readiness`
- Sprint: `sprint-001-local-adoption-and-install-readiness`

## 1. 目标

在“不经 npm 发布”的前提下，为 `repo-ai-governor` 提供可重复的本地安装与验证口径，并落地 Stage 9A 的硬门槛：

1. 至少两种安装模式通过 clean-room 连续 3 次 `--help -> init -> doctor -> check`。
2. 至少完成 1 组 `tool_managed -> repo_local -> rollback` workspace 切换验证。
3. 覆盖只读接入预检，确认 `doctor/init` 在 `tool_managed` 路径下不写入目标仓库。

## 2. 安装模式选型结论

| 模式 | Stage 9A 状态 | 推荐场景 | 当前约束 |
|---|---|---|---|
| `path` | mandatory | 本地分支开发、快速联调、无需打包 | 依赖源仓库可访问与已构建产物 |
| `link` | mandatory | 多仓联调、反复迭代、保持源码联动 | 同样依赖源仓库存在与本地链接环境 |
| `tgz` | deferred (Stage 9B) | 接近发布分发的离线安装演练 | 当前 clean-room 安装后 `repo-ai-governor --help` 报 `ERR_MODULE_NOT_FOUND(@repo-ai-governor/cli)`，需在后续发布分发收敛中修复 |

## 3. 验证脚本与报告

1. 脚本入口：
   - `scripts/release/verify-cleanroom-local-install.js`
   - `pnpm run release:verify-cleanroom-local-install`
2. 默认参数：
   - `modes=path,link`
   - `iterations=3`
3. 结构化报告：
   - `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/tasks/TK-077-cleanroom-validation-report.json`

## 4. Stage 9A 实测结果

1. `path`：3/3 轮通过（每轮均通过 `--help -> init -> doctor -> check`）。
2. `link`：3/3 轮通过（每轮均通过 `--help -> init -> doctor -> check`）。
3. workspace 切换验证：通过
   - `tool_managed -> repo_local -> rollback` 已完成，并验证回滚后 workspace root 回到原 `tool_managed` 路径。
4. 只读接入预检：通过
   - 在 `tool_managed` 路径下执行 `doctor/init` 后，目标仓库根目录无新增/删除条目。

## 5. 限制、回退与后续输入

1. 当前 `tgz` 模式尚未纳入 Stage 9A hard-exit，通过 `path/link` 满足“至少两种模式”的门槛。
2. 若团队需要立即开展本地试点，优先使用：
   - `path`: `pnpm add --save-exact <repo_root>`
   - `link`: `pnpm add --save-exact link:<repo_root>`
3. `tgz` 修复应在后续发布分发收敛任务中处理，并以 clean-room 重新验证后再升级为 mandatory 模式。
