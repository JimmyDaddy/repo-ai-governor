# project-018 technical solution promotion pilots 完成态审计摘要（sprint-004 LangGraph hard dependency truthfulness cutover）

- Status: completed
- Date: 2026-03-26
- Project: `project-018-technical-solution-promotion-pilots`
- Scope: `sprint-004-langgraph-hard-dependency-truthfulness-cutover`

## 1. 审计结论

`project-018` 在 reopen 后的 `sprint-004` 已达到本轮定义范围内的完成态。`core-runtime-langgraph` 已完成 direct dependency cutover，并把 package/runtime truthfulness 收敛到 bundled vendor contract verification。

## 2. 审计范围

1. `project-018 / sprint-004` 的台账、review 与 artifact 一致性。
2. `core-runtime-langgraph` package/runtime contract 与 direct dependency 的对齐情况。
3. README 与当前 rollout 约束的 truthfulness 完整性。

## 3. 审计结果

1. 项目层状态
   - `project-018` 已具备再次切换为 `completed` 的交付条件。
2. sprint 层状态
   - `sprint-004-langgraph-hard-dependency-truthfulness-cutover`：completed。
3. 任务层状态
   - 最新执行记录聚合结果：`TK-210` ~ `TK-213` 共 `4/4 completed`。
4. 产物链路
   - `DA-210`：sprint-004 activation 与 project-018 reopen handoff
   - `DA-211`：core-runtime-langgraph direct dependency cutover 与 vendor binding contract alignment
   - `DA-212`：LangGraph package truthfulness docs 与 rollout constraints alignment
   - `DA-213`：sprint-004 exit acceptance 与 project-018 re-closeout
5. 能力收口结论
   - `@langchain/langgraph` 已从 optional peer 切换为 direct dependency，并进入 `pnpm-lock.yaml` 的 `packages/core-runtime-langgraph` importer。
   - `LangGraphCommunityVendorBinding` 已从 optional peer 探测语义切换为 bundled dependency contract verification。
   - direct dependency 不再和旧的 package truthfulness 口径冲突，同时也没有伪造“官方 vendor execution 内核已完全接管”的错误结论。

## 4. 门禁复跑

1. `pnpm -s tsc -p tsconfig.json --noEmit`：通过
2. `pnpm exec vitest run packages/core-runtime-langgraph/test/langgraph-community-vendor-binding.unit.test.ts --maxWorkers=1 --maxConcurrency=1`：通过
3. `node ./scripts/governance/check-task-ledger-sync.js`：通过
4. `node ./scripts/governance/check-sprint-plan-status-sync.js`：通过
5. `node ./scripts/governance/check-code-review-status-sync.js`：通过
6. `node ./scripts/governance/check-artifact-registry-lifecycle.js`：通过
7. `node ./scripts/governance/check-worktree-review-target.js`：通过

## 5. 后续 rollout 输入

1. 若未来要把社区 LangGraph 作为唯一 execution 内核，而不是 bundled dependency contract verification，应显式 reopen 新 stream 处理 runtime/backend 级 cutover。
2. 当前 worktree 仅将 sprint-004 保留为 closeout surface；下一个 follow-up 应显式 reopen 新 sprint。
