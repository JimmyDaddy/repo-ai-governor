# DA-271 workspace artifact locality contract and target-root decision baseline

- Status: active
- Date: 2026-03-27
- Owner: AI-Agent
- Task: `TK-271`
- Project: `project-023-workspace-migration-artifact-locality-and-scratch-cleanup`
- Sprint: `sprint-001-workspace-artifact-locality-and-scratch-cleanup-baseline`

## 1. Contract Decision

1. workspace migration artifact locality 的正式 contract 如下：
   - `workspace dry-run`：plan artifact 跟随**当前 active workspace root**
   - `workspace execute` 成功：plan / execution artifact 跟随**target workspace root**
   - `workspace execute` 失败：failure / execution artifact 继续留在**当前 source workspace root**
   - `workspace rollback` 成功：rollback artifact 跟随**恢复后的 source workspace root**
2. 这个 contract 直接回答 adopter 在每个动作结束后应去哪个 workspace 面找证据，而不是仅暴露内部实现路径。

## 2. Decision Basis

1. `DA-235` 与 `DA-236` 暴露的核心 UX 痛点不是“artifact 没有生成”，而是 repo-local 切换成功后用户仍需回到 source `tool_managed` 根找 plan/execution 证据。
2. `dry-run` 尚未切换 active workspace，因此保持 plan 在当前 active root 更可预测。
3. `rollback` 成功后 target workspace 可能已被清理；因此 rollback artifact 跟随恢复后的 source root 才能保证结果可见且不依赖已删除目录。

## 3. Follow-Up Constraints

1. 任何后续实现都不得让 execute 成功后的主要 artifact 继续停留在 source root。
2. rollback cleanup 不得删除仍承担恢复语义的目录；只有无语义 scratch 残留才允许清理。

## 4. Validation

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `node ./scripts/governance/run-normative-loading-manifest-gate.js`
