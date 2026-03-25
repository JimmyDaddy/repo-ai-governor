# Memory Provider 插件化技术方案（Draft）

- Status: draft
- Date: 2026-03-25
- Owner: AI-Agent
- Scope: `memory providers / CLI runtime / future local orchestration service / release packaging`
- Related Task: n/a

## 1. 目的

评估 `memory-providers` 是否应从当前的“CLI 内建全量依赖”模式，演进到“built-in registry + optional plugin”模式，并给出一套兼顾 CLI 与未来桌面端本地 orchestration service 的落地方案。

本文回答 4 个问题：

1. 当前 `fs-csv` / `sqlite-fs` 的接入方式存在哪些问题。
2. 是否应改成插件模式，以及推荐做到什么程度。
3. 对 CLI 和未来桌面端，本地 provider 解析应如何设计。
4. 如果落地，合理的迁移顺序是什么。

## 2. 当前状态

当前仓库里，memory provider 的抽象层已经存在，但选择与分发仍然是“半解耦、未插件化”：

1. `MemoryStoreProvider` 契约已经抽出到 `packages/memory-store-adapter`，provider 本身与 core runtime 的接口边界是干净的。
2. CLI 的 provider 选择入口集中在 `apps/cli/src/main.ts#composeMemoryStoreProvider()`。
3. 运行时层面已经有一部分 lazy-load：
   - `sqlite-fs` 只在 `storeEngine === sqlite_fs` 时动态加载。
4. 但产品与发布层仍把 provider 视为“内建集合”：
   - `MemoryStoreEngine` 仍是固定 enum，只允许 `fs_csv` / `sqlite_fs`
   - schema validator 只接受这两个值
   - `apps/cli/package.json` 直接依赖 `@repo-ai-governor/memory-provider-fs-csv` 和 `@repo-ai-governor/memory-provider-sqlite-fs`
   - release/build 脚本会把两个 provider 都镜像到 dist/runtime 产物中

因此，当前问题不是“完全静态加载两个 provider”，而是：

1. CLI 分发包默认携带两个 provider 的实现成本。
2. provider 扩展点没有产品级 contract。
3. 未来桌面端或独立 local orchestration service 仍会继承同样的“内建 provider 集合”假设。

## 3. 结论

结论是：应该做成插件模式，但不建议一步做成“完全无内建 provider”的开放系统。

推荐目标形态：

1. 保留 `fs-csv` 作为默认 built-in provider。
2. 将 `sqlite-fs` 从“CLI 默认内建依赖”降级为 optional built-in plugin 或独立安装插件。
3. 引入统一的 provider registry / loader，让 CLI 与未来 local orchestration service 共用同一套解析逻辑。
4. 在 Phase 1 先支持“内建 registry + lazy loading”，在 Phase 2 再放开“外部 provider module”。

一句话总结：

`memory provider` 应该演进为“默认内建最小集合 + 可选插件扩展”，而不是继续把实现列表硬编码在 CLI 和发布产物里。

## 4. 为什么值得做

### 4.1 当前模式的主要问题

1. 发布物膨胀
   - build/release 脚本会把 `fs-csv` 和 `sqlite-fs` 一起打包进 dist/runtime，即使默认场景只用 `fs-csv`。
2. 配置扩展性不足
   - `MemoryStoreEngine` 是 enum，schema 只允许固定值，新增 provider 必须修改 shared/config/CLI/release 多个层面。
3. CLI 与未来 desktop host 耦合过深
   - provider 解析逻辑目前放在 CLI 入口里，未来若 local orchestration service 独立成 daemon 或 sidecar，还得再复制一套解析规则。
4. 安全边界还没被正式定义
   - 当前没有“什么样的 provider module 可以被加载”的产品级治理规则。

### 4.2 插件化之后的收益

1. 默认分发更轻
   - 可把默认发行包收敛到 `fs-csv`，只在需要时安装 `sqlite-fs` 或其他 provider。
2. 扩展路径更稳定
   - 新 provider 不需要每次改 CLI 主包依赖和全局 enum。
3. CLI / desktop / daemon 语义统一
   - 同一套 registry/loader 可以服务终端和未来桌面端的本地 orchestration service。
4. release 与 clean-room 语义更清楚
   - 可以明确区分“默认内建可用能力”和“可选插件能力”。

## 5. 推荐架构

### 5.1 设计原则

1. `MemoryStoreProvider` 继续是唯一 provider contract。
2. provider 选择逻辑不再归属 CLI 入口，而是收敛到独立 provider loader。
3. CLI 与未来 local orchestration service 只消费“解析后的 provider instance”，不关心 provider 具体来自 built-in 还是 plugin。
4. 默认场景必须继续可离线、可 clean-room 工作。

### 5.2 目标分层

建议把 memory provider 解析链路收敛成：

1. `memory config`
2. `provider registry`
3. `provider loader`
4. `MemoryStoreProvider instance`
5. `MemoryStoreAdapter -> MemoryManager -> runtime/service`

### 5.3 推荐新增组件

建议新增一层独立组件，例如：

- `packages/memory-provider-registry`

职责：

1. 维护 built-in provider descriptor
2. 解析 legacy config 与 plugin config
3. 统一 dynamic import 和运行时接口校验
4. 向 CLI / local orchestration service 返回 `MemoryStoreProvider`

不建议继续把这些逻辑放在 `apps/cli/src/main.ts`。

## 6. 配置模型建议

### 6.1 兼容式演进

不建议直接删除现有 `storeEngine`。推荐兼容式演进：

```yaml
memory:
  storeRoot: context/memory
  storeEngine: fs_csv
  provider:
    id: fs-csv
    module: "@scope/custom-memory-provider"
    exportName: "createMemoryStoreProvider"
    options:
      retentionDays: 30
```

解析顺序建议为：

1. `memory.provider.module`
   - 视为显式插件模式
2. `memory.provider.id`
   - 先查 built-in registry，再查 allowlisted plugin registry
3. `memory.storeEngine`
   - 作为 legacy shortcut 回退
4. 默认值
   - `fs-csv`

### 6.2 为什么不建议只保留 `storeEngine`

1. `storeEngine` 只能表达固定集合，不能表达可扩展 provider。
2. 插件模式需要 module/export/options 这些附加字段。
3. 未来如果 desktop/local service 也要支持第三方 provider，enum 模式会成为持续阻碍。

## 7. Provider 加载契约建议

### 7.1 推荐导出形态

不建议要求外部插件导出一个固定构造函数类。更稳的是要求导出一个 factory：

```ts
export async function createMemoryStoreProvider(
  context: MemoryProviderLoadContext,
): Promise<MemoryStoreProvider>
```

推荐原因：

1. 减少对构造函数签名的耦合
2. 便于 future desktop/service 传入 host context
3. 更容易做运行时 contract 校验

### 7.2 Load Context 建议

建议 loader 传入：

1. `workspaceRoot`
2. `memoryStoreRoot`
3. `providerOptions`
4. `hostSurface`
   - `cli`
   - `local-orchestration-service`
5. `runtimeMode`
   - `embedded`
   - `daemon`

## 8. CLI 与桌面端形态

### 8.1 CLI

CLI 不再直接 import provider 实现包，而是：

1. 解析 memory config
2. 调用 provider loader
3. 获得 `MemoryStoreProvider`
4. 传给 `MemoryStoreAdapter`

### 8.2 未来 desktop / local orchestration service

未来桌面端不应在 renderer 层直接解析 provider。推荐形态：

1. provider loader 运行在 local orchestration service
2. desktop UI 只消费 service，不直接持有 provider 依赖

这样可以避免：

1. UI 直接执行本地插件代码
2. CLI 与 desktop 各自维护一套 provider 解析规则

## 9. 分发与发布策略

### 9.1 推荐默认发行策略

1. 主发行包默认只保证 `fs-csv` built-in 可用
2. `sqlite-fs` 改为 optional provider
3. release 校验要区分：
   - default distribution
   - plugin-enabled distribution

### 9.2 需要同步调整的脚本

1. `scripts/build/copy-runtime-assets.js`
2. `scripts/release/verify-local-distribution.js`
3. clean-room 本地安装验证脚本

否则即使运行时改成插件模式，产物仍会继续全量镜像 provider。

## 10. 安全与治理约束

### 10.1 不建议的方案

不建议允许配置里直接写任意 module specifier，然后无约束 `import()`。

原因：

1. 这会把“provider 配置”升级成“任意本地代码执行入口”。
2. clean-room / release / support matrix 很难治理。
3. 后续 desktop host 更难收权限边界。

### 10.2 推荐约束

1. Phase 1 仅允许 built-in registry
2. Phase 2 若开放外部插件，必须满足至少一个约束：
   - allowlist
   - 受控命名空间前缀
   - workspace-local relative path with explicit opt-in
3. loader 必须校验导出值是否满足 `MemoryStoreProvider` contract
4. 插件失败必须 fail-closed，并明确回报：
   - provider not found
   - provider export invalid
   - provider initialization failed

## 11. 推荐迁移路径

### 11.1 Phase 1：Built-in Registry

目标：先消除 CLI 对 provider 实现包的硬编码依赖。

范围：

1. 新增 provider registry / loader
2. `fs-csv` / `sqlite-fs` 变成 built-in descriptor
3. `composeMemoryStoreProvider()` 改为调用 loader
4. `apps/cli/package.json` 不再直接依赖 provider 实现包
5. release/build 只保留默认 built-in provider 分发语义

### 11.2 Phase 2：Optional Plugin Mode

目标：允许外部 provider module。

范围：

1. 扩展 config schema
2. 引入 provider module / export / options 解析
3. 加入 allowlist / prefix / path policy
4. 扩展 clean-room / examples / release gate

### 11.3 Phase 3：Service Reuse

目标：让 CLI 与 local orchestration service 共用同一套 provider loader。

范围：

1. provider loader 下沉到 service 可复用层
2. CLI 与未来 desktop host 都通过同一 loader/registry 解析 provider

## 12. 最终建议

最终建议如下：

1. 采用插件化方向。
2. 先做 built-in registry，再做外部 plugin。
3. `fs-csv` 保持默认 built-in provider。
4. `sqlite-fs` 不再作为 CLI 默认全量依赖，而改成 optional built-in plugin 或独立安装插件。
5. provider loader 应成为 CLI 与未来 local orchestration service 共用的基础设施。

一句话总结：

memory provider 应该从“CLI 内建固定实现列表”演进到“默认最小 built-in + 可选插件扩展”，这样才能同时解决分发体积、扩展性和未来桌面端复用的问题。

## 13. 参考

### 13.1 仓库内参考

1. `apps/cli/src/main.ts`
2. `apps/cli/package.json`
3. `packages/shared/src/constants/memory-store.constant.ts`
4. `packages/shared/src/types/interfaces/memory-runtime-config.interface.ts`
5. `packages/config/src/schema-validator.ts`
6. `packages/memory-store-adapter/src/types/interfaces/memory-store.interface.ts`
7. `scripts/build/copy-runtime-assets.js`
8. `scripts/release/verify-local-distribution.js`
9. `.repo-ai-governor/context/dev/project-014-langgraph-orchestration-runtime-adoption/sprint-002-langgraph-phase0-spike-and-service-shell/tasks/DA-151-sqlite-fs-checkpointer-and-shared-local-orchestration-service-shell-convergence.md`
10. `.repo-ai-governor/context/dev/project-014-langgraph-orchestration-runtime-adoption/sprint-002-langgraph-phase0-spike-and-service-shell/tasks/DA-152-sprint-002-exit-acceptance-and-sprint-003-input-constraints.md`
