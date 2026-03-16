# Remote Release Automation

- Date: 2026-03-14
- Task: `TK-703`
- Status: done

## Goal

在当前仓库还没有真实远端发布配置的前提下，先提供可直接迁移到 GitHub 仓库中的 release 自动化骨架，覆盖 tag、release notes、artifact 上传和 npm publish 的关键步骤。

## What Landed

1. 新增 `.github/workflows/release-ga.yml`
   - `workflow_dispatch` 入口
   - 版本输入校验
   - `npm run release:ga-check`
   - release notes 渲染
   - tarball 打包与 artifact 上传
   - git tag / GitHub release 的条件化步骤
2. 新增 `scripts/release/render-release-notes.js`
   - 从 `CHANGELOG.md` 渲染指定版本或 `Unreleased` 的 release notes
   - 支持直接输出到文件，供 workflow 复用
3. 更新 `release:check`
   - 要求存在远端 release workflow 骨架
   - 要求存在 release notes 脚本

## Remote Prerequisites

要让这个骨架在真实远端仓库中工作，至少需要：

1. 远端 GitHub 仓库
2. 默认分支可由 GitHub Actions 创建和推送 tag
3. 仓库默认 `GITHUB_TOKEN` 具备 `contents: write`

## Workflow Inputs

`release-ga.yml` 当前支持：

1. `version`
   - 必填
   - 必须与 `package.json` 版本一致
2. `create_github_release`
   - 默认 `true`
   - 为 `true` 时创建 tag 与 GitHub release

## Safety Boundary

1. 当前骨架默认手动触发，不自动在 push/tag 时执行。
2. 只有在 `package.json` 版本与输入版本一致时才继续。
3. 先跑 `release:ga-check`，再进入 tag / release。
4. npm publish 当前由 `publish-npm.yml` 独立承接，避免手动 release workflow 与真正的 publish workflow 重叠。

## Suggested Remote Rollout

1. 先在 GitHub 仓库中落地当前 workflow 骨架。
2. 先跑一次手动 release workflow，确认 release notes、artifact、tag 行为无误。
3. 再配置 npm Trusted Publisher，让 `publish-npm.yml` 作为唯一 npm 发布入口。
4. 确认 `release-it` 与 `publish-npm.yml` 主路径可用后，再把 `release-ga.yml` 保留为运维备用流。

## Verification

1. `PATH=/opt/homebrew/bin:$PATH /opt/homebrew/bin/node --test test/release/release-automation.test.js`
2. `PATH=/opt/homebrew/bin:$PATH /opt/homebrew/bin/npm run release:check`
