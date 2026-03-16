# Official Skill Package Layout

- Date: 2026-03-16
- Task: `TK-801`
- Status: done

## Goal

把 `skills-v1` 的官方 skill 分发能力收敛成一套可被 CLI 和后续安装逻辑直接消费的结构化基线，而不是只保留在设计文档里。

## What Landed

1. 新增 `src/skills/package-layout.js`
   - skill package layout 常量
   - install target 默认值
   - `resolveSkillPackageLayout`
   - `normalizeSkillId`
2. 新增 schema：
   - `src/config/schema/skill-manifest.schema.json`
   - `src/config/schema/skill-catalog.schema.json`
3. 新增打包资产骨架：
   - `skills/official/catalog.json`
   - `skills/official/README.md`
   - `skills/shared/README.md`
4. 更新 npm 分发清单
   - `package.json` 现在包含 `skills/`
5. 更新 schema bundle 和测试
   - `test/config/schema.test.js`
   - `test/skills/package-layout.test.js`

## Package Layout

当前约定如下：

1. npm 包内官方 skill 资产根：
   - `skills/official/`
2. npm 包内共享资产根：
   - `skills/shared/`
3. 官方 catalog 入口：
   - `skills/official/catalog.json`
4. 单个 skill 目录约定：
   - `SKILL.md`
   - `skill.json`
   - `agents/`
   - `scripts/`
   - `templates/`
   - `references/`

## Install Targets

当前默认 install target 约定：

1. `Codex`
   - repo local: `.codex/skills`
   - user local: `$CODEX_HOME/skills`
   - mode: `native`
2. `GitHub Copilot`
   - repo local: `.github/skills`
   - user local: `$HOME/.copilot/skills`
   - mode: `hybrid`
3. `Claude Code`
   - repo local: `.claude/skills`
   - user local: `$HOME/.claude/skills`
   - mode: `native`

## Why This Matters

1. `TK-802` 可以直接基于 `catalog.json` 和 layout helper 做安装、列出与健康检查。
2. `TK-803` 可以在这个骨架下继续补正式 skill 资产，而不会重复定义目录结构。
3. `TK-804` 可以围绕同一套 install target 规则做三类 adapter 的 skill 接线。

## Verification

1. `PATH=/opt/homebrew/bin:$PATH /opt/homebrew/bin/node --test test/skills/package-layout.test.js`
2. `PATH=/opt/homebrew/bin:$PATH /opt/homebrew/bin/node --test test/config/schema.test.js`
