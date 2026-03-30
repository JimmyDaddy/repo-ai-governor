# Connect Apply And Projection Consumer Productization ADR

- Status: active
- Date: 2026-03-30
- Module ID: `runtime.agent-projection`
- ADR ID: `adr.runtime.agent-projection.connect-apply-and-projection-consumer-productization.v2`

## 1. Context

`runtime.agent-projection` v1 已完成 onboarding / projection / reporting 的核心 runtime seam，但 adopter 仍缺少从 candidate config 到 active config 的正式 apply 路径，也缺少更强的 projection presenter 与 UI consumer baseline。

## 2. Decision

1. 保留 `connect` 默认 non-mutating、analyze-first 的 candidate 生成语义。
2. 为 candidate config 引入显式 `diff/apply` follow-up surface，而不是让默认 `connect` 静默改写活动 `governor.yaml`。
3. 将 candidate diff / merge explain 视为第一类 companion artifact，而不是仅靠用户手工比对 YAML。
4. 将 `agentView` 从 JSON-only data surface 提升为 presenter-owned shared view model，供 CLI pretty、session shell 与后续 richer UI 共用。
5. 第一个正式 UI consumer 必须保持 transport-neutral，并继续消费 service-backed runtime / DTO，而不是旁路 runtime truth。

## 3. Consequences

1. adopter 获得更完整的 onboarding 闭环：candidate -> diff -> apply -> verify。
2. `connect` 默认安全边界得以保留，不会因为便捷性而牺牲活动配置的可审阅性。
3. projection presenter 与 UI consumer 可以演进，但不会成为新的 canonical source。
4. phase-2 implementation 将以 follow-up project 方式承接，而不是改写 project-028 的完成态真值。
