# sprint-003-package-hardening-and-rollout-alignment 计划

- Status: planned
- Date: 2026-03-24
- Project: `project-011-cli-package-decomposition`

## 1. Sprint Goal

完成 shared/package-local 边界、exports/tests/smoke 加固，并将 CLI package decomposition 的结论正式回灌给 `project-010`。

## 2. In-Scope Tasks

1. TK-123 shared 与 package-local 边界收敛及 exports 清理（planned）
2. TK-124 cli package 回归、smoke 与 test topology 加固（planned）
3. TK-125 project-011 出口验收与 project-010 rollout 输入约束（planned）

## 3. Entry Criteria

1. `DA-120`（sprint-002 出口验收与 sprint-003 输入约束）可检索。
2. `CliGovernanceRuntime` 已完成 facade cutover，不再是单点职责中心。

## 4. Exit Criteria

1. shared 与 package-local 边界在代码、文档与测试上均保持一致。
2. CLI package 具备稳定的 smoke / regression / topology 证据。
3. `DA-121`~`DA-123` 可检索，并完成 project-011 出口验收。
