# sprint-004-phase-g-workflow-authoring-and-run-control 计划

- Status: completed
- Date: 2026-04-17
- Sprint Goal: 完成 workflow authoring、governed run-control 与 workflow studio continuity 的标准执行骨架
- Project: `project-113-vscode-primary-workbench-full-cutover`
- Upstream:
  - `.repo-ai-governor/context/dev/project-111-vscode-workbench-solution-promotion-and-decomposition/sprint-001-promotion-and-rollout-handoff/tasks/DA-934-vscode-workbench-promotion-and-rollout-decomposition-handoff.md`
  - `.repo-ai-governor/context/dev/project-112-vscode-governance-workbench-rollout/project-112-vscode-governance-workbench-rollout-completion-audit-summary.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/vscode-primary-full-governance-workbench.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/vscode-governance-workbench-surface-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/module-overview.md`

## 1. Scope

1. 冻结 workflow authoring/run-control contract，补齐 governed command seam，并把 workflow studio continuity UX 收口到 VS Code primary workbench。

## 2. 任务拆解矩阵（WBS）

| task_id | title | depends_on | status |
| --- | --- | --- | --- |
| TK-954 | freeze phase-g workflow authoring and run-control contract | prepare sprint-003 exit acceptance and phase-g handoff | completed |
| TK-955 | implement workflow authoring and governed run-control seams | freeze phase-g workflow authoring and run-control contract | completed |
| TK-956 | land workflow studio control surfaces and continuity ux | implement workflow authoring and governed run-control seams | completed |
| TK-957 | prepare sprint-004 exit acceptance and phase-h handoff | land workflow studio control surfaces and continuity ux | completed |
| CR-001 | verify phase-g workflow authoring and run control | prepare sprint-004 exit acceptance and phase-h handoff | resolved |
| CR-002 | sprint-004-phase-g-workflow-authoring-and-run-control delegated recheck loop round 2 | verify phase-g workflow authoring and run control | resolved |

## 3. Exit Criteria

1. Phase G workflow authoring/run-control seam、studio continuity UX 与 phase-h handoff 已全部具备 execution-ready 真值。

## 4. Sprint Notes

1. bootstrap 阶段不预生成 code_review 生命周期文件。
2. 若用户只要求拆解，不自动修改 current-context.md。
3. 该 sprint 默认保持 planned，等待 sprint-003-phase-f-secure-authoring-and-user-settings handoff 或用户显式激活。
4. `2026-04-17` sprint-003 已在 `CR-002` resolved round 后完成 closeout；当前 sprint 已激活为新的 primary execution surface，`TK-954` 切换为 `in_progress`，下一步从 clean baseline 冻结 workflow authoring、governed run-control 与 workflow studio continuity 边界，同时保持 Phase E degraded fallback 与 Phase F secure-authoring contract 不回退。
5. `2026-04-17` `TK-954 ~ TK-956` 已在同一窗口完成实现：workflow studio 现支持 command-uri backed governed run-control / handoff / temporary bridge actions，并通过 `getSession / resumeSession` additive 投影 session continuity metadata；当前 `TK-957` 进入 `in_progress`，下一步执行 ledger refresh、sprint gate 与 fresh reviewer round。
6. `2026-04-17` `TK-957` 已完成 exit acceptance 与 Phase H handoff 收口：sprint-004 code + governance gate 已 clean，`phase-h.patch` 与 Phase H docs truth-sync surface 已被固定为下一 sprint 的 activation-ready inputs；当前 sprint 进入 `CR-001` fresh reviewer lifecycle。
7. `2026-04-17` `CR-001` 已接受并修复 “workflow-studio continuity render path mutates session state” 与 “review-only handoff can reopen stale queue target” 两条 finding；修复后 targeted vitest、`pnpm run build` 与整仓 `pnpm run check` 已再次通过。
8. `2026-04-17` 当前已激活 `CR-002` 作为 fresh post-fix recheck round；只有 clean reviewer verdict 返回后，sprint-004 才能执行 closeout 并切换到 sprint-005。
9. `2026-04-17` `CR-002` fresh reviewer round-2 返回 1 条新的 P2：review-only command URI 的 clear marker 在真实 JSON transport 下会丢失。当前 finding 已被主 agent 认可，并已落下 `clearExecutionSelection` + URI round-trip 回归测试修复，待同窗口 build/check 复验后再推进到 `resolved`。
10. `2026-04-17` `CR-002` 已在同窗口完成 accepted P2 修复、review lifecycle 收口与 ledger sync；sprint-004 现已完成 closeout，并将 primary execution surface 切换到 sprint-005 `TK-958` activation truth，下一步从 `.tmp/project-113-boundary-parking/phase-h.patch` 开始 Phase H 边界冻结。
