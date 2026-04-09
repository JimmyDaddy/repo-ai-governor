# Code Review: TK-715 governed branch-switch execution round 3

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
### 2.1 [P2] session.main branch-switch matcher still rejects Git-valid names
- 位置: `packages/core-orchestration-service/src/local-orchestration-service-session-main-skill-registry.ts:23`
- 问题描述: fresh reviewer 复核发现，CLI 执行层已经显式支持 `feature+foo` 这类 Git 合法分支名，但 `session.main` 的自然语言分支提取与校验仍限制在 `[a-z0-9._/-]+`。因此“切到 feature+foo”“checkout bugfix@bar”这类请求不会进入 `/workspace switch-branch` 的受治理 handoff，而是直接错过该能力。
- 影响: 这会让 `TK-715` 在自然语言入口和 CLI 执行入口之间出现能力裂缝，导致一部分真实分支名只能通过手输 slash command 才能走通。
- 建议: 将 `session.main` 的分支提取/校验放宽到与 CLI 一致的 Git 兼容范围，并在 skill-registry 或 dispatcher 层补充 `+` / `@` 分支名回归测试。

## 3. Notes
1. 该 finding 属于 risk-based correctness inference，但直接命中 `TK-715` “自然语言请求进入受治理执行路径”的任务目标。
2. 当前 round 需要先修复 skill-registry / dispatcher 层，再重跑同窗口验证并推进 CR 生命周期。

## 4. Verification
1. `pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-catalog.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-explainer.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-skill-registry.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts apps/cli/test/runtime/session-slash-command-registry.test.ts apps/cli/test/commands/workspace-command.test.ts apps/cli/test/cli-governance-runtime.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
2. `pnpm run build`（通过）

## 复核结论（2026-04-08）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：`packages/core-orchestration-service/src/local-orchestration-service-session-main-skill-registry.ts` 已把分支提取/校验放宽到 Git 兼容的 `+` / `@` 范围；`packages/core-orchestration-service/src/local-orchestration-service-session-main-agent-dispatcher.ts` 已避免把 `bugfix@bar` 这类分支名中的 `@` 误当成 role mention；对应 skill-registry / dispatcher 回归测试已补齐。
   - 处理：纳入本轮修复。

### 验证命令
1. `pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-catalog.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-explainer.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-skill-registry.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts apps/cli/test/runtime/session-slash-command-registry.test.ts apps/cli/test/commands/workspace-command.test.ts apps/cli/test/cli-governance-runtime.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
2. `pnpm run build`（通过）

### 风险与后续
1. 当前 round 的唯一 actionable finding 已完成复核并进入修复完成态验证，可推进到 `resolved`。

## 修复执行记录（2026-04-08）

1. `2.1`：已完成
   - 变更文件：`packages/core-orchestration-service/src/local-orchestration-service-session-main-skill-registry.ts`、`packages/core-orchestration-service/src/local-orchestration-service-session-main-agent-dispatcher.ts`、`packages/core-orchestration-service/test/local-orchestration-service-session-main-skill-registry.unit.test.ts`、`packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts`
   - 验证：`pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-catalog.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-explainer.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-skill-registry.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts apps/cli/test/runtime/session-slash-command-registry.test.ts apps/cli/test/commands/workspace-command.test.ts apps/cli/test/cli-governance-runtime.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）；`pnpm run build`（通过）
   - 说明：自然语言分支提取已接受 `feature+foo` / `bugfix@bar`，同时 role mention 剥离只处理独立 `@role` token，不再误伤分支名中的 `@`。

## 处置结果与剩余风险（2026-04-08）

1. `CR-003` 的 accepted finding 已完成修复并通过同窗口重验。
2. 当前边界剩余工作仅为继续执行 fresh reviewer recheck，确认不存在新增 actionable findings。
