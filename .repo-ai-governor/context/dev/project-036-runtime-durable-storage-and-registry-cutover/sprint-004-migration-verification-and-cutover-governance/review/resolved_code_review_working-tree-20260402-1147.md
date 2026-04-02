# Code Review: project-036 sprint-004 durable-storage diagnostics working tree

- Status: resolved
- Date: 2026-04-02
- Reviewer: AI-Agent
- Task: `TK-479`
- Review Type: working tree review
- Normative References:
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`

## 1. Review Scope
1. `apps/cli/src/commands/doctor-command.ts`
2. `apps/cli/src/commands/verify-command.ts`
3. `apps/cli/src/runtime/durable-storage-diagnostics-runtime.ts`
4. `apps/cli/src/types/interfaces/cli-durable-storage-diagnostics.interface.ts`
5. `apps/cli/test/cli-governance-runtime.integration.test.ts`
6. `project-036 / sprint-004` plan and task ledger deltas

## 2. Findings
### 2.1 [P1] Canonical artifact-registry inspection is still fail-open and mutates state
- 位置: `apps/cli/src/runtime/durable-storage-diagnostics-runtime.ts:270`
- 问题描述: `inspectArtifactRegistryCanonicalTruth()` claims to inspect canonical sqlite truth, but it instantiates `SqliteArtifactIndexStore` and immediately calls `listMainRegistry()/listArchiveRegistry()`. That store constructor is not read-only: it `mkdir`s the parent directory, opens the sqlite file in default read-write mode, and runs `initializeSchema()` before any read. A present-but-empty or partially initialized database therefore gets promoted into a valid schema during `doctor/verify`, after which the diagnostics path reports `state=empty` instead of failing closed with `read_failed`.
- 影响: This reintroduces the same class of cutover bug sprint-004 is supposed to catch: read-only governance inspection silently repairs or normalizes canonical state and masks the underlying storage breakage. A repository can pass with `warn` where it should block with `fail`, and inspection itself becomes stateful.
- 建议: Split canonical inspection from mutating store bootstrapping. `doctor/verify` should read artifact-registry sqlite through a truly read-only path and fail closed on missing schema / unreadable canonical tables instead of constructing `SqliteArtifactIndexStore`.

### 2.2 [P2] Durable-storage verify failures are surfaced as `UNKNOWN`
- 位置: `apps/cli/src/commands/verify-command.ts:231`
- 问题描述: When durable-storage checks block verification, `verify` throws `RuntimeError` with `GovernorErrorCode.UNKNOWN`. This is not an unexpected internal crash; it is an intentional governed verify failure produced by the new cutover diagnostics path. Mapping it to `UNKNOWN` erases the machine-readable distinction between “cutover gate failed” and “runtime blew up”.
- 影响: Callers and release gates can no longer branch reliably on verify outcomes. Existing verify failures already use deterministic codes like `ADAPTER_ROUTE_NO_AVAILABLE_SURFACE`; durable-storage blockers now collapse into the same bucket as unrelated infrastructure exceptions, which weakens auditability and automation.
- 建议: Use a deterministic non-`UNKNOWN` error code for durable-storage verification blockers. If no existing code fits, add a dedicated cutover / durable-storage verification failure code instead of downgrading the outcome to generic unknown error.

## 3. Notes
1. 你消息里贴的旧 finding `test/artifact-registry-view.integration.test.ts:5-8` 这轮不在当前 working tree 范围内，也没有复现；当前 diff 已经收窄到 CLI `doctor/verify` 的 durable-storage diagnostics。
2. 这轮最大风险集中在 “inspection path 是否保持只读且 fail-closed” 的边界，而不是 task ledger plan/checklist 的文档台账同步。

## 4. Verification
1. `/opt/homebrew/bin/node ./node_modules/vitest/vitest.mjs run apps/cli/test/cli-governance-runtime.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
2. `PATH="/opt/homebrew/bin:/Users/jimmydaddy/Library/pnpm:$PATH" pnpm run build`（通过）

## 复核结论（2026-04-02）

- 整体结论：**认可**

### 逐条复核
1. `2.1 [P1] Canonical artifact-registry inspection is still fail-open and mutates state`
   - 判定：**认可**
   - 证据：`inspectArtifactRegistryCanonicalTruth()` 原先通过 `SqliteArtifactIndexStore` 构造器读取 canonical sqlite truth；该构造器会在初始化时创建目录、打开读写连接并执行 schema init，确实违背了 doctor/verify 只读诊断与 fail-closed 目标。
   - 处理：改为使用 `node:sqlite` 的 read-only 连接直接读取 canonical tables；如果 sqlite 文件存在但缺少 canonical schema 或表不可读，现在返回 `state=read_failed`，不再在诊断路径里补 schema 或把异常归一成 `empty`。
2. `2.2 [P2] Durable-storage verify failures are surfaced as UNKNOWN`
   - 判定：**认可**
   - 证据：`verify-command.ts` 原先在 durable-storage blocker 分支抛出 `GovernorErrorCode.UNKNOWN`，这会把治理性 verify 失败和非预期内部异常混在一起，机器侧无法稳定分流。
   - 处理：新增并使用确定性错误码 `GovernorErrorCode.DURABLE_STORAGE_VERIFY_FAILED`，让 durable-storage blocker 成为可审计、可自动化分支的 verify 结果。

### 验证命令
1. `PATH="/opt/homebrew/bin:/Users/jimmydaddy/Library/pnpm:$PATH" pnpm exec biome check packages/shared/src/errors/error-code.constant.ts apps/cli/src/runtime/durable-storage-diagnostics-runtime.ts apps/cli/src/commands/verify-command.ts apps/cli/test/cli-governance-runtime.integration.test.ts`（通过）
2. `PATH="/opt/homebrew/bin:/Users/jimmydaddy/Library/pnpm:$PATH" pnpm exec vitest run apps/cli/test/cli-governance-runtime.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
3. `PATH="/opt/homebrew/bin:/Users/jimmydaddy/Library/pnpm:$PATH" pnpm run build`（通过）

## 修复执行记录（2026-04-02）

1. `2.1 [P1] Canonical artifact-registry inspection is still fail-open and mutates state`：已完成
   - 变更文件：`apps/cli/src/runtime/durable-storage-diagnostics-runtime.ts`
   - 验证：`PATH="/opt/homebrew/bin:/Users/jimmydaddy/Library/pnpm:$PATH" pnpm exec vitest run apps/cli/test/cli-governance-runtime.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
   - 说明：artifact-registry canonical inspection 已切到真正的 read-only sqlite 读路径，并补了“空 sqlite 但无 canonical tables”时 fail-closed 的回归。
2. `2.2 [P2] Durable-storage verify failures are surfaced as UNKNOWN`：已完成
   - 变更文件：`packages/shared/src/errors/error-code.constant.ts`、`apps/cli/src/commands/verify-command.ts`、`apps/cli/test/cli-governance-runtime.integration.test.ts`
   - 验证：`PATH="/opt/homebrew/bin:/Users/jimmydaddy/Library/pnpm:$PATH" pnpm run build`（通过）
   - 说明：verify 的 durable-storage blocker 现在使用稳定错误码 `DURABLE_STORAGE_VERIFY_FAILED`，并已有定向回归锁住该行为。
