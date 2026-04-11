# Code Review: sprint-001 user-config and secret foundation round 3

- Status: resolved
- Date: 2026-04-12
- Reviewer: AI-Agent
- Task: `CR-003`
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
3. `apps/cli/src/runtime/secrets/cli-secret-index-service.ts`
4. `apps/cli/src/runtime/secrets/cli-secret-service.ts`
5. `apps/cli/src/types/interfaces/cli-user-config.interface.ts`
6. `apps/cli/test/runtime/cli-user-config-service.test.ts`
7. `apps/cli/test/runtime/cli-secret-service.test.ts`
8. `apps/cli/test/cli-output-contract.integration.test.ts`

## 2. Findings

### 2.1 [P1] `config unset ui.react.theme` cannot suppress legacy theme fallback

- 位置: `apps/cli/src/runtime/cli-user-config-service.ts:133`, `apps/cli/src/commands/config-command.ts:199`
- 问题描述: 旧实现把 `loadConfig()` 的 merged 视图直接拿去做 `unset` 持久化，写回的 canonical 文档里并没有保留“显式清空 theme”的语义；一旦 `cli-preferences.yaml` 仍存在合法 theme，下一次读取又会重新 merge 回 `ui.react.theme`。
- 影响: 用户执行 `config unset ui.react.theme` 后仍会持续看到旧 theme 生效，导致 canonical `user-config.yaml` 与实际解析结果不一致，`config unset` 失去可信度。
- 建议: 将 canonical 读写与 legacy 兼容读取分离，并为 theme 清空写入一个能阻断 legacy fallback 的显式 tombstone，同时补回归测试。

### 2.2 [P1] secret resolution can return stale data from the wrong backend

- 位置: `apps/cli/src/runtime/secrets/cli-secret-index-service.ts:94`, `apps/cli/src/runtime/secrets/cli-secret-service.ts:320`
- 问题描述: 旧实现总是先按全局 default backend 顺序解析 secret，再把 indexed backend 作为补充；同时 index write path 会对 backend 列表排序而不是保留“最近成功写入优先”的语义。这样当同一 key 先后落在多个 backend 时，`resolveSecretValue()` 可能优先取回较旧 backend 的 stale value。
- 影响: `secret://...` selector 可能在不报错的情况下解析到错误 backend，直接破坏 secret truthfulness，并让诊断结果与用户最近一次写入行为不一致。
- 建议: 让 index metadata 记录最近成功写入的 backend 优先级，并让 resolution 先尝试 per-key indexed order，再回退到全局 backend 顺序；同时补回归测试覆盖多 backend 重写场景。

## 3. Notes

1. 这两条都属于用户可见行为错误，不是纯实现细节优化：前者破坏 `config unset` 合约，后者破坏 `secret://` selector 的 truthfulness。
2. 本轮修复刻意保持 patch 边界最小，只调整 canonical/legacy config read-write seam 与 secret backend ordering，不改动既有 CLI surface 或 selector schema。

## 4. Verification

1. `pnpm run build`（通过）
2. `pnpm vitest run apps/cli/test/commands/secret-command.test.ts apps/cli/test/runtime/cli-secret-service.test.ts apps/cli/test/runtime/cli-user-config-service.test.ts apps/cli/test/cli-output-contract.integration.test.ts apps/cli/test/cli-skeleton.integration.test.ts apps/cli/test/commands/workspace-command.test.ts`（通过）

## 复核结论（2026-04-12）

- 整体结论：**认可**

### 逐条复核

1. `2.1`
   - 判定：**认可**
   - 证据：`config unset` 的 contract 应该能稳定清除该 key 的解析结果；当前 legacy merge seam 会让被 unset 的 theme 在下一次读时复活，属于明确的 user-visible regression。
   - 处理：新增 canonical-only `loadCanonicalConfig()` 写入入口，`config set/unset` 改为基于 canonical 文档变更；`ui.react.theme` 在 unset 时落一个显式 `null` tombstone 来阻断 legacy fallback，并补 service + CLI integration 回归测试。

2. `2.2`
   - 判定：**认可**
   - 证据：`secret://` selector 必须返回当前 key 的 authoritative value；若 resolution 先走全局 backend 顺序而不是 per-key 最新 backend 顺序，就会在多 backend 重写后返回 stale secret。
   - 处理：`CliSecretIndexService.recordBackend()` 改为把最近成功写入的 backend 提到首位，`CliSecretService.resolveCandidateBackendIds()` 改为先尊重 indexed order，再回退到全局 backend 顺序，并补多 backend 重写回归测试。

### 验证命令

1. `pnpm run build`（通过）
2. `pnpm vitest run apps/cli/test/commands/secret-command.test.ts apps/cli/test/runtime/cli-secret-service.test.ts apps/cli/test/runtime/cli-user-config-service.test.ts apps/cli/test/cli-output-contract.integration.test.ts apps/cli/test/cli-skeleton.integration.test.ts apps/cli/test/commands/workspace-command.test.ts`（通过）

## 修复执行记录（2026-04-12）

1. `2.1`：已完成
   - 变更文件：`apps/cli/src/runtime/cli-user-config-service.ts`、`apps/cli/src/commands/config-command.ts`、`apps/cli/src/types/interfaces/cli-user-config.interface.ts`、`apps/cli/test/runtime/cli-user-config-service.test.ts`、`apps/cli/test/cli-output-contract.integration.test.ts`
   - 验证：`pnpm run build`（通过）；`pnpm vitest run apps/cli/test/commands/secret-command.test.ts apps/cli/test/runtime/cli-secret-service.test.ts apps/cli/test/runtime/cli-user-config-service.test.ts apps/cli/test/cli-output-contract.integration.test.ts apps/cli/test/cli-skeleton.integration.test.ts apps/cli/test/commands/workspace-command.test.ts`（通过）
   - 说明：canonical config 写入已与 legacy compatibility read 解耦；`config unset ui.react.theme` 现在会持久化一个显式 tombstone，后续 `config get` 不会再被 legacy theme resurrect。

2. `2.2`：已完成
   - 变更文件：`apps/cli/src/runtime/secrets/cli-secret-index-service.ts`、`apps/cli/src/runtime/secrets/cli-secret-service.ts`、`apps/cli/test/runtime/cli-secret-service.test.ts`
   - 验证：`pnpm run build`（通过）；`pnpm vitest run apps/cli/test/commands/secret-command.test.ts apps/cli/test/runtime/cli-secret-service.test.ts apps/cli/test/runtime/cli-user-config-service.test.ts apps/cli/test/cli-output-contract.integration.test.ts apps/cli/test/cli-skeleton.integration.test.ts apps/cli/test/commands/workspace-command.test.ts`（通过）
   - 说明：secret resolution 现已优先按该 key 最近成功写入的 indexed backend 顺序解析，只有 index 未覆盖的 backend 才会回退到全局顺序。

## 处置结果与剩余风险

1. 本轮 2 条 accepted finding 均已修复，并通过 build 与定向 CLI regression suite。
2. `CR-003` 已满足 `resolved` 条件，可以继续进入下一轮 fresh review。
