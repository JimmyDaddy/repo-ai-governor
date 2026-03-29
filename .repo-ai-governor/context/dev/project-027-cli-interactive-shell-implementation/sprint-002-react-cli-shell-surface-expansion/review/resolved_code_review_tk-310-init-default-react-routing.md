# Code Review: TK-310 `init` 默认 React 路由与 classic fallback 体验策略

- Status: resolved
- Date: 2026-03-28
- Reviewer: AI-Agent
- Task: `TK-310`
- Review Type: working tree review
- Normative References:
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/contracts/cli-interactive-shell-contract.md`
  - `apps/cli/src/types/interfaces/cli-interactive-shell.interface.ts`

## 1. Review Scope

1. `apps/cli/src/commands/init-command.ts`
2. `apps/cli/test/commands/init-command.test.ts`
3. `packages/shared/src/i18n/locales/en-us.ts`
4. `packages/shared/src/i18n/locales/zh-cn.ts`
5. `.repo-ai-governor/context/dev/project-027-cli-interactive-shell-implementation/sprint-002-react-cli-shell-surface-expansion/tasks/TK-310-init-default-react-routing-and-classic-fallback-ux-policy.md`
6. `.repo-ai-governor/context/dev/project-027-cli-interactive-shell-implementation/sprint-002-react-cli-shell-surface-expansion/tasks/checklist.md`
7. `.repo-ai-governor/context/dev/project-027-cli-interactive-shell-implementation/sprint-002-react-cli-shell-surface-expansion/tasks/tasks.csv`

## 2. Findings

### 2.1 [P2] `CliInteractiveBootstrapSelection` interface 在 `init-command.ts` 内联声明，与 `CliInitReactShellSelection` 结构完全相同

- 位置: `apps/cli/src/commands/init-command.ts:34-38`
- 问题描述: `CliInteractiveBootstrapSelection`（L34-38）与 `apps/cli/src/types/interfaces/cli-interactive-shell.interface.ts:78-82` 的 `CliInitReactShellSelection` 有完全相同的字段结构（`workspaceMode: WorkspaceMode; defaultLocale: Locale; fallbackLocale: Locale;`）。按 CS-013 的精神（type/interface 声明集中管理）和避免结构重复的原则，两个完全等价的 interface 应该合并为一个并统一导入。
- 影响: 当前两处如果未来需要扩展字段（如增加 `supportedLocales`），必须同步修改两个结构才能保持一致，容易漂移。
- 建议: 复用 `CliInitReactShellSelection`（已导出且在 `types/index.ts` 注册），在 `init-command.ts` 中去掉内联 `CliInteractiveBootstrapSelection`，改为 `import type { CliInitReactShellSelection } from '../types/index.js';`，并将原来的类型引用替换为 `CliInitReactShellSelection`。

### 2.2 [P2] `init-command.test.ts` 同样重复声明了 `CliInteractiveBootstrapSelection` interface

- 位置: `apps/cli/test/commands/init-command.test.ts:30-34`
- 问题描述: 测试文件同样内联了一份 `CliInteractiveBootstrapSelection`。这是第三处相同结构的声明。
- 影响: 同 2.1，字段漂移风险。
- 建议: 直接从 `'../../src/types/index.js'` 导入 `CliInitReactShellSelection`，删除测试内联的 interface。

### 2.3 [P2] 缺少 SIGINT/cancel re-throw 行为的测试覆盖

- 位置: `apps/cli/test/commands/init-command.test.ts` (整个文件)
- 问题描述: `init-command.ts:104-109` 有一个关键的 cancel re-throw 分支：当 React shell runner 抛出 `PROCESS_RUNTIME_CANCELLED` 时，`init-command` 直接 re-throw 该错误，不走 classic fallback。这是一个用户可见的控制流分支（SIGINT 取消 vs 普通故障回退），但 `init-command.test.ts` 没有覆盖这个路径。虽然 `init-react-shell-runner.test.ts` 测试了 runner 层的 SIGINT 行为，但 `init-command` 层的 re-throw guard 缺乏独立验证。
- 影响: 如果未来有人修改了 catch 块的错误判断逻辑（比如不小心把 `instanceof BaseError` 改成了其他条件），取消信号可能被意外吞掉并降级为 classic fallback，用户体验异常。
- 建议: 添加一个测试用例，验证 `PROCESS_RUNTIME_CANCELLED` 错误从 react runner 抛出时，init-command 的 `execute` 直接 re-throw 而不吞掉错误、不走 classic fallback。

### 2.4 [P3] TK-310 任务卡"产出"章节与实际完成状态不同步

- 位置: `.repo-ai-governor/context/dev/project-027-cli-interactive-shell-implementation/sprint-002-react-cli-shell-surface-expansion/tasks/TK-310-init-default-react-routing-and-classic-fallback-ux-policy.md:62-66`
- 问题描述: 任务状态已标记 `completed`，执行记录 L60 也记录了验证通过，但 `## 10. 产出` 部分（L64-66）仍保留 `待执行：` 占位文案。
- 影响: 任务卡级审计一致性。CS-021 要求台账保持同步；虽然此处不属于 CSV/checklist 漂移，但产出清单与状态矛盾会误导后续复查。
- 建议: 将三条 `待执行：` 更新为实际产出描述或引用对应的变更文件。

### 2.5 [P3] `tasks.csv` 存在多批 sync 行（12 行 TK-308~311），历史行数偏多

- 位置: `.repo-ai-governor/context/dev/project-027-cli-interactive-shell-implementation/sprint-002-react-cli-shell-surface-expansion/tasks/tasks.csv`
- 问题描述: CSV 包含 17 条记录，其中 TK-308 有 4 条 sync + 1 条 in_progress、TK-309 有 3 条 sync + 1 条 completed、TK-310 有 3 条 sync + 1 条 in_progress + 1 条 completed、TK-311 有 3 条 sync。多批 `exec-sync-*` 行记录了历次计划变更。这本身是 append-only ledger 的合理行为，但同一 task 有 3~4 条 planned sync 略为冗余。
- 影响: 不影响正确性，仅是 ledger 整洁度。属于 observation。
- 建议: 在 sprint 收尾（完成审计）时考虑合并多余的 sync 行，保留首条 planned 和最终 completed 即可；不阻塞当前交付。

## 3. Notes

1. `resolveInitUiMode` 的路由逻辑（L309-318）正确实现了"当 `requestedUiMode === null` 且默认 `uiMode === CLASSIC` 时升级为 `REACT`"的策略，其余显式设定场景保持原值，与技术方案 draft M2 清单一致。
2. fallback 路径（L103-128）正确区分了 `PROCESS_RUNTIME_CANCELLED`（直接 re-throw）和其他运行时错误（降级为 classic + 诊断输出），错误处理模式合理。
3. i18n key `cli.commandMessages.init.reactShellFallbackToClassic` 在 en-us 和 zh-cn 中均已注册且 parity 一致。
4. 测试覆盖了 4 个主要路径：默认 React、显式 Classic、显式 None、React 初始化失败回退。覆盖面合理，但缺少 cancel re-throw 路径（见 2.3）。
5. `CliGovernanceRuntime` 的 `commandRegistry` 构造（`cli-governance-runtime.ts:202`）使用无参 `new CliInitCommand()`，与 `CliInitCommand` 的 DI constructor 兼容（默认实例化 `CliInitReactShellRunner`），无遗漏。

## 4. Verification

1. `pnpm -s tsc -p tsconfig.json --noEmit`（未执行——终端不可用）
2. `pnpm -s vitest run --config vitest.packages.config.ts apps/cli/test/commands/init-command.test.ts`（未执行——终端不可用）
3. `pnpm run check`（未执行——终端不可用）
4. 手动代码逐行审查已完成，所有 finding 基于文件内容和规范交叉验证。

## 复核结论（2026-03-29）

- 整体结论：**部分认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：`CliInteractiveBootstrapSelection` 与 `CliInitReactShellSelection` 结构完全一致，且两处都只承载 `workspaceMode/defaultLocale/fallbackLocale`。
   - 处理：接受，后续修复时统一改为复用 `CliInitReactShellSelection`。
2. `2.2`
   - 判定：**认可**
   - 证据：测试文件再次内联了相同结构的 bootstrap selection 类型。
   - 处理：接受，后续修复时同步删除重复声明。
3. `2.3`
   - 判定：**认可**
   - 证据：`init-command` 的 `PROCESS_RUNTIME_CANCELLED` 分支在当前测试集中没有独立覆盖。
   - 处理：接受，后续修复时补 `SIGINT/cancel` 直通测试。
4. `2.4`
   - 判定：**认可**
   - 证据：任务卡状态已是 `completed`，但 `## 10. 产出` 仍保留 `待执行` 占位。
   - 处理：接受，后续修复时把产出改成实际交付项。
5. `2.5`
   - 判定：**不认可**
   - 证据：`tasks.csv` 的 append-only sync 行属于当前 sprint 的 ledger 历史记录，未构成当前交付漂移。
   - 处理：保留为观察项，不纳入本次修复范围。

### 验证命令
1. `pnpm -s tsc -p tsconfig.json --noEmit`（通过）
2. `pnpm -s vitest run --config vitest.packages.config.ts apps/cli/test/commands/init-command.test.ts apps/cli/test/runtime/init-react-shell-runner.test.ts apps/cli/test/runtime/interactive-shell-ui-mode-resolver.test.ts`（通过）

## 修复执行记录（2026-03-29）

1. `2.1`：已完成
   - 变更文件：`apps/cli/src/commands/init-command.ts`
   - 验证：`pnpm -s tsc -p tsconfig.json --noEmit`（通过）
   - 说明：删除本地重复的 `CliInteractiveBootstrapSelection`，统一复用 `CliInitReactShellSelection`。
2. `2.2`：已完成
   - 变更文件：`apps/cli/test/commands/init-command.test.ts`
   - 验证：`pnpm -s vitest run --config vitest.packages.config.ts apps/cli/test/commands/init-command.test.ts apps/cli/test/runtime/init-react-shell-runner.test.ts apps/cli/test/runtime/interactive-shell-ui-mode-resolver.test.ts`（通过）
   - 说明：测试文件改为直接导入 `CliInitReactShellSelection`，删除重复 bootstrap selection 声明。
3. `2.3`：已完成
   - 变更文件：`apps/cli/test/commands/init-command.test.ts`
   - 验证：`pnpm -s vitest run --config vitest.packages.config.ts apps/cli/test/commands/init-command.test.ts apps/cli/test/runtime/init-react-shell-runner.test.ts apps/cli/test/runtime/interactive-shell-ui-mode-resolver.test.ts`（通过）
   - 说明：补充 `PROCESS_RUNTIME_CANCELLED` 从 React shell runner 透传、不回退 classic 的回归测试。
4. `2.4`：已完成
   - 变更文件：`.repo-ai-governor/context/dev/project-027-cli-interactive-shell-implementation/sprint-002-react-cli-shell-surface-expansion/tasks/TK-310-init-default-react-routing-and-classic-fallback-ux-policy.md`
   - 验证：`pnpm run check`（通过）
   - 说明：将任务卡 `## 10. 产出` 从占位的 `待执行` 更新为实际交付项。
