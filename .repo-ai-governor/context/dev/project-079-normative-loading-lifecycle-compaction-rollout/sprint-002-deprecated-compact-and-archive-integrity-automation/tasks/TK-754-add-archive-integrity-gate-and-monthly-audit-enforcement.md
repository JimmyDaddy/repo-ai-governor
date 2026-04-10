# TK-754 add archive integrity gate and monthly audit enforcement

- Status: completed
- Date: 2026-04-11
- Owner: AI-Agent
- Priority: P0
- Project: `project-079-normative-loading-lifecycle-compaction-rollout`
- Sprint: `sprint-002-deprecated-compact-and-archive-integrity-automation`

## 1. 任务目标

增加 archive integrity gate，并把 normative-loading monthly audit enforcement 接到长期维护节奏里。

## 2. Depends On

1. `TK-753`

## 3. 预期产物

1. archive integrity gate
2. monthly audit enforcement delta
3. root/archive non-overlap evidence

## 4. Required Inputs

1. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/governance-normative-loading/contracts/normative-loading-lifecycle-contract.md`
2. `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`
3. `.repo-ai-governor/context/dev/project-079-normative-loading-lifecycle-compaction-rollout/sprint-002-deprecated-compact-and-archive-integrity-automation/tasks/TK-753-implement-deprecated-grace-window-compaction-command-and-dry-run-report.md`

## 5. Traceback References

1. `.repo-ai-governor/draft/normative-loading-manifest-lifecycle-compaction-and-staged-sharding-technical-solution.md`

## 6. 实施计划

1. 实现 root/archive manifest 的重复 `doc_id/path`、status purity 与 grace-window backlog gate。
2. 将 compact / archive-check 流程纳入 monthly audit。
3. 保持 gate 输出对现有 root manifest parser/gate 兼容。

## 7. Development Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-normative-loading-manifest.js --mode block`

## 8. Delivery Verification

1. `node ./scripts/governance/check-sprint-plan-status-sync.js`
2. `node ./scripts/governance/check-docs-triad-sync.js`

## 9. 执行记录

1. 2026-04-11：任务创建，状态初始化为 `planned`。
2. 2026-04-11：已新增 `check-normative-loading-manifest-archive.js`，覆盖 root/archive non-overlap、root archived leakage、overdue deprecated backlog 与 archive status purity。
3. 2026-04-11：已将 archive integrity audit 接入 `run-normative-loading-manifest-gate.js`、`package.json` scripts、`code_standards.md`、`long-term-maintenance-guide.md` 与 lifecycle governance doc，形成 monthly audit 常规入口。
4. 2026-04-11：已通过 `node ./scripts/governance/check-code-standards.js --standards .repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`、`node ./scripts/governance/run-normative-loading-manifest-gate.js` 与 `pnpm run build` 验证接线结果。

## 10. 产出

1. `scripts/governance/check-normative-loading-manifest-archive.js`
2. `scripts/governance/run-normative-loading-manifest-gate.js`
3. `package.json`
4. `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
5. `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`
6. `.repo-ai-governor/normative_knowledge_sources/governance/normative-loading-manifest-lifecycle-governance.md`
