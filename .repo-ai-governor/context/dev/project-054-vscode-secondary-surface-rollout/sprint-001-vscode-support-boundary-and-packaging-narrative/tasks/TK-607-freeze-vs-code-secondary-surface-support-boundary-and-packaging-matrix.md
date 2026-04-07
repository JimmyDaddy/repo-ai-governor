# TK-607 freeze VS Code secondary surface support boundary and packaging matrix

- Status: completed
- Date: 2026-04-06
- Task ID: `TK-607`
- Owner: `AI-Agent`
- Priority: `P1`
- Sprint: `sprint-001-vscode-support-boundary-and-packaging-narrative`
- Project: `project-054-vscode-secondary-surface-rollout`

## 1. 任务目标

冻结 VS Code secondary surface support boundary 与 packaging matrix。

## 2. Depends On

1. `project-052` closeout recommended

## 3. Expected Outputs

1. support boundary
2. packaging matrix
3. formal declaration baseline

## 4. Execution Notes

1. 2026-04-06：任务创建，等待 `project-054` 激活。
2. 2026-04-07：`project-053` final closeout 已完成，任务切换为 `in_progress`，开始冻结 VS Code secondary surface support boundary 与 packaging matrix。
3. 2026-04-07：已冻结正式支持边界：`apps/vscode-extension` 现作为首选 secondary surface 仅在“已构建源码仓 + extension-development host”路径下正式支持；已发布 npm/tgz 包、VSIX 与 Marketplace 分发不在当前支持范围内，desktop 则继续保持 foundation-only 口径。
