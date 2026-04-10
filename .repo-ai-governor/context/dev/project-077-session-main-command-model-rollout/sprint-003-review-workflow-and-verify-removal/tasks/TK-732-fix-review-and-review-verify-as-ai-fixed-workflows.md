# TK-732 fix `/review` and `/review verify` as AI fixed workflows

- Status: completed
- Date: 2026-04-10
- Owner: AI-Agent
- Priority: P0
- Project: `project-077-session-main-command-model-rollout`
- Sprint: `sprint-003-review-workflow-and-verify-removal`

## 1. 任务目标

把 `/review` 与 `/review verify` 的 capability model、routing、presenter copy 与 help 文案统一为 AI fixed workflow，同时保留 `@reviewer` raw expert surface。

## 2. Depends On

1. `TK-731`
2. `packages/core-orchestration-service/src/local-orchestration-service-session-main-capability-catalog.ts`
3. `apps/cli/src/runtime/session-main-supervisor-runtime.ts`

## 3. 预期产物

1. review workflow interaction-model cutover
2. raw `@reviewer` bypass preserved
3. review workflow tests

## 4. Required Inputs

1. `packages/core-orchestration-service/src/local-orchestration-service-session-main-capability-catalog.ts`
2. `packages/core-orchestration-service/src/local-orchestration-service-session-main-skill-registry.ts`
3. `apps/cli/src/runtime/session-main-supervisor-runtime.ts`

## 5. Traceback References

1. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-orchestration/adrs/session-main-prompt-first-command-model-and-deterministic-workflow-split.md`
2. `TK-731`

## 6. 实施计划

1. 收紧 review-related capability metadata 与 routing 语义。
2. 明确 `review verify` 属于复核既有 CR 报告 / artifact / fix result 的固定工作流。
3. 为 `@reviewer` 显式保留 raw role collaboration path。

## 7. Development Verification

1. `pnpm run build`
2. `pnpm vitest packages/core-orchestration-service apps/cli/test/commands/review-command.test.ts apps/cli/test/commands/review-verify-command.test.ts --run`

## 8. Delivery Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 9. 执行记录

1. 2026-04-10：任务创建，状态初始化为 `planned`。
2. 2026-04-10：将 `REVIEW` / `REVIEW_VERIFY` capability metadata 固化为 `ai_fixed_workflow`，并把 slash registry、dispatcher、skill routing 与 session supervisor 的 direct-execute 语义对齐。
3. 2026-04-10：明确自然语言 review 请求走 governed review workflow，不再隐式降级到 raw `@reviewer`；显式 `@reviewer` 入口继续保留给 expert/raw collaboration。
4. 2026-04-10：补齐 review/review-verify 相关 runtime、parity、slash registry 与 command tests，并完成 build / package / integration 验证。

## 10. 产出

1. 已完成：review workflow interaction-model cutover
2. 已完成：review workflow tests
