# Code Review: sprint-002 runtime resolution and doctor diagnostics round 1

- Status: resolved
- Date: 2026-04-12
- Reviewer: AI-Agent
- Task: `CR-001`
- Review Type: delegated fresh review
- Normative References:
  - `AGENTS.md`
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/cr-lifecycle-threshold-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/task-ledger-single-write-source-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/execution-gate-layering-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-onboarding-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-projection-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/local-user-config-defaults-and-secret-backed-credential-resolution.md`

## 1. Review Scope

1. `apps/cli/src/**`
2. `apps/cli/test/**`
3. `packages/adapter-sdk/**`
4. `packages/adapters/codex/**`
5. `packages/adapters/claude-code/**`
6. `packages/shared/src/**`

## 2. Findings

### 2.1 [P1] global `set-ui-theme` overwrites canonical `user-config.yaml`

- 位置: `apps/cli/src/commands/workspace-command.ts:2304`、`apps/cli/src/runtime/global-cli-theme-preference-service.ts:23`
- 问题描述: global theme persistence 已切到 canonical `~/.repo-ai-governor/user-config.yaml`，但原实现仍把全局 theme 当作一个只含 `ui.react.theme` 的独立文档直接覆盖写入。
- 影响: 一旦执行 `workspace set-ui-theme --theme-scope global`，现有 `workspace.mode_preference`、`tools.*.remoteApi.*`、`credentialRef` 等 user-local truth 会被整份抹掉，直接破坏本轮 rollout 新引入的 canonical user-config / secret-backed defaults contract。
- 建议: 改为先加载 canonical user-config，再只更新 `ui.react.theme` 并回写 merged 文档；同时补回归测试，证明已有 user-config keys 不会被 clobber。

### 2.2 [P2] user-config remote-api projection 没有补齐 canonical `credentialEnvVar` 默认值

- 位置: `apps/cli/src/runtime/cli-user-config-projection-service.ts:136`、`apps/cli/src/runtime/agent-onboarding-runtime.ts:859`
- 问题描述: user-config projection 会补 provider / vendor binding，但不会像 connect authoring path 一样补齐默认 `credentialEnvVar`。这会让同一套 remote-api truth 按来源不同生成两种 canonical 形状。
- 影响: `connect` candidate 与 projection/runtime descriptor truth 会出现 drift，削弱 sprint-002 对 “authoring path -> canonical projection” 的归一化目标，也会让后续 doctor / onboarding contract 看到不一致的 remote-api payload。
- 建议: projection path 复用和 connect authoring 相同的默认 env-var 规则，并补 model-only user-config regression test。

## 3. Verification

1. `pnpm run build`（通过）
2. `pnpm vitest run apps/cli/test/runtime/agent-onboarding-runtime.test.ts apps/cli/test/connect-phase2.integration.test.ts apps/cli/test/runtime/adapter-verification-runtime.test.ts apps/cli/test/runtime/session-slash-command-registry.test.ts apps/cli/test/runtime/session-main-supervisor-runtime.test.ts apps/cli/test/runtime/cli-secret-service.test.ts apps/cli/test/runtime/cli-user-config-projection-service.test.ts apps/cli/test/runtime/cli-user-config-service.test.ts apps/cli/test/cli-output-contract.integration.test.ts apps/cli/test/cli-skeleton.integration.test.ts apps/cli/test/commands/workspace-command.test.ts packages/adapters/codex/test/codex-agent-adapter.smoke.test.ts packages/adapters/claude-code/test/claude-code-agent-adapter.smoke.test.ts`（通过）

## 复核结论（2026-04-12）

- 整体结论：**认可**

### 逐条复核

1. `2.1`
   - 判定：**认可**
   - 证据：本轮 rollout 已把 canonical user-local truth 收敛到 `user-config.yaml`；global theme 继续按“整份 theme-only 文档”覆盖写入，会直接删除同文件内的 remote-api defaults / secret selectors，属于真实数据丢失回归。
   - 处理：将 global theme persistence 改为基于 canonical user-config merge 更新，只修改 `ui.react.theme`，并补测试证明已有 `workspace.mode_preference` / `tools.codex.remoteApi.*` 不会被覆盖。
2. `2.2`
   - 判定：**认可**
   - 证据：connect authoring path 已把 supported surface 的 `credentialEnvVar` 作为 canonical default truth 之一；projection path 若缺少同一 materialization，会让 identical remote-api setup 因来源不同而产生 shape drift。
   - 处理：projection path 复用相同 default env-var mapping，并补充 model-only user-config regression coverage。

## 修复执行记录（2026-04-12）

1. `2.1`：已完成
   - 变更文件：`apps/cli/src/runtime/global-cli-theme-preference-service.ts`、`apps/cli/src/commands/workspace-command.ts`、`apps/cli/test/commands/workspace-command.test.ts`
   - 验证：`pnpm run build`（通过）；`pnpm vitest run apps/cli/test/commands/workspace-command.test.ts`（通过）
   - 说明：global theme persistence 已改成 merge 更新 canonical `user-config.yaml`，不再覆盖无关 user-local truth。
2. `2.2`：已完成
   - 变更文件：`apps/cli/src/runtime/cli-user-config-projection-service.ts`、`apps/cli/test/connect-phase2.integration.test.ts`、`apps/cli/test/runtime/cli-user-config-projection-service.test.ts`
   - 验证：`pnpm run build`（通过）；`pnpm vitest run apps/cli/test/connect-phase2.integration.test.ts apps/cli/test/runtime/cli-user-config-projection-service.test.ts apps/cli/test/runtime/agent-onboarding-runtime.test.ts`（通过）
   - 说明：user-config projection 现在会为 supported remote-api surfaces materialize canonical `credentialEnvVar` default，和 connect authoring path 保持一致。

## 处置结果与剩余风险

1. 本轮 2 条 accepted finding 已修复，并通过 build 与 sprint-002 focused verification suite。
2. `CR-001` 已满足 `resolved` 条件；下一步需要启动 fresh reviewer recheck，确认当前 sprint 边界已无新增 actionable findings。
