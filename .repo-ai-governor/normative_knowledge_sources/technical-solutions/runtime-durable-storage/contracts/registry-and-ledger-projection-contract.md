# Registry And Ledger Projection Contract

- Status: active
- Date: 2026-04-04
- Contract ID: `contract.runtime.registry-projection.v1`
- Producer Module: `runtime.durable-storage`

## 1. 目标

定义 machine-readable canonical registry 与 human-readable CSV view / projection read-model 的边界，避免把高频 registry truth 与低频 ledger view 混在同一类 CSV 持久化语义中。

## 2. Artifact Registry Contract

1. Artifact Registry / Archive Registry 的 canonical truth 应是 machine-readable durable backend；当前推荐默认值为 sqlite-backed main/archive registry。
2. `artifacts.csv / artifacts.archive.csv` 若继续存在，应视为 rendered compatibility/export view，而不是手工维护的独立 truth。
3. 生命周期状态仍保持：
   - main registry: `active/frozen/deprecated`
   - archive registry: `archived/retired`
4. dependency resolution、lifecycle gate、compact/reconcile/render 等机器链路应优先读取 canonical registry，而不是直接把 rendered CSV 作为唯一事实源。

## 3. Ledger Canonical Contract

1. task ledger 的 machine-readable canonical truth 应是 sqlite-backed ledger store；当前默认路径为 `.repo-ai-governor/context/dev/sqlite/task-ledger.sqlite`。
2. `tasks.csv` 若继续存在，应视为 human-readable rendered compatibility/export view，而不是手工维护的独立 truth。
3. 为兼容既有仓库，legacy sqlite 文件名 `task-ledger-projection.sqlite` 与 legacy table/index naming 允许在运行时自动迁移到 canonical naming。
4. migration/bootstrap 允许从既有 `tasks.csv` 一次性或按新增 source 补种 sqlite canonical rows，但同一 source 建立 canonical truth 后，后续 manual CSV drift 不得反向覆盖 sqlite。
5. 当 machine-consumer 与 human ledger 同时存在时，consumer 应优先读取 sqlite canonical truth，而不是重复实现 CSV 解析。

## 4. Boundary Rules

1. `TK task card` 仍是任务语义主源；sqlite canonical ledger 与 rendered `tasks.csv` 必须可由 `TK` 驱动的同步链稳定更新。
2. 明显属于结构化索引/注册表或 machine-consumer 高频读取的 surface，应优先评估切到 sqlite canonical truth。
3. rendered CSV view / sqlite canonical ledger 必须可重建、可校验，并保留来源事实链。
