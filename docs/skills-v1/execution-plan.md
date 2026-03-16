# Skills V1 Execution Plan

- Status: active
- Date: 2026-03-16
- Basis:
  - [../skill-system-design.md](../skill-system-design.md)
  - [../product-requirements.md](../product-requirements.md)
  - [../cli-command-design.md](../cli-command-design.md)
  - [../config-schema-draft.md](../config-schema-draft.md)

## Goal

把 `Repo AI Governor` 的 skill 体系从“设计说明”推进到“用户安装本工具后可以直接安装并使用官方 skills”的状态，并为 `Codex / GitHub Copilot / Claude Code` 建立统一的 skill 接入路径。

## Product Outcome

完成 `skills-v1` 后，用户应能做到：

1. 安装 `repo-ai-governor`
2. 通过 `init` 或独立 `skills` 命令安装官方 skills
3. 在目标仓库中看到可审计的 skill 资产
4. 在 `Codex`、`GitHub Copilot`、`Claude Code` 中直接消费同一套核心治理 skills
5. 让 skill 在需要时调用脚本生成模板或数据骨架，再由 AI 继续补语义内容

## In Scope

1. 官方 skill 资产的目录规范、manifest 和打包策略
2. `skills install / list / doctor` 最小命令面
3. 首批官方 skill:
   - `governor-context-loader`
   - `governor-plan-runner`
   - `governor-task-implementer`
   - `governor-delivery-finisher`
4. `Codex / GitHub Copilot / Claude Code` 的 skill 安装与投影基线
5. 模板区与 `TODO_AI_FILL` 约定

## Out Of Scope

1. 完整自动化编排引擎
2. 任意脚本执行引擎
3. 第二批工具生态的真实适配实现
4. 组织级 skill registry 或远程分发平台

## Iteration Plan

### Sprint 001: Skill Packaging Baseline

目标：

1. 定义官方 skill 目录与 manifest 规范
2. 提供最小 `skills` CLI 入口
3. 交付首批官方 skills
4. 让目标仓库可以完成本地安装与健康检查

建议任务：

1. `TK-801` 定义官方 skill package layout 与 manifest
2. `TK-802` 实现 `skills install / list / doctor` 最小命令面
3. `TK-803` 落首批官方 skill 资产
4. `TK-804` 完成 `Codex / GitHub Copilot / Claude Code` skill 安装接线基线

### Sprint 002: Script-Assisted Templates

目标：

1. 把 script-assisted 模式正式做实
2. 形成模板骨架与 AI 填空区约定
3. 建立 skill 模板健康检查

建议任务：

1. `TK-805` 定义模板区与 `TODO_AI_FILL` 规范
2. `TK-806` 实现 task / review / report 骨架脚本
3. `TK-807` 增加 skill template validator
4. `TK-808` 提供 script-assisted 示例 skill

### Sprint 003: Workflow Integration

目标：

1. 把 skill 和 workflow stage 更紧密地映射起来
2. 为未来 `automation-v1` 做执行单元准备

建议任务：

1. `TK-809` 建立 stage-to-skill mapping
2. `TK-810` 提供 side-effect level 与权限分级
3. `TK-811` 增加 skill execution audit
4. `TK-812` 准备 workflow-driven acceptance kit

## Milestones

1. M1
   - 用户能执行 `repo-ai-governor skills install`
   - 目标仓库能看到官方 skill 资产
2. M2
   - 三类首批 adapter 都能消费官方 skills
3. M3
   - skill 可稳定产出模板骨架，AI 再补内容
4. M4
   - skill 成为未来自动模式的可复用执行单元

## Risks

1. 如果 skill 目录规范和目标工具真实支持面不一致，安装路径会漂移。
2. 如果脚本与 AI 的职责边界不清，模板容易失控，要么过空、要么过重。
3. 如果先做了过多 orchestration，再回头补安装与投影，会导致用户拿到的是“设计很好但不能直接用”的体系。

## Exit Criteria

1. 官方 skills 作为 npm 包内容可随工具一起分发。
2. 至少一个命令或初始化流程能为目标仓库安装官方 skills。
3. `Codex / GitHub Copilot / Claude Code` 都有可复现的技能安装与使用示例。
4. 至少一条 `script-assisted` 路径明确了“脚本产骨架，AI 填内容”的边界。
5. 当前项目的 sprint 文档、checklist、CSV、任务卡和 CR 流程保持同步。

## Recommended Execution Order

1. 先做安装和目录规范
2. 再交付官方 skill 资产
3. 再做 adapter 接线
4. 最后补模板与编排

## Output Paths

- `docs/skills-v1/index.md`
- `docs/skills-v1/execution-plan.md`
- `docs/skills-v1/sprint-001/`
- `docs/skills-v1/sprint-001/tasks/checklist.md`
- `docs/skills-v1/sprint-001/tasks/tasks.csv`
- `docs/skills-v1/sprint-001/tasks/TK-801.md`
- `docs/skills-v1/sprint-001/tasks/TK-802.md`
- `docs/skills-v1/sprint-001/tasks/TK-803.md`
- `docs/skills-v1/sprint-001/tasks/TK-804.md`
