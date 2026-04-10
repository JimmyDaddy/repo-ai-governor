# TK-755 finalize parser and gate compatibility plus rollback guidance

- Status: planned
- Date: 2026-04-11
- Owner: AI-Agent
- Priority: P0
- Project: `project-079-normative-loading-lifecycle-compaction-rollout`
- Sprint: `sprint-003-parser-compatibility-and-project-closeout`

## 1. 任务目标

收口 archive split / compact automation 对 parser 与 gate 的兼容性，并把 rollback guidance 写成正式 closeout evidence。

## 2. Depends On

1. `TK-754`

## 3. 预期产物

1. parser/gate compatibility evidence
2. rollback guidance delta
3. final governance constraints

## 4. Required Inputs

1. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/governance-normative-loading/contracts/normative-loading-lifecycle-contract.md`
2. `.repo-ai-governor/context/dev/project-079-normative-loading-lifecycle-compaction-rollout/sprint-002-deprecated-compact-and-archive-integrity-automation/tasks/TK-754-add-archive-integrity-gate-and-monthly-audit-enforcement.md`
3. `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-078-normative-loading-promotion-and-decomposition/sprint-001-promotion-and-followup-decomposition/tasks/DA-749-normative-loading-promotion-and-rollout-decomposition-handoff.md`

## 6. 实施计划

1. 验证 archive split / compact automation 对 root parser 与 manifest gate 的兼容性。
2. 固定 rollback guidance，避免 future compaction 引入不透明恢复路径。
3. 汇总进入 project-final closeout 所需的 governance evidence。

## 7. Development Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-normative-loading-manifest.js --mode block`

## 8. Delivery Verification

1. `node ./scripts/governance/check-sprint-plan-status-sync.js`
2. `node ./scripts/governance/check-docs-triad-sync.js`

## 9. 执行记录

1. 2026-04-11：任务创建，状态初始化为 `planned`。

## 10. 产出

1. 待执行：parser/gate compatibility evidence
2. 待执行：rollback guidance delta
