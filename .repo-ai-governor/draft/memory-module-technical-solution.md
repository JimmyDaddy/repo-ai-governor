# Memory 模块技术方案（Draft）

- Status: draft
- Date: 2026-03-27
- Owner: AI-Agent
- Solution ID: `technical-solution.memory-module`
- Scope: `runtime memory semantics / recall policy / context assembly / promotion pipeline / working-state boundary`
- Intended Target Module: `runtime.memory-semantics`（尚未正式接线）
- Related Inputs:
  - `.repo-ai-governor/draft/memory-module-community-practices-and-design-reference.md`
  - `.repo-ai-governor/draft/memory-provider-pluginization-technical-solution.md`
  - `.repo-ai-governor/context/dev/project-018-technical-solution-promotion-pilots/sprint-002-memory-module-promotion-readiness/tasks/DA-203-memory-module-bounded-context-assessment-and-runtime-memory-semantics-recommendation.md`
  - `.repo-ai-governor/context/dev/project-018-technical-solution-promotion-pilots/sprint-002-memory-module-promotion-readiness/tasks/DA-204-memory-module-prepare-promotion-readiness-and-blocker-register.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-memory-provider-loading/module-overview.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-orchestration/module-overview.md`

## 1. 目的

本方案解决的不是 memory provider 插件化问题。那部分已经由 `project-015` 和正式模块 `runtime.memory-provider-loading` 收口。

本方案要解决的是另一个更上层的问题：

1. 当前仓库已经有 memory substrate。
2. 当前仓库还没有正式的 memory semantics module。
3. working state、长期记忆、prompt/context 注入、promotion/retention 规则，仍没有稳定 contract。

一句话结论：

本仓库下一步应引入新的 `runtime.memory-semantics` 模块，在现有 `core-memory` 和 `runtime.memory-provider-loading` 之上，正式定义 working-state boundary、recall policy、context assembly 与 promotion pipeline。

## 2. 当前现状

### 2.1 已存在的稳定能力

当前仓库已经具备以下正式能力：

1. `packages/core-memory`
   - `MemoryManager` 提供统一的 `read / write / query / snapshot / archive / loadLayeredSnapshot`。
   - 稳定 scope 仍是 `normative / execution / session`。
2. `packages/memory-store-adapter`
   - `MemoryStoreProvider` 作为确定性持久层 contract。
3. `packages/memory-provider-registry`
   - 负责 built-in registry、plugin allowlist、resolution policy、lazy loading。
4. `runtime.memory-provider-loading`
   - 已将 provider loading、host surface 与 distribution truthfulness 正式化。
5. `runtime.orchestration`
   - 已将 graph-first runtime、checkpoint/thread recovery 与 host surface 正式化。

### 2.2 当前缺失的能力

当前还没有正式收口的是：

1. working state 与长期记忆的边界。
2. recall 何时发生、以什么优先级发生。
3. memory 如何显式进入 execution context。
4. 哪些内容允许从 session/execution 提升为长期记忆。
5. memory record 的审计字段、敏感性标签和 retention 语义。

所以现在的状态不是“没有 memory”，而是“只有 substrate，没有 semantics”。

## 3. 目标模块边界

### 3.1 推荐目标模块

推荐目标模块：

1. `runtime.memory-semantics`

这也是 `project-018 / sprint-002` 已给出的 bounded-context 结论。`technical-solution.memory-module` 不应继续挂在 `runtime.memory-provider-loading` 下。

### 3.2 该模块负责什么

`runtime.memory-semantics` 负责：

1. 定义 working memory 与 recall memory 的边界。
2. 定义 recall policy 和 retrieval ordering。
3. 定义 memory context assembly contract。
4. 定义 promotion / summarize / retention 的规则。
5. 定义 memory record 的 envelope 与 repository seam。

### 3.3 该模块不负责什么

`runtime.memory-semantics` 不负责：

1. provider 解析、allowlist、安全加载。
2. graph runtime 调度与 host process 管理。
3. canonical source 的承载或替代。
4. 立即实现完整 semantic/vector/hybrid search。
5. 直接引入 online collaboration 的 RPC/HTTP transport 细节。

## 4. 设计原则

### 4.1 Substrate 与 semantics 分离

保持两层分离：

1. substrate
   - `MemoryStoreProvider`
   - `MemoryStoreAdapter`
   - `MemoryManager`
2. semantics
   - `MemoryRecallService`
   - `MemoryPromotionService`
   - `MemoryContextAssembler`
   - `MemoryRecordRepository`

结论：

1. `MemoryManager` 继续回答“怎么存、怎么查”。
2. 新语义层回答“什么时候查、取什么、怎么注入、何时提升”。

### 4.2 Working state 与长期记忆分离

以下内容默认属于 working state，而不是长期记忆：

1. node cursor
2. pending interrupt
3. thread-local scratch
4. in-flight tool outputs
5. temporary stage composition
6. checkpoint owner state

这些状态应继续归 `runtime.orchestration + checkpointer + future WorkingMemoryStateStore` 管理。

### 4.3 Memory 不是 canonical source

以下仍必须保持 canonical source 身份：

1. `current-context.md`
2. `tasks/checklist.md`
3. `tasks/tasks.csv`
4. review lifecycle files
5. normative docs
6. artifact registry

memory 只能是：

1. projection
2. summary
3. recall aid
4. execution acceleration layer

### 4.4 Local-first，service-ready

本方案首先服务：

1. CLI embedded mode
2. local orchestration service
3. repo-local / tool-managed workspace

但接口需要允许未来扩展到：

1. service-backed local host
2. online collaboration gateway

## 5. 目标架构

## 5.1 五层结构

### A. Canonical Source Layer

负责正式事实源：

1. current context
2. task ledger
3. review lifecycle
4. normative docs
5. artifact registry

### B. Working Memory Layer

负责当前执行恢复与线程状态：

1. thread messages
2. cursor / interrupt
3. execution scratch
4. temporary context assembly result

### C. Memory Substrate Layer

负责持久化与快照：

1. `MemoryStoreProvider`
2. `MemoryStoreAdapter`
3. `MemoryManager`
4. `MemoryProviderRegistry`

### D. Memory Semantics Layer

负责策略与语义：

1. `MemoryRecallService`
2. `MemoryPromotionService`
3. `MemoryContextAssembler`
4. `MemoryRecordRepository`
5. `MemoryCapabilityDescriptor`

### E. Host Integration Layer

负责把 memory semantics 接到宿主：

1. CLI
2. local orchestration service
3. future desktop / daemon / service host

## 5.2 模块依赖方向

建议固定为：

1. `runtime.memory-semantics` 导入 `contract.memory-provider.loading.v1`
2. `runtime.orchestration` 导入 memory semantics 导出的 recall/context contract
3. `runtime.memory-provider-loading` 不反向导入 memory semantics

这意味着：

1. provider loading 是底层装配 seam
2. memory semantics 是上层策略 seam
3. orchestration 是运行时 owner

## 6. 领域模型

### 6.1 逻辑层

当前代码里的真实 scope 仍然只有：

1. `normative`
2. `execution`
3. `session`

本方案不建议立刻推翻它们，而是增加更高阶逻辑层：

1. `working`
2. `session`
3. `workspace`
4. `user`
5. `normative_projection`

映射建议：

1. `working`
   - 由 orchestration/checkpointer 持有，不直接写入长期 store
2. `session`
   - 当前可继续映射到 `MemoryScope.SESSION`
3. `workspace`
   - 短期先通过受控 namespace 落到现有 substrate，后续再独立
4. `user`
   - 先作为模型和 contract 预留，不要求立刻实现
5. `normative_projection`
   - 只保存规范事实源的 projection，不替代规范文档

### 6.2 Memory Kind

建议冻结以下分类：

1. `semantic`
2. `episodic`
3. `procedural`
4. `artifact_reference`
5. `system_projection`

### 6.3 Memory Record Envelope

长期记忆建议使用统一 envelope：

```ts
export interface MemoryRecordEnvelope {
  memoryId: string;
  scope: string;
  layer: "session" | "workspace" | "user" | "normative_projection";
  memoryKind:
    | "semantic"
    | "episodic"
    | "procedural"
    | "artifact_reference"
    | "system_projection";
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

设计取向：

1. `sourceRefs`
2. `provenance`
3. `sensitivity`

这三类字段对治理型产品比 embedding 能力更关键。

## 7. 合同与服务设计

### 7.1 正式文档落点

后续真正 promotion 时，推荐的 final paths 仍以 `DA-204` 为准：

1. `runtime-memory-semantics/module-overview.md`
2. `runtime-memory-semantics/contracts/memory-recall-policy-contract.md`
3. `runtime-memory-semantics/contracts/memory-context-assembly-contract.md`
4. `runtime-memory-semantics/adrs/working-memory-and-canonical-source-boundary.md`

### 7.2 Memory Recall Service

建议接口：

```ts
export interface MemoryRecallService {
  recall(request: MemoryRecallRequest): Promise<MemoryRecallResult>;
  updateExecutionContext(
    request: MemoryContextUpdateRequest,
  ): Promise<MemoryContextUpdateResult>;
}
```

职责：

1. 按 request intent 做 recall planning。
2. 做 metadata filtering。
3. 输出 prompt-safe / execution-safe 的 memory slice。

### 7.3 Memory Promotion Service

建议接口：

```ts
export interface MemoryPromotionService {
  capture(request: MemoryCaptureRequest): Promise<void>;
  promote(request: MemoryPromoteRequest): Promise<MemoryPromoteResult>;
  merge(request: MemoryMergeRequest): Promise<MemoryMergeResult>;
}
```

职责：

1. 决定什么值得持久化。
2. 决定提升到哪一层。
3. 决定新增、合并还是丢弃。

### 7.4 Memory Record Repository

建议接口：

```ts
export interface MemoryRecordRepository {
  get(memoryId: string): Promise<MemoryRecordEnvelope | undefined>;
  put(record: MemoryRecordEnvelope): Promise<void>;
  query(request: MemoryRecordQueryRequest): Promise<MemoryRecordEnvelope[]>;
  archive(request: MemoryRecordArchiveRequest): Promise<number>;
}
```

职责：

1. 隔离 substrate/provider 差异。
2. 为 future service-backed / online gateway 预留 transport-neutral seam。

### 7.5 Working State Store

建议单独声明：

```ts
export interface WorkingMemoryStateStore {
  readThreadState(request: WorkingStateReadRequest): Promise<WorkingState | undefined>;
  writeThreadState(request: WorkingStateWriteRequest): Promise<void>;
  clearThreadState(request: WorkingStateClearRequest): Promise<void>;
}
```

意义：

1. 显式声明 working state 不属于长期 recall memory。
2. 避免 `core-memory` 被继续误用成“大一统状态仓”。

## 8. 关键流程

### 8.1 Recall Flow

执行前显式存在：

1. `queryRelevantMemory(context)`
2. `selectMemoryForContext(result)`
3. `updateExecutionContext(...)`

默认优先级建议：

1. execution short-term facts
2. session memory
3. workspace memory
4. user memory
5. normative projection

### 8.2 Promotion Flow

执行后采用：

1. capture candidate
2. classify by `memoryKind`
3. validate provenance / sensitivity / traceability
4. decide target layer
5. merge or persist

建议 promotion 判定条件：

1. 可复用
2. 可归属
3. 可追溯
4. 非敏感或已脱敏
5. 不与 canonical source 冲突

### 8.3 Never Persist 规则

默认不进入长期记忆：

1. 临时 tool output 全量原文
2. 一次性 scratch
3. 会伪装成 canonical source 的“事实副本”
4. 敏感或未脱敏内容

## 9. 与现有代码和模块的兼容策略

### 9.1 不把 `MemoryManager` 做成 God object

当前 `MemoryManager` 应继续保持 substrate manager 定位。

不建议继续往里塞：

1. recall planning
2. context assembly
3. promotion policy
4. online collaboration 语义

### 9.2 不扩坏 `MemoryStoreProvider`

当前 provider contract 保持简单是对的。

本方案不建议直接加入：

1. `semanticSearch`
2. `rerank`
3. `syncToCloud`
4. `shareWithUsers`
5. `resolveConflict`

如果未来需要，应通过 capability seam 增量扩展。

### 9.3 与 `runtime.memory-provider-loading` 的关系

provider loading 负责：

1. 选择哪个 provider
2. 确认能否安全加载
3. 输出稳定 machine-readable loading summary

memory semantics 负责：

1. 什么时候查
2. 取多少
3. 如何注入 context
4. 哪些内容允许持久化

### 9.4 与 `runtime.orchestration` 的关系

orchestration 继续负责：

1. graph runtime
2. host surface
3. checkpoint / thread recovery
4. execution ownership

它消费 memory semantics contract，但不自己定义一套独立 memory policy。

## 10. 分阶段落地

### Phase A：模块与 contract 冻结

目标：

1. 引入 `runtime.memory-semantics` 模块 skeleton
2. 冻结 module overview + 两份 contract + 一份 ADR
3. 接线 module registry / manifest / lifecycle registry

### Phase B：Recall / Context Assembly Baseline

目标：

1. 新增 `MemoryRecallService`
2. 在 runtime/service 中显式化 recall phase
3. 先用 metadata filtering 路径跑通

### Phase C：Promotion Baseline

目标：

1. 新增 `MemoryPromotionService`
2. 落地 `capture -> promote -> merge`
3. 明确 session/execution 到 workspace 的提升条件

### Phase D：Working-State Explicitness

目标：

1. 新增 `WorkingMemoryStateStore`
2. 正式分离 checkpoint / thread state / long-term recall

### Phase E：Capability 扩展

前四步稳定后再考虑：

1. semantic search
2. hybrid search
3. conflict resolution
4. remote sync

## 11. 当前 blocker

这份方案现在仍只能保持 `draft`，原因不变：

1. `runtime.memory-semantics` 还没有正式 module docs。
2. module registry / manifest 还没有接入新模块。
3. lifecycle registry 还没有切到新的 `target_module_ids`。
4. 还缺 review approval evidence。

因此当前正确动作不是直接 promotion，而是：

1. 先把模块 skeleton 建出来。
2. 再把 draft -> formal docs 的 promotion change set 做完整。

## 12. 与 supporting reference 的关系

`.repo-ai-governor/draft/memory-module-community-practices-and-design-reference.md` 现在应视为 supporting reference：

1. 用来解释为什么这个方向合理。
2. 用来记录外部实践如何映射到本仓库。
3. 不再充当主技术方案本体。

主技术方案应以本文件为准。

## 13. 一句话收口

`repo-ai-governor` 的 Memory 下一步不该继续沿着“更强的 provider”推进，而应正式建立一个新的 `runtime.memory-semantics` 模块，把 working-state boundary、recall policy、context assembly 和 promotion pipeline 独立出来，同时严格维持 provider loading、runtime orchestration 和 canonical source 的既有边界。
