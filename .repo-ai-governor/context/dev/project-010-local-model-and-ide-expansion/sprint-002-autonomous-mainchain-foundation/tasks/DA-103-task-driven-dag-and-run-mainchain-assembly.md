# DA-103 任务驱动 DAG 与 `run` 主链装配

- Status: active
- Date: 2026-03-24
- Owner: AI-Agent
- Artifact ID: `DA-103`
- Produced By: `TK-099`
- Scope: `project-010-local-model-and-ide-expansion`

## 1. 目的

固化 `project-010 / sprint-002` 中 task-driven `run` 主链装配的第一版实现，使 CLI 能够从 `--task-id` 对应的 task card 解析任务目标、依赖产物、handoff 输入与活动 stream 上下文，动态组装可执行 DAG，并在任务上下文不可用时安全回落到 baseline flow。

## 2. 已收口的实现面

1. task-driven task card 解析已形成稳定入口
   - `apps/cli/src/runtime/task-driven-run-runtime.ts` 现在负责按 `TK-xxx` 检索 canonical task card，读取 `任务目标`、`Depends On`、`Required Inputs/Input References` 与 `Traceback References`。
   - section 提取已改为按标题语义匹配，不再依赖固定编号，兼容 `2.1/2.2` 之类的 heading drift。
2. `run` 已具备动态 DAG 装配能力
   - 当命中 task context 时，runtime 会生成 `prepare -> artifact_context -> execute -> verify -> review -> review_verify -> report` 的 task-driven DSL。
   - 若无 `taskId` 或 task card 不存在，则安全回落到 baseline 3-stage flow，而不是伪装成已成功装配 task-driven 主链。
3. handoff 输入与 artifact 输入已统一注入
   - `inputReferences` 不再只保留 `DA-*` 子集；非 artifact 的正式 handoff 输入也会保留在 `taskContext`、`processDefinition.globals.taskContext` 与各 stage inputs 中。
   - `inputArtifacts` 继续作为 artifact-only 子集，用于后续 dependency resolver / memory selection / 审计解释。
4. 角色推断与 review-ready 装配已收敛到 package-local runtime
   - 执行角色会结合 task title/goal 关键词和 routing bindings 选择 `coder/tester/reviewer` 等 profile。
   - verification/review/review-verify 节点是否纳入 DAG，取决于依赖产物、任务依赖与角色能力，而不再固定硬编码。
5. selective memory 注入已接入 task-driven 装配
   - 当 active stream metadata 与 task context 可用时，runtime 会按 `executionId/taskId/projectId/sprintId/artifactIds` 组装 layered snapshot 选择器。
   - `memorySelection` 与 `memorySnapshotSummary` 会进入 `processDefinition.globals` 与 `stageInputs`，为后续主链提供受控上下文。
6. CLI runtime 已消费 task-driven 装配结果
   - `apps/cli/src/cli-governance-runtime.ts` 已优先消费 task-driven assembly，并在输出 details/checks 中显式回传 `assembly_mode`、node count、input reference count、inline review chain 状态等事实。
   - 这为 `TK-100` 的 inline review chain 和 `TK-101` 的 HITL 恢复执行提供了稳定上游输入。

## 3. 一致性结论

1. `TK-099` 已把 `run` 从固定模板推进到“任务卡驱动 + 角色推断 + 受控 fallback”的第一版动态编排。
2. 任务正式输入现在同时覆盖 artifact handoff 与非 artifact handoff，不再把 completion audit summary 等正式输入静默丢弃。
3. runtime 的 task-driven 组装边界已落在 `project-011` 收口后的 package-local runtime 模块中，未继续把无关职责堆回 `apps/cli/src/cli-governance-runtime.ts`。
4. 当前实现仍保留 baseline fallback，但该路径已经被明确收敛为降级语义，不再代表目标主形态。

## 4. 关键验证证据

1. `pnpm -s tsc -p tsconfig.json --noEmit`
2. `pnpm -s vitest run apps/cli/test/runtime/task-driven-run-runtime.test.ts apps/cli/test/cli-governance-runtime.integration.test.ts --maxWorkers=1 --maxConcurrency=1`
3. `node ./scripts/governance/check-task-ledger-sync.js`
4. `node ./scripts/governance/check-sprint-plan-status-sync.js`
5. `node ./scripts/governance/check-code-review-status-sync.js`
6. `pnpm run check`

## 5. 最终结论

1. 当前状态：`accepted`
2. 结论：`TK-099` 已完成 Stage 9 自动主链所需的 task-driven `run` 主链装配基线，`DA-103` 现作为 `TK-100`、`TK-101` 与 `TK-102` 的正式输入证据。
