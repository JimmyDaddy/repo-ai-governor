# Runtime Memory Semantics 技术方案（Draft）

- Status: draft
- Date: 2026-03-27
- Owner: AI-Agent
- Scope: `runtime memory semantics / working-state boundary / recall policy / context assembly / promotion pipeline`
- Solution ID: `technical-solution.memory-module`
- Intended Target Module: `runtime.memory-semantics`（尚未正式接线）
- Related Inputs:
  - `.repo-ai-governor/draft/memory-module-technical-solution.md`
  - `.repo-ai-governor/context/dev/project-018-technical-solution-promotion-pilots/sprint-002-memory-module-promotion-readiness/tasks/DA-203-memory-module-bounded-context-assessment-and-runtime-memory-semantics-recommendation.md`
  - `.repo-ai-governor/context/dev/project-018-technical-solution-promotion-pilots/sprint-002-memory-module-promotion-readiness/tasks/DA-204-memory-module-prepare-promotion-readiness-and-blocker-register.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-memory-provider-loading/module-overview.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-orchestration/module-overview.md`

## 1. 目的

这份文档不再把重点放在“社区都怎么做 memory”，而是直接回答：

在 `repo-ai-governor` 当前代码和正式模块边界下，Memory 模块下一步应该如何定义，才能既不污染现有 `provider loading` 模块，也不把运行时 working state、长期记忆、canonical source 混在一起。

一句话结论：

本仓库下一份真正应该进入正式模块体系的 memory 技术方案，不是继续扩写 `runtime.memory-provider-loading`，而是单独引入 `runtime.memory-semantics`，负责 working memory 边界、recall policy、context assembly 和 promotion pipeline。

## 2. 为什么要重写成项目内技术方案

原始社区参考有价值，但它更像“方向证明”，还不是仓库内可执行方案，主要缺三件事：

1. 没有把方案绑定到当前仓库的真实代码边界。
2. 没有明确和现有正式模块 `runtime.memory-provider-loading`、`runtime.orchestration` 的职责切分。
3. 没有把“未来可能能力”和“当前应实现的基线”分开。

因此这版文档改成仓库内语义：

1. 以现有 `core-memory / memory-store-adapter / memory-provider-registry / runtime-orchestration` 为出发点。
2. 以 `runtime.memory-semantics` 作为推荐的目标模块边界。
3. 只定义当前仓库可落地、可 promotion 的 contract 和 phased rollout。

## 3. 当前仓库已成立的事实

### 3.1 已有稳定基线

当前仓库已经明确具备三类稳定能力：

1. `packages/core-memory`
   - `MemoryManager` 已提供统一 `read / write / query / snapshot / archive / loadLayeredSnapshot`。
   - 当前稳定 scope 只有 `normative / execution / session`。
2. `packages/memory-store-adapter`
   - `MemoryStoreProvider` 是确定性存储 seam。
   - 当前 contract 聚焦 `read / write / query / snapshot / archive / dispose`。
3. `packages/memory-provider-registry`
   - provider resolution、allowlist、plugin policy、distribution truthfulness 已被 `project-015` 收口到正式模块 `runtime.memory-provider-loading`。

### 3.2 已有正式模块边界

当前正式模块已经把边界切得比较清楚：

1. `runtime.memory-provider-loading`
   - 负责 provider 选择、plugin policy、host surface 与 distribution truthfulness。
   - 不负责 memory semantics。
2. `runtime.orchestration`
   - 负责 graph-first execution、runtime path、service-backed host。
   - 明确 vendor checkpoint / thread state 只是 runtime recovery 机制，不是 canonical source。

### 3.3 当前真正缺失的层

当前仓库还没有正式表达下面这些语义：

1. working state 和 long-term memory 的分界。
2. recall 何时发生、按什么顺序发生。
3. execution context 如何组装 memory，而不是默认隐式注入。
4. 哪些内容允许从 session/execution 提升为长期记忆。
5. memory record 的审计字段、保留策略和敏感性标签。

所以当前系统已经有“memory substrate”，但还没有“memory semantics module”。

## 4. 目标模块边界

### 4.1 推荐新模块

推荐的新模块是：

1. `runtime.memory-semantics`

它的目标不是替代现有 `core-memory`，而是站在现有 substrate 之上，定义 memory 语义层。

### 4.2 模块职责

`runtime.memory-semantics` 应只负责：

1. 定义 working memory 与 recall memory 的语义边界。
2. 定义 memory recall policy。
3. 定义 memory context assembly contract。
4. 定义 promotion / summarize / retention 的规则。
5. 定义 memory record 的审计字段和 host-neutral repository seam。

### 4.3 明确非目标

`runtime.memory-semantics` 不负责：

1. provider 的解析、加载、allowlist、安全策略。
2. graph runtime 的调度与 node execution。
3. canonical source 的承载或替代。
4. 立即落地完整 semantic/vector/hybrid search。
5. 直接引入线上协同 transport 语义。

## 5. 设计原则

### 5.1 Substrate 与 semantics 分离

保持下面两层分离：

1. `MemoryStoreProvider / MemoryManager`
   - 回答“怎么存、怎么查”
2. `MemoryRecallService / MemoryPromotionService`
   - 回答“什么时候存、取什么、怎么注入”

### 5.2 Working state 与长期记忆分离

以下状态属于 working state，而不是长期记忆：

1. thread state
2. node cursor
3. pending interrupt
4. temporary tool outputs
5. in-flight artifact references
6. step-level scratch context

这些状态应归 `runtime.orchestration + checkpointer + future working-state seam` 管理，不应直接收编进长期 memory provider。

### 5.3 Memory 不是 canonical source

以下事实源仍然必须保持在 canonical source：

1. `current-context.md`
2. `tasks/checklist.md`
3. `tasks/tasks.csv`
4. review lifecycle files
5. normative docs
6. artifact registry

memory 只能是：

1. projection
2. summary
3. recall index
4. execution aid

### 5.4 Local-first，service-ready

本方案首先服务：

1. CLI embedded mode
2. local orchestration service
3. current repo-local / tool-managed workspace modes

但接口设计应允许未来扩展到：

1. service-backed local host
2. future online collaboration gateway

## 6. 目标架构

## 6.1 五层划分

### A. Canonical Source Layer

负责正式事实源：

1. current context
2. task ledger
3. review lifecycle
4. normative docs
5. artifact registry

这层不属于 memory module。

### B. Working Memory Layer

负责当前执行恢复与线程状态：

1. thread-scoped messages
2. node cursor
3. pending interrupt
4. execution scratch
5. temporary context assembly result

建议所有权继续归：

1. `runtime.orchestration`
2. checkpointer
3. future `WorkingMemoryStateStore`

### C. Memory Substrate Layer

负责确定性存储与快照：

1. `MemoryStoreProvider`
2. `MemoryStoreAdapter`
3. `MemoryManager`
4. `MemoryProviderRegistry`

这一层已经存在，不是本方案的重写重点。

### D. Memory Semantics Layer

这是本方案定义的新层，负责：

1. `MemoryRecallService`
2. `MemoryPromotionService`
3. `MemoryRecordRepository`
4. `MemoryContextAssembler`
5. `MemoryCapabilityDescriptor`

### E. Host Integration Layer

负责把语义层接到宿主：

1. CLI
2. local orchestration service
3. future desktop / daemon / service host

## 6.2 与现有正式模块的关系

依赖方向建议固定为：

1. `runtime.memory-semantics` 导入 `contract.memory-provider.loading.v1`
2. `runtime.orchestration` 导入 memory semantics 导出的 recall/context contract
3. `runtime.memory-provider-loading` 不反向依赖 memory semantics

也就是说：

1. provider loading 是底层装配 contract
2. memory semantics 是上层语义 contract
3. orchestration 是消费两者的运行时 owner

## 7. 领域模型

### 7.1 逻辑层与现有 scope 的关系

当前代码里的稳定 scope 仍是：

1. `normative`
2. `execution`
3. `session`

本方案不建议立刻推翻它们，而是增加一层更高阶的逻辑语义：

1. `working`
2. `session`
3. `workspace`
4. `user`
5. `normative_projection`

映射建议：

1. `working`
   - 不进入现有长期 store；由 orchestration/checkpointer 持有
2. `session`
   - 当前可继续映射到 `MemoryScope.SESSION`
3. `workspace`
   - 可先落在 `MemoryScope.EXECUTION` 的受控 namespace，后续再升级为独立 layer
4. `user`
   - 当前只作为设计预留，不要求本轮实现
5. `normative_projection`
   - 来自 canonical docs 的可检索投影，不是文档事实源本体

### 7.2 Memory Kind

建议冻结以下逻辑分类：

1. `semantic`
2. `episodic`
3. `procedural`
4. `artifact_reference`
5. `system_projection`

意义：

1. `namespace` 回答“属于谁”
2. `memoryKind` 回答“它是什么”

### 7.3 Memory Record Envelope

建议长期记忆使用统一 envelope，而不是只依赖当前 `MemoryRecord.value + tags`：

```ts
export interface MemoryRecordEnvelope {
  memoryId: string;
  scope: string;
  layer: "session" | "workspace" | "user" | "normative_projection";
  memoryKind: "semantic" | "episodic" | "procedural" | "artifact_reference" | "system_projection";
  subjectType: "user" | "workspace" | "project" | "sprint" | "task" | "execution" | "artifact";
  subjectId: string;
  content: Record<string, unknown>;
  summary?: string;
  sourceRefs: {
    artifactIds?: string[];
    taskId?: string;
    reviewId?: string;
    docPath?: string;
  };
  provenance: "user_input" | "tool_output" | "system_summary" | "imported_doc";
  confidence?: number;
  retentionPolicy?: string;
  sensitivity?: "public" | "workspace" | "restricted" | "secret";
  visibility?: "private" | "workspace" | "project" | "shared";
  tenantId?: string;
  version?: number;
  updatedBy?: string;
  updatedAt: string;
  lastAccessedAt?: string;
}
```

当前结论：

1. 这些字段是 memory semantics 层的目标模型。
2. 不要求当前所有 provider 立刻原生支持全部高级语义。
3. `sourceRefs + provenance + sensitivity` 对本仓库比 embedding 更关键。

## 8. 合同与服务接口

### 8.1 计划导出的正式 contract

`runtime.memory-semantics` 后续最合理的正式文档落点，已经在 `DA-204` 里给出：

1. `contracts/memory-recall-policy-contract.md`
2. `contracts/memory-context-assembly-contract.md`
3. `adrs/working-memory-and-canonical-source-boundary.md`

### 8.2 Memory Recall Service

建议新增：

```ts
export interface MemoryRecallService {
  recall(request: MemoryRecallRequest): Promise<MemoryRecallResult>;
  updateExecutionContext(
    request: MemoryContextUpdateRequest,
  ): Promise<MemoryContextUpdateResult>;
}
```

职责：

1. 按 metadata 与 intent 做 recall planning。
2. 显式控制哪些 memory 进入 execution context。
3. 输出 prompt-safe / execution-safe 的裁剪结果。

### 8.3 Memory Promotion Service

建议新增：

```ts
export interface MemoryPromotionService {
  capture(request: MemoryCaptureRequest): Promise<void>;
  promote(request: MemoryPromoteRequest): Promise<MemoryPromoteResult>;
  merge(request: MemoryMergeRequest): Promise<MemoryMergeResult>;
}
```

职责：

1. 决定什么内容值得进入长期记忆。
2. 决定提升到哪一层。
3. 决定是新增、合并还是丢弃。

### 8.4 Memory Record Repository

建议新增：

```ts
export interface MemoryRecordRepository {
  get(memoryId: string): Promise<MemoryRecordEnvelope | undefined>;
  put(record: MemoryRecordEnvelope): Promise<void>;
  query(request: MemoryRecordQueryRequest): Promise<MemoryRecordEnvelope[]>;
  archive(request: MemoryRecordArchiveRequest): Promise<number>;
}
```

职责：

1. 屏蔽底层 provider 差异。
2. 把现有 substrate seam 和未来 host/service seam 解耦。

### 8.5 Working State Store

建议单独抽象：

```ts
export interface WorkingMemoryStateStore {
  readThreadState(request: WorkingStateReadRequest): Promise<WorkingState | undefined>;
  writeThreadState(request: WorkingStateWriteRequest): Promise<void>;
  clearThreadState(request: WorkingStateClearRequest): Promise<void>;
}
```

作用不是“新增一个 memory provider”，而是显式声明 working state 不属于长期 recall 层。

## 9. 关键流程

### 9.1 Recall Phase

执行前应显式存在：

1. `queryRelevantMemory(context)`
2. `selectMemoryForContext(result)`
3. `updateExecutionContext(...)`

默认拼装顺序建议为：

1. execution short-term facts
2. session memory
3. workspace memory
4. user memory
5. normative projection

只有查询 intent 明确需要长程召回时，才进入更重的 semantic/hybrid search。

### 9.2 Promotion Phase

执行后不应“见什么都写什么”，而应经过：

1. capture candidate
2. classify by `memoryKind`
3. validate provenance / traceability / sensitivity
4. decide target layer
5. merge or persist

推荐 promotion 判定条件：

1. 可复用
2. 可归属
3. 可追溯
4. 非敏感或已脱敏
5. 不与 canonical source 冲突

### 9.3 Never Persist 规则

以下内容默认不进入长期记忆：

1. 临时 tool output 全量原文
2. 无法归属的一次性 scratch
3. 会替代 canonical source 的“伪事实”
4. 敏感信息或未脱敏内容

## 10. 与现有代码的最小兼容路径

### 10.1 不立即改坏现有 `MemoryManager`

当前 `MemoryManager` 更接近 substrate manager：

1. 它的定位应保持。
2. 不应在其上继续堆积 recall/promotion 业务语义。
3. 新语义层应在它之上组合，而不是把它改成“大一统 memory brain”。

### 10.2 不立即扩张 `MemoryStoreProvider`

当前 provider contract 保持简单是对的：

1. `read`
2. `write`
3. `query`
4. `snapshot`
5. `archive`
6. `dispose`

本方案不建议直接加入：

1. `semanticSearch`
2. `rerank`
3. `syncToCloud`
4. `shareWithUsers`
5. `resolveConflict`

这些能力如果需要，应该走 capability seam。

### 10.3 与 `runtime.memory-provider-loading` 的关系

memory semantics 消费 provider loading contract，但不反过来污染 provider loading 模块。

换句话说：

1. provider loading 决定“哪个 provider 可用”
2. memory semantics 决定“什么时候查、取多少、怎么用”

### 10.4 与 `runtime.orchestration` 的关系

`runtime.orchestration` 继续拥有：

1. graph runtime
2. checkpoint / thread recovery
3. host surface

它应消费 memory semantics 导出的 recall/context contract，而不是自己实现一套 memory policy。

## 11. 演进顺序

### Phase A：冻结 memory semantics contract

目标：

1. 确认 `runtime.memory-semantics` 模块边界。
2. 冻结 `MemoryKind`、`MemoryRecordEnvelope`、recall/context contract。
3. 补齐 formal module docs skeleton。

### Phase B：引入 recall/context assembly baseline

目标：

1. 新增 `MemoryRecallService`
2. 在 runtime/service 中显式化 recall phase
3. 保持 `MemoryManager` 仍是 substrate manager

### Phase C：引入 promotion pipeline baseline

目标：

1. 新增 `MemoryPromotionService`
2. 落地 `capture -> promote -> merge`
3. 明确 session/execution 到 workspace/user 的提升条件

### Phase D：补 working-state seam

目标：

1. 新增 `WorkingMemoryStateStore`
2. 将 thread state / checkpointer / long-term memory 的职责边界正式化

### Phase E：可选 capability 扩展

只有在前面四步稳定后，再考虑：

1. semantic search
2. hybrid search
3. conflict resolution
4. remote sync

## 12. Promotion 前置 blocker

这份方案目前仍应保持 `draft`，原因和 `DA-204` 一致：

1. `runtime.memory-semantics` 模块还没有正式接入 module registry / manifest。
2. 对应的 formal docs 还不存在。
3. 这份方案还没有独立 review approval evidence。
4. lifecycle registry 当前仍把 `technical-solution.memory-module` 保留在 draft。

因此这份文档当前的用途是：

1. 收敛 memory semantics 的项目内方向。
2. 为后续真正创建 `runtime.memory-semantics` formal docs 提供输入。
3. 避免继续把 memory semantics 错挂到 `runtime.memory-provider-loading`。

## 13. 与社区实践的关系

社区实践仍然是有用输入，但在本仓库里只保留这些已经转化为可执行结论的部分：

1. short-term / long-term memory 必须分层。
2. retrieval 必须显式化，而不是自动副作用。
3. promotion 应该是受控过程，而不是同步全量落盘。
4. vector/semantic search 应该是能力扩展，而不是基础 provider 门槛。
5. canonical source 与 memory projection 必须分离。

其余外部实现细节，不直接作为本仓库 contract。

## 14. 一句话收口

对 `repo-ai-governor` 来说，下一步最该正式化的不是“更强的 memory provider”，而是一个新的 `runtime.memory-semantics` 模块：它位于 provider loading 之上、orchestration 之下，专门负责 working-state boundary、recall policy、context assembly 和 promotion pipeline，同时严格保证 memory 不越位接管 canonical source。
