# DA-250 sprint-002 exit acceptance and sprint-003 input constraints

- Status: active
- Date: 2026-03-27
- Owner: AI-Agent
- Task: `TK-250`
- Project: `project-021-memory-semantics-runtime-implementation`
- Sprint: `sprint-002-promotion-pipeline-and-runtime-consumer-rollout`

## 1. Acceptance Conclusion

1. `sprint-002` 的 4 条 exit criteria 已全部满足：
   - `sprint-002` skeleton 已建立，且 `current-context.md` 已切到 `project-021 / sprint-002`
   - `runtime.memory-semantics` 已形成 audit-friendly 的显式 promotion pipeline baseline
   - 第二个 runtime consumer 已通过 `memoryContext.contractSafeSummary` 接入，而不是回退到 `layeredSnapshot`
   - project / sprint / task / artifact truth 已同步
2. `TK-248` 的 promotion truthfulness CR 与 `TK-249` 的 second-consumer rollout 已全部收口，当前不再存在 pending/verified review blocker。
3. 由于下一条主执行流尚未显式激活，`current-context.md` 继续将 `sprint-002` 保留为 active closeout surface；但 `plan.md`、task cards、checklist 与 `tasks.csv` 已切为 completed 真值。

## 2. Sprint-002 Delivered Baseline

1. `packages/core-memory-semantics` 已具备：
   - `MemoryRecallService`
   - `MemoryContextAssembler`
   - `MemoryPromotionService`
2. CLI runtime 当前已经有两个 consumer 接入 `runtime.memory-semantics`：
   - `CliTaskDrivenRunRuntime`
   - `CliGovernanceRuntime` assembly check
3. promotion pipeline 已具备 contract-safe truthfulness：
   - truncated summary fail-closed
   - `plannedMergeCount` 与 `mergedCount` 显式分离
   - machine-readable phase/result 不再伪报已完成 merge

## 3. Sprint-003 Input Constraints

1. 建议下一条 follow-up sprint 名称：
   - `sprint-003-promotion-output-rollout-and-project-closeout`
2. 下一轮若激活，应优先处理：
   - 将 promotion output 或 session summary 投影接到更多 runtime/reporting consumer，而不是继续扩 recall substrate
   - 判定 `project-021` 是否可进入最终 completed closeout，并补项目级 completion audit
3. 约束边界：
   - 不得把 canonical source ownership 挪进 `runtime.memory-semantics`
   - 新 consumer 仍只能消费 `memoryContext`、contract-safe summary 或 promotion summary，不允许回退到 `layeredSnapshot`
   - 不在下一轮默认承诺 semantic/vector search、workspace/user 全量 memory rewrite 或 canonical-source rewrite
4. 若没有新的 consumer/rollout 需求，`project-021` 可以直接在 closeout surface 上完成最终项目收口，而不必强行激活 `sprint-003`

## 4. Validation

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `node ./scripts/governance/check-artifact-registry-lifecycle.js`
4. `node ./scripts/governance/check-code-review-status-sync.js`
5. `node ./scripts/governance/check-worktree-review-target.js`
6. `pnpm run check`
