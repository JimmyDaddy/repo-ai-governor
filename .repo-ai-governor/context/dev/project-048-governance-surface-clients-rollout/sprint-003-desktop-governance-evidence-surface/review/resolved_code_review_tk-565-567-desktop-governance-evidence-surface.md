# Code Review: sprint-003-desktop-governance-evidence-surface

- Status: resolved
- Date: 2026-04-05
- Reviewer: AI-Agent
- Task: `TK-565 / TK-566 / TK-567`
- Review Type: owned scope review
- Normative References:
  - `AGENTS.md`
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/module-overview.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/governance-surface-client-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/desktop-command-center-and-vscode-editor-companion-split.md`

## 1. Review Scope
1. `packages/orchestration-service-client/src/types/interfaces/orchestration-service-client.interface.ts`
2. `packages/orchestration-service-client/src/types/interfaces/index.ts`
3. `packages/orchestration-service-client/src/types/index.ts`
4. `packages/orchestration-service-client/src/index.ts`
5. `packages/core-orchestration-service/src/local-orchestration-service-artifact-pane-query-runtime.ts`
6. `packages/core-orchestration-service/test/local-orchestration-service-artifact-pane-query-runtime.unit.test.ts`
7. `apps/desktop/src/types/interfaces/desktop-governance-console.interface.ts`
8. `apps/desktop/src/runtime/desktop-governance-console-view-model-builder.ts`
9. `apps/desktop/test/desktop-governance-console-view-model-builder.test.ts`
10. `apps/desktop/test/desktop-shell-bootstrap.test.ts`
11. `apps/desktop/README.md`
12. `integrations/desktop/README.md`
13. `.repo-ai-governor/context/dev/project-048-governance-surface-clients-rollout/plan.md`
14. `.repo-ai-governor/context/dev/project-048-governance-surface-clients-rollout/sprint-003-desktop-governance-evidence-surface/plan.md`
15. `.repo-ai-governor/context/dev/project-048-governance-surface-clients-rollout/sprint-003-desktop-governance-evidence-surface/tasks/TK-565-freeze-governance-evidence-read-model-and-artifact-workbench-detail-contract.md`
16. `.repo-ai-governor/context/dev/project-048-governance-surface-clients-rollout/sprint-003-desktop-governance-evidence-surface/tasks/TK-566-implement-policy-trace-review-lifecycle-navigation-and-governance-evidence-surfaces.md`
17. `.repo-ai-governor/context/dev/project-048-governance-surface-clients-rollout/sprint-003-desktop-governance-evidence-surface/tasks/TK-567-close-desktop-governance-evidence-surface-with-targeted-verification-and-docs-sync.md`
18. `.repo-ai-governor/context/dev/project-048-governance-surface-clients-rollout/sprint-003-desktop-governance-evidence-surface/tasks/checklist.md`
19. `.repo-ai-governor/context/dev/project-048-governance-surface-clients-rollout/sprint-003-desktop-governance-evidence-surface/tasks/tasks.csv`

## 2. Findings
### 2.1 [P1] Execution-scoped evidence detail can point at the wrong review lifecycle record
- 位置: `packages/core-orchestration-service/src/local-orchestration-service-artifact-pane-query-runtime.ts:396`
- 问题描述: `reviewLifecycle` 与 `workbench` 直接使用 `reviews[0]` 作为 latest review，而 query 早已解析出 execution-scoped `reviewDocumentPath`。当 review 目录中最新文件属于另一个 execution 时，desktop evidence surface 会同时暴露匹配 execution 的 `policyTrace.reviewDocumentPath` 与不匹配的 latest review metadata，形成 service-owned truth 自相矛盾。
- 影响: desktop evidence pane 可能把用户导航到错误的 review lifecycle 文档，破坏 `execution -> review` continuity contract。
- 建议: 当 execution-scoped review document 已解析时，优先用该文档驱动 `reviewLifecycle` / `workbench` 的 latest review 字段，或将 review slice 先收敛到 execution-owned subset，并补一条“匹配 review 不是目录最新文件”的回归测试。

### 2.2 [P2] Backlink payload bypasses the requested artifact/review limits
- 位置: `packages/core-orchestration-service/src/local-orchestration-service-artifact-pane-query-runtime.ts:84`
- 问题描述: 顶层 `artifacts` / `reviews` 已按 `artifactLimit` / `reviewLimit` 切片，但 `evidenceBacklinks` 仍从未切片的 `allArtifacts` / `allReviews` 组装路径列表。
- 影响: desktop renderer 虽然请求了受限 payload，IPC 侧仍会携带全部 artifact/review paths，随着 evidence 积累会增加延迟和内存占用。
- 建议: `evidenceBacklinks` 改为消费已切片后的 service-owned collections，或显式新增 backlink limits 与 total counts，并补一条 limit regression test。

### 2.3 [P2] `worktreePath` contract label points at the governance workspace rather than the repo worktree
- 位置: `packages/core-orchestration-service/src/local-orchestration-service-artifact-pane-query-runtime.ts:476`
- 问题描述: `evidenceBacklinks.worktreePath` 现在返回的是 orchestration workspace root（本仓库中为 `.repo-ai-governor`），但字段名语义却宣称这是 repo worktree。
- 影响: 该 contract 会把 consumer 引到治理台账目录而不是真实仓库根目录，造成 handoff / backlink 语义漂移。
- 建议: 若当前 service-owned truth 只能提供治理 workspace root，则应把 contract 字段改名为更精确的 `governanceWorkspacePath`（或等价命名）；若必须保留 worktree 语义，则需要接入真实 repo/worktree source 后再暴露。

## 3. Notes
1. reviewer 子 agent 本轮只审了 sprint-003 owned scope，没有把 `project-047` baseline 脏文件纳入范围。
2. 当前 findings 都集中在 evidence DTO 与 desktop evidence section 的 correctness / payload boundary，不涉及 renderer 自建真值回退。

## 4. Verification
1. `pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-artifact-pane-query-runtime.unit.test.ts apps/desktop/test/desktop-governance-console-view-model-builder.test.ts apps/desktop/test/desktop-shell-bootstrap.test.ts apps/desktop/test/desktop-preload-bridge.test.ts`（通过）
2. `pnpm run build`（通过）
3. `pnpm run check:desktop-entry-smoke`（通过）

## 复核结论（2026-04-05）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：`query()` 之前确实把 `allReviews` 直接用于 `reviewLifecycle` / `workbench` latest review 选择，而 execution-scoped `reviewDocumentPath` 已提前解析完成；多 review 文件场景下会发生 detail contradiction。
   - 处理：已引入 execution-scoped review 收敛逻辑；当 `reviewDocumentPath` 可解析时，review slice 会优先收敛到该 execution-owned review，再由 `reviews/reviewLifecycle/workbench` 统一消费，并补了“匹配 review 不是目录最新文件”的回归测试。
2. `2.2`
   - 判定：**认可**
   - 证据：`evidenceBacklinks` 之前仍使用 `allArtifacts` / `allReviews` 组装路径，确实绕过了 query request 的 `artifactLimit` / `reviewLimit`。
   - 处理：已让 `evidenceBacklinks` 只消费切片后的 `artifacts` / `reviews`，并补了 review limit regression coverage。
3. `2.3`
   - 判定：**认可**
   - 证据：当前 runtime 只能稳定提供 orchestration workspace root，字段名 `worktreePath` 会把 consumer 误导为 repo root handoff。
   - 处理：已将 contract 重命名为 `governanceWorkspacePath`，同步调整 desktop builder 与测试，避免语义漂移。

### 验证命令
1. `pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-artifact-pane-query-runtime.unit.test.ts apps/desktop/test/desktop-governance-console-view-model-builder.test.ts apps/desktop/test/desktop-shell-bootstrap.test.ts apps/desktop/test/desktop-preload-bridge.test.ts`（通过）
2. `pnpm run build`（通过）
3. `pnpm run check:desktop-entry-smoke`（通过）
4. `pnpm exec biome check packages/orchestration-service-client/src/types/interfaces/orchestration-service-client.interface.ts packages/core-orchestration-service/src/local-orchestration-service-artifact-pane-query-runtime.ts packages/core-orchestration-service/test/local-orchestration-service-artifact-pane-query-runtime.unit.test.ts apps/desktop/src/types/interfaces/desktop-governance-console.interface.ts apps/desktop/src/runtime/desktop-governance-console-view-model-builder.ts apps/desktop/test/desktop-governance-console-view-model-builder.test.ts apps/desktop/test/desktop-shell-bootstrap.test.ts apps/desktop/README.md integrations/desktop/README.md`（通过）

## 修复执行记录（2026-04-05）

1. `2.1`：已完成
   - 变更文件：`packages/core-orchestration-service/src/local-orchestration-service-artifact-pane-query-runtime.ts`、`packages/core-orchestration-service/test/local-orchestration-service-artifact-pane-query-runtime.unit.test.ts`
   - 验证：`pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-artifact-pane-query-runtime.unit.test.ts`（通过）
   - 说明：execution-scoped review document 现在会驱动 review slice、review lifecycle 与 workbench latest review 选择，避免 evidence detail 与 policy trace 相互矛盾。
2. `2.2`：已完成
   - 变更文件：`packages/core-orchestration-service/src/local-orchestration-service-artifact-pane-query-runtime.ts`、`packages/core-orchestration-service/test/local-orchestration-service-artifact-pane-query-runtime.unit.test.ts`
   - 验证：`pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-artifact-pane-query-runtime.unit.test.ts`（通过）
   - 说明：evidence backlinks 已改为消费切片后的 service-owned collections，不再绕过 query request limits。
3. `2.3`：已完成
   - 变更文件：`packages/orchestration-service-client/src/types/interfaces/orchestration-service-client.interface.ts`、`packages/core-orchestration-service/src/local-orchestration-service-artifact-pane-query-runtime.ts`、`apps/desktop/src/runtime/desktop-governance-console-view-model-builder.ts`、`apps/desktop/test/desktop-governance-console-view-model-builder.test.ts`、`apps/desktop/test/desktop-shell-bootstrap.test.ts`
   - 验证：`pnpm exec vitest run apps/desktop/test/desktop-governance-console-view-model-builder.test.ts apps/desktop/test/desktop-shell-bootstrap.test.ts`（通过）
   - 说明：contract field 已更名为 `governanceWorkspacePath`，明确它指向治理 workspace 而非 repo worktree。

## 复审补充结论（2026-04-05）

- reviewer 子 agent 在修复后复审中发现 1 条新增 actionable finding。

### 新增问题
1. `R2.1` [P2] test fixture 使用裸字符串导致 stricter TypeScript 编译不安全
   - 位置：`packages/core-orchestration-service/test/local-orchestration-service-artifact-pane-query-runtime.unit.test.ts:127`
   - 问题描述：新增 regression fixture 使用裸字符串加 `as const`，未显式对齐 `OrchestrationExecutionSummary` / `OrchestrationSessionSummary` 的 enum-valued fields。
   - 影响：在更严格的类型检查场景下会造成 test surface 的静态类型漂移，降低 regression coverage 的可信度。
   - 建议：使用 exported enum members，并让 fixture `satisfies` 对应 DTO interfaces。

### 主 agent 复核
1. `R2.1`
   - 判定：**认可**
   - 证据：新增 fixture 确实把 `executionKind/clientSurface/serviceHostKind/serviceTransportKind/status/latestEventType/session status/session event type` 写成了裸字符串。
   - 处理：已将 fixture 改为使用 exported enums，并通过 `satisfies OrchestrationExecutionSummary / OrchestrationSessionSummary` 固定 DTO 形状。

### 补充验证命令
1. `pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-artifact-pane-query-runtime.unit.test.ts apps/desktop/test/desktop-governance-console-view-model-builder.test.ts apps/desktop/test/desktop-shell-bootstrap.test.ts apps/desktop/test/desktop-preload-bridge.test.ts`（通过）
2. `pnpm run build`（通过）
3. `pnpm run check:desktop-entry-smoke`（通过）
4. `pnpm exec biome check packages/core-orchestration-service/test/local-orchestration-service-artifact-pane-query-runtime.unit.test.ts packages/core-orchestration-service/src/local-orchestration-service-artifact-pane-query-runtime.ts packages/orchestration-service-client/src/types/interfaces/orchestration-service-client.interface.ts apps/desktop/src/runtime/desktop-governance-console-view-model-builder.ts apps/desktop/test/desktop-governance-console-view-model-builder.test.ts apps/desktop/test/desktop-shell-bootstrap.test.ts`（通过）
5. `pnpm exec tsc -p tsconfig.json --noEmit`（失败：仓库其他既有 test/type 问题，不属于本 sprint owned scope；本次新增 fixture 已不再报类型错误）

## 修复补充记录（2026-04-05）

1. `R2.1`：已完成
   - 变更文件：`packages/core-orchestration-service/test/local-orchestration-service-artifact-pane-query-runtime.unit.test.ts`
   - 验证：`pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-artifact-pane-query-runtime.unit.test.ts`（通过）
   - 说明：test fixture 现已改为 typed DTO + enum members，不再依赖裸字符串和 `as const` 碰运气通过。

## 复审补充结论（2026-04-05，第二轮）

- reviewer 子 agent 在第二轮修复后复审中发现 2 条新增 actionable finding。

### 新增问题
1. `R3.1` [P1] execution-scoped review miss path 仍会回退到全目录 review
   - 位置：`packages/core-orchestration-service/src/local-orchestration-service-artifact-pane-query-runtime.ts:506`
   - 问题描述：`scopeReviewsToExecution()` 在 execution 已知但 `reviewDocumentPath` 无法解析时，之前仍会回退到整个 review 目录，从而把 unrelated review lifecycle/workbench data 暴露给当前 execution。
   - 影响：`execution -> review` continuity 在“尚未产出 review / 匹配不唯一”路径下仍可能被污染。
   - 建议：execution-scoped miss path 返回空 review scope，并补一条只存在 `TK-999` review 文件时查询 `TK-565` 的 regression test。
2. `R3.2` [P2] artifact pane 顶层状态会被 truncated review slice 误导
   - 位置：`apps/desktop/src/runtime/desktop-governance-console-view-model-builder.ts:548`
   - 问题描述：artifact pane summary badge 之前仍只看 `artifactPane.reviews` 切片，而 `reviewLifecycle.pendingReviewCount` 来源于 full scoped review set。
   - 影响：desktop summary badge 可能显示 `SUCCESS`，但 detail section 仍提示存在 pending reviews。
   - 建议：顶层 badge 改为以 `reviewLifecycle.pendingReviewCount` 为准，并补一条 pending count 与 truncated review slice 不一致的 builder regression test。

### 主 agent 复核
1. `R3.1`
   - 判定：**认可**
   - 证据：executionSummary 已知但 review miss 时，回退到全目录 review 的确会把 unrelated CR 引入当前 execution evidence surface。
   - 处理：已将 execution-scoped miss path 改为返回空 review scope，并补了 `TK-565` 查询只遇到 `TK-999` review 文件时的 regression test。
2. `R3.2`
   - 判定：**认可**
   - 证据：artifact pane 顶层状态确实与 `reviewLifecycle.pendingReviewCount` 的 full-scope 事实脱节，存在 slice mismatch。
   - 处理：已让 `resolveArtifactPaneStatusVariant()` 直接基于 `reviewLifecycle.pendingReviewCount` / `totalReviewCount` 决策，并补了 builder regression test。

### 补充验证命令
1. `pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-artifact-pane-query-runtime.unit.test.ts apps/desktop/test/desktop-governance-console-view-model-builder.test.ts apps/desktop/test/desktop-shell-bootstrap.test.ts apps/desktop/test/desktop-preload-bridge.test.ts`（通过）
2. `pnpm run build`（通过）
3. `pnpm run check:desktop-entry-smoke`（通过）
4. `pnpm exec biome check packages/core-orchestration-service/src/local-orchestration-service-artifact-pane-query-runtime.ts packages/core-orchestration-service/test/local-orchestration-service-artifact-pane-query-runtime.unit.test.ts apps/desktop/src/runtime/desktop-governance-console-view-model-builder.ts apps/desktop/test/desktop-governance-console-view-model-builder.test.ts`（通过）

## 修复补充记录（2026-04-05，第二轮）

1. `R3.1`：已完成
   - 变更文件：`packages/core-orchestration-service/src/local-orchestration-service-artifact-pane-query-runtime.ts`、`packages/core-orchestration-service/test/local-orchestration-service-artifact-pane-query-runtime.unit.test.ts`
   - 验证：`pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-artifact-pane-query-runtime.unit.test.ts`（通过）
   - 说明：execution-scoped review miss 现在不会再回退到 unrelated review lifecycle 数据。
2. `R3.2`：已完成
   - 变更文件：`apps/desktop/src/runtime/desktop-governance-console-view-model-builder.ts`、`apps/desktop/test/desktop-governance-console-view-model-builder.test.ts`
   - 验证：`pnpm exec vitest run apps/desktop/test/desktop-governance-console-view-model-builder.test.ts`（通过）
   - 说明：artifact pane 顶层 badge 现在与 review lifecycle pending counts 保持一致，不再被 truncated slice 误导。

## 复审补充结论（2026-04-05，第三轮）

- reviewer 子 agent 在第三轮复审中发现 1 条新增 actionable finding。

### 新增问题
1. `R4.1` [P2] `transcriptLimit=0` 仍会泄露 transcript payload
   - 位置：`packages/core-orchestration-service/src/local-orchestration-service-artifact-pane-query-runtime.ts:237`
   - 问题描述：`readTranscript()` 之前在 `limit=0` 时仍会走到 `.slice(-0)` 分支，等价于 `.slice(0)`，从而把 transcript window 全量返回。
   - 影响：caller 无法显式关闭 transcript payload，IPC 仍会携带 session text 与 transcript backlinks。
   - 建议：在 `limit <= 0` 时直接短路返回空数组，并补一条 `transcriptLimit=0` 的 regression test。

### 主 agent 复核
1. `R4.1`
   - 判定：**认可**
   - 证据：`slice(-0)` 的确不会清空数组，`transcriptLimit=0` 无法达到“禁止 transcript payload”的契约效果。
   - 处理：已在 `readTranscript()` 中对 `limit <= 0` 做短路，并补了“不得触发 subscribeSession / transcript 与 transcript backlinks 均为空”的 regression test。

### 补充验证命令
1. `pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-artifact-pane-query-runtime.unit.test.ts apps/desktop/test/desktop-governance-console-view-model-builder.test.ts apps/desktop/test/desktop-shell-bootstrap.test.ts apps/desktop/test/desktop-preload-bridge.test.ts`（通过）
2. `pnpm run build`（通过）
3. `pnpm run check:desktop-entry-smoke`（通过）
4. `pnpm exec biome check packages/core-orchestration-service/src/local-orchestration-service-artifact-pane-query-runtime.ts packages/core-orchestration-service/test/local-orchestration-service-artifact-pane-query-runtime.unit.test.ts apps/desktop/src/runtime/desktop-governance-console-view-model-builder.ts apps/desktop/test/desktop-governance-console-view-model-builder.test.ts`（通过）

## 修复补充记录（2026-04-05，第三轮）

1. `R4.1`：已完成
   - 变更文件：`packages/core-orchestration-service/src/local-orchestration-service-artifact-pane-query-runtime.ts`、`packages/core-orchestration-service/test/local-orchestration-service-artifact-pane-query-runtime.unit.test.ts`
   - 验证：`pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-artifact-pane-query-runtime.unit.test.ts`（通过）
   - 说明：`transcriptLimit=0` 现在会真正返回空 transcript，并阻止 transcript backlinks 继续透传。

## 子 agent 最终复审结果（2026-04-05）

1. reviewer 子 agent 最终复审结论：`No actionable findings.`
2. 结论：`sprint-003` owned scope 已达到零 actionable finding，可正式关闭当前 sprint 的 reviewer loop。
