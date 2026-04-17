# Code Review: sprint-001 phase-d onboarding cutover round 1

- Status: resolved
- Date: 2026-04-17
- Reviewer: AI-Agent
- Task: `CR-001`
- Review Type: sprint boundary review
- Normative References:
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/cr-lifecycle-threshold-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/task-ledger-single-write-source-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/execution-gate-layering-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/vscode-governance-workbench-surface-contract.md`

## 1. Review Scope

1. `apps/vscode-extension/src/runtime/vscode-extension-host.ts`
2. `apps/vscode-extension/test/vscode-extension-host.activation.test.ts`
3. `.repo-ai-governor/context/current-context.md`
4. `.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/plan.md`
5. `.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-001-phase-d-onboarding-cutover/plan.md`
6. `.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-001-phase-d-onboarding-cutover/tasks/**`

## 2. Findings

1. `[accepted][risk-based inference][P2]` chat-capable activation path lacked positive regression coverage. `VsCodeExtensionHost` now guards chat registration behind runtime capability detection, but the original test window only exercised `chat: undefined`; this left a gap where `repo-ai-governor.governor` creation, `iconPath` assignment, and subscription wiring could regress silently on supported VS Code builds.

## 3. Disposition

1. 已接受该 finding。
2. 修复方式：扩展 `apps/vscode-extension/test/vscode-extension-host.activation.test.ts` 的 `vscode` mock，使 chat API 可以在测试内按需开启；新增正向回归用例，验证 `createChatParticipant()` 调用、`Uri.joinPath()` 赋值以及 chat participant disposable 被推入 `context.subscriptions`。

## 4. Verification

1. `pnpm run build`（通过）
2. `pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-host.activation.test.ts`（通过）
3. `node ./scripts/governance/check-task-required-inputs.js --tasks-dir .repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-001-phase-d-onboarding-cutover/tasks`（通过）
4. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
5. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
6. `node ./scripts/governance/check-code-review-status-sync.js`（通过）

## 5. Residual Risk

1. round-1 accepted finding 已完成修复并重验通过；若下一轮 fresh reviewer recheck 继续返回 actionable finding，则按 `workspace-scoped-cr-loop` 另开 `CR-002` 收口。
