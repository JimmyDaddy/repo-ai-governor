# DA-102 sprint-001 出口验收与 sprint-002 输入约束

- Status: active
- Date: 2026-03-24
- Owner: AI-Agent
- Artifact ID: `DA-102`
- Produced By: `TK-098`
- Scope: `project-010-local-model-and-ide-expansion`

## 1. 目的

固化 `project-010 / sprint-001-local-model-adapter-baseline` 的出口验收证据，并冻结 `sprint-002-autonomous-mainchain-foundation` 的正式输入约束，确保 Stage 9 follow-up 继续遵循自动主链优先顺序，而不是回退到 IDE-first 或 delivery-first 扩张路径。

## 2. 当前已成立的 sprint-001 证据

1. `DA-099` 已可检索
   - 本地模型 surface、配置/schema 契约、能力矩阵基线与 CLI route 接线已经冻结。
2. `DA-100` 已可检索
   - `AdapterSurface.OLLAMA` 已具备真实 `probe/invoke`、route fallback、endpoint-first health 语义与受控降级边界。
3. `DA-101` 已可检索
   - `doctor/verify/run` 的本地模型失败归因、`safe_local` 边界说明、restricted-network rehearsal 与 resilience regression 已形成统一证据链。
4. `project-011` 正式 handoff 已可检索
   - `DA-121`、`DA-122`、`DA-123` 与 `project-011-cli-package-decomposition-completion-audit-summary.md` 已形成 sprint-002 的工程边界输入，后续 CLI 主链升级不再默认扩写 legacy god object。

## 3. sprint-001 最终验收结论

1. 当前状态：`accepted`
2. 结论：
   - `TK-095`、`TK-096`、`TK-097` 已全部完成；
   - sprint-001 的 4 条 exit criteria 已满足；
   - `DA-099`~`DA-102` 构成 `project-010` 进入 sprint-002 的正式输入链。
3. 验收要点：
   - 本地模型 adapter 契约、配置与能力语义已冻结；
   - 远端不可达 -> 本地回退路径已具备可审计、可诊断、可回放的最小闭环；
   - `doctor --adapters` / `verify --adapters` / restricted-network rehearsal 已具备稳定证据。
4. 非目标边界：
   - 本地模型 fallback 仍是 Stage 9 当前阶段的降级执行面，不代表已自动满足 `tool_calling` / `structured_output` 的目标能力；
   - `run -> review -> review-verify -> ledger backfill` 的自动主链闭环仍待 sprint-002 收口。

## 4. sprint-002 正式输入约束

1. 执行顺序固定为：
   - `TK-099` 任务驱动 DAG 与 `run` 主链装配
   - `TK-100` review 子链内联与 ledger backfill
   - `TK-101` HITL 决策回执与 `resume/terminate/degrade`
   - `TK-102` sprint-002 出口验收与 sprint-003 输入约束
2. sprint-002 必须消费 `project-011` 已完成 handoff：
   - `DA-121`
   - `DA-122`
   - `DA-123`
   - `project-011-cli-package-decomposition-completion-audit-summary.md`
3. 后续 CLI 主链升级必须优先落在已拆分边界：
   - `apps/cli/src/commands/*`
   - `apps/cli/src/runtime/*`
   - `apps/cli/src/runtime/artifacts/*`
   - `apps/cli/src/runtime/presentation/*`
   不得默认继续向 `apps/cli/src/cli-governance-runtime.ts` 叠加新责任。
4. 诊断与受限网络语义必须复用 sprint-001 已冻结契约：
   - adapter failure bucket 继续复用 `environment_precondition / configuration_missing / model_unavailable / capability_gap`
   - rehearsal 参数继续复用 `restrictedNetwork / restrictedReason / allowLocalFallback`
   - 不得为本地模型路径新增平行 `nextAction` / `safe_local` 词汇体系
5. `delivery rehearsal`、`blackbox/GA metrics` 与 `IDE official surfaces` 继续顺延到 sprint-003，不得与 sprint-002 的自动主链收口并行打架。

## 5. 最终结论

1. 当前状态：`accepted`
2. 结论：`project-010 / sprint-001` 已完成本地模型与受限网络基线收口，`DA-102` 现作为 `sprint-002-autonomous-mainchain-foundation` 的唯一入口约束文档。
3. 验证证据：
   - `node ./scripts/governance/check-task-ledger-sync.js`
   - `node ./scripts/governance/check-sprint-plan-status-sync.js`
   - `node ./scripts/governance/check-code-review-status-sync.js`
   - `node ./scripts/governance/check-artifact-registry-lifecycle.js`
   - `pnpm run check`
