# Code Review: sprint-001 user-config and secret foundation round 1

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
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/local-user-config-and-secret-command-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/local-user-config-defaults-and-secret-backed-credential-resolution.md`

## 1. Review Scope

1. `apps/cli/src/runtime/cli-user-config-service.ts`
2. `apps/cli/src/commands/config-command.ts`
3. `apps/cli/src/commands/secret-command.ts`
4. `apps/cli/src/runtime/secrets/**`
5. `apps/cli/src/runtime/global-cli-theme-preference-service.ts`
6. `apps/cli/src/main.ts`
7. `apps/cli/src/cli-governance-runtime.ts`
8. `apps/cli/src/constants/cli-command.constant.ts`
9. `apps/cli/src/constants/cli-governance-runtime.constant.ts`
10. `apps/cli/src/constants/cli-output.constant.ts`
11. `apps/cli/src/types/interfaces/cli-config-command.interface.ts`
12. `apps/cli/src/types/interfaces/cli-secret-command.interface.ts`
13. `apps/cli/src/types/interfaces/cli-user-config.interface.ts`
14. `apps/cli/src/types/interfaces/cli-governance-runtime.interface.ts`
15. `apps/cli/test/runtime/cli-user-config-service.test.ts`
16. `apps/cli/test/cli-output-contract.integration.test.ts`
17. `apps/cli/test/cli-skeleton.integration.test.ts`
18. `apps/cli/test/commands/workspace-command.test.ts`

## 2. Findings

### 2.1 [P1] Interactive no-echo secret prompt crashes before reading input

- 位置: `apps/cli/src/commands/secret-command.ts:504`
- 问题描述: `readSecretFromPrompt()` 用只实现了 `write()` 的假 output 调用 `readline.createInterface({ terminal: true })`，实际运行时会因为缺少 `on()` 等 stream 方法直接抛出 `output.on is not a function`。
- 影响: `secret set` 的 `no_echo_prompt` secure input mode 无法使用，违背 local-user-config / secret contract 对安全输入模式的最低要求。
- 建议: 换成满足 `readline` 预期接口的真实 muted writable stream，并补交互式 prompt 回归测试。

### 2.2 [P1] Backend-scoped delete clears sidecar index for secrets that were not deleted

- 位置: `apps/cli/src/runtime/secrets/cli-secret-service.ts:150`
- 问题描述: `deleteSecret()` 在显式指定 backend 且删除失败时，仍会执行 `removeBackend(keyName, null)` 清空整条 sidecar index 记录。
- 影响: 真实仍存在于其他 backend 的 secret 会从 `secret list` 结果中消失，删除反馈与 backend 真值漂移，存在危险的误清理信号。
- 建议: 仅在全 backend 删除且已无剩余记录时才移除整条 index；对显式 backend 删除失败场景保留其他 backend 记录，并补回归测试。

### 2.3 [P2] New config and secret failure paths bypass shared i18n

- 位置: `apps/cli/src/commands/config-command.ts:131`, `apps/cli/src/commands/secret-command.ts:78`, `apps/cli/src/runtime/cli-user-config-service.ts:339`, `apps/cli/src/runtime/secrets/cli-secret-service.ts:40`, `apps/cli/src/main.ts:2847`
- 问题描述: 新增 command/service/main failure guidance 直接输出英文字符串，没有统一走 shared i18n key。
- 影响: `--locale zh-CN` 下的新 surface 会泄露英文失败文案，违反 `CS-033` 的用户可见文案 i18n 基线。
- 建议: 把新增错误/提示文案补到 `packages/shared/src/i18n/locales/en-us.ts` 与 `packages/shared/src/i18n/locales/zh-cn.ts`，并统一通过 `translate()` 或 `I18nRuntime.t()` 消费。

## 3. Notes

1. 当前测试覆盖已包含 canonical config happy path 与 unsafe fallback import/list happy path，但尚未覆盖 interactive no-echo prompt、backend mismatch delete、以及 zh-CN 错误输出路径。
2. secret 输入目前会 `trim()`；若未来要承载 whitespace-sensitive secret，需要单独补 contract 与测试。

## 4. Verification

1. `pnpm run build`（通过）
2. `pnpm vitest run apps/cli/test/cli-skeleton.integration.test.ts apps/cli/test/cli-output-contract.integration.test.ts apps/cli/test/commands/workspace-command.test.ts apps/cli/test/runtime/cli-user-config-service.test.ts`（通过）
3. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
4. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
5. `node --input-type=module ... new CliSecretCommand().readSecretFromPrompt(...)`（复现 `output.on is not a function`）
6. `node --input-type=module ... new CliSecretService({...}).deleteSecret({ backendId: 'macos-keychain' })`（复现 sidecar index 被误清空）

## 复核结论（2026-04-12）

- 整体结论：**认可**

### 逐条复核

1. `2.1`
   - 判定：**认可**
   - 证据：`apps/cli/src/commands/secret-command.ts:504` 当前 no-echo prompt 路径把假 output object 传给 `readline.createInterface()`；主 agent 复现得到 `output.on is not a function`。
   - 处理：改为满足 `readline` 预期接口的 muted stream，并补交互式 prompt regression test。

2. `2.2`
   - 判定：**认可**
   - 证据：`apps/cli/src/runtime/secrets/cli-secret-service.ts:165` 在显式 backend 删除失败时仍会执行 `removeBackend(keyName, null)`；主 agent 复现后 `listSecrets()` 从有记录变为空数组。
   - 处理：调整 index 清理逻辑，只在全 backend 删除或确实无剩余记录时删除 sidecar entry，并补 mismatch-backend delete regression test。

3. `2.3`
   - 判定：**认可**
   - 证据：新增 config/secret/service/main failure path 存在多处英文硬编码，`--locale zh-CN` 下会直接漏出英文，违反 `CS-033`。
   - 处理：补齐 shared locale keys，并把新增用户可见错误/提示统一接到 `translate()` / `I18nRuntime.t()`。

### 验证命令

1. `pnpm run build`（通过）
2. `pnpm vitest run apps/cli/test/cli-skeleton.integration.test.ts apps/cli/test/cli-output-contract.integration.test.ts apps/cli/test/commands/workspace-command.test.ts apps/cli/test/runtime/cli-user-config-service.test.ts`（通过）
3. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
4. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
5. `node --input-type=module ... new CliSecretCommand().readSecretFromPrompt(...)`（通过，复现 crash）
6. `node --input-type=module ... new CliSecretService({...}).deleteSecret({ backendId: 'macos-keychain' })`（通过，复现 index drift）

## 修复执行记录（2026-04-12）

1. `2.1`：已完成
   - 变更文件：`apps/cli/src/commands/secret-command.ts`、`apps/cli/test/commands/secret-command.test.ts`
   - 验证：`pnpm vitest run apps/cli/test/commands/secret-command.test.ts apps/cli/test/runtime/cli-secret-service.test.ts apps/cli/test/runtime/cli-user-config-service.test.ts apps/cli/test/cli-output-contract.integration.test.ts apps/cli/test/cli-skeleton.integration.test.ts apps/cli/test/commands/workspace-command.test.ts`（通过）
   - 说明：默认 secure prompt 改为真实 muted writable stream，并支持注入测试用 prompt streams，interactive no-echo 路径已补回归测试。

2. `2.2`：已完成
   - 变更文件：`apps/cli/src/runtime/secrets/cli-secret-service.ts`、`apps/cli/test/runtime/cli-secret-service.test.ts`
   - 验证：`pnpm vitest run apps/cli/test/commands/secret-command.test.ts apps/cli/test/runtime/cli-secret-service.test.ts apps/cli/test/runtime/cli-user-config-service.test.ts apps/cli/test/cli-output-contract.integration.test.ts apps/cli/test/cli-skeleton.integration.test.ts apps/cli/test/commands/workspace-command.test.ts`（通过）
   - 说明：显式 backend 删除失败不再误清空 sidecar index；只有未指定 backend 且全候选删除都未命中时，才会清除整条索引记录。

3. `2.3`：已完成
   - 变更文件：`apps/cli/src/commands/config-command.ts`、`apps/cli/src/commands/secret-command.ts`、`apps/cli/src/runtime/cli-user-config-service.ts`、`apps/cli/src/runtime/secrets/cli-secret-backend.interface.ts`、`apps/cli/src/runtime/secrets/cli-secret-index-service.ts`、`apps/cli/src/runtime/secrets/cli-secret-service.ts`、`apps/cli/src/runtime/secrets/macos-keychain-secret-backend.ts`、`apps/cli/src/runtime/secrets/unsafe-local-file-secret-backend.ts`、`apps/cli/src/main.ts`、`apps/cli/test/cli-output-contract.integration.test.ts`
   - 验证：`pnpm run build`（通过）；`pnpm vitest run apps/cli/test/commands/secret-command.test.ts apps/cli/test/runtime/cli-secret-service.test.ts apps/cli/test/runtime/cli-user-config-service.test.ts apps/cli/test/cli-output-contract.integration.test.ts apps/cli/test/cli-skeleton.integration.test.ts apps/cli/test/commands/workspace-command.test.ts`（通过）
   - 说明：config/secret command、service、backend 与 CLI error guidance 现已统一接入 locale-aware localize bridge，并新增 zh-CN JSON error regression coverage。

## 处置结果与剩余风险

1. 3 条 accepted findings 均已修复，并补齐对应回归测试。
2. 当前修复窗口已包含 `pnpm run build` 与定向 CLI 测试证据，可支持本轮评审推进为 `resolved`。
3. secret 值仍沿用当前 contract 的 `trim()` 语义；若后续需要承载 whitespace-sensitive secret，需在后续 sprint 单独扩展 contract 与验证面。
