# project-009-production-readiness 计划

- Status: active
- Date: 2026-03-22
- Stage Mapping: Stage 9
- Phase Mapping: Phase E 收口 + GA Readiness overlay

## 1. 目标

1. 完成 CLI 关键命令去 skeleton 化，打通可执行最小治理闭环，并将 Stage 9A/9B 的阶段门槛与 GA 信号下钻到 sprint-001/sprint-002 执行面。
2. 建立无需发布即可本地安装与调试使用的能力（path/tgz/link）。
3. 建立多工具/多模型自动执行链路与角色级进度日志、交互可视化能力。
4. 补齐 examples、用户文档、黑盒 E2E 与发布门禁，使 GA 信号与真实可用性一致。
5. 通过真实试点输入沉淀投产后运营反馈闭环。

## 2. 工作流分解（Workstreams）

1. WS-01 Command Runtime Readiness
   - `init/doctor/check/run/review/review-verify/plan/upgrade` 去 skeleton 化。
   - 最小治理执行链路与错误处理契约落地。
2. WS-02 Local Install And Developer Experience
   - 本地安装模式（path/tgz/link）与 clean-room 验证。
   - `dry-run/trace/replay` 调试链路与诊断输出。
3. WS-03 Agent Automation And Model Routing
   - `codex/github-copilot/claude-code` 真实调用收敛。
   - 多模型路由与无人值守自动执行闭环。
4. WS-04 Human-Friendly Execution UX
   - 角色级进度展示（role/stage/status）。
   - 分层日志、关键交互提示与 HITL 友好提示。
5. WS-05 Documentation And Examples
   - `README/CHANGELOG` 与本地接入手册。
   - 根级 `examples/` 与 example smoke 门禁。
6. WS-06 Production Gates And Rollout Ops
   - 黑盒 E2E、GA 联合门禁、CI/workflow 生产化。
   - 试点接入反馈与 30 天运营闭环。

## 3. Sprint 细化

## 3.1 sprint-001-local-adoption-and-install-readiness

- Sprint Goal: 完成“本地可安装可调试可运行”的最小可用面，并固化 Stage 9 分阶段门槛与 GA 信号，形成 sprint-002 输入约束。
- 任务包：`TK-075`、`TK-076`、`TK-077`、`TK-078`、`TK-079`、`TK-080`、`TK-087`、`TK-088`、`TK-089`、`TK-090`、`TK-091`、`TK-092`、`TK-093`、`TK-094`。
- Exit Criteria:
  1. CLI 关键命令最小语义可执行，其中 `init/doctor/check` 不再仅输出 skeleton。
  2. 本地安装模式至少选择两种并在 clean-room 环境各连续 3 次通过 `--help -> init -> doctor -> check`，并至少完成 1 组 `tool_managed -> repo_local -> rollback` workspace 切换验证。
  3. 根级 `examples/`、README 与本地采用手册可支撑团队独立接入与问题复现。
  4. 主执行计划与 `TK-075`~`TK-080` 已对齐 Stage 9A/9B 硬门槛、GA 量化信号、只读接入/workspace 回滚、完整 `review-verify` 闭环、artifact/review/normative gates、外部消费契约/支持矩阵、HITL 通知 rehearsal、gated delivery rehearsal、运营指标快照与 Stage 9B 交接语义。
  5. 形成 `DA-092`（sprint-001 出口验收与 sprint-002 输入约束）。

## 3.2 sprint-002-automation-observability-and-ga-rollout

- Sprint Goal: 完成“自动执行 + 人类友好观测 + 发布门禁生产化”闭环并收敛 project-009 出口验收。
- 任务包：`TK-081`、`TK-082`、`TK-083`、`TK-084`、`TK-085`、`TK-086`。
- Exit Criteria:
  1. `DA-092` 已被 `TK-081`~`TK-085` 显式消费为唯一输入入口，且 blocker/fix-forward 约束未被绕过。
  2. 多工具/多模型自动执行链路在无人值守模式可稳定运行，并覆盖 `plan -> run -> review -> review-verify -> report -> ledger backfill` 与至少 1 条受控 delivery rehearsal。
  3. 人类可实时查看角色进度、关键日志与交互状态，并可执行 HITL 决策；至少 1 主 1 备通知渠道的 `confirm/escalate` 演练已与 audit/replay 对齐。
  4. 黑盒 E2E 与 CI/发布流水线收敛到真实可用性门禁，并持续复用 Stage 9A 的 clean-room / `examples/` / read-only attach / 外部消费契约矩阵 / 支持矩阵基线。
  5. 形成 `DA-098`（project-009 出口验收与后续运营输入约束），沉淀试点与 30 天运营指标快照，并产出 `project-009-completion-audit-summary.md` 与 plan 里程碑回链。

## 4. 任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | status |
|---|---|---|---|---|---|
| TK-075 | sprint-001 | CLI 命令去 skeleton 化与最小治理链路 | implementation/runtime | DA-086 | completed |
| TK-076 | sprint-001 | 本地调试（dry-run/trace/replay）与诊断输出基线 | implementation/devex | TK-075 | completed |
| TK-077 | sprint-001 | 本地安装模式（path/tgz/link）与 clean-room 验证 | implementation/local-install | TK-075 | completed |
| TK-078 | sprint-001 | examples 资产与 example smoke 门禁基线 | implementation/examples | TK-075,TK-077 | completed |
| TK-079 | sprint-001 | 用户接入文档与本地采用手册基线 | implementation/docs | TK-075,TK-077,TK-078 | planned |
| TK-080 | sprint-001 | sprint-001 出口验收与 sprint-002 输入约束 | acceptance baseline | TK-075,TK-076,TK-077,TK-078,TK-079 | planned |
| TK-087 | sprint-001 | 主执行计划 Stage 9 分阶段门槛与 GA 信号补强 | maintenance/planning | DA-086 | completed |
| TK-088 | sprint-001 | Stage 9A 任务卡与执行面主计划对齐 | maintenance/planning | TK-087 | completed |
| TK-089 | sprint-001 | 主执行计划后续补充对齐与治理门禁补强 | maintenance/planning | TK-087,TK-088 | completed |
| TK-090 | sprint-001 | Stage 9A 任务卡二次下钻与出口验收口径补强 | maintenance/planning | TK-089 | completed |
| TK-091 | sprint-001 | TK-080 验收模板骨架与 DA-092 结构化入口固化 | maintenance/planning | TK-090 | completed |
| TK-092 | sprint-001 | sprint-002 任务卡与 DA-092 handoff 约束对齐 | maintenance/planning | TK-091 | completed |
| TK-093 | sprint-001 | TK-086 项目出口验收模板与完成态审计入口固化 | maintenance/planning | TK-092 | completed |
| TK-094 | sprint-001 | 主执行计划 Stage 9 运营指标与外部消费契约补强 | maintenance/planning | TK-089,TK-090,TK-091,TK-093 | completed |
| TK-081 | sprint-002 | 发布分发模型与运行时可解析打包收敛 | implementation/release | TK-080 | planned |
| TK-082 | sprint-002 | 多工具/多模型真实调用与无人值守自动链路 | implementation/automation | TK-080,TK-081 | planned |
| TK-083 | sprint-002 | 角色级进度日志与人类友好交互展示 | implementation/ux-observability | TK-080,TK-082 | planned |
| TK-084 | sprint-002 | 黑盒 E2E 与门禁收紧基线 | implementation/gate | TK-081,TK-082,TK-083 | planned |
| TK-085 | sprint-002 | CI 与发布流水线生产化接线 | implementation/ci-release | TK-081,TK-084 | planned |
| TK-086 | sprint-002 | project-009 出口验收与运营反馈闭环 | acceptance baseline | TK-081,TK-082,TK-083,TK-084,TK-085 | planned |

## 5. 依赖产物策略

1. project-009 启动入口默认消费 `DA-086`（project-007 出口验收与后续 rollout 输入约束）。
2. sprint-001 产物目标：`DA-087`~`DA-092`；sprint-002 产物目标：`DA-093`~`DA-098`。
3. 任务执行时统一使用 `artifact_id + artifact_path` 双键回链，并同步 `tasks.csv/checklist/artifact-registry`。

## 6. DoD（project-009）

1. 关键用户路径（只读接入、`init/doctor/check/run/review/review-verify`）具备真实执行语义并通过黑盒验证。
2. 不经 npm 发布即可完成本地安装并稳定使用（至少覆盖 path/tgz/link 中两种方式，且选定两种通过 clean-room 连续 3 次 `--help -> init -> doctor -> check`，并至少完成 1 组 `tool_managed -> repo_local -> rollback` workspace 切换验证）。
3. 多工具/多模型自动执行链路可在无人值守模式稳定运行，命中策略闸口时可正确暂停/接管。
4. 角色级进度、关键日志与交互提示可被人类实时消费，并与审计回放事实一致。
5. 根级 `examples/`、README、CHANGELOG 与本地采用手册可独立支撑接入、调试与升级。
6. 任务卡、checklist、tasks.csv 三者字段同步满足 `CS-021`。
7. 外部消费契约黑盒矩阵与最小支持矩阵已形成并回链到 clean-room / docs / release gate。
8. 至少 1 主 1 备 HITL 通知渠道演练通过，且通知回执与人工决策回灌可在 audit/replay 中回链。
9. 至少 1 条受控 delivery rehearsal 覆盖 `commit` 或 `PR draft`，并明确当前自动推送/发 PR 边界。
10. 试点与 30 天运营闭环形成可统计的运营指标快照。

## 7. 里程碑记录

1. 2026-03-22：完成 project-009 拆解，建立 sprint-001/sprint-002 与 `TK-075`~`TK-086` 执行台账入口。
2. 2026-03-22：完成 `TK-087`，主执行计划已补齐 Stage 9A/9B 门槛、GA 量化信号、适配器投产验收与 examples 强约束。
3. 2026-03-22：完成 `TK-088`，`TK-075`~`TK-080` 已下钻 Stage 9A 硬门槛、`DA-092` 交接约束与 clean-room / examples / docs 执行口径。
4. 2026-03-22：完成 `TK-089`，主执行计划已补齐 Phase 对齐、只读接入/workspace 回滚、完整 `review-verify` 闭环、Artifact/Review/Normative gates 与 deferred P1 backlog 口径。
5. 2026-03-22：完成 `TK-090`，`TK-075`~`TK-080` 已补齐只读接入、workspace rollback、`review-verify -> ledger backfill` 与治理 gate 的执行口径。
6. 2026-03-22：完成 `TK-091`，`TK-080` 已升级为可直接填充的 `DA-092` 验收/交接模板骨架。
7. 2026-03-22：完成 `TK-092`，`TK-081`~`TK-085` 已显式消费 `DA-092` 作为 sprint-002 唯一 handoff 入口。
8. 2026-03-22：完成 `TK-093`，`TK-086` 已升级为可直接填充的 `DA-098` 项目出口验收/运营反馈模板，并纳入 completion audit summary 入口要求。
9. 2026-03-22：完成 `TK-094`，主执行计划与 `project-009` 执行入口已补齐运营指标快照、外部消费契约/支持矩阵、HITL 通知 rehearsal、受控 delivery rehearsal，并统一到根级 `examples/` 口径。
10. 2026-03-22：完成 `TK-075`，CLI 关键命令已去 skeleton 化并打通最小治理链路，修复 `@repo-ai-governor/reporting` 构建镜像缺口后 `pnpm run help` 恢复可执行。
11. 2026-03-22：完成 `TK-076`，CLI `run` 已支持 `--dry-run/--trace/--replay`，落地 `DA-088` 诊断基线并补齐 `review -> review-verify -> ledger-backfill` 归因链路。
12. 2026-03-22：完成 `TK-077`，新增 clean-room 安装验证脚本并完成 `path + link` 各连续 3 次验证，补齐 `tool_managed -> repo_local -> rollback` 与只读 attach 预检，产出 `DA-089`。
13. 2026-03-22：完成 `TK-078`，建立根级 `examples/` 四类场景与 `example-smoke` 阻断门禁，产出 `DA-090` 并将校验接入 `check` 与本地分发验证链路。
14. 2026-03-22：完成 `TK-078` 二次收敛，将示例从 README-only 升级为 `scenario.json + fixtures + expected` 可执行资产，并新增 `examples-runtime-smoke` 行为级门禁。
