# MVP Sprint 007 Plan

- Status: done
- Date: 2026-03-14

## Goal

在 `mvp` 范围内把当前“功能完成、样例齐备”的状态推进到“可分发、可安装、可升级”的发布就绪状态，优先补齐 npm 发布候选链路、`upgrade` 命令最小版本，以及 tarball / `npx` 安装验收。

## Baseline

1. `sprint-001` 到 `sprint-004` 已完成 CLI、配置、流程、报告和治理闭环基础能力。
2. `sprint-005` 已完成 CI 接入、示例插槽和 MVP 验收脚本。
3. `sprint-006` 已完成 `Codex / GitHub Copilot / Claude Code` 三类首批适配器样例。
4. 当前 CLI 已支持 `init`、`doctor`、`plan`、`check`、`review`、`review-verify`、`report` 的真实实现。
5. 当前仍缺少发布就绪关键项：`package.json` 仍为 `private`、`upgrade` 仅有命令位没有实现、缺少 tarball / `npx` 安装验收链路。

## In Scope

1. 建立发布与版本管理流程。
2. 实现 `upgrade` 命令最小版本。
3. 补齐本地分发与安装验收链路。
4. 沉淀发布候选文档和验收步骤。

## Out Of Scope

1. 第二批工具适配路线图 `TK-405`。
2. 脚本扩展接口 `TK-304` 的正式实现。
3. 远端仓库发布运营和 npm 公开发布执行。
4. 组织级平台化能力。

## Task Breakdown

1. Wave A：发布基础能力
   - `TK-004` 建立发布与版本管理流程
   - `TK-005` 实现 `upgrade` 命令最小版本
2. Wave B：分发与验收
   - `TK-006` 补齐本地分发与安装验收链路

## Risks

1. 如果只补发布文档而没有 `npm pack` / `npx` 级别的真实验证，发布流程会停留在纸面。
2. `upgrade` 命令需要处理模板和配置演进，若没有预览与备份语义，后续很容易引入危险覆盖风险。
3. `package.json` 从 `private` 切到可发布状态后，包内容边界和安装入口会立刻暴露问题，因此验收脚本必须同步跟上。

## Exit Criteria

1. `TK-004` 提供可执行的发布前检查、版本策略和候选发布流程。
2. `TK-005` 提供 `upgrade` 命令最小版本，支持 `--to-version`、`--preview`、`--backup`。
3. `TK-006` 提供 tarball / `npx` 安装 smoke test，并能验证 CLI 基础入口。
4. 当前 sprint 的 checklist、CSV 和任务卡保持同步。

## Progress

1. 已创建 `TK-004`、`TK-005`、`TK-006` 任务卡，并完成 `sprint-007` 骨架初始化。
2. `TK-004` 已完成，当前已补齐发布元数据、发布前检查脚本和发布候选链路。
3. `TK-005` 已完成，当前已补齐 `upgrade` 命令最小版本及 preview/backup 语义。
4. `TK-006` 已完成，当前已补齐 tarball / `npx` 本地安装验收链路。

## Closure

1. `sprint-007` 已满足全部 exit criteria，可正式标记为完成。
2. 当前仓库已经具备发布候选检查、`upgrade` 最小版本和本地分发验收三条发布就绪能力。
3. 后续执行基线已切换到 `docs/mvp/sprint-008/`，下一轮优先补齐脚本扩展接口与后续适配路线图。

## Output Paths

- `docs/mvp/sprint-007/plan.md`
- `docs/mvp/sprint-007/release-and-version-flow.md`
- `docs/mvp/sprint-007/upgrade-command-runtime.md`
- `docs/mvp/sprint-007/local-distribution-acceptance.md`
- `docs/mvp/sprint-007/tasks/checklist.md`
- `docs/mvp/sprint-007/tasks/tasks.csv`
- `docs/mvp/sprint-007/tasks/TK-004.md`
- `docs/mvp/sprint-007/tasks/TK-005.md`
- `docs/mvp/sprint-007/tasks/TK-006.md`
- `docs/mvp/sprint-007/code-review/`
