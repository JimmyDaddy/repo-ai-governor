# project-006-hardening-and-release 计划

- Status: completed
- Date: 2026-03-22
- Stage Mapping: Stage 7
- Phase Mapping: Phase E

## 1. 目标

1. 建立跨包契约测试基线，覆盖核心运行时与治理关键模块。
2. 建立 `tests/contract`、`tests/integration`、`tests/e2e` 分层稳定性基线并纳入统一门禁。
3. 落地发布治理策略（lockstep + independent）与 `canary -> rc -> ga` 通道。
4. 补齐受限网络模式与离线降级链路稳定性回归，形成可重复回滚机制。

## 2. 工作流分解（Workstreams）

1. WS-01 Contract Test Matrix
   - 核心契约：`adapter-sdk`、`memory-store-adapter`、`artifact-registry`、`notification-dispatcher`。
   - 治理契约：`process DSL/IR`、`risk evaluator/policy decisions`、`standards projection parity`。
2. WS-02 Layered Test Baseline
   - 收敛 `tests/contract`、`tests/integration`、`tests/e2e` 的分层职责与最小稳定集。
   - 对齐 `CS-024` 的包级/跨包测试边界。
3. WS-03 Release Governance
   - 版本策略：`core-*` + `adapter-sdk` + `shared` lockstep；`adapters/*` + `providers/*` independent。
   - 通道策略：`canary -> rc -> ga` 与回滚演练基线。
4. WS-04 Resilience Regression
   - 受限网络与离线降级回归。
   - 发布前后稳定性与可恢复性证据固化。

## 3. Sprint 细化

## 3.1 sprint-001-contract-and-release-governance-baseline

- Sprint Goal: 完成 Stage 7 前半段基线（跨包契约测试矩阵、分层测试基线、发布治理策略）并形成 sprint-002 输入约束。
- 任务包：`TK-056`、`TK-057`、`TK-058`、`TK-059`。
- Exit Criteria:
  1. 跨包契约测试矩阵可执行并形成稳定入口。
  2. `tests/contract`、`tests/integration`、`tests/e2e` 分层职责与样例覆盖明确。
  3. 发布治理策略与 `canary -> rc -> ga` 通道语义固化。
  4. 形成 `DA-070`（sprint-001 出口验收）与 `DA-071`（sprint-002 输入约束）。

## 3.2 sprint-002-resilience-and-ga-readiness

- Sprint Goal: 完成 Stage 7 后半段基线（受限网络/离线降级稳定性、回滚演练、GA 准入门禁）并形成 project-006 出口验收。
- 任务包：`TK-060`、`TK-061`、`TK-062`、`TK-063`。
- Exit Criteria:
  1. 受限网络与离线降级回归具备可重复执行证据。
  2. 回滚演练路径可执行并可审计回放。
  3. GA 候选门禁具备契约、稳定性与发布策略联合验证能力。
  4. 形成 `DA-075`（project-006 出口验收）与 `DA-076`（project-007 输入约束）。

## 4. 任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | status |
|---|---|---|---|---|---|
| TK-056 | sprint-001 | 跨包契约测试矩阵基线 | baseline/contract | DA-065,DA-066 | completed |
| TK-057 | sprint-001 | 分层测试（contract/integration/e2e）稳定基线 | baseline/test | TK-056 | completed |
| TK-058 | sprint-001 | 发布治理策略与 canary-rc-ga 通道基线 | baseline/release | TK-056,TK-057 | completed |
| TK-059 | sprint-001 | sprint-001 出口验收与 sprint-002 输入约束 | acceptance baseline | TK-056,TK-057,TK-058 | completed |
| TK-060 | sprint-002 | 受限网络与离线降级稳定性回归基线 | baseline/resilience | TK-059 | completed |
| TK-061 | sprint-002 | 回滚演练与恢复流程基线 | baseline/release | TK-058,TK-060 | completed |
| TK-062 | sprint-002 | GA 候选联合门禁（契约+稳定性+发布）基线 | baseline/gate | TK-060,TK-061 | completed |
| TK-063 | sprint-002 | project-006 出口验收与 project-007 输入约束 | acceptance baseline | TK-060,TK-061,TK-062 | completed |

## 5. 依赖产物策略

1. project-006 启动入口默认消费 `DA-065`（project-005 出口验收基线）与 `DA-066`（project-006 输入约束清单）。
2. sprint-001 产物目标：`DA-067`~`DA-071`；sprint-002 产物目标：`DA-072`~`DA-076`。
3. 任务执行时统一使用 `artifact_id + artifact_path` 双键回链，并同步 `tasks.csv/checklist/artifact-registry`。

## 6. DoD（project-006）

1. 核心跨包契约测试具备稳定入口，关键模块契约可回归。
2. 分层测试职责清晰，包级与跨包边界符合 `CS-024`。
3. 发布治理支持 lockstep + independent 并具备 canary/rc/ga 与回滚链路证据。
4. 受限网络与离线降级场景下治理链路可持续执行。
5. 项目任务台账与评审生命周期满足 `CS-021`，无 `task card/checklist/tasks.csv` 漂移。

## 7. 里程碑记录

1. 2026-03-22：完成 project-006 拆解，建立 sprint-001/sprint-002 与 `TK-056`~`TK-063` 执行台账入口。
2. 2026-03-22：完成 `TK-056` 并产出 `DA-067`（跨包契约测试矩阵基线），sprint-001 状态切换为 `active`。
3. 2026-03-22：完成 `TK-057` 并产出 `DA-068`（contract/integration/e2e 分层测试稳定基线），Stage 7 分层测试入口接入 gate 链路。
4. 2026-03-22：完成 `TK-058` 并产出 `DA-069`（发布治理与 canary/rc/ga 通道基线），release:check / release:ga-check / release:verify-local 链路闭环可回归。
5. 2026-03-22：完成 `TK-059` 并产出 `DA-070/DA-071`，sprint-001 出口验收与 sprint-002 输入约束链路完成闭环。
6. 2026-03-22：切换主执行流到 `sprint-002-resilience-and-ga-readiness`，启动 `TK-060`（受限网络与离线降级稳定性回归基线）。
7. 2026-03-22：完成 `TK-060` 并产出 `DA-072`，受限网络/离线降级回归入口 `test:resilience` 可执行并通过门禁验证。
8. 2026-03-22：启动 `TK-061`（回滚演练与恢复流程基线），进入 sprint-002 第二阶段执行。
9. 2026-03-22：完成 `TK-061` 并产出 `DA-073`，`release:rollback-rehearsal` 与结构化演练报告落盘。
10. 2026-03-22：完成 `TK-062` 并产出 `DA-074`，`release:ga-candidate-unified-gate` 联合门禁基线可复跑。
11. 2026-03-22：完成 `TK-063` 并产出 `DA-075/DA-076`，project-006 状态收敛为 `completed`。
12. 2026-03-22：project-006 完成态审计摘要：`.repo-ai-governor/context/dev/project-006-hardening-and-release/project-006-hardening-and-release-completion-audit-summary.md`。
