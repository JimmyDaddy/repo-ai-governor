# sprint-001-activation-and-ink-input-baseline 计划

- Status: completed
- Date: 2026-03-30
- Project: `project-031-session-shell-ink-input-productization`
- Sprint Goal: 激活 Ink-owned input follow-up stream，并完成默认 cutover 前所需的 Ink runner/controller/live tree baseline。

## 1. Task Package

1. `TK-430` activate project-031 and sync Ink-input phase map
2. `TK-431` add Ink runner and controller baseline for session shell
3. `TK-432` mount session-shell app as live Ink tree and preserve stderr-only contract

## 2. Exit Criteria

1. `project-031` 的 plan / sprint / checklist / CSV / task cards 已建立并完成 current-context planned-stream 登记。
2. session shell 已具备 `CliSessionShellInkRunner` / `CliSessionShellInkController` 的实现骨架。
3. session-shell app 已可以作为 live Ink tree 挂载，并守住 `stderr-only` 输出边界。

## 3. Milestones

1. 2026-03-30：创建 `project-031` 与 `sprint-001`，锁定 `TK-430 ~ TK-432`。
2. 2026-03-30：激活 `project-031 / sprint-001`，开始实现 Ink runner/controller baseline 与 live session-shell mount seam。
3. 2026-03-30：完成 `CliSessionShellInkController` / `CliSessionShellInkRunner` / `ReactCliRunner.mountLiveSessionShell()` 基线，并通过 targeted tests 与 `pnpm run build`。
