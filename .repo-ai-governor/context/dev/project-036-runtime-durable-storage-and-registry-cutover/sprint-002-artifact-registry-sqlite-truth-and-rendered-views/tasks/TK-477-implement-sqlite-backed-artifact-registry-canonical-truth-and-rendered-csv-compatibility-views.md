# TK-477 implement sqlite-backed artifact registry canonical truth and rendered CSV compatibility views

- Status: completed
- Date: 2026-04-02
- Owner: AI-Agent
- Priority: P0
- Project: `project-036-runtime-durable-storage-and-registry-cutover`
- Sprint: `sprint-002-artifact-registry-sqlite-truth-and-rendered-views`

## 1. 任务目标

将 Artifact Registry / Archive Registry 的 machine-readable truth 切到 sqlite-backed registry，并把 `artifacts.csv / artifacts.archive.csv` 收敛为可重建的 rendered compatibility/export view。

## 2. Depends On

1. `TK-475`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-durable-storage/contracts/registry-and-ledger-projection-contract.md`

## 3. 预期产物

1. sqlite-backed main/archive artifact registry schema 与读写路径
2. `render` / `reconcile` / lifecycle gate 对 canonical registry 的消费改造
3. `artifacts.csv / artifacts.archive.csv` 的 render/export pipeline
4. canonical registry 与 rendered view 的一致性校验能力

## 4. 实施计划

1. 定义 artifact registry main/archive 的 sqlite schema、lifecycle state 与 dependency resolution baseline。
2. 将 registry runtime、lifecycle gate 与 reconciliation flow 切到 sqlite canonical truth。
3. 保留并改造 `artifacts.csv` 输出链，使其由 canonical registry render 生成。
4. 补齐 canonical/read-model/render-view 一致性校验与回归测试。

## 5. 验证

1. `node ./scripts/governance/check-artifact-registry-lifecycle.js`
2. `node ./scripts/governance/render-artifact-registry-view.js`
3. `pnpm run build`
4. 与 artifact registry runtime / lifecycle / reconcile 相关的定向测试集合

## 6. 执行记录

1. 2026-04-02：任务创建，状态初始化为 `planned`。
2. 2026-04-02：状态切换为 `active`，随 `sprint-002` 成为当前 primary planning surface；开始承接 artifact registry / archive registry 的 sqlite canonical truth 与 rendered CSV compatibility/export cutover。
3. 2026-04-02：完成第一块基础实现，`packages/artifact-registry` 新增 `SqliteArtifactIndexStore`、main/archive lifecycle scope 常量与定向单测，为后续治理脚本切到 sqlite canonical truth 提供包级基线。
4. 2026-04-02：完成治理脚本切换，`check-artifact-registry-lifecycle`、`reconcile-artifact-dependencies`、`compact-artifact-registry` 与 `render-artifact-registry-view` 已统一改读 sqlite canonical truth，并通过 rendered CSV compatibility view 回写主/归档 CSV。
5. 2026-04-02：补齐 temp-workspace 级 canonical bootstrap/render 回归与 render view 集成验证；真实执行 `render/check/reconcile --dry-run/compact --dry-run` 均已通过。
6. 2026-04-02：完成态验证通过，`pnpm run check` 全绿；`TK-477` 收口为 `completed`。
7. 2026-04-02：补齐 artifact registry guide/index/governance/code standards 对 sqlite canonical truth 的规范口径，并新增 `.gitignore` 中 sqlite `-wal/-shm` 忽略规则；`check-artifact-registry-lifecycle`、task/sprint sync gate 与 `pnpm run check` 再次通过。
