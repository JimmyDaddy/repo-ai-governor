# DA-091 用户接入文档与本地采用手册基线

- Status: completed
- Date: 2026-03-22
- Producer Task: `TK-079`
- Project: `project-009-production-readiness`
- Sprint: `sprint-001-local-adoption-and-install-readiness`

## 1. 目标

补齐工具用户可见文档资产，确保接入方可在 5~15 分钟内完成本地安装、初始化验证、基础排障与升级路径判断。

## 2. 交付内容

1. 双语 README：`README.md`、`README.zh-CN.md`
2. 双语 CHANGELOG：`CHANGELOG.md`、`CHANGELOG.zh-CN.md`
3. 双语本地采用手册：`docs/local-adoption-playbook.md`、`docs/local-adoption-playbook.zh-CN.md`
4. 文档中已覆盖：
   - 本地安装方式（path/link/tgz）
   - 只读接入预检
   - `--help -> init -> doctor -> check` 命令链
   - `run --dry-run --trace` 与 replay 调试
   - `review -> review-verify -> ledger backfill` 用户可见闭环
   - workspace 切换/rollback 指引
   - examples 与 clean-room 验证入口

## 3. 迁移与兼容说明

1. `check:examples-smoke` 从 doc-only 升级为 doc+runtime 聚合校验。
2. 如需仅文档验证，应显式改用 `check:examples-doc-smoke`。
3. 运行期机器消费仍基于稳定 JSON 字段：`status`、`command`、`command_result.operation`。
4. `tgz` 安装路径在 clean-room 下仍存在 `ERR_MODULE_NOT_FOUND(@repo-ai-governor/cli)` 已知限制；Stage 9A 推荐使用 `path/link`，`tgz` 作为 Stage 9B fix-forward 项跟进。

## 4. Stage 9B 输入前置条件

1. 文档链路已显式说明 review-verify 与台账回写路径。
2. 文档已回链 examples、governance gate 与 clean-room 验证基线。
3. 可直接供 `DA-092` 消费为 sprint-002 文档 readiness 输入。

## 5. 验证

1. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
3. `node ./scripts/governance/check-code-review-status-sync.js`（通过）
4. `pnpm run check`（通过）
