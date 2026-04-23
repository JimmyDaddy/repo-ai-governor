# Code Review: sprint-003 richer graph editing and support-truth readiness recheck

- Status: resolved
- Date: 2026-04-23
- Reviewer: AI-Agent
- Task: `CR-002`
- Review Type: delegated sprint recheck
- Normative References:
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/cr-lifecycle-threshold-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/task-ledger-single-write-source-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/execution-gate-layering-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/vscode-governance-workbench-surface-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-orchestration/contracts/direct-workbench-orchestration-runtime-hitl-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-orchestration/contracts/governance-workbench-aggregation-facade-contract.md`

## 1. Review Scope

1. `apps/vscode-extension/src/runtime/vscode-extension-presentation-builder.ts`
2. `apps/vscode-extension/src/runtime/vscode-extension-command-controller.ts`
3. `apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts`
4. `apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts`
5. `scripts/release/verify-vscode-extension-distribution.js`
6. `test/release-vscode-extension-distribution-sidecar-readiness.integration.test.ts`
7. `.repo-ai-governor/context/dev/project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout/sprint-003-richer-graph-editing-and-support-truth-readiness/tasks/CR-002.md`

## 2. Findings

### 2.1 [P2] Focused backlink handoff still assumed POSIX-only happy paths

- 位置: `apps/vscode-extension/src/runtime/vscode-extension-presentation-builder.ts`、`apps/vscode-extension/src/runtime/vscode-extension-command-controller.ts`
- 问题描述: focused backlink action 仍然只在 `target.startsWith('/')` 时渲染，并且把 `exists` 固定写成 `true`。这会漏掉 Windows/UNC absolute path，同时让已经不存在的目标也继续走 handoff 打开链路。
- 影响: Workflow Studio 的 direct-workbench backlink 在跨平台路径和 stale target 场景下不能 fail-closed，破坏 service-owned projection 的可信边界。
- 建议: builder 只负责发出 focus command，并用平台无关 absolute-path 判断控制 action 显示；controller 负责解析 focused backlink handoff target 并做真实存在性校验。

### 2.2 [P3] New packaged Workflow Studio smoke import missed the CS-008 marker

- 位置: `scripts/release/verify-vscode-extension-distribution.js`
- 问题描述: 新增的 packaged Workflow Studio smoke 使用动态 `import()` 加载 VSIX 内 presenter/runtime 文件，但附近没有 `dynamic-import-allowed` 注释。
- 影响: 这会让 release verifier 自身偏离仓库动态加载治理规则，后续再跑全量门禁时会留下不必要的规范漂移。
- 建议: 给新增的 packaged smoke dynamic import 标出明确理由，并保持该 smoke 继续只消费 extracted VSIX 产物。

## 3. Notes

1. delegated reviewer 没有提出新的 support/public truth uplift 建议；当前 readiness disposition 仍保持 `fail-closed`。
2. 这一轮只处理 reviewer 提出的 focused backlink handoff 与 release smoke governance 问题，没有引入 extension-local canonical workflow/runtime state。

## 4. Verification

1. `pnpm run build`（通过）
2. `pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
3. `pnpm exec vitest run test/release-vscode-extension-distribution-sidecar-readiness.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
4. `pnpm run release:verify-vscode-extension-distribution`（通过）
5. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）

## 复核结论（2026-04-23）

- 整体结论：**认可**

### 逐条复核

1. `2.1`
   - 判定：**认可**
   - 证据：focused backlink action 的 command payload 确实把 handoff target 与 `exists=true` 预先固化在 presenter 中，导致 controller 无法对目标存在性做 fail-closed 校验，同时 Windows-style absolute path 无法显示 action。
   - 处理：改为由 builder 只发出 focused backlink request，controller 再生成 handoff target 并用真实文件存在性收口；同时补 Windows-style absolute path 与 missing-path tests。
2. `2.2`
   - 判定：**认可**
   - 证据：packaged Workflow Studio smoke 的新增 `import()` 周围缺少 `dynamic-import-allowed` 注释，不满足 `CS-008` 的 exception 标注要求。
   - 处理：为 packaged presenter/runtime smoke imports 补充 `dynamic-import-allowed` 注释，并保持 smoke 只验证 extracted VSIX 的构建产物。

### 验证命令

1. `pnpm run build`（通过）
2. `pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
3. `pnpm exec vitest run test/release-vscode-extension-distribution-sidecar-readiness.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
4. `pnpm run release:verify-vscode-extension-distribution`（通过）
5. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）

## 修复执行记录（2026-04-23）

1. `2.1`：已完成
   - 变更文件：`apps/vscode-extension/src/runtime/vscode-extension-presentation-builder.ts`、`apps/vscode-extension/src/runtime/vscode-extension-command-controller.ts`、`apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts`、`apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts`
   - 验证：`pnpm run build`、`pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
   - 说明：focused backlink action 现在支持 Windows-style absolute path 展示，并由 controller 统一解析 handoff target 与不存在目标的 fail-closed 行为。
2. `2.2`：已完成
   - 变更文件：`scripts/release/verify-vscode-extension-distribution.js`、`test/release-vscode-extension-distribution-sidecar-readiness.integration.test.ts`
   - 验证：`pnpm exec vitest run test/release-vscode-extension-distribution-sidecar-readiness.integration.test.ts --maxWorkers=1 --maxConcurrency=1`、`pnpm run release:verify-vscode-extension-distribution`（通过）
   - 说明：packaged Workflow Studio smoke 的 dynamic imports 已补 `CS-008` 标记，release smoke 断言也随 controller-owned focus handoff seam 更新。

## 处置结果与剩余风险

1. `CR-002` 的 accepted findings 已全部修复并重新验证，当前 round 可以收口为 `resolved`。
2. sprint-003 仍需再跑一轮 fresh reviewer 才能确认进入 sprint closeout；public/support truth 继续维持 `fail-closed`。
