# Code Review: sprint-001 contract/bootstrap/readiness cutover working tree recheck

- Status: resolved
- Date: 2026-04-18
- Reviewer: AI-Agent
- Task: `CR-008`
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

1. `apps/vscode-extension/package.json`
2. `apps/vscode-extension/package.nls.json`
3. `apps/vscode-extension/package.nls.zh-cn.json`
4. `apps/vscode-extension/src/constants`
5. `apps/vscode-extension/src/runtime`
6. `apps/vscode-extension/src/types/interfaces/vscode-extension-surface.interface.ts`
7. `apps/vscode-extension/test`
8. `packages/core-orchestration-service/src/constants/local-orchestration-service-sidecar.constant.ts`
9. `packages/core-orchestration-service/src/local-orchestration-service-governance-temporary-bridge-catalog.ts`
10. `packages/core-orchestration-service/src/local-orchestration-service-shell.ts`
11. `packages/core-orchestration-service/src/local-orchestration-service-sidecar-client.ts`
12. `packages/core-orchestration-service/src/local-orchestration-service-sidecar-host.ts`
13. `packages/core-orchestration-service/src/local-orchestration-service-workspace-ops-runtime.ts`
14. `packages/core-orchestration-service/src/types/interfaces/local-orchestration-service-sidecar.interface.ts`
15. `packages/core-orchestration-service/test/local-orchestration-service-governance-temporary-bridge-catalog.test.ts`
16. `packages/core-orchestration-service/test/local-orchestration-service-sidecar-client.timeout.test.ts`
17. `packages/core-orchestration-service/test/local-orchestration-service-workspace-ops-runtime.test.ts`
18. `packages/orchestration-service-client/src/constants`
19. `packages/orchestration-service-client/src/index.ts`
20. `packages/orchestration-service-client/src/types`

## 2. Findings

### 2.1 [P1] Temporary bridge CTA still presents immediate execution as staging
- 位置: `apps/vscode-extension/src/runtime/vscode-extension-presentation-builder.ts:1531`
- 问题描述: tree command title 与 workflow studio action label 仍使用 “Stage bridge command” / “预填 bridge 命令”，但 `repoAiGovernor.stageTemporaryBridge` 现在会直接触发 `runWorkspaceOperationWithFeedback(...)` 执行 service-backed workspace operation，而不是只做无副作用的预填。
- 影响: 用户可能把 adopt apply、host pack、upgrade apply 之类的写操作误判为“仅预填/仅预览”步骤，从而在 sprint-001 收口窗口留下 operator-facing safety regression。
- 建议: 将 CTA 与对应 tree-command 标题改为 run/execute 语义，并仅在只读 preview 节点保留 preview wording。

## 3. Notes

1. reviewer round 8 未再提出第二条 blocker；sidecar RPC 缺少端到端 IPC 集成覆盖被记为 non-blocking residual。
2. 本轮目标仍是确认 sprint-001 是否可以 closeout，因此任何 operator-facing execution affordance drift 都按 blocker 处理。

## 4. Verification

1. `pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test packages/core-orchestration-service/test/local-orchestration-service-governance-temporary-bridge-catalog.test.ts packages/core-orchestration-service/test/local-orchestration-service-workspace-ops-runtime.test.ts packages/core-orchestration-service/test/local-orchestration-service-sidecar-client.timeout.test.ts`（通过，reviewer round evidence）
2. `pnpm run build`（通过，reviewer round evidence）
3. `pnpm run check`（通过，reviewer round evidence）

## 复核结论（2026-04-18）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：`repoAiGovernor.stageTemporaryBridge` 已从“预填命令”变为直接执行 service-backed workspace operation，但 workflow studio action 与 tree command title 仍使用 staging wording，确实会把写操作伪装成低风险预填步骤。
   - 处理：接受修复，统一将 operator-facing CTA/title 改为 run semantics，并保留独立的 command preview 节点承载只读预览文案。

### 验证命令
1. `pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test packages/core-orchestration-service/test/local-orchestration-service-governance-temporary-bridge-catalog.test.ts packages/core-orchestration-service/test/local-orchestration-service-workspace-ops-runtime.test.ts packages/core-orchestration-service/test/local-orchestration-service-sidecar-client.timeout.test.ts`（通过，reviewer round evidence）
2. `pnpm run build`（通过，reviewer round evidence）
3. `pnpm run check`（通过，reviewer round evidence）

## 修复执行记录（2026-04-18）

1. `2.1`：已完成
   - 变更文件：`apps/vscode-extension/src/runtime/vscode-extension-presentation-builder.ts`、`apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts`
   - 验证：`pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test packages/core-orchestration-service/test/local-orchestration-service-governance-temporary-bridge-catalog.test.ts packages/core-orchestration-service/test/local-orchestration-service-workspace-ops-runtime.test.ts packages/core-orchestration-service/test/local-orchestration-service-sidecar-client.timeout.test.ts`、`pnpm run build`、`pnpm run check`（均通过）
   - 说明：workflow studio action label 与 temporary bridge tree command title 已统一改为 run semantics，并补了 presentation builder 回归断言，防止再把立即执行的 bridge operation 描述成 staging step。
