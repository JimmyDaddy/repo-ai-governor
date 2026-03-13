# MVP Sprint 004 Plan

- Status: active
- Date: 2026-03-13

## Goal

在 `mvp` 范围内把当前最小治理闭环从 `plan -> check` 推进到 `review -> review-verify -> report`，优先落地 `review` 命令、评审复核流转和统一报告模型。

## Baseline

1. `sprint-001` 已完成 CLI 底座、配置 schema、配置加载、`init`、`doctor` 和 project/sprint 产物规范。
2. `sprint-002` 已完成流程模板、标准规范包模型、声明式插槽 schema 和统一适配器接口设计。
3. `sprint-003` 已完成 Governance Engine、标准规范包 v1 内容，以及 `plan`、`check` 两个核心命令。
4. 当前进入 `sprint-004`，重点从“计划与校验”推进到“评审、复核与统一报告”。

## In Scope

1. `review` 命令最小实现。
2. `review-verify` 命令最小实现。
3. 统一报告模型设计。
4. `report` 命令最小实现。

## Out Of Scope

1. 插槽加载与冲突处理运行时。
2. Codex / GitHub Copilot / Claude Code 的接入样例。
3. CI 模板与验收仓库收尾。

## Task Breakdown

1. Wave A：评审闭环
   - `TK-207` 实现 `review` 命令
   - `TK-208` 实现 `review-verify` 命令
2. Wave B：统一报告
   - `TK-501` 设计统一报告模型
   - `TK-502` 实现 `report` 命令

## Risks

1. `review` 与 `review-verify` 需要同时处理终端输出、CR 落盘和文件状态流转，如果产物模型不稳定，后续 `report` 会重复适配。
2. 当前 `check` 已经可以写报告文件，若 `TK-501` 不先统一报告模型，`report` 与 `check --write-report` 的输出可能漂移。
3. 如果评审发现模型过于依赖仓库结构假设，后续适配不同项目类型时会出现过多误报。

## Exit Criteria

1. `TK-207` 可以按治理规则输出评审结论、发现列表，并生成 `review_<slug>.md`。
2. `TK-208` 可以把复核结论追加回同一份 CR 文件，并流转到 `verified_review_<slug>.md`。
3. `TK-501` 明确终端摘要、Markdown 和 JSON 三类统一报告结构。
4. `TK-502` 可以把已有执行结果渲染成 `summary`、`markdown`、`json` 三类报告。
5. 当前 sprint 的 checklist、CSV 和任务卡保持同步。

## Progress

1. 已创建 `TK-207`、`TK-208`、`TK-501`、`TK-502` 任务卡，并完成 sprint-004 首轮排期。
2. `TK-207` 已完成，`review` 命令现可真实输出治理评审结论、发现列表和 `review_<slug>.md` 状态化 CR 文件，并支持默认从 git working tree 推断评审目标。
3. `TK-208` 已完成，`review-verify` 命令现可复核 pending/verified review 文件，回写 verify log，并在无剩余 findings 时推进到 `resolved_review_<slug>.md`。

## Output Paths

- `docs/mvp/sprint-004/plan.md`
- `docs/mvp/sprint-004/review-command-runtime.md`
- `docs/mvp/sprint-004/review-verify-command-runtime.md`
- `docs/mvp/sprint-004/tasks/checklist.md`
- `docs/mvp/sprint-004/tasks/tasks.csv`
- `docs/mvp/sprint-004/tasks/TK-207.md`
- `docs/mvp/sprint-004/tasks/TK-208.md`
- `docs/mvp/sprint-004/tasks/TK-501.md`
- `docs/mvp/sprint-004/tasks/TK-502.md`
- `docs/mvp/sprint-004/code-review/`
