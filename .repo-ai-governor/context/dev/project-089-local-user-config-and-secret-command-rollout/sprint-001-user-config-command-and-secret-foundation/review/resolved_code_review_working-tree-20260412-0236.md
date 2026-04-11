# Code Review: sprint-001 user-config and secret foundation round 4

- Status: resolved
- Date: 2026-04-12
- Reviewer: AI-Agent
- Task: `CR-004`
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

1. `apps/cli/src/cli-governance-runtime.ts`
2. `apps/cli/src/commands/config-command.ts`
3. `apps/cli/src/commands/secret-command.ts`
4. `apps/cli/src/runtime/cli-user-config-service.ts`
5. `apps/cli/src/runtime/secrets/**`
6. `apps/cli/src/main.ts`
7. `apps/cli/test/commands/secret-command.test.ts`
8. `apps/cli/test/runtime/cli-secret-service.test.ts`
9. `apps/cli/test/runtime/cli-user-config-service.test.ts`
10. `apps/cli/test/cli-output-contract.integration.test.ts`
11. `apps/cli/test/cli-skeleton.integration.test.ts`
12. `apps/cli/test/commands/workspace-command.test.ts`

## 2. Findings

### 2.1 [P2] `config` / `secret` commands still auto-bootstrap a workspace

- 位置: `apps/cli/src/cli-governance-runtime.ts:309`
- 问题描述: `shouldEnsureWorkspaceBootstrap()` 旧实现会对除 `workspace` 外的所有命令返回 `true`，导致 `config status` 与 `secret status` 这类 user-local command 在 fresh HOME 上也会隐式创建 `~/.repo-ai-governor/workspaces/<id>/.repo-ai-governor/governor.yaml`。
- 影响: `config` / `secret` 本应只操作 user-local defaults 与 secret backend surface，但运行时却额外 materialize workspace tree，破坏了该命令面的 boundary，并引入隐藏副作用。
- 建议: 将 `config` / `secret` 从 auto-bootstrap 命令集合中排除，并补集成测试确保这些命令不会创建 workspace tree。

## 3. Notes

1. reviewer 额外提示 `remoteApi.credentialRef` 目前只校验 `secret://` 前缀、未进一步约束 selector 语法；考虑到 sprint-001 仍把它视为 opaque/manual-reference metadata，本轮先记录为 residual risk，不单独升级为 actionable finding。
2. 本轮修复只调整 workspace bootstrap gate，不改动 config/secret command 的 user-local config 与 secret backend contract。

## 4. Verification

1. `pnpm run build`（通过）
2. `pnpm vitest run apps/cli/test/commands/secret-command.test.ts apps/cli/test/runtime/cli-secret-service.test.ts apps/cli/test/runtime/cli-user-config-service.test.ts apps/cli/test/cli-output-contract.integration.test.ts apps/cli/test/cli-skeleton.integration.test.ts apps/cli/test/commands/workspace-command.test.ts`（通过）

## 复核结论（2026-04-12）

- 整体结论：**认可**

### 逐条复核

1. `2.1`
   - 判定：**认可**
   - 证据：`config` / `secret` 的职责明确落在 user-local config 与 secret backend surface，上述命令不应在只读或 user-local 操作时隐式创建 workspace tree；这个副作用会让 fresh HOME 上的行为与命令语义不一致。
   - 处理：在 runtime bootstrap gate 里显式豁免 `config` / `secret`，并新增 integration regression test 覆盖 `config status` 与 `secret status` 不创建 `~/.repo-ai-governor/workspaces`。

### 验证命令

1. `pnpm run build`（通过）
2. `pnpm vitest run apps/cli/test/commands/secret-command.test.ts apps/cli/test/runtime/cli-secret-service.test.ts apps/cli/test/runtime/cli-user-config-service.test.ts apps/cli/test/cli-output-contract.integration.test.ts apps/cli/test/cli-skeleton.integration.test.ts apps/cli/test/commands/workspace-command.test.ts`（通过）

## 修复执行记录（2026-04-12）

1. `2.1`：已完成
   - 变更文件：`apps/cli/src/cli-governance-runtime.ts`、`apps/cli/test/cli-output-contract.integration.test.ts`
   - 验证：`pnpm run build`（通过）；`pnpm vitest run apps/cli/test/commands/secret-command.test.ts apps/cli/test/runtime/cli-secret-service.test.ts apps/cli/test/runtime/cli-user-config-service.test.ts apps/cli/test/cli-output-contract.integration.test.ts apps/cli/test/cli-skeleton.integration.test.ts apps/cli/test/commands/workspace-command.test.ts`（通过）
   - 说明：`config` / `secret` 已不再触发 workspace auto-bootstrap，新增 regression test 证明它们在 fresh HOME 上不会创建 workspace tree。

## 处置结果与剩余风险

1. 本轮 1 条 accepted finding 已修复，并通过 build 与定向 CLI regression suite。
2. `CR-004` 已满足 `resolved` 条件；若后续不再出现新 finding，sprint-001 可以进入 `TK-791` closeout / sprint-002 activation handoff。
