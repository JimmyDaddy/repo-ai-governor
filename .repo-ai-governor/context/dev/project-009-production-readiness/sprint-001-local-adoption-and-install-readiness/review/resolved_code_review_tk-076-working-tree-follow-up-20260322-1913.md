# Code Review: TK-076 working tree follow-up

- Status: resolved
- Date: 2026-03-22
- Reviewer: AI-Agent
- Task: `TK-076`
- Review Type: working tree review
- Normative References:
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`

## 1. Review Scope
1. `apps/cli/src/main.ts`
2. `apps/cli/src/cli-governance-runtime.ts`
3. `apps/cli/src/constants/cli-governance-runtime.constant.ts`
4. `apps/cli/src/constants/cli-output.constant.ts`
5. `apps/cli/src/types/interfaces/cli-runtime-debug.interface.ts`
6. `apps/cli/src/types/interfaces/index.ts`
7. `apps/cli/src/types/index.ts`
8. `apps/cli/test/cli-governance-runtime.integration.test.ts`
9. `apps/cli/README.md`
10. `packages/shared/src/i18n/locales/en-us.ts`
11. `packages/shared/src/i18n/locales/zh-cn.ts`
12. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/tasks/TK-076-local-debug-trace-replay-and-diagnostics-baseline.md`
13. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/tasks/DA-088-local-debug-trace-replay-and-diagnostics-baseline.md`
14. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/tasks/checklist.md`
15. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/tasks/tasks.csv`
16. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/plan.md`
17. `.repo-ai-governor/context/dev/project-009-production-readiness/plan.md`
18. `.repo-ai-governor/context/artifact-registry/artifacts.csv`

## 2. Findings
### 2.1 [P1] Policy-gated `run` failures discard the new diagnostics contract from CLI output
- 位置: `apps/cli/src/main.ts:563`
- 问题描述: `executeRunCommand()` now persists `reportPath` / `replayPath` and, for HITL-required outcomes, a `pendingStatus` before throwing (`apps/cli/src/cli-governance-runtime.ts:1719`). But `buildErrorOutputPayload()` drops all structured error details and `resolveErrorGuidance()` falls back to the generic `report_issue` guidance for both `POLICY_GATE_EVALUATION_FAILED` and `POLICY_GATE_HITL_FEEDBACK_INVALID`. In practice, the exact runs that most need diagnostics surface neither the artifact paths nor an actionable next step.
- 影响: blocked / confirm / escalate runs become hard to debug and impossible to branch on reliably from automation, even though the command has already generated the diagnostic artifacts that Stage 9B is supposed to consume.
- 建议: extend the error payload with selected structured fields (`report_path`, `replay_path`, `pending_status`) and add explicit guidance mapping for policy-gated and replay-input errors instead of routing them to the generic `report_issue`.

### 2.2 [P2] `review-verify` never drains the queued request, so repeated runs duplicate verify/backfill artifacts
- 位置: `apps/cli/src/cli-governance-runtime.ts:946`
- 问题描述: `collectQueuedReviewRequestArtifacts()` only selects request artifacts whose payload still says `status=queued`, and `executeReviewVerifyCommand()` writes a verify result plus a pending ledger-backfill artifact but never mutates or archives the source request. The same request therefore remains eligible forever, so rerunning `review-verify` creates another `review-verify-*.json` and another pending ledger-backfill record for the same source request.
- 影响: downstream ledger-backfill consumers can receive duplicate work items for a single review request, which risks duplicate checklist/CSV backfill and ambiguous attribution during rehearsal or retry flows.
- 建议: mark the request artifact as consumed after verification, or move it out of the queued set once a verify/backfill pair has been emitted.

## 3. Notes
1. Current integration tests cover the happy path for trace/replay and the source-pin fix for `review-verify`, but they do not assert CLI error payload contents for policy-gated runs or idempotency/drain semantics for repeated `review-verify`.
2. The active sprint already contains `resolved_code_review_tk-076-local-debug-trace-replay-and-diagnostics-baseline.md`; this follow-up report stays `review_pending` because the above cases are still actionable.

## 4. Verification
1. `pnpm vitest run --config vitest.packages.config.ts apps/cli/test --maxWorkers=1 --maxConcurrency=1`（通过）
2. `pnpm run typecheck`（通过）
3. `pnpm run check`（通过）

## 复核结论（2026-03-22）

- 整体结论：**认可**

### 逐条复核

1. `2.1 [P1] Policy-gated run failures discard diagnostics`
   - 判定：**认可**
   - 证据：`packages/shared/src/errors/governor-error.ts` 已透传 `details`；`apps/cli/src/main.ts` 为错误输出新增 `error_details`（`report_path/replay_path/pending_status`）并为 `POLICY_GATE_*`、`REPORT_REPLAY_INPUT_INVALID` 增加专用 `next_action` 映射；`apps/cli/src/cli-output-presenter.ts` 已在 plain/pretty 输出保留该信息。
   - 处理：进入修复执行，补充 CLI 输出契约回归测试。

2. `2.2 [P2] review-verify queue not drained`
   - 判定：**认可**
   - 证据：`apps/cli/src/cli-governance-runtime.ts` 在 `review-verify` 成功后回写源 request 为 `status=verified` 并记录 `consumedByVerifyId`，不再满足 queued 选择条件；`apps/cli/test/cli-governance-runtime.integration.test.ts` 已覆盖“二次 review-verify 会失败且不产生重复 backfill”。
   - 处理：进入修复执行，补充重复执行回归断言。

### 验证命令

1. `pnpm vitest run --config vitest.packages.config.ts apps/cli/test --maxWorkers=1 --maxConcurrency=1`（通过）
2. `pnpm run typecheck`（通过）

## 修复执行记录（2026-03-22）

1. `2.1 [P1]`：已完成
   - 变更文件：`packages/shared/src/types/interfaces/standardized-error.interface.ts`、`packages/shared/src/errors/governor-error.ts`、`apps/cli/src/main.ts`、`apps/cli/src/types/interfaces/cli-output.interface.ts`、`apps/cli/src/constants/cli-output.constant.ts`、`apps/cli/src/cli-output-presenter.ts`、`apps/cli/test/cli-output-contract.integration.test.ts`
   - 验证：`pnpm vitest run --config vitest.packages.config.ts apps/cli/test --maxWorkers=1 --maxConcurrency=1`（通过）
   - 说明：policy/replay 错误路径已输出结构化诊断字段并映射到专用 next_action，满足自动化分支与人工排障可读性需求。

2. `2.2 [P2]`：已完成
   - 变更文件：`apps/cli/src/cli-governance-runtime.ts`、`apps/cli/test/cli-governance-runtime.integration.test.ts`
   - 验证：`pnpm vitest run --config vitest.packages.config.ts apps/cli/test --maxWorkers=1 --maxConcurrency=1`（通过）
   - 说明：`review-verify` 会消费 queued request 并回写消费元数据；重复执行不会再产生重复 verify/backfill。

3. 综合回归：已完成
   - 变更文件：`apps/cli/**`、`packages/shared/**`
   - 验证：`pnpm run typecheck`、`pnpm run check`（通过）
   - 说明：类型契约与 CLI 输出契约保持兼容，新增字段均为可选扩展。
