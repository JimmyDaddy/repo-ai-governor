# Code Review: TK-715 governed branch-switch execution round 4

- Status: resolved
- Date: 2026-04-08
- Reviewer: AI-Agent
- Task: `TK-715`
- Review Type: delegated task review
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
  - `.codex/skills/workspace-code-review-workflow/SKILL.md`
  - `.codex/skills/workspace-delivery-finisher/SKILL.md`

## 1. Review Scope
1. `packages/core-orchestration-service/src`
2. `apps/cli/src`
3. `packages/shared/src/i18n/locales`
4. `packages/core-orchestration-service/test`
5. `apps/cli/test`

## 2. Findings
### 2.1 [P2] switch-branch no-op still fails on dirty worktree
- 位置: `apps/cli/src/commands/workspace-command.ts:407`
- 问题描述: fresh reviewer 指出，dirty-worktree gate 发生在“当前分支是否已经等于目标分支”的 no-op 判定之前。因此即使用户已经位于目标分支，只要工作树里有未提交改动，`workspace switch-branch <current-branch>` 仍会错误失败。
- 影响: 这会把本应是安全 no-op 的查询/确认动作误报成失败，形成用户可见的 false negative。
- 建议: 将 no-op 判定前置，或在 `currentBranch === targetBranch` 时绕过 clean-tree gate，并补一条 dirty no-op 回归测试。

### 2.2 [P3] session.main 分支提取仍对 Unicode 合法分支名过窄
- 位置: `packages/core-orchestration-service/src/local-orchestration-service-session-main-skill-registry.ts:23`
- 问题描述: 当前 `session.main` 分支提取 token 仍限制在 ASCII 子集，因此 Git 允许的一部分 Unicode 分支名不会进入 `/workspace switch-branch` 的受治理 handoff，只能在自然语言入口静默失配。
- 影响: 这会让 `TK-715` 对多语言分支命名场景仍保留隐形能力缺口。
- 建议: 放宽 skill-registry 的分支 token 提取为 Unicode 友好形式，并通过 CLI 执行层的 Git 校验作为最终准入门。

## 3. Notes
1. `2.1` 与 `2.2` 均为 risk-based correctness inference，但都直接影响 `TK-715` “从自然语言到受治理分支切换”的完整闭环。
2. 当前 round 需要继续修复 no-op dirty gate 顺序与 Unicode 分支 token 覆盖，再重跑同窗口验证。

## 4. Verification
1. `pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-catalog.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-explainer.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-skill-registry.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts apps/cli/test/runtime/session-slash-command-registry.test.ts apps/cli/test/commands/workspace-command.test.ts apps/cli/test/cli-governance-runtime.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
2. `pnpm run build`（通过）

## 复核结论（2026-04-08）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：`apps/cli/src/commands/workspace-command.ts` 已把 `switched` 判定前置到 dirty-worktree gate 之前，因此当前分支等于目标分支时会按 no-op 继续，而不是误报失败；`apps/cli/test/commands/workspace-command.test.ts` 已新增 dirty no-op 回归测试。
   - 处理：纳入本轮修复。
2. `2.2`
   - 判定：**认可**
   - 证据：`packages/core-orchestration-service/src/local-orchestration-service-session-main-skill-registry.ts` 的分支 token 提取已放宽为 Unicode 友好形式；`packages/core-orchestration-service/test/local-orchestration-service-session-main-skill-registry.unit.test.ts` 已新增 Unicode 分支名回归覆盖。
   - 处理：纳入本轮修复。

### 验证命令
1. `pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-catalog.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-explainer.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-skill-registry.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts apps/cli/test/runtime/session-slash-command-registry.test.ts apps/cli/test/commands/workspace-command.test.ts apps/cli/test/cli-governance-runtime.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
2. `pnpm run build`（通过）

### 风险与后续
1. 当前 round 的两条 actionable findings 已完成复核并进入修复完成态验证，可推进到 `resolved`。

## 修复执行记录（2026-04-08）

1. `2.1`：已完成
   - 变更文件：`apps/cli/src/commands/workspace-command.ts`、`apps/cli/test/commands/workspace-command.test.ts`
   - 验证：`pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-catalog.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-explainer.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-skill-registry.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts apps/cli/test/runtime/session-slash-command-registry.test.ts apps/cli/test/commands/workspace-command.test.ts apps/cli/test/cli-governance-runtime.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）；`pnpm run build`（通过）
   - 说明：当前分支等于目标分支时，`switch-branch` 现在允许 dirty worktree 走 no-op 路径，不再误报切换失败。
2. `2.2`：已完成
   - 变更文件：`packages/core-orchestration-service/src/local-orchestration-service-session-main-skill-registry.ts`、`packages/core-orchestration-service/test/local-orchestration-service-session-main-skill-registry.unit.test.ts`
   - 验证：`pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-catalog.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-explainer.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-skill-registry.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts apps/cli/test/runtime/session-slash-command-registry.test.ts apps/cli/test/commands/workspace-command.test.ts apps/cli/test/cli-governance-runtime.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）；`pnpm run build`（通过）
   - 说明：`session.main` 的分支提取已接受 Unicode 友好 token，CLI 执行层继续作为 Git 合法性最终判定面。

## 处置结果与剩余风险（2026-04-08）

1. `CR-004` 的 accepted findings 已全部修复并通过同窗口重验。
2. 当前边界剩余工作仅为再发起一轮 fresh reviewer，确认没有新增 actionable findings。
