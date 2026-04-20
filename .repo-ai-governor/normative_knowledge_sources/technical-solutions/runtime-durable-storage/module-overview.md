# Runtime Durable Storage Module Overview

- Status: active
- Date: 2026-04-16
- Module ID: `runtime.durable-storage`
- Owner: runtime
- Layer: `runtime-core`

## 1. 作用

负责把本地 runtime 的 durable truth、registry truth 与 projection/read-model 边界收敛为统一模块，避免继续把长生命周期 session、artifact registry 与 CSV 投影视图建立在整文件重写语义之上。

## 2. 职责边界

1. 定义 runtime session durable truth 的默认存储方向与最小事务语义。
2. 定义 `session metadata + append-only session event log + diagnostics/projection` 的持久化边界。
3. 定义 Artifact Registry / Archive Registry 的 machine-readable canonical truth 与 rendered CSV view 边界。
4. 定义 task ledger sqlite canonical truth 与 `tasks.csv` rendered view 的边界。
5. 定义 migration、rebuild、render 与 durability verification 的最小治理要求。
6. 为 delivery orchestration 提供 presenter-safe workflow summary、pending confirmation 与 artifact backlink projection，但不得把这些 projection 升格为新的 canonical lifecycle truth。

## 3. 非目标

1. 不负责 memory provider 的 allowlist、resolution priority 或 distribution truthfulness；这些继续由 `runtime.memory-provider-loading` 承担。
2. 不负责 recall policy、context assembly 或长期记忆语义；这些继续由 `runtime.memory-semantics` 承担。
3. 不替代 `current-context`、`review lifecycle`、`TK/CR task card / checklist` 等 human-readable canonical source。
4. 不拥有 orchestration runtime、interactive shell 或 UI presentation 状态机。

## 4. North Star References

1. `prd.multi-agent-orchestration`
2. `overall.graph-first-runtime`
3. `architecture.runtime-boundary`
4. `architecture.governance-boundary`

## 5. Imported Contracts

1. `contract.memory-provider.loading.v1`
2. `contract.runtime.session-main.delivery-orchestration.v1`

## 6. Exported Contracts

1. `contract.runtime.session-durable-storage.v1`
2. `contract.runtime.registry-projection.v1`
3. `contract.runtime.delivery-workflow-summary-projection.v1`

## 7. Loading Guidance

1. 命中 `runtime_contract_change`、`memory_provider_change`、`artifact_registry_change`、`ledger_sync_issue`、`governance_engine_change` 时加载。
2. 作为 direct dependency 时，优先只加载对应 contract。
3. 若问题涉及 sqlite-fs default cutover、append-only event log、rendered CSV view 或 ledger projection/read-model，应补载本模块 ADR。

## 8. Cutover Notes

1. 本模块定义的是长期目标架构与交付边界，不等于所有实现已在同一窗口完成。
2. runtime session durable truth 的目标方向是 `sqlite-fs + session summary + append-only session event log`，而不是整份 session blob 回写。
3. Artifact Registry / Archive Registry 的目标方向是 machine-readable sqlite canonical truth；`artifacts.csv / artifacts.archive.csv` 退化为 rendered compatibility/export view。
4. task ledger 的当前正式方向是 sqlite canonical truth + `tasks.csv` rendered compatibility/export view；机器 consumer 应优先读取 sqlite，而不是重复解析 CSV。
5. task ledger 的默认 canonical sqlite 文件名已收口为 `.repo-ai-governor/context/dev/sqlite/task-ledger.sqlite`；legacy `task-ledger-projection.sqlite` 与旧表名只保留自动迁移兼容职责。
6. `fs-csv` 可以继续存在，但其长期定位是 export/debug/fallback，而不是 runtime durable truth。
7. 截至 `2026-04-06`，在既有 registry / ledger projection 边界基础上，本模块进一步接受“provenance-aware review finding persistence”补充方向：`review/code_review_*`、`verified_code_review_*`、`resolved_code_review_*` 与配对 `CR-xxx` 继续是 canonical governance truth，但来源类型、规则标识与 round diagnostics 可以作为 durable projection 字段进入受治理持久化链路。
8. 截至 `2026-04-16`，在既有 session durable truth 与 projection 边界基础上，本模块进一步接受“delivery workflow summary / artifact backlink / pending confirmation projection”补充方向：deliver workflow 的当前 phase、selected target stream、related artifact paths、pending action 与 blocked reason 可以进入 durable projection，但 approved durable brief、technical-solution lifecycle、task ledger 与 review lifecycle 仍保持各自 canonical owner。

## 9. Detail Docs

1. Contract:
   - `contracts/session-durable-storage-contract.md`
   - `contracts/registry-and-ledger-projection-contract.md`
   - `contracts/delivery-workflow-summary-and-artifact-backlink-contract.md`
2. ADR:
   - `adrs/sqlite-fs-default-runtime-truth-and-rendered-csv-views.md`
