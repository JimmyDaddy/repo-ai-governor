# Release-It Publish CI

- Date: 2026-03-16
- Task: `TK-901`
- Status: done

## Goal

把当前仓库的发布链路改造成 `release-it + publish CI` 的组合模式：本地或维护者侧使用 `release-it` 负责版本提升、tag 与 GitHub Release，GitHub Actions 在 Release published 后执行 npm publish。

## Implementation

1. 新增 [.release-it.json](/Users/jimmydaddy/study/repo-ai-governor/.release-it.json)
   - 使用 `release-it` v17 系列以保持 Node 18 兼容
   - 在 `before:init` 阶段执行 `npm run release:ga-check`
   - 保持 `npm.publish=false`，把真正的 npm publish 委托给 CI
2. 新增 [publish-npm.yml](/Users/jimmydaddy/study/repo-ai-governor/.github/workflows/publish-npm.yml)
   - 监听 `release.published`
   - 支持 `workflow_dispatch`
   - 先执行 `npm ci` 和 `npm run release:ga-check`
   - 再执行 `npm publish --provenance --access public`
3. 更新 [package.json](/Users/jimmydaddy/study/repo-ai-governor/package.json)
   - 新增 `release` 与 `release:dry-run`
   - 增加 `repository / bugs / homepage`
   - 开启 `publishConfig.provenance`
4. 更新 [check-release-ready.js](/Users/jimmydaddy/study/repo-ai-governor/scripts/release/check-release-ready.js)
   - 将 `.release-it.json` 与 `publish-npm.yml` 纳入 release readiness 校验

## Operational Model

1. 维护者在本地运行 `npm run release:dry-run`
2. 维护者确认无误后运行 `npm run release`
3. `release-it` 更新版本、生成 changelog、创建 tag 与 GitHub Release
4. GitHub Release published 事件触发 `publish-npm.yml`
5. workflow 通过 OIDC provenance 方式发布 npm 包

## Notes

1. 该 workflow 采用 npm Trusted Publishing 推荐模式，因此需要在 npm 后台将本仓库与 `.github/workflows/publish-npm.yml` 绑定为 trusted publisher。
2. 保留现有 [release-ga.yml](/Users/jimmydaddy/study/repo-ai-governor/.github/workflows/release-ga.yml) 作为运维备用路径；当前推荐路径以 `release-it + publish-npm.yml` 为主。
3. 当前 changelog 自动生成以 `CHANGELOG.md` 为主，`CHANGELOG.zh-CN.md` 仍保留人工校对更新。

## Verification

1. `PATH=/opt/homebrew/bin:$PATH /opt/homebrew/bin/node --test test/release/release-automation.test.js`
2. `PATH=/opt/homebrew/bin:$PATH /opt/homebrew/bin/node --test test/release/release-distribution.test.js`
3. `PATH=/opt/homebrew/bin:$PATH /opt/homebrew/bin/npm run release:check`
4. `PATH=/opt/homebrew/bin:$PATH /opt/homebrew/bin/npm run check`
