# DA-610 VS Code MVP gap list and desktop foundation non-goal guardrails

- Status: completed
- Date: 2026-04-07
- Project: `project-054-vscode-secondary-surface-rollout`
- Sprint: `sprint-002-vscode-mvp-hardening-and-desktop-foundation-guardrails`
- Task: `TK-610`

## 1. Freeze Summary

1. The formally supported VS Code path remains a built source checkout plus one extension-development host pointed at `apps/vscode-extension`.
2. The current VS Code companion MVP is frozen around service-backed `Execution Board / HITL Inbox / Workspace Context / Review Detail` plus the `@governor` chat participant and trust-gated handoff/HITL/recover/terminate actions.
3. `apps/desktop` stays a foundation-only surface in this project: it keeps the sidecar/preload/session/governance-console seams alive, but `project-054` does not promote it into the preferred secondary surface or a packaged desktop product claim.

## 2. Frozen VS Code MVP Gaps

1. Packaged extension delivery remains out of scope.
   - No npm/tgz-installed extension bundle.
   - No supported VSIX or Marketplace distribution.
2. The extension does not replace CLI/bootstrap ownership.
   - Build/bootstrap still start from the governor source checkout and the normal CLI path.
   - The extension is not the primary home for `init / doctor / check / connect / workflow authoring / session shell`.
3. Host-launch evidence remains partially manual.
   - Automated proof covers contract/controller/presentation/packaging/doc parity.
   - A real `code --extensionDevelopmentPath ...` rehearsal remains optional manual evidence, not a dedicated automated smoke gate.
4. Desktop command-center breadth is not a VS Code parity promise in this sprint.
   - Queue overview, automation inbox, broader artifact workbench, and richer desktop panels remain desktop-only or later follow-up surfaces.

## 3. Desktop Foundation Non-goals

1. Do not recast `apps/desktop` as the preferred secondary surface while `project-054` is explicitly `VS Code first / desktop foundation`.
2. Do not claim a standalone packaged desktop distribution or broaden the public support matrix beyond “MVP foundation only”.
3. Do not bypass service-owned DTO/query/command seams from renderer-side code, preload bridges, or docs narratives.
4. Do not pull CLI-private runtime state, editor-local truth, or shadow execution/session/policy state into desktop or VS Code renderer layers.

## 4. Hardening Inputs For TK-611

1. Keep trust-sensitive diagnostics and operator guidance explicit wherever recovery/terminate/HITL/handoff actions appear.
2. Prefer targeted hardening that strengthens the current source-checkout companion path rather than widening packaging or platform promises.
3. Any new UI/runtime behavior must preserve service ownership and keep desktop guardrails intact.

## 5. Touched Truth Surfaces

1. `apps/vscode-extension/README.md`
2. `apps/desktop/README.md`
3. `integrations/desktop/README.md`
4. `docs/local-adoption-playbook.md`
5. `docs/local-adoption-playbook.zh-CN.md`
6. `docs/maintainer-validation-playbook.md`
7. `docs/maintainer-validation-playbook.zh-CN.md`
8. `docs/support-matrix.md`
9. `docs/support-matrix.zh-CN.md`
