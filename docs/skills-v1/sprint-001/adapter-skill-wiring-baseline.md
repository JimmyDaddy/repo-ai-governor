# Adapter Skill Wiring Baseline

- Date: 2026-03-16
- Task: `TK-804`
- Status: done

## Goal

把同一套官方 skills 明确接到 `Codex / GitHub Copilot / Claude Code` 的消费入口上，并说明哪些能力属于原生 skill，哪些仍是补充投影层。

## Wiring Matrix

| Adapter | Native Skill Target | Native Status | Supplementary Layer | Notes |
| --- | --- | --- | --- | --- |
| `Codex` | `.codex/skills/` | native | Markdown bundle | bundle 继续补 stage/runtime 上下文 |
| `GitHub Copilot` | `.github/skills/` | native | `copilot-instructions` + CLI prompt | instructions/prompt 作为补充规则注入 |
| `Claude Code` | `.claude/skills/` | native | `system prompt` + `task prompt` | 可继续与 subagent 组合 |

## Recommended Install Commands

1. `Codex`
   - `repo-ai-governor skills install --surface codex`
2. `GitHub Copilot`
   - `repo-ai-governor skills install --surface github-copilot`
3. `Claude Code`
   - `repo-ai-governor skills install --surface claude-code`

## Boundary Rules

1. 官方 skills 是第一入口：
   - 承载治理行为
   - 承载触发词
   - 承载步骤和产物回写规则
2. adapter bundle / instructions / prompt 是补充层：
   - 注入当前 command/stage 的运行时上下文
   - 提供 IDE 或 CLI 更自然的入口格式
   - 不替代 skill 本体
3. 同一个仓库可以同时存在：
   - 原生 installed skills
   - bundle / instructions / prompt 投影

## Acceptance Path

每个 adapter 的最小验收路径都应包含：

1. `repo-ai-governor init --adapter <adapter>`
2. `repo-ai-governor skills install --surface <adapter>`
3. 检查原生 skill 目录存在
4. 如该 adapter 有补充投影层，再渲染对应 bundle / instructions / prompt

## Why This Matters

1. `TK-803` 交付的官方 skill 资产现在有了明确消费入口。
2. 三类 adapter 都沿用同一套官方 skill 本体，不会因为入口不同而复制 skill 逻辑。
3. 后续 `skills-v1` 的 script-assisted 与 workflow integration 可以继续复用这条接线基线。
