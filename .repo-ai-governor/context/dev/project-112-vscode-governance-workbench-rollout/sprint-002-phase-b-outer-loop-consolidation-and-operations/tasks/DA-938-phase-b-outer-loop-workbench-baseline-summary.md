# DA-938 phase-b outer-loop workbench baseline summary

- Status: completed
- Date: 2026-04-17
- Project: `project-112-vscode-governance-workbench-rollout`
- Sprint: `sprint-002-phase-b-outer-loop-consolidation-and-operations`
- Task: `TK-938`

## 1. Summary

1. Phase B 已把 `automation queue`、`artifact workbench`、`multi-workspace overview` 与 `typed CLI bridge governance` 接入 VS Code primary workbench baseline。
2. 新增的 outer-loop surface 继续只消费 service-owned `queryQueueOverview` 与 artifact-pane projection，不直接读取 `.repo-ai-governor/**` canonical files。
3. typed CLI bridge 仍保持 temporary path，但现在已经具备 typed capability class、receipt kind、backlink surface 与 exit criteria 的显式 contract，并在 VS Code 中只以“预填终端命令、不自动执行”的安全方式暴露。

## 2. Implemented Surface

1. `packages/orchestration-service-client/**` 新增 temporary bridge typed contract，并把该 contract 扩展到 `OrchestrationQueueOverviewQueryResponse`。
2. `packages/core-orchestration-service/**` 为 queue overview 增补 service-owned temporary bridge catalog，让 VS Code 可消费 Phase B bridge governance 元数据而不在 extension 内自造第二份真值。
3. `apps/vscode-extension/**` 新增 `automation queue` view、multi-workspace / parallel lane / temporary bridge overview nodes、typed bridge staging command，以及更完整的 artifact workbench detail rendering。
4. `apps/vscode-extension/test/**` 与 `packages/core-orchestration-service/test/**` 已补齐对应 contract/runtime/presenter/controller 回归覆盖。

## 3. Verification Evidence

1. `pnpm run build`
2. `pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-contract.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts`

## 4. Outputs

1. `apps/vscode-extension/package.json`
2. `apps/vscode-extension/src/runtime/vscode-extension-host.ts`
3. `apps/vscode-extension/src/runtime/vscode-extension-command-controller.ts`
4. `apps/vscode-extension/src/runtime/vscode-extension-presentation-builder.ts`
5. `packages/core-orchestration-service/src/local-orchestration-service-governance-temporary-bridge-catalog.ts`
6. `packages/core-orchestration-service/src/local-orchestration-service-queue-overview-query-runtime.ts`
7. `packages/orchestration-service-client/src/types/interfaces/orchestration-service-client.interface.ts`
