# Code Review: sprint-002 workflow draft-session authoring baseline fresh recheck round 4

- Status: resolved
- Date: 2026-04-22
- Reviewer: AI-Agent
- Task: `CR-004`
- Review Type: delegated sprint recheck
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

## 1. Review Scope
1. `packages/core-orchestration-service`
2. `apps/vscode-extension`
3. `.repo-ai-governor/context/dev/project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout/sprint-002-workflow-authoring-draft-session-baseline`

## 2. Findings
### 2.1 [P1] Workflow Studio actions silently upgrade stale draft revisions to latest session truth
- 位置: `apps/vscode-extension/src/runtime/vscode-extension-command-controller.ts:3209`
- 问题描述: `validateWorkflowDraft()` / `commitWorkflowDraft()` / mutation actions都会先经 `requireWorkflowDraftSession()` 重新查询最新 draft session；如果 command request 自带的 `workflowDraftRevision` 已经过期，旧实现会直接拿最新 session 继续执行，而不会把 stale view 拒绝掉。
- 影响: 用户在旧视图上触发 validate/commit 时，扩展会绕过当前 UI 所见 revision，静默把操作落到最新 draft truth 上，破坏 service-owned revision guard 的 fail-closed 预期。
- 建议: 在控制器层比较 `request.workflowDraftRevision` 与服务端最新 `draftRevision`，不一致时抛 `AGENT_PROTOCOL_INVALID` 并要求先刷新 Workflow Studio。

### 2.2 [P2] Draft-session rehydrate/query path does not immediately surface `BASE_DEFINITION_CHANGED`
- 位置: `packages/core-orchestration-service/src/local-orchestration-service-workflow-draft-runtime.ts:918`, `packages/core-orchestration-service/src/local-orchestration-service-workflow-draft-runtime.ts:1023`
- 问题描述: draft session 从持久化载荷 rehydrate 时，旧实现只保留历史 conflictState，并没有在 query/read path 上重新比对当前 canonical workflow definition revision。
- 影响: 已保存 workflow definition 变化后，fresh client 重新连接 draft session 时仍可能先看到“无冲突”的 session，直到下一次 mutation/commit 才迟到地暴露 base-definition drift。
- 建议: 在 `readPersistedDraftSession()` / query path 上立即重算 durable conflict，并把 `BASE_DEFINITION_CHANGED` 作为 service-owned projection truth 返回。

### 2.3 [P2] Legacy controller lacks `CS-027` exception marker and active-sprint decomposition evidence
- 位置: `apps/vscode-extension/src/runtime/vscode-extension-command-controller.ts:1009`, `.repo-ai-governor/context/dev/project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout/sprint-002-workflow-authoring-draft-session-baseline/plan.md:42`, `.repo-ai-governor/context/dev/project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout/sprint-002-workflow-authoring-draft-session-baseline/tasks/TK-1040-close-sprint-002-and-hand-off-richer-graph-editing-readiness.md:39`
- 问题描述: sprint-002 把 workflow authoring baseline 继续落在 `vscode-extension-command-controller.ts` 这个 legacy 4k+ file 上，但现场缺少 `CS-027` 规定的 `god-object-exception` 注释和 active sprint 分解/交接证据。
- 影响: 这会让 sprint-002 在 closeout 时把一次明确的架构例外留成无主债务，后续 sprint-003 也缺少 focused extraction 的治理承接点。
- 建议: 在控制器内显式标注 temporary exception，并把 focused extraction handoff 写入 sprint-002 plan 与 `TK-1040` closeout 任务。

## 3. Notes
1. fresh delegated reviewer round surfaced 1 `P1` and 2 `P2` findings after `CR-003` resolved；主 agent 已接受这 3 项并进入修复/验证回路。
2. accepted findings 已完成修复并进入同窗 lifecycle closeout；下一步必须继续发起 fresh `CR-005` reviewer round，而不是直接进入 sprint-002 closeout。

## 4. Verification
1. `pnpm run typecheck`（通过）
2. `pnpm run build`（通过）
3. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）
4. `pnpm run check:ide-entry-smoke`（通过）
5. `pnpm run check:desktop-entry-smoke`（通过）
6. `pnpm exec vitest run --config vitest.packages.config.ts packages/core-orchestration-service/test/local-orchestration-service-sidecar-client.integration.test.ts packages/core-orchestration-service/test/local-orchestration-service-workspace-ops-runtime.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
7. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
8. `node ./scripts/governance/check-task-required-inputs.js --tasks-dir /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout/sprint-002-workflow-authoring-draft-session-baseline/tasks`（通过）
9. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
10. `node ./scripts/governance/check-code-review-status-sync.js`（通过）
11. `node ./scripts/governance/check-worktree-review-target.js`（通过）

## 复核结论（2026-04-22）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：`requireWorkflowDraftSession()` 之前只查询最新 draft session 并返回给 validate/commit/mutate 调用方，没有把 `commandRequest.workflowDraftRevision` 与最新 `draftRevision` 做一致性比较。
   - 处理：控制器现已在进入 workflow authoring 操作前比较请求 revision 与服务端最新 revision；若 stale，则 fail-closed 抛 `AGENT_PROTOCOL_INVALID`，并补上 stale revision validate 回归测试。
2. `2.2`
   - 判定：**认可**
   - 证据：`readPersistedDraftSession()` 旧实现会基于 persisted payload 直接重建 session，但不会在 rehydrate/query 当下重新比对 `baseDefinitionRevision` 与当前 canonical definition truth。
   - 处理：rehydrate 路径现改为走 `resolveRehydratedConflictState()`，在 query/read 时立即重算 durable `BASE_DEFINITION_CHANGED`，并补 sidecar integration coverage。
3. `2.3`
   - 判定：**认可**
   - 证据：workflow authoring baseline 本轮继续扩展 legacy controller，但原文件缺少 `god-object-exception` 标记，sprint-002 active ledger 里也没有把 focused extraction handoff 明确挂到 `TK-1040`。
   - 处理：控制器新增 `// god-object-exception: TK-1040 ...` 注释；sprint-002 `plan.md` 与 `TK-1040` 同步写入 `CS-027` temporary exception 和 sprint-003 focused extraction handoff 约束。

### 验证命令
1. `pnpm run typecheck`（通过）
2. `pnpm run build`（通过）
3. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）
4. `pnpm run check:ide-entry-smoke`（通过）
5. `pnpm run check:desktop-entry-smoke`（通过）
6. `pnpm exec vitest run --config vitest.packages.config.ts packages/core-orchestration-service/test/local-orchestration-service-sidecar-client.integration.test.ts packages/core-orchestration-service/test/local-orchestration-service-workspace-ops-runtime.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
7. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
8. `node ./scripts/governance/check-task-required-inputs.js --tasks-dir /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout/sprint-002-workflow-authoring-draft-session-baseline/tasks`（通过）
9. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
10. `node ./scripts/governance/check-code-review-status-sync.js`（通过）
11. `node ./scripts/governance/check-worktree-review-target.js`（通过）

## 修复执行记录（2026-04-22）

1. `2.1`：已完成
   - 变更文件：`apps/vscode-extension/src/runtime/vscode-extension-command-controller.ts`、`apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts`
   - 验证：`pnpm run typecheck`、`pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`、`pnpm run check:ide-entry-smoke`、`pnpm run check:desktop-entry-smoke`、`pnpm exec vitest run --config vitest.packages.config.ts packages/core-orchestration-service/test/local-orchestration-service-sidecar-client.integration.test.ts packages/core-orchestration-service/test/local-orchestration-service-workspace-ops-runtime.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts --maxWorkers=1 --maxConcurrency=1`
   - 说明：Workflow Studio validate/commit/mutation 现在会显式比较请求 revision 与服务端最新 revision；stale view 会 fail-closed，而不是静默升级到最新 session truth。
2. `2.2`：已完成
   - 变更文件：`packages/core-orchestration-service/src/local-orchestration-service-workflow-draft-runtime.ts`、`packages/core-orchestration-service/test/local-orchestration-service-sidecar-client.integration.test.ts`
   - 验证：`pnpm run typecheck`、`pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`、`pnpm exec vitest run --config vitest.packages.config.ts packages/core-orchestration-service/test/local-orchestration-service-sidecar-client.integration.test.ts packages/core-orchestration-service/test/local-orchestration-service-workspace-ops-runtime.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts --maxWorkers=1 --maxConcurrency=1`
   - 说明：draft-session rehydrate/query 现会立即重算 durable `BASE_DEFINITION_CHANGED`，fresh client 一连上就能收到 service-owned conflict projection，不再等到后续 mutation/commit 才暴露 drift。
3. `2.3`：已完成
   - 变更文件：`apps/vscode-extension/src/runtime/vscode-extension-command-controller.ts`、`.repo-ai-governor/context/dev/project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout/sprint-002-workflow-authoring-draft-session-baseline/plan.md`、`.repo-ai-governor/context/dev/project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout/sprint-002-workflow-authoring-draft-session-baseline/tasks/TK-1040-close-sprint-002-and-hand-off-richer-graph-editing-readiness.md`
   - 验证：`pnpm run typecheck`、`pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`
   - 说明：legacy controller 现已显式标注 `CS-027` temporary exception，并把 focused extraction handoff 写入 sprint-002 active plan 与 `TK-1040` closeout 约束。

## 风险与后续（2026-04-22）

1. `CR-004` 的 accepted findings 已完成修复并补齐 build/package/smoke 证据；按 scoped CR 规则，下一步仍需 fresh `CR-005` reviewer round，不能把本轮 resolved 直接当成 sprint-002 clean closeout。
