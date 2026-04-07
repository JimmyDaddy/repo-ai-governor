# Code Review: sprint-002-vscode-mvp-hardening-and-desktop-foundation-guardrails

- Status: resolved
- Date: 2026-04-07
- Reviewer: AI-Agent
- Task: `CR-001`
- Review Type: scoped sprint review
- Normative References:
  - `AGENTS.md`
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/cr-lifecycle-threshold-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/task-ledger-single-write-source-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/execution-gate-layering-spec.md`

## 1. Review Scope

1. `apps/vscode-extension/**`
2. `apps/desktop/README.md`
3. `integrations/desktop/README.md`
4. `docs/local-adoption-playbook.md`
5. `docs/local-adoption-playbook.zh-CN.md`
6. `docs/maintainer-validation-playbook.md`
7. `docs/maintainer-validation-playbook.zh-CN.md`
8. `docs/support-matrix.md`
9. `docs/support-matrix.zh-CN.md`
10. `.repo-ai-governor/context/dev/project-054-vscode-secondary-surface-rollout/plan.md`
11. `.repo-ai-governor/context/dev/project-054-vscode-secondary-surface-rollout/sprint-002-vscode-mvp-hardening-and-desktop-foundation-guardrails/**`

## 2. Findings

### 2.1 [P1] Service-health enrichment can blank status surfaces when the health probe fails

- 位置: `apps/vscode-extension/src/runtime/vscode-extension-service-runtime.ts:90`, `apps/vscode-extension/src/runtime/vscode-extension-service-runtime.ts:202`, `apps/vscode-extension/src/runtime/vscode-extension-host.ts:45`, `apps/vscode-extension/src/runtime/vscode-extension-chat-participant.ts:41`
- 问题描述: `resolveWorkspaceContextSnapshot()` 现在会在返回现有 editor-local snapshot 之前等待 `getHealth()`，但当前路径没有 failure fallback。只要 health probe 抛错，workspace context、review detail 和 chat status 这几条 UI 路径就会一起失败，而不是退回到原本已经可用的 workspace/editor facts。
- 影响: 这会把“补充诊断信息”的 hardening 变成新的 render critical path，导致 transient service-health failure 反而让 VS Code companion 退化得更严重。
- 建议: 将 health probe 设为 best-effort enrichment；发生失败时保留 editor-local snapshot，并补一条 failure-path automated test。

### 2.2 [P2] Project WBS table no longer matches the completed task cards

- 位置: `.repo-ai-governor/context/dev/project-054-vscode-secondary-surface-rollout/plan.md:40`, `.repo-ai-governor/context/dev/project-054-vscode-secondary-surface-rollout/plan.md:41`
- 问题描述: project plan 的 WBS 表仍显示 `TK-611=in_progress`、`TK-612=planned`，但 milestone 记录和 task cards 已表明它们都完成了。这会让 project-level overview 与 canonical task cards/derived ledger 产生新的人工歧义。
- 影响: closeout、handoff 和 project-final CR 在读取 project-level status summary 时会看到互相冲突的真值面。
- 建议: 把 WBS 表更新到当前真值，至少让 `TK-611`、`TK-612` 与现有 task cards 保持一致。

## 3. Notes

1. reviewer 子 agent 另外提示：目前没有 scoped tests 直接覆盖 `VsCodeExtensionServiceRuntime.resolveWorkspaceContextSnapshot()` 的 health-probe degrade 路径。
2. extension-development-host launch rehearsal 仍是 manual evidence，这一点与当前项目冻结范围一致，不单独升级为本轮 actionable finding。

## 4. Verification

1. `pnpm exec vitest run apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-contract.test.ts apps/vscode-extension/test/vscode-extension-selection-store.test.ts apps/vscode-extension/test/vscode-extension-packaging-boundary.test.ts --maxWorkers=1 --maxConcurrency=1`（主 agent 先前已通过）
2. `pnpm exec biome check apps/vscode-extension/src apps/vscode-extension/test apps/vscode-extension/README.md`（主 agent 先前已通过）
3. `pnpm run build`（主 agent 先前已通过）
4. `pnpm run check:ide-entry-smoke`（主 agent 先前已通过）
5. `pnpm run check:ide-docs-parity`（主 agent 先前已通过）
6. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（主 agent 先前已通过）
7. `pnpm run test:integration -- --maxWorkers=1 --maxConcurrency=1`（主 agent 先前已通过）
8. `pnpm run check`（主 agent 先前已通过）

## 复核结论（2026-04-07）

- 整体结论：**认可**

### 逐条复核

1. `2.1`
   - 判定：**认可**
   - 证据：`resolveWorkspaceContextSnapshot()` 在原实现中会先等待 `getHealth()`，且没有 failure fallback；workspace tree、review detail 与 chat status 都已切到这条路径上，因此 reviewer 所说的 render critical path 风险成立。
   - 处理：采用 best-effort health enrichment，在 probe 失败时退回 editor-local workspace snapshot，并补 `vscode-extension-service-runtime.test.ts` 覆盖成功/失败两个分支。
2. `2.2`
   - 判定：**认可**
   - 证据：project plan 的 WBS 表确实残留 `TK-611=in_progress`、`TK-612=planned`，与当前 task cards、milestone 记录和 derived ledger 的完成态不一致。
   - 处理：已将 `project-054` WBS 表中的 `TK-611`、`TK-612` status 写回 `completed` 真值。

### 验证命令

1. `pnpm exec vitest run apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-contract.test.ts apps/vscode-extension/test/vscode-extension-selection-store.test.ts apps/vscode-extension/test/vscode-extension-packaging-boundary.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
2. `pnpm exec biome check apps/vscode-extension/src apps/vscode-extension/test apps/vscode-extension/README.md .repo-ai-governor/context/dev/project-054-vscode-secondary-surface-rollout/plan.md`（通过）

## 修复执行记录（2026-04-07）

1. `2.1`：已完成
   - 变更文件：`apps/vscode-extension/src/runtime/vscode-extension-service-runtime.ts`、`apps/vscode-extension/test/vscode-extension-service-runtime.test.ts`
   - 验证：`pnpm exec vitest run apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-contract.test.ts apps/vscode-extension/test/vscode-extension-selection-store.test.ts apps/vscode-extension/test/vscode-extension-packaging-boundary.test.ts --maxWorkers=1 --maxConcurrency=1`、`pnpm run build`、`pnpm run check:ide-entry-smoke`、`pnpm run check:ide-docs-parity`（均通过）
   - 说明：service-health diagnostics 已改为 best-effort enrichment；health probe 失败时会保留 editor-local workspace context，不再拖挂 workspace tree、review detail 与 chat status。
2. `2.2`：已完成
   - 变更文件：`.repo-ai-governor/context/dev/project-054-vscode-secondary-surface-rollout/plan.md`
   - 验证：`pnpm exec biome check apps/vscode-extension/src apps/vscode-extension/test apps/vscode-extension/README.md .repo-ai-governor/context/dev/project-054-vscode-secondary-surface-rollout/plan.md`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`、`pnpm run test:integration -- --maxWorkers=1 --maxConcurrency=1`、`pnpm run check`（均通过）
   - 说明：project WBS 表中的 `TK-611` / `TK-612` status 已与当前 task cards、milestone 与 derived ledger 真值保持一致。
