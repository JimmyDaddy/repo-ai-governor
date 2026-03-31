# Code Review: tk-457 tk-458 session-main runtime rollout closeout

- Status: resolved
- Date: 2026-03-31
- Reviewer: AI-Agent
- Task: `TK-457` + `TK-458`
- Review Type: working tree review
- Normative References:
  - `AGENTS.md`
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/module-overview.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/contracts/cli-session-shell-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/adrs/session-first-shell-and-service-owned-session-state.md`

## 1. Review Scope

1. `apps/cli/test/runtime/session-main-parity.integration.test.ts`
2. `apps/cli/test/runtime/session-shell-runner.test.ts`
3. `apps/cli/test/runtime/orchestration-service-runtime.test.ts`
4. `packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts`
5. `.repo-ai-governor/context/dev/project-033-session-main-agent-runtime-productization/**`

## 2. Findings

未发现需要修复的点。

## 3. Notes

1. 新增的 parity integration regression 解决了一个之前只靠分散 unit test 间接覆盖的证据缺口：它直接验证了真实 service-backed `session.main` turn 经 consumer-facing runtime 暴露出的 payload contract。
2. CLI resume parity 现在也有了明确回归：第二次附着同一 session 时，session shell 会重放同一条 canonical command recap / backlink truth，并单独追加 `SESSION_RESUMED` notice，而不是生成另一套 presenter 私有状态。
3. desktop baseline 仍保持 contract-level 约束：future desktop 只需要消费同一份 `orchestration-service-client` session DTO / event payload，无需复制 CLI 内存态或自造 transcript owner。

## 4. Verification

1. `pnpm exec vitest run apps/cli/test/runtime/session-main-parity.integration.test.ts apps/cli/test/runtime/session-shell-runner.test.ts apps/cli/test/runtime/orchestration-service-runtime.test.ts packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
2. `pnpm run build`（通过）
3. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
4. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
5. `node ./scripts/governance/check-code-review-status-sync.js`（通过）
