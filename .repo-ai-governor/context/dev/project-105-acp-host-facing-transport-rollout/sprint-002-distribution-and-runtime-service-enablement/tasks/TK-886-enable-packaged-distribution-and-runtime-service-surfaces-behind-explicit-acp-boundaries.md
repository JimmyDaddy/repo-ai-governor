# TK-886 enable packaged-distribution and runtime-service surfaces behind explicit ACP boundaries

- Status: completed
- Date: 2026-04-15
- Owner: AI-Agent
- Priority: P1
- Project: `project-105-acp-host-facing-transport-rollout`
- Sprint: `sprint-002-distribution-and-runtime-service-enablement`

## 1. 任务目标

启用 packaged distribution 与 runtime-service surfaces，同时保持所有 host-facing enablement 都收口在 explicit ACP boundaries 内。

## 2. Depends On

1. `TK-885`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/acp-host-facing-transport-formalization-and-distribution-boundary.md`

## 3. 预期产物

1. packaged distribution/runtime-service enablement plan
2. ACP boundary guardrails
3. synced task ledger once activation begins

## 4. Required Inputs

1. `.repo-ai-governor/context/dev/project-105-acp-host-facing-transport-rollout/sprint-002-distribution-and-runtime-service-enablement/tasks/TK-885-integrate-connect-doctor-verify-readiness-composition-for-acp-exec-and-host-next-actions.md`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/acp-host-facing-transport-formalization-and-distribution-boundary.md`
3. `.repo-ai-governor/context/dev/project-104-cli-exec-onboarding-adoption-readiness-rollout/plan.md`

## 5. Traceback References

1. `.repo-ai-governor/draft/acp-host-facing-transport-formalization-technical-solution.md`

## 6. 实施计划

1. 将 packaged distribution 与 runtime-service enablement 拆成 ACP-specific implementation surface。
2. 固定 enablement 过程中的 explicit boundary guardrails，避免 transport alias/rewrite。
3. 为 `TK-887` sprint handoff 准备清晰的 delivery boundary。

## 7. Development Verification

1. `pnpm vitest run apps/cli/test/runtime/adapter-routing-runtime.test.ts apps/cli/test/runtime/agent-onboarding-runtime.test.ts apps/cli/test/runtime/adapter-diagnostics-runtime.test.ts apps/cli/test/runtime/adapter-verification-runtime.test.ts`
2. `pnpm run build`
3. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`

## 8. Delivery Verification

1. `node ./scripts/governance/sync-task-ledger.js --tasks-dir ".repo-ai-governor/context/dev/project-105-acp-host-facing-transport-rollout/sprint-002-distribution-and-runtime-service-enablement/tasks"`
2. `node ./scripts/governance/check-task-ledger-sync.js`
3. `node ./scripts/governance/check-sprint-plan-status-sync.js`
4. `node ./scripts/governance/check-code-review-status-sync.js`

## 9. 执行记录

1. 2026-04-14：任务创建，状态初始化为 `planned`。
2. 2026-04-15：已将 packaged-distribution 与 runtime-service evidence 显式收口在 ACP-only boundary。`CliAcpHostProtocol` 现在会读取 host verification summaries 并把 `runtime_service_ready / packaged_distribution_ready` diagnostics 投影到 ACP companion，同时 `CliAdapterVerificationRuntime` 会输出 ACP-specific next-actions，而不会把这些 enablement surfaces 误写成 `cli_exec` 成功路径。当前任务实现完成，进入 `CR-001` fresh reviewer loop。

## 10. 产出

1. ACP evidence projection and boundary guardrails in `apps/cli/src/runtime/{cli-acp-host-protocol,cli-acp-host-evidence-runtime,adapter-routing-runtime,cli-governance-runtime,session-main-supervisor-runtime}.ts`
2. ACP packaged-distribution/runtime-service evidence tests in `apps/cli/test/runtime/adapter-routing-runtime.test.ts`
