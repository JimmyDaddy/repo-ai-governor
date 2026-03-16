# Skills Command Baseline

- Date: 2026-03-16
- Task: `TK-802`
- Status: done

## Goal

把 `skills install / list / doctor` 从需求描述落成最小可用 CLI，让官方 skill 分发链路真正进入“可发现、可安装、可自检”的状态。

## What Landed

1. 新增 `src/commands/skills-command.js`
   - 统一承接 `skills install`
   - `skills list`
   - `skills doctor`
2. 新增基础模块：
   - `src/skills/catalog.js`
   - `src/skills/runtime.js`
   - `src/skills/semver.js`
3. 更新 CLI 注册：
   - `src/cli/command-registry.js`
   - `src/cli/index.js`
4. 新增命令级测试：
   - `test/commands/skills-command.test.js`

## Command Surface

当前命令面如下：

1. `repo-ai-governor skills list`
   - 列出官方 catalog 内可用 skill
   - 列出指定 scope/surface 下已安装 skill
2. `repo-ai-governor skills install --surface <surface>`
   - 把官方 skill 安装到 repo local 或 user local 目标目录
   - 支持 `--skill`、`--target`、`--catalog`、`--force`
3. `repo-ai-governor skills doctor`
   - 检查 catalog 兼容性
   - 检查安装目标目录是否存在
   - 检查已安装 skill 的 manifest、`SKILL.md` 和版本兼容性
   - 支持 `--strict`

## Design Notes

1. 当前 `skills` 使用 `repo-ai-governor skills <action>` 的最小命令面，不额外引入嵌套 subcommand 框架改造。
2. 新增了 `--catalog`，便于：
   - 测试时注入临时官方 catalog
   - 后续支持自定义或离线 skill 分发
3. 运行时会把缺少 `skill.json` 的现有目录视为 `external skill`
   - 例如当前仓库里的 `.codex/skills/workspace-delivery-finisher`
   - 不会把这类外部 skill 误判为损坏安装
4. 当前官方 bundled catalog 仍为空，因此默认 `skills install` 会给出可理解的空 catalog 提示；`TK-803` 会继续补正式官方 skill 资产。

## Why This Matters

1. 用户安装本工具后，已经有明确入口发现和安装官方 skills。
2. `TK-803` 现在只需要补 skill 资产本身，不需要再回头重写安装命令。
3. `TK-804` 可以直接围绕 `skills install --surface ...` 做 `Codex / GitHub Copilot / Claude Code` 的接线基线。

## Verification

1. `PATH=/opt/homebrew/bin:$PATH /opt/homebrew/bin/node --test test/commands/skills-command.test.js`
2. `PATH=/opt/homebrew/bin:$PATH /opt/homebrew/bin/node ./bin/repo-ai-governor.js skills list --format json`
3. `PATH=/opt/homebrew/bin:$PATH /opt/homebrew/bin/node ./bin/repo-ai-governor.js skills doctor --surface codex --format json`
