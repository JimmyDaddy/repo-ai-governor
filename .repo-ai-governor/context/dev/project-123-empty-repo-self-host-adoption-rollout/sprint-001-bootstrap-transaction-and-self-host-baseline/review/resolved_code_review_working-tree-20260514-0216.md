# Code Review: sprint-001 post-fix recheck round 3

- Status: resolved
- Date: 2026-05-14
- Reviewer: AI-Agent
- Task: `CR-003`
- Review Type: working tree review
- Normative References:
  - `AGENTS.md`
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/cr-lifecycle-threshold-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/execution-gate-layering-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/task-ledger-single-write-source-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`

## 1. Review Scope
1. `packages/config/src/default-governor-config.ts`
2. `packages/config/src/index.ts`
3. `packages/standards/package.json`
4. `packages/standards/src/self-host-governor-config.ts`
5. `packages/standards/src/built-in-adoption-pack-catalog.ts`
6. `apps/cli/src/main.ts`
7. `apps/cli/src/cli-governance-runtime.ts`
8. `apps/cli/src/runtime/adoption-pack-bootstrap-runtime.ts`
9. `apps/cli/test/adopt-command.integration.test.ts`

## 2. Findings
未发现需要修复的点。

## 3. Notes
1. 当前仍缺少针对 self-host first-run `run --dry-run --trace` 的显式回归；这项残余风险已留给后续 activation/readiness 与 clean-room sprint 继续补齐。
2. `renderGovernorConfigContent()` 目前仍不会序列化可选的 `workspace.toolManagedRoot/repoLocalRoot` 字段，但本轮 self-host bootstrap/runtime 调用面并未依赖该能力，因此暂不构成阻断。

## 4. Verification
1. `pnpm vitest run apps/cli/test/adopt-command.integration.test.ts`（通过）
2. `pnpm vitest run apps/cli/test/cli-output-contract.integration.test.ts apps/cli/test/connect-phase2.integration.test.ts`（通过）
3. `pnpm run build`（通过）
4. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
5. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
6. `node ./scripts/governance/check-code-review-status-sync.js`（通过）
