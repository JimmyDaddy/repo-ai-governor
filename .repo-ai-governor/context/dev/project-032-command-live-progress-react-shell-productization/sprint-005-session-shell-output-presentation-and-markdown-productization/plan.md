# sprint-005-session-shell-output-presentation-and-markdown-productization 计划

- Status: planned
- Date: 2026-03-31
- Project: `project-032-command-live-progress-react-shell-productization`
- Sprint Goal: 将已正式化的 session-shell output presentation 方向落成真实实现，补齐 transcript render-kind、assistant markdown renderer 与 presentation verification。

## 1. Task Package

1. `TK-460` implement structured transcript render-kind and session-shell message renderer split
2. `TK-461` integrate assistant markdown rendering and transcript presentation verification

## 2. Exit Criteria

1. transcript item contract 支持 `plain_text / markdown / system_notice / command_recap` 等 render-kind。
2. session-shell transcript pane 按 render-kind 分发 renderer，不再只依赖 `label + lines[]`。
3. assistant 完成态消息可进入 markdown rendering path，且 live progress 不进入 markdown renderer。
4. targeted tests 与 relevant gates 能证明 session-shell presentation 改造没有破坏现有 output contract。

## 3. Milestones

1. 2026-03-31：创建 `sprint-005` planned follow-up surface，并将 `TK-460 ~ TK-461` 写入 sprint task package。
