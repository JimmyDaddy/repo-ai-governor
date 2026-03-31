# Repo AI Governor `session.main` 对话式闲聊与 Skill 意图接管技术方案（Draft）

- Status: draft
- Date: 2026-03-31
- Scope: service-owned `session.main` / conversational small talk / free-form repo chat / natural-language skill intent routing / governed command and command-bundle handoff
- Target Modules:
  - `runtime.orchestration`
  - `runtime.cli-interactive-shell`
  - `runtime.adapter-routing`
  - `entry.cli`
- Related:
  - `.repo-ai-governor/draft/session-main-agent-answer-and-command-handoff-technical-solution.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-orchestration/adrs/session-main-supervisor-and-role-subagent-collaboration.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/contracts/cli-session-shell-contract.md`
  - `packages/core-orchestration-service/src/local-orchestration-service-session-main-agent-dispatcher.ts`
  - `packages/core-orchestration-service/src/local-orchestration-service-session-runtime.ts`
  - `apps/cli/src/runtime/session-main-supervisor-runtime.ts`
  - `apps/cli/src/runtime/interactive-shell/session-shell-runner.ts`
  - `apps/cli/src/runtime/interactive-shell/session-shell-transcript-store.ts`
  - `apps/cli/src/runtime/interactive-shell/session-slash-command-registry.ts`

## 1. 背景与问题

`project-035` 已经把 `session.main` 推进到 `service-owned supervisor + role subagent` 方向，并完成了：

1. 普通文本进入 shared session turn pipeline。
2. `answer / follow_up_question / command_handoff_preview / role_collaboration` 的结构化 outcome。
3. single-role、serial、parallel collaboration 的前台 productization baseline。

但从真实可用性看，`session.main` 仍缺一个关键能力层：

1. 用户希望它能像一个真正的主 agent 一样先“聊得通”。
2. 用户希望它能从自然对话里识别操作意图，再把意图映射成受治理的 skill / 命令 / 命令组合。
3. 用户不希望每次都先切成显式 slash command 心智，再和主 agent 交互。

当前缺口主要体现在三个地方：

1. `follow_up` 仍偏向 heuristic 兜底，容易把正常聊天或短问题错判成“信息不足”。
2. `direct_answer` bootstrap 仍带有保守 guard，导致 `connect` 后的主 agent 不一定能自然闲聊。
3. 自然语言命中的 handoff preview 主要是“会展示 recap”，但不一定天然具备 `/confirm` 可执行的 pending command continuity。

这使得产品虽然“受治理”，但不像一个真正可用的前台 agent：

1. 可治理，但不够自然。
2. 有能力面，但不够人性化。
3. 有命令面，但自然语言到命令面的桥接还不完整。

## 2. 目标

本方案的目标是让 `session.main` 成为一个“能聊、能懂、能把操作意图转成受治理执行链”的前台 supervisor。

具体来说：

1. 支持闲聊与轻量社交对话：
   - 例如 `你好`、`hello`、`最近怎么样`、`今天天气如何` 这类输入，不应默认退化成 follow-up 拦截。
2. 支持 free-form repo chat：
   - 例如“这个仓库现在大概是什么状态”“帮我解释一下为什么刚才 connect 后不能对话”应进入真实 direct answer。
3. 支持 natural-language skill intent routing：
   - 例如“帮我连一下工具”“先做环境诊断”“帮我 review 一下”“把这个任务拆成 plan”应被识别成受治理 handoff path，再由 risk policy 决定 preview 还是 direct execute。
4. 支持 command-bundle / skill-chain 预留：
   - skill 不只等于单个命令，也可以对应一个有序命令组合，例如 `connect -> verify`、`review -> review-verify`。
5. 保持现有治理边界：
   - 自然语言入口不能绕过受治理 risk/policy gate。
   - 高风险、高歧义、有副作用，或高成本/高范围不确定的 skill 仍然走 `preview + confirm + execute`。
   - 低风险、高置信、只读且执行范围可控的 skill 可以直接执行，但必须继续写入 shared session truth 与 audit truth。
   - CLI / desktop 继续只消费 shared session truth。
   - 主 agent 不得在回答里假装命令已经执行。

## 3. 非目标

1. 不在第一阶段引入通用 LLM planner 来替代 deterministic intent guard。
2. 不让所有自由对话都自动触发命令执行；自然语言 skill 仍然必须经过受治理风险判定，而不是无限制直通执行。
3. 不在第一阶段把所有 command bundle 升级成任意 DAG；首轮只接受小规模、确定性的线性 skill chain。
4. 不在第一阶段重做 `run / workflow / review` 后台流程的正式编排契约。
5. 不要求首轮就让 role collaboration 与 skill chain 融合成统一 planner graph。

### 3.1 非目标说明

#### 3.1.1 为什么第一阶段不引入通用 LLM planner

原因是当前窗口要先解决的是“主 agent 聊得通”和“自然语言能稳定落到受治理 handoff”，而不是做一个开放式前台规划器。

如果第一阶段直接引入通用 LLM planner，风险主要有：

1. 路由不稳定。
   - 同一句自然语言在不同上下文里可能被规划成不同动作，导致 handoff 语义不可预测。
2. 治理边界被稀释。
   - 原本 deterministic 的 `preview + confirm` 容易被“模型自己决定下一步”侵蚀。
3. 调试成本陡增。
   - 一旦识别错了，很难判断问题到底在 classification、planner prompt、还是命令投影层。
4. resume 一致性变差。
   - planner 的中间推理如果没有结构化固化到 shared session truth，恢复时会出现语义漂移。

因此 Phase A 先采用 deterministic intent guard + skill registry：

1. 好处是可预测、可审计、容易回归测试。
2. 代价是表达力不如开放式 planner，但这个代价在首阶段是可接受的。

#### 3.1.2 为什么自然语言 skill 先定义成“受治理判定 + 按风险确认”

这里的核心判断是：自然语言入口比显式 slash command 多了一层“意图解释”。

所以在 Phase A：

1. 任何“主 agent 从自然语言里推断出一个 skill/命令”的场景，都先进入风险判定。
2. 只有高风险、高歧义、带副作用、高成本、高范围不确定，或多步 bundle 的场景，才要求额外 `/confirm`。
3. 低风险、只读、命中稳定且范围可控的 skill 可以直接执行。

具体表现是：

1. 用户说“先检查一下环境”。
2. resolver 稳定命中 `/doctor`，且该 skill 被 registry 标为 low-risk read-only。
3. 主 agent 可以直接回复“Understood, running `/doctor`...”，随后进入执行结果呈现。

另一类表现是：

1. 用户说“帮我连一下工具”。
2. resolver 命中 `/connect`，但该 skill 会改变 session/adapters 状态。
3. 主 agent 先给出 preview。
4. shell 进入 pending preview。
5. 用户输入 `/confirm` 后才真正执行。

这和显式 slash command 不完全一样：

1. 用户直接输入 `/doctor`，仍然可以保持今天的 direct bridge 行为。
2. 用户输入“先帮我体检一下环境”，如果 resolver 命中高置信 low-risk skill，可以直接执行。
3. 用户输入“帮我 review 当前改动”，如果范围已经明确且只读分析 profile 可控，也可以直接执行。
4. 用户输入“帮我连一下工具”，因为这是会改 session 状态的 skill，所以仍然先 preview，再 `/confirm`。

这样做的好处是：

1. 低风险简单命令不会因为多一道 `/confirm` 而显得笨重。
2. 高风险或高歧义命令仍然保留用户可见的治理闸口。
3. 用户既知道“系统理解成了什么动作”，也不会在每次 handoff 时都被额外打断。
4. 类似 `help`、`doctor`、轻量 `review` 这种探索型动作可以更像真正可对话主 agent。

如果不做风险分层，直接后果就是：

1. 若一律 `/confirm`，低风险 handoff 会显得笨重，用户会更倾向退回 slash command 心智。
2. 若一律自动执行，普通对话被误判成动作时，会发生意外执行。
3. 用户会失去对前台主 agent 的信任，因为它要么“像聊天但太卡顿”，要么“像聊天但会偷偷开跑命令”。

#### 3.1.3 为什么第一阶段不把 command bundle 升级成任意 DAG

这里的区别是：

1. 线性 skill chain：
   - 固定顺序，形如 `A -> B -> C`
   - 例如 `connect -> verify`
2. 任意 DAG：
   - 允许分支、汇合、条件跳转、动态增删节点
   - 例如“如果 doctor 失败则走 recover，否则跳过 connect，最后再 decide verify/review”

第一阶段不做任意 DAG，原因是：

1. 前台 shell 当前只天然支持“一个 preview -> 一个 pending handoff -> 一个确定的执行计划”。
2. DAG 会立刻引入条件分支、节点状态持久化和中间审批恢复语义。
3. 一旦引入 DAG，foreground skill registry 就会和后台 workflow/runtime graph 的边界混淆。

如果过早做 DAG，风险是：

1. 前台 skill registry 变成第二套 workflow engine。
2. `run / workflow / review` 后台正式流程的职责边界被冲掉。
3. presenter、resume、audit 都要同时理解图结构，复杂度会明显失控。

因此 Phase A/Phase B 只接受小规模线性 chain：

1. 好处是 preview 好展示、`/confirm` 好理解、resume 好恢复。
2. 等这条链稳定后，再决定是否值得升级到更复杂的图语义。

#### 3.1.4 为什么首轮不要求 role collaboration 与 skill chain 融合成统一 planner graph

这是另一个“先分层、再统一”的取舍。

当前更合理的职责分工是：

1. skill chain
   - 负责把自然语言动作意图映射成受治理命令计划
2. role collaboration
   - 负责多角色分析、审阅、验证和协作回答

如果现在就把两者融合成一个统一 planner graph，直接影响是：

1. 一次用户输入同时混入“要不要执行命令”和“要不要先找几个角色商量”两类决策。
2. 共享 session truth 需要额外持久化更多 planner 中间态。
3. CLI transcript presenter 也要同时解释 role fan-out 与 command chain graph。

因此首轮先不做融合：

1. 不做的好处是边界清晰，容易先把“会聊”和“会提议 skill”做稳。
2. 做了的潜在好处是更强大，但前提是我们先把单独的 skill handoff 和 role collaboration 都稳定下来。

## 4. 现状判断

### 4.1 `follow_up` 需要从兜底黑名单思维改成显式白名单思维

当前实现更接近：

1. 少数命令 preview 明确匹配。
2. 其余短输入走 follow-up。
3. 再剩余的才尝试进入 direct answer。

这种结构的问题是：

1. 会把正常聊天错判成“信息不足”。
2. 会让用户感觉主 agent 不是在对话，而是在等一个命令触发词。

因此 follow-up 更合理的语义应该是：

1. 只拦截明确的 continuation utterance。
2. 例如 `继续`、`然后呢`、`next?`、`what next`。
3. 普通问候、普通问题、普通闲聊一律优先进入 direct answer。

### 4.2 `direct_answer` 不应继续只等价于 “no-tool local model”

如果主 agent 想像一个真正的人类入口，就不能要求用户先具备：

1. 一套无工具调用能力的本地 surface。
2. 再单独为 chat 场景切换 surface。

更合理的方向是：

1. `session.main.answer` route 可以运行在 tool-capable surface 上。
2. 但当前 turn 的 governor instruction 必须明确禁止直接执行命令或伪造执行结果。
3. 真正的动作性意图仍然要在 supervisor 层先被拦进 skill handoff path，再由 risk gate 决定 preview 或 direct execute。

换句话说：

1. tool-capable 不等于这一轮必须调用工具。
2. 自然聊天与 repo 问答需要的是“能回答”，不是“能无门槛执行”。

### 4.3 自然语言 skill handoff 必须同时支持 preview-confirm 与 direct-execute continuity

如果自然语言只产出一条 transcript recap，而治理后的下一步真实执行状态接不上：

1. 需要确认的命令，用户仍然要重新输入 slash command。
2. 可以直跑的低风险命令，也无法把“我已经代你执行了什么”固化到 shared truth。
3. 那主 agent 的“懂你想做什么”就只剩展示价值，没有执行价值。

因此需要同时支持两类 continuity：

1. `preview -> pending command truth -> /confirm`。
2. `direct execute -> executed command truth -> result presentation`。
3. `/clear` 和 `resume` 后仍能恢复对应的 preview 或 executed state。

## 5. 目标架构

### 5.1 前台 supervisor turn pipeline

每个 `session.main` turn 在 supervisor 内显式走六段：

1. `conversation classification`
   - 区分 greeting / social chat / repo question / follow-up continuation / skill intent / explicit role collaboration。
2. `follow-up whitelist gate`
   - 只对白名单 continuation utterance 产出 `follow_up_question`。
3. `skill-intent resolver`
   - 将操作性自然语言映射成 `skill_id + execution plan`。
4. `risk-and-confirmation policy gate`
   - 根据 skill risk tier、side effect class、execution cost class、scope resolution 和 resolver confidence 决定 `direct_execute` 还是 `preview_confirm`。
5. `governed handoff projector`
   - 把 skill plan 投影成 `command_handoff_preview` 或 governed direct execution truth，并写回 shared session turn payload。
6. `direct-answer executor`
   - 对未命中 skill 的输入走真实回答。

### 5.2 Skill registry 层

引入一个 lightweight foreground `skill registry`，但它不是后台 workflow registry 的替代品。

它只负责：

1. 维护自然语言可触发的前台 skill。
2. 定义每个 skill 对应的 risk tier、confirmation policy、preview 语义与命令计划。
3. 产出 deterministic handoff plan。

它不负责：

1. 替代 `run / workflow` 的正式流程图。
2. 接管后台 policy / audit / artifact persistence。

### 5.3 Skill plan 结构

建议引入一个 service-owned foreground plan 结构：

```ts
interface SessionMainSkillExecutionPlan {
  skillId: string;
  skillVersion: string;
  intentSource: 'natural_language';
  riskTier: 'low' | 'elevated' | 'high';
  sideEffectClass: 'read_only' | 'session_state' | 'workspace_mutation' | 'external_effect';
  executionCostClass: 'light' | 'moderate' | 'heavy';
  scopeResolution: 'explicit' | 'defaulted' | 'ambiguous';
  confirmationMode: 'none' | 'required';
  minConfidenceForDirectExecute?: number;
  slashQueries: string[];
  bridgeArgvBatches: string[][];
  previewSummary: string;
  executionIntent: string;
}
```

约束：

1. `slashQueries.length` 与 `bridgeArgvBatches.length` 一一对应。
2. Phase 1 允许 `length=1`。
3. Phase 2 开始允许小规模 `length<=3` 的线性 skill chain。
4. 只有 `riskTier=low`、`executionCostClass!=heavy`、`scopeResolution!=ambiguous` 且 `resolverConfidence >= minConfidenceForDirectExecute` 的 skill 才允许 `confirmationMode='none'`。
5. `elevated/high`、低置信命中、高成本、范围不明、或多步 bundle 默认 `confirmationMode='required'`。

## 6. Skill 语义设计

### 6.1 Phase 1 单命令 skill

首轮建议覆盖：

1. `skill.connect.adapters`
   - 典型输入：`帮我连一下工具`、`connect the tools`
   - policy：`preview + confirm`
   - reason：修改 connected adapters / session state
2. `skill.doctor.environment`
   - 典型输入：`先做环境诊断`、`check the environment`
   - policy：`direct execute eligible`
   - reason：只读探测、无 workspace mutation
3. `skill.verify.adapters`
   - 典型输入：`验证一下 adapter 状态`
   - policy：`direct execute eligible`
   - reason：只读校验、适合作为低风险 handoff
4. `skill.help.capabilities`
   - 典型输入：`help`、`看看你能做什么`、`show available commands`
   - policy：`direct execute eligible`
   - reason：零副作用、能力发现入口，应尽量降低 handoff 摩擦
5. `skill.plan.task`
   - 典型输入：`帮我拆一下任务`、`make a plan`
   - policy：`preview + confirm`
   - reason：通常伴随较长执行链和额外 token/role 消耗
6. `skill.review.code`
   - 典型输入：`帮我做 code review`
   - policy：`direct execute eligible when scope resolved`
   - reason：只读分析本身不要求确认；只有在范围不明、成本偏高或升级到 heavier profile 时才转 preview + confirm
7. `skill.review.verify`
   - 典型输入：`复核一下 CR`、`review verify this report`
   - policy：`preview + confirm`
   - reason：面向正式 CR 生命周期，仍保留人审闸口
8. `skill.run.task`
   - 典型输入：`开始做这个任务`、`implement this task`
   - policy：`preview + confirm`
   - reason：可能触发真实修改与长链执行，默认视为高风险

补充说明：

1. `review.code` 不再被视为“天然必须 `/confirm`”。
2. 当 review scope 明确，例如“review 当前 worktree”或“review 这个 CR 文件”，且执行 profile 是只读/单轮分析时，可以直接执行。
3. 当 review scope 不清晰，或 policy 需要升级到多角色/长耗时 profile 时，再转入 preview + confirm。
4. `help.capabilities` 更适合 direct execute，甚至在部分 surface 下可以直接退化成 direct answer，而不需要显式 preview。

### 6.2 Phase 2 命令组合 skill

第二阶段再扩到 command bundle：

1. `skill.onboard.adapters`
   - plan：`/connect -> /verify`
2. `skill.managed.review.chain`
   - plan：`/review -> /review verify`
3. `skill.adapter.recoverability`
   - plan：`/doctor -> /connect -> /verify`

限制：

1. 只允许固定顺序。
2. 不允许模型在运行时自由增删节点。
3. Phase B 的 batch 默认继续显式 confirmation，除非后续单独引入 low-risk bundle auto-execute policy。

补充说明：

1. 这里的 confirmation 默认是“对整个 bundle 做一次顶层 `/confirm`”。
2. `/confirm` 之后，shell 按顺序执行整条 plan。
3. 如果某个子命令自己还带更细粒度的人审闸口，那仍由该命令自己的治理链继续处理。

首轮不默认放开 bundle auto-execute，原因是：

1. 即使单步里含有低风险命令，组合后也会带来更长的执行跨度与恢复复杂度。
2. 先把单命令的风险分层跑稳，再单独讨论低风险 bundle 直跑，边界更清楚。

## 7. 对话分类语义

### 7.1 Social / small talk

这类输入应默认走 direct answer：

1. `你好`
2. `hello`
3. `最近怎么样`
4. `今天天气如何`
5. `你能做什么`

原因不是它们都属于“仓库问题”，而是：

1. 人类默认把主 agent 当对话入口。
2. 如果连这一步都进不了 direct answer，产品会显得不自然。

### 7.2 Repo question

这类输入也应默认走 direct answer：

1. `这个仓库当前在哪个 sprint`
2. `为什么 connect 后我还不能和主 agent 对话`
3. `解释一下刚才 review preview 的路由原因`

### 7.3 Follow-up continuation

只有白名单 continuation utterance 才走 follow-up：

1. `继续`
2. `然后呢`
3. `next?`
4. `what next`

### 7.4 Skill intent

这类输入不要求用户显式写 slash command，但 supervisor 需要把它们收束成 deterministic plan：

1. `把工具接上`
2. `先帮我体检一下环境`
3. `帮我 review 这个改动`
4. `帮我把任务拆成 plan`
5. `打开帮助`

## 8. Shared Session 与 Presenter 语义

### 8.1 `TURN_COMPLETED` 需要保留 skill 元数据与执行判定

建议在 `command_handoff_preview` 的 shared turn payload 中额外保留：

1. `skillId`
2. `skillVersion`
3. `riskTier`
4. `confirmationMode`
5. `slashQueries[]`
6. `bridgeArgvBatches[][]`
7. `handoffCommandPreview`
8. `executionIntent`

这样：

1. transcript presenter 既能渲染 preview recap，也能渲染 auto-executed skill recap。
2. shell runner 可以把需要确认的 turn 恢复成真正的 pending handoff。
3. resume 也不需要再从纯文本行里反推命令计划或确认模式。

### 8.2 复用现有 audit skill 字段

当前 shared session / audit 侧已经存在 `skillId`、`skillVersion` 预留位，因此本方案推荐：

1. 不新造第二套 skill 审计字段。
2. 直接把 foreground skill handoff 的 `skillId/skillVersion` 写入现有审计链。

这样后续可以回答：

1. 用户是通过哪一个自然语言 skill 触发了这个命令。
2. 这个 skill 的版本是否发生过变更。

## 9. CLI 交互目标

目标体验应该是：

### 9.1 闲聊

用户：

```text
你好
```

主 agent：

```text
你好，我可以陪你聊，也可以帮你把仓库里的操作意图转换成受治理命令。
```

### 9.2 低风险自然语言 skill

用户：

```text
先帮我查一下环境
```

主 agent：

```text
Understood. Running /doctor because this maps to a low-risk environment-check skill.
```

同时：

1. shell 不需要额外 `/confirm`。
2. 执行态与结果仍写回 shared session truth / audit truth。

确认语义补充：

1. 只有 low-risk、只读、命中稳定的 skill 才允许跳过 `/confirm`。
2. 这不是放弃治理，而是把确认闸口移动到 risk policy，而不是一刀切拦所有 handoff。
3. 用户如果本来就想无歧义地立即执行，仍然可以直接输入显式 slash command。

### 9.3 低风险帮助 skill

用户：

```text
help
```

主 agent：

```text
Opening help because this is a zero-side-effect capability-discovery skill.
```

同时：

1. shell 可以直接执行 `/help`，不需要额外 `/confirm`。
2. 若当前 surface 已能直接回答“你能做什么”，也可以直接走 answer surface，而不强制投影成 command preview。

### 9.4 中低风险 review skill

用户：

```text
帮我 review 当前改动
```

主 agent：

```text
Understood. Running /review for the current worktree because the scope is explicit and the review profile is read-only.
```

同时：

1. shell 不需要额外 `/confirm`。
2. 若后端 policy 发现 scope 不清晰，或需要升级到 heavier multi-role profile，则回退为 preview + confirm。

### 9.5 高风险自然语言 skill

用户：

```text
帮我连一下工具
```

主 agent：

```text
Suggested next step: /connect
Preview: repo-ai-governor connect --preset multi-tool-default --output pretty
Intent: connect.adapters.bootstrap
```

同时：

1. shell 进入 pending preview。
2. 用户可以直接 `/confirm`。

确认语义补充：

1. `connect` 这类会改 session/adapters 状态的 skill 仍然保留 preview + confirm。
2. 这样用户能先看到系统把自然语言理解成了什么动作，再决定是否放行。

### 9.6 命令组合 skill

用户：

```text
把 adapter onboarding 全走一遍
```

主 agent：

```text
Suggested next step: adapter onboarding bundle
Preview:
1. repo-ai-governor connect --preset multi-tool-default --output pretty
2. repo-ai-governor verify --adapters --output pretty
```

同时：

1. shell 恢复为一条 governed command bundle。
2. `/confirm` 后按顺序执行。

确认语义补充：

1. 默认不是“每一步都单独手敲一次 `/confirm`”。
2. 而是先对整个 bundle preview 做一次总确认。
3. 总确认后，runner 依次执行 `step-1 -> step-2 -> step-3`。
4. 如果中途某一步失败，则 bundle 在该步停止，并把失败态写回 transcript / audit / resume truth。

## 10. 实施分阶段建议

### 10.1 Phase A

先交付：

1. follow-up 白名单化。
2. greeting / repo question 进入真实 direct answer。
3. 单命令 skill intent router + risk tier policy gate。
4. low-risk direct execute 与 high-risk preview continuity 并存。

### 10.2 Phase B

再交付：

1. `review verify` 这种已存在组合命令的自然语言 skill。
2. `connect -> verify` 这类小型 command bundle。
3. `review.code` 的 scope-aware direct-execute / preview fallback。
4. `resume` 后 pending handoff / direct-execute state 恢复的一致性。

### 10.3 Phase C

最后再看：

1. richer skill confidence / disambiguation。
2. low-risk bundle auto-execute policy 是否值得引入。
3. review profile 的自动分级是否需要更细粒度成本模型。
4. foreground skill 与 role collaboration 的联合调度。
5. 远端 role / A2A bridge 与 skill registry 的衔接。

## 11. 风险与约束

1. 如果 skill intent 过度宽松，会把普通问题误判成操作意图。
2. 如果 direct answer 仍然被 no-tool guard 卡死，闲聊体验无法成立。
3. 如果所有自然语言 skill 都强制 `/confirm`，低风险 handoff 会显著变笨重。
4. 如果 `review` 的范围解析过宽，可能把本应 preview 的重型 review 错误直跑。
5. 如果 pending handoff 或 direct-execute state 不能跨 `/clear` 与 `resume` 恢复，skill 提议仍然只是 UI 展示，不是执行能力。
6. 如果 command bundle 允许模型临场拼接，会突破受治理边界。

因此本方案坚持：

1. follow-up 用白名单。
2. skill 用 deterministic registry。
3. confirmation 由 risk tier + confidence 决定，而不是一刀切。
4. `review` 一类只读但成本敏感的 skill 还要额外受 scope/cost gate 约束。
5. combo 只允许固定线性链。
6. 高风险 execute 继续只走 preview + confirm。

## 12. 推荐后续任务

建议把后续实现拆成三块：

1. `session.main` conversational routing hardening
   - 解决 follow-up 白名单化与 direct-answer chatability
2. foreground skill-intent registry and risk-tiered governed handoff
   - 解决自然语言 skill 的 direct-execute / preview-confirm 分层，以及 `help`/`review` 的轻量直跑策略
3. command-bundle preview and resume parity
   - 解决 `connect -> verify` 这类组合 skill 的 presenter / resume / audit 一致性
