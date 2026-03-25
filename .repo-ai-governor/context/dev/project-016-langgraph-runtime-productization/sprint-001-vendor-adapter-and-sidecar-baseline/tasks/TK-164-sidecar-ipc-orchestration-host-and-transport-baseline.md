# TK-164 `sidecar + ipc` orchestration host 与 transport 基线

- Status: completed
- Date: 2026-03-26
- Owner: AI-Agent
- Priority: P0
- Project: `project-016-langgraph-runtime-productization`
- Sprint: `sprint-001-vendor-adapter-and-sidecar-baseline`

## 1. 任务目标

将 `sidecar + ipc` 从 transport seam / smoke 级证据提升为正式本地 orchestration service host baseline。

## 2. Depends On

1. `TK-161`
2. `TK-162`
3. `DA-144`
4. `DA-151`
5. `DA-157`
6. `DA-160`
7. `DA-162`
8. `DA-163`

## 3. 预期产物

1. sidecar host、IPC transport、health/lifecycle baseline。
2. service/client contract 与本地进程化运行约束。

## 4. 实施结果

1. `orchestration-service-client` 已新增正式 `getHealth()` contract 与 `OrchestrationServiceLifecycleStatus`，使 embedded/sidcar host 都能暴露稳定的 health/lifecycle probe。
2. `core-orchestration-service` 已新增真实 Node IPC sidecar baseline：
   - `LocalOrchestrationServiceSidecarHost`
   - `LocalOrchestrationServiceSidecarClient`
   - sidecar request/response envelope
   - source-workspace loader + sidecar entry
3. sidecar host 当前通过 IPC 暴露：
   - `getHealth`
   - `start/get/list/subscribe/submitHitlDecision/recover`
   - owner-side `publishEvent/saveCheckpoint`
4. `apps/cli` 的 `CliOrchestrationServiceRuntime` 已支持可选 `sidecar_ipc` mode；在未提供自定义 provider 时，可以直接解析默认 sidecar owner。
5. 单测已覆盖：
   - embedded shell health probe
   - Node IPC sidecar integration
   - CLI runtime 默认 sidecar mode
