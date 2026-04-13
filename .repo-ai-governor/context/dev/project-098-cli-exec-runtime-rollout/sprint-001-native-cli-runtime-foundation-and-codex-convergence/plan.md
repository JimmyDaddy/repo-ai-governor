# sprint-001-native-cli-runtime-foundation-and-codex-convergence 计划

- Status: planned
- Date: 2026-04-13
- Project: `project-098-cli-exec-runtime-rollout`
- Sprint Goal: 建立 shared native `cli_exec` runtime、adapter-authored launch-plan seam 与 Codex lifecycle observer baseline。

## 1. Task Package

1. `TK-821` establish shared native cli_exec process runtime and adapter-authored resolved launch plan seam
2. `TK-822` project codex lifecycle observer partial-output and terminate-phase semantics onto the shared runtime
3. `TK-823` preserve adapter-owned entrypoint shell and process-tree policies while adding baseline launch diagnostics
4. `TK-824` sprint-001 exit acceptance and sprint-002 activation handoff

## 2. Exit Criteria

1. shared native `cli_exec` runtime 与 adapter-authored `resolved launch plan` seam 已稳定。
2. `Codex` 的 lifecycle observer、partial snapshot 与 `terminate_phase` 语义已不再是单 adapter 特例。
3. baseline launch diagnostics 已能诚实表达 ownership，而未把 adapter-specific authoring 吞进 shared runtime。

## 3. Milestones

1. 2026-04-13：作为 `project-098` 的第一阶段 execution surface 创建，当前保持 `planned`。
2. 2026-04-13：当前 sprint 只冻结 `shared runtime + Codex baseline`，不提前抢跑 cross-adapter cutover。
