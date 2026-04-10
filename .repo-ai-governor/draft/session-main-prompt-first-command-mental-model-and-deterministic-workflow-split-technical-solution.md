# Repo AI Governor `session.main` Prompt-First 命令心智与确定性工作流分层技术方案（Draft）

- Status: draft
- Date: 2026-04-09
- Owner: AI-Agent
- Scope: `session.main` raw role entry / AI fixed workflow command model / deterministic workflow command split / governed capability discoverability
- Target Module IDs:
  - `runtime.orchestration`
  - `runtime.cli-interactive-shell`
  - `runtime.agent-projection`
  - `runtime.durable-storage`
- Related Inputs:
  - `.repo-ai-governor/draft/session-main-plan-generation-and-ledger-commit-contract.md`
  - `.repo-ai-governor/draft/session-main-capability-explainer-and-contextual-command-guidance-technical-solution.md`
  - `.repo-ai-governor/draft/session-main-conversational-chat-and-skill-intent-handoff-technical-solution.md`
  - `packages/core-orchestration-service/src/local-orchestration-service-session-main-capability-catalog.ts`
  - `packages/core-orchestration-service/src/local-orchestration-service-session-main-skill-registry.ts`
  - `apps/cli/src/runtime/session-main-supervisor-runtime.ts`
  - `apps/cli/src/runtime/session-main-subagent-registry.ts`
  - `apps/cli/src/runtime/interactive-shell/session-slash-command-registry.ts`
  - `apps/cli/src/commands/plan-command.ts`
  - `apps/cli/src/commands/review-command.ts`
  - `apps/cli/src/commands/review-verify-command.ts`
  - `apps/cli/src/commands/workflow-command.ts`
  - `apps/cli/src/commands/run-command.ts`

## 1. 目的

当前 `session.main` 的能力表面上已经具备 `plan / review / review verify / run / workflow / connect / verify`
等语义型入口，但用户在交互时仍会频繁产生一个自然预期：

1. 名字像“生成/规划/审查”的命令，应该优先进入对应的产品化 AI 工作流，而不是要求用户先理解 role 细节。
2. 名字像“同步/校验/迁移/切换”的命令，才应该是确定性工作流命令。

当前产品并未把这两类心智显式分开，导致：

1. `/plan` 名字像“让 planner 生成计划”，实际却是现有 sprint ledger 的 preview/commit 工具。
2. 自然语言“帮我生成计划”会被桥接到固定命令，而不是优先走 `@planner`。
3. 原始 role mention 虽然存在，但 discoverability 太弱，而且不应成为普通用户完成标准任务的前提。

本方案的目标是把这层产品语义正式写清楚，并给出兼容现有命令面的重构路径。

## 2. 问题定义

### 2.1 当前冲突不在“能力缺失”，而在“入口语义失真”

当前实现里至少存在三层能力：

1. `session.main` 对话与 role delegation
2. 产品化的 AI 固定工作流命令
3. slash command 到 CLI command 的桥接
4. 受治理的 deterministic utility / workflow command

真正的问题不是仓库完全没有 planner / reviewer / role collaboration，而是：

1. 用户最先看到的名字是 `/plan`、`/review`、`/run`
2. 这些名字在语言上更像“智能 agent 行为”
3. 但其中很多实际实现仍是固定 scope、固定状态机、固定 artifact 的确定性命令

于是用户会把“命令名”理解成“AI 能力名”，而系统却把它实现成“工作流动作名”。

### 2.2 当前最典型的错位是 `/plan`

用户心智：

1. `/plan 开发一个俄罗斯方块游戏`
2. 系统调起 planner
3. 按模板生成可讨论、可修订的执行计划

当前行为：

1. 自然语言 planning request 会被路由成固定 `/plan`
2. `/plan` 本身不接 prompt-first planning input
3. 它读取 active stream 的 sprint facts，生成 preview/commit ledger artifact

这不是能力错误，而是“命令名借了 AI 语义，但实现承担的是 ledger materialization”。

### 2.3 类似问题不只出现在 `/plan`

按用户体感，更合理的命令分层其实应是五类：

1. AI 固定工作流命令：
   - `plan`
   - `review`
   - `review verify`
2. 确定性治理 / 工具命令：
   - `plan sync`
   - `workflow preview/create/edit`
   - `workspace switch-branch`
   - `connect`
   - `doctor`
3. 需要单独证明存在意义的命令：
   - `run`
4. 建议在本方案执行时直接删除的命令：
   - `verify`
5. 原始 role surface：
   - `@planner`
   - `@architect`
   - `@reviewer`
   - `@verifier`

其中真正发生明显误导的，主要是第一类、第三类和第四类：

1. 第一类的问题是：名字像 AI 能力，但实现还没有产品化为标准 AI 工作流。
2. 第三类的问题是：它们也许有存在价值，但当前公开语义还不足以让用户直觉理解“为什么必须单独有这个命令”。
3. 第四类的问题是：它们与现有命令重叠过高，继续保留只会制造学习成本和命名噪音。
4. 第五类的问题不是命令语义错误，而是 discoverability 过弱，导致用户先撞上语义失真的公开命令。

## 3. 设计目标

1. 让标准化的生成/分析/审查需求优先映射到产品化 AI 固定工作流，而不是裸 role 或错误的命令桥接。
2. 让原始 `@role` 继续保留为 expert surface，用于开放式协作、追问和非标准任务。
3. 让“有副作用、有固定 ledger/queue/state machine 语义”的动作继续保留 deterministic command 形态。
4. 让 capability catalog、help、slash palette、natural-language routing 对同一能力给出一致心智说明。
5. 保持现有治理边界：
   - AI fixed workflow 不等于绕过确认
   - deterministic command 不等于降级成死板 CLI
6. 为现有 public command surface 提供兼容迁移，而不是一次性破坏。

## 4. 非目标

1. 不把所有命令都改成 `command <prompt>` 形式。
2. 不让 `run` 直接退化成“随便一句话就执行”的不受控入口。
3. 不取消 preview/confirm/handoff/audit truth。
4. 不要求第一阶段就重命名所有顶层 CLI 子命令。
5. 不把 `session.main` role collaboration 和 deterministic workflow engine 混成一个黑箱 planner。

## 5. 新的命令心智分层

### 5.1 原始 Role 入口

适用于“用户明确知道自己要找哪个角色，并希望做开放式协作”的场景。

主入口：

1. `@planner`
2. `@architect`
3. `@reviewer`
4. `@verifier`

典型使用方式：

1. `@planner 按仓库模板生成一个俄罗斯方块开发执行计划`
2. `@reviewer 先从风险角度复核一下当前改动`
3. `@architect @reviewer 串行给我一个设计和复核意见`

这层入口是 expert surface，不应强迫所有普通用户先理解 role 才能完成标准任务。

### 5.2 AI 固定工作流命令

适用于“用户要完成一个标准 AI 任务，但不想自己拼 role、prompt 和输出格式”的场景。

典型特征：

1. 命令背后仍会调用 AI / role
2. 但 prompt 模板、输入槽位、输出结构和 lifecycle 已产品化
3. 用户看到的是一个能力命令，而不是裸 role mention

典型命令：

1. `/plan <goal>`
2. `/review`
3. `/review verify`

其中：

1. `/plan` 应是“让 planner 按标准模板生成计划”的产品化入口
2. `/review verify` 应是“让 AI 复核 CR 报告 / review artifact”的固定工作流，而不是纯 deterministic utility

### 5.3 确定性治理 / 工具命令

适用于“作用域固定、产物路径固定、状态机固定”的动作。

典型特征：

1. 输入不是开放 prompt，而是显式 action / artifact / target
2. 输出会落到固定 ledger、review queue、workflow definition 或 workspace state
3. 即便内部会调用脚本或既有 runtime，也不以“让 AI 自由生成内容”为主

典型命令：

1. `plan sync`
2. `workflow preview/create/edit`
3. `workspace switch-branch`
4. `connect`
5. `doctor`

### 5.4 待审计存在性的公开命令

适用于“当前已经公开，但产品语义还不够清晰，需要单独判断是否继续保留”的场景。

当前最典型的是：

1. `run`

这类命令不应在本方案里默认被当作“当然合理且必需”的公开入口。

但本方案同时给出一条更严格的收口边界：

1. `run` 不在本轮与 `/verify` 一起删除。
2. 它暂时保留为 public surface，但 interaction model 应显式标成 `pending_existence_review`。
3. rollout 必须把它收紧到：
   - “执行 reusable governed workflow / task-driven execution flow”
   - 而不是兜底承接泛化的“帮我做/帮我实现”意图
4. 也就是说，存在性审计是为了收窄并证明 `run` 的公开价值，而不是默认把它放任为一个模糊 catch-all 命令。

### 5.5 建议在本方案执行时删除的公开命令

当前最典型的是：

1. `verify`

删除理由：

1. 它与 `connect`、`doctor` 的语义重叠过高。
2. 它的公开命令名过于抽象，用户无法从名字直觉判断“它到底验证什么”。
3. 它容易和 `/review verify` 在产品层面形成命名冲突。
4. 若其内部检查确有价值，更合理的承载位置也应是：
   - `connect` 的 follow-up / apply 后校验
   - `doctor` 的某个 mode
   - 或内部 preflight gate

## 6. 命令分层建议

### 6.1 `/plan`

推荐变更：

1. session shell 中的 `/plan <goal>` 改为 AI 固定工作流命令，而不是裸 role alias
2. 该命令内部由 `planner` role 承担生成，但对用户隐藏 role 细节，直接按标准 planning template 返回结构化结果
3. `@planner` 继续保留，但只作为 expert surface：
   - 适合开放式讨论、自由追问、非标准 planning 任务
   - 不再和 `/plan` 并列作为同等主入口推荐
4. 当前 ledger preview/commit 语义迁移到 `/plan sync`
5. 顶层 CLI 第一阶段保持兼容：
   - `repo-ai-governor plan --output pretty` 继续可用
   - 但 help 与 capability explainer 明确标成“legacy deterministic planning sync”
6. 第二阶段再考虑把顶层 CLI 显式收口到：
   - `repo-ai-governor plan sync --output pretty`
   - `repo-ai-governor plan sync commit <preview> --confirm-plan approve`

推荐用户心智：

1. `/plan 生成一个俄罗斯方块游戏开发计划`
   - 这是产品化的 planner 工作流入口
   - 内部可以调用 `planner`，但对用户不要求先理解 `@planner`
2. `/plan sync`
   - 这是把已有 task package 投影到 sprint ledger 的治理动作
3. `@planner ...`
   - 这是高级用户的原始 role 协作入口
   - 用于开放式讨论，而不是标准 plan 命令的主路径

### 6.2 `/review` 与 `/review verify`

建议保持“双入口、双语义明确”：

1. `@reviewer ...`
   - 原始 reviewer 协作入口
2. `/review`
   - 保留为 AI 固定工作流命令
   - 作用是启动标准化 governed review，并产出 review artifact
3. `/review verify`
   - 保留为 AI 固定工作流命令
   - 作用是让 AI 复核既有 CR 报告 / review artifact / 修复结果，再推进 `verified/resolved` 生命周期

原因：

1. 当前 `/review` 和 `/review verify` 都不是单纯环境工具，它们都承载 review lifecycle
2. 其中 `/review verify` 尤其不应被归类为“普通 deterministic verify”，因为它的核心价值就是“让 AI 复核 CR 报告”
3. 但用户如果明确点 `@reviewer`，仍应优先进入原始 role collaboration，而不是被关键词抢占成固定工作流

### 6.3 `/run`

`run` 在本方案中保留为公开命令，但必须显式经历“存在性审计 + 语义收紧”。

需要先回答的问题：

1. 它是否真的提供了一个独立于 `plan/review/workflow/connect/...` 的用户价值？
2. 如果每个公开命令本来就有各自执行流，用户为什么还需要一个泛化的 `run`？
3. 若它只是 orchestration engine 的公共外壳，是否更适合作为内部 runtime 概念，而不是公开命令？

建议：

1. 在完成单独审计前，不把 `/run` 当作本方案的主推荐入口，也不允许 generic implementation ask 被默认抢占成 `/run`
2. 本方案的预期终态是继续保留 `/run`，但必须把它的 scope 明确限定为：
   - “执行一个用户已选择的通用治理流程 / reusable workflow”
   - 而不是“所有命令最终都再跑一次 run”
3. rollout 必须产出独立的存在性结论与 wording 收口证据；若最终仍无法证明独立价值，再考虑：
   - 降级为内部引擎概念
   - 或收口到更具体的命令名

### 6.4 `/workflow`

建议维持 deterministic：

1. `workflow` 的价值是 preview/create/edit definition
2. 它更像 editor/compiler surface，而不是角色生成入口

如果用户说“帮我设计 workflow”，应优先：

1. capability explanation
2. `@architect` 或 `@planner`
3. 最后才落到 `/workflow preview/create`

### 6.5 `/connect`、`/doctor`

建议明确继续保持 deterministic，不向 prompt-first 演化。

原因：

1. 这两类本质是环境/接入工具
2. 即便自然语言可以触发它们，也不应伪装成 role-generation 行为

### 6.6 `/verify`

本方案将 `/verify` 的删除纳入执行范围，而不是继续把它作为稳定公开命令保留。

原因：

1. 它和 `connect` / `doctor` 之间缺少稳定、清晰、可记忆的职责边界。
2. “verify” 作为公开命令名过于宽泛，用户难以预测输入、输出和适用场景。
3. 在已有 `/review verify` 的前提下，再保留一个顶层 `/verify` 会放大命名混淆。
4. 它没有证明出足够强的独立用户价值，来支撑单独公开一个一级命令。

执行建议：

1. 将与 adapter readiness、binding truth、preflight 相关的检查并回：
   - `connect`
   - `doctor`
   - 或内部 gate
2. 删除公开 `/verify` 不等于删除 underlying readiness / projection seam：
   - `runtime.agent-projection` 仍继续拥有 onboarding contract、binding truth 与 `AgentDescriptor` projection
   - 只是这些检查不再以顶层 public `/verify` 命令名对用户暴露
3. 从 session slash registry、CLI public command surface、capability catalog、help appendix、README/playbook 中移除 `/verify` 的正式公开能力描述。
4. 默认不保留长期 shim；若迁移窗口确实需要兼容，只允许保留一个极短期 shim：
   - 输出迁移说明
   - 指向新的承载入口
   - 但不再把它当作正式能力继续演进
   - 且必须在同一技术方案的收尾阶段移除

## 7. Capability Catalog 需要补的字段

仅靠当前 `title / summary / suggestedSlashCommand / confirmationRequired`
还不足以表达新的用户心智。

建议新增最小字段：

```ts
interface SessionMainCapabilityInteractionModel {
  interactionModel:
    | 'raw_role_entry'
    | 'ai_fixed_workflow'
    | 'deterministic_utility'
    | 'pending_existence_review'
    | 'explain_only';
  primaryEntry:
    | 'role_mention'
    | 'slash_command'
    | 'cli_command'
    | 'conversational_answer';
  backingExecution:
    | 'raw_role_delegate'
    | 'templated_ai_workflow'
    | 'pure_command'
    | 'undecided';
  deterministicActionName?: string;
  roleAliasTarget?: string;
  legacyCommandAlias?: string;
}
```

作用：

1. explainer 可以诚实告诉用户“这条能力到底是 role、AI 固定工作流、纯工具命令，还是仍待证明存在性的公开入口”
2. slash palette 可以展示“这是产品化 AI 工作流，还是纯 command bridge”
3. natural-language routing 可以按 interaction model 决定优先级

### 7.1 当前公开能力的目标分类矩阵

为避免 promotion 时仍然只剩抽象字段定义，本方案同时冻结第一版 capability interaction mapping：

| surface/capability | interactionModel | primaryEntry | backingExecution | public status |
|---|---|---|---|---|
| `@planner` | `raw_role_entry` | `role_mention` | `raw_role_delegate` | expert |
| `@architect` | `raw_role_entry` | `role_mention` | `raw_role_delegate` | expert |
| `@reviewer` | `raw_role_entry` | `role_mention` | `raw_role_delegate` | expert |
| `@verifier` | `raw_role_entry` | `role_mention` | `raw_role_delegate` | expert |
| `plan` | `ai_fixed_workflow` | `slash_command` | `templated_ai_workflow` | public |
| `review` | `ai_fixed_workflow` | `slash_command` | `templated_ai_workflow` | public |
| `review_verify` | `ai_fixed_workflow` | `slash_command` | `templated_ai_workflow` | public |
| `plan_sync` | `deterministic_utility` | `slash_command` | `pure_command` | public |
| `workflow` | `deterministic_utility` | `slash_command` | `pure_command` | public |
| `connect` | `deterministic_utility` | `slash_command` | `pure_command` | public |
| `doctor` | `deterministic_utility` | `slash_command` | `pure_command` | public |
| `workspace.switch_branch` | `deterministic_utility` | `slash_command` | `pure_command` | public |
| `run` | `pending_existence_review` | `slash_command` | `pure_command` | public but narrowed |
| `help` | `explain_only` | `conversational_answer` | `pure_command` | public |
| `verify` | 不再进入公开 catalog | 不适用 | internal gate only | removed |

说明：

1. `run` 的 `pending_existence_review` 不是“暂不处理”，而是要求 rollout 在不删除 public command 的前提下补齐收窄证据。
2. `verify` 从公开 catalog 删除后，readiness truth 仍由 `connect / doctor / internal gate` 与 `runtime.agent-projection` projection seam 继续承接。

### 7.2 Formal Landing 与 Promotion 归宿

为了让 review 结论能直接 hand off 到 `technical-solution-promotion`，formal landing 需要在本 draft 中提前固定：

1. `runtime.orchestration`
   - 作为 command model 的 formal source of truth
   - 新增 1 份 command-model ADR
   - 新增 1 份 capability interaction model contract
2. `runtime.cli-interactive-shell`
   - 不拥有新的 command model canonical truth
   - 只消费 `runtime.orchestration` contract，并在 module overview / session-shell contract 中补 consumer-facing wording、slash surface 与 discoverability boundary
3. `runtime.agent-projection`
   - 记录为受影响模块
   - 负责承接删除 public `/verify` 后仍保留的 onboarding / readiness / projection seam
   - 除非 promotion 时发现新增 contract-level fact，否则本轮不额外新建 formal doc
4. `runtime.durable-storage`
   - 记录为受影响模块
   - 主要因为 capability/delegation/removal migration 仍会触及 shared session / audit / ledger continuity wording
   - 除非 promotion 时发现新增 contract-level fact，否则本轮不额外新建 formal doc
5. triad / architecture sync
   - 因为公开 `/verify` 将被删除，`product-requirements.md` 与 `product-requirements-brief.md` 必须同步改写 `connect / doctor / verify` 的 public wording
   - 若 overall / architecture 文档仍把 `/verify` 写成公开入口，也必须在 promotion 同窗一起改写

## 8. Routing 调整建议

### 8.1 关键词命中不应再默认等于命令桥接

当前最大问题之一，是 `plan/review/run` 等关键词只要命中，就容易直接映射到 command bridge。

建议调整为：

1. 若用户显式提及 `@role`，优先走 role collaboration
2. 若命中的是 `ai_fixed_workflow`：
   - 优先进入产品化 AI 工作流，而不是裸命令桥接
3. 若命中的是 `raw_role_entry`：
   - 优先进入 role delegate 或 capability explainer
4. 只有当用户明确提及 deterministic 动作词，且目标能力属于 `deterministic_utility` 时，才桥接到 CLI command

planning 相关 deterministic 动作词示例：

1. `同步到 sprint`
2. `写入台账`
3. `commit 这个计划`
4. `落到 task ledger`
5. `更新 checklist/tasks.csv/TK`

### 8.2 `/plan` 在 session shell 中不应再直接桥接到裸 `plan`

session shell 的 command / mention discoverability layer 建议改成：

1. `/plan`
   - kind=`ai_fixed_workflow`
   - workflow_id=`planner.standardized_plan_generation`
   - backing_role=`planner`
2. `/plan sync`
   - kind=`bridge`
   - target=`repo-ai-governor plan --output pretty`
3. `@planner`
   - kind=`raw_role_entry`
   - target=`planner`

这样可以把三种入口明确拆开：

1. `/plan` 是产品化 AI 工作流
2. `@planner` 是原始 role
3. `/plan sync` 是确定性 ledger action

### 8.3 已删除 `/verify` 的迁移路由

当用户仍使用旧的 `verify` 语言时，不应再桥接到顶层 `/verify` 命令，而应按语义改写到新承载面：

1. 若用户要检查 adapter / binding / readiness truth：
   - 优先改写到 `connect` follow-up 或 `doctor` mode
2. 若检查只是某个固定工作流的内部前置条件：
   - 作为该工作流的内建 preflight gate 执行，而不是暴露额外公开命令
3. explainer 与 help 文案应统一说明：
   - `/verify` 已删除
   - 相关能力已并入 `connect`、`doctor` 或内部 gate

## 9. 新旧入口映射建议

| 用户想做什么 | 推荐新入口 | 兼容旧入口 | 备注 |
|---|---|---|---|
| 让 AI 按标准模板生成执行计划 | `/plan <goal>` | 自然语言 planning request | AI fixed workflow |
| 和 planner 做开放式讨论 | `@planner <prompt>` | 显式 role mention | raw role |
| 把任务包同步到当前 sprint ledger | `/plan sync` | `repo-ai-governor plan --output pretty` | deterministic |
| 让 reviewer 做开放式分析 | `@reviewer <prompt>` | 自然语言 review ask | raw role |
| 启动当前工作树 governed review | `/review` | `repo-ai-governor review --output pretty` | AI fixed workflow |
| 让 AI 复核 CR 报告 / review artifact | `/review verify` | `repo-ai-governor review-verify` | AI fixed workflow |
| 执行 reusable governed workflow / task-driven execution flow | `/run` | `repo-ai-governor run --dry-run --trace` | public but narrowed |
| 校验接入与执行前 readiness | `connect` follow-up / `doctor` mode / internal gate | `repo-ai-governor verify --adapters --output pretty` | remove in this solution |
| 解释某个能力该怎么用 | 自然语言 explainer | `/help` | explain-first |

## 10. 兼容策略

### 10.1 Phase A：只改 session shell 心智，不改顶层 CLI

1. slash `/plan` 改为产品化 AI 固定工作流
2. 新增 `/plan sync`
3. `@planner` 保留，但降为 expert surface
4. 自然语言 planning request 不再直接 handoff 到裸 `plan`
5. 顶层 CLI `repo-ai-governor plan` 暂时保持现状

收益：

1. 用户首先接触到的交互面恢复直觉
2. 对既有脚本、集成和文档破坏最小

### 10.2 Phase B：能力说明与帮助文案同步

1. capability catalog 增加 interaction model 元数据
2. `/help`、slash palette、CLI help appendix、session.main explainer 统一表述
3. 对 `/review verify` 明确标注为“AI 固定工作流：复核 CR 报告”
4. 对 legacy deterministic `plan` 明确加注“task-package sync / ledger projection”
5. 删除 `/verify` 的公开命令声明与 discoverability，并给出迁移入口；若发布安全需要兼容，仅允许保留隐藏 shim

### 10.3 Phase C：CLI 命令正式去歧义

当 adoption 证据足够后，再考虑：

1. 顶层 CLI 新增 `plan sync`
2. `plan` 保留一个 deprecation 窗口
3. `run` 在本方案 rollout 中完成 existence review，并以“保留 public surface，但只面向 reusable governed execution flow”收口
4. 若发布安全需要曾短期保留 `/verify` shim，则在本阶段移除
5. 最终把 bare `plan` 降级成 alias 或 explanatory shim

## 11. 对现有 draft 的修正关系

### 11.1 对 `session-main-plan-generation-and-ledger-commit-contract` 的修正

该旧 draft 解决的是：

1. `/plan` 如何从 snapshot-only 走向 preview/commit/ledger projection

它没有充分解决的是：

1. `/plan` 这个名字本身是否还适合承载 deterministic ledger action
2. 为什么用户天然会把 `/plan` 理解为 planner role 入口

因此本方案不是否定旧 draft 的 ledger contract，而是给它加一层前台产品语义修正：

1. ledger contract 继续成立
2. 但它更适合作为 `plan sync` 一类 deterministic surface 的 contract

### 11.2 对 capability explainer draft 的补充

旧 capability explainer draft 解决的是：

1. 如何解释现有能力

本方案补的是：

1. 先把能力按用户心智重新分层
2. 再让 explainer 解释这层分层后的真实语义

## 12. 分阶段实现建议

### Phase 1

1. 在 capability catalog 中为 `plan/review/review verify/run/workflow/connect/doctor` 补 interaction model
2. 在 skill registry 中把 planning 请求从 direct command handoff 改为 AI 固定工作流
3. session shell slash registry 新增 `/plan sync`
4. session shell `/plan` 改为产品化 AI 工作流入口
5. `/review verify` 明确切到 AI 固定工作流分类
6. 删除 `/verify` 公开命令；若兼容窗口必须存在，则仅保留隐藏 shim，并把旧提法迁移到 `connect/doctor/internal gate`

### Phase 2

1. capability explainer 根据 interaction model 输出更诚实的文案
2. `/help` 和 slash palette 显示“raw role / AI fixed workflow / deterministic utility / confirm required”
3. 为 planning deterministic action 增加更明确的 next-action wording
4. 对 `run` 输出存在性说明与 narrowed wording，而不是默认当作理所当然的稳定入口
5. 完成 `/verify` 删除后的迁移说明、错误提示和旧表达改写逻辑

### Phase 3

1. 顶层 CLI `plan` 收口到 `plan sync`
2. 文档和 playbook 完成迁移
3. 完成 `run` existence review，并把 public wording 收口到 reusable governed execution flow
4. 删除 `/verify` 兼容 shim（若曾短期保留）
5. 收集 adopter 对新心智的真实反馈，再决定是否继续对其他命令做同类拆分

## 13. 验收标准

1. 用户在 session shell 中输入 `/plan <goal>` 时，不再收到“unsupported action”类错误，而是进入标准 planner 工作流。
2. `@planner` 与 `/plan` 的关系对用户清晰可解释：
   - 前者是原始 role
   - 后者是产品化 AI 工作流
3. `/review verify` 被清晰解释为“AI 复核 CR 报告 / review artifact”的固定工作流，而不是普通 deterministic verify。
4. 用户仍然可以显式执行 deterministic ledger action，并清楚知道那不是“生成计划”，而是“同步计划到台账”。
5. `/help`、capability explainer、slash palette 对 `plan/review/review verify` 的说明一致。
6. `/verify` 已从公开命令面删除；若发布安全需要短期 shim，也必须不再 discoverable，且有明确移除窗口。
7. `run` 最终继续保留为公开命令，但必须有独立存在性结论，并被明确收窄到 reusable governed execution flow；generic implementation asks 不得再默认桥接到 `/run`。

## 14. 最终建议

当前最值得优先做的，不是把所有命令都 prompt 化，而是先把以下事实正式化：

1. 原始 `@role` 应保留，但更适合作为 expert surface，而不是所有标准能力的唯一主入口。
2. `/plan`、`/review`、`/review verify` 更适合作为产品化 AI 固定工作流命令。
3. `plan` namespace 最适合优先拆分：
   - `/plan <goal>` 归标准 planner 工作流
   - `@planner <prompt>` 归原始 role
   - `/plan sync` 归 deterministic ledger projection
4. `run` 可以继续保留，但必须通过单独的存在性审计把语义收紧为 reusable governed execution flow，而不是继续充当泛化兜底命令。
5. `verify` 建议在本方案执行时顺带删除，并把其检查能力并回 `connect`、`doctor` 或内部 gate，同时保留 `runtime.agent-projection` 的 underlying onboarding / projection seam。

这样既能保住现有治理实现，也能把用户最直觉、最容易踩坑的一层交互语义重新校正回来。
