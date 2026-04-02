# TK-475 cut over runtime session durable truth to sqlite-fs default and durable schema baseline

- Status: completed
- Date: 2026-04-02
- Owner: AI-Agent
- Priority: P0
- Project: `project-036-runtime-durable-storage-and-registry-cutover`
- Sprint: `sprint-001-session-durable-storage-foundation`

## 1. 任务目标

将 runtime session durable truth 的默认存储方向切到 `sqlite-fs`，并建立满足 `runtime.durable-storage` contract 的 session durable schema / transaction baseline。

## 2. Depends On

1. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-durable-storage/module-overview.md`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-durable-storage/contracts/session-durable-storage-contract.md`
3. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-memory-provider-loading/module-overview.md`

## 3. 预期产物

1. 默认 runtime memory engine 切换方案
2. `sqlite-fs` session durable schema baseline
3. provider/distribution/doctor/verify 需要感知的新默认语义清单
4. session cutover migration seam baseline

## 4. 实施计划

1. 审视当前 `fs-csv` 与 `sqlite-fs` provider 的默认装配点、distribution truth 与 doctor/verify 语义。
2. 定义或落地 `sessions + session_events + session_diagnostics` 的最小 durable schema。
3. 将 runtime session durable truth 的默认 engine 切到 `sqlite-fs`，并为旧工作区保留明确 migration seam。
4. 同步 provider loading、distribution truth、doctor/verify expectation 与相关文档/诊断语义。

## 5. 验证

1. `node ./scripts/governance/check-docs-triad-sync.js`
2. `node ./scripts/governance/check-normative-loading-manifest.js --mode block`
3. `node ./scripts/governance/check-task-ledger-sync.js`
4. `pnpm run build`
5. 与 memory/provider/session durable truth 相关的定向测试集合

## 6. 执行记录

1. 2026-04-02：任务创建，状态初始化为 `planned`。
2. 2026-04-02：状态切换为 `active`，开始梳理 `sqlite_fs` 默认切换、provider distribution truth、doctor/verify expectation 与 session durable schema baseline 的第一阶段实现边界。
3. 2026-04-02：完成第一批默认切换实现：`packages/shared` 默认 memory engine 改为 `sqlite_fs`，`memory-provider-registry` 与 runtime asset copy 将 `sqlite-fs` built-in distribution mode 提升为 `default`，release/cleanroom/examples 验证脚本的默认 repo-local config 与 expectation 也一并切到 `sqlite-fs`。
4. 2026-04-02：定位并修复 `sqlite-fs` provider 的 key-prefix query 回归；根因是 sqlite `LIKE ... ESCAPE` 子句写入了两个字符的 escape expression，导致 `run` 结束后读取 execution audit records 时抛出 `MEMORY_STORE_QUERY_FAILED`。已修复 provider SQL，并补上 unit/integration coverage。
5. 2026-04-02：本轮验证通过：`pnpm exec biome check packages/memory-providers/sqlite-fs/src/sqlite-fs-memory-store-provider.ts packages/memory-providers/sqlite-fs/test/sqlite-fs-memory-store-provider.unit.test.ts test/memory-sqlite-fs-provider.integration.test.ts scripts/examples/check-examples-runtime.js scripts/release/verify-cleanroom-local-install.js scripts/dev/debug-cleanroom-session-shell.js`；`/opt/homebrew/bin/node ./node_modules/vitest/vitest.mjs run packages/memory-providers/sqlite-fs/test/sqlite-fs-memory-store-provider.unit.test.ts test/memory-sqlite-fs-provider.integration.test.ts --maxWorkers=1 --maxConcurrency=1`；`pnpm run build`；`node ./scripts/examples/check-examples-runtime.js`；`node ./scripts/release/verify-local-distribution.js`；`node ./scripts/release/verify-cleanroom-local-install.js --modes path --iterations 1`。
6. 2026-04-02：补齐最终验证闭环：`node ./scripts/governance/check-docs-triad-sync.js`、`node ./scripts/governance/check-normative-loading-manifest.js --mode block`、`node ./scripts/governance/check-task-ledger-sync.js`、`/opt/homebrew/bin/node ./node_modules/vitest/vitest.mjs run packages/memory-providers/sqlite-fs/test/sqlite-fs-memory-store-provider.unit.test.ts test/memory-sqlite-fs-provider.integration.test.ts packages/core-session/test/shared-session-manager.unit.test.ts test/memory-session-store.integration.test.ts packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts apps/cli/test/runtime/session-shell-transcript-store.test.ts apps/cli/test/runtime/session-shell-runner.test.ts apps/cli/test/runtime/react-cli-runner.test.ts --maxWorkers=1 --maxConcurrency=1`、`pnpm run build`、`node ./scripts/examples/check-examples-runtime.js`、`node ./scripts/release/verify-local-distribution.js`、`node ./scripts/release/verify-cleanroom-local-install.js --modes path --iterations 1` 全部通过。
7. 2026-04-02：任务切换为 `completed`；`sqlite-fs` 已成为 runtime session durable truth 的默认 engine，distribution/doctor/verify/examples/cleanroom 语义已对齐，且当前 `SharedSessionManager` 提供的 `session summary + append-only event records + diagnostic projection` 已满足 contract 所要求的等价 `sessions + session_events + session_diagnostics` schema/transaction baseline。
