# Repo AI Governor Desktop 完整产品面竞品调研与方案决策（Draft）

- Status: draft
- Date: 2026-04-05
- Owner: AI-Agent
- Scope: 基于当前仓库的 desktop/runtime 边界，结合官方互联网资料对 `Codex`、`Cursor`、`GitHub Copilot` 的最新产品面进行对比，给出 `Repo AI Governor` 的 desktop 完整产品面方案决策。
- Local Inputs:
  - `.repo-ai-governor/draft/repo-ai-governor-current-priority-backlog.md`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements.md`
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md`
  - `apps/desktop/README.md`
  - `docs/support-matrix.md`
- External References:
  - OpenAI, `Introducing the Codex app`, 2026-02-02, updated 2026-03-04: <https://openai.com/index/introducing-the-codex-app/>
  - Cursor, `Cursor Agent` product page, retrieved 2026-04-05: <https://cursor.com/en-US/product>
  - Cursor Docs, `Background Agents`, retrieved 2026-04-05: <https://docs.cursor.com/en/background-agents>
  - Cursor Docs, `Bugbot`, retrieved 2026-04-05: <https://docs.cursor.com/en/bugbot>
  - GitHub Docs, `GitHub Copilot features`, retrieved 2026-04-05: <https://docs.github.com/en/copilot/get-started/features>
  - GitHub Docs, `About GitHub Copilot cloud agent`, retrieved 2026-04-05: <https://docs.github.com/en/copilot/concepts/agents/coding-agent/about-coding-agent>

## 1. 结论先行

### 1.1 推荐结论

推荐将 `Repo AI Governor` 的 Desktop 完整产品面定义为：

`local orchestration service` 驱动的 `governance command center`，即：

1. 不是 `Cursor` 式 full AI IDE。
2. 不是 `GitHub Copilot` 式以 GitHub 云工作流为主的 cloud-agent console。
3. 也不是只读 dashboard 或单一聊天窗口。
4. 而是一个以 `execution supervision + HITL decision + review/artifact/worktree handoff + policy/standards evidence + automation inbox` 为核心的桌面治理控制台。

### 1.2 推荐理由

1. 它最符合本仓库已经明确的边界：desktop 只能是 `presenter / HITL client`，不能拥有 runtime 主状态。
2. 它最贴近 `Codex app` 当前已经被市场验证的“agent command center”心智，同时保留本产品自身的治理差异化。
3. 它比 full IDE 路线更可控，不会把当前问题从“产品面补齐”升级成“重新做一个编辑器平台”。
4. 它比 GitHub-first cloud console 更符合本产品“治理目标仓库本地工作流”的主线，不把产品收缩成 GitHub 专属增强层。
5. 它能自然复用当前仓库已有的 `session / execution / HITL / artifact-pane` typed seam，而不是另造第二套桌面真值源。

## 2. 本仓库的已知前提

### 2.1 不是自由选题

这次 desktop 决策不是从零开始，而是有明确前提：

1. PRD 已要求 `CLI` 与未来桌面端共用同一套 `local orchestration service`。
2. 架构文档已要求桌面端只做状态展示、日志流与 HITL 交互，不直接持有 runtime 主状态。
3. 架构分层已要求 `apps/desktop` 只依赖 `service client / reporting / shared`，不直接依赖 `core-runtime*` 与具体 provider。
4. `apps/desktop` 当前已完成 `Phase 0 + Phase 1 foundation`，包括 `typed preload bridge`、`session bridge`、`governance console transport-neutral view-model` 与 `artifact-pane contract baseline`。
5. `project-046` 已把 `artifact pane` 从 deferred gate 推进为 service-owned typed query contract；因此现在讨论的已不是“能不能有产物面板”，而是“桌面端完整产品面应该长成什么样”。

### 2.2 对完整产品面的直接约束

因此，desktop 完整产品面必须满足：

1. 不得 filesystem bypass。
2. 不得在 renderer 内持有第二份 runtime truth。
3. 必须通过 service-owned query/command seam 获取状态与执行动作。
4. 必须比 CLI 更强地承担 `supervise / decide / review / resume / trace` 的职责，而不是简单复制 CLI。

## 3. 官方产品观察

## 3.1 Codex：最强参考是“agent command center”

基于 OpenAI 官方 `Introducing the Codex app`（2026-02-02，2026-03-04 更新）可以确认：

1. Codex app 被明确定位为 `a command center for agents`。
2. 它强调多 agent 并行、按 project/thread 组织、长任务协作、diff review、评论、与本地编辑器联动。
3. 它内置 worktrees，允许多个 agent 在同一 repo 上并行且互不冲突。
4. 它复用 CLI 与 IDE extension 的 session history/configuration，强调跨 surface continuity。
5. 它把 `skills`、`automations`、`review queue`、sandbox rules 放进同一个桌面产品面。

对本项目最有价值的借鉴：

1. Desktop 不是另一个编辑器，而是 agent 协作指挥台。
2. 多线程、多 worktree、review queue、automation inbox 应该是 desktop 的核心价值，而不是附属功能。
3. 桌面端最强差异化在“监督与调度多个 agent”，不是在“自己提供多少编辑器控件”。

不应直接照搬的部分：

1. Codex 的 product family 已横跨 app、CLI、IDE、web、cloud；本仓库当前仍应坚持 repo-local orchestration 主线。
2. Codex 的 skills/automations 已有成熟生态；本仓库要先收敛治理正确性，再逐步开放更广的自动化能力。

## 3.2 Cursor：最强参考是“AI-native editor + background agent network”

基于 Cursor 官方 product/docs 页面，当前可确认：

1. Cursor 把 desktop 定义为 `Manual to agentic coding, in one familiar editor`。
2. 它强调复杂任务先澄清、做计划，再在后台执行。
3. 它把 `Desktop / CLI / Other Surfaces / Web & Mobile` 联成一个 agent 网络。
4. 它在桌面端强推 terminal、上下文附着、plugins、skills。
5. `Background Agents` 支持异步远程执行；`Bugbot` 直接进入 GitHub PR review 流程。

对本项目最有价值的借鉴：

1. 用户确实希望 desktop 成为高频前台入口，而不是冷门运维页。
2. 背景执行、问题澄清、计划卡片、后续追问、检查点回退，都是桌面体验里很关键的交互元素。
3. `skills/plugins/rules` 应该是 product surface 的一部分，而不是藏在底层配置里。
4. PR review 与 background agent 之间应该是可回跳、可联动的，不应割裂。

不应直接照搬的部分：

1. Cursor 的核心是 AI-native editor；而本产品核心是治理编排，不是重做编辑器。
2. 如果照着 Cursor 做 full editor，本仓库会很快陷入 Monaco/workbench/plugin host/editor ergonomics 的巨大范围扩张。
3. Cursor 的 cloud/background agent 网络很强，但本产品当前北极星仍是 local orchestration service，而不是以远程 agent 网络为主。

## 3.3 GitHub Copilot：最强参考是“区分本地 agent mode 与云端 coding agent”

基于 GitHub 官方文档，当前可确认：

1. Copilot 在 IDE 内区分 `Edit mode` 与 `Agent mode`。
2. GitHub 还单独提供 `cloud agent`，其运行在 GitHub Actions 驱动的 ephemeral 环境里。
3. Copilot 把 `coding agent`、`code review`、`Spaces`、`Memory`、`Skills` 连到同一个产品族。
4. GitHub Docs 明确强调 `cloud agent` 与 IDE `agent mode` 是不同产品面。
5. GitHub Desktop 目前只明确承接 `commit message / description generation`，不是一个完整的 coding-agent desktop console。

对本项目最有价值的借鉴：

1. 必须明确区分“本地实时交互面”和“异步执行面”，不能混成一团。
2. review、audit、PR handoff、memory/space 这些并不是附加项，而是 agent 产品面能否形成闭环的关键。
3. 不是每个 surface 都要等价；有些 surface 负责执行，有些负责监督，有些负责回顾。

不应直接照搬的部分：

1. Copilot 的强项深度绑定 GitHub 平台与 Actions，这与本仓库“目标仓库本地治理”的边界不完全一致。
2. GitHub Desktop 本身并不能提供我们想要的完整 desktop console 参考。

## 4. 备选方案对比

### 4.1 方案 A：Full AI IDE workbench（偏 Cursor）

定义：

1. 直接把 desktop 做成 AI-native editor。
2. 内置代码编辑、diff、terminal、agent、review、plugin、settings。

优点：

1. 用户感知最完整，日常编码与 agent 协作都在一个壳里。
2. 可以最大化借鉴 Cursor 的“熟悉编辑器 + agent”心智。
3. 长期来看可承载更多插件和工作流。

缺点：

1. 与本仓库当前“desktop 不持有 runtime 主状态”的边界张力最大。
2. 会显著扩大范围到 editor kernel、plugin host、Git UX、diff UX、shortcut/system integration。
3. 很容易把产品重心从治理编排偏成“再做一个 IDE”。
4. 对当前团队最关键的价值闭环提升并不一定最快。

结论：

当前不推荐。

## 4.2 方案 B：Governance command center（偏 Codex app，但更治理化）

定义：

1. 桌面端是本地治理控制台，而不是 full IDE。
2. 核心围绕 `session / execution / HITL / artifact / review / policy / automation / worktree handoff`。
3. 编辑与深度代码修改通过外部 editor deep link / worktree checkout 完成。

优点：

1. 与 PRD、技术方案、架构分层完全同向。
2. 能直接复用当前 `apps/desktop` 已有 seam，工程连续性最好。
3. 最能体现本产品差异化：治理、审批、审计、review verify、台账回灌。
4. 支持多 agent 并行、review queue、automation inbox 这些“桌面端天然该强”的能力。
5. 能在不做 full IDE 的前提下，形成真实闭环。

缺点：

1. 如果 editor deep link/worktree handoff 不好用，用户会觉得“还要跳出去改代码”。
2. 如果只做看板不做动作面，会沦为运维 dashboard。
3. 需要把 query/command contract 设计得足够好，否则 renderer 会继续很薄。

结论：

当前推荐。

## 4.3 方案 C：Git/PR-centric cloud console（偏 GitHub Copilot cloud agent）

定义：

1. 以 issue/PR/code review/agent sessions 为主。
2. 重点在 Git 平台事件流和异步 agent 工作流。

优点：

1. review、audit、PR loop 清晰。
2. 对企业协作与管理者可见性友好。
3. 易于衔接 code review 与 async agent 结果。

缺点：

1. 过度依赖 GitHub-like 平台心智，不够 tool-neutral。
2. 弱化本产品的 repo-local / local-orchestration-service 主线。
3. 对非 GitHub 或受限网络/本地仓库场景不够友好。
4. 会把 desktop 价值压缩成“PR 管理台”，而不是“开发治理控制台”。

结论：

可借鉴其 audit/review/async split，但不应作为主方案。

## 4.4 方案 D：只读运营看板 / 轻量聊天壳

定义：

1. 桌面端只负责展示运行状态，或提供简单聊天入口。

优点：

1. 实现最快。
2. 风险最低。

缺点：

1. 无法承载 HITL 决策、review 闭环、artifact/ledger trace、automation queue。
2. 很难成为真正高频 surface。
3. 会浪费已经铺好的 desktop seam。

结论：

不推荐。

## 5. 对比结果与最终推荐

### 5.1 推荐选择

推荐采用 `方案 B：Governance command center`。

### 5.2 推荐理由

1. `战略契合度` 最高：符合 `Repo AI Governor` 的产品主线，不把桌面端变成另一个 editor 或另一个 cloud control plane。
2. `架构契合度` 最高：与 `local orchestration service + thin client` 边界完全一致。
3. `差异化` 最强：相较于 Codex/Cursor/Copilot，本产品真正独特的地方是治理、HITL、规范、审计、任务台账回灌。
4. `工程可达性` 最好：能复用现有 `apps/desktop` foundation，而不是推翻重做。
5. `产品延展性` 仍足够：以后若需要 richer editor affordance、remote execution、organization view，可以作为 overlay 追加，而不是先天堵死。

### 5.3 借鉴策略

不是“像某一个产品”，而是明确借鉴拆分：

1. 向 `Codex app` 借 `command center` 心智、多 agent 并行、worktree、review queue、automation inbox。
2. 向 `Cursor` 借后台执行、计划卡片、skills/plugins 显性化、PR review 与 background execution 联动。
3. 向 `GitHub Copilot` 借本地 agent 与异步 agent 的职责分离、review/audit 入口、memory/space 语义。

## 6. 推荐的 Desktop 完整产品面定义

### 6.1 一级产品面

推荐 desktop 完整产品面至少包含以下 8 个一级面：

1. `Workspace Home`
   - workspace 选择
   - service health
   - active stream / recent stream
   - adapter/provider readiness
2. `Session Lane`
   - 会话列表
   - 最近 turn
   - resume/fork/archive
   - CLI/IDE/desktop continuity
3. `Execution Board`
   - 当前与历史 execution
   - stage 进度
   - latest event
   - checkpoint/recovery
   - worktree/branch status
4. `HITL Inbox`
   - 待审批事项
   - risk facts
   - policy outcome
   - `allow / confirm / block / escalate / degrade / terminate / resume`
5. `Artifact & Review Workbench`
   - artifact list
   - review lifecycle
   - transcript slice
   - diff/summary/open-in-editor
6. `Policy & Standards Lens`
   - 当前命中的 standards pack / rules
   - policy trace
   - why blocked / why escalated
   - evidence links
7. `Automation & Review Queue`
   - 周期任务
   - background results
   - pending review queue
   - follow-up action
8. `Diagnostics & Handoff`
   - agent projection
   - degraded capability
   - route fallback
   - open in external editor / checkout worktree / open PR or issue

### 6.2 用户可感知的核心闭环

完整产品面不是“面板很多”，而是用户能在 desktop 内完成以下闭环：

1. 看到 agent 在做什么。
2. 明白为什么被阻断、升级、降级。
3. 直接作出 HITL 决策。
4. 打开 review/artifact/transcript 做判断。
5. 在需要时切到外部 editor/worktree 介入。
6. 返回桌面端继续监督、恢复、关闭或复查。

### 6.3 不做什么

当前明确不纳入 Desktop 完整产品面的内容：

1. 自研 full IDE workbench。
2. 直接在 renderer 里做文件系统真值读取。
3. 让 desktop 拥有独立于 CLI/runtime 的第二套 orchestration logic。
4. 一步扩张成组织级云控制平面。

## 7. 推荐的落地顺序

### 7.1 P2-A：Supervisor Loop

先补最关键的前台监督闭环：

1. `queryConsoleHome`
2. `queryExecutionBoard`
3. `queryHitlInbox`
4. `resume / degrade / terminate / confirm` 动作面
5. worktree/editor handoff

### 7.2 P2-B：Governance Visibility

再补本产品最有差异化的治理视角：

1. `queryGovernanceEvidence`
2. `queryPolicyTrace`
3. `queryStandardsImpact`
4. review lifecycle navigation
5. ledger/checklist/task summary

### 7.3 P2-C：Asynchronous Ops

最后补异步运营和多 surface 协作能力：

1. automation inbox
2. review queue
3. background follow-up
4. cross-surface continuity
5. optional Git/issue/PR bridge

## 8. 对 backlog 的直接影响

这份决策意味着：

1. `.repo-ai-governor/draft/repo-ai-governor-current-priority-backlog.md -> 4.1 Desktop 完整产品面` 不应再被理解为“继续堆一些 renderer panel”。
2. 后续正式 project/sprint 立项时，应以 `governance command center` 为目标名义拆 task，而不是以“桌面版 IDE”名义拆 task。
3. task 设计应优先围绕 service-owned query/command contract、HITL 决策面、review queue、policy trace、editor handoff，而不是优先上编辑器内核能力。

## 9. 最终推荐一句话

`Repo AI Governor` 的 Desktop 完整产品面，最适合做成“Codex 式 agent command center 的治理化版本”，吸收 Cursor 的后台执行与技能心智、吸收 Copilot 的 review/audit 分层，但明确拒绝在当前阶段把它做成 full AI IDE 或 GitHub-only cloud console。

## 10. 后续细化

若接受 `方案 B`，后续细化方案见：

1. `.repo-ai-governor/draft/repo-ai-governor-desktop-governance-command-center-detailed-solution.md`
