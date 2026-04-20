# Requirement-To-CR Governed Delivery Orchestration Technical Solution (Draft)

- Status: draft
- Date: 2026-04-16
- Owner: AI-Agent
- Scope: `session.main` supervisor owned end-to-end governed delivery flow from requirement intake through technical-solution review, task decomposition, execution, and CR closure
- Target Modules:
  - `runtime.orchestration`
  - `runtime.durable-storage`
  - `runtime.cli-interactive-shell`
- Related Inputs:
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements.md`
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-orchestration/module-overview.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-orchestration/adrs/session-main-supervisor-and-role-subagent-collaboration.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-orchestration/contracts/session-main-capability-interaction-model-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/module-overview.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/governance-execution-gates/module-overview.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/governance-execution-gates/contracts/gate-execution-profile-contract.md`
  - `.repo-ai-governor/draft/session-main-prompt-first-command-mental-model-and-deterministic-workflow-split-technical-solution.md`
  - `.repo-ai-governor/draft/session-main-plan-generation-and-ledger-commit-contract.md`
  - `.repo-ai-governor/draft/session-main-review-generation-verification-and-ledger-backfill-contract.md`
  - `.codex/skills/technical-solution-drafting/SKILL.md`
  - `.codex/skills/technical-solution-review/SKILL.md`
  - `.codex/skills/workspace-task-decomposition/SKILL.md`
  - `.codex/skills/workspace-scoped-cr-loop/SKILL.md`

## 1. 背景与问题

当前产品已经具备一组分散但真实存在的能力：

1. `session.main` 已被定义为 service-owned supervisor，而不是单纯的 recap router。
2. `@planner / @architect / @reviewer / @verifier / @coder / @tester` 已经作为 expert role surface 存在。
3. `plan / review / review-verify` 已经作为产品化 AI workflow 或受治理能力入口存在。
4. 仓库内已经存在技术方案草案、技术方案评审、任务拆解、委托式 CR loop 等 repository-local workflow。

但从用户视角看，系统仍缺少一条真正的“需求到交付”主路径。当前缺口集中体现在四点：

1. 用户输入高层需求后，系统没有一个统一入口把它收敛成“需求文档 -> 技术方案 -> 任务计划 -> 执行 -> CR 闭环”的连续流程。
2. 现有角色更像专家角色，而不是总调度者；如果强行让用户自己在 `@planner`、`@architect`、`@reviewer` 之间拼接流程，普通用户很难稳定得到一致结果。
3. 现有 workflow/skill 虽然覆盖了分段能力，但缺少统一的 phase state、gate、artifact backlink 与 session continuity。
4. 若简单新增一个 `@orchestrator` 专家角色，会与现有 `session.main supervisor`、`planner role` 以及后台 workflow planner 的边界发生冲突。

因此，这个问题的核心不是“缺一个新专家角色”，而是“缺一个由统一前台入口拥有的端到端受治理交付编排能力”。

## 2. 目标

1. 让用户可以从一句高层需求出发，进入一条可回放、可审计、可 gated 的受治理交付主流程。
2. 让该流程默认覆盖：
   - 需求文档生成
   - 需求评审
   - 技术方案草案
   - 技术方案评审
   - 任务拆解与 ledger projection
   - 执行与验证
   - CR / CR verify / delegated CR loop
3. 明确“总编排 owner”属于 `session.main supervisor` 或等价的 productized fixed workflow，而不是新增一个 raw role。
4. 复用现有 active capability、skills、ledger truth、review truth 与 policy/HITL gate，而不是再造一套平行执行面。
5. 为后续 formal promotion 提供清晰的 contract 落点和 phased rollout 计划。

## 3. 非目标

1. 不在本方案中引入新的组织级云端控制平面或远端 central supervisor service。
2. 不把 `@planner`、`@architect` 或任意现有 expert role 升格为默认前台入口 owner。
3. 不要求第一阶段就自动批准高风险变更、绕过人工闸口或自动完成发布。
4. 不要求第一阶段就把所有现有命令重命名为新的公共命令面。
5. 不在本方案中直接 formalize 一个新的 `@analyst` / `@product-owner` raw role；若后续需要，应作为独立 follow-up 评估。

## 4. 现状与约束

1. 当前内建默认角色只有 `planner / architect / coder / tester / reviewer / verifier` 六个，没有独立的 `orchestrator` role。
2. `runtime.orchestration` 已经正式接受 `session.main supervisor + role subagents / handoffs` 作为前台自然语言入口目标架构。
3. `raw_role_entry` 被明确定义为 expert surface，不应用来替代标准任务主入口。
4. `plan / review / review_verify` 已被定义为产品化 AI workflow；`run` 仍处于 `pending_existence_review` 的收敛状态。
5. 仓库内现有 skill 已覆盖：
   - `problem/request -> technical-solution draft`
   - `draft -> review_pending -> approved`
   - `scope -> project/sprint/task decomposition`
   - `implementation -> delegated CR loop`
   但它们仍是分段 workflow，不是统一的 delivery orchestrator。
6. 任何正式 mutation 都必须继续写回既有 canonical truth：
   - technical-solution lifecycle registry
   - sprint `plan.md`
   - `tasks/checklist.md`
   - `tasks/tasks.csv`
   - `tasks/TK-xxx.md` / `tasks/CR-xxx.md`
   - `review/code_review_* -> verified_* -> resolved_*`
7. 高风险写操作的确认权仍应属于具体命令契约与 policy/HITL gate；shell 或 presenter 不得自行降级这些边界。

## 5. 方案选项与对比

### 5.1 方案 A：新增 `@orchestrator` raw role

1. 方案描述：
   - 把“需求到交付”的总流程交给一个新的专家角色。
   - 用户直接通过 `@orchestrator` 发起完整流程。
2. 优点：
   - 用户心智直观，看起来像“多一个总控角色”。
   - `@` 入口容易解释，前台呈现成本较低。
3. 缺点：
   - 与 `session.main supervisor` 的正式边界冲突。
   - 会把 raw role 错误提升为标准任务主入口。
   - 需要新的 role binding、projection、discoverability、risk policy 与 surface ownership，治理成本高。

### 5.2 方案 B：让 `@planner` 吸收总编排职责

1. 方案描述：
   - 不新增角色，而是把“总流程编排”直接并入 `planner`。
   - 用户通过 `@planner` 完成需求整理、方案、任务、执行建议与 CR 组织。
2. 优点：
   - 不需要新增角色 registry 项。
   - 对已有 `planner` 能力复用较多。
3. 缺点：
   - 混淆 `planner role`、`session.main main agent` 与后台 workflow planner 三个概念。
   - 让 `planner` 成为 catch-all role，破坏角色边界的长期清晰度。
   - 仍然不能自然承载固定 gate、pending confirmation 与 multi-phase state。

### 5.3 方案 C：以 `session.main supervisor` 或等价 fixed workflow 承载 delivery orchestration

1. 方案描述：
   - 不新增 raw role。
   - 新增一个 productized delivery orchestration capability，由 `session.main supervisor` 拥有前台决策与阶段推进。
   - 现有 expert roles 只作为阶段子代理参与，不拥有流程总控身份。
2. 优点：
   - 与现有 runtime.orchestration 正式方向一致。
   - 能统一承载自然语言入口、phase state、artifact backlink、pending confirm 与 policy gate。
   - 便于复用现有 `technical-solution-*`、`workspace-task-decomposition`、`review / review-verify`、`workspace-scoped-cr-loop` 等能力。
3. 缺点：
   - 需要把分散的现有 workflow 串成一条清晰的产品化链路。
   - 需要明确 requirement artifact、phase state 与 result projection 的 contract。

### 5.4 对比结论

1. 推荐方案 C。
2. 本轮的真正缺口是“总编排能力”，不是“又一个 expert raw role”。
3. 若未来证据表明需求文档阶段长期需要独立专家人格，可在后续单独评估 `@analyst` 一类 role，但它仍应作为 subagent，而不是流程 owner。

## 6. 推荐方案

1. 引入一个 productized `requirement-to-cr governed delivery orchestration` capability。
2. 这个 capability 的 canonical owner 是 `session.main supervisor` 或等价的 service-owned fixed workflow，而不是 `@planner` 或新的 `@orchestrator`。
3. 它应把用户输入的高层需求收敛为一个受治理的 phase machine：
   - `requirement_capture`
   - `requirement_review`
   - `solution_drafting`
   - `solution_review`
   - `task_decomposition_preview`
   - `task_plan_commit`
   - `execution`
   - `review`
   - `review_verify`
   - `closeout`
4. 其中：
   - 需求文档阶段默认生成 lightweight `delivery brief` artifact
   - 技术方案阶段复用 `technical-solution-drafting` / `technical-solution-review`
   - 任务阶段第一阶段可复用 `workspace-task-decomposition`，formal landing 收口到 `plan` preview/commit contract
   - 执行与 CR 阶段复用 task-driven execution、`review / review-verify`，并把 delegated CR loop 作为后续 formal direction 收口
5. Phase owner 固定如下：
   - `session.main supervisor`：路由、阶段推进、用户问答、gate 与 continuity
   - expert roles：提供阶段性专业产出
   - existing workflows/skills：承载具体结构化写入与治理动作
6. 这条能力应被视为对现有 active solutions 的 follow-up productization，而不是推翻现有 `session.main` / `plan` / `review` / CR loop 方向。

## 7. 核心设计与契约影响

### 7.1 公开能力模型

1. 应新增一个面向普通用户的固定 workflow capability，建议 capability id 固定为 `deliver`。
2. 它的 formal interaction-model 归属应明确为：
   - `interaction_model=ai_fixed_workflow`
   - `primary_entry=conversational_answer`
   - `backing_execution=templated_ai_workflow`
3. 会话自然语言桥接应是这条能力的 primary public entry；可选 `/deliver` 只应作为 discoverability alias 或显式加速入口，而不是另一条平行 truth surface。
4. `deliver` 不替代现有 `plan / review / review_verify / run`：
   - `deliver` 是 parent orchestration capability
   - `plan / review / review_verify` 继续是已有 child workflow capability
   - `run` 继续保持已 formalized 的 narrowed execution sub-stage 语义，而不是被重新包装成新的 catch-all 总入口
5. 这条能力不应被定义为 `raw_role_entry`，也不应把 shell-local builtins 升级为 orchestration-owned capability。

### 7.2 Phase state machine

建议最小状态机如下：

1. `requirement_capture`
   - 从用户输入生成 `delivery brief` preview。
2. `requirement_review_pending`
   - 对需求文档进行 review 或 explicit approval。
3. `solution_drafting`
   - 基于 approved requirement brief 生成 technical-solution draft。
4. `solution_review_pending`
   - 进入 `technical-solution-review` 流程。
5. `task_decomposition_preview`
   - 生成 project/sprint/task preview 与 required inputs。
6. `task_plan_commit_pending`
   - 在 preview 基础上等待显式确认落账。
7. `execution_active`
   - 进入 task-driven implementation / verification。
8. `review_pending`
   - 产出 canonical review artifact。
9. `review_verify_pending`
   - 进行复核、结果回写与必要的 fresh reviewer recheck。
10. `resolved` / `blocked`
   - 完成或因 policy/approval 缺口而阻断。

authoritative truth mapping 必须固定如下：

1. `requirement_capture`
   - 只允许停留在 shared-session preview，不形成 durable truth。
2. `requirement_review_pending`
   - 只允许引用 approved durable `delivery brief` artifact 或显式 approval receipt；
   - 不新建 requirement lifecycle registry。
3. `solution_review_pending`
   - 底层 authoritative truth 属于 `technical-solution-review` artifact 与 `technical-solution-lifecycle-registry.yaml`；
   - orchestration 只保留 phase backlink，不得平行维护第二份 approved truth。
4. `task_decomposition_preview / task_plan_commit_pending`
   - 底层 authoritative truth 属于 `plan` preview/commit contract 与既有 sprint ledger；
   - orchestration 只保留 pending confirmation / selected target stream。
5. `review_pending / review_verify_pending`
   - 底层 authoritative truth 属于 canonical `code_review_* / verified_* / resolved_*` 与配对 `CR-xxx`；
   - orchestration 不得自行声明“已复核/已解决”来替代底层 artifact。
6. `resolved / blocked`
   - 只是 delivery workflow 的 overlay summary；
   - 不得替代 sprint/task/review lifecycle 的终态字段。

### 7.3 Requirement artifact 设计

1. 第一阶段不建议新建一套重量级 requirement registry。
2. 更合适的最小做法是把 `delivery brief` 分成两层：
   - session preview：`requirement_capture` 阶段仅存在于 shared-session truth，用于 refinement，不直接进入 durable surface
   - approved durable brief：只有在用户显式确认或 docs-only review 通过后，才导出为人类可读 Markdown artifact
3. approved durable brief 的最小治理边界应固定为：
   - canonical producer：`runtime.orchestration`
   - durable backlink / artifact metadata consumer：`runtime.durable-storage`
   - human-readable landing：当前 active stream 的 governed artifact/handoff surface；若当前尚无 active stream，则先保持 preview-only，等 bootstrap/activation 完成后再导出 durable brief
4. requirement review 本身不应引入新的 registry；第一阶段只允许两条路径：
   - explicit approval
   - 对 approved durable brief 执行 docs-only `review`，并沿用既有 review artifact lifecycle
5. technical-solution draft 只能消费 approved durable brief path，而不是消费尚未落盘的 session preview。
6. `delivery brief` 不是 triad docs，也不是 technical-solution draft，本轮不应进入 normative manifest。
7. 它的职责是把“模糊需求”变成后续方案与任务阶段可消费的结构化输入，而不是成为新的跨项目 requirement truth registry。

### 7.4 Direct Module Boundary

1. Phase A-C 的 direct formal landing 应限制在三处：
   - `runtime.orchestration`：producer，拥有 `deliver` capability、phase machine 与 child-workflow orchestration truth
   - `runtime.durable-storage`：consumer，拥有 delivery workflow summary / artifact backlink / pending confirmation projection
   - `runtime.cli-interactive-shell`：consumer，拥有 discoverability、pending-state 与 transcript recap projection
2. `runtime.agent-projection` 在本方案中默认只作为 imported dependency：
   - 现有 role-subagent projection、onboarding truth 与 adapter-neutral reviewer handoff 继续复用
   - 除非后续证明 `deliver` 需要新的 projection fields，否则不把它作为当前 solution 的 direct target module
3. `governance.execution-gates` 在本方案中也默认只作为 imported dependency：
   - 现有 `full/fast/affected` gate profile 与既有 policy/HITL gate 继续保持 authoritative
   - 本方案不在 Phase A-C 内发明新的 gate profile contract；若后续需要 delivery-specific gate bundle，应作为独立 follow-up formalize

### 7.5 角色边界

1. `session.main main agent`
   - 拥有前台对话、阶段推进、确认态、handoff 与结果综合。
2. `planner`
   - 负责规划、拆解与执行策略建议。
   - 不是 delivery owner。
3. `architect`
   - 负责方案与边界判断。
4. `reviewer` / `verifier`
   - 负责风险评审、复核与 CR 闭环。
5. `coder` / `tester`
   - 负责实现与验证阶段的执行子任务。
6. 可选 follow-up：
   - 若 requirement capture 持续表现出“需要独立需求整理人格”的证据，再单独评估 `@analyst`。
   - 即便新增，该角色也只能作为 subagent，不拥有 supervisor 身份。

### 7.6 现有 workflow / skill 的复用路径

1. `requirement_capture`
   - 由 supervisor 组织 prompt-first intake、session preview refinement 与 approved durable brief export。
2. `solution_drafting`
   - 调用 `technical-solution-drafting`。
3. `solution_review`
   - 调用 `technical-solution-review`。
4. `task_decomposition`
   - formal landing 应指向 `session-main-plan-generation-and-ledger-commit-contract`；
   - `workspace-task-decomposition` 只作为 bootstrap 期或 repo-local fallback surface，而不是长期产品 truth。
5. `execution`
   - 使用已经收窄语义的 task-driven `run` / governed execution flow。
6. `review` 与 `review_verify`
   - formal landing 应继续使用 `session-main-review-generation-verification-and-ledger-backfill-contract` 与既有 review lifecycle。
7. `delegated CR loop`
   - 在需要严格 clean round 时接入 productized delegated CR loop direction；
   - `workspace-scoped-cr-loop` 只作为当前仓库验证该方向的 bootstrap surface。

原则：

1. supervisor 负责编排，不重写这些 workflow 的 canonical truth。
2. 各 workflow 保持自己已有的 artifact / ledger ownership。

### 7.7 Gate 与确认策略

1. `delivery brief` 进入方案阶段前，应存在 approved durable brief，并通过 docs-only review 或 explicit approval 收口。
2. technical-solution draft 进入任务拆解前，必须经过 `technical-solution-review`。
3. task decomposition 进入正式 ledger commit 前，必须走 preview + explicit confirm。
4. 高风险 execution step 仍应受现有 policy/HITL gate 约束。
5. CR closure 仍应遵守 `review -> review_verify -> resolved` 生命周期，不应被 delivery orchestration 直接短路。

### 7.8 持久化与 session continuity

1. `runtime.orchestration` 应持有 delivery workflow 的 phase metadata 与 pending action。
2. `runtime.durable-storage` 应持有：
   - 当前 workflow id
   - 当前 phase
   - related artifact paths
   - pending confirmation / blocked reason
   - phase result summaries
3. CLI shell / future desktop 只消费这些 presenter-safe summaries，不得各自重算 phase truth。
4. 这条能力不应引入新的平行 canonical truth；它应主要作为“编排态 + backlink 索引”存在。

## 8. 风险与权衡

1. 流程过长的风险
   - 从需求到 CR 的 phase 很多，若所有阶段都强制用户逐步确认，体验可能过重。
   - 缓解：仅在真正跨越 canonical truth mutation 或高风险边界时要求显式确认。
2. requirement artifact 过轻的风险
   - 若 `delivery brief` 太弱，方案阶段仍可能输入不足。
   - 缓解：保留 follow-up 扩展点，在 evidence 充分时再评估独立 `@analyst` 或 richer requirement contract。
3. 复用现有 workflow 的体验不一致风险
   - 现有 skill、slash command、CLI command 的输入输出风格不完全统一。
   - 缓解：由 supervisor 统一前台文案、phase summary 与 pending-state contract。
4. 边界混淆风险
   - 若实现时把 planner 或 role delegate 误当成流程 owner，会重新引入概念漂移。
   - 缓解：formal docs 必须明确 `session.main supervisor != planner role != workflow planner`。

## 9. 分阶段落地建议

1. Phase A：固定能力语义与 phase machine
   - 定义 delivery orchestration capability
   - 引入 lightweight `delivery brief` artifact
   - 打通 `requirement_capture -> solution_drafting -> solution_review` 主链
2. Phase B：打通任务与 ledger
   - 将 repo-local decomposition bootstrap 收口到 `plan` preview/commit contract
   - 支持 preview + confirm 的 task plan commit
   - 为 phase state 增加 durable backlink summary
3. Phase C：打通 execution 与 CR loop
   - 接入 task-driven execution
   - 接入 formalized `review / review-verify`
   - 在需要 clean round 时接入 productized delegated CR loop
4. Phase D：收敛 explainability 与 optional analyst follow-up
   - 统一 help / capability catalog / slash discoverability
   - 根据实际 evidence 决定是否单独 formalize requirement analyst subagent

## 10. Review / Promotion Handoff

1. 建议 `solution_id`：`technical-solution.requirement-to-cr-governed-delivery-orchestration`
2. 建议 `target_module_ids`：`runtime.orchestration` / `runtime.durable-storage` / `runtime.cli-interactive-shell`
3. 进入 `technical-solution-review` 前需要重点复核的边界：
   - 是否真的需要新的 public capability，而不是仅补一个 raw role
   - `delivery brief` artifact 是否足够轻量且不与 triad / technical-solution lifecycle 冲突
   - `session.main supervisor` 与 `planner role`、workflow planner 的边界是否足够清晰
   - phase gate 是否与现有 policy/HITL command contract 一致
4. 若后续进入 `technical-solution-promotion`，预期 formal docs 落点：
   - `runtime-orchestration` 下新增或扩展 delivery orchestration contract / ADR
   - `runtime-cli-interactive-shell` 对该 capability 的 discoverability 与 pending-state consumer contract
   - `runtime-durable-storage` 对 delivery workflow phase summary / backlink projection 的 contract 增量
   - `runtime-agent-projection` 与 `governance.execution-gates` 只在后续确有 direct contract delta 时再补 consumer cross-link 或 follow-up solution
