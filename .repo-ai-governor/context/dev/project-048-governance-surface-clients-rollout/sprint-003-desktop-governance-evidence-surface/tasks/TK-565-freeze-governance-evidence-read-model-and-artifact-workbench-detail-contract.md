# TK-565 freeze governance evidence read model and artifact workbench detail contract

- Status: completed
- Date: 2026-04-05
- Task ID: `TK-565`
- Owner: `AI-Agent`
- Priority: `P1`
- Sprint: `sprint-003-desktop-governance-evidence-surface`
- Project: `project-048-governance-surface-clients-rollout`

## 1. 目标

冻结 `Policy & Standards Lens` 与 `Artifact & Review Workbench` 需要的 detail read model 与 evidence contract。

## 2. Expected Outputs

1. governance evidence query model
2. artifact workbench detail contract
3. review lifecycle navigation baseline

## 3. Execution Notes

1. 2026-04-05：随 `sprint-003` 激活切换为 `active`，开始冻结 `policy trace detail`、`review lifecycle navigation detail`、`artifact workbench detail` 与 `governance evidence backlinks` 的 service-owned contract。
2. 2026-04-05：已完成 `@repo-ai-governor/orchestration-service-client` contract 扩展，正式收敛 `policyTrace / reviewLifecycle / workbench / evidenceBacklinks` DTO，保持 evidence surface 继续由 `local_orchestration_service` 拥有真值。
