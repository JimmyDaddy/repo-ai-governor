# Code Review: sprint-004 automation queue and multi-workspace governance

- Status: resolved
- Date: 2026-04-05
- Reviewer: AI-Agent
- Task: `TK-568/TK-569/TK-570`
- Review Type: sprint owned scope review
- Normative References:
  - `AGENTS.md`
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/module-overview.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/governance-surface-client-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/desktop-command-center-and-vscode-editor-companion-split.md`

## 1. Review Scope
1. `packages/orchestration-service-client/src/**`
2. `packages/core-orchestration-service/src/**`
3. `packages/core-orchestration-service/test/**`
4. `apps/desktop/src/**`
5. `apps/desktop/test/**`
6. `apps/desktop/README.md`
7. `integrations/desktop/**`
8. `test/desktop-entry-smoke.integration.test.ts`
9. `project-048 / sprint-004` ledger docs

## 2. Findings
### 2.1 [P1] queue overview aggregate truth is truncated by UI list limits
- 位置: `packages/core-orchestration-service/src/local-orchestration-service-queue-overview-query-runtime.ts`
- 问题描述: `automationInbox` / `reviewQueue` 先按 `limit` 截断，再用截断后的数组计算 `workspaceSummary`、`pendingItemCount`、`dueSoonItemCount`、`overdueItemCount` 与 `activeWorkspaceCount`，导致 desktop 使用小窗口 limit 拉取时会少报 backlog。
- 影响: notification ownership、multi-workspace overview 与 follow-up SLA 不再代表 orchestration-owned canonical truth，违背 service-owned queue/overview seam。
- 建议: 先基于完整匹配集计算 queue/workspace 聚合，再只对返回给 UI 的列表切片；补 `queryQueueOverview({ limit: 1, workspaceLimit: 1 })` 的回归测试。

### 2.2 [P2] review-only workspace is omitted from workspace summary
- 位置: `packages/core-orchestration-service/src/local-orchestration-service-queue-overview-query-runtime.ts`
- 问题描述: unmatched review 已允许进入 `reviewQueue`，但 `buildWorkspaceSummary` 只从 execution 集合建 workspace map，导致“只有 open review、没有匹配 execution”的 workspace 永远不会进入 `workspaceSummary`。
- 影响: sprint-004 的 multi-workspace governance summary 会漏掉真实 backlog workspace，desktop queue surface 无法看到完整治理范围。
- 建议: 用 execution workspaces 与 queue-entry workspaces 的并集构建 summary，并补一个“open review without execution”回归测试。

## 3. Notes
1. 当前 findings 均来自 sprint-004 owned scope；未把 `project-047` baseline dirty files 纳入本轮结论。

## 4. Verification
1. `pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-sidecar-client.integration.test.ts apps/desktop/test/desktop-governance-console-view-model-builder.test.ts apps/desktop/test/desktop-preload-bridge.test.ts apps/desktop/test/desktop-shell-bootstrap.test.ts test/desktop-entry-smoke.integration.test.ts`（通过）
2. `pnpm run build`（通过）
3. `pnpm run check:desktop-entry-smoke`（通过）

## 复核结论（2026-04-05）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：`notificationOwnership`、`workspaceSummary` 与 `activeWorkspaceCount` 的计算确实复用了 `limit` 截断后的 `automationInbox/reviewQueue`，小窗口拉取时会少报 canonical backlog。
   - 处理：改为先基于完整匹配 execution/review 集构建 queue aggregate，再单独对返回给 UI 的 queue list 和 workspace list 做切片；补 `limit=1 / workspaceLimit=1` 的回归用例。
2. `2.2`
   - 判定：**认可**
   - 证据：`buildWorkspaceSummary()` 原来只从 execution 集建 workspace map，review-only backlog workspace 不会进入 summary，导致 desktop queue surface 漏掉真实治理范围。
   - 处理：workspace summary 改为从 execution workspace 与 queue-entry workspace 并集建模，并补“open review without execution”回归测试。

### 验证命令
1. `pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-sidecar-client.integration.test.ts apps/desktop/test/desktop-governance-console-view-model-builder.test.ts apps/desktop/test/desktop-preload-bridge.test.ts apps/desktop/test/desktop-shell-bootstrap.test.ts test/desktop-entry-smoke.integration.test.ts`（通过）
2. `pnpm run build`（通过）
3. `pnpm run check:desktop-entry-smoke`（通过）

## 修复执行记录（2026-04-05）

1. `2.1`：已完成
   - 变更文件：`packages/core-orchestration-service/src/local-orchestration-service-queue-overview-query-runtime.ts`、`packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts`
   - 验证：`pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-sidecar-client.integration.test.ts apps/desktop/test/desktop-governance-console-view-model-builder.test.ts apps/desktop/test/desktop-preload-bridge.test.ts apps/desktop/test/desktop-shell-bootstrap.test.ts test/desktop-entry-smoke.integration.test.ts`、`pnpm run build`、`pnpm run check:desktop-entry-smoke`（通过）
   - 说明：queue overview 现在使用完整匹配集产出 aggregate truth，UI `limit/workspaceLimit` 只影响返回列表长度，不再影响 backlog 总量、SLA 计数或 active workspace 统计。
2. `2.2`：已完成
   - 变更文件：`packages/core-orchestration-service/src/local-orchestration-service-queue-overview-query-runtime.ts`、`packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts`
   - 验证：`pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-sidecar-client.integration.test.ts apps/desktop/test/desktop-governance-console-view-model-builder.test.ts apps/desktop/test/desktop-preload-bridge.test.ts apps/desktop/test/desktop-shell-bootstrap.test.ts test/desktop-entry-smoke.integration.test.ts`、`pnpm run build`、`pnpm run check:desktop-entry-smoke`（通过）
   - 说明：workspace summary 现在会纳入 unmatched open review 对应的 queue-only workspace，desktop governance surface 可以看到完整 review backlog 覆盖面。

## 阶段复审结论（2026-04-05）

1. reviewer 子 agent 复审结论：`No actionable findings.`
2. sprint-004 implementation scope 的 reviewer loop 已达到零 actionable finding，后续转入 `TK-570` 的 project-048 最终全量 CR 与 completion audit 收口。
