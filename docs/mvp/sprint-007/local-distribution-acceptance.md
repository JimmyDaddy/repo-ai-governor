# Local Distribution Acceptance

- Date: 2026-03-14
- Task: `TK-006`
- Status: done

## Goal

补齐本地分发与安装验收链路，验证当前包可以通过 tarball 安装并使用 `npx` 风格入口执行 CLI。

## What Landed

1. 新增 `scripts/release/verify-local-distribution.js`
   - 执行 `npm pack --json`
   - 在临时目录安装 tarball
   - 验证 `npx --no-install repo-ai-governor --help`
   - 验证 `npx --no-install repo-ai-governor --version`
2. 新增 `test/release/release-distribution.test.js`
   - 覆盖本地分发安装 smoke test
3. 更新 `package.json`
   - 增加 `release:verify-local`
   - 增加 `release:candidate`

## Acceptance Path

推荐本地执行顺序：

1. `npm run check`
2. `npm run release:check`
3. `npm run release:verify-local`
4. `npm run release:candidate`

## Why This Works

1. `npm pack` 直接生成本地 tarball，最贴近真实发布候选。
2. 安装后使用 `npx --no-install` 调 CLI，可以同时验证 bin 入口和本地包解析。
3. 这条链路不依赖远端 registry，因此可以稳定纳入自动化测试。

## Verification

1. `PATH=/opt/homebrew/bin:$PATH /opt/homebrew/bin/node --test test/release/release-distribution.test.js`
2. `PATH=/opt/homebrew/bin:$PATH /opt/homebrew/bin/npm run check`
