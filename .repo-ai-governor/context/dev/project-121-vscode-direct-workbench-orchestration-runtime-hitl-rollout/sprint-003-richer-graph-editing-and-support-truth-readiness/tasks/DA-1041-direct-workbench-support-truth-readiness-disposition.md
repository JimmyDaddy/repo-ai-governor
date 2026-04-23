# DA-1041 direct-workbench support-truth readiness disposition

- Status: completed
- Date: 2026-04-23
- Owner: AI-Agent
- Task: `TK-1041`
- Project: `project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout`
- Sprint: `sprint-003-richer-graph-editing-and-support-truth-readiness`

## 1. Disposition

1. Verdict: `stay fail-closed`
2. Decision: `project-121` sprint-003 可以把 richer graph projection、runtime lanes evidence 与 HITL cockpit readiness 收口为 implementation-ready evidence package，但当前窗口不提升 public/support wording。

## 2. Evidence Considered

1. `TK-1049` code and regression slice
2. `TK-1050` evidence handoff:
   - `.repo-ai-governor/context/dev/project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout/sprint-003-richer-graph-editing-and-support-truth-readiness/tasks/DA-1050-direct-workbench-evidence-and-readiness-package.md`
   - `.tmp/release-vscode-extension-distribution-report.json`
   - `.tmp/release-host-distribution-validation-report.json`
3. active contracts:
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/vscode-governance-workbench-surface-contract.md`
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-orchestration/contracts/direct-workbench-orchestration-runtime-hitl-contract.md`
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-orchestration/contracts/governance-workbench-aggregation-facade-contract.md`

## 3. Why The Claim Stays Fail-Closed

1. 当前证据已经证明 VS Code 内的 Workflow Studio graph/stage/backlink interaction 走的是 service-backed projection，而不是 extension-local canonical state；这满足了 sprint-003 的 implementation boundary。
2. 但 `vscode-governance-workbench-surface-contract` 仍要求 `workflow studio + adoption/host cutover + desktop decision surface + support-truth refresh evidence` 同窗闭环后，才允许讨论更强的 public workbench claim。
3. `direct-workbench-orchestration-runtime-hitl-contract` 也明确接受 `schema-first authoring before richer graph editing` 的 phased rollout；freeform drag-drop 仍可作为后续增量，因此不能把本轮 projection-backed graph interaction 误报成“图形化编排已完整公开支持”。
4. 根据项目默认策略，只有在 sprint-003 evidence 明显充分且 project-final CR 仍 clean 的情况下，才允许 uplift public/support truth；当前阶段先保持既有 wording，不冒进改口。

## 4. Closeout Guidance

1. `TK-1042` 最终 closeout 应记录：
   - sprint-003 implementation boundary 已完成
   - support/public truth 保持不变
   - 后续若要提升 claim，必须以新的 evidence window 和 clean project-final CR 为前提
2. project-final CR loop 仍需复核这份 fail-closed disposition 是否与最终代码、review artifact 与 delivery registry 保持一致。
