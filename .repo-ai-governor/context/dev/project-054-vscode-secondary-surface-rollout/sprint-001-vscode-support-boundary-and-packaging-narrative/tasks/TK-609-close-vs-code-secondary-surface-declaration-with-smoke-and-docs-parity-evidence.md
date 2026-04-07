# TK-609 close VS Code secondary surface declaration with smoke and docs parity evidence

- Status: completed
- Date: 2026-04-06
- Task ID: `TK-609`
- Owner: `AI-Agent`
- Priority: `P1`
- Sprint: `sprint-001-vscode-support-boundary-and-packaging-narrative`
- Project: `project-054-vscode-secondary-surface-rollout`

## 1. 任务目标

以 smoke 与 docs parity evidence 收口 VS Code secondary surface declaration。

## 2. Depends On

1. `TK-607`
2. `TK-608`

## 3. Expected Outputs

1. smoke evidence
2. docs parity evidence
3. sprint-001 closeout truth

## 4. Execution Notes

1. 2026-04-06：任务创建，等待 `TK-607 / TK-608` 完成。
2. 2026-04-07：已通过 `pnpm exec vitest run apps/vscode-extension/test/vscode-extension-contract.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts apps/vscode-extension/test/vscode-extension-selection-store.test.ts apps/vscode-extension/test/vscode-extension-packaging-boundary.test.ts --maxWorkers=1 --maxConcurrency=1`、`pnpm run build`、`pnpm run check:ide-entry-smoke`、`pnpm run check:ide-docs-parity` 与 `pnpm exec biome check apps/vscode-extension/src apps/vscode-extension/test apps/vscode-extension/package.json apps/vscode-extension/README.md`，当前 sprint-001 implementation boundary 已具备进入 fresh delegated review loop 的证据面。
