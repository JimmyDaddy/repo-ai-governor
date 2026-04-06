# TK-562 freeze VS Code editor companion MVP extension contract and surface boundary

- Status: completed
- Date: 2026-04-05
- Task ID: `TK-562`
- Owner: `AI-Agent`
- Priority: `P1`
- Sprint: `sprint-002-vscode-editor-companion-mvp`
- Project: `project-048-governance-surface-clients-rollout`

## 1. 目标

冻结 VS Code companion MVP 的 extension contract、surface split、workspace-trust gating 与 webview 使用边界。

## 2. Expected Outputs

1. extension contract baseline
2. chat participant / views / commands / tools boundary
3. workspace trust gating policy

## 3. Execution Notes

1. 2026-04-05：随 `sprint-002-vscode-editor-companion-mvp` 激活切换为 `active`。
2. 2026-04-05：开始冻结 `apps/vscode-extension` 的 extension contract、surface split、workspace trust gating 与 detail-only webview boundary，禁止 extension host 维护 execution/session/policy shadow state。
3. 2026-04-05：已完成 `apps/vscode-extension` real app skeleton、manifest contract freeze、shared identifier/type seam、workspace trust manifest gating 与 manifest/code parity test，并通过 `pnpm run build`。
