# Skills V1 Sprint 001 Plan

- Status: done
- Date: 2026-03-16

## Goal

把 `Repo AI Governor` 的 skill 体系从“设计说明”推进到“可安装、可列出、可健康检查、可被首批 adapter 消费”的状态，为后续模板化和自动编排打基础。

## Baseline

1. 当前仓库已完成 `mvp` 主线与 `release-ga / sprint-001`，具备稳定 CLI、适配器样例、发布门禁和双语文档。
2. 当前 skill 体系已有 [../../skill-system-design.md](../../skill-system-design.md) 设计稿，但还没有变成正式 project。
3. 当前仓库只有一个本地交付 skill，见 `.codex/skills/workspace-delivery-finisher/`，尚无官方 skill 包体系。
4. `Codex`、`GitHub Copilot`、`Claude Code` 都已有 adapter 方向积累，但尚未被统一到一套官方 skills 分发链路里。

## In Scope

1. 官方 skill package layout 与 manifest
2. `skills install / list / doctor` 最小 CLI
3. 首批官方 skills 资产
4. 三类首批 adapter 的 skill 接线基线

## Out Of Scope

1. 完整 script-assisted 执行引擎
2. 完整 stage orchestration
3. 远程 skill registry
4. 第二批工具适配

## Task Breakdown

1. Wave A：安装与资产基线
   - `TK-801` 定义官方 skill package layout 与 manifest
   - `TK-802` 实现 `skills install / list / doctor` 最小命令面
2. Wave B：首批技能与接线
   - `TK-803` 落首批官方 skill 资产
   - `TK-804` 完成 `Codex / GitHub Copilot / Claude Code` skill 安装接线基线

## Risks

1. 若安装目录与不同工具的真实能力不对齐，会导致同一套 skill 无法稳定复用。
2. 若先写 skill 文档而没有安装/doctor 能力，用户仍无法直接使用。
3. 若首批官方 skill 粒度过大，后续 script-assisted 和 orchestration 会难以组合。

## Exit Criteria

1. 仓库内有正式的官方 skill 包目录约定和 manifest 规范。
2. CLI 至少能支持 `skills install / list / doctor` 的最小闭环。
3. 至少交付 3 个首批官方 skills，并能被安装到目标仓库。
4. `Codex / GitHub Copilot / Claude Code` 都有一条统一的 skill 接线基线。
5. 当前 sprint 的 checklist、CSV 和任务卡保持同步。

## Progress

1. 已创建 `TK-801`、`TK-802`、`TK-803`、`TK-804` 任务卡，并完成 `skills-v1 / sprint-001` 骨架初始化。
2. `TK-801` 已完成，当前已补齐官方 skill package layout helper、manifest schema、catalog 入口和 install target 基线。
3. `TK-802` 已完成，当前已补齐 `skills install / list / doctor` 命令面、catalog/runtime 基础模块与命令级测试。
4. `TK-803` 已完成，当前 bundled catalog 已能分发 4 个首批官方 skill，并包含一个 `script-assisted` 示例。
5. `TK-804` 已完成，当前 `Codex / GitHub Copilot / Claude Code` 都有官方 skill 的原生安装说明与补充投影层边界。

## Closure

1. `skills-v1 / sprint-001` 已完成收口。
2. 当前 sprint 的 4 个任务都已交付，且 `skills install / list / doctor`、官方 skill 资产和三类 adapter 接线基线都已落地。
3. 当前仓库上下文已切回 idle；若继续推进 `skills-v1`，应先规划 `sprint-002`。

## Output Paths

- `docs/skills-v1/sprint-001/plan.md`
- `docs/skills-v1/sprint-001/official-skill-package-layout.md`
- `docs/skills-v1/sprint-001/skills-command-baseline.md`
- `docs/skills-v1/sprint-001/official-skill-assets.md`
- `docs/skills-v1/sprint-001/adapter-skill-wiring-baseline.md`
- `docs/skills-v1/sprint-001/tasks/checklist.md`
- `docs/skills-v1/sprint-001/tasks/tasks.csv`
- `docs/skills-v1/sprint-001/tasks/TK-801.md`
- `docs/skills-v1/sprint-001/tasks/TK-802.md`
- `docs/skills-v1/sprint-001/tasks/TK-803.md`
- `docs/skills-v1/sprint-001/tasks/TK-804.md`
- `docs/skills-v1/sprint-001/code-review/`
