# Code Review: working-tree-20260422-1247

- Status: resolved
- Date: 2026-04-22
- Reviewer: AI-Agent
- Task: `CR-006`
- Review Type: sprint delegated recheck
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
1. `packages/orchestration-service-client/src/constants/orchestration-service.constant.ts`
2. `packages/orchestration-service-client/src/constants/index.ts`
3. `packages/orchestration-service-client/src/index.ts`
4. `packages/orchestration-service-client/src/types/interfaces/orchestration-service-client.interface.ts`
5. `packages/core-orchestration-service/src/local-orchestration-service-governance-query-runtime.ts`
6. `packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts`
7. `packages/core-orchestration-service/test/local-orchestration-service-governance-query-runtime.test.ts`
8. `apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts`
9. `.repo-ai-governor/context/dev/project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout/sprint-001-direct-hitl-and-runtime-lanes-baseline/tasks/CR-006.md`

## 2. Findings
### 2.1 [P3] `backlinkKind` finite set should not live as inline literals
- 位置: `packages/orchestration-service-client/src/types/interfaces/orchestration-service-client.interface.ts:375`
- 问题描述: 第六轮 reviewer 发现 `OrchestrationWorkbenchBacklink.backlinkKind` 把 `artifact/review/session/task/workspace` 作为 inline string-literal union 暴露出来，而 core governance runtime 和测试也同步重复了这组 closed-set literals。这违反了 `CS-009` 对 finite-set business values 的集中治理要求。
- 影响: 后续若新增或改名某类 workbench backlink，client contract、service runtime、VS Code surface 与测试会出现多点漂移，削弱 sprint-001 刚建立的 service-owned runtime/read-model contract。
- 建议: 抽取共享常量枚举作为唯一真值，并让 contract/runtime/tests 统一引用这一来源。

## 3. Notes
1. 本轮 reviewer 只发现 1 条 actionable finding，属于新增 direct-workbench contract 的 finite-literal governance 漂移。
2. 修复范围保持在 `orchestration-service-client` 常量导出、core runtime backlink builder 与关联测试，不扩大到无关 workbench surface。

## 4. Verification
1. `pnpm run typecheck`（通过）
2. `pnpm run build`（通过）
3. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）
4. `pnpm run check:ide-entry-smoke`（通过）
5. `node ./scripts/governance/check-task-required-inputs.js --tasks-dir /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout/sprint-001-direct-hitl-and-runtime-lanes-baseline/tasks`（通过）
6. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
7. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
8. `node ./scripts/governance/check-code-review-status-sync.js`（通过）
9. `node ./scripts/governance/check-worktree-review-target.js`（通过）

## 复核结论（2026-04-22）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：`OrchestrationWorkbenchBacklink.backlinkKind` 确实在新增 contract 中以内联 closed-set literal 暴露，`LocalOrchestrationServiceGovernanceQueryRuntime` 与关联测试也重复使用了相同字面量集合。
   - 处理：将该有限集合提升为 client package 的共享枚举，并让 runtime/test 从同一来源取值，避免 contract drift。

### 验证命令
1. `pnpm run typecheck`（通过）
2. `pnpm run build`（通过）

## 修复执行记录（2026-04-22）

1. `2.1`：已完成
   - 变更文件：`packages/orchestration-service-client/src/constants/orchestration-service.constant.ts`、`packages/orchestration-service-client/src/constants/index.ts`、`packages/orchestration-service-client/src/index.ts`、`packages/orchestration-service-client/src/types/interfaces/orchestration-service-client.interface.ts`、`packages/core-orchestration-service/src/local-orchestration-service-governance-query-runtime.ts`、`packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts`、`packages/core-orchestration-service/test/local-orchestration-service-governance-query-runtime.test.ts`、`apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts`
   - 验证：`pnpm run typecheck`、`pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`、`pnpm run check:ide-entry-smoke`（通过）
   - 说明：新增 `OrchestrationWorkbenchBacklinkKind` 作为唯一 closed-set source，contract/runtime/tests 已统一引用该枚举。

## 处置结果与剩余风险

1. 本轮 accepted finding 已全部修复并复验。
2. sprint-001 仍需继续执行 fresh delegated reviewer round；只有最新 round 无 actionable findings 时，closeout 才可进入。
