# sprint-004-polish-and-session-productization 计划

- Status: planned
- Date: 2026-03-30
- Project: `project-029-cli-session-first-agent-shell`

## 1. Sprint Goal

完成剩余全部非-desktop CLI 能力收口，包括 session settings、`!` passthrough、`repo-ai-governor "query"` 初始 prompt 启动、多行/history/search、docs/help 收口与 desktop smoke baseline。

## 2. Task Package

1. `TK-413` session settings commands 与 deferred command naming 收口。
2. `TK-414` multiline / history / search UX 与 `!` passthrough / `"query"` 启动入口。
3. `TK-415` i18n / help / docs / adoption playbook 与全能力可发现性收口。
4. `TK-416` desktop sidecar smoke baseline 与 session DTO packaged-surface 校验。

## 3. Exit Criteria

1. 除 desktop presenter / 窗口层本体外，本技术方案约定的其余 CLI / runtime 功能已全部收口。
2. `!` shell passthrough、`repo-ai-governor "query"` 初始 prompt 启动、`/theme` 与 session routing setting command 已有正式实现或正式命名收口。
3. adopter-facing docs、help 和 playbook 已同步更新。
4. desktop smoke baseline 可验证 future presenter 不会被当前 CLI 实现卡死。
