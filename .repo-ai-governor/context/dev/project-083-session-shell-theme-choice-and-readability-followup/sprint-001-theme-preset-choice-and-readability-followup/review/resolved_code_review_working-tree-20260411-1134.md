# Code Review: sprint-001-theme-preset-choice-and-readability-followup initial round

- Status: resolved
- Date: 2026-04-11
- Reviewer: AI-Agent
- Task: `CR-001`
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
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/contracts/cli-session-shell-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/module-overview.md`

## 1. Review Scope

1. `apps/cli/src/runtime/interactive-shell/session-slash-command-registry.ts`
2. `apps/cli/src/react-cli/views/session-shell-live-app.tsx`
3. `apps/cli/src/react-cli/views/session-shell-app.tsx`
4. `apps/cli/src/react-cli/views/prompt-bar.tsx`
5. `apps/cli/src/react-cli/views/slash-command-palette.tsx`
6. `apps/cli/test/runtime/session-slash-command-registry.test.ts`
7. `apps/cli/test/runtime/session-shell-ink-controller.test.ts`
8. `apps/cli/test/runtime/session-shell-live-app.test.ts`
9. `apps/cli/test/runtime/session-shell-runner.test.ts`
10. `apps/cli/test/runtime/react-cli-runner.test.ts`
11. `apps/cli/README.md`
12. `docs/local-adoption-playbook.md`
13. `docs/local-adoption-playbook.zh-CN.md`
14. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/contracts/cli-session-shell-contract.md`
15. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/module-overview.md`

## 2. Findings

未发现需要修复的点。

## 3. Notes

1. fresh delegated reviewer `Helmholtz` 已对本轮 scope 返回 explicit clean verdict，未提出 actionable findings。
2. 本轮 review 覆盖了 session shell readability follow-up、`/workspace set-ui-theme` preset-choice discoverability、Enter 接受行为修正，以及相关 docs/spec sync。
3. 当前剩余风险不在 correctness，而在视觉感知差异：不同终端或 IDE 集成壳层里的实际阅读体感仍建议做一次人工 smoke。

## 4. Verification

1. `pnpm exec vitest run apps/cli/test/runtime/session-slash-command-registry.test.ts apps/cli/test/runtime/session-shell-ink-controller.test.ts apps/cli/test/runtime/session-shell-live-app.test.ts apps/cli/test/runtime/session-shell-runner.test.ts apps/cli/test/runtime/react-cli-runner.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
2. `pnpm run build`（通过）

## 处置结果与剩余风险

1. 本轮 delegated CR 已确认当前 sprint scope 没有新的 actionable finding，`CR-001` 可直接收口为 `resolved`。
2. 剩余风险仅为 presenter/readability 变更在真实终端中的主观可读性差异，后续若仍收到“字体太小”的反馈，应明确区分 host font-size 与 shell-side contrast/readability 两类能力边界。
