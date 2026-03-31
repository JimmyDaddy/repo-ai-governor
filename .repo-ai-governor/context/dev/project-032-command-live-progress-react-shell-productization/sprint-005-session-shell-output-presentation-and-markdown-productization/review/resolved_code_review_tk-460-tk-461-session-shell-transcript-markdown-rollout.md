# Code Review: tk-460 tk-461 session-shell transcript markdown rollout

- Status: resolved
- Date: 2026-03-31
- Reviewer: AI-Agent
- Task: `TK-460` + `TK-461`
- Review Type: working tree review
- Normative References:
  - `AGENTS.md`
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/contracts/cli-session-shell-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/adrs/structured-session-output-and-markdown-content-blocks.md`

## 1. Review Scope

1. `apps/cli/src/types/interfaces/cli-session-shell.interface.ts`
2. `apps/cli/src/runtime/interactive-shell/session-shell-transcript-store.ts`
3. `apps/cli/src/runtime/interactive-shell/session-shell-runner.ts`
4. `apps/cli/src/react-cli/views/transcript-pane.tsx`
5. `apps/cli/test/runtime/session-shell-transcript-store.test.ts`
6. `apps/cli/test/runtime/react-cli-runner.test.ts`
7. `apps/cli/test/runtime/session-shell-runner.test.ts`
8. `apps/cli/test/cli-output-contract.integration.test.ts`
9. `.repo-ai-governor/context/dev/project-032-command-live-progress-react-shell-productization/**`

## 2. Findings

未发现需要修复的点。

## 3. Notes

1. 本轮实现采用兼容式 contract 升级：保留 `lines[]` 以维持既有 history/search seam，同时新增 `renderKind`、`markdownSource` 与 structured `backlinks`，降低回归面。
2. assistant completed answer 仅进入 transcript markdown presenter path；live running progress 仍停留在 running dock，没有退化成 append-only transcript 日志。
3. `command_recap` 与 `system_notice` 已从单一纯文本行模型中拆出，但 `stderr-only` live UI 与最终 `stdout` machine-readable contract 保持不变。

## 4. Verification

1. `pnpm exec vitest run apps/cli/test/runtime/session-shell-transcript-store.test.ts apps/cli/test/runtime/react-cli-runner.test.ts`（通过）
2. `pnpm exec vitest run apps/cli/test/runtime/session-shell-runner.test.ts apps/cli/test/cli-output-contract.integration.test.ts`（通过）
3. `pnpm run build`（通过）
4. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
5. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
6. `node ./scripts/governance/check-code-review-status-sync.js`（通过）
7. `node ./scripts/governance/check-technical-solution-lifecycle-registry.js`（通过）
8. `node ./scripts/governance/check-technical-solution-delivery-registry.js`（通过）
9. `node ./scripts/governance/check-artifact-registry-lifecycle.js`（通过）
10. `pnpm run check`（通过）
