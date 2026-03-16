# Official Skill Assets

- Date: 2026-03-16
- Task: `TK-803`
- Status: done

## Goal

把首批官方治理 skill 从设计名称落成真正可安装的资产目录，让 `skills install` 默认就能分发一套可用的治理节点。

## What Landed

1. 更新官方 catalog：
   - `skills/official/catalog.json`
2. 新增 4 个官方 skill 目录：
   - `skills/official/governor-context-loader/`
   - `skills/official/governor-plan-runner/`
   - `skills/official/governor-task-implementer/`
   - `skills/official/governor-delivery-finisher/`
3. 每个 skill 都包含：
   - `SKILL.md`
   - `skill.json`
   - `agents/openai.yaml`
   - `scripts/`
   - `templates/`
   - `references/`
4. 新增资产级测试：
   - `test/skills/official-skill-assets.test.js`

## Bundled Skills

1. `governor-context-loader`
   - 读取 `AGENTS.md` 与 `current-context.md`
   - 汇总当前 stream 的 artifact 路径
2. `governor-plan-runner`
   - 组织需求输入
   - 调用 `repo-ai-governor plan`
   - 校验 `plan.md`、`checklist.md`、`tasks.csv` 和 `TK-xxx.md`
3. `governor-task-implementer`
   - 约束 AI 围绕单个 `TK-xxx.md` 工作
   - 要求留下 execution record
4. `governor-delivery-finisher`
   - 提供官方化的 finish 流程
   - 与仓库本地 `workspace-delivery-finisher` 的方向保持一致

## Script-Assisted Example

`governor-plan-runner` 提供了最小 `script-assisted` 示例：

1. `scripts/create-request-draft.js`
   - 根据标题、project、sprint 渲染确定性的 request 骨架
2. `templates/request-draft.md`
   - 明确标出 `TODO_AI_FILL` 区域
3. AI 负责补齐 summary、scope、acceptance、verification

这条路径满足“脚本产稳定壳子，AI 填高语义内容”的设计边界。

## Why This Matters

1. `TK-802` 的 `skills install` 现在可以默认安装官方 skills，而不再只处理空 catalog。
2. `TK-804` 可以直接围绕这 4 个官方 skill 做三类 adapter 的接线基线。
3. 后续 `script-assisted` 与 workflow integration 可以围绕这些已安装 skill 继续扩展，而不用回头补资产目录。

## Verification

1. `PATH=/opt/homebrew/bin:$PATH /opt/homebrew/bin/node --test test/skills/official-skill-assets.test.js`
2. `PATH=/opt/homebrew/bin:$PATH /opt/homebrew/bin/node ./bin/repo-ai-governor.js skills list --format json`
3. `PATH=/opt/homebrew/bin:$PATH /opt/homebrew/bin/node ./bin/repo-ai-governor.js skills install --surface codex --target <tmp-dir> --format json`
