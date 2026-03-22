# project-007-platformization 计划

- Status: completed
- Date: 2026-03-22
- Stage Mapping: Stage 8
- Phase Mapping: P2 扩展阶段

## 1. 目标

1. 建立平台化控制面契约，统一组织、租户、工作区与能力开关的生命周期治理。
2. 建立插槽市场（Slot Marketplace）注册、发布、消费与审计链路，支持受控扩展与回滚。
3. 建立可视化配置与执行面板契约，支撑流程编排、策略查看与执行追踪的统一入口。
4. 建立组织级策略分发与审计汇聚基线，确保多仓库治理的一致性和可回放性。

## 2. 工作流分解（Workstreams）

1. WS-01 Platform Control Plane
   - 组织/租户/工作区模型与能力开关治理。
   - 平台配置版本化与发布闸口。
2. WS-02 Slot Marketplace
   - 插槽注册索引、版本发布、兼容性声明与消费路由。
   - 插槽生命周期与安全审计闭环。
3. WS-03 Visual Console Contract
   - 可视化配置与执行面板的 domain contract。
   - 执行态事件回链与多视图展示一致性。
4. WS-04 Org Policy Distribution + Audit Hub
   - 策略包分发、灰度发布、回滚和跨租户审计汇聚。
   - 与 Stage 7 既有发布治理与回滚链路保持兼容。
5. WS-05 Rollout Readiness
   - 平台化能力分阶段启用与风险分级。
   - project 出口验收与后续 rollout 输入约束沉淀。

## 3. Sprint 细化

## 3.1 sprint-001-platform-control-plane-and-marketplace-baseline

- Sprint Goal: 完成 Stage 8 启动基线（控制面契约、插槽市场契约、可视化面板契约、组织级策略分发与审计汇聚契约），形成 sprint-002 输入约束。
- 任务包：`TK-064`、`TK-065`、`TK-066`、`TK-067`、`TK-068`。
- Exit Criteria:
  1. 控制面与租户工作区模型具备可执行契约草案与风险边界。
  2. 插槽市场注册与发布契约具备版本兼容与回滚约束。
  3. 可视化配置与执行面板契约具备事件回链与权限基线。
  4. 组织级策略分发与审计汇聚契约形成统一字段口径。
  5. 形成 `DA-081`（sprint-001 出口验收与 sprint-002 输入约束）。

## 3.2 sprint-002-org-governance-and-rollout-readiness

- Sprint Goal: 落地平台化核心能力最小实现链路（市场供给、可视化联调、组织级分发与审计治理）并形成 project-007 出口验收，同时补齐仓库内 workspace code review 生命周期自动收口规则。
- 任务包：`TK-069`、`TK-070`、`TK-071`、`TK-072`、`TK-073`、`TK-074`。
- Exit Criteria:
  1. 插槽市场供给链具备受控发布、回滚与消费验证能力。
  2. 可视化面板 MVP 与 runtime 事件链路可联调并可审计。
  3. 组织级策略包分发与版本治理可灰度发布并可回退。
  4. 跨租户审计汇聚支持检索、导出与权限约束。
  5. 形成 `DA-086`（project-007 出口验收与后续 rollout 输入约束）。

## 4. 任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | status |
|---|---|---|---|---|---|
| TK-064 | sprint-001 | 平台控制面契约与租户工作区模型基线 | baseline/contract | DA-075,DA-076 | completed |
| TK-065 | sprint-001 | 插槽市场注册索引与发布契约基线 | baseline/marketplace | TK-064 | completed |
| TK-066 | sprint-001 | 可视化配置与执行面板契约基线 | baseline/console | TK-064,TK-065 | completed |
| TK-067 | sprint-001 | 组织级策略分发与审计汇聚契约基线 | baseline/policy-audit | TK-064,DA-075 | completed |
| TK-068 | sprint-001 | sprint-001 出口验收与 sprint-002 输入约束 | acceptance baseline | TK-065,TK-066,TK-067 | completed |
| TK-069 | sprint-002 | 插槽市场供给链与权限治理落地 | implementation/marketplace | TK-068 | completed |
| TK-070 | sprint-002 | 可视化面板 MVP 与流程编排联调 | implementation/console | TK-068,TK-069 | completed |
| TK-071 | sprint-002 | 组织级策略包分发与版本治理落地 | implementation/policy | TK-068,TK-069 | completed |
| TK-072 | sprint-002 | 跨租户审计视图与导出治理落地 | implementation/audit | TK-068,TK-071 | completed |
| TK-073 | sprint-002 | project-007 出口验收与后续 rollout 输入约束 | acceptance baseline | TK-069,TK-070,TK-071,TK-072 | completed |
| TK-074 | sprint-002 | workspace code review 无修复项直接 resolved 规则 | maintenance/review-workflow | TK-073 | completed |

## 5. 依赖产物策略

1. project-007 启动入口默认消费 `DA-075`（project-006 出口验收基线）与 `DA-076`（project-007 输入约束清单）。
2. sprint-001 产物目标：`DA-077`~`DA-081`；sprint-002 产物目标：`DA-082`~`DA-086`。
3. 任务执行时统一使用 `artifact_id + artifact_path` 双键回链，并同步 `tasks.csv/checklist/artifact-registry`。
4. 仅当任务产出可复用规范/基线/约束类资产时登记 artifact，避免将临时 plan 噪音写入 registry。

## 6. DoD（project-007）

1. 平台控制面、插槽市场、可视化面板、组织级策略分发与审计汇聚形成可验证契约与最小实现闭环。
2. 平台化改造不破坏 Stage 7 已固化链路（`test:resilience`、`release:rollback-rehearsal`、`release:ga-candidate-unified-gate`）。
3. 平台能力支持分阶段启用，且具备清晰的风险分级与回滚策略。
4. 项目任务台账与评审生命周期路径满足 `CS-021`，无 `task card/checklist/tasks.csv` 漂移。

## 7. 里程碑记录

1. 2026-03-22：切换主执行流到 `project-007-platformization/sprint-001-platform-control-plane-and-marketplace-baseline`，完成项目 WBS 拆解并启动 `TK-064`。
2. 2026-03-22：补齐 `sprint-002-org-governance-and-rollout-readiness` 执行骨架（`plan.md`、`tasks/checklist.md`、`tasks/tasks.csv`、`TK-069`~`TK-073`、`review/.gitkeep`）。
3. 2026-03-22：完成 `TK-064` 并产出 `DA-077`，控制面实体/状态机/API/边界与迁移回滚约束基线已固化。
4. 2026-03-22：完成 `TK-065` 并产出 `DA-078`，插槽市场注册索引、发布闸口与消费解析契约基线已固化。
5. 2026-03-22：完成 `TK-066` 并产出 `DA-079`，可视化配置与执行面板交互契约、权限模型与事件回链字段基线已固化。
6. 2026-03-22：完成 `TK-067` 并产出 `DA-080`，组织级策略分发、灰度回滚触发、跨租户审计汇聚最小字段与 Stage 7 兼容约束基线已固化。
7. 2026-03-22：完成 `TK-068` 并产出 `DA-081`，sprint-001 出口验收与 sprint-002 输入约束基线已固化，sprint-001 状态收敛为 `completed`。
8. 2026-03-22：完成 `TK-069` 并产出 `DA-082`，插槽市场供给链与权限治理实现基线已固化。
9. 2026-03-22：完成 `TK-070` 并产出 `DA-083`，可视化面板 MVP 与流程编排联调实现基线已固化。
10. 2026-03-22：完成 `TK-071` 并产出 `DA-084`，组织级策略包分发与版本治理实现基线已固化。
11. 2026-03-22：完成 `TK-072` 并产出 `DA-085`，跨租户审计视图与导出治理实现基线已固化。
12. 2026-03-22：完成 `TK-073` 并产出 `DA-086`，project-007 出口验收与后续 rollout 输入约束已固化。
13. 2026-03-22：新增项目完成态审计摘要入口：`.repo-ai-governor/context/dev/project-007-platformization/project-007-platformization-completion-audit-summary.md`。
14. 2026-03-22：完成 `TK-074`，workspace code review 在无修复项时可直接输出 `resolved` 状态，避免 CR 生命周期空转。
