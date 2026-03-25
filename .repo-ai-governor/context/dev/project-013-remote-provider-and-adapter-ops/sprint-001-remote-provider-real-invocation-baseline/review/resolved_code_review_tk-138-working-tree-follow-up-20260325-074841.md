# Code Review: TK-138 Working Tree Follow-up

- Status: resolved
- Date: 2026-03-25
- Reviewer: AI-Agent
- Task: `TK-138`
- Review Type: working tree review
- Normative References:
  - `AGENTS.md`
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/execution-gate-layering-spec.md`
  - `.repo-ai-governor/context/dev/project-013-remote-provider-and-adapter-ops/sprint-001-remote-provider-real-invocation-baseline/tasks/TK-138-github-copilot-remote-provider-real-invocation-and-capability-truthfulness.md`
  - `.repo-ai-governor/context/dev/project-013-remote-provider-and-adapter-ops/sprint-001-remote-provider-real-invocation-baseline/tasks/DA-138-github-copilot-remote-provider-real-invocation-and-capability-truthfulness.md`

## 1. Review Scope
1. `packages/adapters/github-copilot/src/github-copilot-agent-adapter.ts`
2. `packages/adapters/github-copilot/test/github-copilot-agent-adapter.smoke.test.ts`
3. `apps/cli/src/main.ts`
4. `apps/cli/src/runtime/github-copilot-exec-fixture-runtime.ts`
5. `apps/cli/src/runtime/local-model-probe-runtime.ts`
6. `apps/cli/test/runtime/github-copilot-exec-fixture-runtime.test.ts`
7. `apps/cli/test/runtime/adapter-verification-runtime.test.ts`
8. `apps/cli/test/cli-governance-runtime.integration.test.ts`
9. `apps/cli/test/cli-output-contract.integration.test.ts`
10. `scripts/examples/check-examples-runtime.js`
11. `scripts/ci/stage9-blackbox-ga-lib.js`
12. `test/e2e/blackbox-governance-flow.e2e.test.ts`

## 2. Findings
### 2.1 [P1] GitHub Copilot CLI adapter accepts failed executions when stdout still contains assistant JSON
- 位置: `packages/adapters/github-copilot/src/github-copilot-agent-adapter.ts:528-585`, `packages/adapters/github-copilot/src/github-copilot-agent-adapter.ts:743-846`
- 问题描述: `executeGithubCopilotCli()` 在子进程 `close` 时无论 `exitCode` 是否为非零都直接 `resolve` 原始结果；随后 `parseGithubCopilotCliOutput()` 只看 `session.error` 和 `assistant.*` 文本，从不检查进程 `exitCode`，也不检查 JSONL 里的 `result.exitCode`。这意味着只要 stdout 里还能解析出一条 `assistant.message`，即使底层 CLI 已经用非 0 退出，这个 adapter 也会把 probe/invoke 当成成功。
- 影响: 真实 GitHub Copilot provider 失败时可能被误判成成功，进而让 route runner 继续把角色留在 GitHub Copilot surface，而不是降级/回退。对 `TK-138` 这种“真实 provider + truthfulness”任务来说，这是直接破坏 correctness 的主路径问题。
- 建议: 在 `executeGithubCopilotCli()` 或 `parseGithubCopilotCliOutput()` 中把进程 `exitCode !== 0`、以及 JSONL `result.exitCode !== 0` 都视为协议失败；同时补一条 smoke/contract 测试覆盖“assistant output + non-zero exitCode”的分支。

## 3. Notes
1. 你贴出来的旧 finding `Codex CLI_EXEC probe advertises contradictory cancellation support` 这一轮已修复：`CLI_EXEC` 下 `capabilityMatrix.cancellation` 已与 `capabilityStates` 和 `cancel()` 行为对齐。
2. 当前新增的 GitHub Copilot fixture 注入面已改成 fail-closed，必须显式设置 `REPO_AI_GOVERNOR_ENABLE_TEST_FIXTURES=1` 才能启用；这部分我没有继续列为本轮问题。

## 4. Verification
1. `pnpm -s vitest run packages/adapters/github-copilot/test/github-copilot-agent-adapter.smoke.test.ts apps/cli/test/runtime/github-copilot-exec-fixture-runtime.test.ts apps/cli/test/runtime/adapter-verification-runtime.test.ts apps/cli/test/cli-governance-runtime.integration.test.ts apps/cli/test/cli-output-contract.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
2. `HOME=/tmp node ./scripts/examples/check-examples-runtime.js`（通过）
3. `pnpm exec tsx --eval "<minimal reproduction>"`（未执行：仓库当前未安装 `tsx`，无法直接用 source TS 做一条 one-off 复现）

## 复核结论（2026-03-25）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：复核时 `parseGithubCopilotCliOutput()` 只检查 `session.error` 和 assistant 文本，不检查进程 `exitCode`，也不检查 JSON `result.exitCode`，因此非零退出确实可能被误判成成功。
   - 处理：已将进程 `exitCode !== 0` 和 JSON `result.exitCode !== 0` 一并提升为协议失败，并补齐两条 smoke 回归。

### 验证命令
1. `pnpm -s tsc -p tsconfig.json --noEmit`（通过）
2. `pnpm -s vitest run packages/adapters/github-copilot/test/github-copilot-agent-adapter.smoke.test.ts apps/cli/test/runtime/github-copilot-exec-fixture-runtime.test.ts apps/cli/test/runtime/adapter-verification-runtime.test.ts apps/cli/test/cli-governance-runtime.integration.test.ts apps/cli/test/cli-output-contract.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
3. `pnpm run check`（通过）

## 修复执行记录（2026-03-25）

1. `2.1`：已完成
   - 变更文件：`packages/adapters/github-copilot/src/github-copilot-agent-adapter.ts`、`packages/adapters/github-copilot/test/github-copilot-agent-adapter.smoke.test.ts`
   - 验证：`pnpm -s tsc -p tsconfig.json --noEmit`、`pnpm -s vitest run packages/adapters/github-copilot/test/github-copilot-agent-adapter.smoke.test.ts apps/cli/test/runtime/github-copilot-exec-fixture-runtime.test.ts apps/cli/test/runtime/adapter-verification-runtime.test.ts apps/cli/test/cli-governance-runtime.integration.test.ts apps/cli/test/cli-output-contract.integration.test.ts --maxWorkers=1 --maxConcurrency=1`、`pnpm run check`（通过）
   - 说明：GitHub Copilot adapter 现在会对进程非零退出和 JSON `result.exitCode` 非零同时 fail-closed，不再接受“assistant 输出仍存在”的伪成功结果。
