# Code Review: sprint-001 contract/bootstrap/readiness cutover working tree recheck

- Status: resolved
- Date: 2026-04-18
- Reviewer: AI-Agent
- Task: `CR-003`
- Review Type: working tree review
- Normative References:
  - `AGENTS.md`
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/cr-lifecycle-threshold-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/execution-gate-layering-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/task-ledger-single-write-source-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`

## 1. Review Scope

1. `packages/core-orchestration-service/src/types/interfaces/local-orchestration-service-sidecar.interface.ts`
2. `packages/core-orchestration-service/src/local-orchestration-service-sidecar-client.ts`
3. `packages/core-orchestration-service/src/local-orchestration-service-workspace-ops-runtime.ts`
4. `packages/core-orchestration-service/test/local-orchestration-service-sidecar-client.timeout.test.ts`
5. `packages/core-orchestration-service/test/local-orchestration-service-workspace-ops-runtime.test.ts`

## 2. Findings

### 2.1 [P1] Workspace operations still inherited the generic 10-second sidecar RPC timeout
- 位置: `packages/core-orchestration-service/src/local-orchestration-service-sidecar-client.ts:383`
- 问题描述: `RUN_WORKSPACE_OPERATION` 之前复用了 sidecar client 的通用 `requestTimeoutMs`，默认只有 `10000ms`，而 `bootstrap`、`doctor`、`check`、`host pack` 这类操作在真实仓库里可能继续在 sidecar 侧执行更久。
- 影响: VS Code 主路径会过早报超时，用户看到失败，但 sidecar/CLI 仍可能继续执行，导致 receipt、artifact 和 UI 认知分叉。
- 建议: 给 workspace-operation RPC 引入单独的长超时预算，并补测试证明它不会退回到通用 `10s` 超时。

### 2.2 [P2] `HOST_PACK` fallback bundle directory ignored the selected host
- 位置: `packages/core-orchestration-service/src/local-orchestration-service-workspace-ops-runtime.ts:533`
- 问题描述: `HOST_PACK` 在缺少显式 `bundleDir` 时之前会落到固定目录，无法根据 `host` 推导目标 bundle 路径。
- 影响: 多 host 打包时可能把 bundle 写到错误目录，导致后续 verify/install smoke 使用了错误产物。
- 建议: fallback 路径应基于 `host` 推导，并增加防回归测试覆盖 `codex` 等非默认 host。

## 3. Notes

1. fresh reviewer round 3 的 2 条 actionable findings 都已在同一修复窗口闭环，没有遗留 `deferred` 项。
2. 本轮修复仍然只收敛 sprint-001 的 bootstrap/readiness 边界，不提前引入 sprint-002 之后的 doctor/check/adopt 主路径扩展。

## 4. Verification

1. `pnpm exec vitest run --config vitest.packages.config.ts packages/core-orchestration-service/test/local-orchestration-service-workspace-ops-runtime.test.ts packages/core-orchestration-service/test/local-orchestration-service-sidecar-client.timeout.test.ts`（通过）
2. `pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test packages/core-orchestration-service/test/local-orchestration-service-governance-temporary-bridge-catalog.test.ts packages/core-orchestration-service/test/local-orchestration-service-workspace-ops-runtime.test.ts packages/core-orchestration-service/test/local-orchestration-service-sidecar-client.timeout.test.ts`（通过）
3. `pnpm run build`（通过）

## 复核结论（2026-04-18）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：`LocalOrchestrationServiceSidecarClient` 现在对 `RUN_WORKSPACE_OPERATION` 走单独的 `workspaceOperationRequestTimeoutMs`，默认预算提升到 `300000ms`；新测试覆盖 generic `requestTimeoutMs=10ms` 但 workspace-op 仍保留更长预算的分支。
   - 处理：已接受并修复。
2. `2.2`
   - 判定：**认可**
   - 证据：`LocalOrchestrationServiceWorkspaceOpsRuntime` 现在按 `host` 推导 `HOST_PACK` 的默认 `bundleDir`，`codex` 会落到 `/generated/bundles/codex`；新增测试覆盖 host-derived fallback 路径。
   - 处理：已接受并修复。

### 验证命令
1. `pnpm exec vitest run --config vitest.packages.config.ts packages/core-orchestration-service/test/local-orchestration-service-workspace-ops-runtime.test.ts packages/core-orchestration-service/test/local-orchestration-service-sidecar-client.timeout.test.ts`（通过）
2. `pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test packages/core-orchestration-service/test/local-orchestration-service-governance-temporary-bridge-catalog.test.ts packages/core-orchestration-service/test/local-orchestration-service-workspace-ops-runtime.test.ts packages/core-orchestration-service/test/local-orchestration-service-sidecar-client.timeout.test.ts`（通过）
3. `pnpm run build`（通过）

## 修复执行记录（2026-04-18）

1. `2.1`：已完成
   - 变更文件：`packages/core-orchestration-service/src/types/interfaces/local-orchestration-service-sidecar.interface.ts`、`packages/core-orchestration-service/src/local-orchestration-service-sidecar-client.ts`、`packages/core-orchestration-service/test/local-orchestration-service-sidecar-client.timeout.test.ts`
   - 验证：`pnpm exec vitest run --config vitest.packages.config.ts packages/core-orchestration-service/test/local-orchestration-service-sidecar-client.timeout.test.ts`（通过）
   - 说明：workspace-operation RPC 现在不会再继承通用 10 秒预算，避免 service 仍在执行时 VS Code 端误判超时。
2. `2.2`：已完成
   - 变更文件：`packages/core-orchestration-service/src/local-orchestration-service-workspace-ops-runtime.ts`、`packages/core-orchestration-service/test/local-orchestration-service-workspace-ops-runtime.test.ts`
   - 验证：`pnpm exec vitest run --config vitest.packages.config.ts packages/core-orchestration-service/test/local-orchestration-service-workspace-ops-runtime.test.ts`（通过）
   - 说明：`HOST_PACK` fallback bundle 目录现在跟随 `host` 推导，避免不同 host 产物互相覆盖。
