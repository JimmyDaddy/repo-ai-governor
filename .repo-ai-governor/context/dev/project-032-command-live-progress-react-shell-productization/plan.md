# project-032-command-live-progress-react-shell-productization 计划

- Status: completed
- Date: 2026-03-31
- Stage Mapping: Command live progress React shell productization follow-up
- Phase Mapping: activation and technical solution promotion / live command shell contract and connect progress / session-shell progress relay and tick refresh / session-shell output presentation promotion / session-shell output presentation implementation / adoption and closeout
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

## 2.3 sprint-003-session-shell-progress-relay-and-tick-refresh

- Status: completed
- Sprint Goal: 按方案 C 收口 session-shell nested command live progress，落实 `single renderer owner + progress relay + timer tick`。
- Task Package: `TK-447`、`TK-448`、`TK-449`、`TK-450`。

## 2.4 sprint-004-session-shell-output-presentation-and-markdown-promotion

- Status: completed
- Sprint Goal: 将 session-shell output presentation / markdown rendering draft 正式提升到 `runtime.cli-interactive-shell` module docs，并同步 lifecycle / delivery / module-registry / manifest。
- Task Package: `TK-459`。

## 2.5 sprint-005-session-shell-output-presentation-and-markdown-productization

- Status: completed
- Sprint Goal: 落地 transcript render-kind、assistant markdown renderer 与 command recap / system notice presentation 分层。
- Task Package: `TK-460`、`TK-461`。

## 3. 任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | status |
|---|---|---|---|---|---|
| TK-443 | sprint-001 | activate project-032 and sync command-live-progress phase map | planning/governance | `.repo-ai-governor/draft/command-live-progress-react-shell-technical-solution.md` | completed |
| TK-444 | sprint-001 | promote command-live-progress React shell technical solution into formal module docs | docs/promotion | TK-443 | completed |
| TK-445 | sprint-002 | add live command shell contract and running progress panel baseline | cli/runtime-contract | TK-444 | completed |
| TK-446 | sprint-002 | instrument connect with progress events and cancellable running shell baseline | cli/connect-progress | TK-445 | completed |
| TK-447 | sprint-003 | formalize single-renderer ownership and nested command progress relay | cli/runtime-contract | TK-446 | completed |
| TK-448 | sprint-003 | add session-shell running progress dock and shared controller reuse | cli/session-shell-ui | TK-447 | completed |
| TK-449 | sprint-003 | implement timer-driven tick refresh and heartbeat lifecycle | cli/live-refresh | TK-448 | completed |
| TK-450 | sprint-003 | roll out connect doctor verify session-shell live progress and regression coverage | cli/multi-command-rollout | TK-449 | completed |
| TK-459 | sprint-004 | promote session-shell output presentation and markdown rendering solution into formal module docs | docs/promotion | TK-450 | completed |
| TK-460 | sprint-005 | implement structured transcript render-kind and session-shell message renderer split | cli/session-shell-ui | TK-459 | completed |
| TK-461 | sprint-005 | integrate assistant markdown rendering and transcript presentation verification | cli/markdown-rendering | TK-460 | completed |

## 4. 依赖产物策略

1. `project-032` 消费已正式化的 `runtime.cli-interactive-shell` module docs，而不是继续让 draft 充当唯一真值。
2. `project-031` 的 completed truth 保持不变；本项目只承接 command-scoped running shell follow-up，不回写 session-shell completed 结论。
3. `sprint-004` 负责将 session-shell output presentation / markdown rendering direction 正式写回 `runtime.cli-interactive-shell` module docs；该 sprint 只做 formal cutover，不声称 renderer / markdown consumer 已在代码面交付完成。
4. `sprint-005` 已完成 output presentation implementation follow-up，正式交付 transcript render-kind、markdown renderer 与 presentation verification。
5. 当前代码面已经完成 `structured shell + markdown content blocks` 的第一轮正式 rollout；若下一条主执行流尚未显式激活，可将 `sprint-005` 暂保留为 active closeout surface。
6. 任务编号固定保留在 `TK-443 ~ TK-461`，避免与 `project-030 / project-031 / project-033` 已占用号段冲突。

## 5. DoD（project-032）

1. command live progress solution 已正式写回 `runtime.cli-interactive-shell` module docs、registry 与 manifest。
2. `connect` 至少成为第一条支持 running shell + progress events 的命令链路。
3. `progressSink + AbortSignal` seam 已进入 CLI runtime contract，但不破坏 `plain/json` 输出稳定性。
4. `stderr-only` live UI 与最终 `stdout` machine contract 继续保持。
5. docs、review、delivery registry 与 follow-up stream 台账同步闭环。
6. session-shell output presentation / markdown rendering 已完成 contract-to-code rollout，transcript render-kind、assistant markdown renderer 与 presentation verification 已进入正式实现与验证闭环。

## 6. 里程碑记录

1. 2026-03-30：创建 `project-032-command-live-progress-react-shell-productization`，作为 `runtime.cli-interactive-shell` command live progress direction 的 follow-up stream。
2. 2026-03-30：完成 `TK-443`，将 `current-context.md` primary stream 切换到 `project-032 / sprint-001`，并把 `project-030 / sprint-004` 迁入 completed history。
3. 2026-03-30：完成 `TK-444`，将 command live progress technical solution 正式提升到 `runtime.cli-interactive-shell` 的 module overview / contract / ADR，并同步 lifecycle / delivery / module-registry / manifest / artifact / review。
4. 2026-03-30：激活 `sprint-002-live-command-shell-contract-and-connect-progress`，将 `current-context.md` primary stream 切换到 implementation surface，并开始落地 live running shell contract seam。
5. 2026-03-30：完成 `sprint-002`，收口 live command shell contract / running progress panel / connect progress baseline，并新增 `resolved_code_review_tk-445-tk-446-live-command-shell-connect-progress-baseline.md`；在未激活下一轮 sprint 前，将该 stream 暂保留为 active closeout surface。
6. 2026-03-30：完成 `code_review_tk-445-tk-446-live-command-shell-connect-progress-baseline-followup.md` 复核与修复，补齐 `doctor/verify` abort 透传、live cancel allow-list 与 local-model probe cancel semantics，并收口为 `resolved_code_review_tk-445-tk-446-live-command-shell-connect-progress-baseline-followup.md`。
7. 2026-03-31：完成 closeout surface 可读性 follow-up；session shell 现在会把 nested command recap 收敛为“摘要 / Agent 路由 / 关注项 / 关键状态 + 精简 artifact”格式，并补齐 `en-us/zh-cn` locale、定向 Vitest、Biome、i18n parity 与 `pnpm run build` 证据。
8. 2026-03-31：补充 session-first shell 社区参考 technical solution；在 `.repo-ai-governor/draft/interactive-cli-session-first-agent-shell-technical-solution.md` 中新增长命令 live progress 多方案对比图，并推荐 `single renderer owner + progress relay + timer tick` 路线，作为后续 follow-up planning 输入。
9. 2026-03-31：创建 `sprint-003-session-shell-progress-relay-and-tick-refresh` 规划面，并将方案 C 拆解为 `TK-447 ~ TK-450`，覆盖 renderer ownership、progress relay、session-shell progress dock、tick refresh 与多命令 rollout。
10. 2026-03-31：激活 `sprint-003` 并完成 `TK-447`；session shell nested handoff 现在可把 `progressSink` relay 回 re-entered `runCli(...)`，且 `json + no-interactive` nested path 也会真正转发 progress events，不再因缺少 inner React presenter 而丢失 relay。
11. 2026-03-31：完成 `TK-448`；session shell view-model 与 Ink layout 已接入 `commandProgressPanel`，并通过新建 `CliSessionShellCommandProgressDock` 复用 shared `ReactCliCommandProgressController`，让 direct/nested bridge progress 在当前 shell 内真正可见。
12. 2026-03-31：完成 `TK-449`；shared progress controller 与 session-shell progress dock 现支持 `1s` timer-driven refresh，长命令期间可持续刷新 elapsed / heartbeat，而不再依赖用户额外按键触发重绘。
13. 2026-03-31：完成 `TK-450`；`doctor / verify` 已补齐 progress lifecycle，`connect / doctor / verify` 现统一接入 session-shell live progress consumer path，并补齐命令级、nested `runCli(...)` 与 session-shell regression coverage。
14. 2026-03-31：创建 `sprint-004-session-shell-output-presentation-and-markdown-promotion`，将“结构化壳层 + Markdown 内容块”方向正式并入 `runtime.cli-interactive-shell` module docs，并同步 lifecycle / delivery / module-registry / manifest / review / artifact。
15. 2026-03-31：完成 `TK-459`，新增 session-shell output presentation ADR，并扩展 `cli-session-shell-contract` 的 transcript render-kind / running dock separation 约束。
16. 2026-03-31：创建 planned `sprint-005-session-shell-output-presentation-and-markdown-productization`，为 transcript renderer split 与 assistant markdown rendering rollout 预留真实执行面。
17. 2026-03-31：激活 `sprint-005-session-shell-output-presentation-and-markdown-productization`，将 `current-context.md` primary stream 切换到 transcript render-kind / markdown rendering implementation surface，并将已完成的 `sprint-004` 迁入 completed stream history。
18. 2026-03-31：完成 `TK-460` 与 `TK-461`；session shell transcript item 现支持 `plain_text / markdown / system_notice / command_recap` render-kind，并正式接入 assistant markdown rendering、structured command recap / system notice presenter 与 targeted regression coverage。
19. 2026-03-31：产出 [project-032-command-live-progress-react-shell-productization-completion-audit-summary.md](./project-032-command-live-progress-react-shell-productization-completion-audit-summary.md)，`project-032` 进入 completed 状态。
