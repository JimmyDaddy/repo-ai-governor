# Code Review: sprint-001-provider-continuation-state-model-and-fallback-boundary round 1

- Status: resolved
- Date: 2026-04-08
- Reviewer: AI-Agent
- Task: `CR-001`
- Review Type: delegated sprint review
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

1. `apps/cli/src/runtime/session-main-supervisor-runtime.ts`
2. `apps/cli/src/runtime/interactive-shell/session-shell-transcript-store.ts`
3. `apps/cli/test/runtime/session-main-supervisor-runtime.test.ts`
4. `apps/cli/test/runtime/session-shell-transcript-store.test.ts`
5. `packages/adapters/claude-code/src/claude-code-agent-adapter.ts`
6. `packages/adapters/claude-code/test/claude-code-agent-adapter.smoke.test.ts`
7. `packages/core-orchestration-service/src/local-orchestration-service-session-runtime.ts`
8. `packages/core-orchestration-service/src/types/interfaces/provider-continuation.interface.ts`
9. `packages/core-orchestration-service/src/types/interfaces/session-main-supervisor-runtime.interface.ts`
10. `packages/shared/src/i18n/locales/en-us.ts`
11. `packages/shared/src/i18n/locales/zh-cn.ts`
12. `.repo-ai-governor/context/current-context.md`
13. `.repo-ai-governor/context/dev/project-062-cli-continuity-and-adapter-truthfulness-hardening/**`

## 2. Findings

### 2.1 [P2] `providerContinuationUnsupported` falsely claims lightweight fallback on the no-fallback branch

- 位置:
  - `apps/cli/src/runtime/interactive-shell/session-shell-transcript-store.ts:768`
  - `packages/shared/src/i18n/locales/en-us.ts:483`
  - `packages/shared/src/i18n/locales/zh-cn.ts:434`
  - `apps/cli/test/runtime/session-shell-transcript-store.test.ts:385`
- 问题描述: `CliSessionShellTranscriptStore` 只有在 `lightweightSessionFallbackApplied === false` 时才会选择 `providerContinuationUnsupported` 文案，但新增的中英文文案和测试断言都把这个分支描述成 “shell 已回退到 lightweight session note”。这会把 `unsupported + no lightweight fallback` 和 `unsupported + fallback active` 两个对外语义重新混写。
- 影响: 用户会在“连续性并未被 lightweight note 保住”的分支里看到“已回退成功”的提示，破坏本 sprint 想冻结的 truthful fallback boundary。
- 建议: 把 `providerContinuationUnsupported` 的中英文文案改成明确表达 “no lightweight fallback available / 无轻量摘要可保持连续性”，并同步修正 transcript 回归测试。

## 3. Notes

1. delegated reviewer round `CR-001` 返回 1 条 actionable finding，主 agent 需要复核后再决定修复与收口。

## 4. Verification

1. `pnpm exec vitest run apps/cli/test/runtime/session-main-supervisor-runtime.test.ts apps/cli/test/runtime/session-shell-transcript-store.test.ts packages/adapters/claude-code/test/claude-code-agent-adapter.smoke.test.ts`（通过，review 前基线）
2. `pnpm run build`（通过，review 前基线）
3. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过，review 前基线）

## 复核结论（2026-04-08）

- 整体结论：**认可**

### 逐条复核

1. `2.1`
   - 判定：**认可**
   - 证据：`CliSessionShellTranscriptStore` 只有在 `lightweightSessionFallbackApplied === false` 时才会落到 `providerContinuationUnsupported`，所以此前把该分支写成“已回退到 lightweight session note”的中英文文案和测试断言都与当前 fallback boundary contract 冲突。
   - 处理：在当前窗口修正文案与 transcript regression 断言，并在下一步补齐修复验证记录。

### 验证命令

1. `pnpm exec vitest run apps/cli/test/runtime/session-main-supervisor-runtime.test.ts apps/cli/test/runtime/session-shell-transcript-store.test.ts packages/adapters/claude-code/test/claude-code-agent-adapter.smoke.test.ts`（通过）
2. `pnpm run build`（通过）
3. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）

## 修复执行记录（2026-04-08）

1. `2.1`：已完成
   - 变更文件：`packages/shared/src/i18n/locales/en-us.ts`、`packages/shared/src/i18n/locales/zh-cn.ts`、`apps/cli/test/runtime/session-shell-transcript-store.test.ts`
   - 验证：`pnpm exec vitest run apps/cli/test/runtime/session-main-supervisor-runtime.test.ts apps/cli/test/runtime/session-shell-transcript-store.test.ts packages/adapters/claude-code/test/claude-code-agent-adapter.smoke.test.ts`、`pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）
   - 说明：`providerContinuationUnsupported` 已改为明确表达 “no lightweight fallback available”，并同步把 transcript regression 断言从 `fallback=session-note` 修正为 `no-lightweight-fallback`。
