# DA-088 本地调试（dry-run/trace/replay）与诊断输出基线

- Status: active
- Date: 2026-03-22
- Producer Task: `TK-076`
- Project: `project-009-production-readiness`
- Sprint: `sprint-001-local-adoption-and-install-readiness`

## 1. 目标

建立可直接执行的本地调试链路，使 `run` 在不修改核心业务契约的前提下支持：

1. `--dry-run`：标记本地调试执行语义并输出可复盘证据。
2. `--trace`：输出分层诊断 trace artifact，包含关键事件、阶段耗时、策略依据、错误上下文与下一步建议。
3. `--replay <path>`：从既有 `report/replay` 产物回放诊断结果，支持复现定位与二次解释。

## 2. 命令与行为边界

1. `run --dry-run`
   - 仍执行 `compiler -> runtime -> policy -> audit -> report/replay` 链路，保证行为可验证。
   - 在 stage output 与诊断产物中显式标记 `dryRun=true`。
2. `run --trace`
   - 额外输出 `context/diagnostics/trace/<execution_id>.trace.json`。
3. `run --replay <path>`
   - 支持输入 `execution report` 或 `replay explain` 两类 JSON 产物。
   - 输出 `context/diagnostics/replay/replay-diagnostics-*.json`；`--trace` 同时输出 replay trace。

## 3. 诊断输出分层

1. 摘要层
   - `executionId/executionSessionId/runtimeStatus/policyOutcome/riskLevel/rootCause`。
2. 关键事件层
   - `compile`、每个 stage 事件、`policy`、`report_replay_persisted`。
3. 阶段耗时层
   - 每个 stage 的 `startedAt/endedAt/durationMs/status`。
4. 策略依据层
   - `policyOutcome/matchedRuleIds/matchedPolicies/riskReasons`。
5. adapter 调用摘要
   - `stageId/nodeId/handledBy/routeKey`。
6. 错误上下文
   - stage 错误列表 + runtime interruption。
7. 下一步建议
   - 基于 root-cause 分类输出可执行的排障动作。

## 4. review 链路归因字段

1. `review` 产物新增 `diagnosticContext`：
   - `correlationId`
   - `queueStage=review`
   - `chain=review->review-verify->ledger-backfill`
2. `review-verify` 产物新增：
   - `ledgerBackfillPath`
   - `diagnosticAttribution.{correlationId,chain,chainStep}`
3. `ledger-backfill` 新产物：
   - 路径：`context/ledger-backfill/review-verify/<verify_id>.json`
   - 状态：`pending`
   - 归因：`review->review-verify->ledger-backfill`

## 5. 复现定位模板（建议流程）

1. 复现
   - 执行 `run --dry-run --trace`，保留 `report/replay/trace` 路径。
2. 定位
   - 先看 `summary + policyDecision`，再看 `stageTimings + errorContext`。
3. 修复验证
   - 修复后重跑 `run --trace`。
   - 必要时执行 `run --replay <report-or-replay-path>` 对比前后 explain 输出。

## 6. 适用场景映射

1. 本地安装/clean-room 复现：通过 replay 复盘跨环境差异。
2. 只读接入预检：通过 trace 看环境前置是否满足。
3. workspace 切换回滚：通过 trace/replay 复盘切换前后策略与阶段差异。
4. provider/mock 切换：通过 adapter invocation summary 对比调用落点。
5. `review -> review-verify -> ledger backfill`：通过 correlationId 串联全过程。
