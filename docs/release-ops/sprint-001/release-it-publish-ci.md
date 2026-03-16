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
   - 当前 npm 包名为 `@cjhdev/repo-ai-governor`，CLI 命令仍为 `repo-ai-governor`
4. 更新 [check-release-ready.js](/Users/jimmydaddy/study/repo-ai-governor/scripts/release/check-release-ready.js)
   - 将 `.release-it.json` 与 `publish-npm.yml` 纳入 release readiness 校验
5. 更新 [run-getting-started-check.sh](/Users/jimmydaddy/study/repo-ai-governor/scripts/release/run-getting-started-check.sh)
   - 改为优先读取显式 `NODE_BIN / NPM_BIN`
   - 其次通过 `command -v` 自动发现 `node` 与 `npm`
   - 最后才退回 `/opt/homebrew/bin/*` 作为本机兼容 fallback

## Operational Model

1. 维护者在本地运行 `npm run release:dry-run`
2. 维护者确认无误后运行 `npm run release`
3. `release-it` 更新版本、生成 changelog、创建 tag 与 GitHub Release
4. GitHub Release published 事件触发 `publish-npm.yml`
5. workflow 通过 OIDC provenance 方式发布 npm 包

## Notes

1. 该 workflow 采用 npm Trusted Publishing 推荐模式，因此需要在 npm 后台将本仓库与 `.github/workflows/publish-npm.yml` 绑定为 trusted publisher。
2. [release-ga.yml](/Users/jimmydaddy/study/repo-ai-governor/.github/workflows/release-ga.yml) 已收敛为“手动创建 tag / GitHub Release 的备用流”，不再直接负责 npm publish；当前唯一 npm 发布入口是 `publish-npm.yml`。
3. 当前 changelog 自动生成以 `CHANGELOG.md` 为主，`CHANGELOG.zh-CN.md` 仍保留人工校对更新。
4. 为避免 scoped package 导致 tarball 文件名变化，`release-ga.yml` 现已改为动态解析 `npm pack --json` 输出，不再写死 tarball 名称。
5. 这次 GitHub CI 报错的根因不是 npm publish 权限，而是 `run-getting-started-check.sh` 之前把 `NODE_BIN / NPM_BIN` 默认写死成了 `/opt/homebrew/bin/*`，在 GitHub runner 上不存在。
6. 当仓库或组织级别存在 `NODE_AUTH_TOKEN` 时，`publish-npm.yml` 现已在 job 环境中显式清空 `NODE_AUTH_TOKEN / NPM_TOKEN`，并在发布前删除 `//registry.npmjs.org/:_authToken`，确保发布步骤走 OIDC trusted publishing，而不是意外回落到 token 发布路径。
7. 为满足 npm Trusted Publishing 的运行时要求，`publish-npm.yml` 的 `setup-node` 已升级到 Node `24`，并在 `Publish to npm` step 中再次执行 step 级 token 清空与 `unset`，避免外部环境变量覆盖。

## Verification

1. `PATH=/opt/homebrew/bin:$PATH /opt/homebrew/bin/node --test test/release/release-automation.test.js`
2. `PATH=/opt/homebrew/bin:$PATH /opt/homebrew/bin/node --test test/release/release-distribution.test.js`
3. `PATH=/opt/homebrew/bin:$PATH /opt/homebrew/bin/npm run release:check`
4. `PATH=/opt/homebrew/bin:$PATH /opt/homebrew/bin/npm run check`
