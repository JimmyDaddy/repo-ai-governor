# Code Review: sprint-001 user-config and secret foundation round 2

- Status: resolved
- Date: 2026-04-12
- Reviewer: AI-Agent
- Task: `CR-002`
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

## 1. Review Scope

1. `apps/cli/src/runtime/cli-user-config-service.ts`
2. `apps/cli/src/commands/config-command.ts`
3. `apps/cli/src/commands/secret-command.ts`
4. `apps/cli/src/runtime/secrets/**`
5. `apps/cli/src/main.ts`
6. `apps/cli/test/commands/secret-command.test.ts`
7. `apps/cli/test/runtime/cli-secret-service.test.ts`
8. `apps/cli/test/runtime/cli-user-config-service.test.ts`
9. `apps/cli/test/cli-output-contract.integration.test.ts`
10. `apps/cli/test/cli-skeleton.integration.test.ts`
11. `apps/cli/test/commands/workspace-command.test.ts`

## 2. Findings

### 2.1 [P1] unsafe-local-file fallback writes plaintext secrets without owner-only permissions

- 位置: `apps/cli/src/runtime/secrets/unsafe-local-file-secret-backend.ts:121`
- 问题描述: `writeDocument()` 只使用默认 `mkdir(..., { recursive: true })` 与 `writeFile(..., 'utf8')` 行为，没有把 fallback secret 目录和 `secrets.json` 收紧到 owner-only 权限。在常见 POSIX `umask=022` 下，生成的明文 secret 文件可能对同机其他本地用户可读。
- 影响: `unsafe-local-file` 虽然是显式 opt-in fallback，但当前实现会把“本地明文存储”的风险进一步放大成“共享主机本地用户可读”的真实泄漏面。
- 建议: 将目录和文件权限显式收敛到 `0700/0600` 或等价 owner-only 语义，并补一个权限回归测试。

### 2.2 [P2] secret value is silently mutated before persistence

- 位置: `apps/cli/src/commands/secret-command.ts:151`, `apps/cli/src/commands/secret-command.ts:396`, `apps/cli/src/commands/secret-command.ts:429`, `apps/cli/src/runtime/secrets/cli-secret-service.ts:145`
- 问题描述: `secret import`、`secret set --stdin`、interactive prompt 与 `CliSecretService.setSecret()` 都会对输入做 `trim()`，在写入 backend 前无提示地改写 leading/trailing whitespace。
- 影响: 对前后空白敏感的 secret 会被错误持久化，但命令仍回报成功，后续故障难以追溯到 mutation path。
- 建议: 保持 secret value 端到端按原样存储；如果只想兼容 shell 管道尾随换行，应缩窄为单一 terminal newline 处理，并补回归测试。

## 3. Notes

1. 这 2 条属于 reviewer 标注的 risk-based inference，但都直接落在 secret truthfulness / blast radius 上，具备行动价值。
2. 现有 targeted tests 已覆盖前一轮修复项，但在本轮 reviewer 返回前没有覆盖 owner-only permission hardening 与 whitespace-sensitive secret fidelity。

## 4. Verification

1. `pnpm run build`（通过）
2. `pnpm vitest run apps/cli/test/commands/secret-command.test.ts apps/cli/test/runtime/cli-secret-service.test.ts apps/cli/test/runtime/cli-user-config-service.test.ts apps/cli/test/cli-output-contract.integration.test.ts apps/cli/test/cli-skeleton.integration.test.ts apps/cli/test/commands/workspace-command.test.ts`（通过）

## 复核结论（2026-04-12）

- 整体结论：**认可**

### 逐条复核

1. `2.1`
   - 判定：**认可**
   - 证据：`unsafe-local-file` contract 明确要求 fallback backend 仅在显式 opt-in 且高噪声 warning 下使用；当前若仍允许 group/world-readable 的明文 secret 文件，就会把“受控本地 fallback”放大成共享主机本地泄漏面。
   - 处理：为 secret 目录/文件显式收紧 owner-only permissions，并补 POSIX mode regression test。

2. `2.2`
   - 判定：**认可**
   - 证据：当前 `env_import`、`stdin`、prompt 与 service write path 的 `trim()` 会无提示改写 secret truth，而 contract 并未授权 command surface 对 secret value 做静默归一化。
   - 处理：改为端到端保留原始 secret value；仅对 `stdin` 常见的单一 terminal newline 做最小剥离，并补 whitespace-fidelity regression coverage。

### 验证命令

1. `pnpm run build`（通过）
2. `pnpm vitest run apps/cli/test/commands/secret-command.test.ts apps/cli/test/runtime/cli-secret-service.test.ts apps/cli/test/runtime/cli-user-config-service.test.ts apps/cli/test/cli-output-contract.integration.test.ts apps/cli/test/cli-skeleton.integration.test.ts apps/cli/test/commands/workspace-command.test.ts`（通过）

## 修复执行记录（2026-04-12）

1. `2.1`：已完成
   - 变更文件：`apps/cli/src/runtime/secrets/unsafe-local-file-secret-backend.ts`、`apps/cli/test/runtime/cli-secret-service.test.ts`
   - 验证：`pnpm run build`（通过）；`pnpm vitest run apps/cli/test/commands/secret-command.test.ts apps/cli/test/runtime/cli-secret-service.test.ts apps/cli/test/runtime/cli-user-config-service.test.ts apps/cli/test/cli-output-contract.integration.test.ts apps/cli/test/cli-skeleton.integration.test.ts apps/cli/test/commands/workspace-command.test.ts`（通过）
   - 说明：unsafe fallback secret directory/file 现已显式 harden 到 owner-only mode，并新增 POSIX permission regression test。

2. `2.2`：已完成
   - 变更文件：`apps/cli/src/commands/secret-command.ts`、`apps/cli/src/runtime/secrets/cli-secret-service.ts`、`apps/cli/test/commands/secret-command.test.ts`、`apps/cli/test/cli-output-contract.integration.test.ts`
   - 验证：`pnpm run build`（通过）；`pnpm vitest run apps/cli/test/commands/secret-command.test.ts apps/cli/test/runtime/cli-secret-service.test.ts apps/cli/test/runtime/cli-user-config-service.test.ts apps/cli/test/cli-output-contract.integration.test.ts apps/cli/test/cli-skeleton.integration.test.ts apps/cli/test/commands/workspace-command.test.ts`（通过）
   - 说明：secret value 现已按原样写入 backend；只对 `stdin` 常见尾随单一换行做最小处理，并补齐 env import / prompt / stdin whitespace fidelity coverage。

## 处置结果与剩余风险

1. 本轮 2 条 accepted finding 均已修复，并通过 build 与定向 CLI regression suite。
2. 进入下一轮 fresh review 前，`CR-002` 已满足 `resolved` 条件。
