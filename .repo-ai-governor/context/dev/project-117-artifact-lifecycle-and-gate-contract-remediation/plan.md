# project-117-artifact-lifecycle-and-gate-contract-remediation 计划

- Status: completed
- Date: 2026-04-21
- Stage Mapping: governance remediation
- Phase Mapping: artifact lifecycle backlog clearance + gate contract truth alignment
- Upstream:
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/draft/repo-ai-governor-current-improvement-priorities-and-governance-remediation-refresh.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`

## 1. 目标

1. 清理当前阻塞 `pnpm run check` 的 artifact lifecycle 积压。
2. 收口“文档已声明但脚本未落地”的治理门禁口径漂移。
3. 将本轮仓库体检结论沉淀为可回溯 draft，并完成 project-level closeout。

## 2. Sprint 细化

## 2.1 sprint-001-backlog-clearance-and-doc-truth-alignment

- Status: completed
- Sprint Goal: 完成 draft 沉淀、artifact lifecycle backlog 清理与治理脚本口径对齐。
- Task Package: `TK-1023`、`TK-1024`、`TK-1025`、`TK-1026`、`CR-001`

## 3. 任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | status |
| --- | --- | --- | --- | --- | --- |
| TK-1023 | sprint-001 | capture current improvement summary draft and activate remediation stream | draft/activation | repository health summary | completed |
| TK-1024 | sprint-001 | remediate artifact registry lifecycle backlog and refresh canonical views | governance/data-maintenance | TK-1023 | completed |
| TK-1025 | sprint-001 | align governance gate roadmap with executable script truth | docs/governance-alignment | TK-1023 | completed |
| TK-1026 | sprint-001 | finalize project-117 closeout and restore idle context | closeout/final-audit | TK-1024、TK-1025、CR-001 | completed |
| CR-001 | sprint-001 | review project-117 remediation window and confirm clean closeout | review | TK-1024、TK-1025 | resolved |

## 4. 依赖产物策略

1. draft 作为本轮仓库体检结论的补充分析面，挂到既有 `technical-solution.adopter-productization-priority-roadmap` 下，不新增平行 solution。
2. artifact lifecycle 修复必须优先写 canonical sqlite，再刷新 rendered CSV views，不手工把 CSV 当成唯一真值。
3. 规范文档口径收口以“如实反映当前脚本存在性与接入状态”为准，不在本轮引入高风险的大型新 gate 实现。

## 5. DoD（project-117）

1. 仓库体检结论已落盘到 `.repo-ai-governor/draft/**`，并完成 lifecycle write-back。
2. relevant remediation gates 已通过：`check-artifact-registry-lifecycle`、normative-loading manifest、technical-solution lifecycle 与 ledger/code-review/context sync 全部 clean；`pnpm run check` 如仍失败，剩余原因必须被明确记录为 scope 外的既有 dirty-worktree 漂移。
3. `code_standards.md` 与 `long-term-maintenance-guide.md` 不再声称存在实际缺失的 prepared/planned gate script。
4. project completion audit、project plan milestone backlink、`current-context.md` 与 completed history 已同步收口。

## 6. 里程碑记录

1. 2026-04-21：创建 `project-117` 单 sprint remediation stream，并将 `TK-1023` 激活为当前执行边界。
2. 2026-04-21：`TK-1023` 已将仓库体检结论写入 supplemental draft，并把 `technical-solution.adopter-productization-priority-roadmap` 的 lifecycle draft_paths 与 remediation stream 真值同步到位。
3. 2026-04-21：`TK-1024` 已通过 canonical maintenance 清理 artifact lifecycle backlog；dry-run / applied summary 均已落盘，`check-artifact-registry-lifecycle` 恢复通过。
4. 2026-04-21：`TK-1025` 已把 `code_standards.md` 与 `long-term-maintenance-guide.md` 中对 missing gate scripts 的 prepared/implementation-ready 口径收口为 deferred truth，normative-loading gate 通过。
5. 2026-04-21：`CR-001` 已确认 project-117 scope 内无剩余 actionable finding；`pnpm run check` 剩余失败仅来自 scope 外 dirty worktree 中的 biome format 漂移。
6. 2026-04-21：`TK-1026` 已完成 completion audit、project/sprint completed write-back、completed history 追加与 idle context 恢复。

## 7. 里程碑记录入口

1. `.repo-ai-governor/context/dev/project-117-artifact-lifecycle-and-gate-contract-remediation/project-117-artifact-lifecycle-and-gate-contract-remediation-completion-audit-summary.md`
