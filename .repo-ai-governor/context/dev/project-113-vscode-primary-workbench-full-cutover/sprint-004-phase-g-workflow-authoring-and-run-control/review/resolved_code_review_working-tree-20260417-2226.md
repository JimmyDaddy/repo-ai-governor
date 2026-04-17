# Code Review: sprint-004 phase-g workflow authoring and run control

- Status: resolved
- Date: 2026-04-17
- Reviewer: delegated reviewer (`gpt-5.4`, `xhigh`) + main agent verification/remediation
- Task: `CR-001`
- Review Type: delegated fresh reviewer round
- Normative References:
  - `AGENTS.md`
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/cr-lifecycle-threshold-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/task-ledger-single-write-source-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/execution-gate-layering-spec.md`

## 1. Review Scope

1. `apps/vscode-extension/src/runtime/vscode-extension-service-runtime.ts`
2. `apps/vscode-extension/src/runtime/vscode-extension-workflow-studio-provider.ts`
3. `apps/vscode-extension/src/runtime/vscode-extension-presentation-builder.ts`
4. `apps/vscode-extension/src/types/index.ts`
5. `apps/vscode-extension/src/types/interfaces/index.ts`
6. `apps/vscode-extension/src/types/interfaces/vscode-extension-surface.interface.ts`
7. `apps/vscode-extension/test/vscode-extension-service-runtime.test.ts`
8. `apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts`
9. `apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts`
10. `.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-004-phase-g-workflow-authoring-and-run-control/plan.md`
11. `.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/plan.md`
12. `.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-004-phase-g-workflow-authoring-and-run-control/tasks/TK-954-freeze-phase-g-workflow-authoring-and-run-control-contract.md`
13. `.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-004-phase-g-workflow-authoring-and-run-control/tasks/TK-955-implement-workflow-authoring-and-governed-run-control-seams.md`
14. `.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-004-phase-g-workflow-authoring-and-run-control/tasks/TK-956-land-workflow-studio-control-surfaces-and-continuity-ux.md`
15. `.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-004-phase-g-workflow-authoring-and-run-control/tasks/TK-957-prepare-sprint-004-exit-acceptance-and-phase-h-handoff.md`

## 2. Findings

1. `[P1]` `apps/vscode-extension/src/runtime/vscode-extension-service-runtime.ts`
   - `resolveSessionContinuitySnapshot()` previously called `resumeSession()` while composing a read-only workflow-studio snapshot.
   - `packages/core-orchestration-service/src/local-orchestration-service-session-runtime.ts` appends `SESSION_RESUMED` on every `resumeSession()` call, so simply opening or refreshing Workflow Studio mutated session state.
   - The continuity projection must stay read-only; render-time inspection cannot append resume events.
2. `[P2]` `apps/vscode-extension/src/runtime/vscode-extension-presentation-builder.ts`
   - The review-only `Open review document` action previously serialized only `reviewSourcePath`.
   - `openHandoffTarget()` merges the command request with retained selection state, so a stale `queueEntry.handoffTargets` could still win when `queueEntry: undefined` disappears during command-URI JSON serialization.
   - Review-only handoff must carry its own explicit `review_document` target to avoid reopening stale queue-backed files.

## 3. Notes

1. 本轮 delegated reviewer 返回 2 条 actionable findings；主 agent 已逐条复核并全部认可。
2. 该轮修复保持 sprint-004 的既有边界不变：只收紧 Workflow Studio continuity 的只读契约与 review-only handoff 的命令载荷，不扩张 scope。
3. 修复后重新通过 targeted vitest、`pnpm run build` 与整仓 `pnpm run check`；当前 round 无剩余 accepted finding。

## 4. Verification

1. `pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts`（通过）

## 5. 复核结论（2026-04-17）

- 整体结论：**认可**

### 逐条复核

1. `[P1] Workflow Studio render path mutates session state`
   - 判定：**认可**
   - 证据：`resolveSessionContinuitySnapshot()` 通过 `resumeSession()` 读取 continuity 数据会触发真实 `SESSION_RESUMED` 事件追加，因此 render path 不再是纯只读投影。
   - 处理：改为仅调用 `getSession()`，直接从 session summary 派生 `latestEventSequence`、`nextCursor` 与 `resumeSelector=session.sessionId`；并新增回归测试断言 workflow-studio snapshot resolution never calls `resumeSession()`.
2. `[P2] Review-only handoff can reopen stale queue target`
   - 判定：**认可**
   - 证据：review-only action 仅携带 `reviewSourcePath` 时，命令请求在 JSON URI 中无法显式清空 `queueEntry`，导致 stale queue handoff 仍可被 merge 逻辑复用。
   - 处理：review-only `Open review document` 改为携带显式 `handoffTarget`，并补充 regression tests 覆盖 stale queue retention 与 command URI payload 编码。

### 验证命令

1. `pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts`（通过）

## 6. 修复执行记录（2026-04-17）

1. `[P1] Workflow Studio render path mutates session state`：已完成
   - 变更文件：`apps/vscode-extension/src/runtime/vscode-extension-service-runtime.ts`、`apps/vscode-extension/test/vscode-extension-service-runtime.test.ts`
   - 验证：`pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts`（通过）；`pnpm run build`（通过）；`pnpm run check`（通过）
   - 说明：workflow-studio continuity snapshot 现在只读调用 `getSession()`，不再在 render path 上触发 `resumeSession()` 副作用。
2. `[P2] Review-only handoff can reopen stale queue target`：已完成
   - 变更文件：`apps/vscode-extension/src/runtime/vscode-extension-presentation-builder.ts`、`apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts`、`apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts`
   - 验证：`pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts`（通过）；`pnpm run build`（通过）；`pnpm run check`（通过）
   - 说明：review-only workflow-studio handoff 现在显式携带 `review_document` target，即使保留 stale queue selection 也会优先打开当前 review 文档。
