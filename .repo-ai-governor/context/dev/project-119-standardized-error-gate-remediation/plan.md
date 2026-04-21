# project-119-standardized-error-gate-remediation 计划

- Status: completed
- Date: 2026-04-21
- Stage Mapping: governance remediation
- Phase Mapping: scoped standardized-error blocker repair on existing dirty worktree
- Upstream:
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/context/dev/project-118-working-tree-format-drift-remediation/project-118-working-tree-format-drift-remediation-completion-audit-summary.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`

## 1. 目标

1. 修复当前阻塞 `pnpm run check` 的最后一个已知 standardized-error 违规。
2. 保持修复范围最小，只处理 `packages/core-orchestration-service/src/local-orchestration-service-sidecar-entry.ts` 的错误标准化写法。
3. 完成 scoped review、closeout 和 idle context 恢复。

## 2. Sprint 细化

## 2.1 sprint-001-sidecar-entry-standardized-error-fix

- Status: completed
- Sprint Goal: 修复 sidecar entry 的 standardized-error 违规并验证整仓 gate 恢复情况。
- Task Package: `TK-1030`、`TK-1031`、`TK-1032`、`CR-001`

## 3. 任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | status |
| --- | --- | --- | --- | --- | --- |
| TK-1030 | sprint-001 | remediate standardized error usage in local orchestration sidecar entry | code-fix | project-118 closeout | completed |
| TK-1031 | sprint-001 | verify standardized error remediation against build and gate outputs | verification | TK-1030 | completed |
| TK-1032 | sprint-001 | finalize project-119 closeout and restore idle context | closeout/final-audit | TK-1031、CR-001 | completed |
| CR-001 | sprint-001 | review project-119 standardized error remediation window | review | TK-1030、TK-1031 | resolved |

## 4. 依赖产物策略

1. 只修复 `check-standardized-error-usage.js` 当前明确点名的单文件违规，不主动扩展到其他 dirty worktree 文件。
2. 实现优先复用同包现有 `standardizeError(error)` 模式，不引入额外错误模型分叉。
3. 若整仓 `pnpm run check` 仍失败，则必须确认失败点不再是当前这条 standardized-error 违规。

## 5. DoD（project-119）

1. `packages/core-orchestration-service/src/local-orchestration-service-sidecar-entry.ts` 的 standardized-error 违规已修复。
2. `node ./scripts/governance/check-standardized-error-usage.js` 通过。
3. `pnpm run build` 通过。
4. `pnpm run check` 不再因当前这条违规失败；如仍失败，剩余原因必须明确记录为 scope 外 residual。
5. review artifact、completion audit、completed history 和 idle context 已同步收口。

## 6. 里程碑记录

1. 2026-04-21：创建 `project-119` 单 sprint remediation stream，并将 `TK-1030` 激活为当前执行边界。
2. 2026-04-21：`TK-1030` 已将 `packages/core-orchestration-service/src/local-orchestration-service-sidecar-entry.ts` 中的 `instanceof Error` 文本拼接替换为 `standardizeError(error).message`，保持修复范围仅限目标文件。
3. 2026-04-21：`TK-1031` 已完成验证；`check-standardized-error-usage.js`、`pnpm run build` 与 `pnpm run check` 全部通过，当前整仓 gate 已恢复 clean baseline。
4. 2026-04-21：`CR-001` 已确认 project-119 scope 内无剩余 actionable finding，可进入 closeout。
5. 2026-04-21：`TK-1032` 已完成 completion audit、project/sprint `completed` write-back、completed history 追加与 idle context 恢复。

## 7. 里程碑记录入口

1. `.repo-ai-governor/context/dev/project-119-standardized-error-gate-remediation/project-119-standardized-error-gate-remediation-completion-audit-summary.md`
