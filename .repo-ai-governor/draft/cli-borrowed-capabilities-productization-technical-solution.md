# Repo AI Governor CLI 借鉴能力产品化技术方案（Draft）

- Status: draft
- Date: 2026-04-04
- Scope: `repo-ai-governor` CLI / session-first shell / orchestration service / local state projection / dynamic discoverability / adaptive interaction runtime
- Target Modules:
  - `runtime.cli-interactive-shell`
  - `runtime.orchestration`
  - `runtime.durable-storage`
  - `entry.cli`
- Related Inputs:
  - `.repo-ai-governor/draft/cli-borrowing-analysis-against-claude-code-and-codex.md`
  - `.repo-ai-governor/draft/interactive-cli-session-first-agent-shell-technical-solution.md`
  - `.repo-ai-governor/draft/runtime-cli-run-live-react-session-shell-technical-solution.md`
  - `.repo-ai-governor/draft/session-main-review-generation-verification-and-ledger-backfill-contract.md`
  - `.repo-ai-governor/draft/upgrade-analysis-apply-and-rollback-contract.md`
  - `.repo-ai-governor/draft/runtime-session-durable-memory-and-sqlite-fs-cutover-technical-solution.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/module-overview.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/contracts/cli-session-shell-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/adrs/cli-command-capability-maturity-and-baseline-enhancement-priority.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-durable-storage/module-overview.md`
  - `apps/cli/src/main.ts`
  - `apps/cli/src/runtime/interactive-shell/session-shell-service-client.ts`
  - `apps/cli/src/runtime/interactive-shell/session-shell-runner.ts`

## 1. 目的

把 `.repo-ai-governor/draft/cli-borrowing-analysis-against-claude-code-and-codex.md` 中“值得借鉴什么”的结论，收敛成一份可以直接指导后续 implementation sprint 的技术方案草案。

本方案不再停留在 benchmark 观点层，而是回答四个更具体的问题：

1. 哪些能力应当进入 `repo-ai-governor` 的正式 CLI 产品骨架。
2. 这些能力分别应落到哪个现有模块，而不是再发明一层新宿主。
3. 实施顺序如何分阶段，才能保持当前 session-first shell 的连续演进。
4. 哪些外部能力暂不纳入近期开工范围，避免 scope 膨胀。

## 2. 背景与问题

当前 CLI 已经拥有 session-first 方向的关键接缝：

1. `apps/cli/src/main.ts` 已具备无子命令进入 session shell 的入口分流基础。
2. `apps/cli/src/runtime/interactive-shell/session-shell-service-client.ts` 已接上 `start / resume / list / send turn / append message / subscribe` 这类 service-backed session seam。
3. `runtime.cli-interactive-shell` 已正式接受 service-owned `session.main`、risk-tiered skill handoff、capability explanation 与 transcript-first presenter 边界。
4. `runtime.durable-storage` 已正式接受 sqlite canonical truth + projection/read-model 的长期方向。

但 benchmark 也暴露出当前 CLI 仍缺少一套“足够完整、可长期扩展”的产品骨架：

1. session lifecycle 仍偏薄，`fork / archive / compact / rollback-to-turn` 等关键动作没有进入 shared service contract。
2. `resume`、`history` 与 shell continuity 仍主要依赖实时读取和局部 presenter state，缺少 read-optimized local projection。
3. 交互运行时缺少统一 policy，`alt-screen / inline fallback / request-user-input overlay / small terminal degradation` 尚未被正式收口。
4. governed capability discoverability 已有基础，但 repository-local skills、workflow presets 与 shell-local builtins 还没有进入一套统一的 dynamic command surface。
5. transcript 已存在，但 session note / memory 仍停留在“历史消息堆积”层面。
6. 默认入口变成 session-first 后，`apps/cli/src/main.ts` 的 runtime wiring 会越来越重，启动预算没有被治理化。

因此，当前最需要的不是继续堆更多 UI 形态，而是把 CLI 的产品骨架补齐。

## 3. 目标

### 3.1 必须达成

1. 让 session shell 具备完整的近程 lifecycle 闭环：至少支持 `resume list / fork / archive / compact planning` 的正式服务边界。
2. 让 CLI 从 service-owned durable truth 消费 read-optimized session projection，而不是继续把本地 artifact/临时内存当作唯一查询面。
3. 让 `runtime.cli-interactive-shell` 拥有统一的 interaction runtime policy，收口 `alt-screen / inline / overlay / fallback` 行为。
4. 让 dynamic discoverability 正式成立：service-owned governed capability metadata、repository-local skills、workflow presets 与 shell-local builtins 能在 presenter/registry 组合层统一呈现。
5. 为 transcript 补上 lightweight session note 能力，但保持 note 只是 service-owned session continuity 的补充层。
6. 把 startup budget 与 lazy-load boundary 变成明确的 CLI 工程约束，而不是后期被动优化。

### 3.2 明确非目标

1. 近期不引入 remote session / viewer-only host / reconnect protocol 的正式落地。
2. 不复制 `Claude Code` 的超重 monolith command surface，也不做 plugin marketplace。
3. 不复制 `Codex` 的 Rust-native sandbox、exec-server 或底层基础设施重写。
4. 不把 `runtime.cli-interactive-shell` 升格为 canonical session owner；它仍然只是 consumer/presenter。
5. 不在本方案中要求正式 triad 文档 promotion；本次仅产出 draft 级 follow-up technical solution。

## 4. 方案总决策

本方案采用“产品骨架先行、重能力延后”的 productization 路径。

### 4.1 优先借鉴的外部能力

1. 借鉴 `Codex` 的 host-neutral service layering。
2. 借鉴 `Codex` 的 thread-turn-item lifecycle completeness。
3. 借鉴 `Codex` 的 read-optimized local state projection。
4. 借鉴 `Codex` 的 adaptive interaction runtime policy。
5. 借鉴 `Claude Code` 的 dynamic skills/plugin-like discoverability 思路，但只保留受治理的 metadata projection。
6. 借鉴 `Claude Code` 的 lightweight session memory 思路，但只实现 session note。
7. 借鉴 `Claude Code` 的 startup lazy-load discipline，而不是其功能密度。

### 4.2 统一落地方向

所有借鉴能力都必须收敛到现有模块边界：

1. `runtime.orchestration`
   - 拥有 session lifecycle contract、turn truth、governed capability metadata truth、session note truth。
2. `runtime.durable-storage`
   - 拥有 session projection/read-model、rebuild/render/migration truth。
3. `runtime.cli-interactive-shell`
   - 拥有 interaction runtime policy、palette presenter、resume picker、overlay presenter、transcript affordance。
4. `entry.cli`
   - 拥有 startup budget、lazy-load boundary 与 mode selection policy。

不允许新增一个绕过以上模块边界的“CLI-only shadow runtime”。

## 5. 总体架构

### 5.1 Session Lifecycle Productization

在现有 `startSession / resumeSession / sendSessionTurn / appendSessionMessage / listSessions / subscribeSession` 之上，补齐以下 service-owned action seam：

1. `forkSession`
   - 输入：`source_session_id`、可选 `fork_from_turn_id`、可选 `display_name`
   - 输出：新 `session_id`、source pointer、resume-ready summary
2. `archiveSession`
   - 输入：`session_id`
   - 输出：archived timestamp、archive reason summary
3. `unarchiveSession`
   - 输入：`session_id`
   - 输出：active status 恢复结果
4. `compactSession`
   - 输入：`session_id`、可选 compact policy
   - 输出：summary artifact / note pointer / compact receipt
5. `rollbackSessionToTurn`
   - 输入：`session_id`、`turn_id`
   - 输出：new branch or rollback receipt

设计原则：

1. CLI 不直接实现这些动作的 truth，只能调用 orchestration service。
2. `archive / compact / rollback` 的真实副作用与审计必须由 service-owned durable truth 托管。
3. presenter 只消费 `action receipt + session summary`，不得本地伪造 session continuity。

### 5.2 Session Projection / Resume Read Model

在 `runtime.durable-storage` 当前的 sqlite canonical truth 方向上，为 CLI 补一个 session read model。

第一阶段只要求覆盖：

1. `session_id`
2. `display_name`
3. `current_route_id`
4. `latest_turn_at`
5. `status`
   - `active`
   - `archived`
   - `compact_pending`
   - `compacted`
6. `source_kind`
   - `new`
   - `resumed`
   - `forked`
7. `preview_summary`
8. `latest_note_summary`
9. `last_cursor`
10. `archived_at`

CLI 的以下 surface 必须优先消费该 projection，而不是重复读 event log 或重新维护 index：

1. `/resume`
2. session list / recent list
3. startup auto-resume hint
4. transcript diagnostics summary
5. future `/history` 与 `/search`

### 5.3 Adaptive Interaction Runtime Policy

`runtime.cli-interactive-shell` 新增一套显式 interaction runtime policy，统一收口：

1. `screen_mode`
   - `inline`
   - `alt_screen`
   - `auto`
2. `overlay_mode`
   - `disabled`
   - `request_user_input`
   - `handoff_preview`
3. `fallback_policy`
   - `ink_only`
   - `ink_then_readline`
   - `classic_only`
4. `terminal_density`
   - `small`
   - `normal`
   - `wide`

行为约束：

1. `pretty + TTY + interactive` 才允许增强运行时。
2. `plain/json/non-TTY/no-interactive` 继续走非交互 contract。
3. `request-user-input overlay` 必须是统一输入层能力，而不是各命令各自拼 prompt。
4. 小终端必须退化为最小 transcript + single-column palette，而不是强行展示完整 panel。

### 5.4 Dynamic Discoverability Registry

为避免继续把 discoverability 分散在多个硬编码来源中，新增一个 presenter-side unified discoverability registry。

统一注册项最少包含：

1. `surface_id`
2. `source_kind`
   - `builtin_command`
   - `governed_capability`
   - `repository_skill`
   - `workflow_preset`
   - `doctor_preset`
   - `delivery_preset`
3. `title`
4. `description`
5. `risk_tier`
6. `confirmation_mode`
7. `availability_scope`
8. `source_provenance`
9. `execution_path`
10. `suggested_follow_up`

来源合并策略：

1. service-owned governed capability metadata 继续是可解释能力的主真值。
2. repository-local skills 通过 metadata loader 投影到 discoverability surface，但不自动成为 unrestricted execution truth。
3. shell-local builtins 仍由 CLI registry 本地治理。
4. presenter/registry 组合层负责合并排序，不把 `/confirm / clear / exit / resume` 回写到 service-owned capability catalog。

### 5.5 Lightweight Session Notes

新增 session note，但只作为 session continuity 的补充层：

1. 触发时机
   - turn count 达阈值
   - command handoff completed
   - role collaboration completed
   - compact requested
2. 输出内容
   - current goal
   - recent decisions
   - pending follow-ups
   - artifact backlinks
3. 存储边界
   - 由 `runtime.orchestration` 写入 shared session truth
   - `runtime.durable-storage` 负责 projection/read-model
   - CLI 只消费 presenter-safe summary

明确不做：

1. provider-private hidden memory
2. 用户不可见的永久暗箱记忆
3. 每轮 turn 都执行的高频自动摘要

### 5.6 Startup Budget And Lazy-Load Boundary

`entry.cli` 需要引入显式 startup budget 治理。

第一阶段不直接冻结绝对耗时红线，而是先冻结边界：

1. session-shell-only startup path
2. explicit subcommand path
3. workflow/editor/heavy diagnostics path

工程规则：

1. 无子命令进入 session shell 时，只加载 shell 必需 runtime、discoverability seed 与 resume projection client。
2. workflow editor、heavy review graph、upgrade apply 等重模块延迟到真正命中该 surface 时才装载。
3. startup 诊断输出必须能区分“shell baseline 依赖”和“feature-triggered extra load”。

## 6. 分阶段交付

### Phase 1：Foundation

目标：先把 CLI 从“能对话”提升为“能稳定继续会话”。

交付内容：

1. session lifecycle contract 增量：`fork + archive + unarchive`
2. session read model 第一版
3. session list / resume picker 正式接入 session shell
4. `main.ts` 无子命令路径按 shell baseline 依赖做 lazy-load cut

退出标准：

1. CLI 可稳定列出 recent sessions，并从 projection 驱动 `/resume`。
2. CLI 可将当前会话 fork 成新 session，并在 picker 中可见。
3. archive/unarchive 至少具备 service receipt + list filtering 基线。

### Phase 2：Productization

目标：把 session shell 从 baseline 变成真正的统一交互宿主。

交付内容：

1. interaction runtime policy
2. request-user-input overlay
3. alt-screen / inline auto fallback
4. discoverability unified registry
5. repository-local skills / presets 进入 slash discoverability

退出标准：

1. 小终端、普通终端、multiplexer 场景都有明确 fallback。
2. 用户在 session shell 内能看到 builtin、governed capability、skills/presets 的统一 discoverability 结果。
3. overlay 不再由命令各自管理输入。

### Phase 3：Continuity And Efficiency

目标：补 continuity 和长期维护性，而不是继续扩面。

交付内容：

1. lightweight session note
2. `compactSession` 正式接入
3. startup budget instrumentation
4. lazy-load budget reporting

退出标准：

1. resume 时可看到 presenter-safe note summary。
2. session compact 与 note summary 能互相回链。
3. startup regression 可以被测量和阻断。

## 7. 暂缓项

以下能力明确放入 deferred bucket：

1. remote session / viewer-only host
2. reconnect protocol
3. plugin marketplace
4. richer approval dialog system
5. Rust-native sandbox / exec-server 重写

原因很简单：

1. 这些能力都建立在更稳的 session lifecycle 和 local service contract 之上。
2. 现在先做它们，会把 scope 从“补 CLI 产品骨架”扩张成“做新的 host platform”。

## 8. 风险与缓解

### 8.1 风险：在 CLI 层重新发明第二份 session truth

缓解：

1. 所有 lifecycle action 只允许通过 orchestration service 暴露。
2. presenter 只消费 projection/read-model 和 session DTO。

### 8.2 风险：discoverability 扩展成不受控插件系统

缓解：

1. registry 只接纳受治理 metadata。
2. execution truth 仍由 skill/workflow/governed capability 自身决定。

### 8.3 风险：session note 变成高频、昂贵、不可解释的暗箱 memory

缓解：

1. note 只在显式阈值触发。
2. note 输出必须可见、可审计、可被 resume surface 展示。

### 8.4 风险：交互 runtime 方案导致 plain/json contract 漂移

缓解：

1. 所有增强运行时仅在 `pretty + TTY + interactive` 生效。
2. `stdout` contract 继续保持机器可读稳定性。

## 9. 验证建议

本方案后续若进入 implementation sprint，建议最少验证：

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `node ./scripts/governance/check-code-review-status-sync.js`
4. `node ./scripts/governance/check-worktree-review-target.js`
5. 针对 implementation window 再补：
   - session lifecycle integration tests
   - session projection rebuild/render tests
   - session shell interaction runtime tests
   - startup lazy-load regression checks

## 10. 推荐 follow-up task package

如果基于本 draft 继续立项，建议拆成 3 个 implementation package，而不是一个大 sprint：

1. `session lifecycle + projection`
2. `adaptive interaction runtime + discoverability registry`
3. `session note + startup budget`

这样可以保证：

1. 先把 continuity 地基补稳。
2. 再补用户能直接感知的交互壳层。
3. 最后补长期维护与体验优化。

## 11. 结论

这份技术方案草案的核心判断是：

1. `repo-ai-governor` CLI 近期最该借鉴的，不是某个产品的外观，而是经过验证的产品骨架。
2. 这个骨架在本仓库中的正确落地方式，不是新起一个 CLI-only runtime，而是沿着 `runtime.orchestration -> runtime.durable-storage -> runtime.cli-interactive-shell -> entry.cli` 的现有边界补齐。
3. 只要先把 session lifecycle、projection、interaction policy、dynamic discoverability 和 session note 这五块补齐，当前已经存在的 session-first shell 才会真正从 baseline 变成可持续扩展的 CLI 产品面。
