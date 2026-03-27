# DA-247 sprint-002 activation and sprint-001 closeout handoff

- Status: active
- Date: 2026-03-27
- Owner: AI-Agent
- Task: `TK-247`
- Project: `project-021-memory-semantics-runtime-implementation`
- Sprint: `sprint-002-promotion-pipeline-and-runtime-consumer-rollout`

## 1. Activation Conclusion

1. `project-021 / sprint-002-promotion-pipeline-and-runtime-consumer-rollout` 已正式激活，并接管 `runtime.memory-semantics` 的当前主执行流。
2. `current-context.md` 已从 `sprint-001-recall-context-assembly-baseline` 切换到新的 primary stream。
3. `sprint-001` 已迁入 `.repo-ai-governor/context/completed-streams-history.md`，不再占用默认 active closeout surface。

## 2. Sprint-002 Scope Freeze

1. 本轮只收敛两类运行时工作：
   - 显式 memory promotion pipeline baseline
   - 第二 runtime consumer rollout
2. 不在本轮承诺：
   - canonical source ownership rewrite
   - raw `layeredSnapshot` 再暴露
   - `user/workspace` 全量 memory 或 semantic/vector search 扩张

## 3. Seed Tasks

1. `TK-248` 已切到 `in_progress`，开始收敛 promotion pipeline 与 contract-safe summary baseline。
2. `TK-249`、`TK-250` 已建卡并进入 sprint task package。

## 4. Validation

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `node ./scripts/governance/check-artifact-registry-lifecycle.js`
