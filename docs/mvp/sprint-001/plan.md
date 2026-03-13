# MVP Sprint 001 Plan

- Status: active
- Date: 2026-03-13

## Goal

在 `mvp` 范围内完成首个可执行 sprint 的基础能力拆解，优先推进 CLI 底座、配置模型、仓库激活和任务产物规范，为后续 `plan / check / review` 能力落地打底。

## Completed Baseline

1. `TK-001` 已完成，用于建立 `docs/mvp/sprint-001/` 基础目录、checklist、CSV 台账和 CR 模板。
2. `TK-002` 已完成，建立 Commander 驱动的 CLI 入口、命令注册和参数解析基础层。
3. `TK-003` 已完成，建立统一 logger、错误模型和退出码基础设施。
4. `TK-101` 已完成，固定配置目录结构与文件命名规则，并提供 `src/config/repository-layout.js` 作为代码参考实现。
5. `TK-108` 已完成，新增仓库级交付收尾 skill，并将 `收尾 / 提交并推送 / 收尾并推送` 映射为标准交付流程。

## In Scope

1. CLI 命令注册、参数解析、日志与错误输出基础层。
2. 配置目录结构、schema 和加载合并逻辑。
3. `init` / `doctor` 两个仓库激活命令。
4. 项目/sprint 任务产物目录和执行记录规范。

## Out Of Scope

1. 标准规范包内容编写与双语渲染细化。
2. `plan`、`check`、`review`、`review-verify` 命令实现。
3. 第二批 IDE/Agent 适配与 CI 模板收尾。
4. `AGENTS.md` 自动生成器实现。

## Task Breakdown

1. Wave A：CLI 基础
   - `TK-002` 建立 CLI 命令注册与参数解析层
   - `TK-003` 统一日志、错误码与终端输出规范
2. Wave B：配置与任务产物模型
   - `TK-101` 设计配置目录结构与文件命名
   - `TK-102` 设计治理配置 schema v1
   - `TK-106` 设计项目/sprint 任务产物目录规范
   - `TK-103` 实现配置加载与合并逻辑
3. Wave C：仓库激活能力
   - `TK-104` 实现 `init` 命令与初始化脚手架
   - `TK-105` 实现 `doctor` 命令

## Risks

1. `TK-104`、`TK-105` 依赖 `TK-103`，如果配置加载方案调整，会连带影响命令设计。
2. CLI、配置 schema 和任务产物规范需要同时演进，否则会出现文档和实现不一致。
3. `AGENTS.md` 自动生成器尚未纳入本 sprint，当前需保持人工同步纪律。

## Sprint Exit Criteria

1. CLI 命令骨架可稳定注册并输出帮助信息。
2. 配置结构、schema、加载合并逻辑和任务产物规范都已定稿。
3. `init` 和 `doctor` 具备最小实现路径，并能落到现有仓库目录结构。
4. 当前 sprint 的 checklist、CSV 和任务卡已经覆盖全部首批任务。

## Output Paths

- `docs/mvp/sprint-001/cli-ux-technical-solution.md`
- `docs/mvp/sprint-001/repository-layout-conventions.md`
- `docs/mvp/sprint-001/tasks/checklist.md`
- `docs/mvp/sprint-001/tasks/tasks.csv`
- `docs/mvp/sprint-001/tasks/TK-002.md`
- `docs/mvp/sprint-001/tasks/TK-003.md`
- `docs/mvp/sprint-001/tasks/TK-101.md`
- `docs/mvp/sprint-001/tasks/TK-102.md`
- `docs/mvp/sprint-001/tasks/TK-103.md`
- `docs/mvp/sprint-001/tasks/TK-104.md`
- `docs/mvp/sprint-001/tasks/TK-105.md`
- `docs/mvp/sprint-001/tasks/TK-106.md`
- `docs/mvp/sprint-001/tasks/TK-108.md`
- `docs/mvp/sprint-001/code-review/review_tk-001-initialize-sprint-templates.md`
- `.codex/skills/workspace-delivery-finisher/SKILL.md`
