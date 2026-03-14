# 变更日志

[English](./CHANGELOG.md) | [简体中文](./CHANGELOG.zh-CN.md)

本文件用于记录项目的重要变更。

格式遵循 Keep a Changelog，版本号遵循语义化版本，并结合仓库在 `docs/release-ga/sprint-001/ga-release-flow.md` 中约定的发布策略。

## [Unreleased]

### Planned

- 正式 GA 发布流程与版本策略说明
- 面向外部用户的 README 与 Quick Start
- 远端 release / tag / changelog 自动化骨架
- 10 分钟上手验收路径

## [0.1.0] - 2026-03-14

### Added

- 基于 Commander 的 CLI，提供 `init`、`doctor`、`plan`、`check`、`review`、`review-verify`、`report`、`upgrade`
- 仓库治理配置加载、schema 校验与初始化模板
- 治理 workflow engine、标准规范包、slot runtime 与统一报告模型
- `Codex`、`GitHub Copilot`、`Claude Code` 三类适配示例
- CI 调用脚本、验收套件、本地分发验证和 release candidate 检查
