# MVP Sprint 003 Plan

- Status: active
- Date: 2026-03-13

## Goal

在 `mvp` 范围内把 `sprint-002` 沉淀的流程、规范、插槽和适配器模型接入最小执行链路，优先落地 Governance Engine、标准规范包内容，以及 `plan`、`check` 两个核心命令。

## Baseline

1. `sprint-001` 已完成 CLI 底座、配置 schema、配置加载、`init`、`doctor` 和 project/sprint 产物规范。
2. `sprint-002` 已完成流程模板、标准规范包模型、声明式插槽 schema 和统一适配器接口设计。
3. 当前进入 `sprint-003`，重点从“模型设计”转向“最小治理闭环执行”。

## In Scope

1. Governance Engine 最小执行器。
2. 标准规范包 v1 内容。
3. `plan` 命令最小实现。
4. `check` 命令最小实现。

## Out Of Scope

1. `review`、`review-verify` 的真实执行实现。
2. 插槽加载与冲突处理运行时。
3. Codex / GitHub Copilot / Claude Code 的接入样例。
4. `report` 命令与 CI 模板收尾。

## Task Breakdown

1. Wave A：治理闭环核心输入
   - `TK-202` 实现 Governance Engine 最小执行器
   - `TK-204` 编写标准规范包 v1 内容
2. Wave B：首批可执行命令
   - `TK-205` 实现 `plan` 命令
   - `TK-206` 实现 `check` 命令

## Risks

1. `TK-205` 与 `TK-206` 同时依赖 `TK-202` 和 `TK-204`，如果执行结果模型或标准规范内容结构调整，会连带影响两个命令的输入输出。
2. `plan` 需要同时写入 `plan.md`、`tasks/checklist.md`、`tasks/tasks.csv` 和 `tasks/*.md`，如果产物规范与已有 sprint 目录约定漂移，后续 review/report 很难复用。
3. 标准规范包 v1 需要兼顾 AI 消费和人类阅读，若文案结构过重，会直接拖慢命令实现。

## Exit Criteria

1. `TK-202` 完成并提供可复用的阶段执行与汇总入口。
2. `TK-204` 完成并提供至少一套可被命令消费的官方默认规范内容。
3. `TK-205` 可以按当前项目和 sprint 生成方案、任务清单、CSV 和单任务文件。
4. `TK-206` 可以基于当前配置、流程模板和标准规范包执行最小治理检查并返回稳定退出码。
5. 当前 sprint 的 checklist、CSV 和任务卡保持同步。

## Progress

1. 已创建 `TK-202`、`TK-204`、`TK-205`、`TK-206` 任务卡，并完成 sprint-003 首轮排期。

## Output Paths

- `docs/mvp/sprint-003/plan.md`
- `docs/mvp/sprint-003/tasks/checklist.md`
- `docs/mvp/sprint-003/tasks/tasks.csv`
- `docs/mvp/sprint-003/tasks/TK-202.md`
- `docs/mvp/sprint-003/tasks/TK-204.md`
- `docs/mvp/sprint-003/tasks/TK-205.md`
- `docs/mvp/sprint-003/tasks/TK-206.md`
- `docs/mvp/sprint-003/code-review/`
