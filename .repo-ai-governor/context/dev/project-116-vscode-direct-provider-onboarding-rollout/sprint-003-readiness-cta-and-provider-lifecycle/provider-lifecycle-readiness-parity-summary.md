# Provider Lifecycle Readiness Parity Summary

- Date: 2026-04-20
- Project: `project-116-vscode-direct-provider-onboarding-rollout`
- Sprint: `sprint-003-readiness-cta-and-provider-lifecycle`
- Scope: `TK-1010`, `TK-1011`, `TK-1012`

## 1. Summary

1. Added one service-owned `provider lifecycle` projection that derives host CTA/state guidance from `provider_onboarding_snapshot` plus secure-authoring truth without creating a second readiness taxonomy.
2. Projected the same lifecycle guidance into workbench overview nodes, workflow-studio HTML, and chat follow-up buttons.
3. Mapped host-level actions to existing canonical commands only:
   - `Connect Provider` -> seeded `/connect` flow
   - `Update API Key` -> managed-secret update flow
   - `Reconnect Provider` -> seeded `/connect` reuse flow
   - degraded guidance -> `Run Doctor`

## 2. Evidence

1. `pnpm exec vitest run apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts apps/vscode-extension/test/vscode-extension-chat-participant.test.ts`
2. `pnpm run build`
3. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`

## 3. Next Tranche Handoff

1. `sprint-004` should use this projected lifecycle surface as the source for built-source / local-VSIX evidence capture instead of inventing docs-only CTA wording.
2. Public README / support wording still stays gated behind packaged evidence and clean-room validation; sprint-003 only establishes the runtime projection and verification baseline.
