# Transport Selection Authority And Strict Routing Follow-Up Technical Solution (Draft)

- Status: draft
- Date: 2026-04-09
- Owner: AI-Agent
- Scope: `runtime.agent-projection / transport selection semantics / connect-verify UX truthfulness / support-matrix and playbook alignment`
- Related Inputs:
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/module-overview.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/remote-api-transport-and-provider-binding-seam.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-onboarding-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-projection-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/adapter-health-and-route-probe-contract.md`
  - `packages/config/src/types/interfaces/governor.interface.ts`
  - `packages/config/src/schema-validator.ts`
  - `apps/cli/src/runtime/adapter-routing-runtime.ts`
  - `apps/cli/src/runtime/agent-onboarding-runtime.ts`
  - `docs/local-adoption-playbook.md`
  - `docs/support-matrix.md`

## 1. 目的

当前仓库已经引入了 `baseline / cli_exec / remote_api` 三种 transport truth，并且
`codex` 与 `claude-code` 的 `remote_api` 路径已经具备真实 probe/invoke 能力。

但在产品语义和公开文档层面，仍存在一个明显落差：

1. 代码层已经允许用户为一个 tool 指定具体 transport。
2. 文档与 support truth 仍明显偏向“`cli_exec` 是主路径，`remote_api` 更像 optional / rehearsal”。
3. onboarding payload 仍未把 transport truth 收敛到单一 canonical machine surface，`remote_api` 也仍主要以 candidate 语义暴露。

这会造成用户认知偏差，尤其是在 `cli_exec` 稳定性、安装依赖、登录态与 host 约束不理想的场景下：

`用户明明想显式指定 remote_api，但产品语义仍像是在说“你先默认走 cli_exec，api 只是补充”。`

本 follow-up draft 的目标不是再发明自动 transport failover，而是把以下语义正式写清楚：

1. 用户显式指定什么 transport，就按什么 transport 执行。
2. 同一 surface 内不做 `remote_api <-> cli_exec` 自动切换。
3. `codex` / `claude-code` 的 `remote_api` 应先在 runtime/contract truth 中被定义为与 `cli_exec` 并列的一等用户可选模式；public support wording 是否同步升级，取决于单独的 evidence gate。
4. `github-copilot` 继续诚实暴露当前边界：本 surface 仍以 `cli_exec` 为正式路径，不伪装出并不存在的 `remote_api` 等价物。

## 2. 当前事实

### 2.1 代码层已经接近目标语义

当前实现里，transport 解析已经具备较强的“显式选择优先”语义：

1. `AdapterToolConfig` 只有一个 `transport` 字段，而不是一个 transport 候选池。
2. 若配置里显式写了 `transport`，routing runtime 会直接按该 transport 实例化 adapter。
3. 若未显式写 `transport`，但配置了 `remoteApi`，runtime 会把该 tool 解析为 `remote_api`。
4. 若两者都未写，`codex` / `claude-code` / `github-copilot` 才会按 surface 默认值落到 `cli_exec`。

这意味着：

`当前代码并没有实现“同一 surface 内的自动 transport 切换”；它真正缺的是一套更清晰的产品语义、UX 暴露方式和文档真值。`

### 2.2 当前仍存在的语义模糊

尽管运行时已基本按上面的规则工作，但仍有 4 个问题：

1. `connect` 没有清晰的“用户显式选择 transport”入口，更多依赖现有 config 或手工编辑。
2. onboarding payload 当前把 truth 分散在 `enabled_tools` 与 `tool_transport_matrix` 两个 surface 上，且仍使用 `remote_api_candidate` 命名，容易让 consumer 误读为“候选补充面”。
3. playbook 和 support matrix 仍将 `cli_exec` 表述为默认主线，而 `remote_api` 更像附属验证路径。
4. 当 `remote_api` 不可用时，系统会给出 `switch_to_cli_exec` 这类 next action，但当前文档没有把它明确限定为“人工显式选择”，容易被误解成 runtime 应自动做这件事。

## 3. 问题定义

本次要解决的问题不是“如何更智能地选 transport”，而是“如何更诚实地表达用户选择权”。

具体来说：

1. Governor 需要支持多个 transport。
2. 但 transport 是策略输入，不是 runtime 自主优化目标。
3. 用户一旦显式选择了某个 transport，Governor 应把它当成执行约束，而不是建议值。

因此，本方案拒绝引入以下语义：

1. 同一 surface 内根据 health check 自动从 `remote_api` 切到 `cli_exec`。
2. 同一 surface 内根据成本、延迟或稳定性自动重排 transport 优先级。
3. 在用户未明确同意的情况下，把失败的 `remote_api` 运行重写为成功的 `cli_exec` 运行。

## 4. 非目标

本方案不试图解决：

1. 跨 surface 的路由 fallback 总体策略。
2. role-level `primarySurface / fallbackSurfaces` 建模重做。
3. `github-copilot` 的 key-based remote inference 新 surface 设计。
4. provider 级自动切流、自动重试到其他 transport 或动态成本调度。

若后续需要“用户指定 surface 后也完全禁止切到其他 surface”，那是另一份更高层的 strict-routing 提案，不应与本次“transport 选择权”问题混为一谈。

本文里的 `strict routing` 一律特指 `strict transport routing`：

`同一 surface 内，用户一旦显式选择 transport，runtime 不得静默改写为同 surface 的其他 transport。`

## 5. 决策

### 5.1 核心决策

1. `transport` 是用户意图字段，不是 runtime 优化提示。
2. 当 tool row 已显式声明 `transport` 时，该值视为 authoritative selection。
3. runtime、verify、projection、presenter 与 docs 不得把这个显式选择降格为“候选 transport”。
4. 同一 surface 内禁止隐式 transport failover。
5. 如果用户选择的 transport 不可用，应 fail-closed，并输出结构化原因与下一步动作。
6. `switch_to_cli_exec`、`switch_surface_to_github-models` 等只能作为显式 `next_action`，不得作为 runtime 自动行为。

### 5.2 Runtime / Contract 级支持边界

第一阶段在 runtime / contract truth 上按以下边界暴露：

1. `codex`
   - `cli_exec`: supported
   - `remote_api`: supported at runtime/contract level
2. `claude-code`
   - `cli_exec`: supported
   - `remote_api`: supported at runtime/contract level
3. `github-copilot`
   - `cli_exec`: supported
   - `remote_api`: unsupported for this surface
4. `local-model`
   - 继续保持 fallback-only local baseline，不参与本次“远端 transport 并列化”语义升级

这里的 `supported` 只表示：

`runtime / contract 可以诚实表达该 transport 选择，并在不可用时 fail-closed。`

它不自动等价于：

`adopter-facing docs 已经可以把该 transport 宣布为正式公开支持路径。`

### 5.3 与现有 role fallback 的关系

本方案只禁止“同一 surface 内自动换 transport”。

它不直接改变 role-level `fallbackSurfaces` 语义。也就是说：

1. `codex(remote_api)` 不应在失败后自动变成 `codex(cli_exec)`。
2. 但如果某个 role 本来就配置了 `primary=codex`、`fallback=claude-code`，是否允许路由切到 `claude-code`，仍由现有 role fallback 策略决定。

这两个层次必须分开表达，避免把“transport 选择权”误写成“彻底关闭所有 fallback”。

### 5.4 与现有 active technical solutions 的关系

1. 本方案不替代 `technical-solution.api-key-remote-adapter-invocation`；它假设 `remote_api` seam 已存在，只补“用户选择权、truth slot 收口与 strict transport routing”这一层语义。
2. 本方案补齐 `technical-solution.multi-ai-tools-onboarding-role-agent-projection` 在 onboarding output shape 上遗留的 transport-aware truth 收口问题，明确该真值最终要落在单一 canonical machine surface。
3. promotion 时若需要同步调整 contract/ADR/module-overview，应该把它视为对现有 active solution 的 follow-up convergence，而不是重新发明平行 transport ADR。

## 6. 契约增量

### 6.1 Config 语义

保持现有兼容路径，但补充更明确的 authoring 语义：

1. 对已支持多 transport 的 surface，connect 生成 candidate config 时应始终显式 materialize `transport`。
2. 手工配置仍允许历史兼容写法：
   - 仅配置 `remoteApi`，未写 `transport`
3. 但 runtime / diagnostics 应把这种情况标记为：
   - `transport_selection_source = inferred_from_remote_api`
4. 当用户显式写出 `transport` 时，应标记为：
   - `transport_selection_source = config_explicit`
5. 当既无 `transport` 也无 `remoteApi`，由 surface 默认值决定时，应标记为：
   - `transport_selection_source = surface_default`

这几个字段优先作为 projection / diagnostics additive fields 暴露，而不是急于引入 breaking config schema。

### 6.2 Onboarding Contract

本 draft 明确选择：

`enabled_tools[]` 作为 onboarding canonical machine surface；`tool_transport_matrix` 只保留为兼容期 presenter / consumer bridge。

也就是说，这个 follow-up 不是再引入第三套 transport truth，而是要把现有 runtime 中散落在 `tool_transport_matrix` 的 truth，收敛回 formal contract 已经指向的 `enabled_tools[]` row shape。

建议对 `agent-onboarding-contract` 做 additive enhancement：

1. `enabled_tools[]` 从 string list 收敛为 structured rows，至少稳定带出：
   - `tool_id`
   - `enabled`
   - `transport_kind`
   - `provider_kind`
   - `vendor_binding_kind`
   - `model`
   - `credential_mode`
   - `endpoint_source`
   - `transport_selection_source`
   - `transport_selection_locked`
   - `configured_remote_api`
2. `transport_selection_locked=true` 的判断规则：
   - 当前 row 显式声明了 `transport`
3. `configured_remote_api` 是 canonical nested field；若当前配置存在 `remoteApi`，就用它表达“当前配置下的正式 remote_api truth”，而不是“候选 transport”
4. `tool_transport_matrix` 可在兼容期短期保留，但必须满足：
   - 只能由 `enabled_tools[]` 机械派生
   - 不得继续承载 `enabled_tools[]` 没有的额外 canonical truth
   - 现有 `remote_api_candidate` 仅保留为 `configured_remote_api` 的 compatibility alias
5. promotion 前必须定版：
   - `tool_transport_matrix.remote_api_candidate` 的 consumer migration owner
   - alias 的兼容窗口 / removal gate
   - release note 或 migration note 的回链位置

核心语义应变为：

`这不是“候选 transport”，而是当前配置下的正式 transport truth。`

### 6.3 Route Probe / Agent Projection Contract

建议补充一条更强的 required constraint：

1. 当某个 surface 的 tool row 已显式声明 `transport_kind` 时：
   - probe truth 必须只针对该 transport 生成
   - availability 失败不得被同 surface 其他 transport 的成功结果覆盖
2. `selected_surface` 仍保留为用户语义主键。
3. 但 route / replay / diagnostics 必须保留：
   - `selected_transport`
   - `selected_provider_kind`
   - `selected_vendor_binding_kind`
4. 如果后续 presenter 想建议“改用 cli_exec”，那只能通过 next actions 呈现，不得篡改这次执行的 canonical truth。

## 7. CLI 与文档设计

### 7.1 Connect UX

建议为 `connect` 增加显式 transport 选择入口。

推荐形态：

```bash
pnpm exec repo-ai-governor connect \
  --tools codex,claude-code \
  --tool-transport codex=remote_api \
  --tool-transport claude-code=cli_exec
```

设计约束：

1. `connect` 只生成 candidate config，不隐式 apply。
2. 若用户为某个 surface 指定了不支持的 transport，直接 fail。
3. 若用户为 `remote_api` surface 指定了 transport 但缺少 `remoteApi` 必需字段，直接 fail。
4. `doctor` 不负责自动补全 provider login 或 secret 写入，只输出下一步动作。

### 7.2 Support Matrix / Playbook Truth

本 draft 明确区分两层 truth：

1. runtime / contract support truth
2. adopter-facing public support wording

前者由本 technical solution 决定；后者必须经过单独的 evidence gate，不能因为 contract 已支持就自动升级。

因此，文档面不应立即改成“`remote_api` 已正式公开支持”，而应先补齐以下 gate：

1. clean-room 或 release verification 证明 `codex` / `claude-code` 的 `remote_api` 路径可在不依赖同 surface `cli_exec` fallback 的前提下完成 end-to-end probe / invoke
2. `verify --adapters` 或等价验证报告能够稳定投影：
   - 用户选择的是 `remote_api`
   - 不可用时为 fail-closed + explicit next actions
   - 没有被重写成 `cli_exec` 成功结果
3. 维护者在同一 change window 内产出可回放 evidence artifact / report，并把 support wording 升级和该证据绑在一起

在 evidence gate 通过前：

1. `docs/local-adoption-playbook*` 仍可把 `remote_api` 写成 environment-gated rehearsal / validation path
2. `docs/support-matrix*` 不应把 `codex` / `claude-code` 的 `remote_api` 宣布为正式公开支持 transport
3. `github-copilot` 继续只暴露 `cli_exec`
4. `local-model` 继续保持 fallback-only 定位，不误导成远端 transport 平替

在 evidence gate 通过后，后续 delivery change 才可以把 `codex` / `claude-code` 升级为：

1. `cli_exec` 与 `remote_api` 都是正式用户可选 transport
2. support matrix 从“按 surface 粗粒度描述”升级为“surface 下带 transport truth”的写法

更重要的是，support matrix 应从“按 surface 粗粒度描述”升级为“surface 下带 transport truth”的写法，否则用户还是看不出自己到底能选什么。

## 8. 最小实现切片

### Slice A: Truthfulness And Contract Alignment

1. 调整 onboarding / diagnostics payload 的 transport truth 字段。
2. 补 transport selection source / locked 语义。
3. 增加测试，防止同 surface transport failover 被未来改回去。

### Slice B: Connect Explicit Selection UX

1. 为 `connect` 增加 per-tool transport flags。
2. 让 candidate config 始终 materialize user-selected transport。
3. 对 unsupported transport 组合直接 fail-closed。

### Slice C: Docs And Support Matrix Refresh

1. 先产出 clean-room / release evidence，证明 `remote_api` 在 `codex` / `claude-code` 上满足 public support wording 升级门槛
2. 仅在 gate 通过后，更新 `docs/local-adoption-playbook*`
3. 仅在 gate 通过后，更新 `docs/support-matrix*`
4. 在同一 change window 中把 support wording 升级与 evidence artifact 回链绑定起来

## 9. 风险与开放问题

1. 是否要把 `remoteApi` 已配置但 `transport` 未显式写出的历史 config，视为 warning，而不只是 silent inference。
2. 是否要在后续单独提出“strict-surface mode”，让用户进一步禁止 role-level surface fallback。
3. `remote_api_candidate` 的兼容别名保留多久，是否需要专门 deprecation window。
4. support matrix 若改成 transport-aware 展示，是否需要同步 README 的 adopter-facing 简版入口。
5. `configured_remote_api` / `remote_api_candidate` 兼容桥何时可以从 `tool_transport_matrix` 移除，是否需要专门的 consumer migration tracker。

## 10. 推荐结论

推荐把本 draft 作为 `runtime.agent-projection` 的 follow-up technical solution 处理，定位为：

`对已存在的 remote_api seam 做“用户选择权与产品语义校正”的第二阶段收口。`

推荐 lifecycle / promotion 归属：

1. `solution_id`
   - `technical-solution.transport-selection-authority-and-strict-routing`
2. `target_module_ids`
   - `runtime.agent-projection`
3. 推荐影响面
   - `runtime.agent-projection` contracts / ADR follow-up
   - `connect / doctor / verify` UX truth
   - support matrix / local adoption playbook
4. 推荐 impact classification
   - `exported_contract_change`

如果后续进入 promotion，最需要继续盯住的确认点有两件事：

1. “禁止同 surface 自动 transport 切换”是否已经在 formal contract / runtime producer 文档里同步收口。
2. “role-level surface fallback 保持现状”与“strict transport routing”是否仍被清楚区分，没有在 public wording 中重新混写。
