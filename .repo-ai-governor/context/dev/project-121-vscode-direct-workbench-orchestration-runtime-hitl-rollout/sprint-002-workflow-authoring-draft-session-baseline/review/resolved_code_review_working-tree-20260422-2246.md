# Code Review: sprint-002 workflow draft-session authoring baseline fresh recheck round 8

- Status: resolved
- Date: 2026-04-22
- Reviewer: AI-Agent
- Task: `CR-008`
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
3. `apps/vscode-extension`
4. `.repo-ai-governor/context/dev/project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout/sprint-002-workflow-authoring-draft-session-baseline`

## 2. Findings
### 2.1 [P1] Starting a new draft silently overwrites the active mutable session
- 位置: `packages/core-orchestration-service/src/local-orchestration-service-workflow-draft-runtime.ts:142`, `apps/vscode-extension/src/runtime/vscode-extension-command-controller.ts:3182`
- 问题描述: 当前 `startWorkflowDraft()` 会直接重写单槽位 `direct-workbench.active.json`，而 VS Code create/edit/preview 流程在启动新 draft 前也没有确认步骤。只要用户还保留未提交的 mutable draft，再次执行 create/edit/preview 就会无提示丢失本地 authoring 状态。
- 影响: 用户可能在误操作一次 command 后失去尚未 commit 的 workflow authoring edits，而且 service 作为唯一 truth owner 会把这次丢失固化为新的 canonical active draft。
- 建议: 在 service seam 增加 overwrite guard，并要求 caller 显式带 `replaceExistingDraftSession` 才允许覆盖；VS Code command controller 需要先查询 mutable draft、弹确认框，再在用户确认后重试。

### 2.2 [P2] “Add or edit edge” cannot replace an existing edge in place
- 位置: `packages/core-orchestration-service/src/local-orchestration-service-workflow-draft-runtime.ts:268`, `apps/vscode-extension/src/runtime/vscode-extension-command-controller.ts:3530`
- 问题描述: 当前 edge mutation 只提交新的 `{fromNodeId,toNodeId,conditionKey}` 三元组，runtime 也只按新值匹配 existing edge。用户如果在 “Add or edit edge” 里修改目标节点或 condition key，旧 edge 无法被识别，结果会 append 第二条 edge，而不是 edit 现有 edge。
- 影响: Workflow Studio 会让 graph projection 出现重复边，Condition/Policy 路由还可能因此产生多条同源分支，破坏 draft-session 的 schema-first authoring 语义。
- 建议: 在 edge mutation seam 中补 `previousEdgeSpec`，让 runtime 先按旧 edge 身份定位再 replace；VS Code UI 需要区分 create vs edit existing edge，并在 edit 时把原 edge 身份一起传下去。

## 3. Notes
1. fresh delegated reviewer round surfaced `1 x P1 + 1 x P2` actionable findings after `CR-007` resolved；两项都直接影响 draft-session truth consistency，因此均按 accepted 进入修复回路。
2. `CR-008` 只有在 overwrite guard、edge replace semantics、controller confirmation flow 与 regression coverage 全部补齐后，才能推进到 `resolved`。

## 4. Verification
1. `pnpm run typecheck`（通过）
2. `pnpm exec vitest run --config vitest.packages.config.ts packages/core-orchestration-service/test/local-orchestration-service-workflow-draft-runtime.test.ts packages/core-orchestration-service/test/local-orchestration-service-sidecar-client.integration.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）

## 复核结论（2026-04-22）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：service 当前只维护一个 active draft artifact，而 create/edit/preview 均直接调用 `startWorkflowDraft()`；reviewer 指出的“无确认覆盖 mutable draft”风险成立，并且真实用户路径可达。
   - 处理：accepted，要求 service/client seam 增加 replace flag，并在 VS Code command controller 中补 preflight query + overwrite confirmation。
2. `2.2`
   - 判定：**认可**
   - 证据：runtime 只按新 edgeSpec 查找 existing edge，edit 场景修改 `toNodeId` 或 `conditionKey` 时一定找不到旧边，最终只能 append；reviewer 对 duplicate edge 的判断成立。
   - 处理：accepted，要求 edge mutation seam 显式携带 `previousEdgeSpec`，并补 service/controller regression coverage。

### 验证命令
1. `pnpm run typecheck`（通过）
2. `pnpm exec vitest run --config vitest.packages.config.ts packages/core-orchestration-service/test/local-orchestration-service-workflow-draft-runtime.test.ts packages/core-orchestration-service/test/local-orchestration-service-sidecar-client.integration.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）

## 风险与后续（2026-04-22）

1. `CR-008` 的 accepted findings 已全部进入修复窗口；只有在 build/package/smoke/gov evidence 重新跑完后，才能把本轮 reviewer 生命周期切到 `resolved`。

## 修复执行记录（2026-04-22）

1. `2.1`：已完成
   - 变更文件：`packages/orchestration-service-client/src/types/interfaces/orchestration-service-client.interface.ts`、`packages/core-orchestration-service/src/local-orchestration-service-workflow-draft-runtime.ts`、`packages/core-orchestration-service/test/local-orchestration-service-workflow-draft-runtime.test.ts`、`packages/core-orchestration-service/test/local-orchestration-service-sidecar-client.integration.test.ts`、`apps/vscode-extension/src/runtime/vscode-extension-command-controller.ts`、`apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts`
   - 验证：`pnpm run typecheck`、`pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`、`pnpm run check:ide-entry-smoke`、`pnpm run check:desktop-entry-smoke`、`pnpm exec vitest run --config vitest.packages.config.ts packages/core-orchestration-service/test/local-orchestration-service-workflow-draft-runtime.test.ts packages/core-orchestration-service/test/local-orchestration-service-sidecar-client.integration.test.ts packages/core-orchestration-service/test/local-orchestration-service-workspace-ops-runtime.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts --maxWorkers=1 --maxConcurrency=1`
   - 说明：service seam 现在默认 fail-closed，不会再无提示覆盖 active mutable draft；VS Code 在 create/edit/preview 前会先查询 active draft，并在用户确认后才带 `replaceExistingDraftSession` 重试。
2. `2.2`：已完成
   - 变更文件：`packages/orchestration-service-client/src/types/interfaces/orchestration-service-client.interface.ts`、`packages/core-orchestration-service/src/local-orchestration-service-workflow-draft-runtime.ts`、`packages/core-orchestration-service/test/local-orchestration-service-workflow-draft-runtime.test.ts`、`packages/core-orchestration-service/test/local-orchestration-service-sidecar-client.integration.test.ts`、`apps/vscode-extension/src/runtime/vscode-extension-command-controller.ts`、`apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts`
   - 验证：`pnpm run typecheck`、`pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`、`pnpm run check:ide-entry-smoke`、`pnpm run check:desktop-entry-smoke`、`pnpm exec vitest run --config vitest.packages.config.ts packages/core-orchestration-service/test/local-orchestration-service-workflow-draft-runtime.test.ts packages/core-orchestration-service/test/local-orchestration-service-sidecar-client.integration.test.ts packages/core-orchestration-service/test/local-orchestration-service-workspace-ops-runtime.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts --maxWorkers=1 --maxConcurrency=1`
   - 说明：edge mutation seam 现在会在 edit 模式下携带 `previousEdgeSpec`，runtime 先按旧边身份定位再 replace；VS Code “Add or edit edge” 也已拆成 create/edit action，不会再把 edit 误写成 append。

## 风险与后续（2026-04-22）

1. `CR-008` 的两个 accepted findings 已修复并完成同窗 build/package/smoke/targeted verification；下一步必须按 scoped CR 规则发起 fresh `CR-009` reviewer round，再判断 sprint-002 是否 clean。
