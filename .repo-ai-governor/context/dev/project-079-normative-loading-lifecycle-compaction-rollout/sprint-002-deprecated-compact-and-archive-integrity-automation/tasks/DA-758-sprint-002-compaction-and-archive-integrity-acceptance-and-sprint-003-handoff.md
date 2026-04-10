# DA-758 sprint-002 compaction and archive integrity acceptance and sprint-003 handoff

- Status: active
- Date: 2026-04-11
- Owner: AI-Agent
- Task: `TK-758`
- Project: `project-079-normative-loading-lifecycle-compaction-rollout`
- Sprint: `sprint-002-deprecated-compact-and-archive-integrity-automation`

## 1. Summary

1. sprint-002 已完成 deprecated grace-window compaction、archive integrity gate 与 monthly audit enforcement 的实现和验证。
2. `CR-001` 的 accepted finding 已修复并收口，sprint-002 当前边界不存在阻止 closeout 的 actionable finding。
3. sprint-003 现在可以接续执行 parser/gate compatibility、rollback guidance、migration evidence 与 project-final closeout。

## 2. Delivered Baseline

1. `scripts/governance/normative-loading-manifest-canonical.js`
2. `scripts/governance/check-normative-loading-manifest-archive.js`
3. `scripts/governance/compact-normative-loading-manifest.js`
4. `scripts/governance/run-normative-loading-manifest-gate.js`
5. `test/normative-loading-manifest-lifecycle.integration.test.ts`
6. `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
7. `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`
8. `.repo-ai-governor/normative_knowledge_sources/governance/normative-loading-manifest-lifecycle-governance.md`
9. `.repo-ai-governor/context/dev/project-079-normative-loading-lifecycle-compaction-rollout/sprint-002-deprecated-compact-and-archive-integrity-automation/review/resolved_code_review_working-tree-20260411-0148.md`

## 3. Sprint-003 Activation Inputs

1. parser/gate compatibility 需要围绕 root manifest bootstrap truth、archive sidecar non-overlap 与 compaction CLI import safety 做回归确认。
2. rollback guidance 应明确 `NORMATIVE_LOADING_GATE_ROLLBACK=1`、`NORMATIVE_LOADING_GATE_FORCE_MODE` 与 `normative-loading:compact` 的 dry-run/apply 使用边界。
3. migration evidence refresh 可直接复用 sprint-002 的 build、targeted Vitest、gate 与 review closure evidence。

## 4. Verification Evidence

1. `pnpm run build`（通过）
2. `pnpm exec vitest run test/normative-loading-manifest-lifecycle.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
3. `node ./scripts/governance/run-normative-loading-manifest-gate.js`（通过）
4. `node ./scripts/governance/check-normative-loading-manifest-archive.js --mode block`（通过）
5. `node ./scripts/governance/check-code-review-status-sync.js`（通过）
6. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
7. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
8. `node ./scripts/governance/check-worktree-review-target.js`（通过）
