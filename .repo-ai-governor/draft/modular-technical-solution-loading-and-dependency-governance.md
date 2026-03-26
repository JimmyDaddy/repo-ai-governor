# 模块化技术方案按需加载与依赖治理方案（Draft）

- Status: draft
- Date: 2026-03-26
- Owner: AI-Agent
- Scope: `normative loading / technical solution modularization / dependency governance / spec sync`
- Related Task: n/a

## 1. 目的

为 `Repo AI Governor` 提供一套“技术方案分模块按需加载”的落地设计，解决随着模块数增长而出现的上下文膨胀问题，同时保证模块之间存在依赖时，执行面仍然能持续对齐产品北极星、架构边界与全局契约。

本文回答 5 个问题：

1. 为什么不应继续把所有模块细节堆进总技术方案。
2. 总纲、模块方案、契约文档分别应该承载什么内容。
3. 按需加载时，模块依赖应如何展开才不会导致上下文失控。
4. 当前 manifest / spec sync / gate 应怎样扩展，才能让分拆后的方案仍然可验证。
5. 这套模式应如何渐进落地，而不是一次性重写全部规范文档。

## 2. 当前问题

当前仓库已经具备两类有价值的基础设施：

1. `normative-loading-manifest.yaml`
   - 负责按 `tier / default_load / load_trigger` 管理规范文档的粗粒度加载分层。
2. `Spec Sync Guard`
   - 负责 triad + brief 的同步一致性校验。

但当前模式仍然存在一个明显缺口：

1. `repo-ai-governor-overall-technical-solution.md` 同时承担了：
   - 北极星设计总纲
   - 分层与边界说明
   - 全局运行时契约
   - 模块级实现细节容器
2. `manifest` 能表达“什么时候应该读哪份文档”，但不能表达：
   - 目标模块依赖哪些模块
   - 应加载依赖模块的 summary 还是 contract
   - 哪些变化会影响上游/下游模块
3. 一旦每个模块都把更多设计细节继续补进总纲，总纲会同时失去：
   - 启动时的可读性
   - 执行时的上下文可控性
   - 变更时的影响面清晰度

换句话说，当前缺的不是“再拆几篇 md”，而是“把技术方案拆分成可解析的模块图”。

## 3. 目标与非目标

### 3.1 目标

1. 让总技术方案回归“北极星索引 + 全局约束”角色。
2. 让模块方案成为真正可按需加载的 bounded context 视图。
3. 让模块依赖以 `contract-first` 方式展开，而不是全文级递归展开。
4. 让模块方案继续接受结构化门禁校验，而不是退回人工约定。
5. 让局部模块变更不再总是强制触发 triad 全量同步。

### 3.2 非目标

1. 不引入第二套与 `manifest` 冲突的文档事实源。
2. 不把所有模块方案做成超细粒度、按文件系统目录一一对应的碎片化文档。
3. 不让加载器通过无限递归依赖来掩盖错误的模块边界。
4. 不把 `draft` 直接升格为规范事实源；正式启用前仍需纳入 manifest 与 gate。

## 4. 结论

推荐采用“三层方案面 + 两层注册表 + contract-first 依赖展开”的模型。

### 4.1 三层方案面

1. `North Star / Global Invariants`
   - 由总技术方案承载。
   - 只保留产品主线、架构边界、全局不变量、跨模块公共契约、模块地图、升级规则。
2. `Module Overview`
   - 每个 bounded context 一份。
   - 承载模块职责边界、非目标、关键流程、依赖摘要、风险与迁移策略。
3. `Contract / ADR`
   - 承载模块对外暴露契约、关键决策、版本兼容与变更影响。

### 4.2 两层注册表

1. `normative-loading-manifest.yaml`
   - 继续作为仓库级规范文档登记与粗粒度加载入口。
   - 负责文档是否 active、属于哪个 tier、何时触发加载。
2. `technical-solution-module-registry.yaml`
   - 新增，作为模块级技术方案图谱事实源。
   - 负责模块 ID、依赖图、contract import/export、north star 对齐引用、局部加载策略。

### 4.3 核心原则

模块依赖默认只加载“对方导出的 contract 或 contract summary”，不默认加载“对方完整模块全文”。

这条规则是控制上下文规模的关键，也是避免执行偏离大方向的关键。

## 5. 推荐信息架构

建议把技术方案相关资产组织成如下结构：

```text
.repo-ai-governor/normative_knowledge_sources/
  repo-ai-governor-overall-technical-solution.md
  repo-ai-governor-architecture-and-repo-layering.md
  technical-solution-modules/
    technical-solution-module-registry.yaml
    governance-core/
      module-overview.md
      contracts/
        process-runtime-contract.md
        spec-sync-contract.md
      adrs/
        langgraph-runtime-decision.md
    memory-provider/
      module-overview.md
      contracts/
        provider-loader-contract.md
        provider-registry-contract.md
```

设计原则：

1. 总纲不再承载模块深度实现细节。
2. 模块 overview 面向“执行时理解模块”。
3. contract 文档面向“跨模块耦合与依赖解析”。
4. ADR 面向“为什么这么设计”，不承载常驻执行上下文。

## 6. 模块注册表设计

### 6.1 为什么单独做 registry

不建议把模块依赖图直接塞进 `normative-loading-manifest.yaml`。

原因：

1. `manifest` 当前职责已经明确，是仓库级规范文档加载清单。
2. 模块依赖图属于领域级语义，不是所有 normative doc 都需要的字段。
3. 将模块图单独放入 registry，更容易做依赖闭包解析、影响面分析和版本校验。

### 6.2 推荐字段

建议至少包含以下字段：

1. `module_id`
2. `status`
3. `owner`
4. `layer`
5. `summary_doc`
6. `detail_docs[]`
7. `north_star_refs[]`
8. `exports_contracts[]`
9. `imports_contracts[]`
10. `depends_on_modules[]`
11. `load_triggers[]`
12. `change_impact_policy`
13. `context_budget`

### 6.3 推荐结构示例

```yaml
schema_version: 1
generated_at: 2026-03-26
status: draft

modules:
  - module_id: governance.spec-sync
    status: active
    owner: architecture
    layer: governance-core
    summary_doc: .repo-ai-governor/normative_knowledge_sources/technical-solution-modules/governance-core/spec-sync/module-overview.md
    detail_docs:
      - .repo-ai-governor/normative_knowledge_sources/technical-solution-modules/governance-core/spec-sync/contracts/spec-sync-result-contract.md
    north_star_refs:
      - prd.docs-sync
      - overall.spec-sync-guard
      - arch.governance-core
    exports_contracts:
      - contract.spec-sync.result.v1
    imports_contracts:
      - contract.artifact-registry.lookup.v1
    depends_on_modules:
      - governance.artifact-registry
    load_triggers:
      - spec_sync_change
      - docs_contract_change
    change_impact_policy:
      local_detail_change: module_only
      exported_contract_change: sync_consumers_and_overall
    context_budget:
      default_mode: summary_plus_imported_contracts
      max_direct_dependency_depth: 1
```

## 7. 文档职责切分规则

### 7.1 总技术方案必须保留的内容

1. 产品主线与范围边界。
2. 分层视图与跨层依赖规则。
3. 全局运行时不变量。
4. 跨模块共享契约入口。
5. 模块地图与模块 ID 列表。
6. 什么类型的变化必须同步回写总纲。

### 7.2 总技术方案必须移出的内容

1. 单模块内部流程细节。
2. 单模块局部配置语义。
3. 模块内部迁移步骤。
4. 仅影响单模块的实现 trade-off。

### 7.3 模块 overview 必须包含的内容

1. `module_id`
2. 模块职责与非职责
3. 对齐的 `north_star_refs`
4. 依赖的模块与依赖原因
5. 导出的 contract 列表
6. 默认加载建议
7. 哪些变化属于 local detail，哪些属于 contract change

### 7.4 contract 文档必须包含的内容

1. `contract_id`
2. version
3. producer module
4. consumer modules
5. schema / state / lifecycle / compatibility
6. breaking change 判断规则

## 8. 按需加载算法

### 8.1 默认启动基线

默认仍保持现有 L0 启动面：

1. `current-context`
2. `normative-loading-manifest`
3. `product-requirements-brief`
4. `code_standards`
5. `long-term-maintenance-guide`

### 8.2 命中模块任务时的加载规则

当任务命中某个模块时，推荐按以下顺序扩张上下文：

1. 加载目标模块 `module-overview.md`
2. 加载目标模块导入的 direct dependency contracts
3. 若任务涉及 exported contract 修改，再加载 direct consumer 模块 overview
4. 若任务涉及层级边界或全局不变量，再加载总技术方案和架构文档对应章节

### 8.3 不应默认发生的事情

1. 不因为模块依赖存在，就自动加载依赖模块全文。
2. 不因为某模块引用总纲中的一个概念，就加载整个总纲全文。
3. 不因为依赖链存在第二层第三层节点，就继续无上限展开。

### 8.4 建议的硬性限制

1. 默认只展开一层 direct dependency。
2. transitive dependency 默认只加载 contract summary，不加载 detail docs。
3. 超过 `max_direct_dependency_depth` 时必须给出显式原因。

## 9. 模块依赖治理规则

### 9.1 依赖表达原则

1. 依赖应优先表达为 `imports_contracts`。
2. `depends_on_modules` 只说明“关系存在”，不代表“默认要读对方全文”。
3. 对于模块间的协作，优先以稳定 `contract_id` 表达，而不是直接依赖文件路径或章节标题。

### 9.2 依赖闭环处理

如果出现 `A -> B` 且 `B -> A` 的强依赖，不建议靠加载器递归处理。

推荐处理方式：

1. 抽出共享 contract 到独立模块。
2. 让 A/B 共同依赖 shared contract。
3. 把原本的双向依赖改为“实现依赖 contract，而不是实现依赖实现”。

### 9.3 边界错误的识别信号

以下情况通常说明模块边界设计有问题：

1. 两个模块经常需要互相加载全文才能理解。
2. 修改一个模块 contract 时，总是影响大量无关模块。
3. 某个模块同时承担三种以上责任族。
4. 文档拆分之后，依赖边仍然无法稳定表达。

## 10. 对现有门禁的扩展建议

### 10.1 manifest 继续负责的内容

1. active normative doc 全量登记
2. `tier / status / default_load / load_trigger` 合法性
3. triad 文档状态一致性

### 10.2 新增模块图门禁

建议新增 `check-technical-solution-module-graph.js`，至少校验：

1. `module_id` 唯一
2. `contract_id` 唯一
3. `summary_doc` / `detail_docs` 路径存在
4. `imports_contracts` 能解析到真实导出
5. 不存在未声明循环依赖
6. 每个模块都具备 `north_star_refs`
7. 模块 `layer` 与架构层级约束一致

### 10.3 Spec Sync Guard 扩展规则

当前 triad sync 规则适合总纲级文档，但不适合模块内部细节频繁演进的场景。

建议扩展为：

1. `local_detail_change`
   - 只要求同步目标模块文档与 registry
2. `exported_contract_change`
   - 要求同步 producer module、consumer module、必要时同步总纲相关章节
3. `north_star_change`
   - 强制同步总纲、架构文档与受影响模块 overview
4. `layer_boundary_change`
   - 强制同步架构文档与模块 registry

## 11. 与当前仓库术语体系的对齐

这套方案不引入新的治理语言，而是复用当前已有术语：

1. `Spec Sync Guard`
   - 从 triad-only 同步升级到 triad + module impact sync
2. `Artifact Registry / Dependency Resolver`
   - 模块方案 registry 可以视为“规范文档层的 dependency resolver”
3. `Standards Pack`
   - 可复用其“结构化事实源 -> 多视图渲染”的思路
4. `North Star / Layering`
   - 仍由总纲和架构文档承载，不被模块细节稀释

## 12. 渐进落地计划

### 12.1 Phase 1：建立最小骨架

1. 创建 `technical-solution-module-registry.yaml`
2. 从总纲中抽取 2 到 3 个复杂模块试点
3. 为试点模块建立 `module-overview + contracts`
4. 保持总纲只做轻量回链，不大改章节结构

### 12.2 Phase 2：接线门禁

1. 新增 `module graph gate`
2. 扩展 `Spec Sync Guard` 的 impact 分类
3. 对模块 registry 增加 smoke 测试与 schema 校验

### 12.3 Phase 3：接入执行面

1. 在任务分解或执行前，先解析目标模块
2. 输出“本次加载了哪些模块文档、为什么加载”
3. 将加载闭包写入审计结果，避免隐式上下文

## 13. 风险与缓解

### 13.1 风险

1. 文档数量增多，维护成本表面上会上升。
2. 如果拆分粒度过细，会得到新的碎片化问题。
3. 如果没有 gate，registry 很快会和真实文档漂移。
4. 如果 contract 边界定义不清，依赖加载仍然会失控。

### 13.2 缓解

1. 先按 bounded context 拆，不按目录拆。
2. 先试点复杂模块，不做全量迁移。
3. 让 registry 成为机器可检验事实源。
4. 强制 `contract-first`，禁止默认全文级依赖展开。

## 14. 最终建议

最推荐的路线不是“继续扩写总纲”，也不是“把总纲直接拆成很多零散 md”，而是：

1. 把总纲收敛成北极星索引。
2. 新增模块技术方案 registry。
3. 把模块依赖改成 contract-first 解析。
4. 用 gate 保证模块图、contract 链接和 north star 对齐不漂移。

如果后续要正式落地，建议优先试点这 3 类模块：

1. `memory provider / loader`
2. `governance spec sync / standards`
3. `runtime orchestration / langgraph adapter`

这三类模块既有明确边界，又具备真实依赖关系，足够验证整套“按需加载 + 依赖治理”方案是否成立。
