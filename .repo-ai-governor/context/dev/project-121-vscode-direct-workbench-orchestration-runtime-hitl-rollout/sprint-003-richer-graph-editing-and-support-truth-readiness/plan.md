# sprint-003-richer-graph-editing-and-support-truth-readiness 计划

- Status: active
- Date: 2026-04-22
- Sprint Goal: 补齐 richer graph editing code path、delivery evidence suite 与更强 direct-workbench support-truth readiness
- Project: `project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout`
- Upstream:
  - `.repo-ai-governor/context/dev/project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout/sprint-001-direct-hitl-and-runtime-lanes-baseline/tasks/DA-1037-vscode-direct-workbench-promotion-and-rollout-decomposition-handoff.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/vscode-governance-workbench-surface-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-orchestration/contracts/governance-workbench-aggregation-facade-contract.md`

## 1. Scope

1. 补齐 projection-backed richer graph editing、runtime stage navigation 与 backlink reveal 的 code path。
2. 补齐 build/distribution/runtime evidence package，并评估是否具备将更强 direct-workbench claim 提升到 support-truth discussion window 的前提。
3. 完成 `project-121` 的 closeout 与 delivery evidence handoff。

## 2. 任务拆解矩阵（WBS）

| task_id | title | depends_on | status |
| --- | --- | --- | --- |
| TK-1049 | implement richer graph editing and projection-backed workflow studio | TK-1040 | completed |
| TK-1050 | land direct-workbench evidence suite and support-truth readiness package | TK-1049 | completed |
| TK-1041 | verify direct-workbench evidence boundary and support-truth readiness | TK-1050 | completed |
| TK-1042 | finalize project-121 rollout closeout and delivery evidence handoff | TK-1041 | planned |

## 3. Exit Criteria

1. richer graph-editing / runtime-lanes / HITL cockpit 的 code path 已建立在 direct-workbench query/mutation seam 上，而不是 extension 本地 truth。
2. public support truth 是否可以增强的判断已形成明确结论，并拥有 build/distribution/runtime evidence 支撑或 fail-closed 回退结论。
3. `project-121` closeout 所需的 audit / handoff / registry truth 已全部落盘。

## 4. Sprint Notes

1. 本 sprint 不预设一定会升级 public support wording；若 evidence 不足，应明确保持既有 active truth 不变。
2. 任何更强 claim 都必须建立在 build/distribution/runtime evidence 之上，而不是 contract-only formalization。
3. 2026-04-23：`TK-1040` 已完成 sprint-002 closeout/handoff；当前 sprint 已切换为 `current-context.md` 的 primary execution surface，并继承 `CS-027` legacy controller temporary exception 的 focused extraction 责任。
4. 2026-04-23：`TK-1049` 已切换为 `in_progress`，开始进入 Workflow Studio richer graph editing、runtime stage navigation 与 backlink reveal 的 implementation 窗口。
5. 2026-04-23：`TK-1049 / TK-1050 / TK-1041` 已完成 richer Workflow Studio graph projection、packaged distribution smoke 与 fail-closed readiness disposition；`TK-1042` 继续保持未启动，等待 sprint-003 clean CR 与 project-final clean CR 都收口后再执行最终 closeout。
6. 2026-04-23：`CR-003` 已 clean `resolved`，sprint-003 implementation boundary 当前没有新的 delegated review blocker；下一步先创建 sprint-003 local boundary commit，再进入 project-final delegated CR loop。
