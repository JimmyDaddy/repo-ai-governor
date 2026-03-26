# Memory 模块技术方案（Draft）

- Status: draft
- Date: 2026-03-26
- Owner: AI-Agent
- Scope: `core-memory / memory-store-adapter / memory-provider-registry / recall-policy / future service reuse / future online collaboration`
- Related Inputs:
  - `.repo-ai-governor/draft/memory-module-community-practices-and-design-reference.md`
  - `.repo-ai-governor/draft/memory-provider-pluginization-technical-solution.md`
  - `.repo-ai-governor/context/dev/project-015-memory-provider-pluginization/plan.md`
  - `.repo-ai-governor/context/dev/project-015-memory-provider-pluginization/sprint-003-optional-plugin-mode-and-policy-hardening/tasks/DA-171-memory-provider-plugin-allowlist-and-registry-resolution-contract-baseline.md`
  - `.repo-ai-governor/context/dev/project-015-memory-provider-pluginization/sprint-003-optional-plugin-mode-and-policy-hardening/tasks/DA-172-cli-memory-provider-plugin-loader-cutover-and-dual-input-compatibility.md`
  - `.repo-ai-governor/context/dev/project-015-memory-provider-pluginization/sprint-003-optional-plugin-mode-and-policy-hardening/tasks/DA-174-sprint-003-exit-acceptance-and-sprint-004-service-reuse-input-constraints.md`

## 1. 目的

本方案的目标不是重新讨论“memory provider 要不要插件化”，这件事在 `project-015` 已经进入正式基线。

本方案解决的是更大的 Memory 模块问题：

1. 当前仓库已经有本地 memory substrate，但还没有完整的 memory policy / recall 语义层。
2. `project-015` 已完成 built-in registry、optional plugin mode 与 distribution 边界收口，下一步明确是 sprint-004 的 shared loader / service reuse。
3. 用户希望后续可以走向线上协同，因此当前方案既要服务本地 CLI / local orchestration service，也要为 future service-backed / online collaborative mode 预留正确的 seam。

一句话总结：

本方案把 Memory 模块收敛成“工作记忆 + 持久记忆 substrate + recall/promotion policy + capability 扩展 + canonical source 边界”的组合架构，而不是继续把所有语义堆进 `MemoryManager` 或 provider seam。

## 2. 当前状态

### 2.1 已经成立的基线

当前仓库已经有以下正式事实：

1. `packages/core-memory`
   - 提供 `MemoryManager`
   - 已支持 `normative / execution / session` 分层快照
2. `packages/memory-store-adapter`
   - 提供最小 provider contract：`read / write / query / snapshot / archive / dispose`
3. `packages/memory-provider-registry`
   - 已收口 built-in provider descriptor
   - 已支持 `provider.module / exportName / options`
   - 已收口 allowlist / prefix / path / module policy
4. `project-015 / sprint-003`
   - 已达到 `accept`
   - 已完成 CLI plugin loader cutover
   - 已冻结 sprint-004 service reuse 输入约束

### 2.2 当前缺口

当前还没有正式收口的部分是：

1. memory candidate 如何分类
2. 哪些内容属于 working memory，哪些属于 long-term memory
3. recall 何时发生，按什么顺序发生
4. prompt / execution context 注入的显式策略
5. promotion / summarization / retention 的规则
6. 为 future online collaboration 预留的 multi-tenant / visibility / conflict-resolution seam

所以当前状态可以定义为：

1. provider/pluginization 基线已存在
2. memory semantic layer 仍缺位

## 3. 设计目标

### 3.1 目标

1. 明确区分 working memory 与 long-term recall memory。
2. 保持 `MemoryStoreProvider` 简单，不把高级检索和协同语义塞进基础存储契约。
3. 在 `MemoryManager` 之上新增显式 recall/promotion policy 层。
4. 保持本地优先：CLI、embedded service、daemon service 都能复用同一套 memory loader / memory semantics。
5. 为未来线上协同预留 host-neutral seam，但不把云端细节提前固化进基础 provider。
6. 严守 canonical source 边界，memory 永远不是 `current-context` / task ledger / review lifecycle / normative docs 的替代品。

### 3.2 非目标

1. 本轮不把 memory provider 改造成通用向量数据库 SDK。
2. 本轮不把 canonical source 从 repo files 迁移到线上服务。
3. 本轮不承诺立即实现 semantic search / hybrid search。
4. 本轮不把所有运行时状态统一并入长期 memory store。
5. 本轮不实现完整的 online collaboration control plane。

## 4. 设计原则

### 4.1 Local-first, service-ready

默认运行模式仍以本地为准：

1. CLI embedded
2. local orchestration service
3. daemon mode

但所有接口设计必须允许未来平滑进入：

1. service-backed local host
2. online collaboration gateway

### 4.2 Substrate 与 semantics 分离

分离下面两件事：

1. provider / storage
2. recall / promotion / retrieval / update-context

换句话说：

1. `MemoryStoreProvider` 只解决“怎么存、怎么查”
2. `MemoryRecallService` 等语义层只解决“什么时候存、取什么、怎么注入”

### 4.3 Working state 与 long-term memory 分离

以下状态不能直接并入长期 memory：

1. node cursor
2. pending interrupt
3. in-flight artifacts
4. temporary stage outputs
5. thread-local execution scratch

这些状态属于：

1. checkpointer
2. working state store
3. orchestration service

### 4.4 Canonical source 不变

memory 可以是：

1. summary
2. projection
3. recall index
4. execution aid

memory 不可以是：

1. `current-context` 的唯一事实源
2. `tasks/checklist.md` 的唯一事实源
3. `tasks/tasks.csv` 的唯一事实源
4. review lifecycle 的唯一事实源
5. normative docs 的唯一事实源

## 5. 目标架构

## 5.1 分层总览

建议把 Memory 模块拆成五层。

### A. Canonical Source Layer

负责正式事实源：

1. `current-context`
2. task ledger
3. review lifecycle
4. normative docs
5. artifact registry

这层不属于 memory module。

### B. Working Memory Layer

负责当前执行的短周期状态：

1. thread state
2. execution scratch
3. pending interrupt
4. node cursor
5. temporary context assembly

建议落点：

1. `LangGraph` state
2. checkpointer
3. local orchestration service
4. future `WorkingMemoryStateStore`

### C. Memory Substrate Layer

负责确定性的持久层接口：

1. `MemoryStoreProvider`
2. `MemoryStoreAdapter`
3. `MemoryManager`
4. `MemoryProviderRegistry`

这是当前仓库已经基本具备的层。

### D. Memory Semantics Layer

负责策略与语义：

1. `MemoryRecallService`
2. `MemoryPromotionService`
3. `MemoryRecordRepository`
4. `MemoryCapabilityDescriptor`

这是当前最缺的一层。

### E. Host / Collaboration Layer

负责 host surface 与 future online seam：

1. `cli`
2. `local_orchestration_service`
3. `desktop`
4. `daemon`
5. future `OnlineCollaborationMemoryGateway`

## 5.2 推荐包落位

### 现有包保持

1. `packages/core-memory`
   - 保持为 substrate-facing manager
2. `packages/memory-store-adapter`
   - 保持为 provider contract
3. `packages/memory-provider-registry`
   - 保持为 provider resolution / plugin policy / lazy-load seam

### 建议新增包

1. `packages/core-memory-recall`
   - 负责 recall / update-context / retrieval planning
2. `packages/core-memory-promotion`
   - 负责 capture / promote / merge / retention / archive policy
3. `packages/core-working-memory`
   - 负责 thread/session/execution working state 的抽象层

如果不想立即拆成多个 package，短期也可以先在 `packages/core-memory/src/` 下建立以下子模块：

1. `recall/`
2. `promotion/`
3. `working-state/`
4. `repository/`

但中期仍建议拆包，避免 `core-memory` 演变成 God package。

## 6. 核心领域模型

### 6.1 Memory Layer

建议新增逻辑层枚举：

1. `working`
2. `session`
3. `user`
4. `workspace`
5. `normative_projection`

映射建议：

1. `working`
   - orchestration / checkpoint / thread state
2. `session`
   - 当前会话短期记忆
3. `user`
   - 用户偏好、风格、稳定约束
4. `workspace`
   - repo/team/shared memory
5. `normative_projection`
   - 对规范事实源的 recall projection

### 6.2 Memory Kind

建议新增 memory kind：

1. `semantic`
2. `episodic`
3. `procedural`
4. `artifact_reference`
5. `system_projection`

### 6.3 Memory Record Envelope

建议长期 memory 采用统一 envelope，而不是裸 `value + tags`：

```ts
export interface MemoryRecordEnvelope {
  memoryId: string;
  scope: string;
  layer: MemoryLayer;
  memoryKind: MemoryKind;
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
  tenantId?: string;
  visibility?: "private" | "workspace" | "project" | "shared";
  version?: number;
  updatedBy?: string;
  updatedAt: string;
  lastAccessedAt?: string;
}
```

说明：

1. `tenantId / visibility / version / updatedBy`
   - 是为后续线上协同预留的 host-neutral 字段
2. `sourceRefs / provenance`
   - 是治理型产品中最重要的审计字段
3. 不要求当前 provider 立刻全量支持这些字段的高阶语义
   - 但模型应该先固定下来

## 7. 接口设计

### 7.1 基础存储契约保持不变

当前 `MemoryStoreProvider` 保持：

1. `read`
2. `write`
3. `query`
4. `snapshot`
5. `archive`
6. `dispose`

本方案不建议直接往这里加：

1. `semanticSearch()`
2. `rerank()`
3. `share()`
4. `syncToCloud()`
5. `resolveConflict()`

### 7.2 建议新增的 repository seam

```ts
export interface MemoryRecordRepository {
  get(memoryId: string): Promise<MemoryRecordEnvelope | undefined>;
  put(record: MemoryRecordEnvelope): Promise<void>;
  query(request: MemoryRecordQueryRequest): Promise<MemoryRecordEnvelope[]>;
  archive(request: MemoryRecordArchiveRequest): Promise<number>;
}
```

职责：

1. 面向 memory record envelope
2. 隔离底层 store/provider 差异
3. 为 future online gateway 保留 transport-neutral seam

### 7.3 建议新增的 recall service

```ts
export interface MemoryRecallService {
  recall(request: MemoryRecallRequest): Promise<MemoryRecallResult>;
  updateExecutionContext(request: MemoryContextUpdateRequest): Promise<MemoryContextUpdateResult>;
}
```

最少输入建议：

1. `workspaceId`
2. `actorId`
3. `taskId?`
4. `projectId?`
5. `sprintId?`
6. `executionId?`
7. `sessionId?`
8. `queryIntent`
9. `limit`

职责：

1. 按 layer / kind / metadata 做 recall planning
2. 执行 metadata filter
3. 在 capability available 时执行 semantic / hybrid search
4. 生成 prompt-safe / execution-safe 的 recall result

### 7.4 建议新增的 promotion service

```ts
export interface MemoryPromotionService {
  capture(request: MemoryCaptureRequest): Promise<void>;
  promote(request: MemoryPromoteRequest): Promise<MemoryPromoteResult>;
  merge(request: MemoryMergeRequest): Promise<MemoryMergeResult>;
}
```

职责：

1. 决定什么内容进入长期 memory
2. 决定进入哪一层
3. 决定是新增、合并还是只留在 session / working state

### 7.5 建议新增的 working state store

```ts
export interface WorkingMemoryStateStore {
  readThreadState(request: WorkingStateReadRequest): Promise<WorkingState | undefined>;
  writeThreadState(request: WorkingStateWriteRequest): Promise<void>;
  clearThreadState(request: WorkingStateClearRequest): Promise<void>;
}
```

职责：

1. 对 working state 做显式抽象
2. 不再把“working memory”和“long-term memory”混成同一个概念
3. 为 future service reuse / daemon mode 提供共享 seam

## 8. 检索与注入流程

### 8.1 执行前 recall

建议在 runtime/service 中显式增加 recall phase：

1. `queryRelevantMemory(context)`
2. `selectMemoryForPrompt(result)`
3. `updateExecutionContext(...)`

推荐顺序：

1. execution short-term result
2. session memory
3. workspace memory
4. user memory
5. normative projection

只有 queryIntent 明确需要长程召回时，才进入 semantic / hybrid search。

### 8.2 执行中 working state

执行中状态只进入：

1. thread state
2. checkpointer
3. orchestration service working store

不直接 promote 到长期 memory。

### 8.3 执行后 promotion

执行后走显式 promotion pipeline：

1. capture candidate
2. classify by kind
3. decide target layer
4. dedupe / merge
5. persist or discard

推荐判定规则：

1. 可复用
2. 可归属
3. 可追溯
4. 非敏感或已脱敏
5. 不与 canonical source 冲突

## 9. Capability 设计

### 9.1 为什么要 capability，而不是把搜索硬塞进 provider

原因：

1. `fs-csv` 不应被逼着支持向量搜索
2. `sqlite-fs` 可能支持 richer retrieval，但那是增强能力，不是基础门槛
3. future online collaborative store 可能支持更强 search / merge / conflict-resolution

### 9.2 建议 capability 枚举

1. `metadata_query`
2. `semantic_search`
3. `hybrid_search`
4. `promotion_merge`
5. `conflict_resolution`
6. `remote_sync`

### 9.3 Capability Descriptor

```ts
export interface MemoryCapabilityDescriptor {
  supportedCapabilities: string[];
  consistencyHint: "strong" | "eventual" | "local-cache-preferred";
  distributionMode: "default" | "plugin-enabled" | "service-host";
}
```

## 10. 与当前项目现状的对齐

### 10.1 与 project-015 的关系

本方案不替代 `project-015`，而是站在其之上：

1. `project-015 / sprint-003`
   - 已完成 provider/plugin loader 基线
2. 本方案
   - 负责定义 memory semantic layer 的目标形态
3. sprint-004
   - 首先承接 shared loader / host surface / service reuse
   - 不应把 semantic recall / promotion 与 service reuse 一次性混做

### 10.2 与 DA-171 / DA-172 / DA-174 的兼容性

本方案必须遵守以下既有约束：

1. shared loader seam 必须继续复用 `@repo-ai-governor/memory-provider-registry`
2. `hostSurface` 仍需显式区分 `cli` 与 `local_orchestration_service`
3. `embedded` 与 `daemon` 仍需保留为正式 runtimeMode 输入
4. default distribution 与 plugin-enabled distribution 必须继续分离验证
5. 不得开放任意 module specifier

### 10.3 与 future online collaboration 的关系

如果未来要做线上协同，建议在当前方案基础上新增：

1. `OnlineCollaborationMemoryGateway`
2. `CanonicalSourceRepository`
3. `FileProjector`

而不是：

1. 修改 `MemoryStoreProvider` 变成云端大接口
2. 让 memory 层直接接管 canonical source

## 11. 承载方式演进

### 11.1 当前默认模式

1. repo-local files 作为 canonical source
2. local provider/store 作为 memory substrate
3. local orchestration service 作为 working-state owner

### 11.2 future service-backed mode

可以演进到：

1. service-backed canonical source repository
2. 本地 materialized file projection
3. local/remote dual-mode memory repository

但逻辑契约不变：

1. canonical source 仍是事实源
2. memory 仍是 projection / recall / aid

### 11.3 future online collaboration mode

建议仅在新一轮项目中进入：

1. tenant-aware memory repository
2. visibility / sharing policy
3. version / conflict resolution
4. remote sync / local cache coordination

## 12. 推荐落地顺序

### Phase 1：Sprint-004 Service Reuse

目标：

1. 共用 `memory-provider-registry`
2. 固化 `hostSurface / runtimeMode`
3. 让 CLI / local orchestration service 共用同一 loader seam

本阶段不做：

1. recall semantic layer 的完整实现
2. online collaboration

### Phase 2：Memory Semantic Layer Baseline

目标：

1. 新增 `MemoryLayer / MemoryKind / MemoryRecordEnvelope`
2. 新增 `MemoryRecordRepository`
3. 新增 `MemoryRecallService`

### Phase 3：Promotion Pipeline

目标：

1. 新增 `MemoryPromotionService`
2. 落地 `capture -> promote -> merge -> archive`
3. 明确 session -> workspace / user 的提升规则

### Phase 4：Working State Explicitness

目标：

1. 新增 `WorkingMemoryStateStore`
2. 将 thread state / checkpointer / working memory 的概念正式分离

### Phase 5：Capability Expansion

目标：

1. 在 capability seam 下增加 semantic / hybrid search
2. 不破坏基础 provider contract

### Phase 6：Online Collaboration

目标：

1. 增加 `tenantId / visibility / version / updatedBy`
2. 新增 online gateway / remote repository
3. 明确一致性、权限、冲突解决策略

## 13. 风险与防错

### 13.1 最大风险

1. 把 working state 和 long-term memory 混在一起
2. 把 canonical source 和 memory projection 混在一起
3. 把 provider seam 和 semantic/service seam 混在一起
4. 把本地模式和 future online collaboration 一次性混做

### 13.2 防错规则

1. `MemoryStoreProvider` 不新增协同 transport 细节
2. recall / promotion 走显式 service
3. canonical source 仍通过 repository/projector 层承载
4. service reuse 先于 online collaboration
5. capability 增量扩展，避免破坏现有 provider contract

## 14. 推荐下一步

如果基于当前项目状态继续推进，我建议下一步按下面顺序拆任务：

1. sprint-004 先做 shared loader / service reuse，不在同一轮混入 semantic recall
2. 新开一轮 memory semantic baseline 任务，冻结 `MemoryLayer / MemoryKind / MemoryRecordEnvelope`
3. 再开 recall/promotion 任务，把 `MemoryManager` 从“唯一 memory 入口”降级为 substrate manager
4. online collaboration 单独立项，不放进 `project-015` 的当前尾项里硬做

## 15. 一句话结论

当前仓库已经完成了 Memory 模块的 provider/pluginization 基线；下一步正确的方向不是继续做更重的 provider，而是补齐 `working state / recall policy / promotion pipeline / capability seam / collaboration-ready repository` 这几层，并且严格保持 canonical source 不被 memory 接管。
