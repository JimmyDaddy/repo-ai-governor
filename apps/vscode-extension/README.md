# VS Code Extension App

- Status: active
- Date: 2026-04-07
- Scope: `project-048 / sprint-002 / TK-562 ~ TK-564` + `project-054 / sprint-001 / TK-607 ~ TK-609` + `project-054 / sprint-002 / TK-610 ~ TK-611`

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

## Packaging Support Boundary

1. The current formal support path is a built governor source checkout plus one VS Code extension-development host pointed at `apps/vscode-extension`.
2. Trust-sensitive commands remain gated by `Workspace Trust`; the extension must not bypass those editor-native guardrails.
3. The published npm/tgz package surface does not ship the `apps/vscode-extension` workspace or an installable VS Code extension bundle; it may still contain internal `dist/apps/vscode-extension/**` build artifacts, but those are not a supported npm/VSIX/Marketplace distribution.
4. Public support truth for this secondary surface lives in `docs/support-matrix.md` and `docs/support-matrix.zh-CN.md`.

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
   - trust-sensitive action diagnostics
   - local orchestration service lifecycle/topology/checkpoint/memory-provider facts
   - active editor snapshot
   - selected execution / review routing snapshot
4. `Review Detail`
   - review lifecycle metadata
   - artifact list
   - transcript preview
5. `@governor`
   - `/status`
   - `/review`

## Frozen MVP Gaps

1. The extension is still source-checkout only; packaged npm/tgz, VSIX, and Marketplace delivery remain unsupported.
2. The extension does not replace the CLI bootstrap path or become the primary home for `init / doctor / check / workflow authoring / session shell`.
3. Automated evidence currently proves contract/controller/presentation/packaging/doc parity, but a real extension-development-host launch remains an optional manual rehearsal rather than a dedicated automated smoke gate.
4. Richer desktop command-center breadth such as queue overview, automation inbox, and broader artifact workbench remains a desktop-only or later follow-up surface, not a VS Code MVP parity promise.

## Verification

1. `pnpm exec vitest run apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-contract.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts apps/vscode-extension/test/vscode-extension-selection-store.test.ts apps/vscode-extension/test/vscode-extension-packaging-boundary.test.ts --maxWorkers=1 --maxConcurrency=1`
2. `pnpm run build`
3. `pnpm pack --json --dry-run`
4. `pnpm run check:ide-entry-smoke`
5. `pnpm run check:ide-docs-parity`
6. `pnpm exec biome check apps/vscode-extension/src apps/vscode-extension/test apps/vscode-extension/package.json apps/vscode-extension/README.md`
