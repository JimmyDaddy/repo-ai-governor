# TK-164 `sidecar + ipc` orchestration host 与 transport 基线

- Status: planned
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

## 3. 预期产物

1. sidecar host、IPC transport、health/lifecycle baseline。
2. service/client contract 与本地进程化运行约束。
