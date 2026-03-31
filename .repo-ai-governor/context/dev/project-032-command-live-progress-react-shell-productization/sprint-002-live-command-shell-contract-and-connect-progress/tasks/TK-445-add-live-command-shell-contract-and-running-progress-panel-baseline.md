# TK-445 add live command shell contract and running progress panel baseline

- Status: completed
- Date: 2026-03-31
- Owner: AI-Agent
- Priority: P0
- Project: `project-032-command-live-progress-react-shell-productization`
- Sprint: `sprint-002-live-command-shell-contract-and-connect-progress`

## 1. 任务目标

在不破坏现有 final-result shell 的前提下，为 command-scoped React shell 增加 running-state panel、progress reducer/controller 与 `progressSink + abortSignal` runtime seam。

## 2. Depends On

1. `TK-444`

## 3. 预期产物

1. `cli-governance-runtime.interface.ts` 的 additive execution options seam
2. running progress panel view-model / controller / presenter baseline
3. targeted tests covering live command shell reduction and rerender

## 4. 验证

1. `pnpm run build`
2. targeted Vitest
3. `node ./scripts/governance/check-task-ledger-sync.js`
4. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 5. Execution Notes

1. 2026-03-30：`sprint-002` 已激活；开始落地 `CliGovernanceRuntime.execute(...)` 的 additive execution options seam，以及 command-scoped running progress panel/view-model/controller 基线。
2. 2026-03-30：已补齐 `CliCommandProgressEvent / CliCommandProgressSink / CliGovernanceCommandExecutionOptions` typed seam、`commandProgressPanel` view-model、`ReactCliCommandProgressController`、`ReactCliLiveProgressPresenter` 与共享 layout shell consumer；`pnpm run build` 与定向 Vitest 已通过。
3. 2026-03-30：真实 TTY smoke 已验证 command-scoped running shell 会在 `connect --ui react --output pretty` 下即时渲染，并在阶段切换时 live 更新 running progress panel。
4. 2026-03-30：第二轮实现已验证 running shell 与 abort-aware progress seam 可协同工作；`pnpm run build`、定向 Vitest、Biome、task/sprint/i18n gates 与真实 TTY smoke 均已通过。
5. 2026-03-30：已把 `signal` 语义提升到 `AgentProbeRequest` 合同层，并让 route runner / CLI adapter verification / adapter probe 共享同一取消入口；相关 adapter-sdk 与 codex smoke tests 已通过。
6. 2026-03-30：任务完成；`CliGovernanceRuntime.execute(...)` additive seam、running progress panel/controller/presenter、`AgentProbeRequest.signal` cancel contract 与相关测试已全部收口，并通过 `pnpm run build`、定向 Vitest、task/sprint/i18n/biome/code-review sync 检查；review 结果写入 `resolved_code_review_tk-445-tk-446-live-command-shell-connect-progress-baseline.md`。
7. 2026-03-30：follow-up CR 修复已完成；新增 `CliLiveCommandCancellationPolicy` 收敛两段式 `Ctrl+C` 暴露范围，仅对 `connect/doctor/verify` 开启 live cancel controller，并补齐 `doctor/verify` 的 `abortSignal` 透传与回归测试；follow-up review 已收口为 `resolved_code_review_tk-445-tk-446-live-command-shell-connect-progress-baseline-followup.md`。
8. 2026-03-31：closeout surface recap 格式化 follow-up 已完成；`CliSessionShellEntrypointRuntime` 现在会把 nested command 结果收敛为结构化摘要、Agent 路由、关注项与关键状态，并由 session runner 统一压缩 artifact 路径显示；已补齐 `en-us/zh-cn` locale、定向 Vitest、i18n parity、Biome 与 `pnpm run build` 证据。
9. 2026-03-31：社区参考技术方案 follow-up 已完成；已在 `.repo-ai-governor/draft/interactive-cli-session-first-agent-shell-technical-solution.md` 中补充长命令 live progress 多方案对比图，比较 `double renderer`、`single renderer + relay` 与 `single renderer + relay + tick` 三条路线，并明确推荐后者作为 nested command refresh 修复方向；`check-task-ledger-sync` 与 `check-sprint-plan-status-sync` 已通过，docs-only 因此 build not required。
