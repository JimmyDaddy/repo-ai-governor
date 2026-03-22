# Code Review: TK-015 / TK-022 / TK-023 Memory 基线批量变更

- Status: review_pending
- Date: 2026-03-20
- Reviewer: AI-Agent
- Task: `TK-015`, `TK-022`, `TK-023`
- Review Type: staged code review（跨任务合并批量审查）
- Normative References:
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md` §4.2.1, §4.3
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md` §5, §6
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/context/dev/project-002-governance-core/plan.md`

## 1. Review Scope

本轮为 TK-015、TK-022、TK-023 三个任务的合并暂存区审查。各任务已分别完成单任务 CR 并推进为 `verified_review`，本轮重点关注**跨任务交叉问题**（如跨 provider 行为一致性、配置到运行时的贯通正确性）。

| 分类 | 文件数 | 说明 |
|---|---|---|
| `packages/memory-store-adapter/` 新增 | 5 | Provider 契约与 Adapter 统一封装 |
| `packages/memory-providers/fs-csv/` 新增 | 8 | 文件系统 + CSV 基线 provider |
| `packages/memory-providers/sqlite-fs/` 新增 | 8 | sqlite + fs 基线 provider |
| `packages/core-memory/` 新增 | 7 | Memory Manager 分层读写入口 |
| `packages/core-session/` 新增 | 7 | Shared Session 生命周期管理 |
| `packages/shared/` 修改/新增 | 5 | `GovernorErrorCode` 扩展、`MemoryStoreEngine` 常量、`MemoryRuntimeConfig` 类型 |
| `packages/config/` 修改 | 5 | memory 字段 schema 校验、profile merge、upgrade clone |
| `apps/cli/` 修改 | 1 | provider 组装与 CLI skeleton 输出 |
| `test/` 新增 | 3 | 3 组 smoke 测试 |
| `.repo-ai-governor/` 治理文档 | 8 | 任务卡、checklist、tasks.csv、artifacts.csv、plan.md、已验证 CR 报告 |

## 2. Findings

### 2.1 MEDIUM — `selectSnapshotRecords` 跨 provider 匹配语义不一致

- **位置**: `packages/memory-providers/fs-csv/src/fs-csv-memory-store-provider.ts` L409-L419 与 `packages/memory-providers/sqlite-fs/src/sqlite-fs-memory-store-provider.ts` L424-L432
- **现象**:
  - fs-csv 版本: `keySet.has(record.key) || keySet.has(\`${record.namespace}:${record.key}\`)`（接受纯 key 或 namespace:key 两种形式）
  - sqlite-fs 版本: `selectedKeys.has(\`${record.namespace}:${record.key}\`)`（仅接受 namespace:key 形式）
- **违反**: 技术方案 §4.2.1 第 3 条"上层仅依赖统一 Provider 契约"——同一 `snapshot(options)` 调用在不同 provider 下返回不同结果集。
- **风险**: 消费方传入 `recordKeys: ["prd:brief"]` 时，fs-csv 可能命中 key 为 `prd:brief` 的任意 namespace 记录；sqlite-fs 仅命中 `namespace=prd, key=brief` 的精确记录。切换 provider 后 snapshot 内容静默变化，可能导致回放/审计链路出现偏差。
- **建议**: 统一两个 provider 的 `selectSnapshotRecords` 匹配策略为同一语义（建议统一为 `namespace:key` 精确匹配，与 sqlite-fs 一致）。

### 2.2 MEDIUM — `shouldArchiveRecord` 跨 provider keys 匹配语义不一致

- **位置**: `packages/memory-providers/fs-csv/src/fs-csv-memory-store-provider.ts` L426-L449 与 `packages/memory-providers/sqlite-fs/src/sqlite-fs-memory-store-provider.ts` L439-L457
- **现象**:
  - fs-csv 版本: `options.keys.includes(record.key) || options.keys.includes(\`${record.namespace}:${record.key}\`)`（双重匹配）
  - sqlite-fs 版本: `!options.keys.includes(record.key)`（仅匹配 key）
- **违反**: 同 §2.1——同一 `archive(options)` 调用在不同 provider 下归档不同记录。
- **风险**: 消费方传入 `keys: ["brief"]` 时，fs-csv 归档 key 为 `brief` 的所有 namespace 记录；sqlite-fs 同样匹配 key `brief`，但二者在 `namespace:key` 形式上行为不对等。
- **建议**: 统一 keys 匹配策略。建议两个 provider 使用完全相同的匹配器函数签名，可考虑提取到 `memory-store-adapter` 层作为 shared utility。

### 2.3 MEDIUM — `FsCsvMemoryStoreProvider` 缺少初始化守卫，重复执行文件系统检查

- **位置**: `packages/memory-providers/fs-csv/src/fs-csv-memory-store-provider.ts` L360-L380
- **现象**: `ensureStorageInitialized()` 在每次 `readRecords/writeRecords/readSnapshotRows/readArchiveRows` 调用时都执行 `mkdir` + `existsSync` 检查。无状态缓存，每次操作均付出文件系统调用开销。
- **对比**: `SqliteFsMemoryStoreProvider` 使用 `initializationPromise` 模式确保初始化仅执行一次。
- **风险**: 高频读写场景下（如 session 高频 appendEvent），fs-csv 路径的 I/O 开销线性增长。
- **建议**: 对齐 sqlite-fs 的 `initializationPromise` 守卫模式，确保初始化逻辑仅执行一次。

### 2.4 MEDIUM — `SqliteFsMemoryStoreProvider` 缺少 `close()`/`dispose()` 资源释放

- **位置**: `packages/memory-providers/sqlite-fs/src/sqlite-fs-memory-store-provider.ts`
- **现象**: `DatabaseSync` 连接在构造后持续持有，无公开方法释放连接。
- **风险**: 在测试场景（每测试用例创建新 provider）或进程退出前，sqlite 连接不会被显式关闭，可能导致 WAL checkpoint 不触发或文件锁未释放。当前 smoke 测试使用 `rm -rf` 清理目录，掩盖了此问题。
- **当前可接受**: 基线阶段 provider 为短生命周期使用。
- **建议**: 在 `MemoryStoreProvider` 契约中预留可选 `dispose(): Promise<void>` 方法，并在 sqlite-fs 中实现 `database.close()`。

### 2.5 MINOR — `composeMemoryStoreProvider` 构建 provider 实例仅用于提取类名

- **位置**: `apps/cli/src/main.ts` L220-L250
- **现象**: `composeMemoryStoreProvider` 创建 `FsCsvMemoryStoreProvider` 或 `SqliteFsMemoryStoreProvider` 实例，然后仅通过 `provider.constructor.name` 提取类名。实际 provider 实例被丢弃，后续命令若需真正读写 memory，需要重新创建实例。
- **当前可接受**: skeleton 阶段 CLI 仅输出诊断信息，不执行实际 memory 操作。
- **建议**: 后续在命令正式接入 memory 操作时，将 provider 实例提升为 CLI composition root 的共享依赖，避免重复构建。

### 2.6 MINOR — `SchemaValidator.validateMemory` type cast 不严密

- **位置**: `packages/config/src/schema-validator.ts` L311-L350
- **现象**: `validateMemory` 在 `isPartial=false`（全量配置）模式下仅强制校验 `storeEngine`，不强制校验 `storeRoot`。返回对象通过条件展开构建，当 `storeRoot` 缺失时返回 `{ storeEngine }` 但外层 cast 为 `MemoryConfig`（`= MemoryRuntimeConfig`，要求 `storeEngine` + `storeRoot` 均存在）。
- **风险**: 类型 cast 在 `storeRoot` 缺失时不完全准确。下游 `resolveMemoryRuntimeConfig` 通过 spread `DEFAULT_MEMORY_CONFIG` 兜底，运行时无问题。
- **建议**: 要么在 validator 中将 `storeRoot` 也标记为 required（`isPartial=false` 时），要么将返回类型从 `MemoryConfig` 调整为 `Partial<MemoryConfig>` 以匹配实际行为，让 `resolveMemoryRuntimeConfig` 承担完整填充责任。

### 2.7 MINOR — DA-020 `consumed_by` 字段移除了 `TK-015` 引用

- **位置**: `.repo-ai-governor/context/artifact-registry/artifacts.csv` DA-020 行
- **现象**: DA-020 的 `consumed_by` 从 `TK-014|TK-015|TK-016` 变为 `TK-014|TK-016`，移除了 `TK-015`。但 TK-015 任务卡 §4 Input References 明确声明依赖 DA-020（`TK-013-process-dsl-and-compiler-ir-v1-baseline.md`）。
- **建议**: 确认 TK-015 是否仍消费 DA-020。若消费，恢复 `consumed_by` 中的 `TK-015`。

### 2.8 INFO — 跨包相对路径导入为现有仓库惯例

- **位置**: 全部新增包的 `import` 语句
- **说明**: `core-memory`、`core-session`、`memory-store-adapter`、`memory-providers/*` 均通过 `../../<package>/src/index.js` 相对路径跨包引用，与仓库既有惯例（`core-process`、`core-runtime`、`config`）一致。

## 3. 正面确认

以下方面跨三个任务联合验证，确认与规范文档一致：

1. **Provider 契约五能力全覆盖**: `read/write/query/snapshot/archive` —— fs-csv 与 sqlite-fs 均完整实现 `MemoryStoreProvider` 契约，与技术方案 §4.2.1 / §4.3 第 5 条对齐。
2. **Adapter 统一错误映射**: `MemoryStoreAdapter` 对全部 5 类操作统一 try/catch 并转换为 `RuntimeError` + `GovernorErrorCode` —— 符合 CS-022。
3. **三层记忆分层**: `MemoryScope.NORMATIVE/EXECUTION/SESSION` —— 与技术方案 §4.3 第 1-3 条对齐。
4. **共享会话生命周期**: `SharedSessionManager` 实现 `open/get/append/update/finalize/list` 并在关闭后阻断写入 —— 与技术方案 §6.5 (§4.3 #3) 对齐。
5. **会话状态枚举**: `SessionStatus.ACTIVE/COMPLETED/CANCELLED/FAILED` —— 与技术方案 §5.4 第 3 条中断态对齐。
6. **依赖方向全部合规**:
   - `memory-store-adapter` → 仅依赖 `shared` —— 符合架构 §6 第 4 条。
   - `memory-providers/*` → 仅依赖 `memory-store-adapter/shared` —— 符合 §6 第 5 条。
   - `core-memory` → 仅依赖 `memory-store-adapter` —— 符合 §6 第 8 条（不依赖具体 provider）。
   - `core-session` → 仅依赖 `core-memory/shared` —— 符合 §6 第 9 条。
   - `apps/cli` → 依赖 `config/shared/memory-providers/*` —— 符合 §6 第 1 条。
7. **Memory Store Engine 配置受枚举约束**: `MemoryStoreEngine.FS_CSV/SQLITE_FS` —— 符合 CS-009。
8. **配置 -> 运行时贯通正确**: `governor.yaml` → `SchemaValidator` → `ProfileResolver` → `resolveMemoryRuntimeConfig` → `composeMemoryStoreProvider` → CLI 输出。profile 合并与 upgrade clone 均已覆盖 memory 字段。
9. **默认值兜底健全**: `DEFAULT_MEMORY_RUNTIME_CONFIG`（`fs_csv` + `context/memory`）在配置缺失时自动填充，避免运行时空值。
10. **标准化错误模型**: 全部新增 9 个 `GovernorErrorCode`（MEMORY_STORE_* 5 个 + MEMORY_SESSION_* 4 个）—— 符合 CS-022。
11. **ESM 显式扩展名**: 所有相对导入均使用 `.js` 扩展名 —— 符合 CS-005。
12. **常量集中管理**: `MemoryScope`、`SessionStatus`、`MemoryStoreEngine`、`FS_CSV_*`、`SQLITE_FS_*` 均在 `src/constants/` 下 —— 符合 CS-009。
13. **类型治理**: 对象结构用 `interface`，类型别名用 `type`，分 `interfaces/` 目录管理 —— 符合 CS-011/CS-012/CS-013。
14. **OOP 设计**: `MemoryManager`、`SharedSessionManager`、`MemoryStoreAdapter`、两个 provider 均封装为类 —— 符合 CS-017。
15. **一文件一类**: 每个核心类独立文件 —— 符合 CS-018。
16. **JSDoc 全覆盖**: 全部导出类/方法及私有方法均有 JSDoc —— 符合 CS-016。
17. **文件命名规范**: kebab-case，后缀 `*.interface.ts/*.constant.ts` —— 符合 CS-013/CS-014。
18. **Smoke 测试覆盖**: 3 组测试（fs-csv 跨层、sqlite-fs 跨层、config+CLI composition）—— 覆盖 TK-015/TK-022/TK-023 DoD 基线要求。
19. **sqlite WAL 模式**: `PRAGMA journal_mode = WAL` —— 提升并发读性能，合理选型。
20. **sqlite 事务保护**: `runInTransaction` 使用 `BEGIN IMMEDIATE / COMMIT / ROLLBACK` —— 档案操作具备原子性。
21. **Session payload 结构化校验**: `parseSharedSessionPayload` 逐字段验证并抛出诊断信息 —— 存储损坏可快速定位。
22. **i18n 同步**: en-US 与 zh-CN skeleton 消息模板同步新增 `memoryStoreEngine/memoryStoreRoot/memoryStoreProvider` 字段。

## 4. Summary

| 严重度 | 数量 | 阻断交付 |
|---|---|---|
| SEVERE | 0 | — |
| MEDIUM | 4 | 否（§2.1-§2.2 跨 provider 语义不一致为行为风险，建议尽早修复；§2.3-§2.4 为性能/资源项，基线阶段可接受） |
| MINOR | 3 | 否 |
| INFO | 1 | 否 |

**结论**: TK-015 / TK-022 / TK-023 三任务联合交付的 Memory/Session/Store 基线架构设计合理，分层清晰（`shared → memory-store-adapter → provider → core-memory → core-session`），依赖方向全部合规，标准化错误模型统一，配置到 CLI 的贯通链路完整。22 项正面确认全部通过。

**阻断项**: 无。

**优先建议修复**: §2.1 和 §2.2 跨 provider 匹配语义不一致是跨任务交叉问题（个别任务 CR 不易发现），建议在合入前或紧跟补丁中统一 `selectSnapshotRecords` 和 `shouldArchiveRecord` 的匹配策略。

**后续改进**: §2.3（fs-csv 初始化守卫）、§2.4（sqlite-fs dispose）、§2.5（CLI provider 实例复用）、§2.6（validator type 精确性）可在后续迭代中逐步补齐。§2.7 建议确认后修复。

## 5. 复核结论（2026-03-20）

- 整体结论：**部分认可**。
- 阻断项：0。

### 5.1 逐条复核判定

1. §2.1 `selectSnapshotRecords` 跨 provider 语义不一致：**认可**，已修复。  
   - 修复结果：`fs-csv/sqlite-fs` 均统一为 `namespace:key` 作用域匹配。  
   - 变更文件：`packages/memory-providers/fs-csv/src/fs-csv-memory-store-provider.ts`、`packages/memory-providers/sqlite-fs/src/sqlite-fs-memory-store-provider.ts`。
2. §2.2 `shouldArchiveRecord` keys 匹配语义不一致：**认可**，已修复。  
   - 修复结果：两个 provider 归档 keys 均统一为 `namespace:key` 作用域匹配。  
   - 变更文件：同 §2.1。
3. §2.3 `FsCsvMemoryStoreProvider` 初始化守卫缺失：**认可**，已修复。  
   - 修复结果：新增 `initializationPromise` 与 `initializeStorage()`，避免重复初始化 I/O。  
   - 变更文件：`packages/memory-providers/fs-csv/src/fs-csv-memory-store-provider.ts`。
4. §2.4 `SqliteFsMemoryStoreProvider` 缺少资源释放：**认可**，已修复。  
   - 修复结果：在 `MemoryStoreProvider` 契约新增可选 `dispose?()`；`sqlite-fs` 实现显式 `close()`，`fs-csv` 提供 no-op 对齐实现；相关 smoke 测试加入 `dispose` 调用。  
   - 变更文件：`packages/memory-store-adapter/src/types/interfaces/memory-store.interface.ts`、`packages/memory-providers/sqlite-fs/src/sqlite-fs-memory-store-provider.ts`、`packages/memory-providers/fs-csv/src/fs-csv-memory-store-provider.ts`、`test/memory-session-store.smoke.test.ts`、`test/memory-sqlite-fs-provider.smoke.test.ts`。
5. §2.5 CLI provider 实例仅用于类名：**部分认可**，暂不改动。  
   - 结论：当前 skeleton 阶段行为可接受；后续命令真正消费 memory provider 时再将实例上提到 composition root 共享依赖。
6. §2.6 `validateMemory` type cast 不严密：**认可**，已修复。  
   - 修复结果：`GovernorConfig.memory` 调整为 `Partial<MemoryConfig>`，并同步 `SchemaValidator` 与 `resolveMemoryRuntimeConfig` 签名，消除“强制 cast 为完整结构”的不精确点。  
   - 变更文件：`packages/config/src/types/interfaces/governor.interface.ts`、`packages/config/src/schema-validator.ts`、`apps/cli/src/main.ts`。
7. §2.7 `DA-020` 移除 `TK-015` 依赖：**不认可（按当前生命周期规则应保持现状）**。  
   - 结论依据：当前 `artifacts.csv` 最后一列语义为“活跃依赖任务”，并受 `CS-023` 与生命周期门禁校验；`TK-015` 已完成，继续保留会触发 stale dependency 门禁失败。  
   - 处理：不恢复 `TK-015` 到 `DA-020` 的 `dependent_tasks`。
8. §2.8 跨包相对路径导入为仓库惯例：**认可**。  
   - 结论：保持现状。

### 5.2 复核命令与结果

1. `pnpm run typecheck`：通过。
2. `pnpm run test -- memory-session-store.smoke.test.ts memory-sqlite-fs-provider.smoke.test.ts memory-store-config-and-cli-composition.smoke.test.ts`：通过。
3. `pnpm run check`：通过。
