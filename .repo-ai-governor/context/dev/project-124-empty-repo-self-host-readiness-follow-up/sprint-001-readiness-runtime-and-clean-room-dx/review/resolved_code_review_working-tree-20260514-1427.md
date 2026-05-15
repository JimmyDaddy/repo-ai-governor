# Code Review: TK-1065 self-host readiness preflight and run gating contract

- Status: resolved
- Date: 2026-05-14
- Reviewer: AI-Agent
- Task: `CR-001`
- Review Type: delegated fresh reviewer round
- Normative References:
  - `AGENTS.md`
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/cr-lifecycle-threshold-spec.md`

## 1. Review Scope
1. `apps/cli/src/cli-governance-runtime.ts`
2. `apps/cli/src/runtime/adoption-pack-runtime.ts`
3. `apps/cli/test/cli-governance-runtime.integration.test.ts`

## 2. Findings
### 2.1 [P2] Diagnostic exception is wider than the documented self-host run contract
- 位置: `apps/cli/src/cli-governance-runtime.ts:2727`
- 问题描述: canonical self-host preflight 被阻塞时，当前只要满足 `baseline + --dry-run` 就会绕过 fail-closed gate；但 `TK-1065` 任务卡与当前错误文案都把允许例外明确收窄到 baseline `run --dry-run --trace`。
- 影响: blocked self-host repo 仍可在不带 `--trace` 的情况下进入 exploratory path，导致 runtime contract、task truth 与 operator guidance 再次漂移。
- 建议: 将诊断例外收紧为 `baseline + --dry-run + --trace`，并补一条反向测试覆盖“只带 `--dry-run` 仍 fail-closed”。

## 3. Notes
1. 本轮 fresh reviewer 未发现第二条可执行问题。

## 4. Verification
1. `pnpm exec vitest run apps/cli/test/adopt-command.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（主 agent 已执行）
2. `pnpm exec vitest run apps/cli/test/cli-governance-runtime.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（主 agent 已执行）
3. `pnpm run build`（主 agent 已执行）

## 复核结论（2026-05-14）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：`apps/cli/src/cli-governance-runtime.ts` 原实现仅要求 `baseline + --dry-run`，而 `TK-1065` 任务卡与错误文案都明确把允许例外收窄为 baseline `run --dry-run --trace`。
   - 处理：接受并修复为 `baseline + --dry-run + --trace` 才允许 diagnostic exception。

### 验证命令
1. `pnpm exec vitest run apps/cli/test/cli-governance-runtime.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
2. `pnpm exec vitest run apps/cli/test/adopt-command.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
3. `pnpm run build`（通过）

## 修复执行记录（2026-05-14）

1. `2.1`：已完成
   - 变更文件：`apps/cli/src/cli-governance-runtime.ts`、`apps/cli/test/cli-governance-runtime.integration.test.ts`
   - 验证：`pnpm exec vitest run apps/cli/test/cli-governance-runtime.integration.test.ts --maxWorkers=1 --maxConcurrency=1`、`pnpm exec vitest run apps/cli/test/adopt-command.integration.test.ts --maxWorkers=1 --maxConcurrency=1`、`pnpm run build`（通过）
   - 说明：self-host blocked preflight 的 baseline diagnostic allowance 已收紧为仅 `run --dry-run --trace`；新增反向用例覆盖“仅 `--dry-run` 仍 fail-closed”。
