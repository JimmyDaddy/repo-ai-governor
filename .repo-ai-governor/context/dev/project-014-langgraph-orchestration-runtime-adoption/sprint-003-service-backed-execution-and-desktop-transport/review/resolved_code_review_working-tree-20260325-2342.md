# Code Review: Working Tree Service-Backed Execution And Stream Closure

- Status: resolved
- Date: 2026-03-25
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
1. `packages/core-orchestration-service/src/local-orchestration-service-shell.ts`
2. `apps/cli/src/runtime/orchestration-service-runtime.ts`
3. `apps/cli/src/cli-governance-runtime.ts`
4. `apps/cli/src/commands/review-command.ts`
5. `apps/cli/src/commands/review-verify-command.ts`
6. `packages/orchestration-service-client/src/types/interfaces/orchestration-service-client.interface.ts`
7. `packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts`
8. `apps/cli/test/runtime/orchestration-service-runtime.test.ts`
9. `.repo-ai-governor/context/current-context.md`
10. `.repo-ai-governor/context/dev/project-014-langgraph-orchestration-runtime-adoption/plan.md`
11. `.repo-ai-governor/context/dev/project-014-langgraph-orchestration-runtime-adoption/sprint-003-service-backed-execution-and-desktop-transport/plan.md`
12. `.repo-ai-governor/context/dev/project-014-langgraph-orchestration-runtime-adoption/project-014-langgraph-orchestration-runtime-adoption-completion-audit-summary.md`

## 2. Findings
### 2.1 [P1] Service-backed execution state still disappears when the CLI process exits
- 位置: `packages/core-orchestration-service/src/local-orchestration-service-shell.ts:51`, `apps/cli/src/runtime/orchestration-service-runtime.ts:96`
- 问题描述: `LocalOrchestrationServiceShell` 把 execution summary、event stream 和 stream index 全部只保存在进程内 `Map` 中；`CliOrchestrationServiceRuntime` 仍在每个 CLI 进程内懒加载一个新的 embedded shell。当前没有任何从 workspace 回放 summary/event stream 的加载路径，所以 `getExecution/listExecutions/subscribeExecution/recoverExecution` 只能看到“当前这个进程里新建过”的 execution。
- 影响: 这会让 `orchestration-service-client` 对外暴露的 service-backed contract 只在单进程内成立。一旦 `review`、`review-verify`、后续 desktop client 或未来 sidecar/daemon host 跨进程访问同一 workspace，前一个进程创建的 execution 就不可见，`list/stream/recover` 语义会失真。
- 建议: 要么把 execution summary/event stream 持久化到 service-owned workspace store，并在 shell 启动时重建索引；要么在对外宣称 stable service-backed API 之前，先切到真正的长生命周期 local service process。至少补一条回归测试：创建 execution -> 重建 service owner -> 再验证 `get/list/subscribe/recover` 仍可工作。

### 2.2 [P2] Completed `project-014 / sprint-003` is still routed as the active primary stream
- 位置: `.repo-ai-governor/context/current-context.md:5`, `.repo-ai-governor/context/dev/project-014-langgraph-orchestration-runtime-adoption/plan.md:3`, `.repo-ai-governor/context/dev/project-014-langgraph-orchestration-runtime-adoption/sprint-003-service-backed-execution-and-desktop-transport/plan.md:3`, `.repo-ai-governor/context/dev/project-014-langgraph-orchestration-runtime-adoption/project-014-langgraph-orchestration-runtime-adoption-completion-audit-summary.md:1`
- 问题描述: 当前变更已经把 `project-014`、`sprint-003` 和项目级 completion audit 全部写成 `completed`，但 `current-context.md` 仍把同一条 stream 声明为 active primary。`current-context.md` 自己的 update rule 3 明确要求 completed stream 从 `Active Streams` 移入 completed history。
- 影响: 后续任务台账和默认 CR 输出会继续落到一个已经 completed 的 stream 上，直接污染 project closure，并让 follow-up 工作的真实归属继续漂移。
- 建议: 二选一处理即可：要么在本次交付窗口内把 `project-014 / sprint-003` 迁入 completed history；要么在真正切流前不要把 project/sprint 标成 `completed`。不要保留 “completed 但仍是 active primary” 的中间状态。

## 3. Notes
1. 这轮最显著的风险不在“代码编不过”，而在 service state 持久化边界和 completed stream 路由边界。
2. `project-015` 目前只是 planned follow-up；本次 findings 不针对它的 draft/project bootstrap 本身。

## 4. Verification
1. `git status --short`（通过）
2. `git diff --stat`（通过）
3. `pnpm -s tsc -p tsconfig.json --noEmit`（通过）
4. `pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts apps/cli/test/runtime/orchestration-service-runtime.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）

## 5. 复核结论（2026-03-26）
1. `2.1 [P1]` 接受。当前实现仍然只把 execution summary / event stream 保存在进程内 `Map` 中；新的 CLI 进程无法从 workspace 重建 execution state，因此 service-backed `get/list/stream/recover` 跨进程语义不成立。
2. `2.2 [P2]` 接受。`project-014 / sprint-003` 已在 project plan、sprint plan 和 completion audit 中标记为 `completed`，但 `current-context.md` 仍将其作为 active primary stream，违反 completed stream 迁入 history 的规则。

## 6. 修复执行记录（2026-03-26）
1. 已在 `packages/core-orchestration-service/src/local-orchestration-service-shell.ts` 增加 workspace-backed execution record store，将 execution summary / event stream 持久化到 `.repo-ai-governor/context/runtime/orchestration-service/executions/*.json`，并在 shell 启动时重建索引。
2. 已补跨进程回归：
   - `packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts`
   - `apps/cli/test/runtime/orchestration-service-runtime.test.ts`
   两条用例都改为“先由一个 service owner 写入 execution，再由新的 service owner/runtime 重新读取并验证 `get/list/subscribe/recover`”。
3. 已将 `project-014 / sprint-003` 从 `current-context.md` 的 active surface 移出，迁入 `.repo-ai-governor/context/completed-streams-history.md`，并建立 `project-015-memory-provider-pluginization` 的最小 active stream skeleton 作为新的 primary stream。
4. 已同步以下 active-surface 文档，消除 completed/active 漂移：
   - `.repo-ai-governor/context/dev/index.md`
   - `.repo-ai-governor/context/dev/projects-overview.md`
   - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-master-execution-plan.md`
   - `.repo-ai-governor/context/dev/project-015-memory-provider-pluginization/**`
5. 修复后验证通过：
   - `pnpm -s tsc -p tsconfig.json --noEmit`
   - `pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts apps/cli/test/runtime/orchestration-service-runtime.test.ts --maxWorkers=1 --maxConcurrency=1`
