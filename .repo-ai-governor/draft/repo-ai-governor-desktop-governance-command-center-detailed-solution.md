# Repo AI Governor Desktop Governance Command Center 细化方案（Draft）

- Status: draft
- Date: 2026-04-05
- Owner: AI-Agent
- Scope: 在已选定 `方案 B：Governance command center` 的前提下，将 desktop 完整产品面细化为可执行的产品/交互/contract/交付方案。
- Depends On:
  - `.repo-ai-governor/draft/repo-ai-governor-desktop-complete-product-surface-benchmark-and-decision.md`
  - `.repo-ai-governor/draft/desktop-surface-technical-selection-and-design.md`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements.md`
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md`
  - `apps/desktop/README.md`
  - `apps/desktop/src/types/interfaces/desktop-preload.interface.ts`
  - `apps/desktop/src/runtime/desktop-preload-bridge.ts`
  - `docs/support-matrix.md`

## 1. 目标定义

### 1.1 一句话定义

Desktop 完整产品面要做成一个 `local orchestration service` 驱动的桌面治理指挥台，让用户在桌面端完成：

1. 监督执行。
2. 处理 HITL。
3. 查看 review / artifact / transcript。
4. 决定恢复、降级、终止或交接。
5. 追溯 policy / standards / ledger evidence。

### 1.2 它不是什么

1. 不是 full IDE。
2. 不是云端 DevOps 控制台。
3. 不是只读 dashboard。
4. 不是仅复制 CLI transcript 的聊天壳。

### 1.3 产品承诺

用户不必在 desktop 内完成所有编码，但应能在 desktop 内完成一次 governed run 的核心治理闭环：

1. 看见问题。
2. 理解原因。
3. 做出决策。
4. 跳转处置。
5. 回到桌面端确认结果。

## 2. 设计原则

### 2.1 Service-owned truth

desktop renderer 只消费 service-owned query/command seam，不直接读 `.repo-ai-governor/**` 文件，也不在 renderer 内维护第二份 runtime truth。

### 2.2 Action-first，不能只是看板

每个一级面都必须至少回答一个用户动作问题，而不是只负责展示状态。

### 2.3 Governance-first，而不是 editor-first

桌面端的中心价值是 `HITL / review / audit / orchestration supervision`，不是替代编辑器。

### 2.4 Cross-surface continuity

desktop、CLI、未来 IDE surface 必须共享会话、执行、review、artifact 语义，避免每个入口各讲一套语言。

### 2.5 Handoff is a feature

跳转到外部 editor、切换 worktree、打开 review 文件、回链任务台账，不是妥协，而是桌面治理控制台的正式能力。

## 3. 用户角色与核心任务

### 3.1 直接用户

1. `Developer`
   - 想看 agent 正在做什么、何时该介入、如何恢复或切换执行。
2. `Reviewer / Maintainer`
   - 想快速浏览 review、风险、证据和建议动作。
3. `Tech Lead / Governance Owner`
   - 想看规范、策略、异常升级和长期 automation 队列。

### 3.2 Desktop 最该解决的 6 个问题

1. 现在哪个 execution 值得我关注？
2. 为什么它卡住、降级、失败或升级 HITL？
3. 我应该批准、限制继续、终止，还是切换到人工接管？
4. 相关 review / artifact / transcript / policy trace 在哪里？
5. 需要我在哪个 worktree / editor / branch 里接手？
6. 当前 repo 的治理 automation 和 review queue 还有哪些待办？

## 4. 一级产品面与职责

## 4.1 Workspace Home

目标：

让用户先判断当前 workspace 是否健康、当前上下文是否正确。

展示内容：

1. workspace identity
2. service health / lifecycle
3. active stream / recent stream
4. adapter/provider readiness
5. latest execution summary
6. latest session summary

关键动作：

1. 切换 workspace
2. 唤起窗口 / 通知
3. 重启 service host
4. 进入最近一次 execution 或 review

需要的新 contract：

1. `queryConsoleHome`
2. `listWorkspaces`
3. `switchWorkspace`

## 4.2 Session Lane

目标：

把 desktop 从“只看 execution”提升为真正跨 surface 连续的会话入口。

展示内容：

1. session list
2. latest turn
3. route / status
4. unread event count
5. session summary / title / labels

关键动作：

1. `startSession`
2. `resumeSession`
3. `sendMainTurn`
4. `appendMessage`
5. `subscribeSession`
6. `forkSession`
7. `archiveSession`

需要的新 contract：

1. `querySessionLane`
2. `forkSession`
3. `archiveSession`
4. `renameSession`

## 4.3 Execution Board

目标：

让用户快速识别当前运行态、阻塞态和失败态 execution，并知道下一步该怎么做。

展示内容：

1. execution list
2. stage progress
3. latest event
4. pending HITL
5. recovery capability
6. checkpoint / reconnect status
7. worktree / branch / route / adapter surface

关键动作：

1. `startExecution`
2. `subscribeExecution`
3. `recoverExecution`
4. `cancelExecution`
5. `retryExecution`
6. `openWorktree`

需要的新 contract：

1. `queryExecutionBoard`
2. `getExecution`
3. `recoverExecution`
4. `terminateExecution`
5. `openExecutionWorktree`

说明：

当前 `DesktopOrchestrationServiceOwner` 已具备 `recoverExecution`，但 `DesktopPreloadBridgeApi` 还没有把它正式暴露给 renderer；这是方案 B 进入完整产品面的第一批必补项。

## 4.4 HITL Inbox

目标：

把 HITL 从“提醒卡片”升级为桌面端最重要的操作面。

展示内容：

1. pending decision list
2. risk facts
3. triggered policy
4. escalation reason
5. requested permissions / side effects
6. recommended next action

关键动作：

1. `allow`
2. `confirm with constraints`
3. `block`
4. `escalate`
5. `degrade`
6. `terminate`
7. `resume`

需要的新 contract：

1. `queryHitlInbox`
2. `submitHitlDecision`
3. `previewHitlImpact`

说明：

当前 runtime owner 已有 `submitHitlDecision` 能力，但 preload API 尚未暴露给 renderer；因此现在的 desktop 仍偏“可见”，还不够“可控”。

## 4.5 Artifact & Review Workbench

目标：

让用户在 desktop 内完成 review、artifact、transcript 的联动判断，而不是只看一个静态面板。

展示内容：

1. artifact list
2. review lifecycle
3. transcript slice
4. related execution / session
5. evidence links
6. handoff location

关键动作：

1. 打开 review summary
2. 打开 artifact detail
3. 查看 transcript context
4. open in editor
5. open in finder / terminal
6. navigate to related task / review lifecycle

需要的新 contract：

1. `queryArtifactWorkbench`
2. `getArtifactDetail`
3. `getReviewLifecycle`
4. `getTranscriptSlice`
5. `openArtifactHandoff`

说明：

当前 `queryArtifactPane` 已经让 desktop 从 deferred state 进入 ready baseline，但完整产品面还需要 detail-level navigation 和 handoff contract，而不只是 collection snapshot。

## 4.6 Policy & Standards Lens

目标：

把“为什么被阻断/升级/降级”解释清楚，体现治理产品差异化。

展示内容：

1. matched policy rules
2. standards pack source
3. risk facts summary
4. escalation chain
5. evidence links
6. ledger / checklist / review delta summary

关键动作：

1. 查看 policy trace
2. 查看 standards impact
3. 跳转到相关 evidence
4. 导出执行摘要

需要的新 contract：

1. `queryPolicyTrace`
2. `queryStandardsImpact`
3. `queryGovernanceEvidence`

## 4.7 Automation & Review Queue

目标：

把异步执行和后续待办纳入桌面端，而不是只围绕即时执行。

展示内容：

1. automation inbox
2. pending review queue
3. scheduled follow-up
4. recent background outcomes
5. reminder / SLA state

关键动作：

1. 打开 automation
2. 重新运行
3. 暂停 / 恢复
4. 接收 review queue 项
5. 标记 follow-up owner

需要的新 contract：

1. `queryAutomationInbox`
2. `queryReviewQueue`
3. `replayAutomationRun`
4. `pauseAutomation`
5. `resumeAutomation`

## 4.8 Diagnostics & Handoff

目标：

让桌面端成为“定位问题并交接”的主入口。

展示内容：

1. agent projection
2. degraded capabilities
3. fallback route
4. adapter warnings
5. memory/provider diagnostics
6. handoff targets

关键动作：

1. open external editor
2. open worktree path
3. open terminal here
4. open issue / PR / review doc
5. copy execution context

需要的新 contract：

1. `queryDiagnostics`
2. `queryHandoffTargets`
3. `openExternalEditor`
4. `openTerminalAtPath`

## 5. 关键用户闭环

## 5.1 闭环 A：监督一次 governed run

1. 用户打开 `Workspace Home`。
2. 进入 `Execution Board` 看最新 run。
3. 订阅 execution delta。
4. 如果出现 pending HITL，跳到 `HITL Inbox`。
5. 决策后回到 execution 看是否恢复。

DoD：

用户无需切回 CLI，也能完成“看见 -> 决策 -> 恢复”的闭环。

## 5.2 闭环 B：处理 review / artifact 问题

1. 用户在 `Execution Board` 看到 review artifact ready。
2. 跳转到 `Artifact & Review Workbench`。
3. 查看 review lifecycle、artifact detail 和 transcript context。
4. 需要人工修改时，跳转外部 editor/worktree。
5. 修改后回到 desktop 查看下一轮 verify 结果。

DoD：

用户无需自己到文件树里找 review、artifact、session transcript。

## 5.3 闭环 C：理解为什么被拦截

1. execution 或 review 显示 block / escalate / degrade。
2. 用户在 `Policy & Standards Lens` 查看 matched rules、risk facts、evidence。
3. 再决定是继续放行、补人工说明，还是转人工接管。

DoD：

用户能在一个桌面面板里回答“为什么会这样”，而不是去翻多个文档和日志。

## 5.4 闭环 D：处理异步待办

1. 用户打开 `Automation & Review Queue`。
2. 看到 background outcome 或 pending review。
3. 一键进入相关 execution / review / worktree。
4. 处置完成后回到 inbox 清空或推进下一项。

DoD：

desktop 不是只为“正在运行的那一个任务”服务，而是能承接异步后续面。

## 6. Contract 细化建议

## 6.1 已有 baseline

当前已存在的 desktop baseline contract：

1. `bootstrap`
2. `getHealth`
3. `startExecution`
4. `listExecutions`
5. `queryArtifactPane`
6. `subscribeExecution`
7. `startSession`
8. `sendMainTurn`
9. `appendMessage`
10. `resumeSession`
11. `listSessions`
12. `subscribeSession`
13. `getLifecycleSnapshot`
14. `requestWindowWake`
15. `registerNotification`
16. `restartServiceHost`
17. `buildGovernanceConsoleSnapshot`

## 6.2 第一批必须新增的 command seam

完整产品面要成立，第一批必须补的是 command seam，而不是再加只读聚合：

1. `submitHitlDecision`
2. `recoverExecution`
3. `getExecution`
4. `terminateExecution`
5. `openExecutionWorktree`

原因：

没有这批动作，desktop 仍然只是“看到问题”，不能“处置问题”。

## 6.3 第二批必须新增的 query seam

1. `queryConsoleHome`
2. `queryExecutionBoard`
3. `queryHitlInbox`
4. `queryArtifactWorkbench`
5. `queryPolicyTrace`
6. `queryGovernanceEvidence`
7. `queryAutomationInbox`
8. `queryDiagnostics`

原因：

当前 `buildGovernanceConsoleSnapshot` 适合 foundation/smoke baseline，但不适合作为完整产品面的长期读模型；完整产品面需要按用户任务分层的 read model，而不是一个大而泛的汇总对象。

## 6.4 建议的 contract 组织原则

1. query contract 按用户任务组织，不按底层文件类型组织。
2. command contract 保持最小显式动作，不把 renderer 变成 orchestration 调度器。
3. query response 允许聚合多个 canonical source，但 canonical truth 仍留在 service 层与 workspace ledger。
4. 所有桌面文案、状态和建议动作都应通过 shared i18n/reporting seam 输出。

## 7. 分阶段落地

## 7.1 Phase B1：Actionable Console Baseline

目标：

把 desktop 从“可见 foundation”推进到“可操作控制台”。

范围：

1. 暴露 `submitHitlDecision`
2. 暴露 `recoverExecution`
3. 暴露 `getExecution`
4. 新增 `queryExecutionBoard`
5. 新增 `queryHitlInbox`
6. 增加 worktree/editor handoff

DoD：

用户可以只通过 desktop 完成一个 execution 的观察、审批、恢复、交接。

## 7.2 Phase B2：Governance Evidence Surface

目标：

让 desktop 真正体现治理产品的差异化。

范围：

1. `Artifact & Review Workbench` detail view
2. `Policy & Standards Lens`
3. `queryGovernanceEvidence`
4. review lifecycle navigation
5. ledger summary / checklist summary

DoD：

用户可以在 desktop 内理解“为什么被拦/为什么通过/证据在哪里”。

## 7.3 Phase B3：Asynchronous Operations Surface

目标：

让 desktop 成为真正持续使用的 agent command center。

范围：

1. `Automation & Review Queue`
2. background outcome inbox
3. multi-workspace switch
4. parallel execution lane overview
5. richer notifications

DoD：

desktop 不仅能处理当前 run，还能承接后续异步待办。

## 7.4 Optional Overlay：Light Editor Affordance

只在确认价值显著时考虑：

1. read-only diff
2. Monaco preview
3. focused patch review panel

限制：

仍不演进为 full IDE fork。

## 8. 明确不做的内容

1. 完整编辑器 workbench。
2. renderer 直接访问 filesystem canonical truth。
3. 在 desktop 内复制一套完整 CLI 命令树。
4. 先做组织级云端控制平面。
5. 为了“看起来更强”而优先做可视化配置器，牺牲治理核心闭环。

## 9. 主要风险与缓解

| 风险 | 描述 | 缓解 |
|---|---|---|
| 只读面板过多 | 看得到但做不了，桌面端价值不成立 | 第一批优先补 command seam，尤其是 `submitHitlDecision` 与 `recoverExecution` |
| renderer 继续膨胀 | snapshot builder 越来越像第二个 runtime | 按用户任务拆 query model，保持 service-owned truth |
| handoff 体验割裂 | 用户频繁跳外部 editor，但回不来 | 为 execution/review/worktree 设计稳定的回链标识与 reopen affordance |
| scope 回到 full IDE | editor 能力逐渐蚕食治理定位 | 明确 editor 只做 optional overlay，不做主线 |
| automation 过早扩张 | 未收敛治理闭环就过度做异步平台 | automation inbox 放到第三阶段，先完成 execution/HITL/review 主闭环 |

## 10. 建议的下一步立项方式

如果要把本方案转成正式执行流，建议 project/sprint 按以下方式命名：

1. `project-0xx-desktop-governance-command-center`
2. `sprint-001-actionable-console-baseline`
3. `sprint-002-governance-evidence-surface`
4. `sprint-003-automation-and-review-queue`

任务拆分建议优先顺序：

1. `TK-xxx expose desktop hitl decision and execution recovery commands`
2. `TK-xxx add execution-board and hitl-inbox query contracts`
3. `TK-xxx land worktree/editor handoff contract`
4. `TK-xxx add artifact-workbench detail and review lifecycle navigation`
5. `TK-xxx add policy-trace and governance-evidence query surface`
6. `TK-xxx add automation-inbox and review-queue surface`

## 11. 最终收敛

方案 B 的细化版本不是“多做几个 desktop panel”，而是：

先把 desktop 做成一个真正可操作的 `governance command center`，以 `execution + HITL + review/artifact + policy evidence + handoff` 五条链路形成主闭环，再逐步补 automation、review queue 与更丰富的多工作区能力。

## 12. 如果同时实现 VS Code 插件

### 12.1 结论先行

如果同时做 Desktop 和 VS Code 插件，最合适的结论不是“二选一”，也不是“双端功能完全对齐”，而是：

1. `Desktop` 继续作为 `outer-loop governance command center`。
2. `VS Code 插件` 作为 `inner-loop editor companion`。
3. `CLI` 继续承担 `bootstrap / automation / CI / scriptable entry`。
4. 三者共用同一套 `local orchestration service + shared query/command contract`，禁止分别演化出独立 runtime truth。

### 12.2 为什么这是更合适的结论

结合 2026-04-05 检索到的 VS Code 官方资料：

1. VS Code 官方 AI extensibility 文档明确建议扩展按能力选择 `Chat Participant`、`Language Model Tool`、`Language Model API` 或 `MCP`，并强调这些能力都可以通过 extension host 深度接入编辑器。
2. VS Code 官方 UX 文档明确建议：
   - `Views` 保持尽量少，通常一个 view container 已足够。
   - `Tree View` 优先于重型 custom webview。
   - `Webview` 只在确有必要时使用，避免重复现有功能。
3. VS Code 官方 workspace trust 文档明确支持 `limited` 模式，适合把危险能力 gated 在 trusted workspace 下。
4. GitHub Copilot 当前在 VS Code 里已经把“本地 editor agent”和“GitHub cloud coding agent”明确区分开：一个适合 editor 内即时交互，一个适合后台异步执行。

因此，对 `Repo AI Governor` 来说：

1. `VS Code 插件` 最适合承接高频、就地、文件上下文强的动作。
2. `Desktop` 最适合承接跨 execution、跨 worktree、跨 review queue、跨 automation 的监督和治理动作。
3. 如果让二者做同一件事，只会造成复杂度倍增和产品心智混乱。

### 12.3 推荐的双表面分工

#### Desktop 负责什么

1. multi-workspace overview
2. execution board
3. HITL inbox
4. artifact/review workbench
5. policy & standards lens
6. automation inbox
7. review queue
8. cross-surface handoff

#### VS Code 插件负责什么

1. 当前文件/当前 selection 的治理操作入口
2. session lane 与 editor 内 chat handoff
3. TODO / diagnostics / quick fix 触发的 governed actions
4. 当前 worktree / branch / review 的轻量状态视图
5. 代码内 review/comment/artifact deep link
6. terminal/task/handoff 的 editor-local 体验

### 12.4 VS Code 插件不该做什么

1. 不要在 VS Code 里再复制一套完整的 desktop command center。
2. 不要把 extension 做成“大 webview 套壳 app”。
3. 不要让插件自己维护独立的 execution/session/policy 真值。
4. 不要一上来做 full Copilot replacement。

### 12.5 推荐的 VS Code 插件 MVP 形态

结合官方扩展能力与 UX 约束，推荐插件 MVP 采用：

1. `一个 View Container`
   - 名称可为 `Governor`
2. `3-4 个轻量 Views`
   - `Run`
   - `Review`
   - `HITL`
   - `Context`
3. `一个 Chat Participant`
   - 用于 `@governor`
4. `少量 Language Model Tools`
   - 用于 agent mode 下的治理专用工具调用
5. `Commands + Code Actions`
   - 用于从 editor、TODO、diagnostics、selection 直接触发治理动作
6. `必要时才用 Webview`
   - 仅用于 review/artifact detail 或 richer execution detail

### 12.6 推荐的插件能力拆分

#### Editor-native 能力

1. `Run with Governor`
2. `Open current file in review context`
3. `Send selection to session`
4. `Delegate TODO to governed execution`
5. `Open worktree handoff`
6. `Show latest policy/evidence for current file`

#### Chat / Agent 能力

1. `@governor`
   - 回答当前仓库治理相关问题
2. `#governorReview`
   - 拉取 review 相关上下文
3. `#governorPolicy`
   - 拉取 risk/policy trace
4. `#governorHandoff`
   - 把 editor 当前上下文交给 local orchestration service

#### View 能力

1. 当前 execution 状态
2. 当前 review lifecycle
3. 当前 pending HITL
4. 当前工作区 readiness

### 12.7 共用核心必须怎么做

若同时做双端，先统一核心，再做表面：

1. `local orchestration service`
2. `service-owned DTO / event / query / command contract`
3. `shared reporting / i18n / agent projection view-model`
4. `shared session / execution / artifact / hitl identifiers`

绝不能出现：

1. desktop 走一套 contract
2. VS Code 插件再拼另一套 extension-only truth
3. CLI 再维持第三套命名和状态机

### 12.8 推荐的实现顺序

如果资源有限，推荐顺序是：

1. 先继续做 shared core
   - 补 `submitHitlDecision`
   - 补 `recoverExecution`
   - 补 `queryExecutionBoard`
   - 补 `queryHitlInbox`
   - 补 handoff contract
2. 再做 `VS Code 插件 MVP`
   - 因为更接近日常高频入口，且可直接利用 editor 上下文
3. 再继续做 `Desktop Phase B2/B3`
   - 把 governance evidence、automation queue、多工作区监督补完整

原因：

1. VS Code 插件更接近用户日常编码入口， adoption 更快。
2. Desktop 的差异化更强，但它更适合承接第二阶段的治理中心能力。
3. 两端如果同时冲 full surface，极易重复造 UI 和状态管理。

### 12.9 最终结论一句话

如果你要同时做 VS Code 插件，最佳策略不是削弱 desktop，而是把产品线明确拆成：

`VS Code 插件 = editor 内高频治理伴侣`

`Desktop = 跨执行与异步治理指挥台`

二者共享同一套本地编排服务和治理真值，但绝不追求完全 UI 对等。
