# DA-1007 sprint-001 handoff and sprint-002 activation recommendation

- Status: active
- Date: 2026-04-20
- Owner: AI-Agent
- Task: `TK-1006`
- Project: `project-116-vscode-direct-provider-onboarding-rollout`
- Sprint: `sprint-001-contract-and-provider-onboarding-facade`

## 1. Summary

1. sprint-001 已完成 contract freeze、service-owned facade、selector defaults 与 verification baseline。
2. 下一条实现面固定为 `sprint-002-plugin-native-direct-api-key-entry`，目标是把 controller 的 human path 从 `credentialEnvVar` prompt 切换到 secure API key capture，并通过 `applyProviderOnboarding` 完成 secret-backed receipt。
3. public CTA 命名与 support wording 在 sprint-001 仍保持保守，不提前宣称 `Connect Provider / Update API Key / Reconnect Provider` 已成为最终用户路径。

## 2. Sprint-002 Entry Guidance

1. `VsCodeExtensionCommandController.runConnect()` 的 remote-api 分支应改为：
   - 先消费 `queryProviderOnboarding`
   - 再采集 provider / model / endpoint / API key
   - 最后通过 `applyProviderOnboarding` 落单次 mutation / receipt
2. `promptForConnectCredentialEnvVar()`、`resolveDefaultCredentialEnvVar()` 及 controller 内的 provider/vendor-binding heuristics 应在 migration window 内缩减为 compatibility-only surface 或被移除。
3. `configureUserDefault()` 继续保留为 power-user authoring path，但 primary human onboarding 应让位于 dedicated provider-onboarding flow。

## 3. Deferred Truth

1. `Connect Provider / Update API Key / Reconnect Provider` 的 final CTA taxonomy 延后到 sprint-003 readiness convergence。
2. built-source / local-VSIX evidence 与 docs/support wording 改口延后到 sprint-004。
3. zero-env-var clean-room claim 与 public support truth parity 延后到 sprint-005。

## 4. Verification Evidence

1. `pnpm exec vitest run apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts`
2. `pnpm run build`
3. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`

## 5. Outputs

1. `/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-116-vscode-direct-provider-onboarding-rollout/sprint-001-contract-and-provider-onboarding-facade/tasks/DA-1007-sprint-001-handoff-and-sprint-002-activation-recommendation.md`
