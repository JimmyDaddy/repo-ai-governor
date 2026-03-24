# project-011-cli-package-decomposition 计划

- Status: completed
- Date: 2026-03-24
- Stage Mapping: Stage 9 enabling refactor + CLI architecture cleanup
- Phase Mapping: Phase E follow-up + CLI package decomposition

## 1. 目标

1. 基于 `cli-governance-runtime.ts` 拆分 draft，将 `apps/cli` 从单体 God object 逐步重构为 bounded-context 明确的 CLI package。
2. 在不破坏 CLI `pretty/plain/json` 契约、review/report/replay 路径和现有测试基线的前提下，完成命令、运行时支撑、artifact/presentation 和 facade 的职责拆分。
3. 为 `project-010` 的 `TK-099` ~ `TK-101` 提供稳定的 CLI 结构边界，避免自动主链能力继续堆叠到 `apps/cli/src/cli-governance-runtime.ts`。

## 2. 工作流分解（Workstreams）

1. WS-01 Runtime Support Extraction
   - adapter verification、local probe、route selection、restricted fallback 等高 churn 逻辑抽离。
2. WS-02 Artifact / Presentation Boundary Cleanup
   - diagnostics、review queue、run trace、experience/replay explain 等构建逻辑抽离。
3. WS-03 Command Surface Decomposition
   - 顶层命令执行器与 entry registry/facade 拆分。
4. WS-04 Package Boundary Hardening
   - shared 与 package-local 的职责边界、exports、tests、smoke 与 regression 收口。
5. WS-05 Rollout Backfeed
   - 将 project-011 产物回灌给 `project-010`，作为 sprint-002 / sprint-003 的稳定输入约束。

## 2.1 CLI Decomposition 落地优先级（P0/P1）

1. P0-1 Runtime 支撑逻辑抽离（`TK-116`）
   - 先拆 `adapter verification/local probe`，降低后续主链任务对 God object 的继续挤压。
2. P0-2 Route / Fallback / Diagnostics 抽离（`TK-117`）
   - 让 route selection 与 restricted-network fallback 离开命令编排中心类。
3. P0-3 Artifact / Presentation 抽离（`TK-119`）
   - 将 diagnostics/report/replay/presentation 逻辑迁出，收敛可测试边界。
4. P0-4 Command Executor 与 Facade Cutover（`TK-120`、`TK-121`）
   - 将命令逻辑迁移到 `commands/*`，最终把 `CliGovernanceRuntime` 压缩为薄入口层。
5. P0-5 Exit Acceptance And Rollout Contract（`TK-118`、`TK-122`、`TK-125`）
   - 每轮 sprint 都要形成对 `project-010` 可消费的输入约束。
6. P1-1 Shared / Package-local Boundary Hardening（`TK-123`）
   - 只将稳定跨包复用能力上提到 shared，其他保留在 `apps/cli`。
7. P1-2 Test / Smoke / Export Hardening（`TK-124`）
   - 让拆分后的 package 具备清晰的回归与交付基线。

## 3. Sprint 细化

## 3.1 sprint-001-runtime-support-extraction-foundation

- Sprint Goal: 建立 project-011 的依赖约束和基线产物，并完成 CLI runtime 支撑层第一批抽离，为 `project-010` sprint-002 冻结输入边界。
- 任务包：`TK-115`、`TK-116`、`TK-117`、`TK-118`。
- 执行结果：已完成 `DA-113`~`DA-116`，并以 `accept` 结论结束 sprint-001。
- Exit Criteria:
  1. `DA-113`~`DA-116` 可检索，并完成 artifact registry / 台账同步。
  2. `adapter verification/local probe` 与 `route/fallback/diagnostics builder` 的拆分边界明确，后续主链开发不再默认回填到 `cli-governance-runtime.ts`。
  3. `project-010` sprint-002 入口已回链 project-011 的分解基线。

## 3.2 sprint-002-command-surface-and-facade-cutover

- Sprint Goal: 完成 artifact/presentation 与 command executor 抽离，并将 `CliGovernanceRuntime` 收敛为薄 facade。
- 任务包：`TK-119`、`TK-120`、`TK-121`、`TK-122`。
- Exit Criteria:
  1. artifact/report/presentation 逻辑已拆出可直接测试的模块。
  2. 命令执行器已迁出到 `commands/*` 或等价 bounded context。
  3. `CliGovernanceRuntime` 仅保留 command dispatch、依赖装配和统一错误出口。
  4. `DA-117`~`DA-120` 可检索，并完成 sprint-002 出口验收。

## 3.3 sprint-003-package-hardening-and-rollout-alignment

- Sprint Goal: 完成 shared/package-local 边界、exports/tests/smoke 加固，并将 CLI package decomposition 的结论回灌给 `project-010`。
- 任务包：`TK-123`、`TK-124`、`TK-125`。
- 启动约束：允许基于 `DA-120` 冻结稿并行启动 `TK-123` 的边界审计与 exports 基线收敛，但最终收口仍需消费 `TK-122` 的最终 `accept` 结论。
- Exit Criteria:
  1. shared 与 package-local 的归属规则在代码和文档上都已稳定。
  2. 拆分后的 CLI package 具备分层测试、smoke 与 regression 证据。
  3. `project-011` 完成出口验收，并为 `project-010` 后续 rollout 提供正式输入约束。

## 4. 任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | status |
|---|---|---|---|---|---|
| TK-115 | sprint-001 | project-011 启动与 CLI package decomposition 依赖重排 | analysis/baseline | TK-114 | completed |
| TK-116 | sprint-001 | adapter verification 与 local probe 模块抽离 | implementation/runtime | DA-113 | completed |
| TK-117 | sprint-001 | route fallback 与 diagnostics artifact builder 抽离 | implementation/runtime | TK-116,DA-113 | completed |
| TK-118 | sprint-001 | sprint-001 出口验收与 sprint-002 输入约束 | acceptance baseline | TK-116,TK-117 | completed |
| TK-119 | sprint-002 | artifact/report/presentation 模块抽离 | implementation/runtime | TK-118 | completed |
| TK-120 | sprint-002 | 通用命令执行器抽离与 entry registry 基线 | implementation/command | TK-119 | completed |
| TK-121 | sprint-002 | run/review 命令执行器抽离与 thin facade cutover | implementation/command | TK-119,TK-120 | completed |
| TK-122 | sprint-002 | sprint-002 出口验收与 sprint-003 输入约束 | acceptance baseline | TK-119,TK-120,TK-121 | completed |
| TK-123 | sprint-003 | shared 与 package-local 边界收敛及 exports 清理 | implementation/hardening | TK-122 | completed |
| TK-124 | sprint-003 | cli package 回归、smoke 与 test topology 加固 | implementation/hardening | TK-122,TK-123 | completed |
| TK-125 | sprint-003 | project-011 出口验收与 project-010 rollout 输入约束 | acceptance baseline | TK-123,TK-124 | completed |

## 5. 依赖产物策略

1. project-011 启动入口默认消费 `TK-114` 和 `.repo-ai-governor/draft/cli-governance-runtime-decomposition-plan.md`。
2. sprint-001 产物目标：`DA-113`~`DA-116`；sprint-002 产物目标：`DA-117`~`DA-120`；sprint-003 产物目标：`DA-121`~`DA-123`。
3. `project-010` sprint-002 及之后的 CLI 主链改动，应优先引用 project-011 的 `DA-*` 产物，而不是直接扩写 legacy God object。
4. 仅“规范/基线/约束”类产物进入 artifact registry；纯过程性计划文档不登记。

## 6. DoD（project-011）

1. `apps/cli/src/cli-governance-runtime.ts` 不再同时承载命令实现、runtime 支撑、artifact builder、presentation shaping 等三类以上职责。
2. `apps/cli` 建立清晰的 command/runtime/presentation/artifact/package-local 边界。
3. shared 只接收稳定跨包复用能力，CLI 专属逻辑不被误上提。
4. 拆分后的 CLI package 通过台账门禁、质量门禁与关键回归测试。
5. `project-010` 获得明确且可审计的 rollout 输入约束。

## 7. 里程碑记录

1. 2026-03-24：创建 `project-011`，将 CLI package decomposition 从 `project-010` 中独立为单独的工程支撑主线，并切换为当前 primary stream。
2. 2026-03-24：完成 sprint-001 runtime support extraction，形成 `DA-115/DA-116` 并为 sprint-002 冻结 handoff 约束。
3. 2026-03-24：切换到 sprint-002 `TK-119`，开始 artifact/report/presentation 模块抽离与 facade 收口第一轮实施。
4. 2026-03-24：切换到 sprint-003 `TK-123`，基于 `DA-120` 冻结稿启动 shared/package-local 边界审计与 exports 基线收敛。
5. 2026-03-24：并行启动 `TK-124/TK-125`，先固定 CLI package test topology 与 project-011 滚动验收草案，再等待 sprint-003 最终证据收口。
6. 2026-03-24：完成 `TK-121`~`TK-125` 全部收口，产出 `DA-119`~`DA-123` 与 `project-011-cli-package-decomposition-completion-audit-summary.md`，`project-011` 状态切换为 `completed`。
