# GA Release Flow

- Date: 2026-03-14
- Task: `TK-701`
- Status: done

## Goal

把当前已经存在的发布候选能力整理成正式发布流程，明确版本策略、自动化门禁、人工确认项和 GA 触发条件。

## Version Policy

当前项目仍处于 `0.x` 阶段，但版本升级仍按语义化版本的意图执行：

1. Patch
   - 文档修正
   - 非破坏性 bug fix
   - 不改变默认治理流程和配置结构的小修补
2. Minor
   - 新命令、新参数、新报告字段
   - 向后兼容的 schema 字段扩展
   - 新适配器、新示例资产、新检查能力
3. Major
   - 破坏性 CLI 变更
   - 破坏性 schema / artifact / workflow 变更
   - 默认权限边界或自动化语义发生不兼容调整

## Automated Gate

正式发布前，至少需要通过：

1. `npm run check`
2. `npm run release:check`
3. `npm run release:verify-local`
4. `npm run release:ga-check`

说明：

1. `release:check` 会校验 `package.json` 发布元数据、semver 版本、`publishConfig.access`、`CHANGELOG.md`、`CHANGELOG.zh-CN.md`、`README.md`、`README.zh-CN.md` 和 tarball 干跑内容。
2. `release:verify-local` 会打包、安装并验证 `--help` / `--version`。
3. `release:ga-check` 当前是 GA 发布前的统一入口，串起前面的自动化门禁。

## Manual Gate

自动化通过后，还需要人工确认：

1. `CHANGELOG.md` / `CHANGELOG.zh-CN.md` 已更新且内容准确
2. 对外 `README.md` / `README.zh-CN.md` / Quick Start 与当前 CLI 能力一致
3. 如存在破坏性变更，已明确升级说明和迁移路径
4. 发布账号、npm 凭据、远端 release 前置条件可用

## GA Criteria

要把一个版本视为“可正式 GA”而不是仅候选，需要同时满足：

1. 自动化门禁通过
2. 本地安装 smoke test 通过
3. 对外文档已补齐
4. 10 分钟上手路径可复现
5. 破坏性变更、风险项和人工确认点已写入发布说明

## Release Steps

建议采用以下顺序：

1. 更新 `package.json` 版本号
2. 更新 `CHANGELOG.md` 与 `CHANGELOG.zh-CN.md`
3. 运行 `npm run release:ga-check`
4. 准备 release notes
5. 创建 tag / release
6. 由 `publish-npm.yml` 在 `release.published` 后执行 npm publish
7. 回填 release 记录和验证结果

说明：

1. 当前发布包名是 `@cjhdev/repo-ai-governor`，但 CLI 可执行命令仍然是 `repo-ai-governor`。
2. `release-ga.yml` 已改为动态解析 tarball 文件名，不再假设文件名固定为 `repo-ai-governor-<version>.tgz`。

## Current Limitation

1. 当前仓库还没有配置远端，因此真实 tag / release / publish 仍需要后续 `TK-703` 去补齐自动化骨架。
2. 当前仓库也还没有根目录 `README`，因此面向外部用户的上手链路仍依赖 `TK-702`。

## Verification

1. `PATH=/opt/homebrew/bin:$PATH /opt/homebrew/bin/node --test test/release/release-distribution.test.js`
2. `PATH=/opt/homebrew/bin:$PATH /opt/homebrew/bin/npm run release:check`
