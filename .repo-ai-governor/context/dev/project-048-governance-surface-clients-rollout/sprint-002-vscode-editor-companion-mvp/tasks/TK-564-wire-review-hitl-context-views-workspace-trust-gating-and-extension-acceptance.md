# TK-564 wire review hitl context views workspace trust gating and extension acceptance

- Status: completed
- Date: 2026-04-05
- Task ID: `TK-564`
- Owner: `AI-Agent`
- Priority: `P1`
- Sprint: `sprint-002-vscode-editor-companion-mvp`
- Project: `project-048-governance-surface-clients-rollout`

## 1. 目标

接通 `Review / HITL / Context` views、workspace trust gating 与 extension acceptance，使 VS Code MVP 可用于真实 editor companion 流程。

## 2. Depends On

1. `TK-562`
2. `TK-563`

## 3. Expected Outputs

1. review/hitl/context views
2. workspace trust gating
3. extension acceptance evidence

## 4. Execution Notes

1. 2026-04-05：在 `TK-563` code surface 完成后切入 acceptance 收口，补齐 review/HITL/context views、workspace trust runtime gating 与 acceptance evidence。
2. 2026-04-05：已完成 service-backed review detail webview、HITL decision tree nodes、workspace context surface、runtime trust gate 与 `workspaceContains:.repo-ai-governor` activation。
3. 2026-04-05：已通过 `pnpm exec vitest run apps/vscode-extension/test/vscode-extension-contract.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts`、`pnpm run build`、`pnpm run check:ide-entry-smoke`、`pnpm run check:ide-docs-parity` 与 `pnpm exec biome check apps/vscode-extension/src apps/vscode-extension/test apps/vscode-extension/package.json apps/vscode-extension/README.md`，当前进入 reviewer 子 agent CR closeout。
4. 2026-04-05：reviewer 子 agent 第二轮复审返回 `No actionable findings.`，`TK-564` 与 `sprint-002` reviewer loop 收口完成。
