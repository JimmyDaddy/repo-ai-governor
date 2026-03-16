# Verified Review - TK-901 Integrate Release-It Publish CI

- Status: verified
- Date: 2026-03-16
- Task: `TK-901`

## Scope

复核 `release-it` 配置、publish workflow、release readiness 校验、README 发布说明以及相关自动化测试。

## Findings

1. 无阻断问题。

## Verification Notes

1. 已核对 [.release-it.json](/Users/jimmydaddy/study/repo-ai-governor/.release-it.json)，确认 `release-it` 会先执行 `npm run release:ga-check`，并把 npm publish 委托给 CI。
2. 已核对 [publish-npm.yml](/Users/jimmydaddy/study/repo-ai-governor/.github/workflows/publish-npm.yml)，确认 workflow 监听 `release.published`、执行 `npm ci` 与 `npm run release:ga-check`，并使用 `npm publish --provenance --access public`。
3. 已核对 [package.json](/Users/jimmydaddy/study/repo-ai-governor/package.json)，确认新增 `release`、`release:dry-run`、`repository`、`bugs`、`homepage` 和 `publishConfig.provenance`。
4. 已核对 [test/release/release-automation.test.js](/Users/jimmydaddy/study/repo-ai-governor/test/release/release-automation.test.js) 与 [test/release/release-distribution.test.js](/Users/jimmydaddy/study/repo-ai-governor/test/release/release-distribution.test.js)，确认新发布链路已有自动校验。
5. 已核对 [README.md](/Users/jimmydaddy/study/repo-ai-governor/README.md) 和 [README.zh-CN.md](/Users/jimmydaddy/study/repo-ai-governor/README.zh-CN.md)，确认维护者入口已解释 `release-it + publish CI` 的推荐路径。
6. 已核对 [release-ga.yml](/Users/jimmydaddy/study/repo-ai-governor/.github/workflows/release-ga.yml)，确认其已收敛为手动备用流，不再直接执行 npm publish。
7. 已核对 scoped package 名影响面，确认当前安装文档已明确包名为 `@cjhdev/repo-ai-governor`、CLI 仍为 `repo-ai-governor`，且 `release-ga.yml` 已改为动态解析 tarball 文件名。
8. 已核对 [run-getting-started-check.sh](/Users/jimmydaddy/study/repo-ai-governor/scripts/release/run-getting-started-check.sh)，确认脚本不再默认依赖 `/opt/homebrew/bin/node` 与 `/opt/homebrew/bin/npm`，因此 GitHub runner 可通过系统 PATH 正常执行。
9. 已核对 [publish-npm.yml](/Users/jimmydaddy/study/repo-ai-governor/.github/workflows/publish-npm.yml)，确认 job 级环境显式清空 `NODE_AUTH_TOKEN/NPM_TOKEN`，并在发布前执行 `npm config delete //registry.npmjs.org/:_authToken || true`，避免仓库级 token 覆盖 OIDC trusted publishing。
10. 已核对 [publish-npm.yml](/Users/jimmydaddy/study/repo-ai-governor/.github/workflows/publish-npm.yml) 与 [test/release/release-automation.test.js](/Users/jimmydaddy/study/repo-ai-governor/test/release/release-automation.test.js)，确认发布运行时升级为 Node `24`，并在 publish step 级别 `unset NODE_AUTH_TOKEN/NPM_TOKEN`，以规避 `ENEEDAUTH` 场景下的身份路径混用。
11. 已核对 [init-command.js](/Users/jimmydaddy/study/repo-ai-governor/src/commands/init-command.js) 与 [run-getting-started-check.sh](/Users/jimmydaddy/study/repo-ai-governor/scripts/release/run-getting-started-check.sh)，确认 gate 场景可通过 `REPO_AI_GOVERNOR_SELF_INSTALL_SOURCE` 传入本地 tarball 作为自安装来源，避免发布前版本尚未上架导致 `init` 依赖安装失败。

## Conclusion

1. `TK-901` 当前实现可接受，维持 `verified` 状态。
