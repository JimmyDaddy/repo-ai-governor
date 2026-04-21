# project-118-working-tree-format-drift-remediation 计划

- Status: completed
- Date: 2026-04-21
- Stage Mapping: hygiene remediation
- Phase Mapping: targeted biome format repair on existing dirty worktree
- Upstream:
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/context/dev/project-117-artifact-lifecycle-and-gate-contract-remediation/project-117-artifact-lifecycle-and-gate-contract-remediation-completion-audit-summary.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`

## 1. 目标

1. 修复当前 dirty worktree 中已明确暴露的 biome format drift。
2. 在不改动用户意图逻辑的前提下恢复相关文件的格式基线。
3. 完成 scoped review、closeout 和 idle context 恢复。

## 2. Sprint 细化

## 2.1 sprint-001-targeted-biome-format-repair

- Status: completed
- Sprint Goal: 对 formatter 指出的少量文件做定向格式修复并验证。
- Task Package: `TK-1027`、`TK-1028`、`TK-1029`、`CR-001`

## 3. 任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | status |
| --- | --- | --- | --- | --- | --- |
| TK-1027 | sprint-001 | repair targeted biome format drift on existing working-tree files | code-formatting | project-117 closeout | completed |
| TK-1028 | sprint-001 | verify targeted format repair against build and gate outputs | verification | TK-1027 | completed |
| TK-1029 | sprint-001 | finalize project-118 closeout and restore idle context | closeout/final-audit | TK-1028、CR-001 | completed |
| CR-001 | sprint-001 | review project-118 targeted format repair window | review | TK-1027、TK-1028 | resolved |

## 4. 依赖产物策略

1. 仅修复 formatter 已明确指出的文件，不主动扩展到整个仓库。
2. 格式化属于 bulk edit，使用 biome 定向写回，不重写用户逻辑。
3. 若全仓 `pnpm run check` 仍失败，则必须确认失败点不再是当前这组文件。

## 5. DoD（project-118）

1. 目标文件的 biome format drift 已修复。
2. `pnpm run build` 通过。
3. `pnpm run check` 不再因当前这组文件的 format drift 失败。
4. review artifact、completion audit、completed history 和 idle context 已同步收口。

## 6. 里程碑记录

1. 2026-04-21：创建 `project-118` 单 sprint remediation stream，并将 `TK-1027` 激活为当前执行边界。
2. 2026-04-21：`TK-1027` 已对 `apps/cli` 与 `apps/vscode-extension` 下 formatter 点名的 4 个 dirty-worktree 文件执行定向 `biome format --write`，未扩大到其他仓库文件。
3. 2026-04-21：`TK-1028` 已完成验证；`pnpm run build` 通过，targeted biome formatter-only check 通过，整仓 `pnpm run check` 已不再被这 4 个文件阻塞，当前仅剩 scope 外 `packages/core-orchestration-service/src/local-orchestration-service-sidecar-entry.ts:120` 的 standardized-error 违规。
4. 2026-04-21：`CR-001` 已确认 project-118 scope 内无剩余 actionable finding，可进入 closeout。
5. 2026-04-21：`TK-1029` 已完成 completion audit、project/sprint `completed` write-back、completed history 追加与 idle context 恢复。

## 7. 里程碑记录入口

1. `.repo-ai-governor/context/dev/project-118-working-tree-format-drift-remediation/project-118-working-tree-format-drift-remediation-completion-audit-summary.md`
