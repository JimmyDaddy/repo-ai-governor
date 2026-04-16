# VS Code Full Governance Workbench And Task-Driven Orchestration Technical Solution (Draft)

- Status: draft
- Date: 2026-04-16
- Owner: AI-Agent
- Scope: 以 shared local orchestration service 为真值边界，将 VS Code 从 editor companion 提升为 primary governance workbench，在编辑器内统一执行、任务、会话、HITL、review、workflow、automation 与 adoption/host operations，同时保留 CLI 作为 scriptable / CI / headless automation substrate。
- Target Modules:
  - `runtime.governance-clients`
  - `runtime.orchestration`
- Related Inputs:
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements.md`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/module-overview.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/governance-surface-client-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/desktop-command-center-and-vscode-editor-companion-split.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-orchestration/module-overview.md`
  - `apps/vscode-extension/README.md`
  - `apps/vscode-extension/src/runtime/vscode-extension-service-runtime.ts`
  - `apps/cli/src/runtime/orchestration-service-runtime.ts`
  - `packages/core-orchestration-service/src/local-orchestration-service-sidecar-client.ts`
  - `scripts/governance/task-ledger-projection.js`
  - `docs/support-matrix.md`

## 1. 背景与问题

1. 当前 `apps/vscode-extension` 虽然已经可以安装运行，但正式产品定位仍是 `editor companion MVP`，其能力主要停留在 `Execution Board / HITL Inbox / Workspace Context / Review Detail / @governor(status|review)` 这类轻量 consumer surface，距离“主力工作台”还有明显距离。
2. 用户真实期待并不是“在 VS Code 里看一点状态”，而是希望把 VS Code 直接作为治理工作的主操作面：
   - 在编辑器里发起与恢复 governed run / review / review-verify。
   - 在同一个地方看到任务状态、执行队列、会话连续性、HITL、review 生命周期与流程编排进度。
   - 在需要时继续完成 workflow authoring、graph inspection、adoption/host operations，而不是频繁切回 CLI 或桌面端。
3. 现有正式架构把产品分成 `Desktop = outer-loop command center`、`VS Code = inner-loop editor companion`、`CLI = automation/scriptable entry`，这在早期收敛边界时有效，但它也直接把 VS Code 限制在“不能成为 full workbench”的位置上。
4. 当前 gap 的核心不只是“插件还没补够几个命令”，而是“正式产品边界把 VS Code 定义得过窄”：
   - `core-orchestration-service` 已拥有比当前插件消费面更丰富的 sidecar query / command seam，例如 `queryQueueOverview`、`startSession/sendSessionTurn`、`list/resume/fork/archive/unarchiveSession`。
   - 插件只是薄消费这些能力的一小部分，并没有形成真正的工作台式聚合。
5. “任务状态展示”与“流程编排可视化”仍然存在结构性缺口：
   - canonical truth 目前位于 `current-context + task-ledger sqlite + tasks.csv/checklist/task cards` 这条治理链路上。
   - workflow / orchestration truth 位于 runtime service 与 graph ledger。
   - VS Code 端还没有 task/workflow/automation/adoption 这些 service-owned query seam。
6. 因此，如果用户目标是 `full workbench`，这份草案就不能继续把“不是 full IDE workbench”当成默认前提，而必须正面回答：是否要把 VS Code 提升为主治理工作台，并重写当前 desktop / VS Code 的职责分工。

## 2. 目标

1. 将 VS Code 正式提升为 `primary governance workbench`，而不再只是 `inner-loop editor companion`。
2. 在保持 `local orchestration service` 为唯一真值边界的前提下，让 VS Code 覆盖真实治理闭环所需的大多数 surface：
   - execution
   - tasks
   - sessions
   - review / review-verify
   - HITL
   - workflow visibility / authoring
   - automation / review queue
   - adoption / host operations
3. 把用户当前在 CLI、桌面端、编辑器之间来回切换的高频治理动作，尽可能收敛到一个 workbench 内完成。
4. 为 heavier governance UI 提供正式承载方式，包括 multi-pane webview、workbench view container、chat/commands/code actions 的混合模型，而不是把 VS Code 永远限制在轻量 views。
5. 明确 full workbench 化对现有 `runtime.governance-clients` 与 `runtime.orchestration` contract 的影响，给 review/promotion 留出可审查的边界。

## 3. 非目标

1. 不让 VS Code extension host 持有新的 runtime 主状态，也不允许它绕过 orchestration service 直接读取 `.repo-ai-governor/**` canonical truth。
2. 不废弃 CLI；CLI 仍保留 `bootstrap / automation / CI / scriptable / headless fallback` 的关键职责。
3. 不要求所有 full workbench surface 在第一阶段一次性交付；允许 phased rollout，但终局目标必须是 full workbench，而不是停在 companion parity。
4. 不要求所有 surface 都以同一种 UI 技术实现；允许 `TreeView / Chat / Commands / Code Actions / Webview Workbench` 混合承载。
5. 不把“兼容当前 desktop / VS Code split”当成不可突破的约束；若 split 已妨碍产品目标，应允许被正式 supersede。

## 4. 现状与约束

1. 当前正式模块文档与 ADR 仍把 full workbench 排除在外：
   - [runtime-governance-clients/module-overview.md](/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/module-overview.md) 明确将 `不做 full IDE workbench` 列为非目标。
   - [desktop-command-center-and-vscode-editor-companion-split.md](/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/desktop-command-center-and-vscode-editor-companion-split.md) 明确采用 `Desktop outer-loop / VS Code inner-loop` 的产品分工。
2. 与此同时，shared service seam 已经说明“full workbench”并非要从零造 runtime：
   - 现有 sidecar 已支持 queue、session、execution 等多类查询与动作。
   - VS Code 现在的问题更多是“未消费 + 缺少若干关键 seam”，不是“底层完全没有基础能力”。
3. task/status 面仍缺 service seam：
   - task canonical truth 在 `task-ledger sqlite`。
   - rendered `tasks.csv` / `checklist.md` 只是派生视图。
   - 若 VS Code 直接去读这些文件，会违反现有 `governance-surface-client-contract` 的边界。
4. workflow / automation / adoption 也仍缺 editor-safe read model：
   - orchestration runtime 持有 graph-first truth。
   - adoption / host / installer 仍有部分能力偏 CLI-first。
   - full workbench 若要成立，必须补齐这些 seam，而不是只补 UI。
5. VS Code 若成为 primary workbench，必然引入更重的 UI 形态：
   - 仅靠 `1` 个 view container + `3-4` 个轻量 views 已不足以承接目标范围。
   - 需要接受 mixed surface model，包括 tree views、commands、chat participant 与大颗粒 detail/workbench webview。
6. 仍然必须保持的硬约束：
   - `local orchestration service` 继续是 shared truth owner。
   - CLI 仍是 headless/scriptable substrate 与 CI/automation 入口。
   - full workbench 不能演化成 extension-host 内的 shadow runtime。

## 5. 方案选项与对比

### 5.1 方案 A：维持 editor companion，只补少量命令与视图

1. 保持当前 `companion MVP` 定位，只增加少量 command palette 命令、slash command 与轻量视图。
2. 优点：
   - 成本最低。
   - 与当前正式文档和 split 完全一致。
3. 缺点：
   - 无法满足“VS Code 就是主工作台”的目标。
   - 用户仍需在 CLI / desktop / VS Code 之间来回切换。
   - 会继续固化“插件能看不能干”的产品印象。

### 5.2 方案 B：先做到 first-class client parity，但不触碰 full workbench 边界

1. 将 VS Code 提升为可执行的一等治理客户端，覆盖 `run / review / review-verify / tasks / queue / sessions / workflow visibility`，但仍不承接 outer-loop 全量 surface。
2. 优点：
   - 能较快改善“插件基本不可用”的现状。
   - 对现有 split 冲击较小。
   - 可大量复用现有 sidecar seam。
3. 缺点：
   - 终局仍不是 full workbench。
   - outer-loop governance、automation、adoption、host operations 依然分散在别处。
   - 会让“后面再做 full workbench”继续变成无限延期的 follow-up。

### 5.3 方案 C：将 VS Code 升级为 primary full governance workbench

1. 正式把 VS Code 定义为 primary governance workbench，在其中承接 inner-loop 与 outer-loop 的大多数治理 surface。
2. 目标能力包括：
   - governed execution
   - tasks / task detail / execution backlinks
   - sessions / chat / continuity
   - review / review-verify / artifact workbench
   - HITL inbox / queue / notifications
   - workflow preview / authoring / graph visualization
   - automation / review queue
   - adoption / host operations
3. 优点：
   - 与用户主操作环境一致，体验最连贯。
   - 彻底解决“插件只是个框”的产品认知问题。
   - 能把 editor-local context、治理动作与全局 orchestration 看板真正放进同一个工作台。
4. 缺点：
   - 需要明确 supersede 当前 `Desktop outer-loop / VS Code inner-loop` 的正式 split。
   - 需要接受更重的 VS Code workbench UI 和更长的 phased rollout。
   - adoption / host / installer 等 surface 在前期可能仍需 CLI bridge 过渡。

### 5.4 对比结论

1. 推荐 `方案 C`，但交付路径可以吸收 `方案 B` 作为中间阶段，而不是终局。
2. 如果终局目标已经明确是 full workbench，那么 `方案 B` 只应作为 rollout phase，不应再被当作正式产品终点。
3. `方案 A` 解决不了根本问题；`方案 B` 能改善体验但会留下结构性分裂；`方案 C` 才与当前用户目标对齐。

## 6. 推荐方案

1. 正式把 VS Code 从 `inner-loop editor companion` 提升为 `primary governance workbench`。
2. 重新定义多表面职责分工：
   - `VS Code`: 目标方向上承接 `primary workbench` 身份；但在对应 phase delivery evidence 落地前，public support truth 仍保持“secondary surface / companion-upgraded”语义，不提前改口为已完成 primary cutover。
   - `CLI`: scriptable / CI / automation / headless fallback substrate。
   - `Desktop`: 不再被视为唯一 outer-loop command center，但在本方案批准窗口内仍冻结为 `foundation-only secondary surface`；是否进一步降级为 optional shell、distribution host 或进入 de-scope，必须等待独立 desktop decision surface 与真实 rollout evidence，而不是在本方案中顺手删除。
3. full workbench 不等于“插件里自己维护状态”，而是：
   - 继续以 `local orchestration service` 为唯一真值边界。
   - 所有 task / workflow / execution / review / automation / adoption state 继续通过 service-owned query/command seam 暴露。
4. VS Code 的 UI 形态改为 `hybrid workbench model`：
   - `TreeView / Commands / Chat / Code Actions` 负责轻量入口与 editor-local handoff。
   - `Workbench Webview / Detail Panels` 负责 execution board、review workbench、task board、workflow studio、automation queue 等重型 surface。
5. 对尚未 service-native 的 CLI-heavy surface，允许短期使用 typed command bridge：
   - `init / adopt / host / upgrade / verify / pack`
   - 但这些 bridge 必须把结果回链到 service-owned execution/task/session/audit truth，而不是在 VS Code 内形成私有状态。
6. 将 full workbench 视为一个需要正式 promotion 的产品边界变更，而不是“插件多做点功能”的普通迭代。

## 7. 核心设计与契约影响

### 7.1 产品边界重置

1. 当前 `runtime.governance-clients` 模块 overview 与 `desktop-command-center-and-vscode-editor-companion-split` ADR 都需要被 review：
   - 若接受本方案，就不能继续把 `不做 full IDE workbench` 作为非目标。
   - 也不能继续把 `Desktop outer-loop / VS Code inner-loop` 当成冻结分工。
2. 推荐的新分工是：
   - `VS Code primary workbench`
   - `CLI automation/headless substrate`
   - `Desktop optional shell or follow-up decision surface`
3. 这意味着本草案不是简单 follow-up，而是对当前治理客户端产品边界的显式改写提案。

### 7.1.1 Promotion Freeze For Desktop And Public Support Truth

1. 本方案一旦进入 promotion，允许正式文档把 `VS Code-first full governance workbench` 记为产品方向与 contract target，但这不等价于 public support truth 立即完成切换。
2. `docs/support-matrix*.md`、`apps/vscode-extension/README.md`、`docs/local-adoption-playbook*.md` 与 `integrations/desktop/README.md` 只允许在对应 phase 的真实 delivery evidence 落地后再同步更新支持口径。
3. 在 `Phase A / Phase B` 期间，public support truth 仍保持：
   - `VS Code`: secondary surface / companion-upgraded path，而不是已经完成 primary workbench cutover。
   - `Desktop`: foundation-only secondary surface；保留现有 queue overview / artifact pane / HITL / session continuity baseline，不得被文档口径提前删除。
4. 只有在 `Phase C` 证明 `Workflow Studio + workflow stage progress + adoption/host operations cutover + support-truth refresh` 全部闭环后，`VS Code primary workbench` 才能成为 public support claim。
5. 因此，本方案不批准“先改 support matrix 宣称 full workbench，再慢慢补证据”的路径；planning-side formal direction 与 adopter-facing support truth 必须分层治理。

### 7.1.2 Supersede Scope Freeze

1. 本方案的 supersede 目标不是“整包废弃 `technical-solution.governance-surface-clients`”，而是只替换其中与 `Desktop outer-loop / VS Code inner-loop editor companion` split 直接相关的 active truth：
   - `runtime-governance-clients/module-overview.md` 里关于 VS Code 仅能作为 `inner-loop editor companion`、不得成为 full workbench 的边界
   - `contracts/governance-surface-client-contract.md` 里 companion-era `surface_id / surface_role / webview_usage_mode` 约束
   - `adrs/desktop-command-center-and-vscode-editor-companion-split.md` 这份 split ADR 本身
2. 本方案不 supersede 下列仍然有效的 active truth：
   - `contracts/governance-host-distribution-contract.md`
   - `adrs/host-native-distribution-and-target-specific-consumption.md`
   - installer / adoption / self-host / host-native distribution 的其余 active ADR 与 contract
3. 因此，promotion 时若 lifecycle registry 仍只能表达“整条 solution supersedes”，不得草率把 `technical-solution.governance-surface-clients` 整条标成 `superseded`；必须先把旧 solution 中仍继续有效的 host-distribution / installer truth 以更细粒度 successor surface 保留下来，或明确采用 partial-supersede write-back 方案。
4. 在 review 阶段，这一 freeze 的含义是：
   - 新 draft 可以继续以 `runtime.governance-clients + runtime.orchestration` 为 target module
   - 但 lifecycle `supersedes` 字段在 promotion 设计没有表达清楚之前，不应通过“整包 supersede 旧 solution”来偷渡
5. 这样可以保证 promotion 不会把“VS Code/Desktop split cutover”错误扩大成“host-native distribution truth 一并失效”。

### 7.2 Workbench 信息架构

1. VS Code workbench 需要至少具备以下一级 surface：
   - `Home / Overview`
   - `Runs & Queue`
   - `Tasks & Reviews`
   - `Sessions & HITL`
   - `Workflow Studio`
   - `Adoption & Host Ops`
2. editor-local affordance 继续存在，但不再是唯一交互入口：
   - 当前文件 / selection 的 run / review actions
   - code actions
   - chat participant
   - quick commands
3. heavier outer-loop surface 则进入 workbench 级承载：
   - execution board
   - review/artifact workbench
   - automation queue
   - multi-workspace overview
   - workflow graph / stage progress
   - adoption / host verify / pack status

### 7.3 新的 service-owned query / command seam

1. task-facing seam，建议最小集合：
   - `queryTaskBoard`
   - `queryTaskDetail`
   - `queryTaskExecutionBacklinks`
2. workflow-facing seam，建议最小集合：
   - `queryWorkflowCatalog`
   - `queryWorkflowPreview`
   - `queryExecutionGraph`
   - `queryExecutionStageProgress`
3. governance operations seam，建议补齐：
   - `queryReviewQueue`
   - `queryHitlInbox`
   - `queryAutomationQueue`
   - `queryWorkbenchOverview`
4. adoption / host operations seam，建议最小集合：
   - `startAdoptBootstrap`
   - `queryAdoptionStatus`
   - `queryHostDistributionStatus`
   - `startAdoptionApply`
   - `startHostExport`
   - `startHostVerify`
   - `startHostPack`
5. 这些 seam 必须都由 orchestration/service 层持有；VS Code 只能消费 DTO 与 commands，不得自己去解析 canonical files 或 installer payload。
6. ownership freeze 必须显式分层：
   - `execution / sessions / HITL / queue`：canonical truth 继续由 `local orchestration service + runtime.orchestration` 持有，新增 surface 只是在现有 service seam 上增补 query/command。
   - `tasks / reviews`：canonical truth 继续位于 `current-context + task-ledger sqlite + review artifacts`；service 允许暴露 `queryTaskBoard / queryTaskDetail / queryTaskExecutionBacklinks / queryReviewQueue` 之类的 read model，但这只是 governance canonical surfaces 的 service-owned projection，不是把 task/review 真值迁入 extension host 或 runtime shadow state。
   - `workflow preview / stage progress`：canonical truth 继续位于 graph-first runtime 与 execution ledger，由 `runtime.orchestration` 提供 service-owned projection。
   - `adoption / host operations`：canonical truth 继续位于 install receipt、verification artifact、host distribution receipt 与 staged asset metadata；在 service-native command 完成前，VS Code 只能通过 typed CLI bridge 消费这些能力，并把结果回链到 service-owned audit / task / session / receipt surfaces。
7. 这意味着本方案批准的是“service-owned aggregation facade”，而不是把 `task-ledger sqlite`、review lifecycle 文档或 install receipt 真值移动到 `runtime.orchestration` 新表或 VS Code 插件本地状态里。
8. 若 promotion 发现上述 owner split 不能通过现有 orchestration/service facade 明确表达，则必须同步补一份 `runtime.orchestration` 的 formal contract/ADR；不能只改 `runtime.governance-clients` overview/ADR 然后把 task/workflow/adoption owner 留成实现期猜测。
9. 因而 `runtime.orchestration` 在本方案里不是可选 target；它之所以留在 `target_module_ids`，就是因为本方案明确要求由 service-owned aggregation facade 承接 task/workflow/review/automation/adoption seam，而不是只让 `runtime.governance-clients` 单边改口。

### 7.3.1 governance-surface-client Contract Delta Freeze

1. 现有 `contract.runtime.governance-surface-client.v1` 的 allowed values 与 constraints 仍固定在 `desktop_command_center + vscode_editor_companion`、`outer_loop_supervision + inner_loop_editor_companion`、`detail_only webview` 这组 companion-era 语义上；如果本方案被接受，promotion 必须显式定义 v2 级别的字段变化，而不能只在 overview 或 ADR 里写“VS Code 改成 primary workbench”。
2. 建议的最小 contract delta：
   - `surface_id`：新增 `vscode_governance_workbench`（或等价稳定标识）；现有 `vscode_editor_companion` 仅作为 rollout 兼容 alias 保留。
   - `surface_role`：新增 `primary_governance_workbench`；desktop 的旧 `outer_loop_supervision` 语义只在 transition window 内兼容保留，直到单独的 desktop decision surface 做出最终 cutover。
   - `webview_usage_mode`：从 `detail_only` 放宽到 `workbench_panel_allowed`（或等价语义），但仍要求 tree views / commands / chat participant 优先，禁止 extension host 演化为 shadow runtime 或无限制 webview shell。
   - `query_capabilities / command_capabilities`：必须新增稳定枚举或等价结构，覆盖 `task_board`、`review_queue`、`workflow_preview`、`workflow_stage_progress`、`automation_queue`、`adoption_status`、`host_distribution_status` 与高风险 mutation 的 trust-gated action class。
3. compatibility freeze：
   - `v1` consumer 可以在过渡期继续存在。
   - 但一旦 formal docs 宣布 VS Code 为 `primary workbench` 方向，field-level delta 必须已经在方案层写清，否则 promotion 不得继续。
4. 本方案不要求 desktop 在同一窗口立即改名或移除；但它要求 contract 清楚表达“VS Code 已不再受限于 `inner_loop_editor_companion + detail_only webview` 组合”。

### 7.4 VS Code surface 扩展

1. 推荐新增的核心视图或 workbench panel：
   - `Overview`
   - `Tasks`
   - `Queue`
   - `Sessions`
   - `HITL`
   - `Reviews`
   - `Workflow Studio`
   - `Adoption`
2. 推荐新增 chat commands：
   - `/status`
   - `/tasks`
   - `/queue`
   - `/session`
   - `/run`
   - `/review`
   - `/workflow`
   - `/adopt`
   - `/host`
3. 推荐新增 commands：
   - `startGovernedRun`
   - `startGovernedReview`
   - `startReviewVerify`
   - `resumeSession`
   - `openTaskBoard`
   - `openReviewWorkbench`
   - `openWorkflowStudio`
   - `openAdoptionWorkbench`

### 7.4.1 UI Surface Selection Rules

1. 下列能力默认必须优先留在 `TreeView / Commands / Chat / Code Actions`，不应直接升级成 workbench webview：
   - 单对象 quick action：`run / review / review-verify / resume / recover / terminate`
   - 当前文件 / selection / editor-local handoff
   - trust-gated confirm action 与简短 status / diagnostics summary
   - slash / chat participant 中可用的一步式入口
2. 下列能力才允许进入 `Workbench Webview / Detail Panel`：
   - 多对象 board：`task board`、`review queue`、`automation queue`、`multi-workspace overview`
   - 需要跨 entity backlink 与筛选的 artifact/review workbench
   - graph visualization、stage progress、workflow preview / authoring
   - adoption / host operations 这类需要多步状态、receipt、evidence 与 follow-up guidance 的 surface
3. 即使进入 workbench webview，交互仍必须满足：
   - canonical truth 继续来自 service-owned DTO / command seam
   - handoff target 继续由 service 生成
   - trust / policy gate 继续在 service side 生效
4. 这条规则的目的不是限制 UI 形态创新，而是防止 `full workbench` 重新滑回“大 webview 套壳 app + shadow state”。

### 7.5 CLI bridge 与 service-native cutover

1. full workbench 不代表第一天所有能力都已 service-native。
2. 因此过渡期策略应是：
   - 已 service-native 的能力直接走 sidecar seam。
   - 尚未 service-native、但必须进入 full workbench 的能力先走 typed CLI bridge。
   - 每个 bridge 都必须有明确 exit criteria，最终收敛到 service-native command/query。
3. bridge 的重点不是“在 VS Code 里偷偷跑 CLI”，而是“让用户仍在 workbench 内完成操作，并看到可追踪的 service-owned 结果”。

### 7.5.1 Typed CLI Bridge Exit Criteria

1. `adopt bootstrap / adopt apply` bridge 只能作为过渡入口存在；当 service 已能稳定暴露 install receipt、verification summary、selector resolution、next-action diagnostics 与 self-host readiness signal 时，必须收敛到 service-native command/query，而不是继续依赖 CLI stdout/stderr 解析。
2. `host export / host verify / host pack` bridge 必须在 service 能稳定产出 staged asset receipt、target-aware verify result、bundle packaging artifact 与 distribution follow-up backlinks 后退出；届时 VS Code 只能消费 service-owned receipt/summary DTO，不再直接等待 CLI 文本总结。
3. `verify / upgrade` bridge 必须在 service 能提供 structured diagnostics、phase progress、HITL/escalation event 与 rollback handoff artifact 后退出；否则 workbench 仍会停留在“命令壳 + 文本转述”而不是真实治理工作台。
4. 每条 bridge 在 promotion 时都必须写明：
   - 当前为何仍需 bridge
   - 退出所需的 service-native seam
   - 退出后回收哪些临时 affordance / presenter copy / parsing logic
5. 若某条 bridge 无法定义 exit criteria，本方案不接受把它升格为长期正式 contract，因为这会把 `VS Code full workbench` 退化成长期的 “editor shell over CLI”。

### 7.6 统一标识语义

1. full workbench 必须把任务、执行、会话、review、artifact、HITL、workflow 关联成一个可追踪对象图。
2. 推荐统一暴露的标识包括：
   - `task_id`
   - `execution_id`
   - `execution_session_id`
   - `review_id`
   - `artifact_id`
   - `queue_item_id`
   - `workflow_id`
   - `handoff_targets`
3. 这组标识语义应继续由 `governance-surface-client-contract` formalize，避免 VS Code workbench 与 CLI / desktop 各自漂移。

### 7.7 Support truth 与迁移叙事

1. promotion 时允许先更新 `runtime.governance-clients` / `runtime.orchestration` 的 formal direction，但不允许同步把 public support docs 直接改写成“VS Code 已完成 primary workbench”。
2. `apps/vscode-extension/README.md`、`docs/support-matrix*.md`、`docs/local-adoption-playbook*.md` 与 `integrations/desktop/README.md` 的更新必须滞后于真实 delivery evidence，并按 phase 逐步推进：
   - `Phase A`：可以升级为“companion-upgraded / workbench baseline in progress”，但不能删除 CLI primary 与 desktop foundation-only 语义。
   - `Phase B`：可以补充 automation / adoption / host workbench 入口的 in-progress 叙事，但 public support 仍不得宣称 full workbench cutover 完成。
   - `Phase C`：只有在 workflow studio、adoption/host operations cutover 与 support-truth evidence 一起闭环后，才允许把 `VS Code primary workbench` 写入 public support claim。
3. migration 期间对 desktop 的叙事必须固定为：
   - 当前窗口：`foundation-only secondary surface`
   - `Phase B` 之后：`coexisting secondary surface / optional shell candidate`
   - 进一步 `de-scope`：必须由独立 technical solution 或明确的 desktop decision surface 承接
4. 这样可以避免模块方案层已经切到 VS Code-first，而 public docs 却在没有证据时错误宣称 desktop 已被废弃。

## 8. 风险与权衡

1. 风险：本方案与当前 active ADR / module overview 明显冲突。
   - 缓解：在 review 中显式把“是否 supersede 当前 split”作为首要审查问题，不把它伪装成普通功能扩展。
2. 风险：VS Code UI 可能变重，导致 extension 维护复杂度与性能压力上升。
   - 缓解：采用 hybrid surface model，把频繁操作留给 native views/commands，把复杂看板放到按需加载的 workbench webview。
3. 风险：为追求 full workbench 而让 VS Code 直接读取 `.repo-ai-governor/**` 文件。
   - 缓解：task/workflow/automation/adoption truth 一律通过 service-owned seam 暴露。
4. 风险：CLI bridge 停留过久，workbench 实际上变成“VS Code 套壳 CLI”。
   - 缓解：为每个 bridge 标注退出条件与 service-native formalization 路线。
5. 权衡：把 VS Code 设为 primary workbench，会削弱现有 desktop 的主线地位。
   - 这是有意 trade-off，因为当前用户主操作环境就是 VS Code，而 split 已经成为 adoption friction。

## 9. 分阶段落地建议

1. Phase A：Primary Workbench Baseline
   - 新增 `Overview / Tasks / Queue / Sessions / HITL / Reviews` 基础 surface。
   - 复用现有 `queryQueueOverview / listSessions / getExecution` 等 seam。
   - 新增 `queryTaskBoard / queryTaskDetail / queryReviewQueue / queryWorkbenchOverview`。
   - 将 `run / review / review-verify / resume / recover / terminate` 变成可从 VS Code 完成的主工作流。
   - 引入首批 workbench webview，用于 task board 与 review workbench。
   - 对应产品优先级：`P1`，但 public support truth 仍只允许写成 `companion-upgraded / workbench baseline in progress`。
2. Phase B：Outer-Loop Consolidation And Operations
   - 把 automation queue、artifact workbench、multi-workspace overview、policy/standards lens 收敛进 VS Code。
   - 接入 `queryHitlInbox / queryAutomationQueue` 与更完整的 session continuity seam。
   - 对 `adopt / host / verify / pack` 先提供 VS Code workbench 内的 CLI bridge 入口与结果回链。
   - desktop 继续保留为 `foundation-only / coexisting secondary surface`；只有在 Phase B evidence 明确表明 primary flow 已稳定转入 VS Code 后，才允许进入 desktop optional-shell 或 de-scope 决策面。
   - 对应产品优先级：仍属于 `P1` 收口，不自动扩大成组织级平台 surface。
3. Phase C：Workflow Studio And Full Workbench Cutover
   - 新增 `Workflow Studio`，支持 workflow preview / edit / graph visualization / stage progress。
   - 将 adoption / host / upgrade 等高频 operations 逐步收敛为 service-native seam。
   - 为 desktop 做最终决策：保留为 optional shell，或将 primary workbench 身份彻底转移到 VS Code；该决策必须与 desktop support truth、desktop README 与 follow-up runtime scope 一起收口。
   - 仅当上述决策与对应 evidence 一起落地后，才更新 support matrix 与 adoption narrative，使 full workbench 成为正式对外口径。
   - 对应产品优先级：`P1 -> P2` 过渡边界；若 workflow studio 演化出更广的平台化需求，应在独立 solution 中重新界定，而不是在本方案内无限加码。

## 10. Review / Promotion Handoff

1. 建议 `solution_id`：`technical-solution.vscode-full-governance-workbench-and-task-driven-orchestration`
2. 建议 `target_module_ids`：`runtime.governance-clients` / `runtime.orchestration`
3. 进入 `technical-solution-review` 前需要重点复核的边界：
   - 是否正式接受 supersede 当前 `Desktop outer-loop / VS Code inner-loop` split
   - desktop 在 full workbench 方向下应保留为 optional shell，还是进一步 de-scope
   - task / workflow / automation / adoption surface 是否都能保持 service-owned truth
   - workbench webview 的引入是否与 VS Code 生态和维护成本匹配
   - typed CLI bridge 的退出条件是否足够明确
4. 若后续进入 `technical-solution-promotion`，预期 formal docs 落点：
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/module-overview.md`
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/governance-surface-client-contract.md`
   - supersede/replace `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/desktop-command-center-and-vscode-editor-companion-split.md`
   - 新增 `runtime-governance-clients` ADR：`vscode-primary-full-governance-workbench.md`
   - 若 promotion 需要承载新的 task/workflow/review/automation/adoption aggregation seam，则必须同步补充 `runtime-orchestration` overview / contract 或等价 formal contract，而不是留到实现期猜 owner
   - promotion 必须显式记录 supersede scope：本方案只替换旧 `technical-solution.governance-surface-clients` 中的 split / companion-only truth，不得顺手废弃 host distribution / installer 相关 active truth
   - `docs/support-matrix*.md`、`apps/vscode-extension/README.md`、`docs/local-adoption-playbook*.md` 与 `integrations/desktop/README.md` 默认不在本轮 promotion 直接改口，除非同一变更窗口已有对应 phase evidence
