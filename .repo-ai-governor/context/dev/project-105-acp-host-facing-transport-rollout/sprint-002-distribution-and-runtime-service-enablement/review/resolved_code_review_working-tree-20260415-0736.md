# Code Review: sprint-002 distribution and runtime-service enablement clean recheck

- Status: resolved
- Date: 2026-04-15
- Reviewer: AI-Agent
- Task: `CR-002`
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
2. `apps/cli/src/runtime/cli-acp-host-evidence-runtime.ts`
3. `apps/cli/src/runtime/cli-acp-host-companion-runtime.ts`
4. `apps/cli/src/runtime/agent-onboarding-runtime.ts`
5. `apps/cli/src/runtime/adapter-diagnostics-runtime.ts`
6. `apps/cli/src/runtime/adapter-verification-runtime.ts`
7. `apps/cli/src/runtime/adapter-routing-runtime.ts`
8. `apps/cli/src/cli-governance-runtime.ts`
9. `apps/cli/src/runtime/session-main-supervisor-runtime.ts`
10. `apps/cli/test/runtime/adapter-routing-runtime.test.ts`
11. `apps/cli/test/runtime/agent-onboarding-runtime.test.ts`
12. `apps/cli/test/runtime/adapter-diagnostics-runtime.test.ts`
13. `apps/cli/test/runtime/adapter-verification-runtime.test.ts`

## 2. Findings
未发现需要修复的点。

## 3. Notes
1. 最新 fresh reviewer round 已确认 CR-001 的路径修复已经把 ACP evidence search root 与真实 repo-local artifact 布局重新对齐。
2. 剩余风险仅限 `runAcpCleanRoomVerify` completion signal 尚待 `sprint-003` 正式落账；这属于下一个 sprint 的 planned work，不阻塞当前 sprint-002 closeout。

## 4. Verification
1. `pnpm vitest run apps/cli/test/runtime/adapter-routing-runtime.test.ts apps/cli/test/runtime/agent-onboarding-runtime.test.ts apps/cli/test/runtime/adapter-diagnostics-runtime.test.ts apps/cli/test/runtime/adapter-verification-runtime.test.ts`（通过）
2. `pnpm run build`（通过）
3. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）

## 处置结果与剩余风险（2026-04-15）

1. `CR-002` 作为 sprint-002 的最新 fresh clean recheck，已确认当前 boundary 内无剩余 actionable finding。
2. 当前 round 不需要新增 post-fix rerun；若 sprint-002 closeout 前再引入代码改动，必须重新开 fresh reviewer round。
