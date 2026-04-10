# TK-755 finalize parser and gate compatibility plus rollback guidance

- Status: completed
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

1. `pnpm exec vitest run test/normative-loading-manifest-lifecycle.integration.test.ts --maxWorkers=1 --maxConcurrency=1`
2. `node ./scripts/governance/run-normative-loading-manifest-gate.js`
3. `node ./scripts/governance/check-normative-loading-manifest-archive.js --mode block`

## 8. Delivery Verification

1. `pnpm run build`
2. `node ./scripts/governance/check-docs-triad-sync.js`
3. `node ./scripts/governance/check-task-ledger-sync.js`
4. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 9. 执行记录

1. 2026-04-11：任务创建，状态初始化为 `planned`。
2. 2026-04-11：sprint-002 clean closeout 已完成，`TK-755` 切换为 `active`，开始收口 parser/gate compatibility 与 rollback guidance。
3. 2026-04-11：已修复 archive integrity checker / compaction apply 在绝对路径 CLI 输入下的 canonical `root_manifest_path` 兼容性缺口，使 repo 内与 external cwd 两种 operator 路径都保持稳定。
4. 2026-04-11：已补充 archive sidecar parser compatibility、missing `deprecated_at`、root/archive overlap 与 archive status purity 回归测试，并把 rollback operator sequence 写入正式治理文档。
5. 2026-04-11：已产出 `DA-755` compatibility/rollback evidence，并通过同窗口 `pnpm run build`、Vitest 与 normative-loading gate 验证。

## 10. 产出

1. `scripts/governance/normative-loading-manifest-canonical.js`
2. `test/normative-loading-manifest-lifecycle.integration.test.ts`
3. `.repo-ai-governor/normative_knowledge_sources/governance/normative-loading-manifest-lifecycle-governance.md`
4. `.repo-ai-governor/context/dev/project-079-normative-loading-lifecycle-compaction-rollout/sprint-003-parser-compatibility-and-project-closeout/tasks/DA-755-parser-and-gate-compatibility-plus-rollback-guidance-baseline.md`
