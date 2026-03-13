# MVP Sprint 005 Plan

- Status: active
- Date: 2026-03-14

## Goal

在 `mvp` 范围内把当前最小治理闭环从“本地可执行”推进到“可进入 CI 与验收场景”，优先落地示例插槽包、CI 调用约定、示例 CI 模板，以及 MVP 验收仓库与验收脚本准备。

## Baseline

1. `sprint-001` 已完成 CLI 底座、配置 schema、配置加载、`init`、`doctor` 和 project/sprint 产物规范。
2. `sprint-002` 已完成流程模板、标准规范包模型、声明式插槽 schema 和统一适配器接口设计。
3. `sprint-003` 已完成 Governance Engine、标准规范包 v1 内容，以及 `plan`、`check` 两个核心命令。
4. `sprint-004` 已完成 `review`、`review-verify`、统一报告模型与 `report` 命令，实现最小治理闭环。
5. 当前进入 `sprint-005`，重点从“本地闭环可用”推进到“CI 接入可用、MVP 验收可执行”。

## In Scope

1. 示例插槽包。
2. CI 调用命令与退出码约定。
3. 示例 CI 模板与接入说明。
4. MVP 验收仓库与验收脚本准备。

## Out Of Scope

1. 插槽加载与冲突处理运行时 `TK-302`。
2. `upgrade` 命令真实实现。
3. 多 CI 平台矩阵支持，MVP 只要求至少一个主流 CI 场景。
4. npm 发布、远端仓库发布与正式版本运营流程。

## Task Breakdown

1. Wave A：样例与约定基线
   - `TK-303` 提供示例插槽包
   - `TK-503` 提供 CI 调用命令与退出码约定
2. Wave B：集成与验收
   - `TK-504` 提供示例 CI 模板
   - `TK-505` 准备 MVP 验收仓库与验收脚本

## Risks

1. `TK-505` 同时依赖 `TK-303` 和 `TK-503`，如果示例插槽或 CI 约定不稳定，验收仓库会反复返工。
2. `TK-302` 尚未实现，因此 `TK-303` 需要明确“示例插槽包”的交付边界，避免承诺超出当前运行时能力的自动发现机制。
3. CI 退出码约定需要与当前 `check`、`review`、`review-verify`、`report` 的实际行为对齐，否则模板会和真实命令漂移。

## Exit Criteria

1. `TK-303` 提供至少两个可复用的示例插槽，并附带触发说明或样例配置。
2. `TK-503` 明确非交互式运行参数与退出码文档，CI 可直接调用。
3. `TK-504` 提供至少一个主流 CI 场景的模板和接入说明。
4. `TK-505` 提供 MVP 验收仓库、验收脚本或记录模板，并能覆盖当前最小治理闭环。
5. 当前 sprint 的 checklist、CSV 和任务卡保持同步。

## Progress

1. 已创建 `TK-303`、`TK-503`、`TK-504`、`TK-505` 任务卡，并完成 sprint-005 首轮排期。
2. `TK-303` 已完成，当前已新增两份官方示例插槽 YAML、接入说明和自动化校验测试，供样例流程与验收脚本直接复用。
3. `TK-503` 已完成，当前已补齐 CI 调用脚本、退出码约定文档，并为 `review` 与 `review-verify` 增加 `--strict` 模式，支持 warning 阻断流水线。
4. `TK-504` 已完成，当前已提供 GitHub Actions 模板和配套说明，复用 `scripts/ci/` 下的治理脚本执行门禁与报告渲染。
5. `TK-505` 已完成，当前已提供 MVP 验收脚本、需求输入、记录模板与端到端自动化测试，可在临时工作区跑通治理闭环。

## Output Paths

- `docs/mvp/sprint-005/plan.md`
- `docs/mvp/sprint-005/example-slot-package.md`
- `docs/mvp/sprint-005/ci-invocation-contract.md`
- `docs/mvp/sprint-005/github-actions-template.md`
- `docs/mvp/sprint-005/mvp-acceptance-kit.md`
- `docs/mvp/sprint-005/tasks/checklist.md`
- `docs/mvp/sprint-005/tasks/tasks.csv`
- `docs/mvp/sprint-005/tasks/TK-303.md`
- `docs/mvp/sprint-005/tasks/TK-503.md`
- `docs/mvp/sprint-005/tasks/TK-504.md`
- `docs/mvp/sprint-005/tasks/TK-505.md`
- `docs/mvp/sprint-005/code-review/`
