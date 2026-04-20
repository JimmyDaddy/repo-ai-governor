# Code Review: sprint-001 primary workbench baseline round 3

- Status: resolved
- Date: 2026-04-17
- Reviewer: AI-Agent
- Task: `CR-003`
- Review Type: sprint boundary review
- Normative References:
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/cr-lifecycle-threshold-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/task-ledger-single-write-source-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/execution-gate-layering-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/vscode-governance-workbench-surface-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-orchestration/contracts/governance-workbench-aggregation-facade-contract.md`

## 1. Review Scope

1. `apps/vscode-extension/package.json`
2. `apps/vscode-extension/package.nls.json`
3. `apps/vscode-extension/package.nls.zh-cn.json`
4. `apps/vscode-extension/src/**`
5. `apps/vscode-extension/test/**`
6. `.repo-ai-governor/context/dev/project-112-vscode-governance-workbench-rollout/sprint-001-phase-a-primary-workbench-baseline/tasks/TK-936-freeze-vscode-primary-workbench-baseline-and-service-owned-task-review-seams.md`
7. `.repo-ai-governor/context/dev/project-112-vscode-governance-workbench-rollout/sprint-001-phase-a-primary-workbench-baseline/review/resolved_code_review_working-tree-20260417-0815.md`
8. `.repo-ai-governor/context/dev/project-112-vscode-governance-workbench-rollout/sprint-001-phase-a-primary-workbench-baseline/review/resolved_code_review_working-tree-20260417-0939.md`

## 2. Findings

1. 未发现需要修复的点。

## 3. Notes

1. 当前测试套件仍未直接单测 `vscode-extension-host.ts` 的 host activation wiring 与 `vscode-extension-chat-participant.ts` 的 chat participant assembly；本轮将其保留为非阻塞 residual risk，因为 manifest/contract/runtime/controller/presenter 路径已对齐且同窗口验证全部通过。
2. `package.nls.zh-cn.json` 中 `views.workbenchOverview.title` 仍保留 “Workbench” 英文词面；这属于文案质量观察，不构成本轮 rule-backed defect。

## 4. Verification

1. `pnpm run build`（通过）
2. `pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-contract.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts`（通过）
3. `node ./scripts/governance/check-code-review-status-sync.js`（通过）
4. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
5. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
6. `node ./scripts/governance/check-worktree-review-target.js`（通过）
