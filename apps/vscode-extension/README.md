# VS Code Extension App

- Status: active
- Date: 2026-04-21
- Scope: `project-048 / sprint-002 / TK-562 ~ TK-564` + `project-054 / sprint-001 / TK-607 ~ TK-609` + `project-054 / sprint-002 / TK-610 ~ TK-611` + `project-064 / sprint-001 / TK-670 ~ TK-672` + `project-112 / sprint-001 ~ sprint-003 / TK-936 ~ TK-941` + `project-113 / sprint-004 ~ sprint-005 / TK-954 ~ TK-961` + `project-114 / sprint-001 ~ sprint-005 / TK-963 ~ TK-988` + `project-116 / sprint-001 ~ sprint-005 / TK-1004 ~ TK-1018`

## Purpose

`apps/vscode-extension` is the real VS Code governance workbench app for the current primary-workbench baseline.

It is intentionally separate from `integrations/ide/`, which continues to own wrapper contracts and sample entry templates.

The current public-support wording is now `primary_workbench_claim` for the built-source checkout and local VSIX / packaged-extension paths. Desktop remains a `foundation_only_secondary_surface`, while CLI continues to own automation / CI / scriptable entry points.

## Contract Freeze

1. The extension contributes one custom activity-bar container and seven views:
   - `Execution Board`
   - `HITL Inbox`
   - `Review Queue`
   - `Automation Queue`
   - `Workbench Overview`
   - `Workflow Studio` webview
   - `Review Detail` webview
2. The extension contributes one chat participant:
   - `@governor`
3. Trust-sensitive actions stay gated by `Workspace Trust`:
   - handoff opening
   - temporary bridge staging
   - HITL submission
   - execution recovery
   - execution termination
4. The extension must consume service-owned query/command seams and must not own shadow execution/session/policy state.

## Runtime Boundary

1. `apps/vscode-extension/src/constants/**` is the frozen source for IDs and contribution boundaries.
2. `apps/vscode-extension/src/runtime/vscode-extension-host.ts` owns activation wiring and registers:
   - tree views for `Execution Board / HITL Inbox / Review Queue / Automation Queue / Workbench Overview`
   - workbench/detail webviews for `Workflow Studio / Review Detail`
   - `@governor` chat participant
   - editor-local commands and code actions
3. `apps/vscode-extension/src/runtime/vscode-extension-service-runtime.ts` is the only service owner inside the extension host; it consumes `LocalOrchestrationServiceSidecarClient` and keeps orchestration truth outside the extension.
4. `apps/vscode-extension/src/runtime/vscode-extension-presentation-builder.ts` maps service-owned DTOs into tree/chat/webview presentation models, including queue/workbench projections, workflow studio evidence, desktop relationship, and support-truth gate summaries.
5. `apps/vscode-extension/src/types/**` defines the transport-neutral contract used by the extension runtime.

## Packaging Support Boundary

1. Current formal support starts from a built governor source checkout.
2. From that checkout, the supported editor-native paths are either one VS Code extension-development host pointed at `apps/vscode-extension` or one locally generated packaged extension root / VSIX produced by `pnpm run release:pack-vscode-extension` and rechecked by `pnpm run release:verify-vscode-extension-distribution`.
3. Trust-sensitive commands remain gated by `Workspace Trust`; the extension must not bypass those editor-native guardrails.
4. The supported packaged boundary is limited to the locally generated packaged extension root / VSIX from that built checkout. The published npm/tgz surface still does not ship an installable extension bundle, and Marketplace distribution remains unsupported.
5. Public support truth for this surface lives in `docs/support-matrix.md` and `docs/support-matrix.zh-CN.md`, and now keeps `primary_workbench_claim` active while desktop stays `foundation_only_secondary_surface`.

## Provider Onboarding Boundary

1. The supported plugin human path uses host-native `Connect Provider`, `Update API Key`, and `Reconnect Provider` actions instead of asking users to author `credentialEnvVar` values manually before the extension becomes useful.
2. Raw API-key capture must stay behind the VS Code secure prompt and the Governor managed secret backend. The extension may only persist non-secret provider defaults plus `credentialRef`.
3. `runtime.governance-clients` owns the host-facing onboarding facade and receipt flow, while `runtime.agent-projection` continues to own readiness normalization and canonical `next_action(s)` truth.
4. Built-source checkout plus one locally generated packaged extension root / VSIX now carry evidence-backed direct-onboarding and zero-env-var rollout truth for the supported plugin human path.

## Current Workbench Baseline

1. `Execution Board`
   - execution summary rows
   - service-backed action nodes
   - service-backed handoff nodes
2. `HITL Inbox`
   - pending HITL executions
   - decision option nodes
   - review/handoff affordances
3. `Review Queue`
   - service-owned review queue rows
   - review status counts
   - review-detail handoff affordances
4. `Automation Queue`
   - automation inbox rows
   - pending automation backlog
   - receipt/backlink handoffs
5. `Workbench Overview`
   - workspace root
   - workspace trust state
   - trust-sensitive action diagnostics
   - local orchestration service lifecycle/topology/checkpoint/memory-provider facts
   - multi-workspace and selected execution / review routing snapshot
   - support-truth and desktop-relationship summary
6. `Workflow Studio`
   - selected execution snapshot
   - workflow stage progress
   - pending action summary
   - child workflow / artifact backlinks
   - support-truth gate evidence
7. `Review Detail`
   - review lifecycle metadata
   - artifact list
   - transcript preview
8. `@governor`
   - summary commands: `/status`, `/review`
   - executable slash commands:
     ` /refresh`
     ` /workspace-bootstrap`
     ` /doctor`
     ` /check`
     ` /workflow-preview`
     ` /workflow-create`
     ` /workflow-edit`
     ` /workflow-studio`
     ` /review-detail`
     ` /handoff-target`
     ` /repository-operation`
     ` /submit-hitl-decision`
     ` /recover-execution`
     ` /terminate-execution`
     ` /open-user-config`
     ` /configure-user-default`
     ` /set-managed-secret`
   - imperative prompt routing can resolve short natural-language requests onto the same command surface, for example `@governor please run doctor`, `@governor 打开评审详情`, or `@governor preview workflow template-id`
   - workflow and repository-operation commands can accept a short prompt suffix in chat, for example `@governor /workflow-preview template-id` or `@governor /repository-operation upgrade preview`

## Public Support Boundary And Residual Risk

1. Packaged support is still limited to locally generated artifacts from a built source checkout; published npm/tgz install, direct registry delivery, and Marketplace rollout remain unsupported.
2. For built-source checkout and the packaged-artifact boundary of one locally generated VSIX / packaged extension root, the extension is now the primary human-facing workbench for bootstrap/readiness, `doctor`, `check`, workflow authoring, run/review, automation interaction, governed `adopt / host / verify / upgrade` follow-up, and host-native provider onboarding.
3. CLI remains supported, but only as an optional automation / CI / scriptable / session-shell / debugging path. Users no longer need to open a manual CLI path before the extension becomes useful.
4. Compatibility bridge metadata may still be rendered as exit evidence, but the supported user path now executes these operations through service-owned workspace commands inside VS Code instead of asking the user to hand off into a visible CLI flow.
5. Automated evidence now proves controller/runtime/presentation direct-onboarding parity, managed-secret-backed receipt boundaries, selector-first zero-env-var compatibility, activation coverage, packaged module smoke, package-root/extracted-VSIX sidecar smoke, packaged/extracted CLI-backed secure-authoring, scratch-isolated `doctor` diagnostics capture with surfaced check totals, and symlink-safe payload boundaries. A real extension-development-host launch or GUI `Install from VSIX...` rehearsal remains optional manual evidence rather than a release-blocking automated gate.
6. Public docs now describe the extension as the editor-native primary workbench for built-source checkout and local VSIX / packaged-extension paths only, with host-native direct provider onboarding on those supported paths. Live remote-provider success remains outside the formal support claim, and this does not extend support to published npm/tgz install bundles, direct registry delivery, or Marketplace rollout.

## Verification

1. `pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-contract.test.ts apps/vscode-extension/test/vscode-extension-host.activation.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-selection-store.test.ts apps/vscode-extension/test/vscode-extension-packaging-boundary.test.ts`
2. `pnpm run build`
3. `pnpm run check`
4. `pnpm run release:verify-vscode-extension-distribution -- --output .tmp/vscode-extension-distribution-report.json`
5. `pnpm pack --json --dry-run`
6. `pnpm run check:ide-entry-smoke`
7. `pnpm run check:ide-docs-parity`
