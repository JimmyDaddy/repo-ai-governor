# TK-665 implement adapter probe outcome classification and presenter-safe diagnostics alignment

- Status: completed
- Date: 2026-04-08
- Owner: `AI-Agent`
- Priority: `P0`
- Project: `project-062-cli-continuity-and-adapter-truthfulness-hardening`
- Sprint: `sprint-002-adapter-probe-verify-truth-source-alignment`

## 1. 任务目标

实现 adapter probe outcome classification 与 presenter-safe diagnostics alignment，减少 readiness false negative 和误导性失败提示。

## 2. Depends On

1. `TK-664`
2. 当前 multi-adapter onboarding / verify path

## 3. 预期产物

1. outcome classification implementation
2. presenter alignment
3. cross-adapter diagnostics refresh

## 4. Required Inputs

1. `.repo-ai-governor/context/dev/project-062-cli-continuity-and-adapter-truthfulness-hardening/sprint-002-adapter-probe-verify-truth-source-alignment/tasks/TK-664-freeze-connect-doctor-verify-transcript-truth-source-contract.md`
2. `.repo-ai-governor/context/dev/project-053-real-adapter-invocation-productization/plan.md`
3. `.repo-ai-governor/context/dev/project-059-cli-provider-continuity-fallback-truthfulness/plan.md`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-052-adopter-truthfulness-and-ga-closeout/plan.md`
2. `.repo-ai-governor/draft/repo-ai-governor-current-surface-gap-guide-project-sprint-task-decomposition.md`

## 6. 实施计划

1. 把 `TK-664` 的 outcome taxonomy 落到 probe / verify / transcript presenter path。
2. 对齐 readiness false negative、degrade path 与 success-with-fallback semantics。
3. 准备 evidence refresh 输入交给 `TK-666`。

## 7. Development Verification

1. cross-adapter probe rehearsal
2. presenter snapshot comparison

## 8. Delivery Verification

1. targeted adapter verification regression
2. `pnpm run build`

## 9. 执行记录

1. 2026-04-08：任务创建，状态初始化为 `planned`。
2. 2026-04-08：已将 `verify` 的 `tool_matrix` 拆分为 tool-level `availability_status` 与 role-level `binding_status`，避免 fallback/degraded route judgment 覆盖 probe snapshot 的真实 availability。
3. 2026-04-08：已补齐 unit + diagnostics artifact integration regression，确认 `fallback` 路径下仍保留 `available` tool truth，同时对外单独暴露 `warn` binding judgment，任务切换为 `completed`。

## 10. 产出

1. `apps/cli/src/runtime/agent-onboarding-runtime.ts`
2. `apps/cli/test/runtime/agent-onboarding-runtime.test.ts`
3. `apps/cli/test/cli-governance-runtime.integration.test.ts`
