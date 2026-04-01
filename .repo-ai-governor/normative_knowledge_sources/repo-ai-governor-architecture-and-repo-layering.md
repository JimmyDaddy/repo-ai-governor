# Repo AI Governor 可扩展架构图与仓库分层结构

- Status: active
- Date: 2026-04-02
- Role: implementation blueprint
- Basis:
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`

## 1. 设计目标

1. 给出“可扩展且可落地”的系统架构图。
2. 给出支持长期演进的仓库分层结构。
3. 给出模块依赖方向约束，避免后续架构腐化。
4. 给出从当前仓库到目标结构的渐进迁移路径。
5. 以 Monorepo 作为默认工程组织方式，支撑核心引擎与多适配器并行演进。

## 2. 顶层架构图（Layered + Extensible）

```mermaid
flowchart TB
  subgraph Entry[CLI & API Entry Layer]
    CLI[CLI Commands]
    Onboarding[Onboarding Commands]
    InteractiveShell[Interactive CLI Shell]
    Desktop[Desktop Client]
    IDE[IDE/Agent Surfaces]
    CI[CI/CD Invoker]
    Orchestrator[Local Orchestration Service]
  end

  subgraph Config[Config & Schema Layer]
    Loader[Config Loader]
    Schema[Schema Validator]
    Resolver[Profile Resolver]
    WorkspaceResolver[Workspace Resolver]
  end

  subgraph Memory[Memory & Context Layer]
    MemoryManager[Memory Manager]
    SessionManager[Shared Session Manager]
    StoreAdapter[Memory Store Adapter]
    NormSources[Normative Knowledge Sources]
    OpSources[Operational State Sources]
    Providers[Memory Store Providers]
    WorkspaceRoot[Workspace Root]
    RepoLocalWorkspace[<repo>/.repo-ai-governor]
    ToolManagedWorkspace[<workspace>/.repo-ai-governor]
  end

  subgraph Core[Governance Core Layer]
    Compiler[Process Compiler]
    Runtime[Process Runtime (Facade)]
    GraphRuntime[LangGraph Runtime Adapter]
    RiskEval[Change Risk Evaluator]
    Policy[Policy Gate Engine]
    RoleRegistry[Role Registry]
  end

  subgraph Notify[Notification & Escalation Layer]
    NotifyDispatcher[Notification Dispatcher]
    Escalation[Escalation Router]
    NotifyProviders[Notification Providers]
  end

  subgraph Agent[Agent Runtime & Adapter Layer]
    Coord[Agent Coordinator]
    AgentProjection[Agent Projection Service]
    AdapterSDK[Adapter SDK]
    Adapters[Adapters Registry]
  end

  subgraph Ext[Standards & Slot Layer]
    Slots[Slot Engine]
    StandardsPack[Standards Pack]
    PackRegistry[Pack Registry]
    RuleRenderer[Rule Renderer]
    AgentsProjector[AGENTS Projector]
    PolicyRuleCompiler[Policy Rule Compiler]
    SpecSyncGuard[Spec Sync Guard]
  end

  subgraph Observe[Audit & Reporting Layer]
    Audit[Audit Recorder]
    Report[Report Builder]
    Replay[Replay/Explain]
    CliPresenter[CLI Output Presenter]
  end

  subgraph Delivery[Delivery & Operations Layer]
    Plan[plan.md]
    Checklist[tasks/checklist.md]
    CSV[tasks/tasks.csv]
    ReviewChain["review -> review-verify"]
    LedgerBackfill[ledger backfill]
    DeliveryRehearsal["commit / PR draft rehearsal"]
  end

  CLI --> Orchestrator
  CLI --> Onboarding
  CLI --> InteractiveShell
  Onboarding --> Orchestrator
  InteractiveShell --> Orchestrator
  Desktop --> Orchestrator
  IDE --> Orchestrator
  CI --> Orchestrator
  Orchestrator --> Loader
  Loader --> Schema --> Resolver --> WorkspaceResolver
  Resolver --> MemoryManager
  Resolver --> RoleRegistry
  WorkspaceResolver --> MemoryManager
  WorkspaceResolver --> StoreAdapter
  MemoryManager --> StoreAdapter
  MemoryManager --> SessionManager
  RoleRegistry --> Compiler
  RoleRegistry --> Coord
  RoleRegistry --> AgentProjection
  SessionManager --> Compiler
  SessionManager --> AgentProjection
  MemoryManager --> Compiler
  StoreAdapter --> NormSources
  StoreAdapter --> OpSources
  StoreAdapter --> Providers
  StoreAdapter --> WorkspaceRoot
  WorkspaceRoot --> RepoLocalWorkspace
  WorkspaceRoot --> ToolManagedWorkspace
  Compiler --> Runtime --> GraphRuntime
  Runtime --> RiskEval --> Policy
  Policy --> NotifyDispatcher --> Escalation --> NotifyProviders
  NotifyDispatcher --> Audit
  Policy --> Coord
  Coord --> AdapterSDK --> Adapters
  AgentProjection --> Report
  Runtime --> Slots
  Runtime --> StandardsPack
  StandardsPack --> PackRegistry --> RuleRenderer --> AgentsProjector
  PackRegistry --> PolicyRuleCompiler --> RiskEval
  CLI --> SpecSyncGuard
  CI --> SpecSyncGuard
  SpecSyncGuard --> Audit
  Runtime --> MemoryManager
  Runtime --> Audit --> Report --> Replay --> CliPresenter
  CliPresenter --> CLI
  CliPresenter --> CI
  Runtime --> Plan
  Runtime --> Checklist
  Runtime --> CSV
  Runtime --> ReviewChain
  Runtime --> LedgerBackfill
  Runtime --> DeliveryRehearsal
```

## 3. 执行时序图（含 HITL 升级与通知分发）

```mermaid
sequenceDiagram
  participant U as User/CI
  participant G as Governor Runtime
  participant S as Shared Session
  participant M as Memory Manager
  participant W as Workspace Resolver
  participant K as Memory Store Adapter
  participant T as Memory Store Provider
  participant R as Change Risk Evaluator
  participant P as Policy Engine
  participant N as Notification Dispatcher
  participant C as Notification Channel
  participant A as Agent Adapter
  participant H as Human Reviewer
  participant L as Audit Ledger

  U->>G: run request
  G->>W: resolve workspace mode/root
  W-->>G: workspace_id + workspace_root
  G->>S: open/reuse execution_session_id
  G->>M: load normative knowledge + operational state
  M->>K: resolve provider and read snapshot
  K->>T: read/query
  T-->>K: data payload
  K-->>M: unified memory snapshot
  G->>G: compile process (Sequential/Parallel/Loop/Condition)
  loop each stage
    G->>S: read session snapshot
    G->>R: normalize change facts
    R-->>G: risk facts
    G->>P: evaluate policy with risk facts
    P-->>G: allow/confirm/block/escalate
    alt allow
      G->>A: invoke stage
      alt stage success
        A-->>G: stage output
      else stage timeout
        A--x G: timeout
        G->>P: classify timeout + retry/degrade decision
        P-->>G: retry/degrade/escalate/block
      else cancelled
        G->>A: cancel()
        A-->>G: cancelled ack
      end
    else confirm/escalate
      G->>N: dispatch HITL notification
      N->>C: send (primary channel)
      alt primary failed
        N->>C: retry/fallback channel
      end
      C-->>N: delivery status
      N-->>G: notification result
      G->>H: request approval
      H-->>G: approve/reject/revise
      G->>L: append HITL decision receipt
      alt approve
        G->>S: resume stage with approved constraints
      else revise
        G->>S: persist revised constraints
        G->>G: reroute execute/review subchain
      else reject
        G-->>U: stop with decision reason
      end
    else block
      G-->>U: stop with reason
    end
    opt stage interrupted (timeout/cancelled/policy_blocked)
      G->>S: persist interruption snapshot
      G->>L: append interruption event
      G-->>U: interrupted summary
    end
    G->>M: append memory delta
    M->>K: write/snapshot/archive
    K->>T: persist delta
    G->>S: update session context
    G->>L: append event + artifacts
    opt review subchain enabled
      G->>A: invoke review / review-verify subchain
      A-->>G: review result + verify result
      G->>L: append review chain + ledger backfill
    end
  end
  opt delivery rehearsal enabled
    G->>P: evaluate delivery policy
    P-->>G: allow/confirm/block/escalate
    G->>A: invoke commit / PR draft rehearsal
    A-->>G: delivery result
    G->>L: append delivery rehearsal event
  end
  G->>S: finalize session snapshot
  G-->>U: summary + report + ledger links
```

说明：错误分类、重试/熔断、取消/超时、并发聚合与 Stage 9 自动主链收口契约，以 `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md` 的 `§5.3` 到 `§5.6` 为准。

## 3.1 Stage 9 Follow-Up 架构补充

1. `run` 主链的目标形态是任务驱动 DAG，并可内联 `review -> review-verify -> ledger backfill` 受控子链。
2. `confirm/escalate` 返回的人工决策不是一次性终态，而是可回灌的恢复事件；runtime 必须支持 `resume/terminate/degrade`。
3. `commit/PR draft` rehearsal 属于 Delivery & Operations Layer 的受控扩展，必须与 audit/replay 保持同链回放。

## 3.2 LangGraph Runtime 与本地编排服务补充（Decision 2026-03-25）

1. `Process Runtime` 的默认演进方向是 `LangGraph Runtime Adapter`，但它通过 `Process Runtime (Facade)` 接入，不直接替代 `DSL/IR/policy/audit/ledger` 领域契约。
2. `CLI` 与未来 `Desktop Client` 都通过 `Local Orchestration Service` 调用运行时；`Desktop Client` 只负责状态展示、日志流与 HITL 交互，不直接持有 runtime 主状态。
3. `LangGraph state/checkpointer` 只作为执行恢复介质，不作为新的 canonical source；最终状态仍需回写到 workspace 下的 `current-context/tasks/review/artifacts/audit`。
4. 运行时 side effects 必须通过外部领域服务节点完成，特别是 `review chain`、`ledger backfill`、`notification dispatch` 与 `delivery rehearsal`。

## 4. 关键扩展点

1. `Adapter SDK`
   - 新增 AI 工具只需实现统一接口：`probe/invokeStage/streamEvents/requestConfirmation`。
2. `Role Registry`
   - 支持默认角色与用户自定义角色并存，统一做角色定义、约束和版本管理。
3. `Memory Manager`
   - 统一管理“规范知识源 + 执行状态源”的读写与上下文合成策略。
4. `Shared Session Manager`
   - 多 Agent 共享同一个执行 session，支持快照、增量回写与回放。
5. `Workspace Resolver`
   - 按配置解析 `tool_managed/repo_local` 模式，输出 `workspace_id/workspace_root`，并提供迁移切换入口。
6. `Memory Store Adapter`
   - 通过统一 Provider 契约（`read/write/query/snapshot/archive`）屏蔽存储后端差异。
7. `Memory Store Providers`
   - 支持文件+CSV、本地数据库、线上数据库等多后端可插拔实现。
8. `Change Risk Evaluator`
   - 统一把 diff、文件类别、命令类别、权限请求等事实归一化为结构化风险结果，避免在 adapter/command 中分叉定义高风险语义。
9. `Policy Engine`
   - 人工闸口策略通过规则表配置，不把审批逻辑硬编码在命令里。
10. `Notification Dispatcher`
   - 在 HITL 触发/升级场景统一分发通知，支持重试、退避与失败回退，并输出通知回执到审计事件，作为 runtime `resume/terminate/degrade` 的输入之一。
11. `Notification Providers`
   - 支持 `email/webhook/chat-im/issue-system` 等渠道可插拔接入。
12. `Slot Engine`
   - 新增项目规则通过声明式 slot 注入，不改核心流程引擎。
13. `Standards Pack`
   - 官方/团队/仓库规则分层覆盖，内部至少区分 `pack registry`、`rule renderer`、`agents projector`、`policy rule compiler` 四类职责边界。
14. `Artifact Registry & Dependency Resolver`
   - 关键产物生成后统一登记，任务执行前按依赖声明解析并注入上下文。
   - 生命周期采用 `active/frozen/deprecated/archived/retired`，主注册表与归档注册表分层存储，避免执行上下文膨胀。
15. `CLI Output Presenter`
   - 统一输出 `pretty/plain/json` 模式渲染，负责终端美化、非交互降级和机器可读稳定性。
16. `Spec Sync Guard`
   - 对“需求->方案->架构”三层文档及简版 PRD 执行同步校验，输出可阻断的机器可读结果与本地可读建议。
17. `Controlled Delivery Rehearsal`
   - 在策略允许下执行 `commit` / `PR draft` 等受控交付演练，并与 audit/replay、人工接管边界保持同链可回放。
18. `Process Runtime Backend Adapter`
   - 将 `DSL/IR` 映射到具体 graph runtime；当前默认目标是 `LangGraph`，但对上层暴露稳定的 runtime facade。
19. `Local Orchestration Service`
   - 为 `CLI` 与未来桌面端提供统一执行入口，负责 runtime backend、checkpoint、streaming 状态与 HITL resume 接口编排。
20. `Interactive CLI Shell`
   - 负责 `runtime.cli-interactive-shell` 这类 human-first shell 的模式解析、状态机、stderr 渲染与 classic fallback，但不拥有业务真相或 runtime 主状态。
21. `Agent Onboarding & Projection`
   - 由 `runtime.agent-projection` 正式承接，把 `connect / doctor / verify` 的 onboarding 结果与 `AgentDescriptor` 投影统一收敛到同一条 runtime seam，避免 CLI、report、diagnostics 各自维护一套工具绑定语义。

## 5. 目标仓库分层结构（Monorepo）

```text
ai-governor/
  apps/
    cli/
      src/
      test/
  integrations/
    ci/
    desktop/
    ide/
  packages/
    core-process/
      src/
      test/
    core-policy/
      src/
      test/
    core-role-registry/
      src/
      test/
    core-change-risk/
      src/
      test/
    core-runtime/
      src/
      test/
    core-runtime-langgraph/
      src/
      test/
    core-orchestration-service/
      src/
      test/
    orchestration-service-client/
      src/
      test/
    core-memory/
      src/
      test/
    core-session/
      src/
      test/
    artifact-registry/
      src/
      test/
    memory-store-adapter/
      src/
      test/
    memory-providers/
      fs-csv/
        src/
        test/
      sqlite/
        src/
        test/
      postgres/
        src/
        test/
    notification-dispatcher/
      src/
      test/
    config/
      src/
      test/
    standards/
      src/
        pack-registry/
        rule-renderer/
        agents-projector/
        policy-rule-compiler/
        spec-sync-guard/
      test/
    slots/
      src/
      test/
    adapter-sdk/
      src/
      test/
    adapters/
      codex/
        src/
        test/
      github-copilot/
        src/
        test/
      claude-code/
        src/
        test/
    reporting/
      src/
        report-builder/
        replay-explain/
        cli-output-presenter/
      test/
    shared/
      src/
        i18n/
        types/
        utils/
      test/
  scripts/
    governance/
    release/
    ci/
    examples/
  .repo-ai-governor/docs/
  examples/
  test/
    contract/
    integration/
    e2e/
  .repo-ai-governor/   # optional; enabled when workspace.mode=repo_local
  AGENTS.md
  .repo-ai-governor/normative_knowledge_sources/governance/code_standards.md
```

工具托管 workspace（默认，不在目标仓库内）：

```text
~/.repo-ai-governor/workspaces/<repo_fingerprint>/
  .repo-ai-governor/
    governor.yaml
    context/current-context.md
    context/artifact-registry/
      # machine-readable canonical registry may be sqlite-backed
      artifacts.csv
      archive/artifacts.archive.csv
    normative_knowledge_sources/
```

说明：`context/artifact-registry/*.csv` 可以继续作为 rendered compatibility/human-readable view 暴露；machine-readable canonical registry 可由 sqlite 等等价 durable backend 承担，但不得再维护第二份手工 truth。

`context/current-context.md` 除 primary/active stream 元数据外，还可在极少数已完成 stream 的 CR 收口场景下声明单值 `Worktree Review Target`；该 override 只负责默认 `review/` 路由，不改变 active task ledger 的 project/sprint 归属。

## 5.1 Monorepo 版本与发布策略（Baseline）

1. 版本策略
   - `core-*`、`adapter-sdk`、`shared` 采用 lockstep 版本策略，确保核心契约同步演进。
   - `adapters/*`、`memory-providers/*`、`notification-providers/*` 采用 independent 版本策略，按能力独立发布。
2. 契约兼容规则
   - `adapter-sdk`、`memory-store-adapter`、`notification-dispatcher` 任一主版本升级时，必须触发对应 provider/adapter 的契约回归测试。
3. 发布编排建议
   - 使用 Changesets（或等价工具）维护跨包变更日志与发布计划。
   - 支持 `canary -> rc -> ga` 渠道，先验证核心包再放开 provider/adapters 发布。
4. 依赖锁定建议
   - 核心包之间使用 workspace 协议固定版本对齐；provider/adapters 对核心契约使用显式兼容区间声明。

## 6. 模块依赖方向约束

1. `apps/cli` -> 允许依赖 `packages/*`，不允许反向被核心依赖。
2. `core-role-registry` -> 负责默认/自定义角色定义与校验，可依赖 `config/shared`。
3. `core-change-risk` -> 负责统一风险事实归一化，可依赖 `config/shared/standards`，不依赖具体 `adapters/*`。
4. `core-policy` -> 负责策略规则匹配与 `allow/confirm/block/escalate` 决策，可依赖 `core-change-risk/config/shared/standards`，不依赖具体 `adapters/*` 与 `core-runtime`。
5. `memory-store-adapter` -> 仅定义存储契约与 provider 装配，不依赖 `core-runtime`。
6. `memory-providers/*` -> 仅依赖 `memory-store-adapter/shared`，不得依赖 `apps/cli` 与 `adapters/*`。
7. `notification-dispatcher` -> 负责 HITL 通知策略执行与回退，可依赖 `core-policy/core-audit/config/shared`。
8. `notification-providers/*` -> 仅依赖 `notification-dispatcher/shared`，不得依赖 `core-runtime` 与 `adapters/*`。
9. `core-memory` -> 可依赖 `config/shared/memory-store-adapter`，不依赖具体 provider 实现。
10. `core-session` -> 可依赖 `core-memory/shared`，不依赖具体 `adapters/*`。
11. `artifact-registry` -> 可依赖 `shared/config/core-audit`，不得依赖 `apps/cli` 与具体 `adapters/*`。
12. `core-runtime` -> 可依赖 `core-process/core-change-risk/core-policy/core-role-registry/core-memory/core-session/artifact-registry/notification-dispatcher/config/adapter-sdk/standards/slots/core-audit`。
13. `adapters/*` -> 仅依赖 `adapter-sdk/shared`，不依赖 `apps/cli`。
14. `standards/slots` -> 不依赖具体 adapter 实现，保持工具无关。
15. `reporting` -> 只读核心执行结果，不反向控制 runtime；其内 `cli-output-presenter` 仅负责展示，不承担流程决策。
16. `shared` -> 不依赖业务域模块，集中承接共享类型、通用工具与 i18n 基础能力。
17. `spec-sync-guard` -> 仅依赖文档元数据与 git 变更检测，不依赖 runtime/adapter/provider 实现。
18. `core-runtime-langgraph` -> 可依赖 `core-process/core-change-risk/core-policy/core-memory/core-session/artifact-registry/notification-dispatcher/shared`，不得依赖 `apps/cli` 或未来桌面 UI。
19. `apps/desktop` 或等价桌面端入口 -> 只依赖 service client/reporting/shared，不直接依赖 `core-runtime*` 与具体 adapter/provider 实现。
20. `technical-solutions/*` -> 模块方案文档必须通过 `technical-solution-module-registry.yaml` 声明 direct dependency，默认只展开 `module-overview + imported contracts`，禁止以 transitive full-doc recursion 代替边界设计。

## 6.1 依赖方向自动化执行备忘（Pending Integration）

1. 计划新增依赖边界检查脚本：`scripts/governance/check-package-dependency-boundary.js`。
2. 计划输出两类结果：
   - 机器可读（JSON）用于 CI 阻断。
   - 人类可读（Markdown/terminal）用于本地定位违规路径。
3. 计划接线命令（当前未启用）：
   - `node ./scripts/governance/check-package-dependency-boundary.js`
4. 生效策略建议：
   - 初期以 warning 模式运行并建立白名单；
   - 稳定后切换为 blocking gate，纳入 `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md -> Verification Commands`。

## 6.2 Package Public API Surface 约束

1. 可见性分层
   - `public`: `adapter-sdk`, `memory-store-adapter`, `notification-dispatcher`, `orchestration-service-client`, `reporting`, `shared`。
   - `internal`: `core-*`, `slots`, `standards`, `core-session`, `core-memory`, `core-runtime`, `core-runtime-langgraph`, `core-orchestration-service` 等实现域包。
2. 导出约束
   - `public` 包必须通过 `package.json -> exports` 显式声明稳定入口，不允许深层路径隐式导出。
   - `internal` 包默认不对外暴露 programmatic API，只允许 workspace 内部依赖。
3. 目录建议
   - `public` 包建议使用 `src/public/` 与 `src/internal/` 分层，入口统一经 `src/index.ts`。
4. 版本兼容要求
   - `public` 包发生 breaking change 时必须提升主版本并附迁移说明；
   - `internal` 包可随 workspace 版本联动，但不得绕过依赖方向约束。

## 6.3 Shared 层 i18n 处理约束

1. `packages/shared/src/i18n/` 负责统一 locale 枚举、语言资源装载与文本格式化入口，不允许各业务域重复实现。
2. Adapter/Runtime/Reporting 的文案构建应优先复用 `packages/shared` 暴露的 i18n API，避免在各模块内散落硬编码 locale 映射。
3. 领域模块（`core-*`、`adapters/*`、`notification-*`）只声明业务语义键与上下文，不直接持有跨域翻译策略实现。
4. i18n 相关调整应与 `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`、`README.md`、`README.zh-CN.md` 同步，确保规范与说明一致。
5. Locale 解析优先级统一为 `runtime flags -> governor.yaml.i18n -> default locale`，并按 `locale -> language -> fallback_locale` 执行回退链路。
6. 语言资源建议统一放置于 `packages/shared/src/i18n/locales/`，并维护 `zh-CN/en` 键集一致性（key parity）校验。
7. `reporting/cli-output-presenter` 的 `pretty/plain` 输出可本地化，但 `json` 输出的机器字段不得因 locale 变化而漂移。
8. `standards/rule-renderer` 与 `standards/agents-projector` 必须基于同一语义键资产按 locale 渲染，避免 human/ai/agents 多视图语义分叉。
9. 当前仓库 i18n runtime 选型固定为 `i18next`，并通过 `packages/shared/src/i18n/` 统一封装初始化、locale 解析与翻译函数入口。
10. 实施阶段采用“双阶段分工”：Stage 1 / Phase A 实现 i18n runtime 基线；Stage 6 / Phase D 接入 key parity 与 fallback 门禁。
11. 在新仓库起步阶段，i18n 引入采用 `fix-forward`，不额外维护双运行时回滚路径。

## 7. 从当前仓库的渐进迁移路径

1. Step 1（边界先行）
   - 在现有 `src/` 内按域建立子目录边界，补充 import lint 规则。
   - 接入三层文档同步门禁（`check-docs-triad-sync`）作为事实链路前置校验。
2. Step 2（核心抽离）
   - 先抽离 `core-process/core-change-risk/core-policy/core-role-registry/core-memory/core-session/notification-dispatcher/adapter-sdk/memory-store-adapter` 到 `packages/`。
3. Step 3（存储后端落地）
   - 先实现 `memory-providers/fs-csv`，并预留 `sqlite/postgres` provider 骨架。
   - 同步落地 `artifact-registry` 的文件/CSV 基线存储。
4. Step 4（通知后端落地）
   - 实现 `notification-providers/webhook` 基线，并按风险级别配置 `email/chat-im/issue-system` 回退渠道。
5. Step 5（适配器模块化）
   - 将现有 codex/copilot/claude 适配拆到 `packages/adapters/*`。
6. Step 6（入口瘦身）
   - `apps/cli` 只保留命令路由与参数编排，核心逻辑下沉 packages。
   - CLI 输出渲染统一由 `packages/reporting/src/cli-output-presenter/` 承担，避免命令层分散实现。
7. Step 7（契约测试）
   - 为 `adapter-sdk`、`memory-store-adapter`、`artifact-registry`、`notification-dispatcher`、`process DSL`、`risk evaluator`、`policy decisions`、`standards projection parity` 建立跨包契约测试。
   - 测试目录基线：`tests/contract/`（契约）、`tests/integration/`（跨包集成）、`tests/e2e/`（端到端链路）。
8. Step 8（Runtime Modernization）
   - 新增 `core-runtime-langgraph`（或等价 runtime backend adapter）并以 dual-runtime 方式接入 `apps/cli`。
   - 将运行时逐步收敛到 shared local orchestration service，为未来桌面端复用同一执行 API 做准备。

## 7.1 Priority-Phase-Migration 对照（同步总纲）

本表与 `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md` 的 `§11.1` 保持同步，作为架构迁移实施入口。

| PRD Priority | Delivery Focus | Technical Phases | Architecture Migration Steps |
|---|---|---|---|
| P0（已完成） | 可安装、可初始化、最小治理闭环 | Phase A（最小可用）+ Phase B（最小门禁） | Step 1（边界先行） |
| P1（进行中） | 多 Agent 编排、策略化 HITL、多工具适配 | Phase B + Phase C + Phase D + Phase E Follow-Up | Step 2 ~ Step 8 |
| P2（规划中） | 平台化能力、组织级可观测与治理强化 | Phase E + 平台扩展阶段 | Step 7 + 平台扩展步骤 |

## 8. 目录治理建议

1. 新增目录前先标注层级归属与依赖方向。
2. 新增模块必须在文档中登记“扩展点类型”（core/adapter/role/memory-store/notification/slot/standards/reporting）。
3. 每次迭代若触及架构边界，先更新本蓝图再改实现。
4. 技术方案模块文档统一收敛在 `.repo-ai-governor/normative_knowledge_sources/technical-solutions/`，并由 `technical-solution-module-registry.yaml` 维护 `summary_doc / contracts / depends_on_modules` 的单一事实源。

## 9. 与总纲关系

1. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`：定义全工具方针与原则。
2. 本文档：定义“如何落成目录与模块边界”的工程蓝图。
3. sprint 文档：记录阶段性交付，不替代本蓝图。
4. `technical-solutions/**`：承载 bounded context 级方案细节；总纲保持北极星角色，模块依赖由 registry 与 module graph gate 保证。
