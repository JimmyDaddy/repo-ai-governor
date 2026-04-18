# Code Review: sprint-001 contract/bootstrap/readiness cutover working tree recheck

- Status: resolved
- Date: 2026-04-18
- Reviewer: AI-Agent
- Task: `CR-007`
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

1. `packages/orchestration-service-client/src/constants/orchestration-service.constant.ts`
2. `packages/orchestration-service-client/src/constants/index.ts`
3. `packages/orchestration-service-client/src/index.ts`
4. `packages/orchestration-service-client/src/types/interfaces/orchestration-service-client.interface.ts`
5. `packages/core-orchestration-service/src/local-orchestration-service-workspace-ops-runtime.ts`
6. `packages/core-orchestration-service/test/local-orchestration-service-workspace-ops-runtime.test.ts`
7. `apps/vscode-extension/src/runtime/vscode-extension-presentation-builder.ts`
8. `apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts`

## 2. Findings

### 2.1 [P2] Bootstrap readiness actions were still untyped cross-package string ids
- 位置: `packages/orchestration-service-client/src/types/interfaces/orchestration-service-client.interface.ts:497`
- 问题描述: bootstrap readiness DTO 仍将 `recommendedActions` 暴露为 `string[]`，同时 service producer 与 VS Code presenter 分别硬编码相同 action id；任何后续改名或新增 action 都可能静默退化到 generic UI guidance，而不是在 contract 边界上编译失败。
- 影响: sprint-001 正在收口 bootstrap/readiness cutover，如果这个 finite-set contract 继续散落在多个包里，后续 drift 会绕过类型系统并在 workbench 上以运行时降级的方式暴露。
- 建议: 把 bootstrap readiness action 提升为 `@repo-ai-governor/orchestration-service-client` 导出的共享 enum/常量，并将 DTO、producer、consumer 和测试全部切到同一类型来源。

## 3. Notes

1. fresh reviewer round 7 重新评估了 `core-orchestration-service -> @repo-ai-governor/cli` 的包装风险，但没有把它升级为 sprint-001 blocker。
2. `vscode-extension-presentation-builder.ts` 中 “Stage bridge command” 的命令文案仍有轻微 UX 漂移；当前 round 记为 non-blocking residual。

## 4. Verification

1. `pnpm exec vitest run --config vitest.packages.config.ts packages/core-orchestration-service/test/local-orchestration-service-workspace-ops-runtime.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts`（通过）
2. `pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test packages/core-orchestration-service/test/local-orchestration-service-governance-temporary-bridge-catalog.test.ts packages/core-orchestration-service/test/local-orchestration-service-workspace-ops-runtime.test.ts packages/core-orchestration-service/test/local-orchestration-service-sidecar-client.timeout.test.ts`（通过）
3. `pnpm run build`（通过）
4. `pnpm run check`（通过）

## 复核结论（2026-04-18）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：bootstrap readiness action 当前确实由 service producer 发出裸字符串、DTO 暴露为 `string[]`、presenter 再次用裸字符串 switch 消费，符合 `CS-009`/`CS-032` 所定义的 finite-set contract 漂移风险。
   - 处理：接受修复，已将该 finite set 提升为 shared exported enum，并让 DTO、producer、consumer 与测试统一复用。

### 验证命令
1. `pnpm exec vitest run --config vitest.packages.config.ts packages/core-orchestration-service/test/local-orchestration-service-workspace-ops-runtime.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts`（通过）
2. `pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test packages/core-orchestration-service/test/local-orchestration-service-governance-temporary-bridge-catalog.test.ts packages/core-orchestration-service/test/local-orchestration-service-workspace-ops-runtime.test.ts packages/core-orchestration-service/test/local-orchestration-service-sidecar-client.timeout.test.ts`（通过）
3. `pnpm run build`（通过）
4. `pnpm run check`（通过）

## 修复执行记录（2026-04-18）

1. `2.1`：已完成
   - 变更文件：`packages/orchestration-service-client/src/constants/orchestration-service.constant.ts`、`packages/orchestration-service-client/src/constants/index.ts`、`packages/orchestration-service-client/src/index.ts`、`packages/orchestration-service-client/src/types/interfaces/orchestration-service-client.interface.ts`、`packages/core-orchestration-service/src/local-orchestration-service-workspace-ops-runtime.ts`、`packages/core-orchestration-service/test/local-orchestration-service-workspace-ops-runtime.test.ts`、`apps/vscode-extension/src/runtime/vscode-extension-presentation-builder.ts`、`apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts`
   - 验证：`pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test packages/core-orchestration-service/test/local-orchestration-service-governance-temporary-bridge-catalog.test.ts packages/core-orchestration-service/test/local-orchestration-service-workspace-ops-runtime.test.ts packages/core-orchestration-service/test/local-orchestration-service-sidecar-client.timeout.test.ts`（通过）
   - 说明：bootstrap readiness action 已提升为 shared exported enum，DTO、producer、consumer 和测试均切到同一 finite-set contract，不再依赖跨包裸字符串配对。
