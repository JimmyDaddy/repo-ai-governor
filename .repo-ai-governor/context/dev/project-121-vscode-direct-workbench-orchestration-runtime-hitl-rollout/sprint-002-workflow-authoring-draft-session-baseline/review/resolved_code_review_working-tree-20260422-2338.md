# Code Review: sprint-002 workflow draft-session authoring baseline fresh recheck round 10

- Status: resolved
- Date: 2026-04-22
- Reviewer: AI-Agent
- Task: `CR-010`
- Review Type: delegated sprint recheck
- Normative References:
  - `AGENTS.md`
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/cr-lifecycle-threshold-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/task-ledger-single-write-source-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/execution-gate-layering-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`

## 1. Review Scope
1. `packages/orchestration-service-client`
2. `packages/core-orchestration-service`
3. `apps/vscode-extension/src/runtime`
4. `.repo-ai-governor/context/dev/project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout/sprint-002-workflow-authoring-draft-session-baseline`

## 2. Findings
### 2.1 [P2] Chat workflow-start can report success after a blocked start
- 位置: `apps/vscode-extension/src/runtime/vscode-extension-command-controller.ts:3200`
- 问题描述: `startWorkflowDraftFlow()` 在 service 返回 `applied: false` 时仍然直接返回 `draftSession.templateId`，而 chat workflow preview/create 调用只要拿到 truthy return 就会把结果标记成 `completed`。在 service 因并发 mutable draft 保护而阻断启动时，这会制造 false-success chat summary。
- 影响: 用户会在 chat 中看到“workflow preview/create completed”，但实际上并没有新 draft 创建成功，造成 direct-workbench authoring 状态与 chat summary 脱节。
- 建议: 只有 `response.applied === true` 时才返回 template id 作为成功信号；blocked response 仍应展示 warning，但 chat result 必须降为非成功态。

### 2.2 [P3] Workflow node-type picker still shows raw enum labels
- 位置: `apps/vscode-extension/src/runtime/vscode-extension-command-controller.ts:3956`
- 问题描述: node-type quick pick 直接把 `ProcessNodeType` 枚举值作为 label，用户会看到 `sequential / parallel / loop / condition` 这类协议值，而不是产品文案。
- 影响: 这条 VS Code 交互文案继续命中 `CS-033`，属于 round 9 同类 raw-protocol-text 问题的残留面。
- 建议: 为 workflow node type 建立本地化 display label，再在 quick pick 中展示。

### 2.3 [P3] Workflow Studio validation summary still leaks raw validation codes
- 位置: `apps/vscode-extension/src/runtime/vscode-extension-presentation-builder.ts:4217`
- 问题描述: validation summary 仍用 `severity:issueCode@location` 这类 machine-oriented 字符串渲染，例如 `LOOP_MAX_WALL_TIME_REQUIRED`。这是用户可见的 webview 文案，不应继续直接暴露 machine identifiers。
- 影响: 用户看到的是内部规则码而非可理解的诊断信息，同样命中 `CS-033`。
- 建议: 改成 localized severity + `issue.message` 的 message-first summary，location 只保留为辅助信息。

## 3. Notes
1. fresh delegated reviewer round surfaced `1 x P2 + 2 x P3` finding after `CR-009` resolved；三项都已由主 agent 复核并判定为 `accepted`。
2. reviewer 同时确认本轮 reviewed scope 没有新增 correctness/regression finding；当前 residual work 仍集中在 chat truthfulness 和用户可见文本投影。

## 4. Verification
1. `pnpm run typecheck`（通过）
2. `pnpm run build`（通过）
3. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）
4. `pnpm run check:ide-entry-smoke`（通过）
5. `pnpm run check:desktop-entry-smoke`（通过）
6. `pnpm exec vitest run --config vitest.packages.config.ts packages/core-orchestration-service/test/local-orchestration-service-workflow-draft-runtime.test.ts packages/core-orchestration-service/test/local-orchestration-service-sidecar-client.integration.test.ts packages/core-orchestration-service/test/local-orchestration-service-workspace-ops-runtime.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
7. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
8. `node ./scripts/governance/check-task-required-inputs.js --tasks-dir /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout/sprint-002-workflow-authoring-draft-session-baseline/tasks`（通过）
9. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
10. `node ./scripts/governance/check-code-review-status-sync.js`（通过）
11. `node ./scripts/governance/check-worktree-review-target.js`（通过）

## 复核结论（2026-04-22）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：service overwrite guard 合法返回 `applied: false`，而当前 chat path 确实只看返回 template id；reviewer 指出的 false-success 条件成立。
   - 处理：accepted，`startWorkflowDraftFlow()` 只在 `applied=true` 时返回成功信号，并补 blocked-response 回归测试。
2. `2.2`
   - 判定：**认可**
   - 证据：node-type picker 直接展示 `ProcessNodeType` 枚举值，属于 VS Code 用户可见文本；reviewer 对 `CS-033` 的判断成立。
   - 处理：accepted，补 workflow node type 的本地化 label 映射和 quick-pick regression test。
3. `2.3`
   - 判定：**认可**
   - 证据：validation summary 仍直接拼接 `issueCode`，raw machine identifiers 会进入 Workflow Studio summary；reviewer 对 `CS-033` 的判断成立。
   - 处理：accepted，改为 localized severity + `issue.message` 的 message-first summary，并补 summary regression test。

### 验证命令
1. `pnpm run typecheck`（通过）
2. `pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）

## 修复执行记录（2026-04-22）

1. `2.1`：已完成
   - 变更文件：`apps/vscode-extension/src/runtime/vscode-extension-command-controller.ts`、`apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts`
   - 验证：`pnpm run typecheck`、`pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`、`pnpm run check:ide-entry-smoke`、`pnpm run check:desktop-entry-smoke`、`pnpm exec vitest run --config vitest.packages.config.ts packages/core-orchestration-service/test/local-orchestration-service-workflow-draft-runtime.test.ts packages/core-orchestration-service/test/local-orchestration-service-sidecar-client.integration.test.ts packages/core-orchestration-service/test/local-orchestration-service-workspace-ops-runtime.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts --maxWorkers=1 --maxConcurrency=1`
   - 说明：blocked workflow-start 现在仍会在 UI 中展示 warning，但 chat command 不会再把这种情况误报成 `completed`。
2. `2.2`：已完成
   - 变更文件：`apps/vscode-extension/src/runtime/vscode-extension-command-controller.ts`、`apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts`
   - 验证：`pnpm run typecheck`、`pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`、`pnpm run check:ide-entry-smoke`、`pnpm run check:desktop-entry-smoke`、`pnpm exec vitest run --config vitest.packages.config.ts packages/core-orchestration-service/test/local-orchestration-service-workflow-draft-runtime.test.ts packages/core-orchestration-service/test/local-orchestration-service-sidecar-client.integration.test.ts packages/core-orchestration-service/test/local-orchestration-service-workspace-ops-runtime.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts --maxWorkers=1 --maxConcurrency=1`
   - 说明：workflow node-type picker 已切换到本地化 label，不再显示 raw `ProcessNodeType` 枚举值。
3. `2.3`：已完成
   - 变更文件：`apps/vscode-extension/src/runtime/vscode-extension-presentation-builder.ts`、`apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts`
   - 验证：`pnpm run typecheck`、`pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`、`pnpm run check:ide-entry-smoke`、`pnpm run check:desktop-entry-smoke`、`pnpm exec vitest run --config vitest.packages.config.ts packages/core-orchestration-service/test/local-orchestration-service-workflow-draft-runtime.test.ts packages/core-orchestration-service/test/local-orchestration-service-sidecar-client.integration.test.ts packages/core-orchestration-service/test/local-orchestration-service-workspace-ops-runtime.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts --maxWorkers=1 --maxConcurrency=1`
   - 说明：Workflow Studio validation summary 已改成 localized severity + issue message 的可读摘要，不再泄露 raw validation codes。

## 风险与后续（2026-04-22）

1. `CR-010` 的 accepted findings 已修复并完成同窗 build/package/smoke/targeted/gov verification。
2. 下一步仍需 fresh `CR-011` reviewer round；只有最新 round 明确返回“无 actionable findings”，sprint-002 才能进入 `TK-1040` closeout。
