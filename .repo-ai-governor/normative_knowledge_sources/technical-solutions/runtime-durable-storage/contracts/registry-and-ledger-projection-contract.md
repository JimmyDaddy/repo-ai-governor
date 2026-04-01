# Registry And Ledger Projection Contract

- Status: active
- Date: 2026-04-02
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

## 3. Ledger Projection Contract

1. `tasks.csv` 当前继续作为 human-readable canonical source。
2. `tasks.csv` 可以并且应当拥有 sqlite projection/read-model，用于：
   - 查询
   - 统计
   - 审计读取
   - UI 检索
3. sqlite read-model 必须可由 `tasks.csv` 全量重建或增量同步，不得成为新的手工 truth 入口。
4. 当 machine-consumer 与 human ledger 同时存在时，consumer 应优先读取 sqlite projection，而不是重复实现 CSV 解析。

## 4. Boundary Rules

1. 仍承担 human-readable canonical source 责任的文件，不得在没有单独产品决策的情况下直接切为 sqlite 主真值。
2. 明显属于结构化索引/注册表的 surface，应优先评估切到 sqlite canonical truth。
3. rendered CSV view / sqlite projection 必须可重建、可校验，并保留来源事实链。
