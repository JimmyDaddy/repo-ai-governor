# sprint-001-doctor-progress-first-frame-fix 计划

- Status: completed
- Date: 2026-03-31
- Project: `project-034-session-shell-doctor-progress-first-frame-followup`
- Sprint Goal: 修复 session shell 对 `/doctor` 等快速 direct bridge 命令的首帧 progress 可见性，并补齐 targeted regression。

## 1. Task Package

1. `TK-462` render seeded running progress before direct bridge command execution blocks

## 2. Exit Criteria

1. `executePendingCommand()` 在 seeded running dock 建立后立即触发 active surface render。
2. direct bridge command 即使没有 nested progress event，也能在快照中看到 `Running progress` panel。
3. targeted Vitest 与 build 通过。

## 3. Milestones

1. 2026-03-31：创建 `sprint-001` 并将 `TK-462` 写入 task package。
2. 2026-03-31：完成 seeded running-progress first-frame fix，并通过 targeted Vitest、`pnpm run build` 验证。
