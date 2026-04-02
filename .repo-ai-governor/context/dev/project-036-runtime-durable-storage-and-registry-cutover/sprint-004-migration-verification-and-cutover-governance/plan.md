# sprint-004-migration-verification-and-cutover-governance 计划

- Status: active
- Date: 2026-04-02
- Project: `project-036-runtime-durable-storage-and-registry-cutover`
- Sprint Goal: 收口 migration、doctor/verify、rebuild/render、artifact lifecycle automation 与 cutover governance，确保 durable storage 多 surface 升级可验证、可回滚、可审计。

## 1. Task Package

1. `TK-479` deliver migration, verification, rebuild and cutover governance for durable storage surfaces
2. `TK-480` automate artifact lifecycle maintenance and auto-archive from sqlite canonical truth

## 2. Exit Criteria

1. 新旧工作区都有明确 migration 路径。
2. doctor/verify 能识别 sqlite-fs default truth、registry canonical truth 与 ledger projection 状态。
3. rebuild/render/reconcile/cutover governance 有明确 gate 与回归验证。
4. artifact lifecycle 具备基于 sqlite canonical truth 的自动维护与 auto-archive 路径。

## 3. Milestones

1. 2026-04-02：创建 planned `sprint-004`，冻结 `TK-479` 作为 migration and governance closeout package。
2. 2026-04-02：补充 `TK-480` 作为 artifact lifecycle automation follow-up package，承接 sqlite canonical truth 之后的 auto-maintenance / auto-archive 实施面。
3. 2026-04-02：`sprint-003 / TK-478` 已完成，当前 primary planning surface 前移至 `sprint-004`，并激活 `TK-479` 承接 migration / verify / rebuild / cutover governance 主收口。
4. 2026-04-02：`TK-479` 完成第一段 doctor/verify 收口：CLI 已能显式诊断 `sqlite-fs` session truth 配置/override、artifact registry sqlite canonical truth 与 rendered CSV view consistency，以及 task-ledger projection 健康状态。
5. 2026-04-02：完成当前 working-tree CR 修复：artifact registry canonical inspection 已切换为只读 fail-closed，`verify` 的 durable-storage blocker 现在使用确定性错误码 `DURABLE_STORAGE_VERIFY_FAILED`，并已通过 CLI 集成回归与 build 验证。
6. 2026-04-02：完成 cleanroom / local distribution 启动缺包修复：`artifact-registry` 已进入顶层 runtime distribution，`verify-local-distribution` 对 `artifact-registry/shared` runtime payload 的 pack 校验已补齐，`debug:cleanroom-session-shell -- --help` 与 local distribution 验证通过。
7. 2026-04-02：完成 session shell live activity 历史保留修复：运行中 transcript 改为直接展示完整 activity history，超过 8 条的实时日志不会再在活动面板中被省略，并已通过 turn-progress dock 定向回归与 build 验证。
8. 2026-04-02：完成 reviewer/Codex 辅助 item 透传增强：若 review 流里出现 `reasoning` 等带文本的辅助 item，session shell 会把它们直接渲染进 live activity，不再只显示 command/todo 类状态。
9. 2026-04-02：完成 live activity 来源区分增强：Codex review 的 thread/turn/progress 心跳现在走 system-origin 透传，前台会用独立 `system` 标签与弱化主题色显示，使系统状态与 AI 自述清晰分层。
10. 2026-04-02：将辅助文本事件透传从 Codex 扩展到 GitHub Copilot：除了 `assistant.*` 主回答 token 外，带文本的非 `result` JSON 事件也会进入 live activity，使 Copilot 的 `analysis/reasoning/notice` 类说明能够直接在前台展示。
11. 2026-04-02：补充 adapter health check 分层方案 draft：为 `codex`、`github-copilot`、`claude-code`、`ollama` 正式提出 install/auth/protocol/semantic/route-capability 四层 probe 模型，并将官方资料调研与落地建议收口到独立 draft，作为后续 probe 重构评审输入。
12. 2026-04-02：完成 health-check Phase A 止血实现：shared `health-check-response` helper 已接入 `codex`、`github-copilot`、`claude-code`，probe 现在接受 `OK.` 等 trivial 语义变体，不再因标点或简单包裹格式误判 surface unavailable。
