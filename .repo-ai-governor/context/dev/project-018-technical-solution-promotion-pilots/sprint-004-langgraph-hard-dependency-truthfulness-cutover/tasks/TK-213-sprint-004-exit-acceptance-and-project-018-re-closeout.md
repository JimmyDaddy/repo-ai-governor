# TK-213 sprint-004 出口验收与 project-018 re-closeout

- Status: completed
- Date: 2026-03-26
- Owner: AI-Agent
- Priority: P0
- Project: `project-018-technical-solution-promotion-pilots`
- Sprint: `sprint-004-langgraph-hard-dependency-truthfulness-cutover`

## 1. 任务目标

完成 sprint-004 的代码验证、governance gates、review/artifact 收口与新的 project-018 completion audit，并将 `project-018` 再次收口为 completed。

## 2. Depends On

1. `TK-210`
2. `TK-211`
3. `TK-212`
4. `DA-210`
5. `DA-211`
6. `DA-212`

## 3. 预期产物

1. `DA-213`
2. 新的 project-018 completion audit summary
3. 更新后的 project / sprint 台账、review 与 artifact registry

## 4. 实施计划

1. 执行 `tsc`、定向单测与 sprint 所需 governance gates。
2. 生成 sprint-004 的 resolved reviews 与新的 project-018 completion audit。
3. 将 project-018 与 sprint-004 计划状态保持为 completed，并保留当前 worktree 的 closeout surface。

## 5. 验证

1. `pnpm -s tsc -p tsconfig.json --noEmit`
2. `pnpm exec vitest run packages/core-runtime-langgraph/test/langgraph-community-vendor-binding.unit.test.ts --maxWorkers=1 --maxConcurrency=1`
3. `node ./scripts/governance/check-task-ledger-sync.js`
4. `node ./scripts/governance/check-sprint-plan-status-sync.js`
5. `node ./scripts/governance/check-code-review-status-sync.js`
6. `node ./scripts/governance/check-artifact-registry-lifecycle.js`
7. `node ./scripts/governance/check-worktree-review-target.js`

## 6. 执行记录

1. 2026-03-26：任务创建，状态初始化为 `planned`。
2. 2026-03-26：状态切换为 `in_progress`，开始执行 sprint-004 验收门禁与 completion audit 收口。
3. 2026-03-26：已完成 `DA-213`、resolved reviews、artifact registry 同步与新的 project-018 completion audit，`project-018` 再次收口为 completed。
