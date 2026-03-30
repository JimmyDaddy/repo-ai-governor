# sprint-003-smoke-gate-and-agent-view-presentation 计划

- Status: completed
- Date: 2026-03-30
- Project: `project-030-runtime-agent-projection-phase-2-productization`
- Sprint Goal: 强化 adopter smoke gate，并把 `agentView` presenter 升级到 CLI pretty / session shell surfaces。

## 1. Task Package

1. `TK-426` strengthen adopter onboarding smoke gate and external repo rehearsal automation
2. `TK-427` enrich agentView presenter in pretty and session-shell surfaces

## 2. Exit Criteria

1. 存在一个可重复执行的 adopter rehearsal automation，覆盖 `connect -> connect apply -> doctor --adapters -> verify --adapters -> run --dry-run --trace`。
2. smoke gate 会校验 candidate/apply artifacts、follow-up diagnostics 与 hard block 结果。
3. shared `agentView` presenter 可以在 pretty output 与 session-shell nested command summary 里稳定展示 `selected_by`、projection status、fallback reasons 与 capability gap。
4. 相关 tests、build evidence 与治理台账保持同步。

## 3. Milestones

1. 2026-03-30：建立 `sprint-003` planning surface，等待 `sprint-002` code path 落地后激活。
2. 2026-03-30：完成 `TK-426` 与 `TK-427`，落地 adopter smoke script、CLI/session-shell shared agentView presenter，并通过 targeted tests + `pnpm run build` + smoke run。
