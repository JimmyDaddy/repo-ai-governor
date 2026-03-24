# DA-120 sprint-002 出口验收与 sprint-003 输入约束

- Status: active
- Date: 2026-03-24
- Owner: AI-Agent
- Artifact ID: `DA-120`
- Produced By: `TK-122`
- Scope: `project-011-cli-package-decomposition`

## 1. 目的

固化 `project-011 / sprint-002` 在 artifact/presentation 抽离、command executor cutover 与 thin facade 收敛方面的出口验收证据，并提前冻结 sprint-003 的 package hardening、shared/package-local 边界和 rollout alignment 输入约束。

## 2. 当前已成立的证据

1. `DA-117` 已可检索
   - `artifact/report/presentation` 已从 `CliGovernanceRuntime` 中抽离为 package-local runtime/presentation 模块。
2. `DA-118` 已可检索
   - `init/connect/doctor/check/verify/plan/upgrade` 已迁入 `commands/*`，并建立了稳定的 entry registry 与 shared command context。
3. `TK-121` 已进入实施
   - `review/review-verify` 命令链已开始迁入 `commands/*`，薄 facade 收敛继续推进中。

## 3. 待补齐的出口验收项

1. `run/replay` 命令链仍在 facade 内
   - sprint-002 的最终出口结论仍依赖 `TK-121` 是否完成高复杂度命令 cutover。
2. `CliGovernanceRuntime` 的最终职责仍需再次审计
   - 当前已明显瘦身，但是否满足“仅保留 dispatch/assembly/error boundary”的最终出口标准，要在 `TK-121` 收口后复核。
3. `DA-119` 尚未产出
   - `TK-122` 的最终 `accept/block` 结论必须引用 `DA-119` 作为直接证据之一。

## 4. sprint-003 输入约束（冻结稿）

1. `shared/package-local` 边界收敛必须建立在 sprint-002 的 command/runtime/presentation/artifact 边界之上，不得反向把 CLI 专属语义上提到 shared。
2. `exports/tests/smoke` 加固要优先覆盖新形成的 `commands/*`、runtime support、presentation/artifact 边界，而不是继续围绕 legacy facade 堆测试。
3. `project-010` 后续消费 `project-011` 结果时，应优先引用 `DA-117`、`DA-118`、`DA-119`、`DA-120`，不得直接绕过这些产物继续向 legacy facade 堆主链逻辑。

## 5. 当前结论

1. 当前状态：`pending_final_acceptance`
2. 原因：`TK-121` 仍在进行中，`run/replay` cutover 与最终 thin facade 结论尚未闭合。
3. 下一步：待 `TK-121` 收口并形成 `DA-119` 后，回填本文件的最终 `accept/block` 结论与验证证据。
