# Code Review: sprint-001 acp host-facing transport rollout clean recheck

- Status: resolved
- Date: 2026-04-15
- Reviewer: AI-Agent
- Task: `CR-009`
- Review Type: working tree review
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
  - `.codex/skills/workspace-code-review-workflow/SKILL.md`

## 1. Review Scope
1. `apps/cli/src/runtime/cli-acp-host-protocol.ts`
2. `apps/cli/src/runtime/adapter-routing-runtime.ts`
3. `apps/cli/src/cli-governance-runtime.ts`
4. `apps/cli/src/runtime/session-main-supervisor-runtime.ts`
5. `apps/cli/src/runtime/agent-onboarding-runtime.ts`
6. `apps/cli/src/runtime/agent-projection-runtime.ts`
7. `apps/cli/src/runtime/local-model-probe-runtime.ts`
8. `apps/cli/src/runtime/session-main-provider-continuation-runtime.ts`
9. `apps/cli/src/constants/cli-acp-host.constant.ts`
10. `apps/cli/test/runtime/adapter-routing-runtime.test.ts`
11. `apps/cli/test/runtime/adapter-verification-runtime.test.ts`
12. `apps/cli/test/runtime/agent-onboarding-runtime.test.ts`
13. `apps/cli/test/runtime/agent-projection-runtime.test.ts`
14. `apps/cli/test/runtime/session-main-provider-continuation-runtime.test.ts`
15. `apps/cli/test/runtime/session-main-supervisor-runtime.test.ts`
16. `packages/config/test/config.unit.test.ts`
17. `packages/core-agent-projection/src/agent-projection-service.ts`
18. `packages/core-agent-projection/src/index.ts`
19. `packages/core-agent-projection/src/types/index.ts`
20. `packages/core-agent-projection/src/types/interfaces/agent-projection.interface.ts`
21. `packages/core-agent-projection/src/types/interfaces/index.ts`
22. `packages/core-agent-projection/test/agent-projection-service.unit.test.ts`
23. `packages/shared/src/constants/adapter-runtime.constant.ts`

## 2. Findings
未发现需要修复的点。

## 3. Notes
1. 最新 fresh reviewer round 已明确确认 `CR-008` 修复后的 sprint-001 working tree 在当前 boundary 内无剩余 actionable finding。
2. 剩余风险只限于未来 scope 扩张时重新审视 ACP end-to-end path；这不阻塞当前 sprint closeout。

## 4. Verification
1. `pnpm exec vitest run apps/cli/test/runtime/agent-onboarding-runtime.test.ts apps/cli/test/runtime/adapter-routing-runtime.test.ts apps/cli/test/runtime/adapter-verification-runtime.test.ts apps/cli/test/runtime/agent-projection-runtime.test.ts apps/cli/test/runtime/session-main-provider-continuation-runtime.test.ts apps/cli/test/runtime/session-main-supervisor-runtime.test.ts packages/config/test/config.unit.test.ts packages/core-agent-projection/test/agent-projection-service.unit.test.ts`（通过）
2. `pnpm run build`（通过）
3. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）

## 处置结果与剩余风险（2026-04-15）

1. `CR-009` 作为 sprint-001 的最新 fresh clean recheck，已确认本 boundary 内无剩余 actionable finding。
2. 当前 round 不要求新增 post-fix rerun；若后续 closeout 前再引入代码改动，应重新开 fresh reviewer round。
