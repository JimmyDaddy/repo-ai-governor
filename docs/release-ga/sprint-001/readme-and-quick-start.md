# README And Quick Start

- Date: 2026-03-14
- Task: `TK-702`
- Status: done

## Goal

为外部用户补齐仓库级入口文档，让第一次接触 `Repo AI Governor` 的用户能快速理解产品定位、安装方式、最小体验路径和命令入口。

## What Landed

1. 新增根目录 `README.md`
   - 新增 `README.zh-CN.md`
   - 产品定位
   - 当前能力边界
   - 安装方式
   - 最小 Quick Start
   - 核心命令说明
   - 示例与发布入口链接
2. 新增 `docs/quick-start.md`
   - 面向第一次试用的最短路径
   - 覆盖 `init`、`doctor`、`plan`、`check`、`review`、`report`
3. 新增 `docs/getting-started-example.md`
   - 提供更完整的最小治理闭环示例
   - 串起初始化、规划、检查、评审、复核和报告
4. 更新 `release:check`
   - 把 `README.md` 与 `README.zh-CN.md` 纳入 GA release readiness 校验

## Why This Works

1. 中英文根目录 `README` 一起解决“用户进入仓库后不知道这是什么、怎么安装、先跑什么”的首屏问题。
2. `quick-start.md` 提供最短、可复制的路径，降低首次试用门槛。
3. `getting-started-example.md` 则承接更完整的治理闭环，避免 README 过长。
4. `release:check` 把 `README` 变成正式发布前的硬性检查项，减少“功能有了但入口文档缺失”的风险。

## Verification

1. `PATH=/opt/homebrew/bin:$PATH /opt/homebrew/bin/npm run release:check`
2. `PATH=/opt/homebrew/bin:$PATH /opt/homebrew/bin/node --test test/release/release-distribution.test.js`
3. `PATH=/opt/homebrew/bin:$PATH /opt/homebrew/bin/npm run check`
