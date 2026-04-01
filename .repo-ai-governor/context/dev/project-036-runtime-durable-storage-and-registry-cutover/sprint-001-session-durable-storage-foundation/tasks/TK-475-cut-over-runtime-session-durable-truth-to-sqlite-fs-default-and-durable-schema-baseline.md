# TK-475 cut over runtime session durable truth to sqlite-fs default and durable schema baseline

- Status: planned
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
