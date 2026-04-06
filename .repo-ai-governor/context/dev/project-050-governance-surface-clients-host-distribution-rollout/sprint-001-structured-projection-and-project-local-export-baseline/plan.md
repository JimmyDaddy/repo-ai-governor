# sprint-001-structured-projection-and-project-local-export-baseline 计划

- Status: completed
- Date: 2026-04-06
- Project: `project-050-governance-surface-clients-host-distribution-rollout`
- Sprint Goal: 建立 structured projection registry、host-export manifest 与 Codex / Claude Code project-local export baseline。

## 1. Task Package

1. `TK-574` freeze structured projection registry and host export manifest contract
2. `TK-575` implement codex and claude-code project-local renderer plus staged export baseline
3. `TK-576` close structured projection and project-local export baseline with Codex and Claude Code smoke acceptance

## 2. Exit Criteria

1. structured projection registry 与 `host-export.manifest.json` 字段集已冻结。
2. Codex / Claude Code 已具备 staged project-local export baseline。
3. `staged export -> apply/sync -> verify` 的第一批语义已对齐，不再把 staging tree 误判为 host-discoverable assets。

## 3. Milestones

1. 2026-04-06：创建 `sprint-001-structured-projection-and-project-local-export-baseline` 作为 `project-050` 的首个 planned execution sprint。
2. 2026-04-06：当前窗口已切换为 active primary sprint，先执行 `TK-574` contract freeze，再落地 `TK-575/TK-576` 的 export/apply/verify 与 reviewer-loop closeout。
3. 2026-04-06：已完成 Codex / Claude Code project-local staged export、apply/sync、verify 与 smoke acceptance，reviewer loop 在 host-distribution 修复边界达到零 actionable finding。
