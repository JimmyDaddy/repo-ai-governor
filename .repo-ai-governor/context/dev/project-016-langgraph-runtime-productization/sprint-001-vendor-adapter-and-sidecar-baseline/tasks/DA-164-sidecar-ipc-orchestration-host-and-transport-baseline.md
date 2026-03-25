# DA-164 `sidecar + ipc` orchestration host 与 transport 基线

- Status: active
- Date: 2026-03-26
- Producer Task: `TK-164`

## 1. 结论

1. `project-016` 现在已经具备真实的 `sidecar + ipc` orchestration host baseline，不再只是 host/transport descriptor smoke。
2. `orchestration-service-client` 与 `core-orchestration-service` 的边界已进一步清晰：
   - client package 继续持有 transport-neutral DTO 与 health/lifecycle contract
   - core service package 负责 Node IPC sidecar host/client 的具体实现
3. CLI 侧已经可以通过 `sidecar_ipc` mode 解析默认 sidecar owner，为后续 desktop execution / packaging rollout 提供正式入口。

## 2. 本轮实现

1. `orchestration-service-client`
   - 新增 `OrchestrationServiceLifecycleStatus`
   - 新增 `OrchestrationServiceHealthResponse`
   - `OrchestrationServiceClient` 新增 `getHealth()`
2. `core-orchestration-service`
   - 新增 sidecar protocol 常量与 envelope types
   - 新增 `LocalOrchestrationServiceSidecarHost`
   - 新增 `LocalOrchestrationServiceSidecarClient`
   - 新增 source-workspace loader 与 sidecar entry
   - embedded shell 也已实现统一 `getHealth()`
3. `apps/cli`
   - 新增 `CliOrchestrationServiceRuntimeMode.SIDECAR_IPC`
   - `CliOrchestrationServiceRuntime` 新增 `getHealth()/dispose()`
   - runtime 在 sidecar mode 下可默认创建 Node IPC sidecar client

## 3. 本地进程化运行约束

1. sidecar 基线当前是“每个 workspace 一个本地 sidecar owner”。
2. source-workspace 运行形态通过 loader 解析 monorepo package specifier，保证源码态 child process 可真实启动。
3. built/published 运行形态优先消费 `.js` entry；只有在 dist entry 不存在时，才退回 source `.ts` entry。
4. 当前 sidecar 仍只承接 local execution owner contract，不扩张到独立 daemon/http。

## 4. 仍保留的边界

1. 本轮没有处理 desktop packaging/install/release gate；这留给 `TK-165`。
2. 本轮没有把 CLI 的全部默认路径切到 sidecar；只是把 sidecar owner 变成正式可用选项。
3. 本轮没有引入跨 workspace 守护进程治理；仍坚持单 workspace 本地 owner 边界。

## 5. 后续输入

1. `TK-165` 消费本产物，继续建立 desktop execution surface 与 service packaging/ops/release baseline。
2. `TK-166` 消费本产物，作为 sprint-001 exit acceptance 的 host/transport 正式证据。
