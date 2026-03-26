# Memory 模块社区实践与设计参考（Draft）

- Status: draft
- Date: 2026-03-26
- Owner: AI-Agent
- Scope: `memory module / provider registry / retrieval seam / future service reuse`
- External Research Date: `2026-03-26`

## 1. 目的

这份文档回答一个更具体的问题：

当前仓库已经有：

1. `packages/core-memory` 的 `MemoryManager`
2. `packages/memory-store-adapter` 的 provider contract
3. `packages/memory-provider-registry` 的 built-in / optional plugin 解析链

那么接下来如果要把“记忆模块”做得更合理，社区里有哪些值得参考的稳定实践，以及这些实践对本仓库意味着什么。

本文只使用官方文档与项目官方参考，不依赖二手博客。

## 2. 先说结论

如果只看近一年的主流 agent/runtime 社区实践，一个比较稳定的共识是：

1. 不要把“记忆”做成一个大而全的单体接口。
2. 至少要拆成三类责任：
   - 运行时工作记忆 / thread state / checkpointer
   - 可检索的长期记忆 / recall store
   - 注入模型上下文的 update-context / retrieval policy
3. 短期记忆和长期记忆必须分层，而不是都塞进同一个 store。
4. 长期记忆最好显式区分：
   - semantic facts
   - episodic history
   - procedural rules / preferences
5. 写入长期记忆不要“见什么都存什么”，而要有 promote / summarize / gate 机制。
6. 检索不要默认自动发生；应该由显式的 query / update-context 阶段控制。
7. provider 抽象和 memory 语义抽象不是一回事。
   - provider 负责“存哪里、怎么查”
   - memory module 负责“什么时候写、写什么、什么时候取、取多少”

对本仓库的直接推断是：

1. `MemoryStoreProvider` 继续保持“底层存储 seam”是对的。
2. `MemoryManager` 现在更像“作用域化 KV/query 管理器”，还不是完整的“agent memory policy layer”。
3. 如果后续要做“更好的 memory 设计”，优先级不应该是继续扩充 provider，而应该是补一层：
   - `MemoryRecallService` / `MemoryPolicyLayer`
   - 负责 memory classification、promotion、retrieval、update-context
4. `LangGraph` checkpointer / orchestration service 里的 thread state，不应该和长期 memory provider 混成一个模块。

## 3. 社区实践速览

### 3.1 LangGraph / LangChain：短期记忆和长期记忆明确分层

LangGraph 官方文档把 memory 分成两大类：

1. short-term memory
   - thread-scoped
   - 作为 agent state 的一部分
   - 通过 checkpointer 持久化
   - graph step 开始时读取，执行过程中更新
2. long-term memory
   - 跨 session / thread
   - 用 custom namespace 组织
   - 可以随时 recall

同时，LangGraph 官方还把长期记忆进一步拆成：

1. semantic memory
2. episodic memory
3. procedural memory

另一个很有价值的点是，LangGraph 明确讨论了 memory 写入时机：

1. hot path
   - 在主交互链路里同步写入
2. background
   - 异步总结、抽取、沉淀

这意味着社区已经不把“memory = 一个数据库”看待，而是把它视为：

1. state persistence
2. long-term recall
3. write timing policy

### 3.2 Mem0：按 conversation / session / user / org 分层

Mem0 官方文档的做法更偏“产品化 memory system”：

1. conversation memory
2. session memory
3. user memory
4. organizational memory

它强调三个动作：

1. capture
2. promote
3. retrieve

而且检索顺序不是平铺的，而是有层次优先级：

1. 用户长期记忆优先
2. session notes 其次
3. raw history 最后

这个模式很值得借鉴，因为它不是单纯按技术类型分层，而是同时考虑：

1. 生命周期
2. 作用域
3. 检索优先级
4. 治理要求

对本仓库尤其有用的是 `organizational memory` 这个概念，它很接近：

1. workspace-level shared memory
2. project/sprint 共享上下文
3. team / repo 共享规则摘要

### 3.3 AutoGen：把 memory 当成一个可组合协议，而不是隐式魔法

AutoGen 官方给出的 `Memory` 协议非常清晰，核心方法是：

1. `add`
2. `query`
3. `update_context`
4. `clear`
5. `close`

它的关键价值不在“方法名”，而在责任切分：

1. memory store 负责保存和查询
2. memory implementation 负责把 relevant memory 更新进 model context
3. `update_context` 是显式步骤，不是隐式自动行为

另外，AutoGen 的文档把 memory 和 RAG 放在一起讲，这说明社区的一个实际趋势是：

1. “记忆”经常就是一种可检索上下文
2. 但是否注入 prompt，应该由单独的 update-context 机制控制

这对本仓库很重要，因为我们目前已经有：

1. `MemoryManager`
2. selective snapshot
3. orchestration service / runtime stage chain

很自然的演进方向不是把 `MemoryManager` 继续做大，而是在 runtime/service 侧引入一个显式的：

1. `queryRelevantMemory(...)`
2. `updateExecutionContext(...)`

### 3.4 Semantic Kernel：vector store 是底层能力，不默认自动介入模型调用

Semantic Kernel 官方有两个很值得参考的设计选择：

1. vector store / memory connectors 是统一抽象
2. Kernel 不会自动使用已注册的 vector store

它建议把 vector search 暴露成 plugin 或显式 text-search 能力，而不是默认每次调用模型都自动把 memory 拉进来。

另一个关键点是它已经从 legacy memory store abstraction 迁移到更强的 vector store abstraction，原因包括：

1. custom schema
2. multiple vectors per record
3. metadata pre-filtering
4. 更强的搜索与建模能力

再加上它的 chat history reducer：

1. truncation
2. summarization

可以看到一个非常清楚的社区趋势：

1. 工作记忆要做缩减与总结
2. 长期记忆要有独立 schema 和过滤能力
3. retrieval 是能力，不是默认副作用

## 4. 对本仓库当前实现的观察

### 4.1 现在已经做对的部分

基于当前代码，我认为下面这些方向是正确的：

1. `packages/core-memory/src/memory-manager.ts`
   - 已经把 memory 访问收敛到统一 manager
   - 已支持 `normative / execution / session` 分层快照
2. `packages/memory-store-adapter`
   - 已把 provider contract 从 runtime 语义中抽离
3. `packages/memory-provider-registry`
   - 已把 built-in / plugin 解析、安全策略、lazy load 独立出来
4. `project-015`
   - 当前主线明确聚焦 provider/plugin seam，而不是把 memory semantics 和 provider pluginization 混在一起

### 4.2 当前设计的缺口

但如果目标是“更好的记忆模块设计”，当前实现还缺一层真正的 memory policy / recall 语义：

1. 目前的 `MemoryStoreProvider` 更像 scoped storage interface
2. 目前的 `MemoryManager` 更像 scoped CRUD + snapshot manager
3. 还没有正式表达：
   - 哪些内容应该写入长期记忆
   - 哪些内容只能留在 checkpointer / session state
   - 哪些内容需要 summary/promote 后再写入
   - 检索时如何按 relevance / scope / recency 排序
   - 如何把 memory 安全地注入 prompt / execution context

换句话说：

当前仓库已经有“存储模块设计”，但还没有完整的“记忆模块设计”。

## 5. 推荐的目标设计

下面是基于社区实践，对本仓库做的设计推断。

### 5.1 拆成四个明确的 memory seam

#### A. Runtime Working State

所有只为“当前执行恢复”服务的状态，归：

1. LangGraph state
2. checkpointer
3. local orchestration service

典型内容：

1. 当前 node cursor
2. pending interrupt
3. tool outputs
4. in-flight artifacts
5. thread-level message history

这部分不应该混进长期 memory provider。

#### B. Operational Memory Store

这部分对应现在的 `MemoryManager` + `MemoryStoreProvider`，保留为基础层：

1. deterministic read/write/query
2. scope-aware snapshot
3. archive / retention

它更像“memory substrate”，不是“memory brain”。

#### C. Recall / Retrieval Layer

建议新增一层，例如：

1. `MemoryRecallService`
2. 或 `MemoryPolicyLayer`

职责：

1. classify memory candidate
2. decide whether to persist
3. decide target layer / namespace
4. run retrieval
5. update execution/model context

这是当前仓库最值得补的一层。

#### D. Optional Search Capability

不要把 vector / hybrid search 强塞进基础 `MemoryStoreProvider`。

更推荐做成 capability-based 扩展，例如：

1. `MemorySearchProvider`
2. `MemoryIndexCapability`
3. `VectorRecallCapability`

这样做的好处是：

1. `fs-csv` 这类 provider 仍可保留简单 deterministic 行为
2. `sqlite-fs` 或未来向量化 provider 可以提供增强检索
3. 不会把所有 provider 都逼成“必须支持向量搜索”

这和 Semantic Kernel 把 vector store 视为独立 abstraction 的方向是对齐的。

### 5.2 重新定义 memory layer，而不只是 memory scope

当前 `normative / execution / session` 还不够表达长期记忆语义。

建议把“逻辑层”与“存储 scope”分开：

逻辑层建议至少有：

1. `working`
   - 当前 turn / thread / graph state
2. `session`
   - 当前任务/当前交互阶段的短期记忆
3. `user`
   - 用户偏好、稳定约束、历史习惯
4. `workspace`
   - repo/team/shared memory
5. `normative-projection`
   - 来自 canonical docs 的可检索投影，不是 canonical source 本体

当前仓库的映射建议：

1. `working`
   - 放到 orchestration service + checkpointer
2. `session`
   - 继续用 `MemoryScope.SESSION`
3. `execution`
   - 保留给 run-level scratch / references
4. `workspace` / `user`
   - 未来若引入长期 recall，再新增逻辑层，不急着现在塞进 `normative`
5. `normative`
   - 只作为规范知识的 projection/cache，不替代文档 canonical source

### 5.3 引入 memory kind，而不只是 namespace

建议每条 memory record 至少带一个 `memoryKind`：

1. `semantic`
2. `episodic`
3. `procedural`
4. `artifact-reference`

这样比只靠 `namespace` 更稳，因为 namespace 回答的是“属于谁”，而 kind 回答的是“它是什么”。

## 6. 推荐数据模型

建议未来 memory record 统一成一个 envelope，而不是只存裸 `value + tags`。

最少字段建议：

1. `memoryId`
2. `scope`
3. `layer`
4. `memoryKind`
5. `subjectType`
   - `user | workspace | project | sprint | task | execution | artifact`
6. `subjectId`
7. `content`
8. `summary`
9. `sourceRefs`
   - `artifactId[]`
   - `taskId`
   - `reviewId`
   - `docPath`
10. `provenance`
    - `user_input | tool_output | system_summary | imported_doc`
11. `confidence`
12. `retentionPolicy`
13. `sensitivity`
14. `updatedAt`
15. `lastAccessedAt`

推断：

对 repo-ai-governor 这种治理型产品，`sourceRefs` 和 `provenance` 的价值比“是否有 embedding”更大，因为可审计性是主线要求。

## 7. 推荐写入策略

### 7.1 不要默认把所有内容写进长期记忆

建议分三档：

1. hot-path sync write
   - 只写确定性、小而稳定、后续高概率复用的事实
2. deferred promotion
   - 先记到 session/execution，再异步总结后提升为 user/workspace memory
3. never persist
   - 敏感内容、一次性 tool output、不可重放临时状态

### 7.2 推荐写入判定规则

一个 memory candidate 满足以下条件再 promote：

1. 可复用
2. 可归属
3. 可追溯
4. 非敏感或已脱敏
5. 不与 canonical source 冲突

例如：

1. 用户偏好
   - 可以写 user semantic memory
2. 一次任务的关键决策总结
   - 可以写 episodic memory
3. 编排系统固定规则
   - 不应该写成唯一 memory，而应继续留在 normative docs；memory 只能存 projection 或摘要

## 8. 推荐检索策略

### 8.1 显式 retrieval phase

建议借鉴 AutoGen 的 `query + update_context` 思路，在 runtime/service 里明确增加一个阶段：

1. `queryRelevantMemory(context)`
2. `selectMemoryForPrompt(result)`
3. `updateExecutionContext(...)`

不要把“只要 provider 注册了，就自动注入模型上下文”当作默认行为。

### 8.2 检索顺序建议

对本仓库，建议默认按下面优先级拼装记忆：

1. 当前任务 / 当前 execution 的短期结果
2. session memory
3. workspace shared memory
4. user memory
5. normative projection

只有当 query 明确需要长程召回时，再进入向量/语义搜索。

### 8.3 检索过滤器建议

无论是否引入向量搜索，都建议先做 metadata 过滤：

1. `workspaceId`
2. `projectId`
3. `sprintId`
4. `taskId`
5. `userId`
6. `memoryKind`
7. `updatedAt`
8. `sensitivity`

这和 Semantic Kernel 强调 metadata pre-filtering 的方向一致。

## 9. 对 provider contract 的建议

### 9.1 基础 provider contract 继续保持简单

当前 `MemoryStoreProvider` 的方向建议保持：

1. `read`
2. `write`
3. `query`
4. `snapshot`
5. `archive`
6. `dispose`

不要急着把 embedding、rerank、hybrid search 全塞进去。

### 9.2 以 capability 扩展高级检索

建议后续如果要做更高级的 memory，不要改坏当前 seam，而是增加可选能力：

1. `SemanticMemorySearchCapability`
2. `HybridSearchCapability`
3. `MemoryPromotionCapability`

这样 provider registry 可以继续负责：

1. provider loading
2. plugin policy
3. capability discovery

而不是既负责安全加载，又负责 memory business semantics。

### 9.3 为后续线上协同预留接口，但不要过早把线上能力塞进基础 provider

如果后续目标包含“线上协同”，我认为应该预留接口，但预留的位置要选对。

建议现在就预留的是 host-neutral service seam，而不是把云端/协同语义直接塞进 `MemoryStoreProvider`：

1. `MemoryRecallService`
   - 输入至少预留：`workspaceId`、`actorId`、`sessionId?`、`executionId?`、`queryIntent`、`limit`
2. `MemoryPromotionService`
   - 负责 `capture -> promote -> merge -> archive`
3. `WorkingMemoryStateStore`
   - 负责 thread/session/execution working state
4. `MemoryCapabilityDescriptor`
   - 让 runtime/service 能探测当前 provider 是否支持 semantic / hybrid / promotion / conflict-resolution
5. `MemoryRecordRepository`
   - 作为长期记忆的 transport-neutral repository seam，而不是直接暴露文件路径或数据库细节

如果要为线上协同留钩子，建议最少预留这些字段：

1. `tenantId` 或等价的多租户命名空间
2. `workspaceId`
3. `actorId` / `updatedBy`
4. `version` / `etag`
5. `visibility`
   - `private | workspace | project | shared`
6. `consistencyHint`
   - `strong | eventual | local-cache-preferred`

但不建议现在就预留这些内容到基础 provider：

1. `semanticSearch()`
2. `rerank()`
3. `syncToCloud()`
4. `shareWithUsers()`
5. 各种直接暴露 HTTP / RPC transport 细节的方法

原因是：

1. 基础 provider 解决的是“存储能力”
2. 线上协同解决的是“租户、共享、冲突、权限、一致性”
3. 两者耦合过早，后面很容易把本地模式也拖复杂

更稳的做法是：

1. `MemoryStoreProvider`
   - 保持本地/通用存储职责
2. `MemoryRecallService` / `MemoryPromotionService`
   - 负责语义层策略
3. `OnlineCollaborationMemoryGateway`
   - 未来如果真的做线上协同，再单独加这一层

一句话说：

要为线上协同预留接口，但应预留在 service/repository/capability seam，而不是现在就把基础 provider 扩成云端协同大接口。

## 10. 治理与安全建议

### 10.1 记忆不是 canonical source

这一点必须继续保持：

1. `current-context.md`
2. `tasks/checklist.md`
3. `tasks/tasks.csv`
4. review lifecycle files
5. normative docs

这些都不能被 memory 替代。

memory 只能是：

1. recall acceleration
2. execution aid
3. summary/projection layer

### 10.1.1 这些 canonical source 可以换承载方式，但不能被 memory 层接管

如果后续要做线上协同，上面这些 canonical source 不一定永远都只能以“仓库文件”承载。

可以变化的是承载方式，不应该变化的是逻辑契约。

可接受的演进方向例如：

1. repo-local mode
   - 继续以 markdown / csv / structured files 承载
2. service-backed mode
   - 由数据库或结构化服务承载，再投影/渲染成文件视图
3. hybrid mode
   - 线上 canonical store + 本地 materialized cache / export

但无论用哪种承载方式，下面这些原则不应变：

1. `current-context` 仍是 execution routing 的事实源
2. `tasks/checklist/tasks.csv` 仍是任务台账事实源
3. review lifecycle 仍是 CR 状态事实源
4. normative docs 仍是规范事实源
5. memory 只能保存这些事实源的 projection / summary / recall index

所以对“这种类型的文件能不能换别的方式承载”，答案是：

1. 可以
2. 但应通过 canonical-source service / repository / projector 承载
3. 不应通过 memory module 本身承载

如果将来真的走线上协同，我更推荐的落点是：

1. `CanonicalSourceRepository`
   - 面向事实源
2. `FileProjector`
   - 面向 repo-local 视图
3. `MemoryRecallService`
   - 面向 recall / retrieval

这样三层不会混掉。

### 10.2 对长期记忆增加最少治理字段

建议任何持久 memory 至少带：

1. source refs
2. retention policy
3. sensitivity label
4. owner / namespace

### 10.3 plugin mode 只解决加载安全，不解决记忆正确性

`project-015` 当前聚焦的 allowlist / prefix / path / module policy 很重要，但它解决的是：

1. 谁能被加载
2. 从哪里加载
3. 如何 fail-closed

它不自动解决：

1. 写入判定
2. memory classification
3. retrieval relevance
4. prompt injection hygiene

所以后续不能把“provider pluginization 完成”误认为“memory module 设计完成”。

## 11. 推荐演进顺序

### Phase A：冻结 memory model

先补文档和类型，不急着换 provider。

目标：

1. 定义 `layer`
2. 定义 `memoryKind`
3. 定义 `sourceRefs / provenance / retention / sensitivity`
4. 明确 working memory 与 long-term memory 边界

### Phase B：补 recall / update-context 层

目标：

1. 新增 `MemoryRecallService`
2. 将 query / select / update-context 显式化
3. 保持 `MemoryManager` 只做 substrate

### Phase C：补 promotion pipeline

目标：

1. hot-path capture
2. background summarize/promote
3. 明确哪些内容可进入长期记忆

### Phase D：引入可选语义检索能力

目标：

1. 在 capability seam 下支持 semantic / vector / hybrid search
2. 先 metadata filter，后 semantic rank
3. 不破坏 `fs-csv` 的基础 provider 路径

## 12. 对本仓库最值得立即采纳的 5 条建议

1. 把 thread state/checkpointer 和长期记忆正式分层，不再都叫 memory。
2. 在 `MemoryManager` 之上新增 `MemoryRecallService`，把 `query + update-context` 变成显式阶段。
3. 为 memory record 增加 `memoryKind + provenance + sourceRefs + retention + sensitivity`。
4. 不把 semantic/vector search 强塞进基础 provider contract，而是做 capability 扩展。
5. 长期记忆写入采用 `capture -> promote -> retrieve`，而不是同步全量落盘。

## 13. 参考来源

### 官方文档

1. LangGraph Memory Overview  
   - [https://docs.langchain.com/oss/javascript/langgraph/memory](https://docs.langchain.com/oss/javascript/langgraph/memory)
2. LangGraph Long-term Memory  
   - [https://docs.langchain.com/oss/javascript/langchain/long-term-memory](https://docs.langchain.com/oss/javascript/langchain/long-term-memory)
3. AutoGen Memory and RAG  
   - [https://microsoft.github.io/autogen/dev/user-guide/agentchat-user-guide/memory.html](https://microsoft.github.io/autogen/dev/user-guide/agentchat-user-guide/memory.html)
4. AutoGen Memory Protocol Reference  
   - [https://microsoft.github.io/autogen/stable/reference/python/autogen_core.memory.html](https://microsoft.github.io/autogen/stable/reference/python/autogen_core.memory.html)
5. Mem0 Memory Types  
   - [https://docs.mem0.ai/core-concepts/memory-types](https://docs.mem0.ai/core-concepts/memory-types)
6. Semantic Kernel Components  
   - [https://learn.microsoft.com/en-us/semantic-kernel/concepts/semantic-kernel-components](https://learn.microsoft.com/en-us/semantic-kernel/concepts/semantic-kernel-components)
7. Semantic Kernel Vector Stores  
   - [https://learn.microsoft.com/en-us/semantic-kernel/concepts/vector-store-connectors/](https://learn.microsoft.com/en-us/semantic-kernel/concepts/vector-store-connectors/)
8. Semantic Kernel Vector Search  
   - [https://learn.microsoft.com/en-us/semantic-kernel/concepts/vector-store-connectors/vector-search](https://learn.microsoft.com/en-us/semantic-kernel/concepts/vector-store-connectors/vector-search)
9. Semantic Kernel Chat History Reducers  
   - [https://learn.microsoft.com/en-us/semantic-kernel/concepts/ai-services/chat-completion/chat-history](https://learn.microsoft.com/en-us/semantic-kernel/concepts/ai-services/chat-completion/chat-history)

### 本仓库现状参考

1. `packages/core-memory/src/memory-manager.ts`
2. `packages/memory-store-adapter/src/types/interfaces/memory-store.interface.ts`
3. `packages/memory-provider-registry/src/memory-provider-registry.ts`
4. `.repo-ai-governor/draft/memory-provider-pluginization-technical-solution.md`
5. `.repo-ai-governor/context/dev/project-015-memory-provider-pluginization/plan.md`

## 14. 一句话收口

社区实践给出的方向不是“做一个更强的 memory provider”，而是“把工作记忆、长期记忆、检索注入、provider 能力拆开设计”。  
对本仓库来说，下一步最该补的是 `memory policy / recall layer`，而不是继续把所有语义都堆进 `MemoryManager` 或 provider seam。
