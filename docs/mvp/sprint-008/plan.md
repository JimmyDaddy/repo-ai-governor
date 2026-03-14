# MVP Sprint 008 Plan

- Status: active
- Date: 2026-03-14

## Goal

在 `mvp` 范围内把当前“声明式扩展 + 首批适配样例”的状态推进到“高级扩展可规划、生态扩展有路线图”的阶段，优先补齐脚本扩展接口约定与安全边界说明，并形成第二批适配对象的排期建议。

## Baseline

1. `sprint-001` 到 `sprint-004` 已完成 CLI、配置、流程、报告和治理闭环基础能力。
2. `sprint-005` 已完成 CI 接入、示例插槽和 MVP 验收脚本。
3. `sprint-006` 已完成 `Codex / GitHub Copilot / Claude Code` 三类首批适配器样例。
4. `sprint-007` 已完成发布候选、`upgrade` 最小版本和本地分发验收链路。
5. 当前插槽能力已经具备声明式配置、运行时发现与冲突处理，但高级自定义仍停留在“无脚本扩展接口”的状态。

## In Scope

1. `TK-304`：预留脚本扩展接口。
2. `TK-405`：编写后续适配路线图。
3. 沉淀脚本扩展的权限边界、审计控制、失败隔离和适配范围约定。

## Out Of Scope

1. 正式实现任意脚本执行引擎。
2. 远端仓库发布运营和 npm 公开发布执行。
3. 第二批工具的真实适配实现。
4. 组织级平台化能力。

## Task Breakdown

1. Wave A：扩展接口基线
   - `TK-304` 预留脚本扩展接口
2. Wave B：生态路线规划
   - `TK-405` 编写后续适配路线图

## Risks

1. 如果脚本扩展只有概念没有明确权限边界，后续一旦落地实现会直接引入高风险执行面。
2. 如果不先明确脚本扩展与声明式 slot 的分工，扩展能力会和当前 slot runtime 发生重复建模。
3. 如果第二批适配路线图没有统一优先级标准，后续接入容易变成按感觉插队。

## Exit Criteria

1. `TK-304` 明确脚本扩展接口约定、执行上下文、权限边界、审计要求和失败隔离机制。
2. `TK-304` 保持“接口预留”定位，不把任意脚本执行承诺为 MVP 正式能力。
3. `TK-405` 给出第二批工具名单、适配优先级标准和工作量预估。
4. 当前 sprint 的 checklist、CSV 和任务卡保持同步。

## Progress

1. 已创建 `TK-304`、`TK-405` 任务卡，并完成 `sprint-008` 骨架初始化。
2. `TK-304` 已完成，当前已把脚本扩展接口补进 slot schema、slot model、config loader 和 runtime summary。
3. `TK-405` 已完成，当前已给出第二批适配对象的优先级标准、工具清单和工作量预估。
4. 当前 sprint 已满足 exit criteria，可在需要时进入 closeout。

## Output Paths

- `docs/mvp/sprint-008/plan.md`
- `docs/mvp/sprint-008/script-extension-interface.md`
- `docs/mvp/sprint-008/next-wave-adapter-roadmap.md`
- `docs/mvp/sprint-008/tasks/checklist.md`
- `docs/mvp/sprint-008/tasks/tasks.csv`
- `docs/mvp/sprint-008/tasks/TK-304.md`
- `docs/mvp/sprint-008/tasks/TK-405.md`
- `docs/mvp/sprint-008/code-review/`
