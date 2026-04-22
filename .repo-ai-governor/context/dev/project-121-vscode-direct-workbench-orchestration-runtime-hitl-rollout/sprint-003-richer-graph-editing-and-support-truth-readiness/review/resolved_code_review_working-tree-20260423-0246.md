# Code Review: sprint-003 richer graph editing and support-truth readiness clean recheck

- Status: resolved
- Date: 2026-04-23
- Reviewer: AI-Agent
- Task: `CR-003`
- Review Type: delegated sprint recheck
- Normative References:
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/cr-lifecycle-threshold-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/task-ledger-single-write-source-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/execution-gate-layering-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/vscode-governance-workbench-surface-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-orchestration/contracts/direct-workbench-orchestration-runtime-hitl-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-orchestration/contracts/governance-workbench-aggregation-facade-contract.md`

## 1. Review Scope

1. `apps/vscode-extension/src/runtime/vscode-extension-presentation-builder.ts`
2. `apps/vscode-extension/src/runtime/vscode-extension-command-controller.ts`
3. `apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts`
4. `apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts`
5. `scripts/release/verify-vscode-extension-distribution.js`
6. `test/release-vscode-extension-distribution-sidecar-readiness.integration.test.ts`
7. `.repo-ai-governor/context/dev/project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout/sprint-003-richer-graph-editing-and-support-truth-readiness/**`

## 2. Findings

未发现需要修复的点。

## 3. Notes

1. Risk-based inference: `mergeCommandRequest()` 当前把 `clearWorkflowFocus` 与 `workflowFocus*` 覆盖视为互斥分支；本轮新增 focused backlink handoff 路径未走该冲突组合，因此暂不构成当前缺陷，但后续若有新入口复用这条 merge 路径，应继续关注。
2. Missing-test note: packaged Workflow Studio smoke 目前验证的是 packaged HTML/command generation 与 release assertions，而 controller-side focused handoff execution 仍由 source-level tests 覆盖；当前证据已足够支持本轮 clean 结论，但若未来把更多 handoff 逻辑下沉到 packaged runtime，可再考虑补 packaged execution-level smoke。
3. readiness disposition 仍保持 `fail-closed`；本轮 clean 只意味着 sprint-003 implementation boundary 可以进入 local sprint commit 与 project-final CR，不代表可以直接 uplift public/support truth。

## 4. Verification

1. `pnpm run build`（通过）
2. `pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
3. `pnpm exec vitest run test/release-vscode-extension-distribution-sidecar-readiness.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
4. `pnpm run release:verify-vscode-extension-distribution`（通过）
5. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）
6. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
7. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
8. `node ./scripts/governance/check-code-review-status-sync.js`（通过）
9. `node ./scripts/governance/check-worktree-review-target.js`（通过）

## 处置结果与剩余风险

1. `CR-003` clean 收口，本轮 sprint-003 delegated CR loop 未识别新的 actionable finding。
2. 剩余工作转入 project-final CR loop 与 `TK-1042` final closeout；在那之前不调整 public/support truth。
