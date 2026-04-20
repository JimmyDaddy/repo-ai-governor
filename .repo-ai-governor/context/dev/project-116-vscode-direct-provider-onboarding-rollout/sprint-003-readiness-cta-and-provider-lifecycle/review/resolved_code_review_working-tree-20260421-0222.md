# Code Review: sprint-003 provider lifecycle readiness CTA surfaces

- Status: resolved
- Date: 2026-04-21
- Reviewer: Archimedes (delegated sub-agent)
- Task: `CR-001`
- Review Type: working tree review
- Normative References:
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/cr-lifecycle-threshold-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/execution-gate-layering-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/task-ledger-single-write-source-contract.md`

## 1. Review Scope
1. `apps/vscode-extension/src/runtime/vscode-extension-host.ts`
2. `apps/vscode-extension/src/runtime/vscode-extension-service-runtime.ts`
3. `apps/vscode-extension/src/runtime/vscode-extension-presentation-builder.ts`
4. `apps/vscode-extension/src/runtime/vscode-extension-chat-participant.ts`
5. `apps/vscode-extension/src/constants/vscode-extension.constant.ts`
6. `apps/vscode-extension/src/types/interfaces/vscode-extension-surface.interface.ts`
7. `apps/vscode-extension/test/vscode-extension-service-runtime.test.ts`
8. `apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts`
9. `apps/vscode-extension/test/vscode-extension-chat-participant.test.ts`

## 2. Findings
### 2.1 [P1] Provider lifecycle connect/reconnect CTAs lose their seeded request
- 位置: `apps/vscode-extension/src/runtime/vscode-extension-presentation-builder.ts:2953`
- 问题描述: workflow studio 链接与 chat 按钮都已经为 `repoAiGovernor.runConnect` 生成了 `VsCodeExtensionCommandRequest`，但 VS Code command registration 仍以无参数形式调用 `commandController.runConnect()`，导致这些 CTA 打开后退回到通用 connect wizard，而不是复用本 sprint 新投影出的 tool/model/reuse-existing-credential 上下文。
- 影响: 用户从新的 provider lifecycle surface 点击 `Connect Provider` 或 `Reconnect Provider` 时，可能重新输入数据、落到错误 tool/provider 流程，或者根本无法得到预期的“已播种”连接路径。
- 建议: 让 `repoAiGovernor.runConnect` 的 host command handler 透传 `VsCodeExtensionCommandRequest`，并补一条真实 command-handler 回归测试覆盖带 payload 的 CTA 调用。

### 2.2 [P2] Provider lifecycle snapshot errors are silently suppressed
- 位置: `apps/vscode-extension/src/runtime/vscode-extension-service-runtime.ts:1023`
- 问题描述: `resolveProviderLifecycleSnapshots()` 会把每一次 `resolveProviderOnboardingSnapshot()` 异常都吞掉并过滤成 `undefined`。对已配置 tool 来说，这意味着 provider-onboarding 查询失败时，新的 lifecycle surface 会直接消失，而不是留下任何显式 degraded/doctor 指引。
- 影响: 在用户最需要 remediation guidance 的异常场景下，provider lifecycle surface 反而静默消失，会增加诊断与支持成本。
- 建议: 若不改变当前 fail-open 策略，至少应在 triage 中明确记录该设计取舍；若接受此 finding，则为异常场景保留显式 degraded snapshot，并补异常分支测试。

### 2.3 [P3] New provider lifecycle action labels bypass i18n
- 位置: `apps/vscode-extension/src/runtime/vscode-extension-presentation-builder.ts:2949`
- 问题描述: workflow studio action label 与 markdown summary 中的 “next steps” 都复用了只返回英文的 `getProviderLifecycleActionLabel()`，导致 `zh-CN` 会话中外围文案已本地化，但 `Update API Key` / `Reconnect Provider` 仍以英文硬编码出现。
- 影响: 混合语言输出违背 `CS-033` 的 user-facing i18n baseline，也会让 provider lifecycle guidance 的体验不一致。
- 建议: 为 provider lifecycle action label 增加统一的本地化格式化器，并让 workflow label 与 summary “next steps” 共用该路径。

## 3. Notes
1. `2.1` 与 `2.3` 已被主 agent 复核为 actionable finding，计划立即修复。
2. `2.2` 属于风险推断项，主 agent 将在 verified 阶段明确记录是否接受；当前实现保留了“拿不到 provider-onboarding snapshot 时 fail-open，避免宿主层编造第二套 readiness 真值”的设计取向。
3. 由于本轮变更触及 `apps/**`，进入 `resolved` 前必须补一轮真实 `pnpm run build`。

## 4. Verification
1. `pnpm exec vitest run apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts apps/vscode-extension/test/vscode-extension-chat-participant.test.ts`（通过，修复前基线）
2. `pnpm run build`（通过，修复前基线）
3. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过，修复前基线）

## 5. 复核结论（2026-04-21）
- 整体结论：**部分认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：`apps/vscode-extension/src/runtime/vscode-extension-host.ts` 现已将 `repoAiGovernor.runConnect` 的 `request` 透传给 `commandController.runConnect(request)`；`apps/vscode-extension/test/vscode-extension-host.activation.test.ts` 新增 handler-level regression，验证 VS Code command registration 不再丢失 seeded payload。
   - 处理：accepted，已进入修复窗口。
2. `2.2`
   - 判定：**不认可**
   - 证据：当前 sprint 的设计边界要求 provider lifecycle 继续作为 `provider-onboarding snapshot + secure-authoring` 的 host-level 投影，而不是在 snapshot 失败时由宿主再合成一套降级真值。`resolveProviderLifecycleSnapshots()` 当前的 fail-open 选择会隐藏该 surface，但它避免了在缺少 canonical onboarding snapshot 时生成不可靠的 CTA 参数与 provider 状态。
   - 处理：作为 risk inference 记录保留，不计入本 sprint actionable scope。
3. `2.3`
   - 判定：**认可**
   - 证据：`apps/vscode-extension/src/runtime/vscode-extension-presentation-builder.ts` 现已统一通过本地化 helper 生成 provider lifecycle action label；`apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts` 新增 `zh-CN` regression，覆盖 workflow studio 与 chat summary 的 action label 本地化。
   - 处理：accepted，已进入修复窗口。

### 验证命令
1. `pnpm exec vitest run apps/vscode-extension/test/vscode-extension-host.activation.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts apps/vscode-extension/test/vscode-extension-chat-participant.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts`（通过，93 tests）

## 6. 修复执行记录（2026-04-21）
1. `2.1`
   - 变更文件：`apps/vscode-extension/src/runtime/vscode-extension-host.ts`、`apps/vscode-extension/test/vscode-extension-host.activation.test.ts`
   - 验证：`pnpm exec vitest run apps/vscode-extension/test/vscode-extension-host.activation.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts apps/vscode-extension/test/vscode-extension-chat-participant.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts`（通过）
   - 说明：VS Code command registration 现已透传 `runConnect` 的 `VsCodeExtensionCommandRequest`，所以 workflow-studio/chat 生成的 seeded CTA 不再掉回通用 connect wizard。
2. `2.3`
   - 变更文件：`apps/vscode-extension/src/runtime/vscode-extension-presentation-builder.ts`、`apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts`
   - 验证：`pnpm exec vitest run apps/vscode-extension/test/vscode-extension-host.activation.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts apps/vscode-extension/test/vscode-extension-chat-participant.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts`（通过）
   - 说明：provider lifecycle action label 已统一改走本地化 helper，workflow studio 与 chat summary 的 “next steps” 不再混出英文硬编码。

## 7. 处置结果与剩余风险
1. 本轮 accepted findings 已全部完成修复，并在同一 change window 内通过 targeted VS Code tests、`pnpm run build` 与 `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1` 复核。
2. `2.2` 仍作为 rejected risk inference 保留：当前实现继续选择在拿不到 provider-onboarding snapshot 时 fail-open，而不是在宿主层合成 degraded lifecycle truth，以避免偏离“provider lifecycle 只是 canonical onboarding snapshot 的 host-level projection”这一 sprint 边界。
3. 未发现阻止 `sprint-003-readiness-cta-and-provider-lifecycle` 进入 closeout 的 residual actionable finding。
