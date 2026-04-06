# TK-563 implement Governor view container chat participant and editor local governed commands

- Status: completed
- Date: 2026-04-05
- Task ID: `TK-563`
- Owner: `AI-Agent`
- Priority: `P1`
- Sprint: `sprint-002-vscode-editor-companion-mvp`
- Project: `project-048-governance-surface-clients-rollout`

## 1. 目标

实现 Governor view container、`@governor` chat participant 与 editor-local governed commands/code actions。

## 2. Depends On

1. `TK-562`

## 3. Expected Outputs

1. lightweight view container
2. chat participant
3. commands / code actions

## 4. Execution Notes

1. 2026-04-05：在 `TK-562` contract freeze 完成后切入真实扩展实现，保持 `apps/vscode-extension` 为唯一 VS Code app surface。
2. 2026-04-05：已完成 Governor view container、`Execution Board / HITL Inbox / Workspace Context` lightweight views、detail-only `Review Detail` webview、`@governor` chat participant，以及 editor-local commands/code actions。
3. 2026-04-05：当前实现严格只消费 service-owned query/command seam 与 shared identifiers；extension host 仅保留 transient selection，不持有 execution/session/policy shadow truth。
