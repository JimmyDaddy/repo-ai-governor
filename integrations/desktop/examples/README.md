# Desktop Examples

当前 desktop 产品化基线只收敛一个正式候选：

1. desktop client 通过 `sidecar + ipc` 连接本地 orchestration service
2. desktop client 只消费 transport-neutral DTO / event stream
3. desktop client 不直接持有 runtime internals，也不旁路 artifact / recovery / HITL contract

示例文件：

1. `desktop-sidecar-runtime.sample.json`

该示例用于：

1. 固定 desktop surface 的默认 `runtimeMode`
2. 固定期望的 `serviceHostKind / serviceTransportKind`
3. 为 `check:desktop-entry-smoke` 和 release local verification 提供统一输入
