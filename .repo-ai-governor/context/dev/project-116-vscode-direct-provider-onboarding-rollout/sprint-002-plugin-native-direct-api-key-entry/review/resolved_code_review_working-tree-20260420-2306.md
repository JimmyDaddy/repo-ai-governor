# Code Review: sprint-002 direct provider onboarding connect path

- Status: resolved
- Date: 2026-04-20
- Reviewer: Ohm (delegated sub-agent)
- Task: `CR-001`
- Review Type: working tree review
- Normative References:
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/cr-lifecycle-threshold-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/execution-gate-layering-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/task-ledger-single-write-source-contract.md`

## 1. Review Scope
1. `apps/vscode-extension/src/runtime/vscode-extension-command-controller.ts`
2. `apps/vscode-extension/src/runtime/vscode-extension-service-runtime.ts`
3. `packages/core-orchestration-service/src/local-orchestration-service-workspace-ops-runtime.ts`
4. `apps/cli/src/runtime/cli-user-config-projection-service.ts`
5. `apps/cli/src/runtime/agent-onboarding-runtime.ts`
6. `apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts`
7. `apps/vscode-extension/test/vscode-extension-service-runtime.test.ts`
8. `packages/core-orchestration-service/test/local-orchestration-service-workspace-ops-runtime.test.ts`
9. `apps/cli/test/runtime/cli-user-config-projection-service.test.ts`
10. `apps/cli/test/runtime/agent-onboarding-runtime.test.ts`
11. `apps/cli/test/connect-phase2.integration.test.ts`

## 2. Findings
### 2.1 [P2] Connect persists onboarding mutations before CONNECT succeeds
- 位置: `apps/vscode-extension/src/runtime/vscode-extension-command-controller.ts:932`
- 问题描述: `runConnect()` 在执行 `CONNECT` 工作区操作前先调用 `applyProviderOnboarding()`。一旦后续 `CONNECT` 失败，managed secret 与 `user-config.yaml` 会已经被更新，但连接结果没有成功完成，形成部分提交状态。
- 影响: 用户会在连接失败后留下新的 secret/config 真值，后续诊断会把失败配置当成当前基线，增加回滚与支持成本。
- 建议: 把 provider-onboarding 变成 service-owned 的原子 connect 前置步骤，至少保证 connect 失败时执行补偿回滚，避免留下半完成状态。

### 2.2 [P2] “Use CLI default backend” 仍可能落到 selected backend
- 位置: `apps/vscode-extension/src/runtime/vscode-extension-command-controller.ts:1460`, `apps/vscode-extension/src/runtime/vscode-extension-service-runtime.ts:979`, `packages/core-orchestration-service/src/local-orchestration-service-workspace-ops-runtime.ts:305`
- 问题描述: provider-onboarding snapshot 与 picker 路径只稳定透传了 `selectedBackendId`，没有把 `defaultBackendId` 作为同等一等事实继续带到 host/runtime 决策里。用户在 UI 里选择 “Use CLI default backend” 时，实际写入仍可能跟随 selected backend 或首个 writable backend，而不是 CLI 默认 backend。
- 影响: secret 可能被写入错误 backend，导致 readback、support truth、后续 reconnect/update path 都与 UI 承诺不一致。
- 建议: 在 snapshot/types/runtime/controller 全链路补齐 `defaultBackendId`，并让默认选项显式落到该 backend。

### 2.3 [P2] 空 endpoint 输入不会清除旧的自定义 endpoint
- 位置: `apps/vscode-extension/src/runtime/vscode-extension-command-controller.ts:1478`, `apps/vscode-extension/src/runtime/vscode-extension-service-runtime.ts:1069`, `packages/core-orchestration-service/src/local-orchestration-service-workspace-ops-runtime.ts:440`
- 问题描述: connect/onboarding 流程只有在 endpoint 非空时才执行 `config set tools.<tool>.remoteApi.endpoint`，用户留空时不会触发 `config unset`，导致旧的自定义 endpoint 被静默保留。
- 影响: 用户以为已经回到 provider 默认 endpoint，但运行时仍继续命中旧 endpoint，形成难排查的配置残留。
- 建议: 将“显式留空”视为 clear 动作，执行对应的 `config unset`，并在 receipt / tests 中记录该变更。

## 3. Notes
1. 本轮 findings 来自 delegated reviewer，主 agent 仍需逐条 triage、修复并补写 verified/resolved 生命周期内容。
2. 由于本轮代码变更触及 `apps/**` 与 `packages/**`，进入 `resolved` 前必须补一轮真实 `pnpm run build`。

## 4. Verification
1. `pnpm exec vitest run apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts packages/core-orchestration-service/test/local-orchestration-service-workspace-ops-runtime.test.ts apps/cli/test/runtime/cli-user-config-projection-service.test.ts apps/cli/test/runtime/agent-onboarding-runtime.test.ts`（通过，修复前基线）
2. `pnpm exec vitest run apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts`（通过，修复前基线）
3. `pnpm run build`（通过，修复前基线）
4. `pnpm exec vitest run apps/cli/test/connect-phase2.integration.test.ts`（通过，修复前基线）
5. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过，修复前基线）

## 5. Recheck Addendum (2026-04-20)
### 5.1 [P2] Secret reuse check depended on record order
- 来源: Laplace round-2 recheck
- 判定: **accepted**
- 问题描述: same-key records across multiple backends could be matched by `keyName` only, causing same-backend reuse to depend on record order.
- 处理: controller 与 local/runtime apply path 现在优先按 `keyName + backendId` 命中目标 backend 记录，并补齐 duplicate-key multi-backend regression coverage。

### 5.2 [P2] Standalone onboarding dropped `defaultBackendId`
- 来源: Laplace round-2 recheck
- 判定: **accepted**
- 问题描述: public apply path only fell back to `selectedBackendId`, so direct onboarding could ignore the advertised CLI default backend.
- 处理: embedded/runtime-service 与 local orchestration service 现在统一优先使用 `defaultBackendId`，并补齐 selected/default 分离场景测试。

### 5.3 [P2] Native `Error` violated `CS-022`
- 来源: Laplace round-2 recheck
- 判定: **accepted**
- 问题描述: `packages/core-orchestration-service/test/local-orchestration-service-workspace-ops-runtime.test.ts` 里残留 `new Error(...)`，会直接被 standardized-error gate 拦下。
- 处理: 测试夹具已改为 shared standardized error model，并重新通过 `check-standardized-error-usage`。

### 5.4 [P2] Public `applyProviderOnboarding()` ignored `reuseExistingCredential`
- 来源: Parfit round-3 recheck
- 判定: **accepted**
- 问题描述: 公开 `applyProviderOnboarding()` contract 已暴露 `reuseExistingCredential`，但 embedded/sidecar apply path 仍然强制要求非空 API key，也没有复用与覆盖安全校验。
- 处理: public apply surface 现已与 `CONNECT` staging 对齐：`reuseExistingCredential=true` 时允许空 API key，但必须命中目标 backend 上已有 secret；非 reuse 请求仍会 fail-closed 阻止 overwrite，并补齐 direct-apply reuse/overwrite regression tests。

### 5.5 [P2] Cross-backend collisions still block fresh writes
- 来源: Herschel round-4 recheck
- 判定: **rejected**
- 问题描述: reviewer 建议当同一 selector 仅存在于其他 backend 时，fresh write 到新 backend 应该被放行。
- 驳回依据: 当前 sprint 的显式 product/runtime truth 仍要求“同一 selector 的跨 backend 轮换/迁移必须走 dedicated managed-secret update/reconnect flow”，而不是在 fresh connect/apply path 中静默 authoring 第二份同名 selector。现有 controller 提示文案、runtime fail-closed copy 与 regression tests 已明确编码这一保守边界，因此该项不作为本 sprint 的 actionable finding。

## 6. 复核结论（2026-04-20）
- 整体结论：**部分认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：`runConnect()` 已改为先构造 service-owned staged provider-onboarding transaction，再在 `CONNECT` 成功后 finalize；失败时会恢复 config 并清理新写入 secret。
   - 处理：accepted 并已修复。
2. `2.2`
   - 判定：**认可**
   - 证据：controller/runtime/local service 已统一透传并优先使用 `defaultBackendId`，相关 selected/default split tests 已通过。
   - 处理：accepted 并已修复。
3. `2.3`
   - 判定：**认可**
   - 证据：blank endpoint 现在触发 `config unset tools.<tool>.remoteApi.endpoint`，embedded 与 service-owned apply receipt/tests 已同步覆盖。
   - 处理：accepted 并已修复。
4. `5.1`
   - 判定：**认可**
   - 证据：duplicate-key multi-backend tests 已证明 same-backend reuse 不再受 record order 影响。
   - 处理：accepted 并已修复。
5. `5.2`
   - 判定：**认可**
   - 证据：public apply path 已在 embedded/runtime-service 与 local orchestration service 两条实现上优先使用 `defaultBackendId`。
   - 处理：accepted 并已修复。
6. `5.3`
   - 判定：**认可**
   - 证据：`node ./scripts/governance/check-standardized-error-usage.js` 当前窗口通过。
   - 处理：accepted 并已修复。
7. `5.4`
   - 判定：**认可**
   - 证据：public `applyProviderOnboarding()` 已支持 `reuseExistingCredential=true` 的 same-backend reuse 语义，并新增 direct-apply regression tests。
   - 处理：accepted 并已修复。
8. `5.5`
   - 判定：**不认可**
   - 证据：controller 仍明确提示“moving it to another backend still requires the dedicated managed-secret update flow”，local/service runtime 也继续以 dedicated update/reconnect flow 作为 cross-backend rotation boundary。
   - 处理：作为与当前 rollout truth 冲突的 risk inference 记录保留，但不计入本 sprint actionable scope。

### 验证命令
1. `pnpm exec vitest run apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts packages/core-orchestration-service/test/local-orchestration-service-workspace-ops-runtime.test.ts`（通过，95 tests）
2. `node ./scripts/governance/check-standardized-error-usage.js`（通过）
3. `pnpm exec vitest run apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts apps/cli/test/runtime/cli-user-config-projection-service.test.ts apps/cli/test/runtime/agent-onboarding-runtime.test.ts apps/cli/test/connect-phase2.integration.test.ts`（通过，58 tests）
4. `pnpm run build`（通过）
5. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过，157 files / 1242 tests）

## 7. 修复执行记录（2026-04-20）
1. `2.1`
   - 变更文件：`apps/vscode-extension/src/runtime/vscode-extension-command-controller.ts`、`packages/core-orchestration-service/src/local-orchestration-service-workspace-ops-runtime.ts`、`apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts`、`packages/core-orchestration-service/test/local-orchestration-service-workspace-ops-runtime.test.ts`
   - 验证：`pnpm exec vitest run apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts packages/core-orchestration-service/test/local-orchestration-service-workspace-ops-runtime.test.ts`（通过）
   - 说明：将 provider-onboarding 变成 connect-owned staged transaction，并在失败时补偿回滚。
2. `2.2` / `5.2`
   - 变更文件：`apps/vscode-extension/src/runtime/vscode-extension-command-controller.ts`、`apps/vscode-extension/src/runtime/vscode-extension-service-runtime.ts`、`packages/core-orchestration-service/src/local-orchestration-service-workspace-ops-runtime.ts` 及对应测试
   - 验证：`pnpm exec vitest run apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts packages/core-orchestration-service/test/local-orchestration-service-workspace-ops-runtime.test.ts`（通过）
   - 说明：default backend resolution 现已同时覆盖 `CONNECT` 与 public apply path。
3. `2.3`
   - 变更文件：`apps/vscode-extension/src/runtime/vscode-extension-command-controller.ts`、`apps/vscode-extension/src/runtime/vscode-extension-service-runtime.ts`、`packages/core-orchestration-service/src/local-orchestration-service-workspace-ops-runtime.ts` 及对应测试
   - 验证：`pnpm exec vitest run apps/vscode-extension/test/vscode-extension-service-runtime.test.ts packages/core-orchestration-service/test/local-orchestration-service-workspace-ops-runtime.test.ts`（通过）
   - 说明：blank endpoint 会清理 stale endpoint override。
4. `5.1`
   - 变更文件：`apps/vscode-extension/src/runtime/vscode-extension-command-controller.ts`、`packages/core-orchestration-service/src/local-orchestration-service-workspace-ops-runtime.ts` 及对应测试
   - 验证：`pnpm exec vitest run apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts packages/core-orchestration-service/test/local-orchestration-service-workspace-ops-runtime.test.ts`（通过）
   - 说明：same-backend reuse now prefers the targeted backend record when duplicate keys exist.
5. `5.3`
   - 变更文件：`packages/core-orchestration-service/test/local-orchestration-service-workspace-ops-runtime.test.ts`
   - 验证：`node ./scripts/governance/check-standardized-error-usage.js`（通过）
   - 说明：native `Error` 已替换为 shared standardized error model。
6. `5.4`
   - 变更文件：`apps/vscode-extension/src/runtime/vscode-extension-service-runtime.ts`、`packages/core-orchestration-service/src/local-orchestration-service-workspace-ops-runtime.ts` 及对应 direct-apply regression tests
   - 验证：`pnpm exec vitest run apps/vscode-extension/test/vscode-extension-service-runtime.test.ts packages/core-orchestration-service/test/local-orchestration-service-workspace-ops-runtime.test.ts`（通过）
   - 说明：public apply surface 现已 honor `reuseExistingCredential` 并维持 overwrite fail-closed semantics。

## 8. 处置结果与剩余风险
1. 本轮所有 accepted findings 已修复并在同一 change window 内完成 targeted tests、governance gate、`pnpm run build` 与 `pnpm run test:packages` 复核。
2. round-4 唯一剩余条目为 rejected risk inference：跨 backend 的同名 selector 迁移继续要求 dedicated managed-secret update/reconnect flow，这属于当前 rollout 的保守支持边界，而不是 sprint-002 的缺陷。
3. 未发现阻止 `sprint-002-plugin-native-direct-api-key-entry` 进入 closeout 的 residual actionable finding。
