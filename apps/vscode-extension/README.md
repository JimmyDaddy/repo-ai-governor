# VS Code Extension App

- Status: active
- Date: 2026-04-05
- Scope: `project-048 / sprint-002 / TK-562 ~ TK-564`

## Purpose

`apps/vscode-extension` is the real VS Code extension workspace app for the editor companion MVP.

It is intentionally separate from `integrations/ide/`, which continues to own wrapper contracts and sample entry templates.

## Contract Freeze

1. The extension contributes one custom activity-bar container and four views:
   - `Execution Board`
   - `HITL Inbox`
   - `Workspace Context`
   - `Review Detail` webview
2. The extension contributes one chat participant:
   - `@governor`
3. Trust-sensitive actions stay gated by `Workspace Trust`:
   - handoff opening
   - HITL submission
   - execution recovery
   - execution termination
4. The extension must consume service-owned query/command seams and must not own shadow execution/session/policy state.

## Runtime Boundary

1. `apps/vscode-extension/src/constants/**` is the frozen source for IDs and contribution boundaries.
2. `apps/vscode-extension/src/runtime/vscode-extension-host.ts` owns activation wiring and registers:
   - lightweight tree views for `Execution Board / HITL Inbox / Workspace Context`
   - detail-only webview for `Review Detail`
   - `@governor` chat participant
   - editor-local commands and code actions
3. `apps/vscode-extension/src/runtime/vscode-extension-service-runtime.ts` is the only service owner inside the extension host; it consumes `LocalOrchestrationServiceSidecarClient` and keeps orchestration truth outside the extension.
4. `apps/vscode-extension/src/runtime/vscode-extension-presentation-builder.ts` maps service-owned DTOs into tree/chat/webview presentation models.
5. `apps/vscode-extension/src/types/**` defines the transport-neutral contract used by the extension runtime.

## MVP Surface

1. `Execution Board`
   - execution summary rows
   - service-backed action nodes
   - service-backed handoff nodes
2. `HITL Inbox`
   - pending HITL executions
   - decision option nodes
   - review/handoff affordances
3. `Workspace Context`
   - workspace root
   - workspace trust state
   - active editor snapshot
   - selected execution / review routing snapshot
4. `Review Detail`
   - review lifecycle metadata
   - artifact list
   - transcript preview
5. `@governor`
   - `/status`
   - `/review`

## Verification

1. `pnpm exec vitest run apps/vscode-extension/test/vscode-extension-contract.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts`
2. `pnpm run build`
3. `pnpm run check:ide-entry-smoke`
4. `pnpm run check:ide-docs-parity`
5. `pnpm exec biome check apps/vscode-extension/src apps/vscode-extension/test apps/vscode-extension/package.json apps/vscode-extension/README.md`
