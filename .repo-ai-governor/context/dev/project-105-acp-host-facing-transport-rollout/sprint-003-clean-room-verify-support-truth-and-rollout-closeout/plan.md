# sprint-003-clean-room-verify-support-truth-and-rollout-closeout 计划

- Status: planned
- Date: 2026-04-14
- Sprint Goal: 执行 clean-room verify、support/docs truth uplift，并完成 rollout closeout。
- Project: `project-105-acp-host-facing-transport-rollout`
- Upstream:
  - `.repo-ai-governor/context/dev/project-105-acp-host-facing-transport-rollout/sprint-002-distribution-and-runtime-service-enablement/plan.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/acp-host-facing-transport-formalization-and-distribution-boundary.md`
  - `.repo-ai-governor/context/dev/project-104-cli-exec-onboarding-adoption-readiness-rollout/plan.md`

## 1. Scope

1. 执行 ACP clean-room verify，并收集 distribution/runtime evidence。
2. 只对 evidence-backed surfaces uplift ACP adopter-facing support/docs truth，同时保持与 `cli_exec` 分离。
3. 在 sprint final clean 后完成 `project-105` closeout 与 delivery evidence handoff。

## 2. 任务拆解矩阵（WBS）

| task_id | title | depends_on | status |
| --- | --- | --- | --- |
| TK-888 | execute clean-room ACP verification and distribution runtime evidence capture | TK-887 | planned |
| TK-889 | uplift ACP adopter-facing support docs truth only for evidence-backed surfaces while preserving cli_exec separation | TK-888 | planned |
| TK-890 | finalize project-105 closeout and delivery evidence handoff | TK-888、TK-889、activation-time local CR-001 | planned |

## 3. Exit Criteria

1. clean-room ACP verify 与 distribution/runtime evidence 已成为真实 rollout boundary。
2. ACP support/docs truth 只在 evidence-backed surfaces 上 uplift，并继续与 `cli_exec` 严格分离。
3. 激活该 sprint 时有清晰的本地 `CR-001` 入口与 project-final closeout 边界。

## 4. Sprint Notes

1. 激活后先预留本地 `CR-001`，再开始 implementation 与 reviewer loop。
2. 当前 sprint 才允许处理 adopter-facing support/docs truth uplift；前置 sprint 不得提前宣称完成。
3. `TK-890` 负责 `project-105` final closeout，但只有在 sprint-003 local `CR-001` clean 后才允许完成。
