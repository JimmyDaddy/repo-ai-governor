# checklist

- [ ] TK-479 deliver migration, verification, rebuild and cutover governance for durable storage surfaces
  - 2026-04-02：任务创建，状态初始化为 `planned`；承接 durable storage surfaces 的 migration、doctor/verify、rebuild/render 与 cutover governance 收口。
  - 2026-04-02：`TK-479` 已切换为 `active`；随着 `sprint-003 / TK-478` 收口完成，当前 primary planning surface 前移到 `sprint-004`。
  - 2026-04-02：已完成第一段 doctor/verify 收口：新增 durable-storage diagnostics runtime，`doctor`/`verify` 现在会输出 session truth、artifact registry canonical/rendered views、task-ledger projection 的结构化检查结果，并已有 CLI 集成回归锁住该输出面。
  - 2026-04-02：已完成当前 working-tree CR 修复：artifact registry canonical inspection 改为 read-only fail-closed，`verify` 的 durable-storage blocker 使用确定性错误码 `DURABLE_STORAGE_VERIFY_FAILED`，并已通过集成回归和 build。
  - 2026-04-02：已修复 `debug:cleanroom-session-shell` 启动缺包问题；`artifact-registry` 已纳入 runtime distribution，`verify-local-distribution` 也新增对 `artifact-registry/shared` runtime payload 的 pack 校验，cleanroom `--help` 与 local distribution 验证均通过。
  - 2026-04-02：已修复 delivery gate 尾项：`durable-storage-diagnostics-runtime` 改用 `standardizeError(...)` 收敛 inline error message，`gate:standardized-errors` 不再阻塞收尾。
  - 2026-04-02：已修复 `doctor`/`verify` 的测试兼容性回归：durable-storage diagnostics 对 `memoryConfig` 改为安全读取，旧上下文不会再抛出 `TypeError`。
  - 2026-04-02：已修复 session shell 的 live activity 历史截断；运行中 transcript 现在按完整 activity history 逐条展示，超过 8 条日志也不会再被顶掉，并已有 turn-progress dock 回归锁住该行为。
  - 2026-04-02：已增强 reviewer/Codex 的实时活动透传；带文本的辅助 item 会作为 live activity detail 直接展示，不再只剩 command/todo 类状态。
  - 2026-04-02：已把 Codex review 的系统心跳与 AI 输出分开渲染；system-origin 进度现在会显示为独立 `system` 标签和弱化样式，不再和 AI 的 reasoning/todo 说明混在一起。
  - 2026-04-02：已把“辅助文本事件透传”扩展到 GitHub Copilot；非 `assistant.*` 的带文本 JSON 事件现在也会直接进入 live activity，底层若吐出 `analysis/reasoning/notice` 之类说明，前台可直接看到。
  - 2026-04-02：已新增 adapter health check 分层方案 draft，明确 install/auth/protocol/semantic/route-capability 四层探测模型，并把 Codex、GitHub Copilot、Claude Code、Ollama 的收敛方向整理到统一技术方案中。
  - 2026-04-02：已完成 health-check Phase A 止血实现；shared `health-check-response` helper 已接入 `Codex`、`GitHub Copilot`、`Claude Code` probe，`OK.` 等 trivial 变体不再被误判 unavailable，并已补 shared/adapter smoke 回归。
- [ ] TK-480 automate artifact lifecycle maintenance and auto-archive from sqlite canonical truth
  - 2026-04-02：任务创建，状态初始化为 `planned`；承接 artifact registry sqlite canonical truth 后续的自动维护、auto-deprecate 与 auto-archive 收口。
