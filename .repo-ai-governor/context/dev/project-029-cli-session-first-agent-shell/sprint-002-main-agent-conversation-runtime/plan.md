# sprint-002-main-agent-conversation-runtime 计划

- Status: completed
- Date: 2026-03-30
- Project: `project-029-cli-session-first-agent-shell`

## 1. Sprint Goal

完成主 agent conversation runtime、service-backed session DTO 与 resume baseline。

## 2. Task Package

1. `TK-405` `orchestration-service-client` session DTO 与 service-owned contract 基线。
2. `TK-406` sidecar host session runtime 与 `session.main` route dispatch。
3. `TK-407` CLI session client、transcript store、`/resume` 与顶层 `resume` 命令。
4. `TK-408` 多轮对话、错误恢复、cancellation 与 desktop-ready streaming parity。

## 3. Exit Criteria

1. session DTO 与 service-backed state owner 基线已经建立。
2. CLI 可通过 `session.main` 与主 agent 进行多轮会话。
3. 会话内 `/resume` 与顶层 `resume` 命令具备一致恢复语义。

## 4. Execution Notes

1. 2026-03-30：已激活 `project-029 / sprint-002`，主执行面从 `sprint-001` foundation closeout surface 切换到 main-agent conversation runtime。
2. 当前实现优先级固定为：service-backed session DTO -> sidecar/runtime dispatch -> CLI transcript store 与 resume -> 多轮恢复/取消/streaming parity。
3. 2026-03-30：已完成 `TK-405 ~ TK-408`，形成 service-backed session DTO、`appendSessionMessage` transcript contract、`session.main` route dispatch、top-level `resume` / in-session `/resume`、多轮恢复与 desktop-ready streaming parity，并通过 session/runtime/sidecar/desktop 目标测试集。
