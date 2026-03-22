# sprint-001-local-adoption-and-install-readiness 计划

- Status: active
- Date: 2026-03-22
- Project: `project-009-production-readiness`

## 1. Sprint Goal

完成 Stage 9 首轮收敛：让工具在不发布前提下也能本地安装、调试与执行，并将 Stage 9 分阶段门槛与 GA 信号下钻到 `TK-075`~`TK-080`，形成 sprint-002 输入约束。

## 2. In-Scope Tasks

1. TK-075 CLI 命令去 skeleton 化与最小治理链路（completed）
2. TK-076 本地调试（dry-run/trace/replay）与诊断输出基线（completed）
3. TK-077 本地安装模式（path/tgz/link）与 clean-room 验证（planned）
4. TK-078 examples 资产与 example smoke 门禁基线（planned）
5. TK-079 用户接入文档与本地采用手册基线（planned）
6. TK-080 sprint-001 出口验收与 sprint-002 输入约束（planned）
7. TK-087 主执行计划 Stage 9 分阶段门槛与 GA 信号补强（completed）
8. TK-088 Stage 9A 任务卡与执行面主计划对齐（completed）
9. TK-089 主执行计划后续补充对齐与治理门禁补强（completed）
10. TK-090 Stage 9A 任务卡二次下钻与出口验收口径补强（completed）
11. TK-091 TK-080 验收模板骨架与 DA-092 结构化入口固化（completed）
12. TK-092 sprint-002 任务卡与 DA-092 handoff 约束对齐（completed）
13. TK-093 TK-086 项目出口验收模板与完成态审计入口固化（completed）
14. TK-094 主执行计划 Stage 9 运营指标与外部消费契约补强（completed）

## 3. Entry Criteria

1. `DA-086`（project-007 出口验收与后续 rollout 输入约束）可检索，并回链 `.repo-ai-governor/context/dev/project-007-platformization/sprint-002-org-governance-and-rollout-readiness/tasks/TK-073-project-007-exit-acceptance-and-rollout-input-constraints.md`。
2. Stage 9 总执行规划已纳入本地安装、examples、自动执行与人类友好观测要求。
3. 当前仓库基础门禁入口可复跑：`pnpm run check`、`pnpm run release:ga-check`。

## 4. Exit Criteria

1. 形成 `DA-087`~`DA-091` 五项基线产物与 `DA-092` 验收约束产物。
2. 至少两种本地安装模式在 clean-room 场景各连续 3 次复现 `--help -> init -> doctor -> check`，并至少完成 1 组 `tool_managed -> repo_local -> rollback` 切换验证。
3. 根级 `examples/`、README 与本地采用手册可支撑独立接入、问题复现与基础排障。
4. 主执行计划与 `TK-075`~`TK-080` 保持一致，已补齐 9A/9B 门槛、GA 量化信号、只读接入/workspace 回滚、完整 `review-verify` 闭环、artifact/review/normative gates、外部消费契约/支持矩阵、HITL 通知 rehearsal、受控 delivery rehearsal、运营指标快照与 `DA-092` 交接语义。
5. 任务卡、checklist、tasks.csv 三者字段同步满足 `CS-021`。
