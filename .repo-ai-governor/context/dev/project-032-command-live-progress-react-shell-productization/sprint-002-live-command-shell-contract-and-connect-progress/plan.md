# sprint-002-live-command-shell-contract-and-connect-progress 计划

- Status: planned
- Date: 2026-03-30
- Project: `project-032-command-live-progress-react-shell-productization`
- Sprint Goal: 落地 live command shell contract、running progress panel baseline，并让 `connect` 成为第一条 running-shell consumer。

## 1. Task Package

1. `TK-445` add live command shell contract and running progress panel baseline
2. `TK-446` instrument connect with progress events and cancellable running shell baseline

## 2. Exit Criteria

1. `CliGovernanceRuntime.execute(...)` 已具备可选 `progressSink + abortSignal` seam。
2. command-scoped React shell 已具备 `commandProgressPanel` running-state 展示能力。
3. `connect` 在执行期间可以展示至少一组可感知的 running progress / elapsed / artifact-ready 更新。
4. `stderr-only` live UI 与最终 `stdout` machine-readable payload 保持兼容。

## 3. Milestones

1. 2026-03-30：创建 `sprint-002` planning surface，锁定 `TK-445 ~ TK-446` 作为 accepted solution 的首轮 implementation tasks。
