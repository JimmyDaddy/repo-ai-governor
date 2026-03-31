# sprint-002-live-command-shell-contract-and-connect-progress 计划

- Status: completed
- Date: 2026-03-31
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
2. 2026-03-30：将 `sprint-002` 切换为 active implementation surface，开始落地 progressSink + abortSignal seam 与 connect live progress baseline。
3. 2026-03-30：完成 `TK-445 ~ TK-446` 并新增 `resolved_code_review_tk-445-tk-446-live-command-shell-connect-progress-baseline.md`；当前 sprint 转入 completed truth，并暂以 active closeout surface 挂载等待下一轮 follow-up planning。
4. 2026-03-30：完成 follow-up CR 复核与修复，收口 React-mode cancel policy、`doctor/verify` abort 传播与 local-model probe cancel semantics，并新增 `resolved_code_review_tk-445-tk-446-live-command-shell-connect-progress-baseline-followup.md`。
5. 2026-03-31：完成 closeout surface recap 格式化 follow-up；session shell command handoff 输出改为结构化摘要、压缩 artifact 路径并去除重复信息，同时补齐 locale、测试与 build evidence。
6. 2026-03-31：完成社区参考方案 follow-up；已在 session-first shell draft 中补充长命令 live progress 路线对比图，并收敛推荐方向为 `single renderer owner + progress relay + timer tick`，用于指导后续 nested command refresh 修复。
