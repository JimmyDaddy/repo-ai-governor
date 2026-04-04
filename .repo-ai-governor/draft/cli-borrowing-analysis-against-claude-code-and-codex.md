# Repo AI Governor CLI 对标 Claude Code 与 Codex 的可借鉴能力分析（Draft）

- Status: draft
- Date: 2026-04-04
- Scope: `repo-ai-governor` CLI / external CLI benchmark / borrowable capability prioritization
- Benchmark Repos:
  - `claude-code` local worktree: `/Users/jimmydaddy/study/claude-code`
  - `codex` local worktree: `/Users/jimmydaddy/study/codex`
- Related:
  - `.repo-ai-governor/draft/interactive-cli-session-first-agent-shell-technical-solution.md`
  - `.repo-ai-governor/draft/interactive-cli-point-and-type-solution-survey.md`
  - `.repo-ai-governor/draft/cli-capability-maturity-and-baseline-enhancement-priority-analysis.md`
  - `apps/cli/src/main.ts`
  - `apps/cli/src/runtime/interactive-shell/session-shell-entrypoint-runtime.ts`
  - `apps/cli/src/runtime/interactive-shell/session-shell-service-client.ts`
  - `apps/cli/src/runtime/interactive-shell/session-slash-command-registry.ts`
  - `apps/cli/src/runtime/session-main-capability-discoverability-runtime.ts`
  - `apps/cli/src/react-cli/views/session-shell-app.tsx`
  - `/Users/jimmydaddy/study/claude-code/src/main.tsx`
  - `/Users/jimmydaddy/study/claude-code/src/commands.ts`
  - `/Users/jimmydaddy/study/claude-code/src/skills/loadSkillsDir.ts`
  - `/Users/jimmydaddy/study/claude-code/src/utils/plugins/loadPluginCommands.ts`
  - `/Users/jimmydaddy/study/claude-code/src/services/SessionMemory/sessionMemory.ts`
  - `/Users/jimmydaddy/study/claude-code/src/remote/RemoteSessionManager.ts`
  - `/Users/jimmydaddy/study/codex/codex-rs/cli/src/main.rs`
  - `/Users/jimmydaddy/study/codex/codex-rs/tui/src/cli.rs`
  - `/Users/jimmydaddy/study/codex/codex-rs/app-server/README.md`
  - `/Users/jimmydaddy/study/codex/codex-rs/tools/src/lib.rs`
  - `/Users/jimmydaddy/study/codex/codex-rs/state/src/lib.rs`
  - `/Users/jimmydaddy/study/codex/docs/tui-request-user-input.md`
  - `/Users/jimmydaddy/study/codex/docs/tui-alternate-screen.md`

## 0. Benchmark Corpus 与证据边界

为避免把“本机样本观察”误读成“稳定上游事实”，本 draft 将 benchmark corpus 与证据边界显式记录如下：

1. `claude-code`
   - 本地 worktree：`/Users/jimmydaddy/study/claude-code`
   - sampled commit：`a99de1bb3c0c301b83b784abbcdb7a3674b2cd45`
   - sampled date：`2026-04-04`
   - provenance note：该本地样本的 `README.md` 自述为 `Claude Code — Leaked Source (2026-03-31)`；因此本文所有涉及 `Claude Code` 的结论均按“本地样本观察”处理，用于产品形态和架构手法启发，不视为 Anthropic 官方、稳定、可长期承诺的上游 contract。若后续要把相关判断提升为正式 technical solution 输入，应补官方文档、公开发行行为或其他可复查资料做交叉校验。
2. `codex`
   - 本地 worktree：`/Users/jimmydaddy/study/codex`
   - sampled commit：`4b8bab6ad3d80d2d20d17f18e4120dbc86681972`
   - sampled date：`2026-04-04`
   - provenance note：当前分析基于该 commit 对应的本地 checkout；下文保留本机路径只是为了给本轮阅读范围做 evidence index，真正的可复查锚点以 commit SHA 与采样日期为准。

## 1. 核心结论

`repo-ai-governor` CLI 现在已经不是“只有命令树、没有交互壳层”的阶段了。

它已经具备三块重要基线：

1. 默认进入 session shell 的入口接缝已经存在，而不是只能打印 help。
2. governed capability catalog 与 slash discoverability 已经开始收敛到单一事实来源。
3. session shell 已经通过 service client 接上 `start / resume / list / send turn / append message / subscribe` 这类 canonical 会话能力。

因此，这轮 benchmark 最重要的结论不是“我们要不要做一个像别人那样的 React CLI”，而是：

1. 应优先补强 `surface layering + session lifecycle + state model + adaptive interaction runtime`。
2. 不应优先追求更花的 TUI 或更大的命令面。
3. 近期最值得学的是 `Codex` 的协议化 service-state 分层，以及 `Claude Code` 的动态扩展入口与 session memory 路径。

一句话收敛：

`repo-ai-governor` 现在最缺的不是“像谁”，而是把已经长出来的 interactive shell 从 baseline 提升成真正可持续扩展的 CLI product surface。

## 2. 对比快照

| 维度 | repo-ai-governor | Claude Code | Codex | 结论 |
|---|---|---|---|---|
| 默认入口 | 已有 session-first entry seam，但整体仍以治理子命令心智为主 | `claude` 默认即 interactive session | `codex` 默认即 interactive TUI | 入口方向已对，但还需继续把“会话优先”做完整 |
| 会话模型 | 已有 `start/resume/list/subscribe` service client，但 fork/archive/rollback 语义不完整 | 有本地与 remote session、resume、viewer-only remote flow | thread/turn/item 非常清晰，支持 resume/fork/archive/rollback/compact | 最值得补的是会话生命周期 completeness |
| 命令发现 | static builtin + governed capability discoverability | 巨大的 slash command 面，且 skills/plugin 可动态注入 | interactive TUI + top-level subcommands + tool/app surfaces | 我们应先做动态 discoverability，而不是盲目扩张命令数 |
| 扩展机制 | repository-local skills 已有，但 CLI 还没把它们变成动态 session surface | skills + plugins + bundled commands 都是一级公民 | skills + MCP + apps + app-server protocol | `skills/workflows/presets` 应成为我们近期最现实的扩展入口 |
| 状态持久化 | 有 orchestration session surface，但查询/搜索/read model 仍偏薄 | 有大量 session/task/state/memory runtime | SQLite-backed state read model 清晰 | 应补 local state projection，而不是只靠 artifact/rollout 文件 |
| 交互运行时 | 已有 React shell、slash palette、command progress panel | 终端 UI 极重，权限弹窗、keybinding、vim、tips、remote 全覆盖 | alt-screen policy、request-user-input overlay、TUI inline/fullscreen 分层较清楚 | 近期更适合学 Codex 的“自适应运行时”，而不是 Claude 的超重 UI |
| 启动性能 | `apps/cli/src/main.ts` 已聚合很多 runtime，按命令路径延迟装载还不够强 | 明显做了 prefetch 与 lazy load 优化 | Rust 二进制天然更轻，子系统边界也更硬 | 应借鉴 Claude 的 startup budget 管理方法 |
| 安全/审批 | 有治理/HITL 语义，但 CLI 用户可见的 approval surface 还不够产品化 | 完整 permission request UI | sandbox + approval policy 是一级 CLI contract | 用户可理解的安全模式和交互提示值得补，但不必全量照搬 |

## 3. 立即可借鉴

这一组能力与当前仓库方向最对齐，而且能直接增强 `repo-ai-governor` CLI 的产品完成度。

### 3.1 借鉴 `Codex` 的 service/app-server 分层，而不是继续把 CLI 视为唯一宿主

`Codex` 的关键优势不是 TUI 本身，而是它明确区分了：

1. top-level CLI
2. TUI surface
3. app-server
4. exec-server
5. state runtime

这使得同一套会话与工具能力可以被 CLI、桌面端、IDE 扩展共同消费。

这和我们的 PRD 完全同向，因为仓库已经明确要求：

1. CLI 与未来桌面端要共享同一套本地 orchestration service。
2. `DSL/IR/policy/audit/ledger` 与执行后端解耦。

对 `repo-ai-governor` 的具体借鉴建议：

1. 把当前 `CliSessionShellServiceClient` 继续上提为真正稳定的本地 service contract，而不是 CLI 内部 convenience wrapper。
2. 明确冻结 thread/session 的 host-neutral DTO，而不是让 CLI presenter 逐步吸收更多 runtime 语义。
3. 后续若做 desktop/IDE，不要再让每个 host 各自发明会话协议。

这是近期最高价值的借鉴项。

### 3.2 借鉴 `Codex` 的 thread-turn-item 生命周期完整度

`repo-ai-governor` 当前已经有：

1. `startSession`
2. `resumeSession`
3. `listSessions`
4. `sendSessionTurn`
5. `appendSessionMessage`
6. `subscribeSession`

但和 `Codex` 相比，生命周期仍偏薄，特别缺：

1. 明确的 fork 语义
2. archive/unarchive
3. rollback/compact
4. shell command 与 turn 的边界语义
5. 线程状态切换与 loaded/unloaded 查询

借鉴建议：

1. 先补 `resume picker + explicit session list + fork semantics`。
2. 再补 `archive/rollback/compact` 这类更强的上下文治理动作。
3. 所有动作都应落到 service DTO，而不是仅做 CLI 本地状态技巧。

这会直接提升 session-first shell 的真实可用性。

### 3.3 借鉴 `Codex` 的状态读模型，而不是继续把 artifact 文件当唯一查询面

`Codex` 把 rollout metadata 抽出来投影到 SQLite，本质上是在解决：

1. 会话多了之后如何搜索和分页
2. 如何快速判断 thread state
3. 如何支撑 resume picker、thread list、agent jobs 和历史查询

对我们来说，意义也很直接：

1. 当前 session shell 如果想继续进化，就不能长期只依赖文件式 artifact 与零散 runtime memory。
2. `resume`、`history`、`review queue`、`run ledger`、`draft recommendation follow-up` 等都需要更快的本地查询面。

借鉴建议：

1. 在现有 orchestration/session durable truth 之上补一个 read-optimized local projection。
2. 第一阶段不必复制 `Codex` 全量 schema，但至少要覆盖 session list、recent turns、status、name、source route、summary。
3. CLI 只消费投影视图，不重新维护第二份 session index。

### 3.4 借鉴 `Codex` 的自适应交互运行时

`Codex` 在这块特别值得学的不是“有全屏 TUI”，而是它对终端现实约束的处理更成熟：

1. `--no-alt-screen`
2. `alternate_screen = auto/always/never`
3. 针对 Zellij 这类 multiplexer 的显式策略
4. request-user-input overlay 的焦点、键盘、布局降级规则

这正好对我们当前 React shell 有帮助，因为我们已经有：

1. transcript pane
2. composer input
3. slash palette
4. prompt bar

但还缺：

1. alt-screen / inline mode 的环境自适应
2. 标准化的“问用户几个短问题”的交互层
3. 小终端降级规则

借鉴建议：

1. 为 session shell 和 `init/connect/workspace` 统一设计 interaction runtime policy。
2. 将 overlay 视为输入层能力，而不是每个命令自己拼 prompt。
3. 保持 `pretty/plain/json` 三模约束不动，interactive 只在 `pretty + TTY` 下增强。

### 3.5 借鉴 `Claude Code` 的动态 skills/plugin 命令发现机制

`repo-ai-governor` 当前的 session shell discoverability 已经优于“纯静态 help”，但仍主要是：

1. local builtins
2. governed capability catalog

而 `Claude Code` 更进一步，把：

1. skills
2. plugins
3. bundled commands
4. markdown/frontmatter metadata

都变成了命令面的一部分。

这对我们最有价值的不是“搞插件市场”，而是两个思路：

1. 命令面不应只来自硬编码常量，还应来自受治理的动态来源。
2. frontmatter/metadata 可以成为 CLI discoverability 的统一输入。

结合本仓库现状，近期最现实的借鉴路径是：

1. 让 repository-local skills 真正进入 session shell slash discoverability。
2. 让 workflow templates、review presets、doctor presets、delivery presets 以统一 metadata 投影到命令面。
3. 维持 governance truth，不把 runtime 直接变成“扫到什么就执行什么”的不受控插件系统。

### 3.6 借鉴 `Claude Code` 的 session memory，而不是只做 transcript 堆积

`Claude Code` 的 session memory 做法很值得注意：

1. 它不是替代主对话。
2. 它是后台自动抽取的会话笔记。
3. 它有阈值、节流与自然断点判断。

这和我们的 `session.main` 很匹配，因为我们现在也在逐步建立：

1. capability explanation
2. transcript affordance
3. shared session truth
4. provider continuation summary

下一步如果没有更高层的会话摘要/笔记层，session shell 很容易只剩“滚动聊天记录”。

借鉴建议：

1. 先做 lightweight session note，而不是一开始就做复杂长期 memory。
2. 输出应受治理，可回写 shared session truth 或独立 session artifact。
3. 生成节奏要受 token/turn/command completion 等阈值控制，不要每轮都跑。

### 3.7 借鉴 `Claude Code` 的启动性能纪律

`Claude Code` 在 `main.tsx` 里明显做了：

1. 顶层 side-effect prefetch
2. feature-gated lazy require
3. 重模块按需加载

而我们当前 `apps/cli/src/main.ts` 已经开始承担太多 runtime wiring。

这意味着：

1. 如果 CLI 继续扩张 interactive shell、skills、session memory、state search、workflow editor，启动成本会继续上升。
2. 在默认入口变成 session-first 之后，启动预算会直接影响产品体感。

借鉴建议：

1. 给 CLI 主入口建立 startup budget。
2. 明确哪些 runtime 只在特定命令或 UI mode 下装载。
3. 在命令树、session shell、workflow editor 之间建立更硬的延迟装载边界。

## 4. 条件化引入

这一组能力有价值，但要等前一层基础更稳之后再引入。

### 4.1 Remote session / viewer 模式

`Claude Code` 的 `RemoteSessionManager` 与 `Codex` 的 app-server / remote transports 都说明：

1. 远端或跨 host 会话不是简单的“把 stdout 发过去”。
2. 它需要独立的消息流、权限回执、viewer-only 模式和 reconnect 语义。

我们未来如果做 desktop 或 IDE，更可能需要这类能力。

但现在不宜优先，因为：

1. 本地 session lifecycle 还没补全。
2. service contract 还没有完全 host-neutral。

### 4.2 更产品化的 approval / sandbox UX

`Codex` 的 sandbox/approval policy 是一级 CLI contract，`Claude Code` 则把 permission dialog 做得更细。

这对我们有启发，但近期应先借“模式设计”，不借“完整 UI 复杂度”。

建议：

1. 先收敛用户可理解的几档执行模式。
2. 让 mode 与治理/HITL 语义对齐。
3. 再决定是否需要复杂 approval overlay。

### 4.3 丰富 keybindings / vim / 终端高级操作

`Claude Code` 的键位、vim、搜索、历史检索很完整，但这类能力只有在 session shell 生命周期、discoverability 与状态模型稳定后才值得打磨。

否则容易出现：

1. 输入层很炫
2. 会话层却不完整

这会倒置优先级。

### 4.4 Plugin marketplace / app surface

`Codex` 已经把 skills、plugins、apps 都纳入 app-server 生态，`Claude Code` 也有 plugin load path。

对我们来说，这属于中长期扩展层。

前提应该是：

1. repository-local skills 已被 CLI 真正消费
2. workflow/preset metadata 已统一
3. local governance 能决定哪些扩展可见、可执行、可自动注入

在这些前提满足前，不宜过早做“市场化”的插件面。

## 5. 暂不建议照搬

### 5.1 不建议近期照搬 `Claude Code` 的超重 monolith CLI

`Claude Code` 的命令、功能旗标、权限 UI、voice、buddy、team memory、sharing、plugin、bridge 都极其丰富。

它的问题不是不好，而是：

1. 产品边界与我们不完全一致。
2. 代码体量太大，容易把我们拉向“终端里的 IDE 平台”。
3. 会稀释 `repo-ai-governor` 以治理编排为中心的主线。

结论：

可以学它的分层与设计方法，不建议学它的功能密度。

### 5.2 不建议近期照搬 `Codex` 的 Rust-native sandbox 与底层执行基础设施

`Codex` 的 Rust 生态在 sandbox、exec-server、state、hooks、app-server 上都很扎实。

但对当前仓库来说，近期更应借的是：

1. 协议边界
2. 生命周期模型
3. 状态投影思路

而不是立即重写：

1. process sandbox
2. native exec server
3. 整个 CLI runtime

否则工程代价会远高于当前收益。

### 5.3 不建议把“更花的 TUI”当作第一优先级

当前 benchmark 最容易让人误判的一点是：

1. `Claude Code` 和 `Codex` 都有更成熟的交互外观。

但对我们真正更重要的是：

1. session model
2. service layering
3. state read model
4. dynamic discoverability

如果这些没先补，先继续堆更多 UI 形态，收益不会最高。

## 6. 推荐 adoption 顺序

### Phase 1：最高 ROI

1. 完整化 session lifecycle：`resume picker / explicit session list / fork semantics / archive rollback planning`
2. 补 interaction runtime：`alt-screen policy / inline fallback / request-user-input overlay`
3. 让 dynamic discoverability 成真：skills、workflow presets、governed capability metadata 统一进 session shell command surface
4. 建 startup budget 与延迟装载边界

### Phase 2：主线产品化

1. 将现有 session client 上提为更稳定的 local service contract
2. 引入 read-optimized local state projection
3. 增加 lightweight session memory / session notes

### Phase 3：扩展面深化

1. remote session / desktop / IDE host reuse
2. 更产品化的 approval modes
3. plugin/app surface

## 7. 如果只做三件事

如果当前只允许投入三个实现窗口，建议按以下顺序：

1. `Codex`：补 `thread/session lifecycle + state projection`，因为这是 CLI 成为真正 session product 的地基。
2. `Claude Code`：补 `dynamic skill/workflow discoverability`，因为这能最快把“仓库里已经有的治理资产”投影到用户可见交互面。
3. `Codex + Claude Code`：补 `adaptive interaction runtime + startup discipline`，因为这是 session-first CLI 的体感分水岭。

## 8. 结论

这次 benchmark 的最终判断是：

1. `repo-ai-governor` 不需要走向 `Claude Code` 那种超重 monolith，也不需要立即复制 `Codex` 的 Rust 底座。
2. 它最应该借的是二者都已经验证过的“产品骨架”：
   - 会话优先入口
   - host-neutral service layering
   - 完整 session lifecycle
   - 动态 discoverability
   - 自适应交互运行时
3. 只要先把这套骨架补齐，当前已经存在的 governed capability catalog、session shell、command bridge、shared session truth 才会真正形成可持续迭代的 CLI 产品面。
