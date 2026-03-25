# LangGraph 编排引擎引入技术方案（Draft）

- Status: draft
- Date: 2026-03-25
- Owner: AI-Agent
- Scope: process orchestration runtime / CLI + future desktop form factors
- Decision: adopt LangGraph as orchestration runtime direction (`CLI-first + shared local orchestration service`)
- Related Task: n/a

## 1. 目的

评估 `Repo AI Governor` 是否适合用 LangGraph 承接 Agent 流程编排，并给出一套对 CLI 与后续桌面端都成立的技术落地方案。

本文回答 4 个问题：

1. LangGraph 是否覆盖当前产品需要的编排能力。
2. 它应替换哪一层，不应替换哪一层。
3. 对 CLI 形态和未来桌面端形态，分别应如何接入。
4. 如果落地，合理的迁移顺序是什么。

## 2. 当前产品约束

当前产品对编排层的要求不是“简单 agent loop”，而是完整的治理执行面：

1. 运行时需要把 DSL 编译为可执行状态机（DAG）。
2. 运行时需要支持 `Sequential / Parallel / Loop / Condition` 四类节点。
3. 高风险变更必须先经过 `Change Risk Evaluator`，再进入 `Policy Gate Engine` 得到 `allow / confirm / block / escalate`。
4. `review -> review-verify -> ledger backfill` 需要作为受控子链推进。
5. `HITL` 需要支持可暂停、可恢复、可审计、可回放。
6. 执行状态不能只留在内存里，必须和 workspace 下的 `current-context / tasks / review / artifacts / audit` 一致回链。
7. 产品已明确存在两类执行表面：
   - 终端 CLI
   - 后续桌面端

因此，真正的问题不是“能不能把一个 agent 跑起来”，而是“是否能把 LangGraph 放进现有治理边界内，而不破坏现有 canonical sources”。

## 3. 结论与决策

本次决策是：采用 LangGraph，但只把它定位为“编排运行时内核”，不把它定位为“整个治理系统的替代品”。

更具体地说：

1. 适合让 LangGraph 承接：
   - DAG/状态图执行
   - 条件路由
   - review/HITL 子图
   - interrupt/resume
   - durable execution / checkpointing
   - per-node execution state
2. 不适合让 LangGraph 直接替代：
   - `current-context.md`
   - `tasks/checklist.md`
   - `tasks/tasks.csv`
   - review 生命周期文件
   - Artifact Registry
   - risk facts / policy / audit 的 canonical contract

确认采用后的实施边界是：

1. 保留现有自研 `DSL -> IR -> policy -> audit -> ledger` 领域模型。
2. 用 LangGraph 替换或封装当前 `Process Runtime` 执行内核。
3. 把 CLI 与桌面端都建立在同一套“本地编排服务”之上，而不是在两个入口里各自再做一套运行时。

## 4. 能力匹配评估

### 4.1 高匹配项

1. 图执行模型
   - 当前产品本来就要求 `Process Compiler -> DAG -> Process Runtime`。
   - LangGraph 的 `StateGraph` 与这一模型天然对齐。

2. `Sequential / Parallel / Condition`
   - 这些都属于 LangGraph 的自然能力范围。
   - 对当前产品来说，最直接的映射是 `IR node -> graph node`，`policy outcome -> conditional edge`。

3. `Loop` 与子链
   - `review -> review-verify -> ledger backfill` 可以建成子图。
   - 评审修复循环可以建成 bounded loop，但 `maxCycles`、`maxWallTimeSeconds` 仍应由本产品 DSL/IR 约束，不应把规则下放为“写图时口头约定”。

4. HITL
   - LangGraph 官方支持 `interrupt()` / `Command({ resume })`，适合承接 `confirm / escalate` 类人工决策回灌。
   - 这和本产品要求的 `resume / terminate / degrade` 很接近。

5. Durable execution
   - 官方支持 checkpointer + thread/thread_id 模式，适合长流程、暂停恢复、异常后重入。
   - 对本产品的 `execution_session_id` / replay / audit 是加分项。

6. 前端可视化潜力
   - LangGraph 官方已经给出前端 graph execution 的节点状态和流式内容呈现模式。
   - 这对未来桌面端的 pipeline 可视化是有价值的。

### 4.2 低匹配或需自研保留项

1. 策略引擎
   - LangGraph 不提供你的领域级 `risk facts -> policy outcome` 契约。
   - 这部分必须继续由 `core-change-risk` 与 `core-policy` 负责。

2. 台账与评审生命周期
   - LangGraph 不是 task ledger 系统。
   - `TK/checklist/tasks.csv/review_*` 仍然需要继续由本仓库治理模型维护。

3. 审计和产物注册
   - LangGraph 可以提供执行状态，但不会自动满足你现在的 `artifact_id / artifact_path / review_delta / verify` 等审计字段契约。
   - `Audit Recorder` 与 `Artifact Registry` 仍应保留为外部领域服务。

4. Canonical source 约束
   - 本产品已经明确 `workspace` 下的结构化文档/台账是 canonical source。
   - 不应把 LangGraph state 反过来升格成新的事实源，否则会引入第二套状态源。

### 4.3 主要工程风险

1. Replay 语义风险
   - LangGraph durable execution 依赖“节点重放 + side effect idempotency”。
   - 这要求文件写入、CLI 调用、通知分发、delivery rehearsal 等副作用都必须显式做幂等隔离。

2. 运行时锁定风险
   - 一旦业务逻辑直接写死在 LangGraph 节点里，迁移成本会明显上升。
   - 所以应该坚持“LangGraph 只跑 orchestration，业务能力仍在现有 package 服务层”。

3. 桌面端运行时不确定性
   - 如果未来桌面端不是 Electron，而是 Tauri 或其他没有 Node 主进程的形态，LangGraph.js 不能直接在 renderer 层承担完整本地治理执行。
   - 这要求从一开始就把它做成本地编排服务，而不是 UI 内嵌逻辑。

4. 依赖与打包复杂度
   - CLI 现在是 npm/Node 分发；引入 LangGraph.js 后，依赖树、构建与本地运行模型会更重。
   - 桌面端若走 sidecar/service，也会新增安装与生命周期管理成本。

### 4.4 除 LangGraph 外的可选方案

除了 LangGraph，至少还有 4 类可行路线：

1. 继续扩展当前自研 runtime
   - 保留 `core-process -> core-runtime -> core-policy -> core-session -> audit/ledger` 的现状，继续补齐图执行、暂停恢复、可视化与 durability。

2. Temporal
   - 本质是通用 durable workflow engine。
   - 优势在于 durability、replay、长任务、worker 模型成熟。
   - 问题在于它天然是“服务型工作流系统”，而本产品当前是本地优先、CLI 优先，未来桌面端也倾向本地 orchestration service。

3. Mastra
   - 本质是 TypeScript agent/workflow framework。
   - 它对多步骤工作流、状态管理、分支并行、human review、memory、observability 都有现成抽象。
   - 但它更接近“all-in-one agent application framework”，而本产品已经有较强的治理领域模型，不适合整体迁移过去。

4. OpenAI Agents SDK
   - 本质是轻量 agent orchestration SDK。
   - 它提供 agents、handoffs、guardrails、sessions 和 tracing，适合 manager/handoff 风格的多 agent 协作。
   - 但它不是 graph-first runtime，也不是本产品这种“明确 DAG + policy gate + ledger/audit 回链”场景的最佳基座。

### 4.5 方案对比表

| 方案 | 核心定位 | 图执行/DAG 适配度 | Durable/HITL | CLI 适配度 | 桌面端适配度 | 运维复杂度 | 与当前治理契约兼容性 | 结论 |
|---|---|---|---|---|---|---|---|---|
| 继续扩展当前自研 runtime | 领域定制治理运行时 | 高 | 中，需继续自建 | 高 | 中高，可按本地 service 演进 | 中 | 最高 | 最稳，但研发成本最高 |
| LangGraph | graph-first agent/workflow runtime | 高 | 高，官方有 checkpointer + interrupts | 高 | 高，适合作为本地 orchestration service 内核 | 中 | 高，只要不把 graph state 升格为 canonical source | 已选定方案 |
| Temporal | 通用 durable workflow engine | 中高 | 很高 | 中 | 中，适合 service 化但不适合轻量本地嵌入 | 高 | 中，需要较大适配层 | 适合服务端中心化版本，不是当前最优 |
| Mastra | TypeScript all-in-one agent/workflow framework | 中高 | 中高 | 中高 | 中高 | 中 | 中，容易和现有治理抽象重叠 | 可做参考，不建议主线采用 |
| OpenAI Agents SDK | 轻量 agent/handoff SDK | 中低 | 中，sessions/handoffs 可用 | 中高 | 中高，前端/语音能力较友好 | 低中 | 中低，对显式 DAG/ledger 约束较弱 | 不建议作为主编排内核 |

### 4.6 对比结论

如果只看“能否把 agent 跑起来”，上述方案都能用。

但如果按本产品真实约束来筛选：

1. 需要显式图执行，而不是单纯 handoff/manager loop。
2. 需要 `review -> review-verify -> ledger backfill` 这类受控子链。
3. 需要把 `policy / audit / ledger / artifact` 继续留在本产品自己掌控的事实源里。
4. 需要同时兼顾 CLI 与未来桌面端。

那么排序建议是：

1. `LangGraph`
2. `继续扩展当前自研 runtime`
3. `Temporal`
4. `Mastra`
5. `OpenAI Agents SDK`

原因：

1. LangGraph 在“图执行 + durability + HITL + TS/JS 可接入”这几个维度上最平衡。
2. 自研 runtime 虽然最契合现有契约，但后续你要自己继续补 durability、interrupt、图可视化与执行模型成熟度，长期成本最高。
3. Temporal 的工作流能力最强，但它更像“企业级 durable workflow 平台”，对当前本地优先产品形态偏重。
4. Mastra 和 OpenAI Agents SDK 更像 agent app framework / orchestration SDK，不是本产品这类治理运行时的最佳底座。

基于以上对比，本方案确认采用 `LangGraph`；下文第 `5` 到 `9` 节按这一决策展开，讨论的重点不再是“要不要采用”，而是“如何在不破坏现有治理契约的前提下采用”。

## 5. 推荐架构

### 5.1 核心原则

LangGraph 只替代“Process Runtime 执行内核”，不替代“治理事实源和领域服务”。

建议的职责边界：

1. 保留自研：
   - `packages/core-process`
   - `packages/core-policy`
   - `packages/core-change-risk`
   - `packages/core-session`
   - `packages/core-memory`
   - `packages/artifact-registry`
   - `packages/notification-dispatcher`
   - `packages/reporting`
2. 新增 LangGraph 适配层：
   - 建议新增 `packages/core-runtime-langgraph`
3. 入口保持分离：
   - `apps/cli`
   - future `apps/desktop` 或等价桌面入口

### 5.2 目标分层

建议把目标链路收敛成：

1. `DSL / task-driven inputs`
2. `Process Compiler -> IR`
3. `IR -> LangGraph graph adapter`
4. `LangGraph runtime/checkpointer`
5. `Policy / audit / ledger / artifact / notification adapters`
6. `CLI presenter / desktop presenter`

也就是说：

1. 你继续拥有流程定义权。
2. LangGraph 只负责把“这张图怎么跑”执行掉。
3. 领域服务以节点或 node helper 的方式被调用。

### 5.3 建议的数据映射

| 本产品概念 | LangGraph 映射 | 说明 |
|---|---|---|
| `execution_id` | run metadata | 保持本产品主键，不交给 LangGraph 生成 |
| `execution_session_id` | `thread_id` | 推荐一一映射 |
| active stream / workspace root | graph config + service context | 作为执行上下文输入 |
| task-driven IR node | graph node | 由自研 adapter 生成 |
| `allow/confirm/block/escalate` | conditional edge | 条件边仍由 `core-policy` 决策 |
| `review -> review-verify -> ledger backfill` | subgraph | 作为受控子链 |
| HITL receipt | `interrupt/resume` | 中断 payload 继续保留本产品字段 |
| audit event | external sink | 继续写入现有审计链 |
| task ledger backfill | external side effect | 不放进 graph state 里当 canonical source |

### 5.4 Checkpointer 建议

不建议直接把 LangGraph 默认内存 checkpointer 用作正式实现。

建议：

1. POC 阶段使用内存或文件 checkpointer。
2. 正式阶段对接本仓库已有 workspace 存储抽象。
3. 最可行的正式选择是：
   - 先做 `fs-csv` 或 file-backed checkpointer 适配
   - 再做 `sqlite-fs` checkpointer 适配

这样做的原因：

1. 现有产品已经有 workspace root 和 memory store abstraction。
2. `sqlite-fs` 对 CLI 和本地桌面端都更合理。
3. 后续如果桌面端需要更稳定的长生命周期状态，本地 SQLite 更可控。

## 6. CLI 形态建议

CLI 形态下，LangGraph 是可行的，而且是优先推荐的接入点。

### 6.1 推荐做法

1. 先在 CLI 内以本地库方式接入。
2. `repo-ai-governor run` 继续保留现有命令面。
3. 在 `run` 内部通过 feature flag 选择：
   - legacy runtime
   - langgraph runtime

### 6.2 为什么 CLI 适合先做

1. 现有主入口就是 Node/TypeScript。
2. workspace root、memory provider、audit/ledger 都已经在本地进程中。
3. CLI 对新增的本地 checkpointer 和 interrupt/resume 模型最容易验证。
4. 可以先在 `run -> review -> review-verify -> HITL` 这条主链上做 parity 测试。

### 6.3 CLI 侧注意事项

1. 不要把 LangGraph 的原始状态直接暴露成 CLI 对外契约。
2. CLI 对外仍应输出现有稳定的 `pretty/plain/json` schema。
3. 节点执行中的副作用必须做幂等包装：
   - review request artifact
   - verify artifact
   - ledger backfill
   - notification dispatch
   - delivery rehearsal

## 7. 桌面端形态建议

桌面端可以受益于 LangGraph，但前提是“图执行发生在本地后端”，不是在 renderer/webview 中直接跑。

### 7.1 推荐做法

桌面端建议拆成两层：

1. 本地 orchestration service
   - 运行 LangGraph
   - 访问 workspace
   - 执行 adapter / policy / audit / ledger side effects
2. 桌面 UI
   - 订阅执行状态
   - 展示节点进度、当前卡点、HITL 请求
   - 提交 resume/decision

### 7.2 为什么不建议在 UI 层直接执行

1. renderer 不是合适的权限边界。
2. 桌面端会涉及本地文件、凭据、通知、命令执行、副作用回放。
3. 未来桌面框架未定：
   - Electron：可以放 main process 或 worker
   - Tauri：更适合 sidecar/service，而不是前端直接跑 Node 运行时

因此，真正稳定的方案是：

1. CLI 也调用这套本地 orchestration service
2. 桌面端也调用同一套本地 orchestration service
3. UI 只是 presenter，不是 runtime owner

### 7.3 桌面端受益点

1. 节点级 pipeline 可视化更自然。
2. interrupt/resume 更适合做可交互的 HITL 面板。
3. per-node streaming / status / progress 可以直接映射为桌面组件。

### 7.4 桌面端额外要求

1. 需要本地长生命周期服务管理。
2. 需要 execution list / thread resume / stale run recovery。
3. 需要把现有 workspace/audit/review 产物与 UI 双向回链。
4. 若使用 `sqlite-fs`，需要统一桌面发行包中的 Node 版本与 `node:sqlite` 约束。

## 8. 不建议的方案

### 8.1 不建议直接全量重写当前运行时

原因：

1. 当前产品已有明确的治理事实链。
2. 直接替换会同时改 runtime、audit、ledger、CLI contract，风险过大。
3. 更合理的是先做 runtime adapter，再做逐步切换。

### 8.2 不建议让 LangGraph 成为新的 canonical source

原因：

1. 当前事实源已经很多，不能再引入一套平行状态源。
2. LangGraph state 应该视为执行态缓存/检查点，而不是产品级真相。

### 8.3 不建议先为桌面端单独接入 LangGraph

原因：

1. 当前正式入口仍是 CLI。
2. 若桌面端先行，会先把 runtime/service boundary 做散。
3. 正确顺序应该是：
   - 先 CLI 跑通 shared orchestration service
   - 再桌面端复用

## 9. 推荐落地路径

### 9.1 Phase 0：技术 Spike

目标：证明最小闭环可跑。

建议范围：

1. 选一条最小链路：`run -> review -> review-verify`
2. 用现有 task-driven IR 生成 LangGraph graph
3. 只接 1 条 policy route 和 1 个 interrupt
4. 用本地 checkpointer 跑通暂停恢复

验收：

1. 同一 `execution_session_id` 可恢复
2. review 子链可作为 subgraph 跑通
3. CLI 外部输出契约不变

### 9.2 Phase 1：双运行时并存

目标：不破坏现有 CLI 的前提下验证可用性。

做法：

1. 新增 `langgraph` runtime backend
2. feature flag 切换
3. 关键回归用例同时跑 legacy + langgraph

验收：

1. `run/review/review-verify/HITL` 结果一致
2. audit artifacts 与 ledger backfill 不漂移
3. `pnpm run check` 和黑盒链路通过

### 9.3 Phase 2：抽本地 orchestration service

目标：为桌面端铺路。

做法：

1. 将 LangGraph runtime 从 CLI 进程中抽成 shared local service
2. CLI 改为 service client
3. 预留桌面端 client API

验收：

1. CLI 与桌面端共用同一执行 API
2. interrupt/resume、thread recovery、streaming 状态一致

### 9.4 Phase 3：桌面端接入

目标：复用同一编排内核提供图可视化与 HITL UI。

做法：

1. 桌面端只做 presenter/client
2. 本地 service 持续作为 runtime owner
3. 节点状态、日志、产物链接、HITL 决策统一从 service 暴露

## 10. 最终决策

最终决策如下：

1. 采用 LangGraph，作为 `Process Runtime` 的默认演进方向与首选后端。
2. 不做“大重写”，而做“runtime adapter + dual-run migration”。
3. 从 CLI 开始验证，不从桌面端开始验证。
4. 及早把目标收敛成“本地 orchestration service”，因为这同时适配 CLI 和未来桌面端。
5. 所有 canonical governance artifacts 继续保留在现有 workspace 模型里，不转移到 LangGraph state。

一句话总结：

`Repo AI Governor` 适合“用 LangGraph 跑图”，不适合“变成 LangGraph 产品壳”。正确做法是让 LangGraph 成为编排执行内核，而治理契约、台账、审计和产品级状态仍由本产品自己掌握。

## 11. 参考

### 11.1 仓库内参考

1. `.repo-ai-governor/normative_knowledge_sources/product-requirements.md`
2. `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
3. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`
4. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md`
5. `.repo-ai-governor/context/current-context.md`

### 11.2 外部参考

1. [LangGraph Overview](https://docs.langchain.com/oss/python/langgraph/overview)
2. [LangGraph Durable Execution](https://docs.langchain.com/oss/javascript/langgraph/durable-execution)
3. [LangGraph Interrupts / HITL](https://docs.langchain.com/oss/javascript/langgraph/interrupts)
4. [LangGraph Frontend Graph Execution](https://docs.langchain.com/oss/javascript/langgraph/frontend/graph-execution)
5. [langchain-ai/langgraphjs](https://github.com/langchain-ai/langgraphjs)
6. [Temporal TypeScript SDK: Core application](https://docs.temporal.io/develop/typescript/core-application)
7. [Temporal overview](https://docs.temporal.io/)
8. [Mastra Workflows](https://mastra.ai/workflows)
9. [Mastra Agents](https://mastra.ai/agents)
10. [OpenAI Agents SDK TypeScript](https://openai.github.io/openai-agents-js/)
11. [OpenAI Agents SDK Sessions](https://openai.github.io/openai-agents-js/guides/sessions/)
12. [OpenAI Agents SDK Agents / Handoffs](https://openai.github.io/openai-agents-js/guides/agents/)
