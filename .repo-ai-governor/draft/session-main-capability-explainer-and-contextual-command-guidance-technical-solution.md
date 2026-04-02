# Repo AI Governor `session.main` 能力解释与上下文化命令指引技术方案（Draft）

- Status: draft
- Date: 2026-04-02
- Scope: service-owned `session.main` / capability explanation / contextual command guidance / help-aware conversational answer / governed execution bridge
- Target Module IDs:
  - `runtime.agent-projection`
  - `runtime.orchestration`
  - `runtime.cli-interactive-shell`
- Implementation Surfaces:
  - `apps/cli`
  - `packages/shared`
  - `packages/core-orchestration-service`
- Related:
  - `.repo-ai-governor/draft/session-main-conversational-chat-and-skill-intent-handoff-technical-solution.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/contracts/cli-session-shell-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-orchestration/adrs/session-main-supervisor-and-role-subagent-collaboration.md`
  - `packages/core-orchestration-service/src/local-orchestration-service-session-main-agent-dispatcher.ts`
  - `packages/core-orchestration-service/src/local-orchestration-service-session-main-skill-registry.ts`
  - `apps/cli/src/runtime/interactive-shell/session-slash-command-registry.ts`
  - `apps/cli/src/main.ts`

## 1. 背景与问题

`project-035` 已把 `session.main` 推进到 conversation-first + risk-tiered skill handoff 方向，但当前用户在主 agent 里输入“你能帮我做什么”“`/review` 是干嘛的”“给我一个 `connect` 示例”时，系统还缺少一层正式能力：

1. 能结合当前工具真实功能解释“我现在能帮你做什么”。
2. 能沿着用户追问继续解释具体命令、适用场景和示例。
3. 能把“能力解释”和“真正执行命令”分开治理，而不是二选一。

当前缺口主要体现在四个地方：

1. 现有 `/help` 更偏 slash-command discoverability，而不是对话式 capability explanation。
2. 现有 `skill registry` 更偏“把自然语言映射成动作”，不擅长“把自然语言映射成能力讲解”。
3. 当前 CLI help 追加说明主要散落在 `apps/cli/src/main.ts` 的 help appendix builder 里，`runtime.orchestration` 不应反向依赖这些 app-layer 细节。
4. 用户真正关心的不是“命令树长什么样”，而是：
   - 现在有哪些能力可用
   - 哪些能力依赖已连接工具
   - 哪些能力是只读直跑、哪些需要确认
   - 某条命令什么时候该用、怎么用、有什么例子

如果只把这件事实现成 `/help` 的另一种展示，产品仍然会显得机械：

1. 用户必须先切到 slash command 心智。
2. 用户追问“那 `review verify` 和 `review` 有什么区别”时，系统缺少结构化回答层。
3. 一旦用户句子里带了 `review`、`plan`、`run` 等关键词，还可能被误判成执行意图，而不是解释意图。

## 2. 目标

本方案的目标是让 `session.main` 具备一个正式的 capability explainer，使主 agent 可以把“我能做什么”和“怎么做”讲清楚，并在合适时机自然衔接到 governed execution。

具体来说：

1. 支持 capability overview：
   - 例如 `你能帮我做什么`、`what can you do`、`有哪些能力`
2. 支持 capability detail：
   - 例如 `connect 是做什么的`、`review 有什么用`
3. 支持 example-oriented follow-up：
   - 例如 `给我一个 verify 的例子`、`review 怎么问你比较好`
4. 支持 environment-aware explanation：
   - 回答里能体现当前已连接工具、可用 surface、risk tier 和 confirmation policy
5. 保持治理边界：
   - 能力解释本身不应偷偷执行命令
   - 但当用户把解释追问升级成明确动作请求时，仍应自然进入既有 skill handoff / direct execute / preview confirm

## 3. 非目标

1. 不把 capability explainer 做成“读取全部文档后的开放式知识问答系统”。
2. 不在第一阶段让 explainer 自动扫描整个仓库或外部互联网再临时生成命令说明。
3. 不在第一阶段把 explainer 变成第二套 workflow planner。
4. 不依赖每一轮都 shell-out 执行 `repo-ai-governor <cmd> --help` 来凑上下文。
5. 不改变现有 `/help` 的 CLI discoverability 入口；本方案是在其之上补 conversation-first explainer，而不是替换命令行 help。

## 4. 为什么不只用 Skill

### 4.1 Skill-only 方案能解决什么

如果只沿用现有 `skill registry`，可以较快加出一个：

1. `skill.help.capabilities`
2. `skill.help.command.connect`
3. `skill.help.command.review`

好处是：

1. 实现简单。
2. 可以复用既有 risk-tiered handoff pipeline。
3. 与 `help` 属于低风险能力发现动作这一正式方向一致。

### 4.2 Skill-only 方案不够的地方

但它不适合作为主解，原因是：

1. skill 本质上是“动作路由器”，不是“解释层”。
2. 用户问“你能帮我做什么”时，更合理的 outcome 应是 `answer`，不是强行投影成某个 handoff。
3. 用户问“`review` 和 `review verify` 区别是什么”时，系统需要做 capability comparison，而不是命中某一个 skill。
4. 用户问“先说说 `connect`，再给我个例子”时，系统需要延续上轮解释上下文，而不是每次都重新做动作匹配。

结论：

1. skill 可以作为 explainer 的一个 consumer 或 bridge。
2. 但 capability explanation 本身应拥有独立的 read model 与 route。

## 5. 备选方案比较

### 5.1 方案 A：Prompt-only，直接把原始 help 文本塞给主 agent

做法：

1. 每次用户问 capability question 时，临时读取 `/help`、`command --help`、追加说明文本
2. 交给主 agent 自由回答

优点：

1. 首轮实现快
2. 看起来接近“结合当前工具 help”

问题：

1. 帮助文本分散且冗长，容易造成 prompt 噪音
2. 同一命令的描述、示例、risk policy、execution mode 可能在不同地方漂移
3. 很难做稳定的 follow-up explanation
4. 很难把“能力解释”和“是否允许直接执行”拆开

### 5.2 方案 B：Skill-only capability help

做法：

1. 为 `help` 和若干命令详情增加 foreground skill
2. 统一走 skill routing

优点：

1. 代码改动相对少
2. 可以复用现有 `session.main` skill pipeline

问题：

1. skill 更像动作，而不是解释
2. overview、comparison、example follow-up 都会很别扭
3. detail question 容易与 execution intent 混淆

### 5.3 方案 C：Capability Explainer Read Model + Conversation Route + Governed Handoff Bridge

做法：

1. 新增 service-owned capability catalog / read model
2. 新增 capability-aware classifier 和 explainer route
3. 让 `/help`、slash registry、CLI help appendix、skill policy、runtime availability 都汇入同一个 capability descriptor
4. 当用户从“解释”转成“执行”时，再桥接到既有 skill registry

优点：

1. 既能对话式解释，又不破坏治理边界
2. 可以回答 overview、detail、comparison、example 四类问题
3. 可以体现当前环境下的真实可用性和确认等级
4. 可以让 CLI help 与 `session.main` explainer 共享同一事实来源

结论：

1. 推荐方案是 C。
2. skill 继续保留，但它应是 execution bridge，而不是 capability explanation 的唯一承载物。

## 6. 外部资料启发

本方案在 `2026-04-02` 补充查阅了官方外部资料，得到三点稳定启发：

1. MCP 官方 tools 规范强调 tool definition 应带稳定的 `name/title/description/inputSchema/outputSchema`，并支持 `tools/list` 与 `notifications/tools/list_changed` 来让客户端消费动态能力目录，而不是依赖非结构化文本 scraping。
   - 来源：[Model Context Protocol Tools Specification](https://modelcontextprotocol.io/specification/2025-11-25/server/tools)
2. Anthropic 官方 tool-use 文档强调 `description` 应说明工具“做什么、什么时候该用、怎么工作”，并指出工具定义会直接进入模型的系统提示，这意味着结构化、面向决策的能力描述非常重要。
   - 来源：[Anthropic Tool Use Documentation](https://docs.anthropic.com/ru/docs/agents-and-tools/tool-use/implement-tool-use)
3. OpenAI 官方 actions production 指南强调：
   - operation description 不应把模型硬编码成某些触发词反射器
   - consequential action 应显式要求确认，非 consequential action 才适合降低摩擦
   - 这支持我们把 capability explanation 和 execution policy 明确分层
   - 来源：[OpenAI Actions Production Notes](https://developers.openai.com/api/docs/actions/production)

这些资料共同支持一个方向：

1. 先有结构化 capability descriptor。
2. 再由主 agent 基于 descriptor 回答。
3. 最后才决定是否桥接到执行动作。

## 7. 推荐架构

### 7.1 新增 `SessionMainCapabilityCatalog`

引入一个 runtime-neutral catalog，作为 capability explanation 的唯一事实来源。

它不直接等价于：

1. slash command registry
2. skill registry
3. raw `--help` 文本

而是对这些信息做一次正式投影，形成对话友好的能力描述层。

推荐先区分两层：

1. locale-neutral capability seed
2. 面向当前 locale 渲染后的 capability descriptor view

canonical source 应是 seed，而不是直接把某一种语言的 prose 文本写死成唯一事实来源。

建议 seed 结构：

```ts
interface SessionMainCapabilityDescriptorSeed {
  capabilityId: string;
  titleKey: string;
  summaryKey: string;
  category: SessionMainCapabilityCategory;
  aliases: string[];
  whenToUseKeys: string[];
  notForKeys: string[];
  examplePromptKeys: string[];
  exampleCommands: string[];
  relatedSlashCommands: string[];
  relatedSkillIds: string[];
  executionPath: SessionMainExecutionPath;
  confirmationMode: SessionMainConfirmationMode;
  riskTier: SessionMainSkillRiskTier;
  helpSections: Array<{
    headingKey: string;
    bodyKeys: string[];
  }>;
}
```

对应的渲染视图才是：

```ts
interface SessionMainCapabilityDescriptor {
  capabilityId: string;
  title: string;
  summary: string;
  category: SessionMainCapabilityCategory;
  aliases: string[];
  whenToUse: string[];
  notFor: string[];
  examplePrompts: string[];
  exampleCommands: string[];
  relatedSlashCommands: string[];
  relatedSkillIds: string[];
  executionPath: SessionMainExecutionPath;
  confirmationMode: SessionMainConfirmationMode;
  riskTier: SessionMainSkillRiskTier;
  helpSections: Array<{
    heading: string;
    body: string[];
  }>;
}
```

关键点：

1. 它既保留命令视角，也保留自然语言视角。
2. 它能表达“这个能力主要是解释型”“这个能力可以直接执行”“这个能力需要 preview + confirm”。
3. 它比 raw help 更紧凑，比 skill plan 更偏解释。
4. locale-neutral seed 可以与当前 CLI / shell i18n key 体系兼容，避免 `runtime.orchestration` 与 `entry.cli` 各自再维护一份文案真值。

补充说明：

1. 这里的 `SessionMainCapabilityCategory`、`SessionMainExecutionPath`、`SessionMainConfirmationMode`、`SessionMainSkillRiskTier` 应在实现层走统一的 enum-like 常量管理，而不是散落成多处字符串字面量。
2. 推荐沿用当前仓库 `SESSION_MAIN_RESPONSE_MODE`、`SESSION_MAIN_INTERACTION_MODE`、`SESSION_MAIN_HANDOFF_EXECUTION_MODE` 这类模式，使用 shared `as const` registry 并导出对应 type alias。
3. 也就是说，这里的评论语义是“enum 管理”，但落地方式应优先贴合现有代码风格，而不是额外引入第二套风格完全不同的枚举体系。
4. catalog owner 应持有 locale-neutral seed；CLI help appendix、session.main explainer 与其他 presenter 再通过 i18n runtime 渲染为当前语言视图，而不是把中文或英文 prose 直接写成 canonical source。

### 7.2 新增 `SessionMainCapabilityAvailabilityResolver`

catalog 只回答“理论上能做什么”；availability resolver 负责回答“当前这一轮实际上能做什么”。

它不拥有新的 role / surface / setup 真值，只消费既有正式模块导出的 projection / onboarding / probe truth。

建议注入的信息包括：

1. 当前可用 adapter surface
2. `runtime.agent-projection` 导出的已连接工具 / role / projection truth
3. 当前会话的 routing preference
4. 某些能力是否需要 connected adapters
5. 某些能力是否因当前 host/runtime 降级

建议结构：

```ts
interface SessionMainCapabilityAvailability {
  capabilityId: string;
  status: SessionMainCapabilityAvailabilityStatus;
  reason?: string;
  selectedSurface?: string;
  selectedBy?: string;
  requiresSetup?: boolean;
  suggestedNextStep?: string;
}
```

这样主 agent 回答“你能帮我做什么”时，就不只是抽象列命令，而是能说：

1. 哪些现在就能做
2. 哪些先要 `/connect`
3. 哪些是低风险直跑
4. 哪些会先进入 preview + confirm

约束：

1. `SessionMainCapabilityAvailabilityResolver` 只能消费 `runtime.agent-projection`、skill policy 与 session routing preference 的导出事实，不得在 `runtime.orchestration` 或 presenter 层重建第二套 projection registry。
2. `selectedSurface / selectedBy` 只能表示“当前解释所引用的执行建议”，不能反向成为新的 canonical routing truth。

### 7.3 新增 `SessionMainCapabilityExplainer`

这是主 agent 的正式解释层，输入是：

1. 用户 utterance
2. 可选的上一轮 capability context
3. capability catalog
4. availability state

输出是结构化 explainer answer，而不是 command plan。

建议结构：

```ts
interface SessionMainCapabilityAnswer {
  answerMode: SessionMainCapabilityAnswerMode;
  referencedCapabilityIds: string[];
  answerMarkdown: string;
  suggestedFollowUps: string[];
  suggestedActions: Array<{
    label: string;
    utterance: string;
    executionPath: SessionMainExecutionPath;
  }>;
}
```

补充说明：

1. `SessionMainCapabilityAvailabilityStatus`、`SessionMainCapabilityAnswerMode` 与 `SessionMainExecutionPath` 应共享同一套集中常量定义，避免 dispatcher、catalog、presenter、shared-session DTO 各自复制字面量。
2. 如果实现里最终同时出现 `answerMode` 与 `answerKind`，两者也必须由单一常量源导出，不能在不同模块里分别写一遍 `'overview' | 'detail' | ...`。
3. `SessionMainCapabilityAnswer` 只表示“纯 explanation answer”的正式输出；同轮 explain -> execute 所需的 `bridgeCandidate` 不属于这个 answer payload，而属于 explainer 与 dispatcher 之间的内部桥接对象，避免把 answer-only turn 与 handoff continuity 混成一个外部 contract。

### 7.4 新增 explainer-aware conversation classification

当前 `LocalOrchestrationServiceSessionMainAgentDispatcher` 主要区分：

1. skill intent
2. follow-up continuation
3. direct answer

本方案建议在 skill resolver 之前新增一层 capability intent classifier，至少识别：

1. `capability_overview`
   - `你能帮我做什么`
   - `what can you do`
2. `capability_detail`
   - `connect 是什么`
   - `review 是干嘛的`
3. `capability_examples`
   - `给个 verify 的例子`
   - `怎么问你做 plan 比较合适`
4. `capability_comparison`
   - `review 和 review verify 有什么区别`

补充说明：

1. 上述 `capability_overview / capability_detail / capability_examples / capability_comparison` 也应进入统一的 `SessionMainCapabilityIntentKind` 常量注册表。
2. 不建议 classifier、explainer 和 presenter 各自复制一套 intent kind 字符串。

这里不是要替换既有 `session.main` supervisor taxonomy，而是要在现有 taxonomy 中插入一条 capability explanation 分支。

路由优先级建议改成：

1. `greeting / social chat`
2. 显式 role collaboration / role mention
3. capability explanation intent
4. follow-up whitelist continuation
5. skill intent / slash-command-adjacent command handoff
6. repo question / free-form direct answer

这样可以避免一个典型误判：

1. 用户说 `review 是什么`
2. 旧逻辑容易命中 `skill.review.code`
3. 新逻辑应该优先命中 `capability_detail(review)`

补充约束：

1. `greeting/social chat` 与 `repo question` 仍然保留在现有 supervisor taxonomy 中，不因为 capability explainer 的引入而被删掉。
2. slash-command-adjacent handoff 也仍然是正式语义，只是 detail/explanation 问句不应再被它误吞。

### 7.5 Execution Bridge 仍复用 Skill Registry

capability explainer 不负责真正执行命令。

它与 skill registry 的关系应该是：

1. explainer 负责讲清楚
2. skill registry 负责执行桥接

典型流程：

1. 用户：`review 是做什么的`
2. explainer：解释 `review` 的用途、适用场景、例子、是否需要确认
3. 用户：`那帮我 review 当前改动`
4. dispatcher：此时再命中 `skill.review.code`

换句话说：

1. explainer route 先解决“懂不懂”
2. skill route 再解决“做不做”

### 7.5.1 同轮“先解释再执行”混合意图

常见用户不会总是分两轮说话，系统必须接受这种输入：

1. `先说说 review，再帮我 review 当前改动`
2. `给我一个 verify 的例子，然后顺便验证一下当前 adapter 状态`

因此需要一条显式 split-intent 规则：

1. 若一句话同时包含 capability explanation 和 executable ask，dispatcher 先命中 capability explainer。
2. explainer 在内部桥接层必须产出：
   - 简短解释
   - 对应 `suggestedActions`
   - 可选的 `bridgeCandidate`
3. `bridgeCandidate` 应被视为 explainer -> dispatcher 的内部结构化对象，例如：

```ts
interface SessionMainCapabilityBridgeCandidate {
  skillId: string;
  utterance: string;
  executionPath: Extract<SessionMainExecutionPath, 'direct_execute' | 'preview_confirm'>;
  confirmationMode: SessionMainConfirmationMode;
}
```

4. 当 executable ask 已经 scope-resolved，且现有 skill policy 可判定为 `direct_execute` 或 `preview_confirm` 时，同一 turn 允许生成一个结构化执行桥接候选，而不是强制用户再问一轮。
5. 若 `bridgeCandidate.executionPath=direct_execute`，dispatcher 可以把本 turn 升级为既有 governed direct-execute skill outcome；解释文字只作为该 turn 的 assistant recap/lead-in，不新增第二套 pending-handoff contract。
6. 若 `bridgeCandidate.executionPath=preview_confirm`，本 turn 的正式外部 outcome 必须切换到既有 `command_handoff_preview` 路径；preview rendering、pending handoff continuity 与 resume 恢复继续由现有 shared session / session-shell contract 承接，而不是停留在 answer-only payload 里。
7. 若 executable ask 仍高歧义或高成本，则只返回 explanation + suggested follow-up，不生成 executable bridge。

也就是说：

1. 路由优先级仍然是 explainer 在前
2. 但 explainer 不能把“解释 + 明确执行请求”的一句话困死在纯说明路径里
3. 真正执行仍由 skill registry / governed handoff 负责，只是 bridge candidate 可以在同一 turn 内被准备好
4. `preview_confirm` 的桥接不能发明一条新的 hybrid answer contract，必须复用既有 handoff preview seam

## 8. 单一事实来源如何收口

### 8.1 不直接复用 `apps/cli/src/main.ts` 文本

当前 help appendix builder 在 `apps/cli/src/main.ts` 中，这对 `entry.cli` 合理，但对 `runtime.orchestration` 不合理。

因此推荐：

1. 先把命令说明、示例、action guide 抽成 service-owned static capability descriptor provider
2. 再让下面三类消费者共享同一份 descriptor：
   - Commander / CLI help appendix
   - session slash command registry
   - session.main capability explainer

推荐新 seam 应正式定为：

1. canonical owner package: `packages/core-orchestration-service`
2. canonical producer path: `packages/core-orchestration-service/src/session-main-capability-catalog.ts`
3. `packages/shared` 只承载 capability-related DTO、常量与 type alias，不承载 `session.main` 专属 help prose、示例文本或 capability taxonomy

推荐边界进一步明确为：

1. `runtime.orchestration` / `core-orchestration-service` 拥有 `session.main` capability catalog 的静态 descriptor assembly。
2. CLI help appendix、slash registry 与 presenter 都是下游 consumer，不得各自再维护一份独立 capability truth。
3. `packages/shared` 可以暴露 `SessionMainCapabilityCategory`、`SessionMainCapabilityIntentKind`、`SessionMainExecutionPath` 等集中常量，但不应拥有整份 catalog 内容。
4. catalog owner 仍应保持“静态 descriptor provider + runtime overlay resolver”分层，而不是把 catalog 与 availability 混成一个 stateful registry。
5. 单一事实来源仅覆盖“可解释的 governed capabilities”，不覆盖 shell-local builtins 的全部交互细节。

约束：

1. `core-orchestration-service` 不得反向依赖 `apps/cli/**`
2. explainer 也不应通过运行子进程抓 `--help` 输出来做解释

### 8.2 Catalog 的输入来源

推荐把依赖图改成“upstream seed -> canonical catalog -> downstream projections”，而不是让 slash registry / skill registry 反向成为 catalog owner。

upstream 原始输入应是：

1. `packages/core-orchestration-service` 内部的 canonical capability seed / descriptor fragment
   - 作为 human-authored 单一事实来源
   - 拥有 `capabilityId`、title、summary、helpSections、examplePrompts、exampleCommands、relatedSkillIds、默认 execution baseline
2. 与显式命令语法相关的稳定引用字段
   - 例如 `relatedSlashCommands`
   - 这些字段写进 seed，本身不要求 catalog 反向依赖 `CliSessionSlashCommandRegistry`
3. 与执行治理相关的稳定常量
   - 例如默认 `executionPath`、`confirmationMode`、`riskTier`
   - 这些是 catalog baseline，不等于 runtime 每一轮最终判定

这里必须再补一条边界：

4. shell-local builtin command metadata
   - 例如 `/confirm`、`/cancel`、`/clear`、`/exit`、`/resume`、`/history`、`/search`、`/multiline`、`/status`、`/theme`、`/agent`
   - 它们继续由 `runtime.cli-interactive-shell` 的 slash registry 自治
   - 不应被强行下沉为 `session.main` capability catalog 的 canonical owned content

downstream consumer 应是：

1. CLI help appendix
   - 从 catalog 渲染说明、示例和 action guide
2. session slash command registry
   - 只对 governed bridge commands 从 catalog 复用 summary / discoverability metadata，或与 catalog 共用同一组 seed 常量
   - shell-local builtins 继续保留在 CLI registry 本地定义
3. `LocalOrchestrationServiceSessionMainSkillRegistry`
   - 继续拥有自然语言动作匹配与最终 skill routing / policy gate
   - 但不再拥有用户可见的 capability prose 事实源
4. `SessionMainCapabilityExplainer`
   - 直接消费 catalog 作为 explanation truth

这样 `/help`、slash discoverability 和主 agent 的“你能帮我做什么”才会真正收敛为一套事实，而不是彼此转译。

动态 availability 不属于 catalog 本体，而应作为 overlay 单独叠加：

1. 静态 `SessionMainCapabilityCatalog`
   - 回答 capability 的名称、summary、example、risk baseline、默认 execution path
2. 动态 `SessionMainCapabilityAvailabilityResolver`
   - 回答当前 session / 当前 routing preference / 当前 connected tools 下是否可用
3. `SessionMainCapabilityExplainer`
   - 同时消费静态 descriptor 与动态 availability，再生成最终回答

约束：

1. CLI help appendix 与 slash registry 只消费静态 catalog，不消费 per-session availability。
2. `session.main` explainer 才在回答期叠加 availability overlay。
3. 这样静态 descriptor 能保持单一事实来源，而不会因为当前连接状态不同而漂移成多份“help truth”。
4. slash registry 若需要统一呈现“governed capabilities + shell builtins”，应在 presenter/registry 组合层做合并，而不是要求 catalog 拥有 shell-local builtin truth。

## 9. 回答语义设计

### 9.1 Overview Answer

当用户问 `你能帮我做什么` 时，回答应：

1. 先按能力簇分组，而不是按命令字母排序
2. 结合当前环境说明哪些能力已就绪、哪些需要先接工具
3. 明确哪些能力是解释型、哪些会触发执行

建议分组：

1. 连接与诊断
   - `/connect`
   - `/doctor`
   - `/verify`
2. 规划与审查
   - `/plan`
   - `/review`
   - `/review verify`
3. 执行与工作流
   - `/run`
   - `/workflow`
4. 对话与指引
   - capability explanation
   - repo question
   - examples / comparisons

### 9.2 Detail Answer

当用户问 `connect 是干嘛的` 时，回答建议固定包含：

1. 它做什么
2. 什么时候用
3. 一个自然语言例子
4. 一个 slash command 例子
5. 当前默认确认策略

### 9.3 Comparison Answer

当用户问 `review 和 review verify 有什么区别` 时，回答应明确：

1. `/review`
   - 只读分析
   - scope resolved 时可 direct execute
2. `/review verify`
   - 正式 CR 生命周期动作
   - 默认 preview + confirm

### 9.4 Example Answer

当用户问 `给我一个 verify 的例子` 时，回答应给两类例子：

1. 自然语言例子
2. 显式命令例子

例如：

1. `帮我验证一下当前 adapter 状态`
2. `/verify`

## 10. 对话行为示例

### 10.1 Capability Overview

用户：

```text
你能帮我做什么
```

主 agent：

```text
我现在主要能帮你做四类事情：

1. 连接和诊断工具：例如 /connect、/doctor、/verify
2. 做规划和代码审查：例如 /plan、/review、/review verify
3. 发起受治理执行：例如 /run、/workflow
4. 直接对话解释：包括解释命令区别、给示例、回答仓库问题

当前你可以直接让我解释能力，也可以让我先执行低风险只读动作；像 /connect、/run 这类会改状态或跨度更大的动作，仍会先给你 preview。
```

### 10.2 Command Detail

用户：

```text
review 是干嘛的，给个例子
```

主 agent：

```text
`review` 适合做只读代码审查，重点是找 bug、风险和缺失测试。

什么时候用：
- 你想让我快速看当前改动
- 你想让我针对某个文件或 CR 做审查

你可以这样说：
- 帮我 review 当前改动
- 帮我 review 这个 CR 报告

显式命令也可以：
- /review

默认情况下，如果范围明确，`review` 可以直接执行；如果范围不清、成本偏高，系统会先给 preview。
```

### 10.3 从解释转执行

用户：

```text
那帮我 review 当前改动
```

系统：

1. 不再继续解释
2. 直接桥接到 `skill.review.code`

## 11. Presenter 与 Shared Session 语义

纯 capability explanation 属于 `answer` 路径，而不是 `command_handoff_preview`。

因此建议分成两类正式 outcome：

1. 纯 capability explanation turn
   - 仍落在 `responseMode=answer`
   - shared session payload 必须显式增加可选 metadata：
     - `capabilityAnswerKind=SessionMainCapabilityAnswerKind`
     - `referencedCapabilityIds[]`
     - `suggestedActions[]`
   - CLI transcript 可继续把它渲染成 markdown answer
   - 如有 `suggestedActions`，presenter 可以在 transcript 或 follow-up affordance 中展示，但不得自动执行
2. 同轮 explain -> execute split-intent turn
   - 若升级为 `direct_execute`，正式 outcome 应复用既有 governed skill/direct-execute path
   - 若升级为 `preview_confirm`，正式 outcome 必须复用既有 `command_handoff_preview`
   - explanation 片段只作为 assistant message / preview intro 的内容，不新增 answer-only pending state

补充说明：

1. `SessionMainCapabilityAnswerKind` 应与 `SessionMainCapabilityAnswerMode` 共用同一套 enum-like 常量管理。
2. 如果实现上最终证明 `answerKind` 与 `answerMode` 可以合并，就应直接合并为单一字段，避免 presenter 和 runtime 维护两套近义枚举。
3. `bridgeCandidate` 若被 runtime 接受，只能存在于内部 dispatcher seam；一旦进入 shared session truth，就必须投影成既有 `answer`、`direct_execute` 或 `command_handoff_preview` 三类正式 outcome 之一。

这意味着正式 contract 还要同步补到至少三个地方：

1. `SessionMainSupervisorTurnOutcome`
   - 增加 `capabilityAnswerKind?`
   - 增加 `referencedCapabilityIds?`
   - 增加 `suggestedActions?`
2. `TURN_COMPLETED` shared session payload
   - 允许把上述字段稳定写回 orchestration session event
3. CLI / desktop transcript consumer
   - 允许把 `suggestedActions` 渲染成 follow-up affordance
   - 但不得把它们当成自动执行指令

建议最小补充结构：

```ts
interface SessionMainCapabilitySuggestedAction {
  label: string;
  utterance: string;
  executionPath: SessionMainExecutionPath;
}
```

## 12. 分阶段实施建议

### 12.1 Phase A

先交付：

1. runtime-neutral command capability catalog
2. capability overview / detail classifier
3. overview/detail answer generation
4. `help`、`connect`、`doctor`、`verify`、`review` 的首批 capability cards

### 12.2 Phase B

再交付：

1. comparison / examples intent
2. availability-aware explanation
3. `review` 与 `review verify`、`plan` 与 `run` 等差异说明
4. explainer -> skill bridge 的连续对话样例

### 12.3 Phase C

最后再看：

1. richer multilingual examples
2. 基于最近对话上下文的 follow-up carry-over
3. 动态工具目录刷新
   - 例如在 connect/apply/verify 后自动刷新 capability availability

## 13. 风险与约束

1. 如果 explainer route 排序过晚，detail question 仍会被 skill 误吞。
2. 如果 catalog 不是单一事实来源，CLI help 与主 agent 解释会快速漂移。
3. 如果 explainer 直接依赖 app-layer help builder，会破坏 `runtime.orchestration` 的分层边界。
4. 如果 explainer 过度 verbose，用户会感觉像在读文档，而不是在对话。

因此本方案坚持：

1. explainer route 先于 skill route
2. help/skill/availability 共用 capability descriptor
3. runtime 只依赖 runtime-neutral catalog
4. 解释优先短而分层，再按追问展开

## 14. 推荐后续任务

建议把后续实现拆成三块：

1. `session.main` capability catalog extraction and single-source help cutover
   - 解决 help appendix / slash registry / skill policy 的事实统一
2. `session.main` capability explainer routing and answer generation
   - 解决 overview/detail/examples/comparison 四类解释
3. capability availability projection and explainer-to-skill bridge
   - 解决当前环境感知与“从解释到执行”的连续体验

## 15. Source Anchors

### 15.1 Local

1. `packages/core-orchestration-service/src/local-orchestration-service-session-main-agent-dispatcher.ts`
2. `packages/core-orchestration-service/src/local-orchestration-service-session-main-skill-registry.ts`
3. `apps/cli/src/runtime/interactive-shell/session-slash-command-registry.ts`
4. `apps/cli/src/main.ts`
5. `.repo-ai-governor/draft/session-main-conversational-chat-and-skill-intent-handoff-technical-solution.md`
6. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/contracts/cli-session-shell-contract.md`
7. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-orchestration/adrs/session-main-supervisor-and-role-subagent-collaboration.md`

### 15.2 External

1. [Model Context Protocol Tools Specification](https://modelcontextprotocol.io/specification/2025-11-25/server/tools)
2. [Anthropic Tool Use Documentation](https://docs.anthropic.com/ru/docs/agents-and-tools/tool-use/implement-tool-use)
3. [OpenAI Actions Production Notes](https://developers.openai.com/api/docs/actions/production)
