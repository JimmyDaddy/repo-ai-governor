# Sprint 007 Checklist

- [x] **TK-004** 建立发布与版本管理流程（负责人：CLI｜优先级：P0｜截止：2026-05-05｜状态：done）
  - 执行记录：plan=补齐发布前检查、版本策略、打包流程和发布候选说明，并让当前包进入可发布候选状态;result=已更新 `package.json` 发布元数据，新增 `scripts/release/check-release-ready.js`、`release:check`、`release:candidate` 与对应自动化测试;verify=`PATH=/opt/homebrew/bin:$PATH /opt/homebrew/bin/node --test test/release/release-distribution.test.js`
  - 执行记录：review_delta=已完成 `TK-004` 自检复核，CR 结果落盘为 `code-review/verified_review_tk-004-establish-release-and-version-flow.md`;verify=复核确认发布元数据、发布前检查脚本、tarball 干跑校验和 sprint 文档已经对齐
- [x] **TK-005** 实现 `upgrade` 命令最小版本（负责人：CLI｜优先级：P0｜截止：2026-05-06｜状态：done）
  - 执行记录：plan=补齐 `upgrade` 命令最小能力，覆盖 preview、backup 和版本迁移结果摘要，并复用 bootstrap 模板生成逻辑;result=已新增 `src/commands/upgrade-command.js`、`src/commands/bootstrap-shared.js`，并让 CLI 接入 `upgrade` 真正执行链路;verify=`PATH=/opt/homebrew/bin:$PATH /opt/homebrew/bin/node --test test/commands/upgrade-command.test.js`
  - 执行记录：review_delta=已完成 `TK-005` 自检复核，CR 结果落盘为 `code-review/verified_review_tk-005-implement-upgrade-command.md`;verify=复核确认命令接线、preview/backup 行为、共享模板模块和 sprint 文档已经对齐
- [x] **TK-006** 补齐本地分发与安装验收链路（负责人：Release｜优先级：P0｜截止：2026-05-07｜状态：done）
  - 执行记录：plan=补齐 `npm pack`、tarball 安装和 `npx` smoke test 验收，并沉淀本地分发校验脚本;result=已新增 `scripts/release/verify-local-distribution.js`，支持 tarball 安装与 `npx --no-install` 验证，并补齐对应自动化测试;verify=`PATH=/opt/homebrew/bin:$PATH /opt/homebrew/bin/node --test test/release/release-distribution.test.js`
  - 执行记录：review_delta=已完成 `TK-006` 自检复核，CR 结果落盘为 `code-review/verified_review_tk-006-verify-local-distribution.md`;verify=复核确认本地分发脚本、安装 smoke test、npm scripts 和 sprint 文档已经对齐
