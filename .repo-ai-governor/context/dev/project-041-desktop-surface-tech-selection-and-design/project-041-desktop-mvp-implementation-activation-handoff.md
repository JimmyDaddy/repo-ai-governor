# project-041 Desktop MVP Implementation Activation Handoff

- Project: `project-041-desktop-surface-tech-selection-and-design`
- Status: completed
- Date: 2026-04-04
- Source Sprint: `sprint-001-codex-reference-research-and-shell-selection`
- Recommended Follow-Up Stream: `project-044-desktop-governance-console-mvp-foundation`

## 1. Handoff Verdict

1. 桌面端推荐方向已冻结为“`Electron + React + utility process sidecar` 驱动的 desktop governance console / agent cockpit”。
2. 下一条实现流应只承接 `.repo-ai-governor/draft/desktop-surface-technical-selection-and-design.md` 中建议优先落地的 `Phase 0 + Phase 1`，不把 `Phase 2+`、IDE/editor surface 或 Tauri reevaluation 混入首轮实现。
3. Desktop renderer 继续是 local orchestration service 的 client surface，不得升级为新的 runtime truth owner。

## 2. Scope To Activate Now

1. `Electron control shell`：main / preload / utility-process sidecar 启动链路、窗口生命周期与 typed IPC bridge。
2. `session bridge`：desktop 正式预留 `start / send / append / resume / list / subscribe session` 入口。
3. `shared presentation seam`：将 `AgentProjectionPanelViewModel` 从 `apps/cli` reference consumer 抽到 shared package，供 CLI 与 desktop 共用。
4. `governance console MVP panels`：workspace home、session lane/transcript continuity、execution timeline、HITL decision center、agent projection panel。
5. `desktop release smoke baseline`：utility-process restart、window wake、notification ownership 与 desktop entry smoke。

## 3. Activation Constraints

1. Desktop 只能消费 `@repo-ai-governor/orchestration-service-client` DTO / event contract 与 `integrations/desktop/README.md` 已冻结的 `sidecar + ipc` 基线。
2. 不允许 desktop renderer 直接读取 `.repo-ai-governor` 文件系统去绕过 service-owned artifact / review / transcript contract。
3. `review / artifact pane` 只有在 service-owned artifact query DTO 完成后才进入 MVP；在此之前只能保留 integration seam 与 gate，不得做 filesystem bypass。
4. `Phase 2: Review / Diff / Recovery`、`Phase 3: Optional Editor Surface` 与 `Phase 4: Reevaluate Tauri` 统一留作后续 follow-up，不在 `project-044` 中抢跑。

## 4. Proposed Execution Stream

1. Project: `project-044-desktop-governance-console-mvp-foundation`
2. Sprint 1: `sprint-001-shell-bootstrap-and-session-bridge-foundation`
3. Sprint 2: `sprint-002-governance-console-core-panels`
4. Sprint 3: `sprint-003-release-smoke-and-mvp-closeout`

## 5. Ownership Mapping

1. `desktop host / lifecycle / utility process`: Electron `main` process + desktop shell package。
2. `typed bridge / privilege boundary`: preload contract + IPC transport only。
3. `runtime truth / session / execution / HITL`: existing local orchestration service host。
4. `shared projection presentation`: extracted package-level `AgentProjectionPanelViewModel` seam。
5. `release packaging / restart smoke`: desktop entry smoke, release verification, and utility-process lifecycle checks.

## 6. Immediate Next Task Package

1. `TK-539 ~ TK-541`: freeze shell bootstrap boundary, implement utility-process desktop host bootstrap, validate session bridge + desktop smoke baseline。
2. `TK-542 ~ TK-544`: freeze panel contract, implement governance console core panels, add i18n/regression acceptance。
3. `TK-545 ~ TK-547`: freeze release/artifact gate baseline, implement lifecycle guards plus conditional artifact-query seam, and close out MVP evidence。

## 7. Deferred Items

1. richer artifact preview、execution/session reconnect、multi-workspace switch、parallel execution lane overview。
2. Monaco / editor workbench / plugin marketplace / full IDE fork。
3. Tauri reevaluation，直到 `service-host` 原生 sidecar、installer/cold-start 或平台分发成本成为主矛盾。

## 8. Evidence

1. `.repo-ai-governor/draft/desktop-surface-technical-selection-and-design.md`
2. `integrations/desktop/README.md`
3. `docs/support-matrix.md`
4. `.repo-ai-governor/context/dev/project-041-desktop-surface-tech-selection-and-design/plan.md`

## 9. Conclusion

1. `project-041` 的 planning 结论已达到可激活 handoff 标准。
2. 推荐下一条实现型 stream 直接从 `project-044 / sprint-001 / TK-539` 开始，而不是重新回到选型讨论。
