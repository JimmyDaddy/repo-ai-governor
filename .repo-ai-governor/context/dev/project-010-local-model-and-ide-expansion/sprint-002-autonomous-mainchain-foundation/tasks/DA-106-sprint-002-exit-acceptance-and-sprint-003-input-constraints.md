# DA-106 sprint-002 出口验收与 sprint-003 输入约束

- Status: active
- Date: 2026-03-24
- Owner: AI-Agent
- Artifact ID: `DA-106`
- Produced By: `TK-102`
- Scope: `project-010-local-model-and-ide-expansion`

## 1. 目的

汇总 `sprint-002-autonomous-mainchain-foundation` 的已交付证据，给出当前阶段的出口验收判断，并冻结 `sprint-003-delivery-ide-and-ga-hardening` 的输入约束，避免后续 delivery / blackbox / IDE 面继续偏离 Stage 9 收口主线。

## 2. 当前已成立的输入证据

1. `DA-103`：task-driven `run` 主链装配基线已完成。
2. `DA-104`：inline review chain 与 managed ledger backfill 已接入自动主链。
3. `DA-105`：HITL decision receipt 与 `resume/terminate/degrade` 运行时语义已完成。
4. `project-011` handoff 仍有效：
   - `DA-121`
   - `DA-122`
   - `DA-123`
   - `project-011-cli-package-decomposition-completion-audit-summary.md`

## 3. 当前出口判断（最终）

1. `run` task-driven assembly：`accept`
2. `review -> review-verify -> ledger backfill` inline subchain：`accept`
3. HITL decision receipt 与恢复执行语义：`accept`
4. sprint-002 总体出口结论：`accept`

说明：
当前 `TK-099`、`TK-100`、`TK-101` 已全部完成，且相关门禁证据已经回链到 `DA-103`、`DA-104`、`DA-105`。本任务已完成 sprint-002 出口结论与 sprint-003 输入冻结，可将后续主执行流切换到 `sprint-003-delivery-ide-and-ga-hardening`。

## 4. sprint-003 输入约束（冻结草案）

1. `TK-107` delivery rehearsal 只能建立在现有 HITL / audit / replay 同链事实之上，不得新增平行 delivery 审计链。
2. `TK-108` blackbox/GA 指标必须覆盖：
   - provider outage
   - restricted network
   - retry exhaustion
   - `approve/resume`
   - `reject/terminate`
   - `revise/degrade`
3. `TK-109`~`TK-111` IDE surface 扩张不得回退到扩写 `apps/cli/src/cli-governance-runtime.ts` 的旧路径，必须继续遵循 `project-011` 已冻结的 decomposition 边界。
4. sprint-003 所有 rollout 工作都必须继续消费 `DA-103`、`DA-104`、`DA-105` 作为自动主链与 HITL 事实契约。

## 5. 最终结论

1. sprint-002 当前结论：`accepted`
2. 准入条件：`TK-107` 可作为 sprint-003 的第一个执行任务启动。
3. 后续要求：sprint-003 必须继续消费 `DA-103`、`DA-104`、`DA-105`、`DA-106`，不得绕开已冻结的自动主链、HITL 与 decomposition 边界。
