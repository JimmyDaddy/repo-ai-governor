# TK-315 docs/help surface 收尾、project-027 出口验收与 completion audit

- Status: planned
- Date: 2026-03-28
- Owner: AI-Agent
- Priority: P0
- Project: `project-027-cli-interactive-shell-implementation`
- Sprint: `sprint-003-react-cli-shell-default-cutover`

## 1. 任务目标

完成 adopter-facing docs/help surface 收尾，并在同一任务中形成 project-027 的最终验收与 completion audit。

## 2. Depends On

1. `TK-314`

## 3. 预期产物

1. adopter docs / help surface / playbook closeout
2. sprint / project exit acceptance
3. completion audit summary 与里程碑回链

## 4. Required Inputs

1. `.repo-ai-governor/context/dev/project-027-cli-interactive-shell-implementation/plan.md`
2. `.repo-ai-governor/context/dev/project-027-cli-interactive-shell-implementation/sprint-003-react-cli-shell-default-cutover/plan.md`
3. `.repo-ai-governor/context/current-context.md`
4. `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`
5. `.repo-ai-governor/context/dev/project-027-cli-interactive-shell-implementation/sprint-002-react-cli-shell-surface-expansion/tasks/TK-310-init-default-react-routing-and-classic-fallback-ux-policy.md`
6. `.repo-ai-governor/context/dev/project-027-cli-interactive-shell-implementation/sprint-003-react-cli-shell-default-cutover/tasks/TK-314-workflow-save-compiled-ir-acceptance-and-upgrade-explicit-react-poc.md`

## 5. Traceback References

1. `.repo-ai-governor/draft/interactive-cli-react-style-technical-solution.md`
2. `.repo-ai-governor/context/dev/project-027-cli-interactive-shell-implementation/sprint-001-react-cli-shell-foundation/review/resolved_code_review_working-tree-20260328-1829.md`

## 6. 实施计划

1. 收口 adopter-facing docs、help surface 与 playbook，确保默认扩面、fallback、workflow 与 `upgrade` 说明同源。
2. 汇总 M1/M2/M3 证据，执行 project-027 出口验收并形成 completion audit summary。
3. 同步项目里程碑回链、task ledger、review evidence 与 closeout truth。

## 7. Development Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 8. Delivery Verification

1. `node ./scripts/governance/check-code-review-status-sync.js`
2. `node ./scripts/governance/check-technical-solution-delivery-registry.js`
3. `pnpm run check`
4. project completion audit、里程碑回链与 closeout truth 必须同时完成。

## 9. 执行记录

1. 2026-03-28：任务创建，状态初始化为 `planned`。
2. 2026-03-28：依据技术方案 draft 的 M3 清单，改为收口 docs/help surface、exit acceptance 与 completion audit。

## 10. 产出

1. 待执行：adopter docs / help surface / playbook closeout。
2. 待执行：sprint / project exit acceptance evidence。
3. 待执行：`project-027` completion audit summary 与里程碑回链。
