# Code Review: Sprint-002 React CLI Shell Surface Expansion — Working Tree

- Status: resolved
- Date: 2026-03-28
- Reviewer: AI-Agent
- Task: `TK-308 / TK-309`
- Review Type: working tree review
- Normative References:
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
  - `.codex/skills/workspace-code-review-workflow/SKILL.md`
  - `AGENTS.md`

> **注意**: 因终端基础设施问题（所有 shell 命令返回 exit code 130），本次 CR 无法通过 `git status`/`git diff` 精确界定变更范围。以下审查基于文件系统遍历与代码阅读，覆盖 `apps/cli/src/react-cli/**`、`apps/cli/src/runtime/interactive-shell/**`、以及 `apps/cli/test/runtime/{react-cli-runner,init-react-shell-runner,interactive-shell-ui-mode-resolver}.test.ts`。

## 1. Review Scope

1. `apps/cli/src/react-cli/index.ts`
2. `apps/cli/src/react-cli/app/react-cli-app.tsx`
3. `apps/cli/src/react-cli/app/react-cli-runner.ts`
4. `apps/cli/src/react-cli/app/react-cli-stderr-frame-presenter.ts`
5. `apps/cli/src/react-cli/bridge/react-cli-command-descriptor-catalog.ts`
6. `apps/cli/src/react-cli/bridge/react-cli-command-descriptor-registry.ts`
7. `apps/cli/src/react-cli/bridge/react-cli-command-view-model-builder.ts`
8. `apps/cli/src/react-cli/bridge/react-cli-field-renderer-registry.tsx`
9. `apps/cli/src/react-cli/session/react-cli-session-controller.ts`
10. `apps/cli/src/react-cli/state/react-cli-view-model.interface.ts`
11. `apps/cli/src/react-cli/views/layout-shell.tsx`
12. `apps/cli/src/runtime/interactive-shell/interactive-shell-stderr-renderer.ts`
13. `apps/cli/src/runtime/interactive-shell/init-react-shell-runner.ts`
14. `apps/cli/src/runtime/interactive-shell/init-shell-descriptor-registry.ts`
15. `apps/cli/src/runtime/interactive-shell/interactive-shell-ui-mode-resolver.ts`
16. `apps/cli/src/constants/cli-interactive-shell.constant.ts`
17. `apps/cli/src/constants/cli-workspace.constant.ts`
18. `apps/cli/src/types/interfaces/cli-interactive-shell.interface.ts`
19. `apps/cli/src/types/interfaces/index.ts`
20. `apps/cli/src/types/index.ts`
21. `apps/cli/test/runtime/react-cli-runner.test.ts`
22. `apps/cli/test/runtime/init-react-shell-runner.test.ts`
23. `apps/cli/test/runtime/interactive-shell-ui-mode-resolver.test.ts`

## 2. Findings

### 2.1 [P2] React key 使用 `${title}:${line}` 组合可能在重复行时产生 key 冲突
- 位置: `apps/cli/src/react-cli/views/layout-shell.tsx:32, 42, 50`
- 问题描述: `<Text key={\`${section.title}:${line}\`}>` 中，若同一 section 内有两行相同文本（例如两条相同的 warning），React 将产生 key 冲突警告，可能引发渲染异常。
- 影响: 在实际运行中如果有重复的行内容，React 会打印 key 冲突警告到 console，可能引发不正确的 diff 更新。由于输出目标是 stderr，这类警告可能混入 shell 渲染输出。
- 建议: 将 key 改为 `\`${section.title}:${index}\`` 或 `\`${section.title}:${index}:${line}\``，使用数组索引确保唯一性。

### 2.2 [P2] `react-cli-field-renderer-registry.tsx` 中 `React` 默认导入未使用
- 位置: `apps/cli/src/react-cli/bridge/react-cli-field-renderer-registry.tsx:1`
- 问题描述: `import React, { createElement, type ComponentType, type ReactElement } from 'react';` 中 `React` 默认导入从未在文件中引用。`tsconfig.json` 使用 `"jsx": "react-jsx"` 模式，不需要全局 `React` 变量。
- 影响: 虽然不影响运行，但违反习惯性代码卫生标准、增加 bundle 分析噪声。
- 建议: 移除 `React` 默认导入，仅保留命名导入 `{ createElement, type ComponentType, type ReactElement }`。

### 2.3 [P2] `CliInteractiveShellStderrRenderer` 中多处用户可见硬编码英文字符串未走 i18n
- 位置: `apps/cli/src/runtime/interactive-shell/interactive-shell-stderr-renderer.ts:88, 100, 102, 112, 116, 119`
- 问题描述: 以下字符串直接硬编码为英文单语，未通过 `localizeText()` 或 `I18nRuntime.t()` 处理：
  - `'Validation feedback requires another input pass.'`（L88）
  - `'Help'`（L100）
  - `'React shell renders on stderr only.'`（L102）
  - `'Enter confirm'`, `'N restart'`, `'Ctrl+C cancel'`（L112）
  - `'Enter submit'`, `'Ctrl+C cancel'`（L116）
  - `'Ctrl+C cancel'`（L119）
  以及其他 section title（`'Session'` L74, `'Details'` L78, `'Lifecycle'` L54, `'Attention'` L94）。
- 影响: 违反 CS-033（所有用户可见文本必须走 i18n），中文用户在 `zh-CN` locale 下仍看到英文标签。
- 建议: 将 `CliInteractiveShellStderrRenderer` 的构造函数或 `renderFrame`/`renderUnmount` 方法接受 `localizeText` 参数（或注入 `I18nRuntime`），将上述字符串改为双语或 i18n key 查找。

### 2.4 [P2] `layout-shell.tsx` 中 `Shortcuts` 硬编码英文标签未走 i18n
- 位置: `apps/cli/src/react-cli/views/layout-shell.tsx:58`
- 问题描述: `<Text dimColor>Shortcuts</Text>` 为硬编码英文，未接受外部 i18n 化的标签。
- 影响: 同 2.3，违反 CS-033。
- 建议: 将 footer shortcuts 标签作为 `ReactCliViewModel` 的可选属性传入，或在视图层接受 i18n 回调。

### 2.5 [P3] `ReactCliSessionController.update()` 未提供 defensive deep-clone，接口语义与 "immutable snapshot" JSDoc 不一致
- 位置: `apps/cli/src/react-cli/session/react-cli-session-controller.ts:45-56`
- 问题描述: `update()` 使用 spread 做一级浅合并后直接赋值 `this.viewModel`，然后调用 `snapshot()`。但如果调用方传入的 `update.sections` 包含外部可变数组引用，后续外部修改会穿透 snapshot。`snapshot()` 本身做了 `[...section.lines]` 的浅拷贝，但 `this.viewModel.sections` 被直接引用为 `update.sections`。
- 影响: 当前场景下，`CliInteractiveShellStderrRenderer` 总是在 `buildFrameViewModel` 中创建新数组，尚未出现穿透风险。但作为共享基础设施对外暴露使用，接口合约有潜在歧义。
- 建议: 在 `update()` 中对 `sections`/`attentionSection`/`helpSection`/`footerShortcuts` 做与 `snapshot()` 相同级别的浅拷贝，或在 JSDoc 中明确说明调用方应传入 fresh 对象的契约。

### 2.6 [P2] `ReactCliCommandViewModelBuilder.resolveStatusVariantFromChecks()` 未覆盖 `SKIP`/`PASS` 状态的显式处理
- 位置: `apps/cli/src/react-cli/bridge/react-cli-command-view-model-builder.ts:84-100`
- 问题描述: `resolveStatusVariantFromChecks` 仅检查 `FAIL` → error、`WARN` → warning、`checks.length > 0` → success。当 check 列表中只有 `SKIP` 状态项（无 FAIL/WARN/PASS）时，仍返回 `'success'`。
- 影响: 若 `CliGovernanceCheckStatus` 增加新状态（已有 `SKIP` 值），此方法可能将 "全部跳过" 误报为 success，影响用户判断。
- 建议: 检查 `CliGovernanceCheckStatus` 枚举的完整值集后显式处理 `SKIP`，或添加说明性 JSDoc 标注当前 "all-skip → success" 是否为有意行为。

### 2.7 [P3] `CliInitReactShellRunner.run()` 中 SIGINT 处理使用 `process.once`，但在 `while(true)` 循环内未重新注册
- 位置: `apps/cli/src/runtime/interactive-shell/init-react-shell-runner.ts:67`
- 问题描述: `process.once('SIGINT', sigintHandler)` 在第一次 SIGINT 后自动移除，但 `confirmSelection` 中用户可能选择 `n` 导致重新进入循环。此时第二次 SIGINT 无 handler 接管，进程可能直接退出而不抛出 `RuntimeError`。
- 影响: 在 "reject confirmation → restart → user hits Ctrl+C" 这一用户路径中，不会执行 SIGINT 清理也不会抛出结构化错误，而是由 Node.js 默认终止。
- 建议: 在 `while(true)` 循环顶部使用 `process.off`/`process.on` 重新注册，或改用 `process.on` 配合手动移除。当前 `finally` 块中的 `process.removeListener('SIGINT', sigintHandler)` 在 listener 已被 `once` 消费后是无害的空操作，但重新注册的缺失是有风险的。

### 2.8 [P2] `init-react-shell-runner.test.ts` 未覆盖 SIGINT 取消路径
- 位置: `apps/cli/test/runtime/init-react-shell-runner.test.ts`
- 问题描述: 测试覆盖了正常完成、验证反馈和确认重启路径，但缺少 SIGINT 取消的测试。SIGINT 路径涉及 `process.once` 注册、`promptAdapter.close()` 提前调用、`RuntimeError` 抛出和 `finally` 清理——这些都是 lifecycle-sensitive 分支。
- 影响: 结合 2.7 的 `once` 注册问题，SIGINT 路径是最容易产生回归的路径之一，缺乏测试覆盖增加了修改时引入 bug 的风险。
- 建议: 添加至少一个 SIGINT 测试用例：模拟 `promptAdapter.question()` 抛出错误（模拟 readline 被 close 后的行为），验证结果为 `RuntimeError` 且 code 为 `PROCESS_RUNTIME_CANCELLED`。

### 2.9 [P3] `ReactCliViewModel` 接口放置在 `react-cli/state/` 而非 `types/interfaces/` 或 `types/aliases/`
- 位置: `apps/cli/src/react-cli/state/react-cli-view-model.interface.ts`
- 问题描述: CS-013 要求 `interface` 和 `type` 声明管理在 `src/types/interfaces/*.interface.ts` 和 `src/types/aliases/*.type.ts`。`ReactCliViewModel` 和 `ReactCliSectionViewModel` 放在 `react-cli/state/` 下是一种 domain 边界内共存的选择。`ReactCliStatusVariant` 是 `type` alias，按 CS-013 应放在 `types/aliases/` 下。
- 影响: 当前 `react-cli/` 作为一个自包含模块有自身的 barrel (`index.ts`)，co-location 有合理性，但 `ReactCliStatusVariant` 作为 `type` alias 与 `interface` 同文件混合，若从严解读 CS-013 存在轻微不合规。
- 建议: 考虑将 `ReactCliStatusVariant` 单独提取到 `src/types/aliases/react-cli-status-variant.type.ts`，或在当前文件中添加 `// type-shape-allowed: co-located with domain view-model interface for cohesion` 注释标记例外。此为 P3 观察项。

## 3. Notes

1. 整体架构设计清晰：`react-cli/` 作为共享壳层基础设施，遵循 descriptor → registry → view-model builder → renderer 的分层，职责边界合理。
2. `CliInteractiveShellStderrRenderer` 成功集成 `ReactCliRunner` 的 `renderToString` 路径，实现了 stderr-only 渲染而不污染 stdout，与 CLI 的输出契约（stdout 用于结构化结果、stderr 用于交互式 shell）一致。
3. `CliInteractiveShellUiModeResolver` 的 fallback 策略覆盖了 no-interactive、non-TTY、output-mode-blocked、tui-not-implemented 四种降级场景，设计周到。
4. 所有 `.ts` 文件使用显式 `.js` 扩展名导入（CS-005 合规），type/interface 分离遵循 CS-011/CS-012。
5. 终端基础设施异常导致无法在本次 CR 中执行 `pnpm run test:packages` 和其他验证命令。

## 4. Verification

1. `pnpm -s tsc -p tsconfig.json --noEmit`（未执行 — 终端基础设施异常）
2. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（未执行 — 终端基础设施异常）
3. `node ./scripts/governance/check-i18n-parity-fallback.js`（未执行 — 终端基础设施异常）
4. `node ./scripts/governance/check-esm-import-specifiers.js`（未执行 — 终端基础设施异常）

## 复核结论（2026-03-28）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：`apps/cli/src/react-cli/views/layout-shell.tsx:31-42` 已改为基于数组索引生成 `Text` key，重复行不会再共用同一个 key。
   - 处理：已完成，重复文本的渲染 key 冲突风险已消除。
2. `2.2`
   - 判定：**认可**
   - 证据：`apps/cli/src/react-cli/bridge/react-cli-field-renderer-registry.tsx:1` 已移除未使用的默认 `React` 导入，仅保留 `createElement` 与类型导入。
   - 处理：已完成，代码卫生问题已清理。
3. `2.3`
   - 判定：**认可**
   - 证据：`apps/cli/src/runtime/interactive-shell/interactive-shell-stderr-renderer.ts:68-155` 中用户可见文案已统一通过 `translate()` 解析；对应键已补入 `packages/shared/src/i18n/locales/en-us.ts` 与 `packages/shared/src/i18n/locales/zh-cn.ts`。
   - 处理：已完成，stderr shell 的可见文本已切到 i18n runtime。
4. `2.4`
   - 判定：**认可**
   - 证据：`apps/cli/src/react-cli/views/layout-shell.tsx:56-60` 已由 `footerShortcutsTitle` 统一承接 footer 标题，配套构建器也已提供本地化标题。
   - 处理：已完成，Shortcuts 标题不再是硬编码英文。
5. `2.5`
   - 判定：**认可**
   - 证据：`apps/cli/src/react-cli/session/react-cli-session-controller.ts:45-66` 已对 `sections`、`helpSection`、`attentionSection` 与 `footerShortcuts` 做防御性克隆。
   - 处理：已完成，更新语义与不可变快照契约对齐。
6. `2.6`
   - 判定：**不认可**
   - 证据：`apps/cli/src/constants/cli-governance-runtime.constant.ts:1-12` 中 `CliGovernanceCheckStatus` 仅定义 `PASS/WARN/FAIL`，当前代码库并不存在 `SKIP` 状态；`apps/cli/src/react-cli/bridge/react-cli-command-view-model-builder.ts:86-101` 的分支与现行枚举一致。
   - 处理：无需修复，原问题基于不存在的状态分支，不构成当前回归。
7. `2.7`
   - 判定：**认可**
   - 证据：`apps/cli/src/runtime/interactive-shell/init-react-shell-runner.ts:59-176` 已改为 `process.on()`/`process.off()` 配对，并在 SIGINT 路径上明确关闭 prompt 以打断阻塞读取。
   - 处理：已完成，确认重启后的再次中断路径可被结构化捕获。
8. `2.8`
   - 判定：**认可**
   - 证据：`apps/cli/test/runtime/init-react-shell-runner.test.ts:133-158` 已补 SIGINT 取消测试，覆盖 `promptAdapter.close()` 与 `PROCESS_RUNTIME_CANCELLED` 的分支。
   - 处理：已完成，生命周期敏感路径有了回归测试覆盖。

### 验证命令
1. `pnpm -s typecheck`（通过）
2. `pnpm -s vitest run --config vitest.config.ts apps/cli/test/runtime/react-cli-runner.test.ts apps/cli/test/runtime/init-react-shell-runner.test.ts apps/cli/test/commands/connect-command.test.ts apps/cli/test/commands/workspace-command.test.ts`（通过）
3. `pnpm -s check:i18n-parity-fallback`（通过）

## 修复执行记录（2026-03-28）

1. `2.1`：已完成
   - 变更文件：`apps/cli/src/react-cli/views/layout-shell.tsx`
   - 验证：`pnpm -s typecheck`（通过）
   - 说明：改为基于数组索引的 key，避免重复文本造成冲突。
2. `2.2`：已完成
   - 变更文件：`apps/cli/src/react-cli/bridge/react-cli-field-renderer-registry.tsx`
   - 验证：`pnpm -s typecheck`（通过）
   - 说明：移除未使用的默认 `React` 导入。
3. `2.3`：已完成
   - 变更文件：`apps/cli/src/runtime/interactive-shell/interactive-shell-stderr-renderer.ts`, `packages/shared/src/i18n/locales/en-us.ts`, `packages/shared/src/i18n/locales/zh-cn.ts`
   - 验证：`pnpm -s check:i18n-parity-fallback`（通过）
   - 说明：stderr shell 的用户可见文案已切到 i18n runtime。
4. `2.4`：已完成
   - 变更文件：`apps/cli/src/react-cli/views/layout-shell.tsx`, `apps/cli/src/react-cli/bridge/react-cli-command-view-model-builder.ts`
   - 验证：`pnpm -s vitest run --config vitest.config.ts apps/cli/test/runtime/react-cli-runner.test.ts apps/cli/test/runtime/init-react-shell-runner.test.ts apps/cli/test/commands/connect-command.test.ts apps/cli/test/commands/workspace-command.test.ts`（通过）
   - 说明：Shortcuts 标题由 view model 统一承接，不再硬编码英文。
5. `2.5`：已完成
   - 变更文件：`apps/cli/src/react-cli/session/react-cli-session-controller.ts`
   - 验证：`pnpm -s typecheck`（通过）
   - 说明：update 时补齐防御性深拷贝，保持快照契约一致。
6. `2.7`：已完成
   - 变更文件：`apps/cli/src/runtime/interactive-shell/init-react-shell-runner.ts`
   - 验证：`pnpm -s vitest run --config vitest.config.ts apps/cli/test/runtime/react-cli-runner.test.ts apps/cli/test/runtime/init-react-shell-runner.test.ts apps/cli/test/commands/connect-command.test.ts apps/cli/test/commands/workspace-command.test.ts`（通过）
   - 说明：SIGINT 处理改为 `process.on/off` 配对，重启循环仍可稳定取消。
7. `2.8`：已完成
   - 变更文件：`apps/cli/test/runtime/init-react-shell-runner.test.ts`
   - 验证：`pnpm -s vitest run --config vitest.config.ts apps/cli/test/runtime/react-cli-runner.test.ts apps/cli/test/runtime/init-react-shell-runner.test.ts apps/cli/test/commands/connect-command.test.ts apps/cli/test/commands/workspace-command.test.ts`（通过）
   - 说明：补齐 SIGINT 取消路径回归测试。
