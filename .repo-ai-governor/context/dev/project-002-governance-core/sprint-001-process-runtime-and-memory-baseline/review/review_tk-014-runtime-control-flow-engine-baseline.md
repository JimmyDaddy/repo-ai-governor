# Code Review: TK-014 Runtime 控制流执行基线

- Status: review_pending
- Date: 2026-03-20
- Reviewer: AI-Agent
- Task: `TK-014`
- Review Type: staged code review
- Normative References:
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md` §4.2, §5.2 ~ §5.5
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md` §5, §6
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/context/dev/project-002-governance-core/plan.md`
  - `.repo-ai-governor/context/dev/project-002-governance-core/sprint-001-process-runtime-and-memory-baseline/tasks/TK-014-runtime-control-flow-engine-baseline.md`

## 1. Review Scope

暂存区涉及 TK-014 相关变更共约 30 个文件，按功能归类如下：

| 分类 | 文件数 | 说明 |
|---|---|---|
| `packages/core-runtime/` 新增 | 21 | 控制流引擎、常量、类型定义、provider 抽象 |
| `packages/shared/` 修改 | 1 | 扩展 `GovernorErrorCode` |
| `test/` 新增 | 1 | `process-runtime-engine.smoke.test.ts` |
| `.repo-ai-governor/` 治理文档 | 5 | TK-014 任务卡、checklist、tasks.csv、plan.md、code_standards.md |
| `code_standards.md` 修改 | 1 | CS-013 规则放宽（允许同文件声明多个 interface/type） |

## 2. Findings

### 2.1 SEVERE — `formatRfc3339Seconds` 重复实现，违反 CS-010 工具复用规则

- **位置**: `packages/core-runtime/src/process-runtime-engine.ts` L680 与 `packages/core-process/src/process-compiler.ts` L683
- **现象**: 两个包各自定义了完全相同的 `formatRfc3339Seconds` 私有函数（函数签名、实现、JSDoc 完全一致）。
- **违反**: CS-010（"Before adding any new utility function, contributors must evaluate whether `src/utils/` already has a reusable implementation. Confirmed new utility functions must record reuse evaluation"）。
- **风险**: 两处实现独立维护，后续 RFC3339 格式调整时容易遗漏其一，导致快照与运行时日志时间格式不一致。
- **建议**: 将 `formatRfc3339Seconds` 提升到 `packages/shared/src/utils/` 作为共享工具函数，两处改为从 shared 导入。

### 2.2 MEDIUM — `Parallel` 聚合策略仅实现 `allOf`，未预留 `anyOf`/`majority` 扩展点

- **位置**: `packages/core-runtime/src/process-runtime-engine.ts` L263-L276（Parallel 分支执行逻辑）
- **现象**: Parallel 节点通过 `Promise.all` 执行全部出边，语义等价于 `allOf` 策略。技术方案 §5.5 第 3 条要求并行聚合策略至少支持 `allOf/anyOf/majority` 三种。当前实现无聚合策略字段声明，也无 `anyOf`/`majority` 的基线判断逻辑。
- **当前可接受**: README.md 已声明"Parallel 采用 allOf 聚合基线"，作为基线阶段是合理的最小交付。
- **建议**: 在 `RuntimeExecuteOptions` 或 IR 节点结构中预留 `parallelAggregationStrategy` 字段（默认 `allOf`），使后续扩展不需改变 public API shape。或者在任务卡中明确标注 `anyOf`/`majority` 作为 follow-up。

### 2.3 MEDIUM — 缺少 §5.3 错误分类体系的契约映射

- **位置**: `packages/core-runtime/src/process-runtime-engine.ts`（`resolveStageStatus` / `resolveExecutionStatus`）
- **现象**: 技术方案 §5.3 定义了 7 种错误分类（`transient/permanent/policy_blocked/timeout/cancelled/concurrency_conflict/budget_exceeded`）。当前 runtime 仅区分 `timeout/cancelled/failed` 三种状态，将所有非 timeout/cancelled 错误统一归为 `FAILED`。
- **当前可接受**: 基线阶段尚未接入 Risk Evaluator 与 Policy Gate（TK-017/TK-018 范畴）。
- **建议**: 在 `RuntimeStageStatus`/`RuntimeExecutionStatus` 中预留 `POLICY_BLOCKED`/`BUDGET_EXCEEDED` 枚举值，或在 TK-014 任务卡中显式标注"§5.3 错误分类体系将在 sprint-002 补齐"。

### 2.4 MEDIUM — 缺少 §5.3 Stage 重试契约

- **位置**: `packages/core-runtime/src/process-runtime-engine.ts`（`executeStage` 方法）
- **现象**: 技术方案 §5.3 第 2 条定义了 Stage 重试契约字段（`retryable/maxRetries/backoffStrategy/backoffBaseMs/jitter/idempotency_required`），且 IR 节点已携带 `retryPolicyRef`。当前 runtime 在 stage 失败后直接抛出异常，无重试逻辑。
- **当前可接受**: sprint-001 DoD 要求"重试/超时/取消可控"，其中超时和取消已落地，重试可视为"可控=不自动重试"的最小语义。
- **建议**: 在 `RuntimeExecuteOptions` 中预留 `retryPolicy` 配置接口，或在 TK-014 任务卡中注明"retry 在 TK-017 之后补齐"。

### 2.5 MEDIUM — 缺少 §5.4 取消传播语义

- **位置**: `packages/core-runtime/src/process-runtime-engine.ts`（`assertFlowHealthOrThrow`）
- **现象**: 技术方案 §5.4 第 1 条要求 `cancel()` 可由用户、策略引擎或系统守卫触发，并沿 `Flow -> Stage -> Agent` 传播。当前实现仅在 `assertFlowHealthOrThrow` 中检查 `signal?.aborted`，但未将 `AbortSignal` 传递给 `stageHandler` 或在 `runStageWithTimeout` 中联动 signal abort。
- **风险**: 当 `signal` 被 abort 时，正在执行的 stage handler 无感知，需等到 stage 自然结束后回到 `executeNode` 再检测到取消，产生延迟。
- **建议**: 将 `signal` 作为 `RuntimeStageContext` 的可选字段透传给 stage handler；在 `runStageWithTimeout` 中的 `Promise.race` 增加 signal abort 竞争。

### 2.6 MEDIUM — `executeNode` 使用递归调用，存在深度 DAG 栈溢出风险

- **位置**: `packages/core-runtime/src/process-runtime-engine.ts` L170-L276
- **现象**: `executeNode` 通过递归方式沿 edges 遍历 DAG。对于 Sequential 链或深层嵌套 DAG，每次转移占用一层调用栈。`DEFAULT_RUNTIME_MAX_TRANSITIONS = 1000` 的安全阀虽可限制转移次数，但 1000 层递归在 Node.js 默认栈深度下可能触发 `Maximum call stack size exceeded`。
- **当前可接受**: 基线阶段的实际流程 DAG 深度通常远低于栈限制（数十节点量级）。
- **建议**: 作为 follow-up，当 DAG 深度需求增大时考虑将递归改为迭代（使用显式栈/队列）。可在代码中添加注释标注此设计约束。

### 2.7 MEDIUM — Parallel 分支共享 `runtimeState` 的并发安全

- **位置**: `packages/core-runtime/src/process-runtime-engine.ts` L263-L276
- **现象**: Parallel 分支通过 `Promise.all` 并发执行，所有分支共享同一个 `runtimeState`（包括 `stageResults`, `visitedNodeIds`, `transitions`, `nodeAttemptCounter`）。虽然 JavaScript 单线程事件循环保证原子性操作不会真正并发，但 `await` yield 点之间的交错可能导致 `transitions` 计数、`visitedNodeIds` 顺序与 `stageResults` 顺序不可预测。
- **当前可接受**: 基线阶段 `transitions` 安全阀仍有效（只可能偏大不会偏小），`stageResults` 的乱序不影响正确性。
- **建议**: 在 README 或代码注释中明确"Parallel 分支的 stageResults 顺序不保证"；后续若需严格排序，考虑为 Parallel 分支引入独立 accumulator 再 merge。

### 2.8 MINOR — CS-013 规则变更超出 TK-014 任务范围

- **位置**: `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md` CS-013 行
- **现象**: 在 TK-014 提交中修改了 CS-013 规则（新增 "Within each domain/context under types, multiple interface/type declarations may be co-located in one file"），但 TK-014 任务卡中未声明此规范变更。
- **风险**: 规范文档变更未归因到独立任务或显式声明，后续追溯变更来源困难。
- **建议**: 在 TK-014 执行记录中补充 CS-013 规范放宽的说明，或将此变更拆为独立的规范维护提交。

### 2.9 MINOR — tasks.csv TK-014 存在两条追加记录

- **位置**: `.repo-ai-governor/context/dev/project-002-governance-core/sprint-001-process-runtime-and-memory-baseline/tasks/tasks.csv`
- **现象**: TK-014 同时存在 `exec-20260320-041` 和 `exec-20260320-042` 两行，均为 `in_progress` 状态。同一任务同时有两条活跃执行记录。此外 TK-014 的初始 `planned` 行（`exec-20260320-032`）未更新为 `in_progress`。
- **违反**: CS-021（task cards / tasks.csv 必须同步一致，不允许漂移）。
- **建议**: 合并或标注初始行状态变更，确保 TK-014 在 tasks.csv 中状态一致。

### 2.10 MINOR — `ProcessCompiler` 在 `ProcessRuntimeEngine` 构造函数中默认实例化

- **位置**: `packages/core-runtime/src/process-runtime-engine.ts` L72
- **现象**: `constructor(private readonly processCompiler: ProcessCompiler = new ProcessCompiler())` — runtime 默认构造一个新的 `ProcessCompiler` 实例。但架构 §6 第 11 条声明 `core-runtime` 可依赖 `core-process`，依赖方向合规。不过默认实例化意味着 runtime 与 compiler 实例生命周期耦合。
- **当前可接受**: 基线阶段 `ProcessCompiler` 无状态，默认实例化不会导致副作用。
- **建议**: 后续考虑由上层（如 CLI 或编排层）注入已构造的 compiler 实例，避免 runtime 内部隐式构造依赖。

### 2.11 INFO — 跨包相对路径导入为现有仓库惯例

- **位置**: `packages/core-runtime/src/process-runtime-engine.ts` L7、L13；多个 `types/interfaces/*.interface.ts` 文件
- **说明**: `core-runtime` 通过 `../../core-process/src/index.js`、`../../shared/src/index.js`、`../../../../core-process/src/...` 等相对路径引用跨包模块。此做法与 `packages/config/` 和 `packages/core-process/` 中既有惯例一致。启用包级 exports 后需统一迁移。

## 3. 正面确认

以下方面实现与规范文档一致，确认无偏差：

1. **四类控制流节点全覆盖**: `Sequential/Parallel/Loop/Condition` —— 与技术方案 §5.2 完全对齐。
2. **超时双级基线**: `stageTimeoutMs` + `flowTimeoutMs` —— 与技术方案 §5.4 第 2 条的 stage/flow 两级超时对齐（agent 级超时在 adapter 层落地）。
3. **取消语义基线**: 通过 `AbortSignal` 支持外部取消 —— 与技术方案 §5.4 第 1 条对齐。
4. **中断元数据结构化**: `RuntimeExecutionInterruption` 包含 `reason/errorCode/message/timeoutScope` —— 与技术方案 §5.4 第 4 条审计字段对齐。
5. **Loop 双限制落地**: `maxCycles` + `maxWallTimeSeconds` —— 与技术方案 §5.2 第 3 条及 IR 契约一致。
6. **Loop controller 可插拔**: `RuntimeLoopController.shouldContinue()` 支持外部决策注入。
7. **Condition resolver 可插拔**: `RuntimeConditionResolver.resolveConditionKey()` 支持外部条件路由。
8. **Flow 安全阀**: `maxTransitions` 防止无限循环 DAG 耗尽资源。
9. **IR 版本兼容阻断**: 执行前调用 `assertIrVersionCompatibleOrThrow` —— 与 IR 契约 §4.2.2 第 5 条一致。
10. **编译错误阻断**: `compileErrors > 0` 时抛出标准化错误 —— 与 IR 契约 §4.2.2 第 4 条一致。
11. **标准化错误模型**: 全部使用 `RuntimeError`/`GovernorErrorCode` —— 符合 CS-022。
12. **ESM 显式扩展名**: 所有相对导入均使用 `.js` 扩展名 —— 符合 CS-005。
13. **常量集中管理**: `RuntimeExecutionStatus/RuntimeStageStatus/RuntimeTimeoutScope/DEFAULT_*` —— 符合 CS-009。
14. **类型治理**: 对象结构用 `interface`，函数类型用 `type`，分目录管理 —— 符合 CS-011/CS-012/CS-013。
15. **OOP 设计**: `ProcessRuntimeEngine` 封装为类，`RuntimeNowProvider` 为抽象类 —— 符合 CS-017/CS-018。
16. **JSDoc 全覆盖**: 所有导出与私有方法均有 JSDoc —— 符合 CS-016。
17. **文件命名规范**: kebab-case，后缀 `*.interface.ts`/`*.type.ts`/`*.constant.ts`/`*.abstract.ts` —— 符合 CS-013/CS-014。
18. **Smoke 测试覆盖**: 5 个用例覆盖全控制流、stage timeout、flow timeout、cancel、自定义时钟 provider —— 覆盖 TK-014 DoD 基线要求。
19. **依赖方向合规**: `core-runtime` 仅依赖 `core-process` + `shared` —— 与架构 §6 第 11 条允许列表一致。
20. **时钟可扩展**: `RuntimeNowProvider` 抽象类 + `DefaultRuntimeNowProvider` 默认实现 —— 测试用 `DeterministicRuntimeNowProvider` 验证扩展性。
21. **`stageResults` 含完整执行记录**: 每个 stage 记录 `nodeId/stageId/nodeType/status/attempt/startedAt/endedAt/durationMs` 及可选 `output/errorCode/errorMessage`。

## 4. Summary

| 严重度 | 数量 | 阻断交付 |
|---|---|---|
| SEVERE | 1 | 是（§2.1 `formatRfc3339Seconds` 重复实现） |
| MEDIUM | 6 | 否（§2.2-§2.7 为基线阶段可接受的范围限制，建议标注 follow-up） |
| MINOR | 3 | 否 |
| INFO | 1 | 否 |

**结论**: TK-014 核心实现（四类控制流、超时/取消中断、Loop/Condition 可插拔扩展、结构化执行结果）与技术方案 §5.2-§5.5 高度对齐，代码规范符合 `code_standards.md` 适用条款。21 项正面确认全部通过。

**阻断项**: §2.1 `formatRfc3339Seconds` 重复实现违反 CS-010，建议合入前修复（提升到 `packages/shared/src/utils/`）。

**建议 follow-up**: §2.2（Parallel 聚合策略预留）、§2.3（错误分类枚举预留）、§2.4（重试契约预留）、§2.5（取消传播到 stage handler）、§2.6（递归改迭代）、§2.7（Parallel 结果排序声明）可在后续迭代中逐步补齐。§2.8 和 §2.9 建议在合入前一并修复。

## 5. 复核结论（2026-03-20）

- 整体结论：**部分认可**。
- 复核范围：仅基于当前仓库代码、规范文档与门禁脚本证据进行判定。

### 5.1 逐条判定

1. §2.1（`formatRfc3339Seconds` 重复实现）: **部分认可**。
   - 证据成立：`packages/core-process/src/process-compiler.ts` 与 `packages/core-runtime/src/process-runtime-engine.ts` 各自存在同名同实现函数。
   - 调整结论：`SEVERE + 阻断交付 + 违反 CS-010` 结论证据不足。CS-010强调“新增 utility 前做复用评估并记录”，并未直接规定“跨包私有函数重复即阻断”。
   - 建议：降级为维护性改进项，后续在 shared 新增统一时间格式化工具时合并。

2. §2.2（Parallel 仅 allOf）: **认可**（非阻断）。
   - 与技术方案 §5.5 的 `allOf/anyOf/majority` 目标存在差距；当前 README 已明确 baseline 为 `allOf`，可接受。

3. §2.3（错误分类未完整映射）: **认可**（非阻断）。
   - 现阶段 runtime 状态仅 `succeeded/failed/timeout/cancelled`，后续可按策略引擎接入节奏扩展。

4. §2.4（缺少 stage retry 契约）: **认可**（非阻断）。
   - 当前实现以“无自动重试”作为基线语义，建议后续在 runtime options 中补 retry policy 接口。

5. §2.5（取消未传播到 stage handler）: **认可**（非阻断）。
   - 当前仅 flow health 检测 `signal.aborted`，未透传到 stage 上下文，存在可观测的取消响应延迟窗口。

6. §2.6（递归导致栈溢出）: **不认可**。
   - 当前 `executeNode` 为 `async/await` 递归，执行链在 `await` 处释放调用栈，且存在 `maxTransitions` 保护；“1000 层递归必然触发栈溢出”的结论不成立。

7. §2.7（Parallel 共享 runtimeState）: **部分认可**。
   - `stageResults` 写入顺序在并发分支下确实不保证；但这属于可预期并发顺序特性，不构成并发安全缺陷。
   - 建议保留文档说明（顺序不保证）即可。

8. §2.8（CS-013 变更超出 TK-014 范围）: **不认可**。
   - 本次规范调整来自明确用户指令，且不与现有门禁规则冲突；该项不应作为缺陷成立。

9. §2.9（tasks.csv 多条 `in_progress` 记录）: **不认可**。
   - `tasks.csv` 设计为执行记录追加模型，`check-task-ledger-sync.js` 按“同标题最新 canonical row”校验，不要求历史行唯一状态。

10. §2.10（Runtime 默认实例化 ProcessCompiler）: **认可**（建议项）。
    - 该实现当前无功能风险，可在后续编排层注入优化中处理。

11. §2.11（跨包相对路径导入）: **认可**（信息项）。

### 5.2 复核后结论修正

- 阻断项修正：原“1 个阻断项”调整为“**0 个阻断项**”。
- 推荐改进项（后续迭代）：§2.2、§2.3、§2.4、§2.5、§2.7、§2.10。

### 5.3 复核命令与结果

1. `pnpm run typecheck`：通过。
2. `pnpm run test -- process-runtime-engine.smoke.test.ts`：通过（7 files / 21 tests passed）。
3. `pnpm run check`：通过（turbo gate 10/10 successful）。
