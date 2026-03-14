# Ten-Minute Getting Started

- Date: 2026-03-14
- Task: `TK-704`
- Status: done

## Goal

把当前已有的安装、初始化、规划、检查和报告能力整理成一条 10 分钟内可以跑通的路径，并让它既能作为对外试用手册，也能作为发布回归脚本。

## What Landed

1. 新增 `examples/release-ga-getting-started/`
   - `request.md`
   - `acceptance-record-template.md`
   - `README.md`
2. 新增 `scripts/release/run-getting-started-check.sh`
   - 从本地 tarball 安装 CLI
   - 跑通 `init`
   - 跑通 `doctor`
   - 跑通 `plan`
   - 跑通 `check`
   - 跑通 `report`
3. 将 getting-started 验收脚本纳入 release readiness 检查

## Why This Works

1. 它不是只验证源码仓库里的 CLI，而是先走一遍“打包 -> 安装 -> 执行”的真实路径。
2. 它复用了已有的本地分发与计划/检查链路，而不是另起一套演示工程。
3. 既能给外部用户一个稳定入口，也能给每次发布一个可重复的 smoke/regression path。

## Regression Suggestion

每次准备正式发布时，至少执行：

1. `npm run release:check`
2. `node --test test/release/release-distribution.test.js`
3. `node --test test/release/release-automation.test.js`
4. `/bin/bash ./scripts/release/run-getting-started-check.sh --format=json`
5. `npm run check`

## Verification

1. `PATH=/opt/homebrew/bin:$PATH /bin/bash ./scripts/release/run-getting-started-check.sh --format=json --keep-artifacts`
2. `PATH=/opt/homebrew/bin:$PATH /opt/homebrew/bin/node --test test/release/getting-started-acceptance.test.js`
3. `PATH=/opt/homebrew/bin:$PATH /opt/homebrew/bin/npm run release:check`
4. `PATH=/opt/homebrew/bin:$PATH /opt/homebrew/bin/npm run check`
