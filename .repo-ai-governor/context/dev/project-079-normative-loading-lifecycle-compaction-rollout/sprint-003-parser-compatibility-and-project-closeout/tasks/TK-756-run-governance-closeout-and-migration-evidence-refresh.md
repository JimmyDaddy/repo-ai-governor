# TK-756 run governance closeout and migration evidence refresh

- Status: completed
- Date: 2026-04-11
- Owner: AI-Agent
- Priority: P0
- Project: `project-079-normative-loading-lifecycle-compaction-rollout`
- Sprint: `sprint-003-parser-compatibility-and-project-closeout`

## 1. 任务目标

完成 archive split / compact rollout 的 migration evidence refresh，并为 project-final closeout 形成正式治理证据包。

## 2. Depends On

1. `TK-755`

## 3. 预期产物

1. migration evidence package
2. closeout review input
3. final audit input set

## 4. Required Inputs

1. `.repo-ai-governor/context/dev/project-079-normative-loading-lifecycle-compaction-rollout/sprint-003-parser-compatibility-and-project-closeout/tasks/TK-755-finalize-parser-and-gate-compatibility-plus-rollback-guidance.md`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/governance-normative-loading/module-overview.md`
3. `.repo-ai-governor/context/dev/project-078-normative-loading-promotion-and-decomposition/sprint-001-promotion-and-followup-decomposition/tasks/DA-749-normative-loading-promotion-and-rollout-decomposition-handoff.md`

## 5. Traceback References

1. `.repo-ai-governor/draft/normative-loading-manifest-lifecycle-compaction-and-staged-sharding-technical-solution.md`

## 6. 实施计划

1. 汇总 archive split、compact、archive-check 与 monthly audit 的最终 evidence。
2. 形成 project-final review / audit 输入面。
3. 为 `TK-759 / TK-760` 准备 closeout write-back 所需的证据路径。

## 7. Development Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/run-normative-loading-manifest-gate.js`

## 8. Delivery Verification

1. `node ./scripts/governance/check-sprint-plan-status-sync.js`
2. `node ./scripts/governance/check-artifact-registry-lifecycle.js`
3. `node ./scripts/governance/check-docs-triad-sync.js`

## 9. 执行记录

1. 2026-04-11：任务创建，状态初始化为 `planned`。
2. 2026-04-11：在 `TK-755` 完成 parser/gate compatibility 与 rollback guidance 后，开始汇总 project-079 的 migration / audit evidence 链路。
3. 2026-04-11：已将 sprint-001 archive split、sprint-002 compaction/archive-integrity、sprint-003 compatibility/rollback evidence 收敛为 `DA-756`，并固定 `TK-759 / TK-760` 所需输入面。
4. 2026-04-11：governance closeout evidence refresh 已通过 same-window build、manifest gate、docs triad 与 artifact lifecycle 校验。

## 10. 产出

1. `.repo-ai-governor/context/dev/project-079-normative-loading-lifecycle-compaction-rollout/sprint-003-parser-compatibility-and-project-closeout/tasks/DA-756-governance-closeout-and-migration-evidence-refresh-packet.md`
