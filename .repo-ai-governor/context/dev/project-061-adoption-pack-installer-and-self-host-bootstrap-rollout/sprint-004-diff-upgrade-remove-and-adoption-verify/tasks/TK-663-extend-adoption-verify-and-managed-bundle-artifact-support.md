# TK-663 extend adoption verify and managed bundle artifact support

- Status: completed
- Date: 2026-04-09
- Owner: `AI-Agent`
- Priority: `P1`
- Project: `project-061-adoption-pack-installer-and-self-host-bootstrap-rollout`
- Sprint: `sprint-004-diff-upgrade-remove-and-adoption-verify`

## 1. 任务目标

扩展 adoption-level verify，使其能检查 provenance、managed ownership、drift 与 managed bundle artifacts。

## 2. Depends On

1. `TK-662`

## 3. 预期产物

1. adoption verify checks
2. managed bundle artifact support
3. verification evidence baseline

## 4. Required Inputs

1. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/governance-adoption-pack-install-contract.md`
2. `.repo-ai-governor/context/dev/project-061-adoption-pack-installer-and-self-host-bootstrap-rollout/sprint-004-diff-upgrade-remove-and-adoption-verify/tasks/TK-662-implement-adopt-diff-upgrade-remove-lifecycle-and-drift-safe-update-policy.md`
3. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/governance-host-distribution-contract.md`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-060-adoption-pack-promotion-and-decomposition/sprint-001-promotion-and-followup-decomposition/review/resolved_code_review_tk-652-655-host-skill-distribution-and-discovery-followup-promotion-and-decomposition.md`

## 6. 实施计划

1. 让 verify 同时覆盖 provenance、receipt、managed ownership 与 bundle artifacts。
2. 把 `tool_managed` 与 `repo_local` truth boundary 体现在 verifier 输出中。
3. 为后续 clean-room rehearsal 提供稳定验收面。

## 7. Development Verification

1. `node ./scripts/governance/check-technical-solution-delivery-registry.js`

## 8. Delivery Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 9. 执行记录

1. 2026-04-09：任务创建，状态初始化为 `planned`。
2. 2026-04-09：已扩展 adoption-level verify，使其覆盖 receipt provenance、managed-file drift、host apply artifacts 与 self-host sqlite bootstrap consistency，并补齐 regression evidence。

## 10. 产出

1. 已完成：`apps/cli/src/runtime/adoption-pack-runtime.ts`
2. 已完成：`apps/cli/test/adopt-command.integration.test.ts`
3. 已完成：`.tmp/project-061-adoption-pack-cleanroom-summary.json`
