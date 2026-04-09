# TK-732 produce clean-room and verify evidence for codex and claude-code remote_api paths

- Status: planned
- Date: 2026-04-09
- Owner: AI-Agent
- Priority: P0
- Project: `project-076-transport-selection-authority-rollout`
- Sprint: `sprint-003-evidence-gated-docs-and-adopter-truth`

## 1. 任务目标

产出能够证明 `codex` / `claude-code` `remote_api` 路径独立 probe / invoke 且保持 fail-closed truth 的 evidence artifact。

## 2. Depends On

1. `TK-731`
2. `docs/support-matrix.md`
3. `docs/local-adoption-playbook.md`

## 3. 预期产物

1. clean-room verification report
2. verify evidence artifact
3. release-style evidence summary

## 4. Required Inputs

1. `docs/support-matrix.md`
2. `docs/local-adoption-playbook.md`
3. `apps/cli/src/runtime/adapter-routing-runtime.ts`

## 5. Traceback References

1. `.repo-ai-governor/draft/transport-selection-authority-and-strict-routing-follow-up-technical-solution.md`
2. `TK-727`
3. `TK-731`

## 6. 实施计划

1. 设计 clean-room / verify 场景，验证 explicit `remote_api` 不会被静默改写。
2. 产出可回放 evidence artifact。
3. 形成 docs wording uplift 的 gate verdict。

## 7. Development Verification

1. `pnpm -s tsc -p tsconfig.json --noEmit`
2. `pnpm test -- --runInBand`

## 8. Delivery Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 9. 执行记录

1. 2026-04-09：任务创建，状态初始化为 `planned`。

## 10. 产出

1. 待执行：clean-room verification report
2. 待执行：verify evidence artifact
