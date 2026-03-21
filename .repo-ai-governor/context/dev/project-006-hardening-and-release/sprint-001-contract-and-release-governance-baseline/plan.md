# sprint-001-contract-and-release-governance-baseline 计划

- Status: planned
- Date: 2026-03-22
- Project: `project-006-hardening-and-release`

## 1. Sprint Goal

完成 Stage 7 前半段执行基线，建立跨包契约测试矩阵、分层测试基线与发布治理策略，并形成 sprint-002 输入约束。

## 2. In-Scope Tasks

1. TK-056 跨包契约测试矩阵基线（planned）
2. TK-057 分层测试（contract/integration/e2e）稳定基线（planned）
3. TK-058 发布治理策略与 canary-rc-ga 通道基线（planned）
4. TK-059 sprint-001 出口验收与 sprint-002 输入约束（planned）

## 3. Entry Criteria

1. `DA-065` 与 `DA-066` 可检索并可作为 Stage 7 启动输入。
2. Stage 6 产物对应门禁链路（task ledger / sprint status / artifact lifecycle）保持通过。
3. `project-006` WBS 与依赖关系已在 project 计划中登记。

## 4. Exit Criteria

1. 跨包契约测试矩阵形成可执行入口并沉淀基线文档。
2. `tests/contract`、`tests/integration`、`tests/e2e` 的分层职责与最小样例覆盖明确。
3. 发布治理策略（lockstep + independent）与 `canary -> rc -> ga` 通道语义形成可回归基线。
4. 形成 `DA-070`（sprint-001 出口验收）与 `DA-071`（sprint-002 输入约束）。
