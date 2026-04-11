# Root Bootstrap Truth And Archive Sidecar Boundary

- Status: active
- Date: 2026-04-11
- ADR ID: `adr.governance.normative-loading.root-bootstrap-truth.v1`
- Owner: architecture
- Module: `governance.normative-loading`

## 1. Context

1. root `normative-loading-manifest.yaml` 已出现持续增长压力，但仍承担 agent startup 的直接可读 bootstrap truth 角色。
2. 当前仓库已经通过 gate 与路径约束承认历史项应退出主执行面，但尚未把 manifest 自身的生命周期收缩正式化。
3. 直接切到 sqlite truth 或 active shard manifests 会把“catalog 膨胀问题”升级为“bootstrap truth cutover 问题”。

## 2. Decision

1. 当前 formal direction 只批准 `archive split + deprecated compact`。
2. root manifest 保持唯一 bootstrap truth。
3. archive manifest 只承载 `archived` catalog sidecar。
4. active sharding、`manifest_refs` 与 sqlite projection 全部 deferred 到独立 follow-up solution。

## 3. Consequences

1. 当前窗口可以先收缩 root manifest，而不引入多 active catalog merge/rollback 风险。
2. compact / archive-check tooling 会增加少量治理复杂度，但保留了 YAML diff 的审阅可读性。
3. 若后续仍要推进 active sharding，必须重新回答 parser、gate、rollback 与 canonical truth cutover 问题。
