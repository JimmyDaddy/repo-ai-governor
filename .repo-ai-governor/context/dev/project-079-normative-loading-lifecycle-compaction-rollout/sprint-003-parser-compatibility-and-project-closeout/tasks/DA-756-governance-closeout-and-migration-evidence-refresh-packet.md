# DA-756 governance closeout and migration evidence refresh packet

- Status: active
- Date: 2026-04-11
- Owner: AI-Agent
- Task: `TK-756`
- Project: `project-079-normative-loading-lifecycle-compaction-rollout`
- Sprint: `sprint-003-parser-compatibility-and-project-closeout`

## 1. Summary

1. `project-079` 现已形成一份可直接供 sprint/project closeout 复用的 migration evidence packet，不再把 archive split、compaction、compatibility 与 rollback 证据分散在多个执行窗口里。
2. 当前 packet 明确表明 `project-079` 的实施边界已经稳定为：
   - root manifest 继续作为唯一 bootstrap truth
   - archive manifest 只承载 archived sidecar
   - active sharding / sqlite canonical truth cutover 继续留在 follow-up solution
3. `TK-759 / TK-760` 下一步只需完成 acceptance、project-final CR 与 final closeout write-back，不需要再追加新的实现性不确定项。

## 2. Evidence Chain

1. sprint-001 baseline：
   - archive manifest sidecar 已创建，root manifest archived backlog 已清零。
   - 参考：`TK-752`、`DA-757`。
2. sprint-002 baseline：
   - deprecated grace-window compaction、archive integrity gate 与 monthly audit enforcement 已落地。
   - `CR-001` 已 clean `resolved`。
   - 参考：`TK-753`、`TK-754`、`DA-758`、`resolved_code_review_working-tree-20260411-0148.md`。
3. sprint-003 compatibility delta：
   - realpath-safe archive checker、expanded lifecycle regression coverage 与 rollback playbook 已固定。
   - 参考：`TK-755`、`DA-755`。

## 3. Project-Final Input Set

1. project plan：
   - `.repo-ai-governor/context/dev/project-079-normative-loading-lifecycle-compaction-rollout/plan.md`
2. active sprint plan：
   - `.repo-ai-governor/context/dev/project-079-normative-loading-lifecycle-compaction-rollout/sprint-003-parser-compatibility-and-project-closeout/plan.md`
3. implementation task cards：
   - `TK-755`
   - `TK-756`
4. inherited closeout / review evidence：
   - `DA-758`
   - `resolved_code_review_working-tree-20260411-0148.md`
5. current sprint evidence：
   - `DA-755`
   - current sprint `tasks/checklist.md`
   - current sprint `tasks/tasks.csv`

## 4. Validation Snapshot

1. `pnpm run build`（通过）
2. `pnpm exec vitest run test/normative-loading-manifest-lifecycle.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
3. `node ./scripts/governance/run-normative-loading-manifest-gate.js`（通过）
4. `node ./scripts/governance/check-normative-loading-manifest-archive.js --mode block`（通过）
5. `node ./scripts/governance/check-docs-triad-sync.js`（通过）
6. `node ./scripts/governance/check-artifact-registry-lifecycle.js`（通过）
