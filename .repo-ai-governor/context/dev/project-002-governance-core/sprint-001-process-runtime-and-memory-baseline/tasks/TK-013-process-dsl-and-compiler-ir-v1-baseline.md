# TK-013 Process DSL 与 Compiler IR v1 基线

- Status: completed
- Date: 2026-03-20
- Owner: AI-Agent
- Priority: P0
- Project: `project-002-governance-core`
- Sprint: `sprint-001-process-runtime-and-memory-baseline`

## 1. 任务目标

建立 Process DSL 与 Compiler IR v1 契约，并定义 `compiled-ir` 快照落盘与版本兼容基线。

## 2. Depends On

1. `TK-012`
2. `DA-018`
3. `DA-019`
4. `DA-003`

## 3. 预期产物

1. `DA-020` process compiler IR v1 baseline 文档。

## 4. Input References

1. `.repo-ai-governor/context/dev/project-001-foundation/sprint-002-workspace-and-upgrade/tasks/TK-012-sprint-002-exit-acceptance-and-rollback-baseline.md` (`DA-018`)
2. `.repo-ai-governor/context/dev/project-001-foundation/sprint-002-workspace-and-upgrade/tasks/TK-012-stage-2-input-readiness-checklist.md` (`DA-019`)
3. `.repo-ai-governor/context/dev/project-001-foundation/foundation-delivery-baseline-and-constraints.md` (`DA-003`)
4. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md` (`§4.2.2 Process Compiler IR 契约`)
5. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md` (`§5 目标仓库分层结构`)

## 5. 实施摘要

1. 新增 `packages/core-process` 包并建立 Process DSL/Compiler IR v1 契约结构：
   - `constants`：`ProcessNodeType`、`ProcessCompilerSeverity`、`ProcessCompilerIssueCode`、`PROCESS_IR_VERSION`、`COMPILED_IR_ROOT_SEGMENTS`。
   - `types`：`ProcessDslDefinition`、`ProcessDslNode`、`ProcessDslEdge`、`ProcessCompiledIr` 等接口。
2. 落地 `ProcessCompiler` 基线实现：
   - DSL 编译校验与结构化诊断（`compileWarnings/compileErrors`）。
   - Loop 节点强约束（`maxCycles` 与 `maxWallTimeSeconds` 必填且为正整数）。
   - IR 版本兼容校验（仅允许 `major=1`）。
   - `compiled-ir` 快照持久化到 `<workspace_root>/context/compiled-ir/<execution_id>.json`。
3. 扩展标准化错误码：
   - `PROCESS_COMPILER_IR_VERSION_UNSUPPORTED`
   - `PROCESS_COMPILED_IR_SNAPSHOT_PERSIST_FAILED`
4. 新增 `test/process-compiler.smoke.test.ts`，覆盖：
   - 合法 DSL 编译与快照落盘。
   - Loop 约束缺失阻断。
   - 图节点引用异常阻断。
   - IR 版本不兼容错误标准化输出。

## 6. 产出

1. `packages/core-process/package.json`
2. `packages/core-process/README.md`
3. `packages/core-process/src/constants/compiler-ir.constant.ts`
4. `packages/core-process/src/constants/index.ts`
5. `packages/core-process/src/types/aliases/process-dsl-globals.type.ts`
6. `packages/core-process/src/types/aliases/index.ts`
7. `packages/core-process/src/types/interfaces/process-dsl-node-limits.interface.ts`
8. `packages/core-process/src/types/interfaces/process-dsl-node.interface.ts`
9. `packages/core-process/src/types/interfaces/process-dsl-edge.interface.ts`
10. `packages/core-process/src/types/interfaces/process-dsl-definition.interface.ts`
11. `packages/core-process/src/types/interfaces/process-ir-node-limits.interface.ts`
12. `packages/core-process/src/types/interfaces/process-ir-node.interface.ts`
13. `packages/core-process/src/types/interfaces/process-ir-edge.interface.ts`
14. `packages/core-process/src/types/interfaces/process-compiler-issue.interface.ts`
15. `packages/core-process/src/types/interfaces/process-compiled-ir.interface.ts`
16. `packages/core-process/src/types/interfaces/index.ts`
17. `packages/core-process/src/types/index.ts`
18. `packages/core-process/src/process-compiler.ts`
19. `packages/core-process/src/index.ts`
20. `packages/shared/src/errors/error-code.constant.ts`
21. `test/process-compiler.smoke.test.ts`
22. `DA-020` `.repo-ai-governor/context/dev/project-002-governance-core/sprint-001-process-runtime-and-memory-baseline/tasks/TK-013-process-dsl-and-compiler-ir-v1-baseline.md`
23. `packages/core-process/src/types/interfaces/process-compiled-ir-snapshot.interface.ts`
24. `packages/core-process/src/types/interfaces/process-ir-node-snapshot.interface.ts`
25. `packages/core-process/src/types/interfaces/process-ir-edge-snapshot.interface.ts`
26. `packages/core-process/src/types/interfaces/process-compiler-issue-snapshot.interface.ts`
27. `packages/core-process/src/types/interfaces/process-ir-node-limits-snapshot.interface.ts`
28. `packages/core-process/src/types/interfaces/index.ts`
29. `packages/core-process/src/types/index.ts`
30. `packages/core-process/src/index.ts`
31. `packages/core-process/README.md`
32. `.repo-ai-governor/context/dev/project-002-governance-core/sprint-001-process-runtime-and-memory-baseline/code-review/resolved_review_tk-013-process-dsl-and-compiler-ir-v1-baseline.md`

## 7. 验证

1. `pnpm run test -- --maxWorkers=1 --maxConcurrency=1`
2. `pnpm run build`
3. `pnpm run check`

## 8. CR 复核修复记录

1. 基于 `review_tk-013-staged-code.md` 复核结果，已修复：
   - IR 快照持久化字段命名改为 `snake_case`（对齐技术方案 §4.2.2 草案字段契约）。
   - `ProcessDslNode` 类型声明改为可选字段并新增 `nodeType` required/invalid 显式校验，消除“类型契约与运行时校验不一致”。
2. `tasks.csv` 双记录问题保留为“执行记录追加模型”，通过 `check-task-ledger-sync` 的 canonical 最新记录策略管理，不执行历史行合并。
