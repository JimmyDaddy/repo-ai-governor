# TK-477 implement sqlite-backed artifact registry canonical truth and rendered CSV compatibility views

- Status: planned
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
