# ADR: Sqlite-Fs Default Runtime Truth And Rendered CSV Views

- Status: active
- Date: 2026-04-04
- Module ID: `runtime.durable-storage`

## 1. Context

当前仓库已经暴露出两类问题：

1. 长时间运行的 session turn 在收尾阶段可能因为 file-backed whole-file rewrite 语义而失去 session continuity。
2. Artifact Registry 与多类 CSV surface 的事实边界仍不够清晰，容易把 machine-readable truth、rendered view 与 query read-model 混为一谈。

同时，仓库内已经具备：

1. `sqlite-fs` memory provider
2. `artifact-registry` runtime package baseline
3. `TK task card + checklist + tasks.csv` 的既有人类协作面

## 2. Decision

1. runtime session durable truth 的长期默认方向切到 `sqlite-fs`。
2. session durable storage 采用 `session summary + append-only session event log + diagnostics/projection` 模型。
3. Artifact Registry / Archive Registry 的长期 canonical truth 切到 sqlite-backed registry；CSV 只保留为 rendered compatibility/export view。
4. task ledger 的 canonical truth 切到 sqlite-backed ledger store；默认 canonical 路径收口为 `.repo-ai-governor/context/dev/sqlite/task-ledger.sqlite`，`tasks.csv` 退化为 rendered compatibility/export view，并允许仅在 migration/bootstrap 时从历史 CSV 补种 canonical rows。
5. `fs-csv` 长期降级为 export/debug/fallback，而不是 runtime durable truth。

## 3. Consequences

1. 长任务的 session 收尾不再依赖整份 session blob 回写。
2. `/resume` 与 replay 更容易建立在稳定 event log 之上。
3. Artifact Registry 的 machine-consumer 不再被迫直接解析 rendered CSV。
4. task ledger 的机器 consumer 不再被迫直接解析 `tasks.csv`，legacy sqlite 文件名与旧表名可在兼容窗口内自动迁移到 canonical naming，但人类协作仍可继续消费渲染后的 CSV 视图。
5. 工程交付可以有限分阶段，但目标架构不再以 CSV whole-file rewrite 为长期主线。
