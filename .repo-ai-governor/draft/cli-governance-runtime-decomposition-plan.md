# `cli-governance-runtime.ts` 拆分方案（Draft）

- Status: draft
- Date: 2026-03-24
- Owner: AI-Agent
- Scope: `apps/cli/src/cli-governance-runtime.ts`
- Related Task: `TK-114`

## 1. 目的

为 `apps/cli/src/cli-governance-runtime.ts` 提供一个可渐进执行的拆分方案，避免继续演化为跨层级 God object，并为后续 `project-010` 的自动主链实现留出清晰的模块边界。

## 2. 当前状态快照

1. 当前文件约 `4565` 行。
2. 当前类同时承载 `50+` 个方法，且职责跨越命令入口、运行时编排、adapter 探测、artifact 写入、展示拼装和风险辅助逻辑。
3. 按代码区段可粗分为：
   - `311-1879`：顶层命令执行（`init/connect/doctor/check/run/review/verify/plan/upgrade`）
   - `1949-2181`：workspace/bootstrap 与 artifact I/O
   - `2241-2433`：adapter probe 诊断、failure detail、safe_local payload
   - `2475-2856`：route selection、protocol map、restricted-network fallback
   - `2884-4233`：experience payload、prompt、verification、replay explain
   - `4340-4541`：git changed paths、risk category、process definition、格式化辅助

## 3. 当前问题

1. 文件不是单纯“过长”，而是混合了多个架构层的实现：`CLI Entry`、`Governance Core`、`Agent Runtime & Adapter`、`Audit & Reporting`。
2. 新增一个命令或一条 adapter/fallback 逻辑时，往往需要继续改这个中心类，导致修改面扩大、测试成本上升、review 负担变重。
3. `TK-099` 到 `TK-101` 将继续增强 `run` 主链、review 子链和 HITL 回灌；如果不先拆边界，这个文件会进一步膨胀。

## 4. 拆分目标

1. `CliGovernanceRuntime` 退化为薄 orchestrator/facade：只负责命令分发、依赖装配、统一错误出口。
2. 命令实现、adapter 诊断、route/fallback、artifact writer、experience shaping 分别进入独立模块。
3. 新增能力优先写到对应 bounded context，不再继续追加到单一 runtime 文件。
4. 拆分过程不做 big-bang rewrite，保持 CLI 契约和已有测试稳定。

## 5. 推荐目标结构

### 5.1 顶层运行时外壳

1. `apps/cli/src/cli-governance-runtime.ts`
   - 只保留 `execute(commandName)`、依赖组装、统一异常转译。

### 5.2 命令模块

1. `apps/cli/src/commands/init-command.ts`
2. `apps/cli/src/commands/connect-command.ts`
3. `apps/cli/src/commands/doctor-command.ts`
4. `apps/cli/src/commands/check-command.ts`
5. `apps/cli/src/commands/run-command.ts`
6. `apps/cli/src/commands/review-command.ts`
7. `apps/cli/src/commands/verify-command.ts`
8. `apps/cli/src/commands/plan-command.ts`
9. `apps/cli/src/commands/upgrade-command.ts`

### 5.3 运行时支持模块

1. `apps/cli/src/runtime/adapter-verification-runtime.ts`
   - `resolveAdapterVerification`
   - tool snapshot collection
   - failure attribution
2. `apps/cli/src/runtime/local-model-probe-runtime.ts`
   - local model endpoint/command probe
   - config resolution merge
3. `apps/cli/src/runtime/run-route-runner.ts`
   - role binding candidate surfaces
   - protocol/tool config map
   - route dispatch
4. `apps/cli/src/runtime/restricted-network-fallback-runtime.ts`
   - restricted fallback qualification
   - local takeover strategy

### 5.4 Artifact / Reporting 模块

1. `apps/cli/src/runtime/artifacts/runtime-artifact-writer.ts`
   - text/json artifact write helpers
   - run diagnostics trace
2. `apps/cli/src/runtime/artifacts/review-queue-runtime.ts`
   - review queue directory resolution
   - queued artifact discovery
3. `apps/cli/src/runtime/artifacts/diagnostics-artifact-builder.ts`
   - safe_local boundary payload
   - adapter verification artifact payload

### 5.5 Presentation / Experience 模块

1. `apps/cli/src/runtime/presentation/command-experience-builder.ts`
   - experience payload
   - progress rows
   - interaction prompts
2. `apps/cli/src/runtime/presentation/replay-explain-builder.ts`
   - replay explain payload
   - diagnostic root cause / next actions

### 5.6 Risk / Process 辅助模块

1. `apps/cli/src/runtime/git-risk-runtime.ts`
   - git changed paths
   - risk categories
2. `apps/cli/src/runtime/process-definition-runtime.ts`
   - CLI run process definition

## 6. 分阶段拆分顺序

### Phase 1: Adapter Verification / Local Probe 抽离

1. 先抽 `resolveAdapterVerification`、tool snapshots、local probe、failure attribution。
2. 这是当前 churn 最高的区域，也是 `TK-096/TK-097` 已经触达的逻辑面。
3. 目标是先把“深度诊断逻辑”从命令编排中剥离出来。

### Phase 2: Route / Fallback 抽离

1. 抽离 route dispatch、surface binding、restricted-network fallback。
2. 让 `run` 命令只表达“选择哪条链路”，不直接拥有 fallback 细节。

### Phase 3: Artifact / Report Builder 抽离

1. 抽离 diagnostics、review queue、run trace 的 writer/builder。
2. 让 artifact 结构拼装与命令控制流分离。

### Phase 4: Command Executor 抽离

1. 将 `executeDoctorCommand`、`executeRunCommand`、`executeReviewCommand` 等迁出到 `commands/`。
2. `CliGovernanceRuntime` 只剩 command registry/dispatch。

### Phase 5: Facade 收口

1. 清理剩余通用辅助函数。
2. 对剩余辅助逻辑先做归属判断：跨 app/package 复用且语义稳定的能力再收敛到 shared；仅服务 CLI bounded context 的辅助逻辑保留在 `apps/cli/src/runtime/*`、`apps/cli/src/presentation/*` 或等价 package-local 模块中。
3. 最终将 `CliGovernanceRuntime` 压缩为“薄入口层”。

## 7. 迁移约束

1. 不允许以“大文件对拆成很多碎文件”替代真正分层；拆分单元应是 bounded context，不是“一函数一文件”。
2. 拆分过程中必须保持 `pretty/plain/json` 输出契约稳定。
3. 每个 phase 至少补一个对应回归测试，避免“只搬代码、不固化边界”。
4. 拆分优先保证行为不变；如有行为变更，必须在对应 task card 中显式声明。
5. 新功能若命中已识别职责域，应直接落入目标模块，不再回填到 `cli-governance-runtime.ts`。

## 8. 完成定义

1. `CliGovernanceRuntime` 不再直接拥有命令实现、adapter probe/fallback、artifact payload 拼装三类及以上职责。
2. `run`、`doctor`、`review` 三条高频路径各自拥有独立命令模块或运行时支持模块。
3. 运行时支持模块与 presentation 模块可被单测/集成测试直接覆盖。
4. 后续 `TK-099` 到 `TK-101` 的实现不再要求继续向当前 God object 追加大块逻辑。

## 9. 建议用途

1. 本文档作为后续 runtime 重构窗口的输入约束。
2. 若开始正式拆分，应在对应 task card 中标注当前 phase，并回链本文档。
3. 若出现临时例外，应同时遵循 `CS-027` 的例外登记要求。
