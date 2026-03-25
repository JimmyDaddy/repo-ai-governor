# Code Review: Working Tree LangGraph Productization And Stream Routing

- Status: resolved
- Date: 2026-03-26
- Reviewer: AI-Agent
- Task: `n/a`
- Review Type: working tree review
- Normative References:
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`

## 1. Review Scope
1. `packages/core-runtime-langgraph/src/langgraph-runtime-backend.ts`
2. `packages/core-runtime/src/process-runtime-facade.ts`
3. `packages/core-orchestration-service/src/local-orchestration-service-sidecar-client.ts`
4. `packages/core-orchestration-service/src/local-orchestration-service-sidecar-host.ts`
5. `packages/core-orchestration-service/src/local-orchestration-service-shell.ts`
6. `apps/cli/src/runtime/orchestration-service-runtime.ts`
7. `.repo-ai-governor/context/current-context.md`
8. `.repo-ai-governor/context/completed-streams-history.md`
9. `.repo-ai-governor/context/dev/project-016-langgraph-runtime-productization/plan.md`
10. `.repo-ai-governor/context/dev/project-016-langgraph-runtime-productization/project-016-langgraph-runtime-productization-completion-audit-summary.md`

## 2. Findings
### 2.1 [P1] “graph-first” backend still executes as recursive edge walk and breaks converging DAG semantics
- 位置: `packages/core-runtime-langgraph/src/langgraph-runtime-backend.ts:210`
- 问题描述: `executeNode()` 只按 `fromNodeId -> toNodeId` 递归推进，并在 `fan_out` 场景对每条 outgoing edge 直接 `Promise.all(...)` 下钻；整个执行过程中没有任何基于 `incomingEdgeIds`、dependency count 或 join barrier 的调度逻辑。`CompiledIrGraphAdapter` 明明已经把 `incomingEdgeIds` 算出来了，但 backend 完全没有消费它。结果是只要图里存在 converging DAG，join 节点就会按“每条入边一次”被重复执行，而不是在依赖满足后只执行一次。
- 影响: 这会让 `project-016` 宣称的 graph-first execution semantics 与真实执行语义不一致。并发/条件分支后的汇合节点会出现重复 stage side effect、visitedNodeIds 漂移和 parity 误报，属于执行正确性问题，不只是测试缺口。
- 建议: 在 backend 中引入真正的 DAG scheduler 语义，至少要基于 `incomingEdgeIds` 做 ready-set / join barrier 调度；如果暂时做不到，就不要把当前实现描述为 graph-first execution baseline。补一条最小回归测试：`A -> parallel(B,C) -> D`，断言 `D` 只执行一次。

### 2.2 [P2] `project-016` 已归档为 completed，但当前未交付工作树仍然主要属于它
- 位置: `.repo-ai-governor/context/current-context.md:5`, `.repo-ai-governor/context/completed-streams-history.md:15`, `.repo-ai-governor/context/dev/project-016-langgraph-runtime-productization/project-016-langgraph-runtime-productization-completion-audit-summary.md:10`
- 问题描述: `current-context.md` 已把 primary stream 切到 `project-015`，同时 `completed-streams-history.md` 已将 `project-016 / sprint-001` 归档为 completed，completion audit 也写成正式 handoff 完成。但当前 working tree 里仍有大量 `project-016` 文档、task ledger 和相关代码改动处于未提交状态。这样一来，默认 CR 路由已经落到 `project-015/review/`，而实际被评审的变更却主要属于 `project-016`。
- 影响: 这会让后续 review、台账和交付证据落错 stream，重新引入你们前面刚修过的 “completed stream 提前移出 active surface，导致 CR 归属偏移” 问题。
- 建议: 在这批 `project-016` 工作树真正收尾前，不要把它完全从默认执行面移走。更稳的做法有两种：要么保持 `project-016` 为 active 直到交付闭环；要么在切到 `project-015` 的同时登记 `Worktree Review Target=project-016`，至少保证默认 CR 仍写回 `project-016/review/`。

## 3. Notes
1. 现有测试通过，说明这轮风险主要落在“未覆盖的执行语义”和“执行流归属”上，不是类型或基础 smoke 直接失败。
2. `sidecar + ipc` host/client 本身这轮没有看到阻塞性实现错误；更大的风险点仍在运行时语义和治理路由。
3. `pnpm run check` 在本次修复后仍被仓库里已有的 triad drift 阻塞：已修改 [product-requirements.md](/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/normative_knowledge_sources/product-requirements.md) 但未同步 [product-requirements-brief.md](/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md)。这不属于本次 CR 的修复范围。

## 4. Verification
1. `git status --short`（通过）
2. `git diff --stat`（通过）
3. `pnpm -s tsc -p tsconfig.json --noEmit`（通过）
4. `pnpm exec vitest run packages/core-runtime-langgraph/test/langgraph-runtime-backend.unit.test.ts packages/core-runtime/test/process-runtime-facade.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-sidecar-client.integration.test.ts apps/cli/test/runtime/orchestration-service-runtime.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）

## 复核结论（2026-03-26）

- 整体结论：**认可**

### 逐条复核
1. `2.1 [P1] “graph-first” backend still executes as recursive edge walk and breaks converging DAG semantics`
   - 判定：**认可**
   - 证据：复核 [langgraph-runtime-backend.ts](/Users/jimmydaddy/study/ai-governor/packages/core-runtime-langgraph/src/langgraph-runtime-backend.ts) 后确认，原实现只做递归 edge walk，`fan_out` 下游汇合节点没有 join barrier；`incomingEdgeIds` 已由 [compiled-ir-graph-adapter.ts](/Users/jimmydaddy/study/ai-governor/packages/core-runtime-langgraph/src/compiled-ir-graph-adapter.ts) 产出，但原 backend 没有消费。
   - 处理：已接受并修复，补上 `fan_out` 分支收敛时的最小 join barrier，并新增 `A -> parallel(B,C) -> D` 回归。
2. `2.2 [P2] project-016 已归档为 completed，但当前未交付工作树仍然主要属于它`
   - 判定：**认可**
   - 证据：pending CR 最初被写入 active primary stream 的 [project-015 review 目录](/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-015-memory-provider-pluginization/sprint-001-registry-and-plugin-resolution-baseline/review/)，而评审范围主体是 `project-016` 的未提交变更。
   - 处理：已将该 pending CR 迁回 [project-016 review 目录](/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-016-langgraph-runtime-productization/sprint-001-vendor-adapter-and-sidecar-baseline/review/)，并在该 completed stream 下完成 verified/resolved 生命周期。由于本次收口后不再存在 open `project-016` CR，因此未保留 `Worktree Review Target` 悬挂 override。

### 验证命令
1. `pnpm exec vitest run packages/core-runtime-langgraph/test/langgraph-runtime-backend.unit.test.ts packages/core-runtime/test/process-runtime-facade.unit.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
2. `node ./scripts/governance/check-code-review-status-sync.js`（通过）
3. `pnpm run check`（失败：被现有 `product-requirements.md -> product-requirements-brief.md` triad sync drift 阻塞）

## 修复执行记录（2026-03-26）

1. `2.1 [P1] “graph-first” backend still executes as recursive edge walk and breaks converging DAG semantics`：已完成
   - 变更文件：`packages/core-runtime-langgraph/src/langgraph-runtime-backend.ts`、`packages/core-runtime-langgraph/test/langgraph-runtime-backend.unit.test.ts`
   - 验证：`pnpm exec vitest run packages/core-runtime-langgraph/test/langgraph-runtime-backend.unit.test.ts packages/core-runtime/test/process-runtime-facade.unit.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
   - 说明：新增基于 `fan_out` 分支上下文的 join barrier；并发分支汇合节点只在预期 branch 全部到达后执行一次。
2. `2.2 [P2] project-016 已归档为 completed，但当前未交付工作树仍然主要属于它`：已完成
   - 变更文件：`.repo-ai-governor/context/dev/project-016-langgraph-runtime-productization/sprint-001-vendor-adapter-and-sidecar-baseline/review/resolved_code_review_working-tree-20260326-0440.md`
   - 验证：`node ./scripts/governance/check-code-review-status-sync.js`（通过）
   - 说明：将当前 CR 从 `project-015` review 目录迁回 `project-016` review 目录，并在该 stream 下完成生命周期闭环。
