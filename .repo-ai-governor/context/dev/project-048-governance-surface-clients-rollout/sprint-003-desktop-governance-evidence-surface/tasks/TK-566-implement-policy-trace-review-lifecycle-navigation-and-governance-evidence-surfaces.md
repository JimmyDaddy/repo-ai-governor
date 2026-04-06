# TK-566 implement policy trace review lifecycle navigation and governance evidence surfaces

- Status: completed
- Date: 2026-04-05
- Task ID: `TK-566`
- Owner: `AI-Agent`
- Priority: `P1`
- Sprint: `sprint-003-desktop-governance-evidence-surface`
- Project: `project-048-governance-surface-clients-rollout`

## 1. 目标

实现 desktop 的 policy trace、review lifecycle navigation 与 governance evidence surface。

## 2. Depends On

1. `TK-565`

## 3. Expected Outputs

1. policy trace surface
2. review lifecycle navigation
3. governance evidence surface

## 4. Execution Notes

1. 2026-04-05：已在 `LocalOrchestrationServiceArtifactPaneQueryRuntime` 上扩展 policy trace、review lifecycle、workbench 与 evidence backlinks detail，不再只返回 artifact/review/transcript 摘要列表。
2. 2026-04-05：已在 `DesktopGovernanceConsoleViewModelBuilder` 中新增 transport-neutral evidence sections，形成 `Policy & Standards Lens`、`Review lifecycle navigation`、`Artifact & Review Workbench` 与 `Governance evidence backlinks` 展示面。
