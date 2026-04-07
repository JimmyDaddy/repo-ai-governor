# Code Review: sprint-001-claude-code-real-invocation-baseline round 1

- Status: resolved
- Date: 2026-04-07
- Reviewer: Harvey delegated reviewer, verified by AI-Agent
- Task: `CR-001`
- Review Type: sprint scoped delegated review
- Normative References:
  - `AGENTS.md`
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/cr-lifecycle-threshold-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/task-ledger-single-write-source-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/execution-gate-layering-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`

## 1. Review Scope

1. `packages/adapters/claude-code/src/claude-code-agent-adapter.ts`
2. `packages/adapters/claude-code/test/claude-code-agent-adapter.smoke.test.ts`
3. `apps/cli/src/runtime/agent-onboarding-runtime.ts`
4. `apps/cli/test/runtime/agent-onboarding-runtime.test.ts`
5. `docs/support-matrix.md`
6. `docs/support-matrix.zh-CN.md`
7. `docs/local-adoption-playbook.md`
8. `docs/local-adoption-playbook.zh-CN.md`
9. `.repo-ai-governor/context/dev/project-053-real-adapter-invocation-productization/sprint-001-claude-code-real-invocation-baseline/tasks/`

## 2. Findings

未发现需要修复的 actionable finding。

## 3. Notes

1. `claude-code` 的公开口径已收紧为 `Real-path available (environment-gated)`，本轮未发现把当前证据粉饰成“默认全绿可用”的问题。
2. `pnpm run check` 在本窗口尝试了两次，但两次失败都发生在 review surface 外的并发测试噪音上；本轮将其记录为 residual verification note，而不是当前 sprint 的 blocking finding。

## 4. Verification

1. `pnpm run build`（通过）
2. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）
3. `pnpm run test:integration -- --maxWorkers=1 --maxConcurrency=1`（通过）
4. `pnpm run check`（失败；两次均因 review surface 外的 package-wide 并发测试噪音）
5. `pnpm vitest run apps/cli/test/runtime/orchestration-service-runtime.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
6. `pnpm vitest run packages/core-orchestration-service/test/local-orchestration-service-sidecar-client.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
7. `pnpm vitest run packages/adapters/codex/test/codex-agent-adapter.smoke.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）

## 复核结论（2026-04-07）

- 整体结论：**clean**
- 说明：fresh reviewer round 1 未发现当前 sprint review surface 内的 actionable finding；`CR-001` 可直接收口为 `resolved`。

## 处置结果与剩余风险（2026-04-07）

1. `CR-001` clean 收口，无 accepted / deferred finding。
2. full-profile `pnpm run check` 的并发测试噪音仍值得在后续交付窗口继续跟踪，但本轮没有证据表明它来自 `project-053 / sprint-001` 的边界改动。
