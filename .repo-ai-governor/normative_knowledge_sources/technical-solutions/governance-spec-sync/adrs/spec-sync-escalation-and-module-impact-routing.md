# Spec Sync Escalation And Module Impact Routing ADR

- Status: active
- Date: 2026-03-26
- Module ID: `governance.spec-sync`
- ADR ID: `adr.governance.spec-sync.escalation-routing.v1`

## 1. Context

`project-003 / TK-026` 已把 Spec Sync Guard 接到 triad + brief 的统一门禁链路，但 sprint-001 之后模块 detail docs 已不再只有 contract 一种形态。sprint-002 需要把 ADR 细化文档纳入模块迁移，而不让 gate 把所有 detail doc 变化都误判为 exported contract drift。

## 2. Decision

1. `contract` detail docs 继续走 `exported_contract_change` 规则，至少要求同步 producer summary。
2. `adr` detail docs 默认走 `local_detail_change`，只输出推荐同步面，不直接阻断交付。
3. triad 全量同步仅在 `north_star_change / layer_boundary_change` 或显式升级时触发。

## 3. Consequences

1. 模块可以继续细化 ADR，而不会放大为全文级 triad blocking。
2. `docs-triad-sync` 必须输出 `change_kind`，而不仅是 `change_classification`。
3. `technical-solution-module-registry` 需要声明 typed detail docs，避免 gate 靠路径猜测全部语义。

## 4. Source Anchors

1. `project-003 / TK-026`
2. `DA-182`
