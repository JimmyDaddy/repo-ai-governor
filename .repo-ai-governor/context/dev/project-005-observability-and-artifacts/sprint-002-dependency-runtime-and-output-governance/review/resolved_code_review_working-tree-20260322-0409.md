# Code Review: Working Tree CLI Output Contract And I18n Gate

- Status: resolved
- Date: 2026-03-22
- Reviewer: AI-Agent
- Task: `n/a`
- Review Type: working tree review
- Normative References:
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`

## 1. Review Scope
1. `apps/cli/src/main.ts`
2. `apps/cli/src/cli-output-presenter.ts`
3. `apps/cli/src/constants/cli-output.constant.ts`
4. `apps/cli/src/types/interfaces/cli-output.interface.ts`
5. `apps/cli/test/cli-output-contract.integration.test.ts`
6. `packages/reporting/src/replay-explainer.ts`
7. `packages/reporting/src/types/interfaces/reporting.interface.ts`
8. `packages/reporting/test/replay-explainer.unit.test.ts`
9. `scripts/governance/check-i18n-parity-fallback.js`
10. `test/i18n-parity-fallback-gate.integration.test.ts`
11. `package.json`
12. `turbo.json`

## 2. Findings
### 2.1 [P1] CLI output contract is polluted by SQLite experimental warnings even on the default fs-csv path
- 位置: `apps/cli/src/main.ts:14`
- 问题描述: `runCli` 在模块顶层直接导入 `SqliteFsMemoryStoreProvider`，而该 provider 又在 `packages/memory-providers/sqlite-fs/src/sqlite-fs-memory-store-provider.ts:4` 顶层导入 `node:sqlite`。结果是即使运行时实际走的是默认 `fs_csv` 分支，Node 仍会输出 `ExperimentalWarning: SQLite is an experimental feature...`。我实测 `node ./dist/bin/repo-ai-governor.js --output json unknown-command 2>&1` 会在 JSON payload 后追加这条 warning。
- 影响: `json/plain` 模式的“稳定、可解析输出”被污染；尤其错误 JSON 走 `stderr` 时，warning 会把整段输出变成非 JSON，直接破坏 CI/集成解析。
- 建议: 将 sqlite provider 改为按需加载，避免在默认 `fs_csv` 路径下触发 `node:sqlite` 的顶层副作用。

### 2.2 [P1] `--output json` is dropped when another global option fails validation
- 位置: `apps/cli/src/main.ts:135`
- 问题描述: `outputContext` 只有在 `resolveOutputContext(rawArgs, io)` 整体成功后才会覆盖 fallback 值；如果 `--verbosity` 等其他全局选项先抛错，catch 路径会继续使用 fallback 的 `plain/pretty` 上下文，而不是保留用户已经显式请求的 `--output json`。我实测 `node ./dist/bin/repo-ai-governor.js --output json --verbosity invalid init` 返回的是 plain 文本错误，而不是 JSON 错误 payload。
- 影响: 集成方即使显式请求机器可读错误输出，只要命中参数校验失败就拿不到 JSON，输出契约在最关键的失败场景里失效。
- 建议: 先单独解析并锁定 `--output`，再解析其余选项；至少要保证当 `--output json` 合法时，后续验证失败仍按 JSON 渲染错误结果。

### 2.3 [P2] `--verbosity quiet` does not actually reduce success output
- 位置: `apps/cli/src/main.ts:186`
- 问题描述: 成功路径先用 `cli.skeleton.executed` 模板把 `locale/profile/configSource/workspace* /memoryStore* /outputMode/verbosity` 等完整诊断字段全部插进 `message`，然后 presenter 才按 verbosity 渲染。这样 `quiet` 模式虽然少追加了几行，但核心 `message` 本身已经包含了全量诊断信息。我实测 `node ./dist/bin/repo-ai-governor.js --output plain --verbosity quiet init` 仍输出完整 workspace 和 memory provider 详情。
- 影响: `--verbosity` 对成功输出基本失效，non-TTY/日志场景下的低噪音目标达不到，也和 TK-050 所说的“固化 `--verbosity` 行为”不一致。
- 建议: 把可变诊断字段从本地化 `message` 模板里拆出来，由 presenter 按 verbosity 决定是否渲染；`message` 只保留真正稳定的命令结果摘要。

## 3. Notes
1. 这轮没有在 `check-i18n-parity-fallback` 和 `outputLocale` replay 过滤逻辑里再发现第二组阻断性问题；问题主要集中在 CLI 输出契约落地方式。
2. 当前工作树还包含 sprint/task/review 台账调整，我重点核查了它们与新增 CLI / gate 实现之间的一致性，没有发现台账同步漂移。
3. 我为了复现实例补跑了 `pnpm run build`，因此工作树下的 `dist/` 已按当前代码重新生成。

## 4. Verification
1. `pnpm run typecheck`（通过）
2. `pnpm exec vitest run apps/cli/test/cli-skeleton.integration.test.ts apps/cli/test/cli-output-contract.integration.test.ts packages/core-session/test/audit-recorder.unit.test.ts packages/reporting/test/report-builder.unit.test.ts packages/reporting/test/replay-explainer.unit.test.ts test/i18n-parity-fallback-gate.integration.test.ts`（通过）
3. `node ./scripts/governance/check-i18n-parity-fallback.js --format json`（通过）
4. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
5. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
6. `pnpm run build`（通过）
7. `node ./dist/bin/repo-ai-governor.js --output json unknown-command 2>&1`（失败输出中复现 SQLite ExperimentalWarning 污染）
8. `node ./dist/bin/repo-ai-governor.js --output json --verbosity invalid init`（复现 `--output json` 丢失，返回 plain 文本错误）
9. `node ./dist/bin/repo-ai-governor.js --output plain --verbosity quiet init`（复现 quiet 模式仍输出全量诊断字段）

## 复核结论（2026-03-22）

- 整体结论：**认可**

### 逐条复核
1. `2.1 [P1] CLI output contract is polluted by SQLite experimental warnings`
   - 判定：**认可**
   - 证据：`apps/cli/src/main.ts` 原先顶层导入 `@repo-ai-governor/memory-provider-sqlite-fs`，其链路会触发 `node:sqlite` 顶层副作用；默认 `fs_csv` 路径也会被污染。
   - 处理：已改为仅在 `MemoryStoreEngine.SQLITE_FS` 分支下动态导入 sqlite provider，并将 `bin/repo-ai-governor.ts` 改为直接引用本仓库构建产物入口，避免被工作区旧产物劫持。
2. `2.2 [P1] --output json is dropped when another global option fails validation`
   - 判定：**认可**
   - 证据：`runCli` 原流程先整体解析 output/verbosity；当 `--verbosity` 非法时报错，`outputContext` 保持 fallback 值，导致 JSON 契约丢失。
   - 处理：已将解析流程拆分为“先锁定 output mode，再解析 verbosity”，确保当 `--output json` 合法时后续校验失败仍返回 JSON error payload。
3. `2.3 [P2] --verbosity quiet does not actually reduce success output`
   - 判定：**认可**
   - 证据：`cli.skeleton.executed` 原本携带全部 workspace/memory 诊断字段，导致 presenter 即使 quiet 也无法降噪。
   - 处理：已将 i18n 文案收敛为稳定摘要（仅命令执行结果），诊断字段只由 presenter 按 verbosity 控制渲染。

### 验证命令
1. `pnpm exec vitest run apps/cli/test/cli-skeleton.integration.test.ts apps/cli/test/cli-output-contract.integration.test.ts`（通过）
2. `pnpm run typecheck`（通过）
3. `pnpm run build`（通过）
4. `node ./dist/bin/repo-ai-governor.js --output json unknown-command 2>&1`（通过；无 SQLite ExperimentalWarning，stderr 为可解析 JSON）
5. `node ./dist/bin/repo-ai-governor.js --output json --verbosity invalid init 2>&1`（通过；返回 JSON 错误 payload）
6. `node ./dist/bin/repo-ai-governor.js --output plain --verbosity quiet --locale en-US init 2>&1`（通过；仅摘要输出，无诊断字段）

## 修复执行记录（2026-03-22）

1. `2.1`：已完成
   - 变更文件：`apps/cli/src/main.ts`、`bin/repo-ai-governor.ts`
   - 验证：`pnpm run build`、`node ./dist/bin/repo-ai-governor.js --output json unknown-command 2>&1`（通过）
   - 说明：sqlite provider 改为按需导入，且 dist bin 入口改为本地构建产物路径，解决 warning 污染。
2. `2.2`：已完成
   - 变更文件：`apps/cli/src/main.ts`、`apps/cli/test/cli-output-contract.integration.test.ts`
   - 验证：`pnpm exec vitest run apps/cli/test/cli-output-contract.integration.test.ts`、`node ./dist/bin/repo-ai-governor.js --output json --verbosity invalid init 2>&1`（通过）
   - 说明：先解析 `--output` 后解析其他全局选项，错误路径保持 JSON 契约。
3. `2.3`：已完成
   - 变更文件：`packages/shared/src/i18n/locales/en-US.ts`、`packages/shared/src/i18n/locales/zh-cn.ts`、`apps/cli/src/main.ts`、`apps/cli/test/cli-output-contract.integration.test.ts`、`apps/cli/test/cli-skeleton.integration.test.ts`
   - 验证：`pnpm exec vitest run apps/cli/test/cli-skeleton.integration.test.ts apps/cli/test/cli-output-contract.integration.test.ts`、`node ./dist/bin/repo-ai-governor.js --output plain --verbosity quiet --locale en-US init 2>&1`（通过）
   - 说明：摘要文案与诊断渲染职责分离，quiet 行为恢复低噪音目标。
