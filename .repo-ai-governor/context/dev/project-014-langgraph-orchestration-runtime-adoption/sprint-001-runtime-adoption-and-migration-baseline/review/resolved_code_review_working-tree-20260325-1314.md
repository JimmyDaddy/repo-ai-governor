# Code Review: project-014 working tree bootstrap and triad sync

- Status: resolved
- Date: 2026-03-25
- Reviewer: AI-Agent
- Task: `TK-142`
- Review Type: working tree review
- Normative References:
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements.md`
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md`
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-master-execution-plan.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`

## 1. Review Scope
1. `.repo-ai-governor/context/current-context.md`
2. `.repo-ai-governor/context/completed-streams-history.md`
3. `.repo-ai-governor/context/dev/index.md`
4. `.repo-ai-governor/context/dev/projects-overview.md`
5. `.repo-ai-governor/context/artifact-registry/artifacts.csv`
6. `.repo-ai-governor/normative_knowledge_sources/product-requirements.md`
7. `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
8. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`
9. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md`
10. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-master-execution-plan.md`
11. `.repo-ai-governor/context/dev/project-014-langgraph-orchestration-runtime-adoption/**`
12. `.repo-ai-governor/draft/langgraph-orchestration-technical-solution.md`

## 2. Findings
### 2.1 [P2] project-014 formal baseline still keeps the draft LangGraph solution on the required-input chain
- 位置: `.repo-ai-governor/context/dev/project-014-langgraph-orchestration-runtime-adoption/plan.md:49`
- 问题描述: `TK-142`/`DA-142` 已把 LangGraph 方向升级为 triad + master plan + artifact-registry 的正式事实链，但 `project-014` project plan、sprint plan，以及 `TK-143`/`TK-144`/`TK-145` 仍把 `.repo-ai-governor/draft/langgraph-orchestration-technical-solution.md` 作为默认消费或 `Required Inputs`。这让后续任务继续依赖一个未登记进 artifact registry、且仍处于 `draft` 状态的可变文档，而不是只依赖 `DA-142` 与 triad/master plan 的正式基线。
- 影响: 后续若有人只修改 draft 文档，`project-014` 的执行基线就可能发生漂移，但 triad、`DA-142` 与 artifact registry 不会同步变更，形成新的双事实源。
- 建议: 将 draft 文档降级为 `Traceback/Background` 参考，只保留 `DA-142` 与 triad/master plan 作为 `project-014` 后续任务的正式输入链。

### 2.2 [P2] DA-142 的 artifact registry 依赖链漏记了 TK-145/TK-146
- 位置: `.repo-ai-governor/context/artifact-registry/artifacts.csv:125`
- 问题描述: `DA-142` 条目当前只登记 `dependent_tasks=TK-143|TK-144`，但 `DA-142` 自身已经明确 `TK-143`、`TK-144`、`TK-145`、`TK-146` 都必须把它视为统一基线输入。
- 影响: 依赖产物注册表会低估 `DA-142` 的真实消费范围，后续做依赖注入、影响分析或审计回溯时会漏掉 `TK-145/TK-146` 这两条下游链路。
- 建议: 将 `DA-142` 的 `dependent_tasks` 同步补齐为完整消费集合，并在后续新增 `DA-143`~`DA-146` 时继续保持 registry 与 task card 一致。

## 3. Notes
1. 本轮 diff 主要是 project bootstrap / triad / planning 变更，没有新的 runtime code path 进入评审范围。
2. `check-task-ledger-sync`、`check-sprint-plan-status-sync`、`check-artifact-registry-lifecycle`、`check-docs-triad-sync`、`run-normative-loading-manifest-gate`、`check-worktree-review-target` 与 `check-code-review-status-sync` 当前都为绿色；问题集中在 formal input chain 与 dependency registration 的一致性。

## 4. Verification
1. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
3. `node ./scripts/governance/check-artifact-registry-lifecycle.js`（通过）
4. `node ./scripts/governance/check-docs-triad-sync.js`（通过）
5. `node ./scripts/governance/run-normative-loading-manifest-gate.js`（通过）
6. `node ./scripts/governance/check-worktree-review-target.js`（通过）
7. `node ./scripts/governance/check-code-review-status-sync.js`（通过）

## 复核结论（2026-03-25）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：`project-014` project plan、sprint plan、`TK-143`、`TK-144`、`TK-145`、`TK-146` 已将 `.repo-ai-governor/draft/langgraph-orchestration-technical-solution.md` 降级为 traceback/background；后续 formal baseline 已收敛为 `DA-142`、triad 与 master execution plan。
   - 处理：已修复 formal input chain，避免 draft 继续作为默认 required input 污染后续执行基线。
2. `2.2`
   - 判定：**认可**
   - 证据：`DA-142` 的使用说明已收敛为仅 `TK-143`、`TK-144` 作为 direct formal baseline 消费者，`TK-145`、`TK-146` 改为通过 `TK-143/TK-144` 与 master plan 继承；artifact registry 的 `dependent_tasks=TK-143|TK-144` 与正式消费链已一致。
   - 处理：已修复 `DA-142` 文本语义与 registry 的偏差，避免 direct consumer 定义与下游任务卡不一致。

### 验证命令
1. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
3. `node ./scripts/governance/check-artifact-registry-lifecycle.js`（通过）
4. `node ./scripts/governance/check-docs-triad-sync.js`（通过）
5. `node ./scripts/governance/run-normative-loading-manifest-gate.js`（通过）
6. `node ./scripts/governance/check-worktree-review-target.js`（通过）
7. `node ./scripts/governance/check-code-review-status-sync.js`（通过）
8. `pnpm run check`（通过）

## 修复执行记录（2026-03-25）

1. `2.1`：已完成
   - 变更文件：`.repo-ai-governor/context/dev/project-014-langgraph-orchestration-runtime-adoption/plan.md`、`.repo-ai-governor/context/dev/project-014-langgraph-orchestration-runtime-adoption/sprint-001-runtime-adoption-and-migration-baseline/plan.md`、`.repo-ai-governor/context/dev/project-014-langgraph-orchestration-runtime-adoption/sprint-001-runtime-adoption-and-migration-baseline/tasks/TK-143-process-runtime-to-langgraph-adapter-boundary-and-state-contract-baseline.md`、`.repo-ai-governor/context/dev/project-014-langgraph-orchestration-runtime-adoption/sprint-001-runtime-adoption-and-migration-baseline/tasks/TK-144-shared-local-orchestration-service-cli-desktop-contract-baseline.md`、`.repo-ai-governor/context/dev/project-014-langgraph-orchestration-runtime-adoption/sprint-001-runtime-adoption-and-migration-baseline/tasks/TK-145-langgraph-phase-0-spike-dual-runtime-parity-and-rollout-plan.md`、`.repo-ai-governor/context/dev/project-014-langgraph-orchestration-runtime-adoption/sprint-001-runtime-adoption-and-migration-baseline/tasks/TK-146-sprint-001-exit-acceptance-and-sprint-002-input-constraints.md`
   - 验证：`pnpm run check`（通过）
   - 说明：将 draft 方案文件从 downstream formal input chain 中移除，仅保留为 traceback/background。
2. `2.2`：已完成
   - 变更文件：`.repo-ai-governor/context/dev/project-014-langgraph-orchestration-runtime-adoption/sprint-001-runtime-adoption-and-migration-baseline/tasks/DA-142-langgraph-runtime-adoption-and-migration-baseline.md`、`.repo-ai-governor/context/artifact-registry/artifacts.csv`
   - 验证：`node ./scripts/governance/check-artifact-registry-lifecycle.js`（通过）
   - 说明：将 `DA-142` 的 direct consumer 范围收敛为 `TK-143|TK-144`，并使其与下游任务卡的正式输入链一致。
