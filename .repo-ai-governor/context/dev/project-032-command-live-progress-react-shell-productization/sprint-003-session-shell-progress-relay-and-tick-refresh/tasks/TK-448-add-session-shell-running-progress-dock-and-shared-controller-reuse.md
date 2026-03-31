# TK-448 add session-shell running progress dock and shared controller reuse

- Status: completed
- Date: 2026-03-31
- Owner: AI-Agent
- Priority: P0
- Project: `project-032-command-live-progress-react-shell-productization`
- Sprint: `sprint-003-session-shell-progress-relay-and-tick-refresh`

## 1. 任务目标

为 session shell 新增正式的 running progress dock，并复用 shared progress controller / panel seam，而不是只依赖最终 transcript recap。

## 2. Depends On

1. `TK-447`

## 3. 预期产物

1. `CliSessionShellViewModel` running progress 字段
2. session-shell layout 对 `commandProgressPanel` 的渲染接入
3. shared controller output 与 session-shell dock 的适配层

## 4. 验证

1. `pnpm run build`
2. targeted Vitest covering session-shell progress dock rendering
3. `node ./scripts/governance/check-task-ledger-sync.js`
4. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 5. Execution Notes

1. 2026-03-31：任务创建，状态初始化为 `planned`。
2. 2026-03-31：新增 `CliSessionShellCommandProgressDock`，将 session-shell handoff 执行期间的 progress sink fan-out 到 shared `ReactCliCommandProgressController` 与可选 upstream relay，避免再造第二套 progress reduce 逻辑。
3. 2026-03-31：扩展 `CliSessionShellViewModel` 与 `ReactCliSessionShellApp`，正式接入 `commandProgressPanel`，让 direct/nested bridge progress rows、artifacts、logs 在当前 session shell 内渲染为 running dock。
4. 2026-03-31：补齐 interactive runner targeted coverage，验证 Ink session shell 在 `/doctor` direct bridge 执行期间会显示 shared running-progress dock，并在命令返回后回收 panel；同窗口 `pnpm run build` 通过。
