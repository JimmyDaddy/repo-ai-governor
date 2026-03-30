# project-032-command-live-progress-react-shell-productization 计划

- Status: active
- Date: 2026-03-31
- Stage Mapping: Command live progress React shell productization follow-up
- Phase Mapping: activation and technical solution promotion / live command shell contract and connect progress / cancellation and multi-command rollout / adoption and closeout
- Upstream:
  - `.repo-ai-governor/draft/command-live-progress-react-shell-technical-solution.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/module-overview.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/contracts/cli-interactive-shell-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/adrs/live-command-progress-and-running-react-shell.md`
  - `.repo-ai-governor/context/dev/project-031-session-shell-ink-input-productization/project-031-session-shell-ink-input-productization-completion-audit-summary.md`

## 1. 目标

1. 将长时命令 running-state React shell 正式纳入 `runtime.cli-interactive-shell` 的 lifecycle-managed 模块边界。
2. 为命令执行链路补齐 `progressSink + AbortSignal` 的正式 seam，并以 `connect` 为首个 live progress 命令 consumer。
3. 在守住 `stderr-only` 与最终 `stdout` machine-readable contract 的前提下，为 adopter CLI 提供可见的运行中进度反馈。
4. 为后续 `doctor / verify / run --dry-run --trace` 与 future desktop consumer 准备 transport-neutral running-state view-model seam。

## 2. Sprint 细化

## 2.1 sprint-001-activation-and-technical-solution-promotion

- Status: completed
- Sprint Goal: 激活 follow-up stream，并把 command live progress technical solution 正式提升到 `runtime.cli-interactive-shell`。
- Task Package: `TK-443`、`TK-444`。

## 2.2 sprint-002-live-command-shell-contract-and-connect-progress

- Status: completed
- Sprint Goal: 落地 live command shell contract、running panel baseline 与 `connect` progress events。
- Task Package: `TK-445`、`TK-446`。

## 3. 任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | status |
|---|---|---|---|---|---|
| TK-443 | sprint-001 | activate project-032 and sync command-live-progress phase map | planning/governance | `.repo-ai-governor/draft/command-live-progress-react-shell-technical-solution.md` | completed |
| TK-444 | sprint-001 | promote command-live-progress React shell technical solution into formal module docs | docs/promotion | TK-443 | completed |
| TK-445 | sprint-002 | add live command shell contract and running progress panel baseline | cli/runtime-contract | TK-444 | completed |
| TK-446 | sprint-002 | instrument connect with progress events and cancellable running shell baseline | cli/connect-progress | TK-445 | completed |

## 4. 依赖产物策略

1. `project-032` 消费已正式化的 `runtime.cli-interactive-shell` module docs，而不是继续让 draft 充当唯一真值。
2. `project-031` 的 completed truth 保持不变；本项目只承接 command-scoped running shell follow-up，不回写 session-shell completed 结论。
3. 当前只建立 `sprint-001` 与 `sprint-002` 的真实执行面；更远期 rollout 仍由本项目后续 sprint 视实现结果再继续细化。
4. 任务编号固定保留在 `TK-443 ~ TK-446`，避免与 `project-030 / project-031` 已占用号段冲突。

## 5. DoD（project-032）

1. command live progress solution 已正式写回 `runtime.cli-interactive-shell` module docs、registry 与 manifest。
2. `connect` 至少成为第一条支持 running shell + progress events 的命令链路。
3. `progressSink + AbortSignal` seam 已进入 CLI runtime contract，但不破坏 `plain/json` 输出稳定性。
4. `stderr-only` live UI 与最终 `stdout` machine contract 继续保持。
5. docs、review、delivery registry 与 follow-up stream 台账同步闭环。

## 6. 里程碑记录

1. 2026-03-30：创建 `project-032-command-live-progress-react-shell-productization`，作为 `runtime.cli-interactive-shell` command live progress direction 的 follow-up stream。
2. 2026-03-30：完成 `TK-443`，将 `current-context.md` primary stream 切换到 `project-032 / sprint-001`，并把 `project-030 / sprint-004` 迁入 completed history。
3. 2026-03-30：完成 `TK-444`，将 command live progress technical solution 正式提升到 `runtime.cli-interactive-shell` 的 module overview / contract / ADR，并同步 lifecycle / delivery / module-registry / manifest / artifact / review。
4. 2026-03-30：激活 `sprint-002-live-command-shell-contract-and-connect-progress`，将 `current-context.md` primary stream 切换到 implementation surface，并开始落地 live running shell contract seam。
5. 2026-03-30：完成 `sprint-002`，收口 live command shell contract / running progress panel / connect progress baseline，并新增 `resolved_code_review_tk-445-tk-446-live-command-shell-connect-progress-baseline.md`；在未激活下一轮 sprint 前，将该 stream 暂保留为 active closeout surface。
6. 2026-03-30：完成 `code_review_tk-445-tk-446-live-command-shell-connect-progress-baseline-followup.md` 复核与修复，补齐 `doctor/verify` abort 透传、live cancel allow-list 与 local-model probe cancel semantics，并收口为 `resolved_code_review_tk-445-tk-446-live-command-shell-connect-progress-baseline-followup.md`。
7. 2026-03-31：完成 closeout surface 可读性 follow-up；session shell 现在会把 nested command recap 收敛为“摘要 / Agent 路由 / 关注项 / 关键状态 + 精简 artifact”格式，并补齐 `en-us/zh-cn` locale、定向 Vitest、Biome、i18n parity 与 `pnpm run build` 证据。
