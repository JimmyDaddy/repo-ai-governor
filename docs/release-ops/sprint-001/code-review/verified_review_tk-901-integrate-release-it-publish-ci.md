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

## Conclusion

1. `TK-901` 当前实现可接受，维持 `verified` 状态。
