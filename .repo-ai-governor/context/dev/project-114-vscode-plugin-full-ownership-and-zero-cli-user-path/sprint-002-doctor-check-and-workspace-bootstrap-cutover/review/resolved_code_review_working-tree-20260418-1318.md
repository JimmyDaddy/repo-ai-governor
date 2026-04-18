# Code Review: sprint-002-doctor-check-and-workspace-bootstrap-cutover

- Status: resolved
- Date: 2026-04-18
- Reviewer: AI-Agent
- Task: `CR-001`
- Review Type: working tree review
- Normative References:
  - `AGENTS.md`
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/cr-lifecycle-threshold-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/task-ledger-single-write-source-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`
  - `.codex/skills/workspace-code-review-workflow/SKILL.md`

## 1. Review Scope
1. `packages/orchestration-service-client/src/types/interfaces/orchestration-service-client.interface.ts`
2. `packages/core-orchestration-service/src/local-orchestration-service-workspace-ops-runtime.ts`
3. `packages/core-orchestration-service/src/local-orchestration-service-queue-overview-query-runtime.ts`
4. `packages/core-orchestration-service/src/local-orchestration-service-shell.ts`
5. `apps/vscode-extension/src/runtime/vscode-extension-presentation-builder.ts`
6. `apps/vscode-extension/test/vscode-extension-service-runtime.test.ts`
7. `apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts`
8. `packages/core-orchestration-service/test/local-orchestration-service-workspace-ops-runtime.test.ts`
9. `.repo-ai-governor/context/dev/project-114-vscode-plugin-full-ownership-and-zero-cli-user-path/sprint-002-doctor-check-and-workspace-bootstrap-cutover/tasks/tasks.csv`
10. `.repo-ai-governor/context/dev/project-114-vscode-plugin-full-ownership-and-zero-cli-user-path/sprint-002-doctor-check-and-workspace-bootstrap-cutover/doctor-check-workspace-bootstrap-cutover-contract-and-implementation.md`

## 2. Findings
### 2.1 [P1] sprint-002 terminal task rows still carry placeholder delivery evidence
- 位置: `.repo-ai-governor/context/dev/project-114-vscode-plugin-full-ownership-and-zero-cli-user-path/sprint-002-doctor-check-and-workspace-bootstrap-cutover/tasks/tasks.csv`
- 问题描述: `TK-968`、`TK-969`、`TK-970` 已被推进到 `completed`，但 terminal row 仍保留 `待执行 / 待验证 / 待执行` 占位值，和当前 canonical task-card / sprint 完成态不一致。
- 影响: 违反 `CS-004` 与 `CS-021`，也会阻断 sprint-002 的真实 closeout 与后续 boundary commit。
- 建议: 从 canonical task cards 补齐真实结果、验证与 review delta，再通过同步器重渲染 checklist / tasks.csv。

### 2.2 [P2] latest workspace operation 会直接回放上一次运行时的本地化文案
- 位置: `packages/core-orchestration-service/src/local-orchestration-service-workspace-ops-runtime.ts`、`packages/orchestration-service-client/src/types/interfaces/orchestration-service-client.interface.ts`、`apps/vscode-extension/src/runtime/vscode-extension-presentation-builder.ts`
- 问题描述: 新增 snapshot 直接缓存 `message/summary/checks/interactionPrompts/layeredLogs` 等用户可见字符串，而 queue overview 查询本身没有 locale 输入，VS Code presenter 也原样渲染这些字段。
- 影响: 当快照来自另一个 locale 或在不同 UI 语言下被读取时，workbench 会出现混合语言的 user-facing copy，偏离 `CS-033` 的 i18n 约束。
- 建议: 为 snapshot 记录捕获 locale，并在 presenter 端对 locale 不匹配的详情做 guard；至少不要把旧 locale 的 summary / prompt / progress 直接混入当前 UI。

### 2.3 [P2] latest workspace operation 只保存在进程内存里
- 位置: `packages/core-orchestration-service/src/local-orchestration-service-workspace-ops-runtime.ts`、`.repo-ai-governor/context/dev/project-114-vscode-plugin-full-ownership-and-zero-cli-user-path/sprint-002-doctor-check-and-workspace-bootstrap-cutover/doctor-check-workspace-bootstrap-cutover-contract-and-implementation.md`
- 问题描述: 当前实现只在 runtime 实例里缓存最近一次 workspace operation snapshot；sidecar/window 正常重启后，queue overview 会回退到 “No service-backed result yet”。
- 影响: 与 sprint-002 对“持续显示最近一次 service-backed workspace operation”的 contract 不一致，sidecar restart 后会丢失最近一次 doctor/check/bootstrap 的 service truth。
- 建议: 将最新 snapshot 持久化到 workspace-owned service read model，并在 runtime / queue overview 初始化时回填。

## 3. Notes
1. reviewer findings 来自 fresh sub-agent round，当前文件是主 agent 接管后的 canonical pending report。
2. sprint-002 在 code-affecting 变更窗口里已经具备一轮真实 `pnpm run build` 证据，但在 accepted findings 修复后仍需重跑对应验证才能进入 `resolved`。

## 4. Verification
1. `pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts apps/vscode-extension/test/vscode-extension-host.activation.test.ts packages/core-orchestration-service/test/local-orchestration-service-workspace-ops-runtime.test.ts packages/core-orchestration-service/test/local-orchestration-service-sidecar-client.timeout.test.ts`（通过）
2. `pnpm run build`（通过）
3. `pnpm run check`（通过）

## 复核结论（2026-04-18）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：`tasks.csv` 的 terminal rows 仍保留占位证据；主 agent 已通过 canonical task-card + ledger sync 回填真实 `result / verify / review_delta`。
   - 处理：修复并重渲染 sprint-002 `checklist.md` / `tasks.csv`。
2. `2.2`
   - 判定：**认可**
   - 证据：`latestWorkspaceOperation` 确实会跨 query 回放上一次 locale 的 user-facing copy；主 agent 已为 snapshot 追加 locale metadata，并在 presenter 端加上 locale mismatch guard。
   - 处理：修复并补充 presenter regression coverage。
3. `2.3`
   - 判定：**认可**
   - 证据：原实现只保存在 runtime 内存；主 agent 已把最近一次 workspace-operation snapshot 持久化到 workspace-owned read model，并在 getter 首次读取时回填。
   - 处理：修复并补充 sidecar-restart hydration regression coverage。

### 验证命令
1. `pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts packages/core-orchestration-service/test/local-orchestration-service-workspace-ops-runtime.test.ts`（通过）
2. `pnpm run build`（通过）
3. `pnpm run check`（通过）

## 修复执行记录（2026-04-18）

1. `2.1`：已完成
   - 变更文件：`.repo-ai-governor/context/dev/project-114-vscode-plugin-full-ownership-and-zero-cli-user-path/sprint-002-doctor-check-and-workspace-bootstrap-cutover/tasks/TK-967-freeze-doctor-check-and-workspace-bootstrap-cutover-contract.md`、`.repo-ai-governor/context/dev/project-114-vscode-plugin-full-ownership-and-zero-cli-user-path/sprint-002-doctor-check-and-workspace-bootstrap-cutover/tasks/TK-968-implement-service-native-doctor-check-and-workspace-bootstrap-seams.md`、`.repo-ai-governor/context/dev/project-114-vscode-plugin-full-ownership-and-zero-cli-user-path/sprint-002-doctor-check-and-workspace-bootstrap-cutover/tasks/TK-969-land-workbench-native-doctor-check-and-workspace-bootstrap-surfaces.md`、`.repo-ai-governor/context/dev/project-114-vscode-plugin-full-ownership-and-zero-cli-user-path/sprint-002-doctor-check-and-workspace-bootstrap-cutover/tasks/TK-970-prepare-sprint-002-exit-acceptance-and-sprint-003-handoff.md`、`.repo-ai-governor/context/dev/project-114-vscode-plugin-full-ownership-and-zero-cli-user-path/sprint-002-doctor-check-and-workspace-bootstrap-cutover/tasks/checklist.md`、`.repo-ai-governor/context/dev/project-114-vscode-plugin-full-ownership-and-zero-cli-user-path/sprint-002-doctor-check-and-workspace-bootstrap-cutover/tasks/tasks.csv`
   - 验证：`pnpm run check`（通过）
   - 说明：completed terminal rows 已补齐真实 result / verify / review_delta。
2. `2.2`：已完成
   - 变更文件：`packages/orchestration-service-client/src/types/interfaces/orchestration-service-client.interface.ts`、`apps/vscode-extension/src/runtime/vscode-extension-presentation-builder.ts`、`apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts`
   - 验证：`pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts`（通过）
   - 说明：snapshot 记录 capture locale；当 locale 不匹配时，workbench 只保留 locale-neutral facts，并提示用户在当前 workbench 语言下重跑。
3. `2.3`：已完成
   - 变更文件：`packages/core-orchestration-service/src/local-orchestration-service-workspace-ops-runtime.ts`、`packages/core-orchestration-service/test/local-orchestration-service-workspace-ops-runtime.test.ts`、`.repo-ai-governor/context/dev/project-114-vscode-plugin-full-ownership-and-zero-cli-user-path/sprint-002-doctor-check-and-workspace-bootstrap-cutover/doctor-check-workspace-bootstrap-cutover-contract-and-implementation.md`、`.repo-ai-governor/context/dev/project-114-vscode-plugin-full-ownership-and-zero-cli-user-path/sprint-002-doctor-check-and-workspace-bootstrap-cutover/sprint-002-exit-acceptance-and-sprint-003-handoff.md`
   - 验证：`pnpm exec vitest run --config vitest.packages.config.ts packages/core-orchestration-service/test/local-orchestration-service-workspace-ops-runtime.test.ts`、`pnpm run build`（通过）
   - 说明：latest workspace-operation snapshot 现在会持久化到 workspace-owned read model，并在新的 runtime 实例里回填。

## 处置结果与剩余风险（2026-04-18）

1. 本轮 reviewer 的 3 个 actionable findings 已全部修复并完成同窗口验证。
2. sprint-002 仍未 closeout；后续需要先把 `CR-001`、`TK-984`、sprint plan / current-context / boundary commit 一并收口，才能切入 sprint-003。
