# VS Code Direct Workbench For Orchestration, Runtime Status Bus, And HITL (Draft)

- Status: draft
- Date: 2026-04-22
- Owner: AI-Agent
- Scope: 在既有 `VS Code primary governance workbench` 方向下，定义一条实现型 follow-up 方案，让用户可以直接在 VS Code 内完成多 Agent workflow authoring / graph inspection、角色运行时与状态总线消费、以及策略化 HITL 决策与恢复动作，而不再停留在“命令桥接 + 只读快照”阶段。
- Target Modules:
  - `runtime.governance-clients`
  - `runtime.orchestration`
- Related Inputs:
  - `.repo-ai-governor/draft/vscode-full-governance-workbench-and-task-driven-orchestration-technical-solution.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/module-overview.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/vscode-governance-workbench-surface-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/governance-surface-client-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/vscode-primary-full-governance-workbench.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-orchestration/contracts/governance-workbench-aggregation-facade-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/risk-facts-and-hitl-sla-contract.md`
  - `apps/vscode-extension/README.md`
  - `apps/vscode-extension/src/runtime/vscode-extension-command-controller.ts`
  - `apps/vscode-extension/src/runtime/vscode-extension-workflow-studio-provider.ts`
  - `apps/vscode-extension/src/runtime/vscode-extension-service-runtime.ts`
  - `packages/core-orchestration-service/src/local-orchestration-service-workspace-ops-runtime.ts`

## 1. 背景与问题

1. 当前仓库已经正式接受 `VS Code primary governance workbench` 的 planning-side 方向，但插件落地形态仍偏向：
   - command palette / chat 触发
   - tree view 列表消费
   - `Workflow Studio` 只读快照
   - `HITL Inbox` 列表 + 单点动作
2. 对用户而言，这意味着三个核心能力虽然在系统层已具备主干，但还没有成为 VS Code 内可以直接操作的工作台能力：
   - 多 Agent 编排 DSL / 流程图：当前更接近 `workflow preview/create/edit` 命令桥接，而不是可视 authoring surface。
   - 角色运行时与状态总线：当前能看 execution / queue / review / automation 的一部分投影，但还没有围绕 `role lane + stage progress + execution graph` 形成统一 workbench。
   - 策略化 HITL 自动模式：当前已有 `submit / recover / terminate` 动作，但缺少把 risk facts、SLA、受影响对象、决策上下文、执行回链合并成一个 decision cockpit。
3. 现有 active 方案 `.repo-ai-governor/draft/vscode-full-governance-workbench-and-task-driven-orchestration-technical-solution.md` 解决的是“VS Code 是否应该成为 primary workbench”以及“workbench 的总体方向”，但它没有把这三类能力拆成可直接落地的实现型 contract。
4. 如果继续停留在“总方向已确定、具体交互以后再补”，插件会长期维持下面这类落差：
   - 方向上说 VS Code 是 primary workbench；
   - 实际上用户仍需切回 CLI 处理 workflow authoring、状态追踪和 HITL 决策上下文。
5. 因此，需要一份 follow-up draft，把 “VS Code 里直接处理这三类能力” 明确成可实现、可 review、可 promotion 的技术边界，而不是继续依赖口头解释。

## 2. 目标

1. 让用户可以直接在 VS Code 中完成受治理的 workflow authoring / graph inspection，而不是只触发 CLI `workflow` 命令。
2. 让用户可以在 VS Code 中看到围绕 execution 的角色运行时状态总线，包括 lane、stage、queue、artifact backlink 与 session continuity。
3. 让用户可以在 VS Code 中完成策略化 HITL 决策闭环，包括查看 risk facts、SLA、决策选项、受影响 execution/task/review，并执行 `submit / recover / terminate`。
4. 保持 `local orchestration service` 为唯一 truth owner；VS Code 只能消费 service-owned DTO / query / command seam。
5. 在不谎报 public support truth 的前提下，为后续 `Phase A / B / C` rollout 提供具体 contract、UI 分层与 exit criteria。

## 3. 非目标

1. 不在本方案内重写或 supersede 既有 `VS Code primary workbench` 总方向方案；本方案是其实现型 follow-up，而不是竞争性替代方案。
2. 不让 extension host 直接解析 `.repo-ai-governor/**` canonical files、`tasks.csv`、review 生命周期文件、workflow definition 文件或 install receipt。
3. 不在第一阶段就交付完整自由拖拽的无限制画布；如需 richer canvas，必须建立在 service-owned workflow draft session 之上。
4. 不让 typed CLI bridge 长期成为 workflow / HITL / runtime status 的默认 owner。
5. 不在本方案内直接改写 `docs/support-matrix*.md`、`apps/vscode-extension/README.md` 的 public support claim。

## 4. 现状与约束

1. 当前插件已有正式入口：
   - `Execution Board`
   - `HITL Inbox`
   - `Review Queue`
   - `Automation Queue`
   - `Workbench Overview`
   - `Workflow Studio`
   - `Review Detail`
2. 当前 workflow 相关操作虽已存在，但仍是 bridge-first：
   - `runWorkflowPreview`
   - `runWorkflowCreate`
   - `runWorkflowEdit`
   - `Workflow Studio` 目前仍以 service-backed snapshot / evidence 面为主，而非 graph authoring owner。
3. 当前 HITL 相关能力虽已存在，但仍偏 command-first：
   - `submitHitlDecision`
   - `recoverExecution`
   - `terminateExecution`
   - 但 risk facts、SLA、policy evidence 与 execution / task / review 影响面尚未凝结为统一的 HITL cockpit。
4. 当前角色运行时与状态总线已有部分 read model：
   - execution board
   - queue overview
   - review queue
   - automation queue
   - session continuity snapshot
   - artifact pane / review detail
   但仍缺 “按角色/阶段/执行图组织的 workbench 形态”。
5. 正式 contract 已经给出关键硬约束：
   - `contract.runtime.vscode-governance-workbench-surface.v1` 要求 VS Code 只能消费 service-owned seam。
   - `contract.runtime.governance-workbench-aggregation-facade.v1` 已允许 `task_board / review_queue / workflow_preview / execution_graph / execution_stage_progress / hitl_inbox / automation_queue` 这类 capability class。
   - `risk-facts-and-hitl-sla-contract.md` 已冻结 `risk facts -> allow/confirm/block/escalate` 和 SLA。
6. 因此，本方案的核心不是“再发明一套 runtime”，而是把已有方向落到更细的：
   - query / command seam
   - DTO 形态
   - UI 分层
   - bridge exit criteria
   - trust / policy gate

## 5. 方案选项与对比

### 5.1 方案 A：继续保持 command-first，只增强当前 view

1. 保留现有 `workflow-preview/create/edit`、`HITL Inbox`、`Execution Board` 的形态，只在现有 tree view 与 chat 上增补少量信息。
2. 优点：
   - 成本低。
   - 与当前实现最接近。
3. 缺点：
   - 用户仍然不能把 VS Code 作为直接处理这三类能力的主操作面。
   - `Workflow Studio` 仍停留在只读快照。
   - HITL 仍像“动作列表”，而不是“决策 cockpit”。

### 5.2 方案 B：采用 hybrid workbench，把三类能力做成 service-owned first-class surface

1. 保持 `TreeView / Commands / Chat / Code Actions` 作为 quick action 入口，但新增三类重型 workbench surface：
   - `Workflow Studio (authoring mode)`
   - `Runtime Lanes / Execution Graph`
   - `HITL Decision Cockpit`
2. service 侧新增或正式化：
   - workflow draft session / graph inspection seam
   - role lane / stage progress / execution graph seam
   - hitl decision packet / decision submit seam
3. 优点：
   - 能直接兑现“在 VS Code 中处理”这三类能力。
   - 不违背现有 truth-owner 边界。
   - 可以分阶段 rollout。
4. 缺点：
   - 需要扩展 aggregation facade 和插件 webview。
   - 需要引入更明确的 DTO 与 typed mutation contract。

### 5.3 方案 C：直接做自由拖拽 canvas，并让插件本地持有 workflow editing state

1. 以插件前端为主，先实现本地 workflow graph 编辑、lane 状态聚合和 HITL form，然后再向 service 回写。
2. 优点：
   - 交互上最直观。
   - 看起来“最像产品”。
3. 缺点：
   - 高风险地引入 extension-local shadow state。
   - 与现有 workbench contract 的 truth owner 约束冲突。
   - promotion 审核通过难度高。

### 5.4 对比结论

1. 推荐 `方案 B`。
2. `方案 A` 解决不了“直接在 VS Code 处理”的核心诉求。
3. `方案 C` 虽然交互激进，但会过早把状态 ownership 推向插件本地，破坏现有架构。
4. `方案 B` 最适合作为 `primary workbench` 方向下的实现型第一性方案：交互足够强，边界仍然安全。

## 6. 推荐方案

1. 在现有 VS Code 插件中，把三类能力提升为 first-class workbench surface：
   - `Workflow Studio Authoring`
   - `Runtime Lanes`
   - `HITL Decision Cockpit`
2. 所有 surface 都必须建立在 `local orchestration service` 的 query / command seam 之上，而不是 extension-local state。
3. 将现有命令桥接关系改为：
   - command 负责“打开或触发”
   - workbench panel 负责“观察、编辑、决策”
   - service 负责“validate、persist、execute、resume、gate”
4. `Workflow Studio` 采用“schema-first authoring + graph projection”模型：
   - 第一阶段先支持结构化编辑与 graph inspection，不直接承诺无限制自由拖拽。
   - graph 只是 projection / editor，不是 canonical source。
5. `Runtime Lanes` 把 execution / role / queue / session / artifact / review 组织成统一状态总线视图。
6. `HITL Decision Cockpit` 把 `risk facts + policy action + SLA + impact scope + available decisions` 聚合成一个 service-owned decision packet。

## 7. 核心设计与契约影响

### 7.1 VS Code Workbench 信息架构调整

1. 保留当前轻量入口：
   - command palette
   - chat participant
   - code actions
   - tree view refresh / selection
2. 新增或升级重型 workbench panel：
   - `Workflow Studio`：从 evidence-only 升级为 authoring + graph inspection
   - `Runtime Lanes`：execution graph、role lane、stage progress、queue impact、artifact/review backlink
   - `HITL Decision Cockpit`：risk facts、policy action、decision packet、recover / terminate / submit
3. UI 选择规则：
   - quick action 保留在 native command / chat / tree view
   - 多对象、跨 entity、需要上下文汇总的 surface 才允许进入 webview panel

### 7.2 Workflow Authoring Contract

1. 新增 workflow capability seam：
   - `queryWorkflowCatalog`
   - `queryWorkflowDraftSession`
   - `queryExecutionGraph`
   - `queryExecutionStageProgress`
2. 新增 workflow mutation seam：
   - `startWorkflowDraft`
   - `updateWorkflowDraftNode`
   - `updateWorkflowDraftEdge`
   - `updateWorkflowDraftPolicy`
   - `validateWorkflowDraft`
   - `commitWorkflowDraft`
3. draft session 必须至少包含：
   - `workflow_draft_id`
   - `draft_revision`
   - `base_definition_revision`
   - `template_id`
   - `entry_mode`
   - `node_specs[]`
   - `edge_specs[]`
   - `supported_patch_ops[]`
   - `validation_issues[]`
   - `conflict_state`
   - `compiled_ir_preview`
   - `backlink_artifacts[]`
4. canonical truth 仍位于 workflow definition 与 compiled IR，由 service 负责生成与落盘。
5. 每次 `updateWorkflowDraft*` mutation 都必须显式携带当前 `draft_revision` 或等价 base token；service 返回新的 revision、validation delta 与 conflict signal，防止 webview / tree / chat 多入口并发时长出 extension-local shadow state。
6. 插件只发送 patch，不直接写 definition 文件。

### 7.3 Runtime Status Bus Contract

1. 在现有 aggregation facade 上，把 runtime status bus 细化成稳定 capability：
   - `queryExecutionGraph`
   - `queryRoleLaneStatus`
   - `queryExecutionStageProgress`
   - `queryTaskExecutionBacklinks`
   - `querySessionContinuity`
2. 每条 role lane 至少包含：
   - `role_id`
   - `execution_id`
   - `session_id`
   - `current_stage_id`
   - `status`
   - `latest_event_type`
   - `updated_at`
   - `pending_hitl`
   - `artifact_backlinks[]`
   - `review_backlinks[]`
3. `Runtime Lanes` panel 不自己拼装第二套状态机；只消费 service-owned projections。
4. `selection store` 仍只能保存 transient selection，不得变成 canonical bus cache。

### 7.4 HITL Decision Contract

1. 新增 `queryHitlDecisionPacket(executionId | queueItemId)`。
2. decision packet 至少包含：
   - `execution_id`
   - `task_id`
   - `review_id`
   - `risk_facts[]`
   - `policy_action`
   - `sla_deadline_at`
   - `default_timeout_action`
   - `allowed_decisions[]`
   - `impact_summary`
   - `backlinks[]`
3. mutation seam 继续复用并细化：
   - `submitHitlDecision`
   - `recoverExecution`
   - `terminateExecution`
4. 所有 HITL 决策都必须回链：
   - risk evidence
   - execution
   - task/review artifact
   - audit event
5. `risk_facts[]` 必须完整复用现有 `risk-facts-and-hitl-sla-contract.md` v1 字段语义，而不是降格为 UI summary；至少要保留 `risk_id / risk_category / risk_level / evidence / change_scope / confidence / trigger_rule` 的可回放能力。
6. `confirm` / `escalate` / `block` SLA 继续完全遵守现有 risk/HITL contract，不在插件层另起一套规则。

### 7.5 Typed CLI Bridge Exit Criteria

1. workflow bridge 退出条件：
   - `queryWorkflowDraftSession + validateWorkflowDraft + commitWorkflowDraft` 三件套 service-native 可用
   - `Workflow Studio` 不再依赖 CLI result text 渲染 authoring 结果
2. runtime lane bridge 退出条件：
   - role lane、execution graph、stage progress 已由 service 直接提供，不再通过 CLI summary 转述
3. HITL bridge 退出条件：
   - decision packet、risk facts、SLA、allowed decisions 全部由 service 返回
   - 插件不再需要先跑兼容命令再解释结果
4. 在 exit criteria 未满足前，bridge 只能作为临时过渡，而不能被写成长期 owner。

### 7.6 Promotion 影响

1. 本方案不 supersede 既有 `technical-solution.vscode-full-governance-workbench-and-task-driven-orchestration`，而是作为其实现型 follow-up。
2. promotion 预期会触达：
   - `runtime.governance-clients`
   - `runtime.orchestration`
3. 可能需要新增或更新：
   - `runtime-governance-clients` ADR：VS Code direct workbench authoring/runtime/HITL surface
   - `runtime-orchestration` contract：workflow draft session / runtime status bus / hitl decision packet
4. promotion 必须把新增 seam materialize 到现有 formal contract，而不是只停留在代码级 query 名称：
   - `contract.runtime.vscode-governance-workbench-surface.v1` 需要补充可稳定映射 `workflow_draft_session / runtime_lane_status / hitl_decision_packet` 的 capability class 或等价 contract field。
   - `contract.runtime.governance-workbench-aggregation-facade.v1` 需要补充 `workflow_draft_session / role_lane_status / session_continuity / hitl_decision_packet / workflow_mutation` 的 seam 分类或等价 owner-map write-back。
5. public support truth 仍需 evidence-gated；本方案 promotion 本身不等于 support claim 可以立即升级，也不应回退现有“built-source checkout 上 VS Code 已是 primary workbench”这条已激活 truth，只能为更强的 direct authoring / runtime-lanes / decision-cockpit claim 增补证据。

## 8. 风险与权衡

1. 风险：webview panel 复杂度上升。
   - 缓解：先做 schema-first authoring 和 service-owned projections，再逐步增强交互。
2. 风险：workflow 编辑容易滑向 extension-local shadow state。
   - 缓解：只允许 patch + validate + commit，禁止插件直接持久化 workflow canonical files。
3. 风险：runtime status bus 会诱导 UI 自己拼状态。
   - 缓解：必须把 role lane / graph / stage progress 作为 service-owned DTO 暴露。
4. 风险：HITL 决策只做按钮化，缺少上下文。
   - 缓解：强制引入 `decision packet`，把 risk facts、SLA、impact、allowed decisions 聚合。
5. 权衡：先做 graph inspection + structured authoring，而不是第一天就做自由拖拽画布。
   - 这是有意取舍，用来换取 contract 清晰和 promotion 可过审。

## 9. 分阶段落地建议

1. Phase A：Direct HITL + Runtime Lanes Baseline
   - 新增 `queryHitlDecisionPacket`
   - 新增 `queryRoleLaneStatus`
   - 新增 `Runtime Lanes` panel
   - 将 `HITL Inbox` 升级为 `HITL Decision Cockpit`
2. Phase B：Workflow Authoring Baseline
   - 新增 `queryWorkflowDraftSession`
   - 新增 `validateWorkflowDraft / commitWorkflowDraft`
   - 将 `Workflow Studio` 升级为 schema-first authoring + graph inspection
3. Phase C：Richer Graph Editing And Support-Truth Readiness
   - 在 service-owned draft session 基础上增加更强的 node/edge 编辑交互
   - 逐步移除 workflow / runtime / HITL 的 typed CLI bridge
   - 只有在 phase evidence 完整后，才讨论 support docs 的进一步改口

## 10. Review / Promotion Handoff

1. 建议 `solution_id`：`technical-solution.vscode-direct-workbench-orchestration-runtime-hitl`
2. 建议 `target_module_ids`：`runtime.governance-clients` / `runtime.orchestration`
3. 进入 `technical-solution-review` 前需要重点复核的边界：
   - workflow draft session 是否足够避免 extension-local shadow state
   - runtime status bus DTO 是否能稳定表达 role lane / stage progress / backlinks
   - hitl decision packet 是否完整承载 risk facts / SLA / decision action
   - typed CLI bridge 的 exit criteria 是否足够明确
4. 若后续进入 `technical-solution-promotion`，预期 formal docs 落点：
   - `runtime-governance-clients` 新 ADR 或 contract 补充 direct-workbench surface
   - `runtime-orchestration` 新 contract 或 ADR 补充 workflow draft session / runtime status bus / hitl decision packet
   - 可能需要同步更新 `runtime-governance-clients/module-overview.md` 与 `runtime-orchestration/module-overview.md`
