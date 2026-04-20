# Code Review: sprint-001 contract/bootstrap/readiness cutover working tree recheck

- Status: resolved
- Date: 2026-04-18
- Reviewer: AI-Agent
- Task: `CR-004`
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

1. `apps/vscode-extension/src/runtime/vscode-extension-service-runtime.ts`
2. `apps/vscode-extension/test/vscode-extension-service-runtime.test.ts`
3. `packages/core-orchestration-service/src/local-orchestration-service-sidecar-client.ts`
4. `packages/core-orchestration-service/src/local-orchestration-service-sidecar-host.ts`
5. `packages/core-orchestration-service/src/local-orchestration-service-shell.ts`
6. `packages/core-orchestration-service/src/local-orchestration-service-workspace-ops-runtime.ts`
7. `packages/core-orchestration-service/src/types/interfaces/local-orchestration-service-sidecar.interface.ts`
8. `packages/core-orchestration-service/test/local-orchestration-service-workspace-ops-runtime.test.ts`
9. `packages/orchestration-service-client/src/index.ts`
10. `packages/orchestration-service-client/src/types/index.ts`
11. `packages/orchestration-service-client/src/types/interfaces/index.ts`
12. `packages/orchestration-service-client/src/types/interfaces/orchestration-service-client.interface.ts`

## 2. Findings

### 2.1 [P2] Sidecar secure-authoring path dropped the caller locale
- 位置: `packages/core-orchestration-service/src/local-orchestration-service-workspace-ops-runtime.ts:151`
- 问题描述: `querySecureAuthoring()`、`setUserConfigValue()`、`setManagedSecret()` 之前都没有把 locale 传给 embedded CLI，`executeCliJsonCommand()` 在 locale 缺失时会默认回退到 `en-US`。
- 影响: VS Code zh-CN 用户会在 secure-authoring 诊断、受管配置写入与 secret 写入结果里看到英文降级信息或 warning，违背 `CS-033` 对用户面文案 i18n 的要求。
- 建议: 把 locale 纳入 secure-authoring request DTO，并穿透 extension runtime、service client、sidecar host/shell、workspace-ops runtime；补 sidecar-backed 的 zh-CN 回归测试。

## 3. Notes

1. fresh reviewer round 4 的唯一 actionable finding 已在同一修复窗口闭环，没有遗留 `deferred` 项。
2. 本轮修复继续保持 sprint-001 边界，只补 secure-authoring i18n contract，不把后续 sprint 的 doctor/check/adopt 主路径能力提前混入。

## 4. Verification

1. `pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts packages/core-orchestration-service/test/local-orchestration-service-workspace-ops-runtime.test.ts`（通过）
2. `pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test packages/core-orchestration-service/test/local-orchestration-service-governance-temporary-bridge-catalog.test.ts packages/core-orchestration-service/test/local-orchestration-service-workspace-ops-runtime.test.ts packages/core-orchestration-service/test/local-orchestration-service-sidecar-client.timeout.test.ts`（通过）
3. `pnpm run build`（通过）
4. `pnpm run check`（通过）

## 复核结论（2026-04-18）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：secure-authoring query 与两类 mutation request 现在都显式携带 `locale`；`VsCodeExtensionServiceRuntime` 会把 VS Code 当前语言传给 sidecar-backed service seam，`LocalOrchestrationServiceWorkspaceOpsRuntime` 继续把它传入 CLI 调用。新增 service-runtime 与 workspace-ops runtime 测试覆盖 sidecar-backed `zh-CN` 路径。
   - 处理：已接受并修复。

### 验证命令
1. `pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts packages/core-orchestration-service/test/local-orchestration-service-workspace-ops-runtime.test.ts`（通过）
2. `pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test packages/core-orchestration-service/test/local-orchestration-service-governance-temporary-bridge-catalog.test.ts packages/core-orchestration-service/test/local-orchestration-service-workspace-ops-runtime.test.ts packages/core-orchestration-service/test/local-orchestration-service-sidecar-client.timeout.test.ts`（通过）
3. `pnpm run build`（通过）
4. `pnpm run check`（通过）

## 修复执行记录（2026-04-18）

1. `2.1`：已完成
   - 变更文件：`apps/vscode-extension/src/runtime/vscode-extension-service-runtime.ts`、`apps/vscode-extension/test/vscode-extension-service-runtime.test.ts`、`packages/core-orchestration-service/src/local-orchestration-service-sidecar-client.ts`、`packages/core-orchestration-service/src/local-orchestration-service-sidecar-host.ts`、`packages/core-orchestration-service/src/local-orchestration-service-shell.ts`、`packages/core-orchestration-service/src/local-orchestration-service-workspace-ops-runtime.ts`、`packages/core-orchestration-service/src/types/interfaces/local-orchestration-service-sidecar.interface.ts`、`packages/core-orchestration-service/test/local-orchestration-service-workspace-ops-runtime.test.ts`、`packages/orchestration-service-client/src/index.ts`、`packages/orchestration-service-client/src/types/index.ts`、`packages/orchestration-service-client/src/types/interfaces/index.ts`、`packages/orchestration-service-client/src/types/interfaces/orchestration-service-client.interface.ts`
   - 验证：`pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts packages/core-orchestration-service/test/local-orchestration-service-workspace-ops-runtime.test.ts`（通过）
   - 说明：locale 现在会贯穿 secure-authoring 的 sidecar/service/CLI 全链路，避免 zh-CN 用户在 VS Code 主路径上看到英文回退文案。
