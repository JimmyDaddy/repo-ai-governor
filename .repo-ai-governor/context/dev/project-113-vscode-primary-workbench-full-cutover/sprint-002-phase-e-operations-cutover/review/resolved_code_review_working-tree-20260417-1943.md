# Code Review: sprint-002 phase-e operations cutover round 1

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

1. `apps/vscode-extension/src/runtime/vscode-extension-presentation-builder.ts`
2. `apps/vscode-extension/src/runtime/vscode-extension-review-detail-provider.ts`
3. `apps/vscode-extension/src/runtime/vscode-extension-service-runtime.ts`
4. `apps/vscode-extension/src/runtime/vscode-extension-workflow-studio-provider.ts`
5. `apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts`
6. `apps/vscode-extension/test/vscode-extension-service-runtime.test.ts`
7. `.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/plan.md`
8. `.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-002-phase-e-operations-cutover/plan.md`
9. `.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-002-phase-e-operations-cutover/tasks/**`

## 2. Findings

1. `[accepted][risk-based inference][P1]` artifact-pane restore failure 仍会把 review detail 折叠成“未选中执行”的假空态。`queryArtifactPaneForExecution()` 当时把 restore 异常吞成 `undefined`，而 review-detail surface 只有在 `selectedExecution && artifactPane` 同时存在时才渲染详情，导致已有 execution selection 的 restore failure 被错误投影为普通空态。
2. `[accepted][CS-004][P2]` `queryHitlInbox()` 的 empty-DTO fallback 缺少分支级验证证据。代码已经落了 catch-and-return-empty 分支，但测试只覆盖 queue overview 和 execution board，任务台账却把 HITL fallback 一并写成“已验证”。

## 3. Disposition

1. 已接受 P1 finding。
2. 修复方式：把 artifact-pane restore failure 从 runtime 显式上抛回 provider degraded chain，而不是在 runtime 内吞成 `undefined`；这样 review detail 与 workflow studio 都会进入已存在的 degraded page 渲染路径。
3. 已接受 P2 finding。
4. 修复方式：在 `apps/vscode-extension/test/vscode-extension-service-runtime.test.ts` 新增 `queryHitlInbox()` reject-path 覆盖，并补两条 snapshot restore reject regression，锁定 artifact-pane restore failure 会触发 degraded path 而不是静默空态。

## 4. Verification

1. `pnpm run build`（通过）
2. `pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts`（通过，`2` files / `29` tests）
3. `node ./scripts/governance/check-task-required-inputs.js --tasks-dir .repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-002-phase-e-operations-cutover/tasks`（通过）
4. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
5. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
6. `node ./scripts/governance/check-code-review-status-sync.js`（通过）
7. `node ./scripts/governance/check-worktree-review-target.js`（通过）

## 5. Residual Risk

1. round-1 accepted findings 已完成代码与测试修复；下一步仍需 fresh reviewer recheck 明确返回“无 actionable finding”，sprint-002 才能进入 closeout。
