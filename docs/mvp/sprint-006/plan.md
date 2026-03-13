# MVP Sprint 006 Plan

- Status: active
- Date: 2026-03-14

## Goal

在 `mvp` 范围内把当前“模型 + 样例资产”的插槽能力推进到“执行链路可消费”的状态，并提供 `Codex / GitHub Copilot / Claude Code` 三类主流工具的接入样例，证明规则注入与流程约束可以被真实复用。

## Baseline

1. `sprint-001` 已完成 CLI 底座、配置 schema、配置加载、`init`、`doctor` 和 project/sprint 产物规范。
2. `sprint-002` 已完成流程模板、标准规范包模型、声明式插槽 schema 和统一适配器接口设计。
3. `sprint-003` 已完成 Governance Engine、标准规范包 v1 内容，以及 `plan`、`check` 两个核心命令。
4. `sprint-004` 已完成 `review`、`review-verify`、统一报告模型与 `report` 命令，实现最小治理闭环。
5. `sprint-005` 已完成示例插槽包、CI 调用约定、GitHub Actions 模板和 MVP 验收脚本。
6. 当前进入 `sprint-006`，重点从“样例资产可用”推进到“插槽运行时可接入、适配器样例可演示”。

## In Scope

1. `AGENTS.md` 当前上下文外置，减少入口文件改动并为并发流预留结构。
2. 插槽加载与冲突处理运行时。
3. Codex / Codex CLI 接入样例。
4. GitHub Copilot / GitHub Copilot CLI 接入样例。
5. Claude Code 接入样例。

## Out Of Scope

1. 脚本扩展接口 `TK-304`。
2. 第二批工具路线图 `TK-405`。
3. `upgrade` 命令真实实现。
4. npm 正式发布与远端仓库运营流程。

## Task Breakdown

1. Wave A：入口与插槽运行时
   - `TK-107` 设计并实现 `AGENTS.md` 当前上下文外置
   - `TK-302` 实现插槽加载与冲突处理
2. Wave B：主流工具接入样例
   - `TK-402` 完成 Codex / Codex CLI 接入样例
   - `TK-403` 完成 GitHub Copilot / GitHub Copilot CLI 接入样例
   - `TK-404` 完成 Claude Code 接入样例

## Risks

1. `TK-107` 如果只改模板不改当前仓库入口文件和校验链路，后续仍会继续出现 `AGENTS.md` 高频漂移。
2. `TK-302` 是当前 sprint 的关键前置；如果插槽运行时没有稳定的优先级、冲突和命中语义，适配器样例只能停留在静态说明层。
3. 三类工具的规则注入入口并不完全一致，若没有一个统一的适配样例结构，`TK-402/403/404` 很容易重复发明模板。
4. 当前已有验收脚本以本仓库 CLI 为核心，若接入样例与 CLI 命令约定漂移，会导致“工具样例可看但不可验收”的问题。

## Exit Criteria

1. `TK-107` 使 `AGENTS.md` 改为依赖独立上下文文件，并让 `init`/`doctor`/schema 同步支持该结构。
2. `TK-302` 能发现已启用插槽、按优先级处理冲突，并把有效插槽接入治理执行上下文。
3. `TK-402` 提供可复现的 Codex / Codex CLI 注入样例。
4. `TK-403` 提供可复现的 GitHub Copilot / GitHub Copilot CLI 注入样例。
5. `TK-404` 提供可复现的 Claude Code 注入样例。
6. 当前 sprint 的 checklist、CSV 和任务卡保持同步。

## Progress

1. 已创建 `TK-107`、`TK-302`、`TK-402`、`TK-403`、`TK-404` 任务卡，并完成 sprint-006 排期调整。
2. `TK-107` 已完成，用于外置 `AGENTS.md` 当前上下文。
3. `TK-302`、`TK-402`、`TK-403`、`TK-404` 当前仍处于待执行状态。

## Output Paths

- `docs/mvp/sprint-006/plan.md`
- `docs/mvp/sprint-006/tasks/checklist.md`
- `docs/mvp/sprint-006/tasks/tasks.csv`
- `docs/mvp/sprint-006/tasks/TK-107.md`
- `docs/mvp/sprint-006/tasks/TK-302.md`
- `docs/mvp/sprint-006/tasks/TK-402.md`
- `docs/mvp/sprint-006/tasks/TK-403.md`
- `docs/mvp/sprint-006/tasks/TK-404.md`
- `docs/mvp/sprint-006/agent-entry-context-decoupling.md`
- `docs/mvp/sprint-006/code-review/`
