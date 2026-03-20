# TK-023 Memory Store Engine 配置与 CLI 组装接入

- Status: completed
- Date: 2026-03-20
- Owner: AI-Agent
- Priority: P0
- Project: `project-002-governance-core`
- Sprint: `sprint-001-process-runtime-and-memory-baseline`

## 1. 任务目标

将 memory store engine（`fs_csv`/`sqlite_fs`）接入配置层与 CLI 组装层，支持通过配置选择 provider 并保持默认兼容行为。

## 2. Depends On

1. `TK-022`
2. `DA-023`

## 3. 预期产物

1. `DA-024` memory store engine config + CLI composition baseline 文档。

## 4. Input References

1. `.repo-ai-governor/context/dev/project-002-governance-core/sprint-001-process-runtime-and-memory-baseline/tasks/TK-022-sqlite-fs-memory-provider-baseline.md` (`DA-023`)
2. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`（`§4.1`、`§4.2.1`）
3. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md`（`§2`、`§7 Step 3`）

## 5. 实施摘要

1. 在 `packages/shared` 新增 memory 运行时契约与常量：
   - `MemoryStoreEngine`（`fs_csv/sqlite_fs`）
   - `DEFAULT_MEMORY_RUNTIME_CONFIG`
   - `MemoryRuntimeConfig`
2. 扩展 `packages/config` 契约与校验链路：
   - `GovernorConfig/GovernorProfile` 新增 `memory` 字段
   - `SchemaValidator` 新增 `validateMemory`，严格校验 `storeEngine` 枚举值
   - `ProfileResolver` 与 `UpgradeSchemaDiffService` 补齐 memory 合并与 clone 逻辑
3. 在 `apps/cli` 组装层接入 memory provider 选择：
   - 基于 `memory.storeEngine` 选择 `FsCsvMemoryStoreProvider` 或 `SqliteFsMemoryStoreProvider`
   - 统一解析 `memory.storeRoot` 绝对路径
   - CLI skeleton 输出增加 memory 组装结果字段（engine/root/provider）
4. 新增 `memory-store-config-and-cli-composition` smoke 覆盖：
   - 配置校验 + profile 合并
   - CLI 从 `governor.yaml` 读取 `sqlite_fs` 并组装对应 provider

## 6. 产出

1. `packages/shared/src/constants/memory-store.constant.ts`
2. `packages/shared/src/types/interfaces/memory-runtime-config.interface.ts`
3. `packages/config/src/types/interfaces/governor.interface.ts`
4. `packages/config/src/schema-validator.ts`
5. `apps/cli/src/main.ts`
6. `test/memory-store-config-and-cli-composition.smoke.test.ts`
7. `DA-024` `.repo-ai-governor/context/dev/project-002-governance-core/sprint-001-process-runtime-and-memory-baseline/tasks/TK-023-memory-store-engine-config-and-cli-composition-baseline.md`
8. `.repo-ai-governor/context/dev/project-002-governance-core/sprint-001-process-runtime-and-memory-baseline/review/verified_review_tk-023-memory-store-engine-config-and-cli-composition-baseline.md`

## 7. 验证

1. `pnpm run typecheck`
2. `pnpm run test -- memory-store-config-and-cli-composition.smoke.test.ts`
3. `pnpm run test -- cli-skeleton.smoke.test.ts`
4. `pnpm run check`

## 8. 执行记录

1. 2026-03-20：任务启动，状态切换为 `in_progress`。开始在 config schema/profile merge 与 CLI composition root 中接入 memory store engine 选择逻辑。
2. 2026-03-20：完成 config + CLI 组装接入并通过全量门禁，CR 复核结论“认可”，报告推进为 `verified_review_tk-023-memory-store-engine-config-and-cli-composition-baseline.md`。
