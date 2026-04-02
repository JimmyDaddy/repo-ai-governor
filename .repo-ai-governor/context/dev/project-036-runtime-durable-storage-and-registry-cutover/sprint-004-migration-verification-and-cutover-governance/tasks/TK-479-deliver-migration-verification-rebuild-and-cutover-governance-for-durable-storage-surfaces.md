# TK-479 deliver migration verification rebuild and cutover governance for durable storage surfaces

- Status: active
- Date: 2026-04-02
- Owner: AI-Agent
- Priority: P0
- Project: `project-036-runtime-durable-storage-and-registry-cutover`
- Sprint: `sprint-004-migration-verification-and-cutover-governance`

## 1. 任务目标

为 runtime session durable truth、artifact registry sqlite truth 与 `tasks.csv` sqlite projection 补齐 migration、doctor/verify、rebuild/render/reconcile 与 cutover governance，确保新旧工作区升级路径可验证、可审计。

## 2. Depends On

1. `TK-476`
2. `TK-477`
3. `TK-478`
4. `TK-480`

## 3. 预期产物

1. durable storage surfaces 的迁移流程与回滚边界
2. doctor/verify 对 sqlite truth / projection drift / rendered view consistency 的检测能力
3. rebuild/render/reconcile/cutover governance gate
4. cleanroom / adoption / rollout evidence baseline
5. 与 artifact lifecycle automation / auto-archive 的协同 cutover 与治理验证

## 4. 实施计划

1. 为旧工作区提供 `copy -> verify -> switch` 或等价迁移路径。
2. 扩展 doctor/verify，让其显式检测 sqlite-fs default truth、artifact registry canonical truth 与 ledger projection 健康状态。
3. 收口 rebuild/render/reconcile/cutover governance 与相关脚本/回归。
4. 将 artifact lifecycle automation / auto-archive 纳入 governance closeout 范围，并与 doctor/verify/cutover gate 协同验证。
5. 在 cleanroom/adoption 场景中验证升级路径，沉淀 rollout evidence。

## 5. 验证

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-artifact-registry-lifecycle.js`
3. `pnpm run build`
4. cleanroom / verify / doctor / migration / rollout 相关定向测试与 smoke

## 6. 执行记录

1. 2026-04-02：任务创建，状态初始化为 `planned`。
2. 2026-04-02：补充 `TK-480` 作为配套 follow-up package，使 artifact lifecycle automation / auto-archive 从 sprint-004 起进入正式实施范围。
3. 2026-04-02：随着 `sprint-003 / TK-478` 收口完成，`TK-479` 被提升为 `active`，开始承接 migration、verify/doctor、rebuild/render/reconcile 与 cutover governance 的实现窗口。
4. 2026-04-02：完成第一段实现：`doctor/verify` 已接入 durable-storage diagnostics runtime，能够显式检测 `sqlite-fs` session truth 配置/override、artifact registry canonical truth 与 rendered CSV view consistency、以及 `tasks.csv` sqlite projection 状态；并补齐 CLI 集成回归覆盖对应 diagnostics artifact 与 checks 输出。
5. 2026-04-02：完成当前 working-tree CR 修复：artifact registry canonical inspection 已改为 read-only fail-closed 路径，`verify` 的 durable-storage blocker 已改用确定性错误码 `DURABLE_STORAGE_VERIFY_FAILED`，并通过 CLI 集成回归与 build 验证。
6. 2026-04-02：修复 `debug:cleanroom-session-shell` / local distribution 启动时的 runtime package drift：将 `@repo-ai-governor/artifact-registry` 纳入 CLI 依赖与顶层 runtime distribution 镜像，并补强 `verify-local-distribution` 对 `artifact-registry/shared` runtime payload 的校验，确保 cleanroom link/path 安装能稳定启动。
7. 2026-04-02：修复 delivery gate 尾项：`durable-storage-diagnostics-runtime` 的 inline error sanitization 已切换到 `standardizeError(...)`，恢复 standardized-error 门禁通过。
8. 2026-04-02：修复 `doctor`/`verify` 的兼容性回归：durable-storage diagnostics 现在对 `memoryConfig` 走安全读取，旧测试上下文和轻量调用方不再因缺失 `memoryConfig` 而抛出 `TypeError`。
9. 2026-04-02：修复 session shell 的 live activity 历史截断：运行中 transcript 现在直接按完整 activity history 逐条展示，不再只保留最多 8 条活动槽位；超过 8 条的日志也会持续保留到 turn 完成，并补了 turn-progress dock 回归覆盖。
10. 2026-04-02：增强 reviewer/Codex 的实时活动透传：除 `command_execution`、`todo_list`、`agent_message` 外，任何带文本的辅助 item 现在都会作为 live activity detail 透出；如果 Codex review 流里有 `reasoning/analysis` 之类的说明，前台也能直接看到。
11. 2026-04-02：区分 system 心跳与 AI 输出：Codex review 的 thread/turn/progress 心跳现在带 `detailOrigin=system`，session shell 会把它们渲染成独立的 `system` 标签与弱化样式，例如 `reviewer system`，从而与 AI 的 reasoning/todo/command 说明明显区分。
12. 2026-04-02：将“辅助文本事件透传”从 Codex 扩展到 GitHub Copilot：除 `assistant.*` 主回答 token 外，任何带文本的非 `result` JSON 事件都会作为 live activity detail 透出；这样如果 Copilot CLI 底层提供 `analysis/reasoning/notice` 之类说明，前台也能直接显示。
13. 2026-04-02：沉淀 adapter health check 分层方案 draft：在 `.repo-ai-governor/draft/layered-adapter-health-check-and-route-probe-technical-solution.md` 中正式记录 install/auth/protocol/semantic/route-capability 分层模型，并结合 GitHub Copilot、Claude Code、Codex、Ollama 的官方资料明确后续 probe 收敛方向。
14. 2026-04-02：完成 health-check Phase A 止血实现：新增 shared `health-check-response` 归一化 helper，并将 `Codex`、`GitHub Copilot`、`Claude Code` 的 probe 从“精确等于 OK”切换为“接受 `OK.` / 引号 / 大小写 / 空白等 trivial 变体”的宽松语义比较，同时补齐 shared 与三类 adapter smoke 回归。
15. 2026-04-02：在用户批准 draft 后，当前 sprint 已将 layered adapter health-check / route-probe 方案正式提升为 `runtime.agent-projection` formal solution，并拆分出 `TK-482~TK-484` 承接 Phase B/C/D；`TK-479` 继续作为 cutover governance 总收口面协调 doctor/verify、routing fallback 与 rollout evidence。
