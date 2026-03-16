# Release Ops Sprint 001 Plan

- Status: active
- Date: 2026-03-16
- Project: `release-ops`
- Sprint: `sprint-001`

## Goal

为当前仓库接入 `release-it` 和 publish CI，使发布链路具备版本提升、tag / GitHub Release 和 npm publish 的自动化基础。

## In Scope

1. 引入 `release-it` 与 changelog 插件配置
2. 接入 npm publish GitHub Actions workflow
3. 让现有 release gate 与新发布链路对齐
4. 补齐验证与最小文档说明

## Out Of Scope

1. 真实执行 npm publish
2. 回滚工具化
3. 多 registry 或私有 registry 支持

## Acceptance

1. 仓库存在正式 `release-it` 配置与 `release` 脚本
2. 仓库存在 publish workflow，可在 GitHub Release published 事件中执行 npm publish
3. 发布 workflow 会先跑现有 `release:ga-check`
4. 自动化测试覆盖 `release-it` 配置和 publish workflow 关键约束

## Verification Path

1. `PATH=/opt/homebrew/bin:$PATH /opt/homebrew/bin/node --test test/release/release-automation.test.js`
2. `PATH=/opt/homebrew/bin:$PATH /opt/homebrew/bin/node --test test/release/release-distribution.test.js`
3. `PATH=/opt/homebrew/bin:$PATH /opt/homebrew/bin/npm run release:check`
4. `PATH=/opt/homebrew/bin:$PATH /opt/homebrew/bin/npm run check`

## Tasks

1. `TK-901` 集成 `release-it + publish CI`
2. `TK-902` 修复 npm 安装后 `init` 首次上手可用性
