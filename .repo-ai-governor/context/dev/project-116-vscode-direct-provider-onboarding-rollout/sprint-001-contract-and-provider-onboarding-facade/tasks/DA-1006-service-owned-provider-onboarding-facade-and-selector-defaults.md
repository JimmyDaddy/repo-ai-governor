# DA-1006 service-owned provider onboarding facade and selector defaults

- Status: active
- Date: 2026-04-20
- Owner: AI-Agent
- Task: `TK-1005`
- Project: `project-116-vscode-direct-provider-onboarding-rollout`
- Sprint: `sprint-001-contract-and-provider-onboarding-facade`

## 1. Summary

1. `queryProviderOnboarding` / `applyProviderOnboarding` 已落到 `orchestration-service-client -> sidecar client -> sidecar host -> shell -> workspace-ops runtime -> VS Code service runtime` 这条 service-owned seam。
2. sidecar-backed 与 embedded-CLI 两条路径都能返回同一组 redacted `snapshot / apply receipt` shape。
3. selector strategy 已冻结为 `secret://<provider>/api-key`，backend 解析维持 fail-closed；若显式 backend 不可写、当前 selected backend 不可写，或当前没有可写 backend，则 mutation 直接失败，不走 host-side heuristics fallback。

## 2. Facade Shape

1. snapshot minimum facts：
   - `surfaceId`
   - `entrypointKind`
   - `mutationMode`
   - `tool / transport / provider / vendorBinding`
   - `credentialRef`
   - `availableBackends / selectedBackendId`
   - `configTargets / receiptFields / warnings`
2. apply request minimum facts：
   - `tool`
   - `entrypointKind`
   - `model`
   - `apiKey`
   - optional `provider / endpoint / backendId`
3. apply receipt minimum facts：
   - `tool / provider / transport / vendorBinding`
   - `credentialRef`
   - `secretBackend`
   - `configTargets`
   - `warnings`
   - `nextAction`

## 3. Authoring Targets

1. 当前 facade 只 author 下列 user-config paths：
   - `tools.<tool>.transport`
   - `tools.<tool>.remoteApi.provider`
   - `tools.<tool>.remoteApi.vendorBinding`
   - `tools.<tool>.remoteApi.model`
   - `tools.<tool>.remoteApi.endpoint`
   - `tools.<tool>.remoteApi.credentialRef`
2. raw API key 只经由 `secret set ... --stdin` / service-owned `setManagedSecret` 进入 managed backend。
3. receipt 中的 `nextAction=repoAiGovernor.runConnect` 用于把 direct authoring 回链到 analyze-first verification，而不是让 host UI 自己重算 readiness truth。

## 4. Evidence

1. code:
   - `/Users/jimmydaddy/study/ai-governor/packages/core-orchestration-service/src/local-orchestration-service-sidecar-client.ts`
   - `/Users/jimmydaddy/study/ai-governor/packages/core-orchestration-service/src/local-orchestration-service-sidecar-host.ts`
   - `/Users/jimmydaddy/study/ai-governor/packages/core-orchestration-service/src/local-orchestration-service-shell.ts`
   - `/Users/jimmydaddy/study/ai-governor/apps/vscode-extension/src/runtime/vscode-extension-service-runtime.ts`
2. tests:
   - `/Users/jimmydaddy/study/ai-governor/apps/vscode-extension/test/vscode-extension-service-runtime.test.ts`
   - `/Users/jimmydaddy/study/ai-governor/packages/core-orchestration-service/test/local-orchestration-service-workspace-ops-runtime.test.ts`

## 5. Outputs

1. `/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-116-vscode-direct-provider-onboarding-rollout/sprint-001-contract-and-provider-onboarding-facade/tasks/DA-1006-service-owned-provider-onboarding-facade-and-selector-defaults.md`
