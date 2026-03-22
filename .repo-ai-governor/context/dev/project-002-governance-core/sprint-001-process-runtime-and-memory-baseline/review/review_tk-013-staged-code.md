# Code Review: TK-013 暂存区代码实现

- Status: review_pending
- Date: 2026-03-20
- Reviewer: AI-Agent
- Task: `TK-013`
- Review Type: staged code review
- Normative References:
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md` §4.2.2
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md` §5, §6
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/context/dev/project-002-governance-core/sprint-001-process-runtime-and-memory-baseline/tasks/TK-013-process-dsl-and-compiler-ir-v1-baseline.md`
  - `.repo-ai-governor/context/dev/project-002-governance-core/plan.md`

## 1. Review Scope

暂存区共涉及 32 个文件变更，按功能归类如下：

| 分类 | 文件数 | 说明 |
|---|---|---|
| `packages/core-process/` 新增 | 19 | Process DSL/Compiler IR v1 合约与编译器实现 |
| `packages/shared/` 修改 | 1 | 扩展 `GovernorErrorCode` |
| `test/` 新增/修改 | 5 | 新增 smoke test + 4 个现有 test 移除 vitest 显式导入 |
| `tsconfig*` / `vitest.config.ts` | 3 | vitest globals 配置变更 |
| `.repo-ai-governor/` 治理文档 | 4 | 任务卡、checklist、tasks.csv、artifact registry 更新 |

## 2. Findings

### 2.1 MEDIUM — tasks.csv TK-013 存在两条记录（数据完整性）

- **位置**: `.repo-ai-governor/context/dev/project-002-governance-core/sprint-001-process-runtime-and-memory-baseline/tasks/tasks.csv`
- **现象**: `TK-013` 同时存在 `exec-20260320-031`（status=`planned`）和 `exec-20260320-039`（status=`completed`）两行。原始 `planned` 行未被更新或标记废弃。
- **违反**: CS-021（canonical task cards / tasks.csv 必须同步一致）。
- **建议**: 将 `exec-20260320-031` 行更新为 `completed` 并与 `exec-20260320-039` 合并，或显式在原始行标记 `superseded`。

### 2.2 MEDIUM — vitest globals 配置变更超出 TK-013 任务范围

- **位置**: `tsconfig.json`, `tsconfig.test.json`, `vitest.config.ts`, 以及 4 个现有测试文件（`cli-skeleton.smoke.test.ts`, `i18n-runtime.smoke.test.ts`, `upgrade-schema-diff-service.smoke.test.ts`, `workspace-migration-service.smoke.test.ts`, `workspace-resolver.smoke.test.ts`）
- **现象**: 启用 `vitest/globals`（添加 `globals: true`、types 注入），并从已有测试文件删除 `import { describe, expect, it } from "vitest"`。此变更影响全局 TypeScript 类型空间与所有测试文件行为。
- **风险**: 超出 TK-013 定义范围（Process DSL 与 Compiler IR v1 基线），且修改了不属于 TK-013 产出清单的文件。若未来 vitest globals 引入类型冲突，回溯来源时不易定位。
- **建议**: 将 vitest globals 配置变更拆分为独立提交，或在 TK-013 任务卡中补充基础设施依赖变更说明。

### 2.3 MEDIUM — IR 快照持久化字段命名风格与技术方案草案存在偏差

- **位置**: `packages/core-process/src/types/interfaces/process-compiled-ir.interface.ts`、`process-compiler.ts` → `persistCompiledIrSnapshot()`
- **现象**: 技术方案 §4.2.2 定义的 IR 根对象字段使用 `snake_case`（`ir_version`, `process_id`, `execution_id`, `compiled_at`, `entry_node_id`）；代码实现使用 `camelCase`（`irVersion`, `processId`, `executionId`, `compiledAt`, `entryNodeId`）。IR 快照通过 `JSON.stringify` 直接落盘，磁盘文件中字段名即为 `camelCase`。
- **风险**: 技术方案与实际持久化产物的字段名不一致。后续模块（runtime/audit/replay）若按照技术方案文档字段名解析快照将失败。
- **建议**: 二选一——(a) 在技术方案 §4.2.2 中明确"TypeScript 实现层统一使用 camelCase，持久化 JSON 保持 camelCase"决策；(b) 或在序列化时添加 `snake_case` 映射层保持与技术方案一致。推荐方案 (a)，同步更新技术方案。

### 2.4 MINOR — `ProcessDslNode` 接口字段全部声明为必填，但编译器对其执行缺失检查

- **位置**: `packages/core-process/src/types/interfaces/process-dsl-node.interface.ts` + `packages/core-process/src/process-compiler.ts` → `compileNode()`
- **现象**: `ProcessDslNode` 中 `stageId`, `routeKey`, `roleProfileId`, `inputSchemaRef`, `outputSchemaRef`, `retryPolicyRef`, `timeoutPolicyRef`, `budgetPolicyRef` 均声明为 `string`（必填）。但 `compileNode()` 对每个字段执行 `(node.xxx ?? "").trim()` 并通过 `requireNodeField()` 报错。
- **矛盾**: 如果 TypeScript 类型已约束为必填 `string`，则运行时 `?? ""` 与缺失检查在类型系统内属于冗余防御。若实际调用方可能传入不完整对象（如外部 JSON 反序列化），应将这些字段标为可选（`?`）以匹配运行时行为。
- **建议**: 将 `ProcessDslNode` 的非结构性字段改为可选声明（`stageId?: string` 等），使类型契约与编译器校验逻辑一致。或者，若有意保持 strict 类型，添加注释说明"编译器同时处理未经类型校验的外部输入"。

### 2.5 MINOR — `persistCompiledIrSnapshot` 使用同步 I/O

- **位置**: `packages/core-process/src/process-compiler.ts` L156-L170
- **现象**: `mkdirSync` + `writeFileSync` 同步阻塞调用。
- **当前可接受**: 基线阶段产物，当前仅 smoke test 消费。
- **后续关注**: TK-014 runtime 接入后，编译与快照落盘将位于热路径，建议迁移为 `mkdir` + `writeFile` 异步版本，或由调用方在 worker 中隔离。

### 2.6 MINOR — `compiledAt` 取编译器本地时钟

- **位置**: `packages/core-process/src/process-compiler.ts` L107 → `formatRfc3339Seconds(new Date())`
- **现象**: 快照 `compiledAt` 使用 `new Date()` 取本地系统时间。
- **当前可接受**: 基线阶段仅本地执行。
- **后续关注**: 分布式/CI 场景下若多节点时钟偏移，快照时间语义可能不一致。后续迭代建议接入统一时间源或由调用方注入。

### 2.7 INFO — 跨包相对路径导入为现有仓库惯例

- **位置**: `packages/core-process/src/process-compiler.ts` L4 → `import ... from "../../shared/src/errors/index.js"`
- **说明**: 此导入路径与 `packages/config/` 中既有惯例一致（同样使用 `../../shared/...` 相对路径引用 shared 包）。架构蓝图 §6.2 标注 `internal` 包默认不对外暴露 programmatic API，当前跨包相对路径在 pnpm workspace 下可正常解析。
- **后续关注**: 当仓库启用 `package.json exports` 或包发布隔离时，需统一迁移为 workspace 协议导入（`@repo-ai-governor/shared`）。此项不阻断当前交付。

## 3. 正面确认

以下方面实现与规范文档一致，确认无偏差：

1. **IR 根对象最小字段完备**: `irVersion`, `processId`, `executionId`, `compiledAt`, `entryNodeId`, `nodes[]`, `edges[]`, `globals`, `compileWarnings[]`, `compileErrors[]` —— 与技术方案 §4.2.2 完全对齐。
2. **节点最小字段完备**: `nodeId`, `stageId`, `nodeType`, `routeKey`, `roleProfileId`, `inputSchemaRef`, `outputSchemaRef`, `retryPolicyRef`, `timeoutPolicyRef`, `budgetPolicyRef` —— 与技术方案一致。
3. **编译诊断契约完备**: `errorCode`, `severity`, `message`, `location`, `suggestion` —— 与技术方案 §4.2.2 第 4 条对齐。
4. **Loop 节点强约束落地**: `maxCycles` 与 `maxWallTimeSeconds` 必填且为正整数，非 loop 节点声明 limits 产生 warning。
5. **IR 版本兼容阻断**: `assertIrVersionCompatibleOrThrow` 按主版本阻断，使用标准化 `RuntimeError` + `GovernorErrorCode`。
6. **快照持久化路径**: `<workspace_root>/context/compiled-ir/<execution_id>.json` —— 与技术方案 §4.2.2 第 5 条一致。
7. **文件命名规范**: 全部使用 kebab-case，接口文件 `*.interface.ts`，类型别名 `*.type.ts`，常量 `*.constant.ts` —— 符合 CS-013/CS-014。
8. **JSDoc 覆盖**: 所有导出类/方法及私有方法均有 JSDoc 注释，包含 purpose、参数语义、返回值 —— 符合 CS-016。
9. **标准化错误模型**: 使用 `RuntimeError`/`GovernorErrorCode` 且新增错误码经 `packages/shared` 统一注册 —— 符合 CS-022。
10. **ESM 显式扩展名**: 所有相对导入均使用 `.js` 扩展名 —— 符合 CS-005。
11. **常量集中管理**: `ProcessNodeType`/`ProcessCompilerSeverity`/`ProcessCompilerIssueCode` 使用 enum 集中定义 —— 符合 CS-009。
12. **类型治理**: 对象结构用 `interface`，组合类型用 `type`，分目录管理 —— 符合 CS-011/CS-012/CS-013。
13. **OOP 设计**: `ProcessCompiler` 封装为类，行为内聚 —— 符合 CS-017/CS-018。
14. **Smoke 测试覆盖**: 4 个测试用例覆盖合法编译+快照落盘、Loop 约束缺失、节点引用异常、IR 版本不兼容 —— 覆盖 TK-013 DoD 要求。
15. **Artifact Registry 登记**: `DA-020` 正确登记，依赖链路声明 `TK-014|TK-015|TK-016`。
16. **依赖方向合规**: `core-process` 仅依赖 `shared` —— 符合架构 §6 约束。

## 4. Summary

| 严重度 | 数量 | 阻断交付 |
|---|---|---|
| SEVERE | 0 | — |
| MEDIUM | 3 | 否（建议在合入前修复 §2.1，§2.2/§2.3 可作 follow-up） |
| MINOR | 3 | 否 |
| INFO | 1 | 否 |

**结论**: TK-013 核心实现（Process DSL 契约、Compiler IR v1、编译器校验、快照持久化、标准化错误模型）与技术方案 §4.2.2 及架构蓝图高度对齐，代码规范符合 `code_standards.md` 全部适用条款。无阻断性问题。建议在合入前处理 §2.1（tasks.csv 重复行），§2.2 和 §2.3 可作为 follow-up 处理。
