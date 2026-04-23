# DA-1050 direct-workbench evidence and readiness package

- Status: completed
- Date: 2026-04-23
- Owner: AI-Agent
- Task: `TK-1050`
- Project: `project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout`
- Sprint: `sprint-003-richer-graph-editing-and-support-truth-readiness`

## 1. Summary

1. `Workflow Studio` 现已在 VS Code 中渲染 service-backed `workflow graph projection`、`stage navigation`、`backlink reveal` 与 `focused backlink` action surface，并保持 canonical workflow/runtime/HITL truth 继续由 `local_orchestration_service` 持有。
2. richer graph interaction 继续建立在已有 direct-workbench seam 上：graph/stage/backlink 投影只消费 `workflowDraftSession`、`selectedExecution`、`artifactPane`、`roleLaneStatus`、`sessionContinuity` 与 `hitlDecisionPacket`，没有新增 extension-local workflow graph truth 或 runtime shadow state。
3. 发行验证已把 packaged Workflow Studio smoke 纳入 `release:verify-vscode-extension-distribution`，同时保留 host distribution 的四条 scenario 验证，形成 sprint-003 的 build/distribution/runtime evidence package。

## 2. Code And Regression Packet

1. `apps/vscode-extension/src/runtime/vscode-extension-presentation-builder.ts`
2. `apps/vscode-extension/src/runtime/vscode-extension-selection-store.ts`
3. `apps/vscode-extension/src/runtime/vscode-extension-command-controller.ts`
4. `apps/vscode-extension/src/runtime/vscode-extension-service-runtime.ts`
5. `apps/vscode-extension/src/types/interfaces/vscode-extension-surface.interface.ts`
6. `apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts`
7. `apps/vscode-extension/test/vscode-extension-service-runtime.test.ts`
8. `apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts`
9. `scripts/release/verify-vscode-extension-distribution.js`
10. `test/release-vscode-extension-distribution-sidecar-readiness.integration.test.ts`

## 3. Verification Evidence

1. `pnpm run typecheck`
   - Result: `pass`
2. `pnpm run build`
   - Result: `pass`
3. `pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts --maxWorkers=1 --maxConcurrency=1`
   - Result: `pass`
4. `pnpm exec vitest run test/release-vscode-extension-distribution-sidecar-readiness.integration.test.ts --maxWorkers=1 --maxConcurrency=1`
   - Result: `pass`
5. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`
   - Result: `pass`
6. `pnpm run check:ide-entry-smoke`
   - Result: `pass`
7. `pnpm run check:desktop-entry-smoke`
   - Result: `pass`
8. `pnpm run release:verify-vscode-extension-distribution`
   - Result: `pass`
   - Report: `.tmp/release-vscode-extension-distribution-report.json`
9. `pnpm run release:verify-host-distribution`
   - Result: `pass`
   - Report: `.tmp/release-host-distribution-validation-report.json`

## 4. Packaged Readiness Highlights

1. `.tmp/release-vscode-extension-distribution-report.json` 同时记录 `packageWorkflowStudioSmoke` 与 `installedWorkflowStudioSmoke`：
   - `graphHeadingPresent=true`
   - `stageNavigationPresent=true`
   - `backlinkRevealPresent=true`
   - `focusedBacklinkActionPresent=true`
2. packaged / installed smoke 都能暴露 stage-focus command、review/workspace backlink-focus command 与 focused backlink handoff request；workspace backlink 现在明确回到 `worktree` handoff，而不是误走 editor document path，证明 richer Workflow Studio surface 已进入 packaged distribution path，而不是只存在于 source checkout。
3. `.tmp/release-host-distribution-validation-report.json` 继续保持 `status=pass`，覆盖 `codex/claude-code` 的 `project-local/plugin-bundle` 共 `4` 条 host-distribution scenario，说明 sprint-003 没有破坏既有 host distribution readiness。

## 5. Boundary Notes

1. 本证据包证明的是 `projection-backed workflow studio + runtime/readiness package` 已可交付，不等于 public support truth 已自动升级。
2. freeform drag-drop graph editing 仍属于 contract 允许的后续增量；本轮实现边界继续保持 `schema-first authoring before richer graph editing` 的 phased rollout。
