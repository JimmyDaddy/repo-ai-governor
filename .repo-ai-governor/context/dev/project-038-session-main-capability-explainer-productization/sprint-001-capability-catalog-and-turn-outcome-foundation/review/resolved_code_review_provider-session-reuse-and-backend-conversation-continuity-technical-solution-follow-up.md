# Code Review: provider session reuse and backend conversation continuity technical solution follow-up

- Status: resolved
- Date: 2026-04-04
- Reviewer: AI-Agent
- Task: `draft technical solution follow-up review`
- Review Type: technical solution draft follow-up review
- Target: `.repo-ai-governor/draft/provider-session-reuse-and-backend-conversation-continuity-technical-solution.md`
- Prior Review:
  - `.repo-ai-governor/context/dev/project-038-session-main-capability-explainer-productization/sprint-001-capability-catalog-and-turn-outcome-foundation/review/resolved_code_review_provider-session-reuse-and-backend-conversation-continuity-technical-solution.md`
- Normative References:
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`

## 1. Review Scope
1. `.repo-ai-governor/draft/provider-session-reuse-and-backend-conversation-continuity-technical-solution.md`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-orchestration/adrs/session-main-supervisor-and-role-subagent-collaboration.md`
3. `packages/core-orchestration-service/src/types/interfaces/session-main-supervisor-runtime.interface.ts`

## 2. Findings
### 2.1 [P2] 单条 turn-level continuation summary 无法完整承载多 stage / 多 role turn
- 位置: `.repo-ai-governor/draft/provider-session-reuse-and-backend-conversation-continuity-technical-solution.md:380-406`
- 问题描述: 当前 draft 已经补出 `ProviderContinuationTurnSummary`，这解决了“完全没有共享审计/投影契约”的缺口；但这里仍把它建模成“一份 turn-level summary”单对象，并要求“每次 stage invoke 完成后”都把 continuation status 投影进去。与此同时，`runtime.orchestration` 的正式方向已经允许 `session.main` 在同一 turn 中调度一个或多个 role subagents，并继续扩展多 role collaboration（`.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-orchestration/adrs/session-main-supervisor-and-role-subagent-collaboration.md:23-28`, `:48-52`）；现有 service-side turn outcome 也明确承载 `interactionMode`、`invokedRoleIds[]`、`invokedRoles[]` 等多角色协作元数据（`packages/core-orchestration-service/src/types/interfaces/session-main-supervisor-runtime.interface.ts:110-137`）。在这种模型下，如果 continuation projection 只有单条 summary，而不是按 stage/lane 记录的集合或事件流，后一个 stage 很容易覆盖前一个 stage 的 continuation 状态。
- 影响: 一旦一个 turn 内出现 `serial_role_collaboration` 或 `parallel_role_fanout`，CLI/Desktop/replay/tests 可能只能看到最后一个 subagent 的 continuation 结果，早先 stage 的 `created/reused/cleared/unsupported` 证据会丢失。这会削弱方案新增的审计和诊断价值，也让 “desktop/tests 一起看见 continuation lifecycle” 在多角色路径下重新变得不完整。
- 建议: 把 canonical projection 从“单条 turn-level summary”改成“按 lane/stage 记录的 summaries 集合”或 append-only event list，例如 `continuationSummaries[]`，并至少带上 `stageId` / `roleId` 或等价稳定键。若 presenter 需要简单展示，可在其上再派生一个 `latestContinuationSummary`，但不要让它成为唯一事实源。

## 3. Notes
1. 之前关于“continuation 生命周期缺少共享审计/投影契约”的 finding，在当前 draft 中已经被新增的 `ProviderContinuationTurnSummary` 和 turn-level projection 规则实质性修复；本次 follow-up 只剩“单条 summary 不足以覆盖多 stage turn”这一条。
2. 本次没有复跑代码测试；审查对象仍然是技术方案文档与现有规范/接口边界。

## 4. Verification
1. `nl -ba .repo-ai-governor/draft/provider-session-reuse-and-backend-conversation-continuity-technical-solution.md | sed -n '360,406p'`（通过）
2. `nl -ba .repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-orchestration/adrs/session-main-supervisor-and-role-subagent-collaboration.md | sed -n '23,28p'`（通过）
3. `nl -ba .repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-orchestration/adrs/session-main-supervisor-and-role-subagent-collaboration.md | sed -n '48,66p'`（通过）
4. `nl -ba packages/core-orchestration-service/src/types/interfaces/session-main-supervisor-runtime.interface.ts | sed -n '108,137p'`（通过）

## 复核结论（2026-04-04）

- 整体结论：**认可**

### 逐条复核
1. `2.1 [P2] 单条 turn-level continuation summary 无法完整承载多 stage / 多 role turn`
   - 判定：**认可**
   - 证据：当前 draft 在 [provider-session-reuse-and-backend-conversation-continuity-technical-solution.md](/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/draft/provider-session-reuse-and-backend-conversation-continuity-technical-solution.md#L380) 中把 continuation projection 建模为单条 `ProviderContinuationTurnSummary`，并要求“每次 stage invoke 完成后”写回这一份 turn-level summary。与此同时，[session-main-supervisor-and-role-subagent-collaboration.md](/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-orchestration/adrs/session-main-supervisor-and-role-subagent-collaboration.md#L23) 已明确 `session.main` 会在同一 turn 内调度一个或多个 role subagents，且 [session-main-supervisor-runtime.interface.ts](/Users/jimmydaddy/study/ai-governor/packages/core-orchestration-service/src/types/interfaces/session-main-supervisor-runtime.interface.ts#L98) 的 turn outcome 也已经显式承载 `invokedRoleIds[]`、`invokedRoles[]` 等多角色元数据。在这种前提下，单对象 summary 的确容易被同 turn 内后续 stage 覆盖。
   - 处理：建议把 canonical projection 升级成按 lane/stage 记录的 summaries 集合或 append-only event list，并至少带上 `stageId` 与 `roleId` 或等价稳定键；若 presenter 需要简化视图，可另外派生 `latestContinuationSummary`，但不要让它成为唯一事实源。

### 验证命令
1. `nl -ba .repo-ai-governor/draft/provider-session-reuse-and-backend-conversation-continuity-technical-solution.md | sed -n '360,420p'`（通过）
2. `nl -ba .repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-orchestration/adrs/session-main-supervisor-and-role-subagent-collaboration.md | sed -n '23,30p'`（通过）
3. `nl -ba .repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-orchestration/adrs/session-main-supervisor-and-role-subagent-collaboration.md | sed -n '48,66p'`（通过）
4. `sed -n '1,220p' packages/core-orchestration-service/src/types/interfaces/session-main-supervisor-runtime.interface.ts`（通过）

## 修复执行记录（2026-04-04）

1. `2.1 [P2] 单条 turn-level continuation summary 无法完整承载多 stage / 多 role turn`：已完成
   - 变更文件：`.repo-ai-governor/draft/provider-session-reuse-and-backend-conversation-continuity-technical-solution.md`
   - 验证：`sed -n '360,420p' .repo-ai-governor/draft/provider-session-reuse-and-backend-conversation-continuity-technical-solution.md`（通过）
   - 说明：已把 canonical projection 从单条 `ProviderContinuationTurnSummary` 调整为 `ProviderContinuationTurnProjection + continuationSummaries[]` 集合模型，并补上 `turnId`、`stageId`、`roleId` 以及 `latestContinuationSummary` 仅为派生视图的约束，避免多 stage / 多 role turn 内的 summary 被后写覆盖。
2. docs-only closeout：已完成
   - 变更文件：`.repo-ai-governor/draft/provider-session-reuse-and-backend-conversation-continuity-technical-solution.md`
   - 验证：未运行 `pnpm run build`
   - 说明：本次仅修改技术方案 draft 与 review 生命周期文件，未触及 `apps/**`、`packages/**`、`bin/**`、`test/**` 下可执行代码，因此 build not required。
