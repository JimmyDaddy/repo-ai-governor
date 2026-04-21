# DA-1005 provider onboarding owner split and contract freeze

- Status: active
- Date: 2026-04-20
- Owner: AI-Agent
- Task: `TK-1004`
- Project: `project-116-vscode-direct-provider-onboarding-rollout`
- Sprint: `sprint-001-contract-and-provider-onboarding-facade`

## 1. Summary

1. `provider onboarding` 的 host-facing mutation seam 已冻结到 local orchestration service / VS Code service runtime，而不是继续散落在 controller heuristics 中。
2. `runConnect` 仍保持 analyze-first / `credentialEnvVar` compatibility baseline；当前窗口明确不让 connect 流程写 managed secret，也不在 connect 流程里 author `credentialRef`。
3. canonical owner split 已明确收口：
   - `runtime.governance-clients`：host-facing secure capture、provider-onboarding snapshot / apply / receipt facade
   - `runtime.agent-projection`：`transport / provider / vendorBinding / verification_status / next_action(s)` canonical truth

## 2. Boundary Decisions

1. 新 facade 的 receipt 只回传 redacted facts：`tool / provider / credentialRef / secretBackend / warnings / nextAction`。
2. 默认 `nextAction` 固定回链到 `repoAiGovernor.runConnect`，保持 direct authoring 与 analyze-first verification 分层。
3. current `runConnect` regression 现在显式锁住以下边界：
   - 仍可携带 `remoteApiCredentialEnvVarBindings`
   - 只会额外 author `remoteApi.provider` 与 `remoteApi.vendorBinding`
   - 不会调用 `setManagedSecret`
   - 不会写 `tools.*.remoteApi.credentialRef`

## 3. Evidence

1. code:
   - `/Users/jimmydaddy/study/ai-governor/apps/vscode-extension/src/runtime/vscode-extension-service-runtime.ts`
   - `/Users/jimmydaddy/study/ai-governor/packages/core-orchestration-service/src/local-orchestration-service-workspace-ops-runtime.ts`
   - `/Users/jimmydaddy/study/ai-governor/packages/orchestration-service-client/src/types/interfaces/orchestration-service-client.interface.ts`
2. tests:
   - `/Users/jimmydaddy/study/ai-governor/apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts`
   - `/Users/jimmydaddy/study/ai-governor/apps/vscode-extension/test/vscode-extension-service-runtime.test.ts`
   - `/Users/jimmydaddy/study/ai-governor/packages/core-orchestration-service/test/local-orchestration-service-workspace-ops-runtime.test.ts`

## 4. Outputs

1. `/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-116-vscode-direct-provider-onboarding-rollout/sprint-001-contract-and-provider-onboarding-facade/tasks/DA-1005-provider-onboarding-owner-split-and-contract-freeze.md`
