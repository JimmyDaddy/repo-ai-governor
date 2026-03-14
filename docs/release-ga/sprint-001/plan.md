# Release GA Sprint 001 Plan

- Status: done
- Date: 2026-03-14

## Goal

把当前已经完成 MVP 主线能力的 `repo-ai-governor`，从“本地可运行、可做发布候选验证”的状态推进到“用户可以快速理解、安装、试用，并具备正式发布流程基础”的状态。

## Baseline

1. `mvp / sprint-001` 到 `sprint-008` 已完成 CLI、治理流程、报告、CI、适配器样例、发布候选能力和脚本扩展接口预留。
2. 当前 npm 包已经具备 `release:candidate`、`release:pack`、`upgrade` 和本地安装验收能力。
3. 当前仓库缺少根目录 `README`、Quick Start、示例安装路径整理，以及远端 release / tag / changelog 自动化。
4. 当前仓库也还没有配置远端，因此 release 自动化需要先沉淀成仓库内工作流与文档，而不是立即真实发布。

## In Scope

1. 正式发布流程与版本策略落地。
2. `README` / Quick Start / 示例上手文档整理。
3. 安装后 10 分钟内跑通的体验打磨。
4. 远端 release / tag / changelog 自动化骨架。

## Out Of Scope

1. 自动模式 `v1`。
2. 第二批适配器真实实现。
3. 多编程语言治理模板扩展。
4. 团队共享规范与平台化能力。
5. npm 真实发布到公共 registry 的最终执行。

## Task Breakdown

1. Wave A：发布基础
   - `TK-701` 建立正式发布流程与版本策略
   - `TK-702` 编写 `README` / Quick Start / 示例上手文档
2. Wave B：对外交付链路
   - `TK-703` 建立远端 release / tag / changelog 自动化骨架
   - `TK-704` 构建 10 分钟上手验收路径

## Risks

1. 当前没有远端仓库配置，真实发布动作无法在本仓库立即闭环，只能先把工作流和文档准备好。
2. 对外文档一旦补齐，会暴露安装与初始化路径里所有还不够顺滑的细节问题。
3. 如果只补文档不补自动化，后续每次发布仍会回到手工流程。

## Exit Criteria

1. `TK-701` 明确版本策略、发布清单和 GA 发布前检查步骤。
2. `TK-702` 提供可直接面向外部用户的 `README` 和 Quick Start。
3. `TK-703` 提供远端 release / tag / changelog 自动化骨架与使用说明。
4. `TK-704` 提供安装后 10 分钟内跑通的验收路径，并可复用为对外试用手册。
5. 当前 sprint 的 checklist、CSV 和任务卡保持同步。

## Progress

1. 已创建 `TK-701`、`TK-702`、`TK-703`、`TK-704` 任务卡，并完成 `release-ga / sprint-001` 骨架初始化。
2. `TK-701` 已完成，当前已补齐 `CHANGELOG.md`、正式发布流程文档、GA 发布门禁说明和 release check 关键校验项。
3. `TK-702` 已完成，当前已补齐根目录 `README`、`docs/quick-start.md`、`docs/getting-started-example.md` 和 `README` 的发布前校验。
4. `TK-703` 已完成，当前已补齐 `.github/workflows/release-ga.yml`、`render-release-notes.js`、远端前置条件说明和对应自动校验。
5. `TK-704` 已完成，当前已补齐 `examples/release-ga-getting-started/`、`run-getting-started-check.sh`、10 分钟上手文档，并将其纳入 release readiness 校验。
6. 已补齐 `README.zh-CN.md` 与 `CHANGELOG.zh-CN.md`，并让 `release:check` 把双语发布文档作为 GA 门禁的一部分。

## Closure

1. `release-ga / sprint-001` 已满足全部 exit criteria，可正式标记为完成。
2. 本轮已补齐正式发布流程、双语入口文档、远端 release 自动化骨架和 10 分钟上手验收路径，`release-ga` 首轮目标已闭环。
3. 当前不自动开启下一个 `release-ga` sprint；后续是否继续推进取决于是否开始真实远端发布、收集试用反馈或转入其他 Project。

## Output Paths

- `README.md`
- `README.zh-CN.md`
- `CHANGELOG.md`
- `CHANGELOG.zh-CN.md`
- `docs/release-ga/sprint-001/plan.md`
- `docs/release-ga/sprint-001/ga-release-flow.md`
- `docs/release-ga/sprint-001/readme-and-quick-start.md`
- `docs/release-ga/sprint-001/remote-release-automation.md`
- `docs/release-ga/sprint-001/ten-minute-getting-started.md`
- `docs/release-ga/sprint-001/tasks/checklist.md`
- `docs/release-ga/sprint-001/tasks/tasks.csv`
- `docs/release-ga/sprint-001/tasks/TK-701.md`
- `docs/release-ga/sprint-001/tasks/TK-702.md`
- `docs/release-ga/sprint-001/tasks/TK-703.md`
- `docs/release-ga/sprint-001/tasks/TK-704.md`
- `docs/release-ga/sprint-001/code-review/`
