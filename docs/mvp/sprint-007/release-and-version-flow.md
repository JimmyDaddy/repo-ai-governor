# Release And Version Flow

- Date: 2026-03-14
- Task: `TK-004`
- Status: done

## Goal

建立当前仓库的发布与版本管理流程，让工具进入“可打包、可本地安装、可执行发布候选检查”的状态。

## What Landed

1. 更新 [package.json](/Users/jimmydaddy/study/repo-ai-governor/package.json)
   - `private` 改为 `false`
   - 增加 `files` 白名单
   - 增加 `license` 与 `publishConfig`
   - 增加 `release:check`、`release:verify-local`、`release:candidate`、`release:pack`
2. 新增 `scripts/release/check-release-ready.js`
   - 校验发布元数据
   - 执行 `npm pack --json --dry-run`
   - 检查 tarball 中的关键文件
3. 新增 `test/release/release-distribution.test.js`
   - 覆盖发布前检查脚本
   - 覆盖本地分发安装验收脚本

## Why This Works

1. 发布前检查现在不再只看文档，而是直接检查 `package.json` 和 tarball 干跑结果。
2. `files` 白名单把包内容边界收紧到 `bin/`、`src/`、`scripts/examples/`，避免把 docs/tests 一起带进分发包。
3. `release:candidate` 串起了 `check -> release:check -> release:verify-local`，形成最小发布候选链路。

## Verification

1. `PATH=/opt/homebrew/bin:$PATH /opt/homebrew/bin/node --test test/release/release-distribution.test.js`
2. `PATH=/opt/homebrew/bin:$PATH /opt/homebrew/bin/npm run check`
