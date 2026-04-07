# DA-611 VS Code MVP hardening and trust-sensitive diagnostics follow-through

- Status: completed
- Date: 2026-04-07
- Project: `project-054-vscode-secondary-surface-rollout`
- Sprint: `sprint-002-vscode-mvp-hardening-and-desktop-foundation-guardrails`
- Task: `TK-611`

## 1. Summary

1. `Workspace Context` no longer stops at editor-local trust facts; it now also surfaces local orchestration service lifecycle, host/transport topology, checkpoint availability, and memory-provider identity through the same service-owned health seam.
2. `Review Detail` now carries the same workspace/service diagnostics into its webview facts so the selected execution is reviewed with the current trust/service context instead of only document routing metadata.
3. `@governor` chat now reports trust-sensitive action availability plus the same service-health facts, keeping the lightweight chat surface aligned with tree/webview diagnostics.

## 2. Implementation Surface

1. `apps/vscode-extension/src/runtime/vscode-extension-service-runtime.ts`
   - Added `resolveWorkspaceContextSnapshot()` so UI surfaces can consume one async snapshot that merges editor-local facts with `getHealth()` output.
2. `apps/vscode-extension/src/runtime/vscode-extension-host.ts`
   - Updated workspace-context provider wiring to resolve workspace/service diagnostics and selected execution together.
3. `apps/vscode-extension/src/runtime/vscode-extension-chat-participant.ts`
   - Switched chat status rendering to the new health-aware workspace snapshot.
4. `apps/vscode-extension/src/runtime/vscode-extension-presentation-builder.ts`
   - Added trust-sensitive action diagnostics and service-health presentation for tree nodes, review-detail HTML, and chat markdown.
5. `apps/vscode-extension/src/types/interfaces/vscode-extension-surface.interface.ts`
   - Added the transport-neutral service diagnostics snapshot carried by workspace context.

## 3. Guardrail Outcome

1. The VS Code companion still does not own shadow orchestration state; all new diagnostics are read-only facts derived from `LocalOrchestrationServiceSidecarClient.getHealth()`.
2. The change strengthens the source-checkout companion path without widening packaged-extension, Marketplace, or desktop-product claims.
3. Trust-gated commands remain editor-native blocked; this task only makes that boundary more explicit and more observable to operators.

## 4. Verification Evidence

1. `pnpm exec vitest run apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-contract.test.ts apps/vscode-extension/test/vscode-extension-selection-store.test.ts apps/vscode-extension/test/vscode-extension-packaging-boundary.test.ts --maxWorkers=1 --maxConcurrency=1`
2. `pnpm exec biome check apps/vscode-extension/src apps/vscode-extension/test apps/vscode-extension/README.md`
3. `pnpm run build`
4. `pnpm run check:ide-entry-smoke`
5. `pnpm run check:ide-docs-parity`
6. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`
7. `pnpm run test:integration -- --maxWorkers=1 --maxConcurrency=1`
