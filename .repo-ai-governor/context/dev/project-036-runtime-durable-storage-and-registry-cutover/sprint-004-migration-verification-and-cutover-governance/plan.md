# sprint-004-migration-verification-and-cutover-governance 计划

- Status: completed
- Date: 2026-04-02
- Project: `project-036-runtime-durable-storage-and-registry-cutover`
- Sprint Goal: 收口 migration、doctor/verify、rebuild/render、artifact lifecycle automation 与 cutover governance，确保 durable storage 多 surface 升级可验证、可回滚、可审计。

## 1. Task Package

1. `TK-479` deliver migration, verification, rebuild and cutover governance for durable storage surfaces
2. `TK-480` automate artifact lifecycle maintenance and auto-archive from sqlite canonical truth
3. `TK-481` promote layered adapter health check and route probe solution into runtime-agent-projection formal docs
4. `TK-482` implement layered adapter health check contract and shared probe runtime baseline
5. `TK-483` align codex copilot claude and ollama probes with layered auth protocol route semantics
6. `TK-484` route doctor verify and role fallback through layered health check diagnostics
7. `TK-485` promote agent invoke liveness and timeout governance solution into runtime-agent-projection formal docs

## 2. Exit Criteria

1. 新旧工作区都有明确 migration 路径。
2. doctor/verify 能识别 sqlite-fs default truth、registry canonical truth 与 ledger projection 状态。
3. rebuild/render/reconcile/cutover governance 有明确 gate 与回归验证。
4. artifact lifecycle 具备基于 sqlite canonical truth 的自动维护与 auto-archive 路径。
5. adapter health check / route probe 已具备 formal docs、delivery ownership 与可执行的后续任务拆分，不再停留在 draft + ad-hoc patch 阶段。
6. agent invoke liveness / timeout governance 已具备 formal docs、delivery ownership 与 rollout handoff，不再停留在 draft 讨论阶段。

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
13. 2026-04-02：用户已批准 layered adapter health check / route probe 技术方案；当前 sprint 新增 `TK-481` 负责 formal promotion，`TK-482`、`TK-483`、`TK-484` 负责承接 Phase B/C/D 的 shared probe runtime、adapter-specific rollout 与 doctor/verify/route consumer 切换。
14. 2026-04-02：`TK-479/TK-480/TK-481/TK-482/TK-483/TK-484` 全部完成；artifact lifecycle automation 已升级为 batch maintenance pipeline，layered adapter health-check 已贯通 contract、adapter probe、doctor/verify、role diagnostics 与 session-main probe message，`sprint-004` exit criteria 全部满足并收口为 `completed`。
15. 2026-04-02：完成 post-closeout reviewer preflight UX 修补：`reviewer` 角色在真正 dispatch 前现在会先展示 role-level preflight 与 surface probe 进度，candidate surface probe 改为并发收集，并补齐 primary probe throw 后的 fallback recovery 回归。
16. 2026-04-02：完成 post-closeout direct-answer probe hardening：adapter protocol 实例开始跨 turn 复用，probe cache 不再每轮重置；针对“某个工具是否可用”的 direct-answer 现在会直接走目标 surface 的本地 availability probe，避免无谓探测全部 direct-answer surface 后再触发 Codex timeout。
17. 2026-04-02：完成 post-closeout shared probe-cache hardening：同一 workspace 内的多个 `CliAdapterRoutingRuntime` 实例现在会通过 shared protocol cache namespace 复用 surface protocol 与 adapter probe cache，降低 runtime 重建或并行 runtime 共存时的重复探测开销。
18. 2026-04-02：完成 post-closeout live activity 标签收口：session shell 的普通实时活动消息已移除 `Current/当前` 前缀，改为直接显示消息内容本身；execution details、React transcript 与定向 rendering 回归已同步对齐，避免 UI 再把中性进度消息误渲染成过时标签。
19. 2026-04-02：完成 post-closeout live activity viewport hardening：运行中的 `live_activity` 改为受控窗口渲染，完整日志历史继续保留，但 React/Ink live shell 只显示当前切片并支持 `PgUp/PgDn/Home/End` 浏览，从而避免长日志在任务进行中持续拉长整棵 shell 并破坏滚动体验。
20. 2026-04-02：完成 post-closeout agent reply history fix：`session-shell-turn-progress-dock` 已把 `agent_message/token` 草稿镜像成可更新的 role reply 活动条目，并将最新快照沉淀到 completed/failed turn execution details；因此 reviewer/Codex 在 command/todo 之外已生成的文本说明与回复，不再只停留在瞬时草稿区。
21. 2026-04-02：完成 post-closeout timeout/liveness 技术方案收口：新增 `.repo-ai-governor/draft/agent-invoke-liveness-and-timeout-governance-technical-solution.md`，明确把固定 timeout 从主判定降级为最后保险丝，并提出基于 process liveness、transport activity、semantic progress、graceful interrupt 的统一状态机与 rollout 路线。
22. 2026-04-02：完成 `TK-485` formal promotion：`agent invoke liveness / timeout governance` 已正式并入 `runtime.agent-projection` 模块，形成 `contract.runtime.agent-invoke-liveness.v1`、ADR、delivery ownership、promotion review 与 handoff artifact。
