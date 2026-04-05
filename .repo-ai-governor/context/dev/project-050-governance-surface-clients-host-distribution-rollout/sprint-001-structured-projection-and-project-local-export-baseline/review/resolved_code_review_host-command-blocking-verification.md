# Code Review: host command blocking verification

- Status: resolved
- Date: 2026-04-06
- Reviewer: AI-Agent
- Task: `n/a`
- Review Type: explicit scope review
- Normative References:
  - `AGENTS.md`
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/governance-host-distribution-contract.md`

## 1. Review Scope
1. `apps/cli/src/commands/host-command.ts`
2. `apps/cli/src/runtime/host-distribution-runtime.ts`
3. `apps/cli/test/commands/host-command.test.ts`
4. `apps/cli/test/host-command.integration.test.ts`

## 2. Findings
### 2.1 [P1] `host verify` downgrades a blocking reserved target to `warn`, so the same manifest can fail export and then succeed on verify
- 位置: `apps/cli/src/runtime/host-distribution-runtime.ts:230`
- 问题描述: `verify()` hard-codes the `target-capability` check to downgrade non-MVP targets to `HostVerificationStatus.WARN`. For `github_copilot.github_com_agent`, `host export` already treats the target as blocking, but `host verify --manifest ...` recomputes the summary as `warn`, which means [apps/cli/src/commands/host-command.ts] only sees warnings and returns success. The integration test at `apps/cli/test/host-command.integration.test.ts:132` only asserts the export failure path, so this regression is currently untested on the real verify path.
- 影响: A previously blocked verification state can be re-labeled as success, which directly violates the “no false success for blocking verification” requirement and allows a reserved Copilot target to look acceptable after the fact.
- 建议: Reuse the same blocking classification used by export-time verification, or at minimum keep non-MVP/reserved `target-capability` failures as `fail` in `verify()`. Add an integration test that runs `host verify` against the exported `github-com-agent` manifest and expects a non-zero exit code.
- 规范依据: `governance-host-distribution-contract.md` §4.6, §6.2

### 2.2 [P1] Missing apply/pack receipts are treated as “skip verification” instead of a blocking verification failure
- 位置: `apps/cli/src/runtime/host-distribution-runtime.ts:276`, `apps/cli/src/runtime/host-distribution-runtime.ts:296`
- 问题描述: When `manifest.applyReportPath` or `manifest.packReportPath` is present but the referenced artifact is missing, `verify()` silently skips the entire applied/packed drift branch because the code only enters those loops when `existsSync(...)` is true. That means a manifest can claim apply/sync or pack happened, while verification never checks the materialized assets and never emits a failure for the missing receipt. The current integration coverage at `apps/cli/test/host-command.integration.test.ts:65` only exercises the happy-path apply flow and does not protect this branch.
- 影响: Verification can report success without validating the exact applied or bundled assets that the contract says must be checked, so broken or deleted host materialization can slip through as a false green result.
- 建议: Add explicit `apply-report-presence` / `pack-report-presence` blocking checks before reading those artifacts, and add integration coverage for “manifest declares receipt but receipt is missing” for both apply and pack flows.
- 规范依据: `governance-host-distribution-contract.md` §4.5, §4.6

### 2.3 [P2] New CLI error paths are hard-coded in English instead of going through the i18n surface
- 位置: `apps/cli/src/runtime/host-distribution-runtime.ts:356`, `apps/cli/src/runtime/host-distribution-runtime.ts:469`, `apps/cli/src/runtime/host-distribution-runtime.ts:481`, `apps/cli/src/runtime/host-distribution-runtime.ts:492`, `apps/cli/src/runtime/host-distribution-runtime.ts:570`
- 问题描述: Several new user-visible error messages are emitted as English string literals (`Host distribution requires ...`, `Unsupported host ...`, `Host command requires --host/--mode`, `Host verify requires ...`) instead of being localized through the CLI i18n layer.
- 影响: These branches bypass locale selection and violate the CLI user-facing text contract, so the same command surface mixes localized and non-localized output depending on which error path the user hits.
- 建议: Route these messages through the existing translation/localization mechanism and add locale-sensitive coverage for at least one failing host-command path.
- 规范依据: `code_standards.md` [CS-033]

## 3. Notes
1. Build, package tests, integration tests, and real CLI smoke were treated as already-run context from the request and were not re-executed as part of this review.
2. One narrow local reproduction was run against the built CLI only to confirm finding 2.1: `host export` on `github-com-agent` exited non-zero, while `host verify` on the same manifest exited zero and rewrote the summary to `warn`.

## 4. Verification
1. `git status --short`（通过）
2. `node <<'NODE' ... spawnSync(cliPath, ['host','export',... 'github-com-agent']) ... spawnSync(cliPath, ['host','verify','--manifest', ...]) ... NODE`（通过，确认 export=1 / verify=0 的不一致）
3. Source inspection of `apps/cli/src/runtime/host-distribution-runtime.ts` and the paired tests listed in scope（通过）

## 复核结论（2026-04-06）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：`verify()` 已移除对 `target-capability` 的 `warn` 降级，reserved `github_copilot.github_com_agent` manifest 现在会把 verification summary 维持为 `fail`，CLI 也会返回 non-zero exit code。
   - 处理：保留 blocking verify 语义，并新增 `fails host verify for a reserved GitHub.com agent manifest even when staged export succeeded` integration coverage。
2. `2.2`
   - 判定：**认可**
   - 证据：`applyReportPath` / `packReportPath` 声明但文件缺失时，`verify()` 现在会写出 blocking `apply-report-presence` / `pack-report-presence` 检查，不能再静默跳过 drift verification。
   - 处理：保留缺失 receipt 的 fail-closed 路径，并新增 `fails host verify when the manifest declares a pack report that no longer exists` integration coverage。
3. `2.3`
   - 判定：**认可**
   - 证据：host runtime fail-fast 分支已改为使用 command-context `localizeText(english, chinese)`，同时 `createCommandExecutorContext()` 也改成真正透传 locale bridge，不再把 runtime 错误硬编码为英文。
   - 处理：补 `localizes host runtime validation errors for zh-CN locale` integration coverage，确认 `zh-CN` 下的 `host verify` 缺参错误会输出中文。

### 验证命令
1. `pnpm exec vitest run apps/cli/test/commands/host-command.test.ts apps/cli/test/host-command.integration.test.ts`（通过）
2. `pnpm run build`（通过）
3. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）
4. `pnpm run test:integration -- --maxWorkers=1 --maxConcurrency=1`（通过）

## 修复执行记录（2026-04-06）

1. `2.1`：已完成
   - 变更文件：`apps/cli/src/runtime/host-distribution-runtime.ts`、`apps/cli/test/host-command.integration.test.ts`
   - 验证：`pnpm exec vitest run apps/cli/test/commands/host-command.test.ts apps/cli/test/host-command.integration.test.ts`、`pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`、`pnpm run test:integration -- --maxWorkers=1 --maxConcurrency=1`（通过）
   - 说明：reserved Copilot target 在 verify 阶段不再被降级成 `warn`，避免出现 false success。
2. `2.2`：已完成
   - 变更文件：`apps/cli/src/runtime/host-distribution-runtime.ts`、`apps/cli/test/host-command.integration.test.ts`
   - 验证：`pnpm exec vitest run apps/cli/test/commands/host-command.test.ts apps/cli/test/host-command.integration.test.ts`、`pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`、`pnpm run test:integration -- --maxWorkers=1 --maxConcurrency=1`（通过）
   - 说明：manifest 声明但缺失的 apply/pack report 现在会显式阻断 verify，并覆盖 apply 与 pack 两条路径。
3. `2.3`：已完成
   - 变更文件：`apps/cli/src/cli-governance-runtime.ts`、`apps/cli/src/commands/host-command.ts`、`apps/cli/src/runtime/host-distribution-runtime.ts`、`apps/cli/test/host-command.integration.test.ts`
   - 验证：`pnpm exec vitest run apps/cli/test/commands/host-command.test.ts apps/cli/test/host-command.integration.test.ts`、`pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`、`pnpm run test:integration -- --maxWorkers=1 --maxConcurrency=1`（通过）
   - 说明：host runtime 失败文案现已走 locale bridge，`zh-CN` 和 `en-US` 不再在这些 remediation 路径上混用文案。

## 阶段复审结论（2026-04-06）

1. fresh reviewer 子 agent `Dalton` 在 post-fix recheck 中未发现当前 host-distribution 修复边界里的 actionable findings。
2. 复审边界覆盖：`apps/cli/src/cli-governance-runtime.ts`、`apps/cli/src/commands/host-command.ts`、`apps/cli/src/runtime/host-distribution-runtime.ts`、`apps/cli/test/host-command.integration.test.ts`。
3. 本轮 verifier 依据：`pnpm exec vitest run apps/cli/test/commands/host-command.test.ts apps/cli/test/host-command.integration.test.ts`、`pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`、`pnpm run test:integration -- --maxWorkers=1 --maxConcurrency=1`。
