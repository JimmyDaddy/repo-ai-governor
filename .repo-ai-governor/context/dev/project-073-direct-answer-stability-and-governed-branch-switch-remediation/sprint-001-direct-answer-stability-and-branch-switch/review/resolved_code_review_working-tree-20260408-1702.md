# Code Review: TK-715 governed branch-switch execution round 2

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
### 2.1 [P2] branch-switch validator rejects Git-valid local branch names
- 位置: `apps/cli/src/commands/workspace-command.ts:228`
- 问题描述: `resolveTargetBranch()` 当前只接受 `[A-Za-z0-9._/-]`，但 Git 本身允许更多合法本地分支名，例如 `feature+foo`、`bugfix@bar`。reviewer 用 `git check-ref-format --branch` 复核后确认这些分支名是合法的，因此当前 validator 会把 Git 可切换的现有本地分支错误拒绝掉。
- 影响: 这会让新引入的受治理分支切换路径在一部分真实分支名上失效，形成功能性回归。
- 建议: 用 Git 兼容的校验路径替代手写正则，例如 `git check-ref-format --branch`，并补一条覆盖 `+` / `@` 的回归测试。

### 2.2 [P3] branch-switch 新增用户可见文案绕过 i18n
- 位置: `apps/cli/src/commands/workspace-command.ts:220`、`apps/cli/src/main.ts:1079`
- 问题描述: 当前 branch-switch 新增的报错文案与 help example 直接写成了硬编码英文字符串，没有通过仓库既有的 i18n 桥接输出，违反 `CS-033`。
- 影响: 非英文用户会直接看到未翻译文案，CLI 帮助与运行时错误输出会从现有国际化契约中漂移出去。
- 建议: 为 branch-switch 的 help / error copy 新增中英文 translation keys，并在 `workspace-command` 与 `main.ts` 中统一走 `translate` 或 `localizeText`。

## 3. Notes
1. `2.1` 属于 risk-based correctness finding，不直接对应仓库规则，但与“切换现有本地分支”的任务目标冲突。
2. `2.2` 直接命中 `CS-033`，属于仓库级用户可见文案治理规则。

## 4. Verification
1. `pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-catalog.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-explainer.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-skill-registry.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts apps/cli/test/runtime/session-slash-command-registry.test.ts apps/cli/test/commands/workspace-command.test.ts apps/cli/test/cli-governance-runtime.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
2. `pnpm run build`（通过）

## 复核结论（2026-04-08）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：`apps/cli/src/commands/workspace-command.ts` 已改为使用 `git check-ref-format --branch` 校验目标分支名，移除了对 `feature+foo` / `bugfix@bar` 这类 Git 合法分支名的误拒绝；`apps/cli/test/commands/workspace-command.test.ts` 已新增 `feature+foo` 回归覆盖。
   - 处理：纳入本轮修复。
2. `2.2`
   - 判定：**认可**
   - 证据：branch-switch 运行时错误、`detached HEAD` 展示文案与 `workspace` help example 已统一改走 `translate` / `localizeText`；`packages/shared/src/i18n/locales/en-us.ts` 与 `packages/shared/src/i18n/locales/zh-cn.ts` 已补齐对应 key。
   - 处理：纳入本轮修复。

### 验证命令
1. `pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-catalog.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-explainer.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-skill-registry.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts apps/cli/test/runtime/session-slash-command-registry.test.ts apps/cli/test/commands/workspace-command.test.ts apps/cli/test/cli-governance-runtime.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
2. `pnpm run build`（通过）

### 风险与后续
1. 当前两条 actionable findings 已完成复核并进入修复完成态验证，可推进到 `resolved`。

## 修复执行记录（2026-04-08）

1. `2.1`：已完成
   - 变更文件：`apps/cli/src/commands/workspace-command.ts`、`apps/cli/test/commands/workspace-command.test.ts`
   - 验证：`pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-catalog.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-explainer.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-skill-registry.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts apps/cli/test/runtime/session-slash-command-registry.test.ts apps/cli/test/commands/workspace-command.test.ts apps/cli/test/cli-governance-runtime.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）；`pnpm run build`（通过）
   - 说明：目标分支名校验已改为走 Git 原生 `check-ref-format --branch`，并新增 `feature+foo` 与非法分支名本地化错误回归测试。
2. `2.2`：已完成
   - 变更文件：`apps/cli/src/commands/workspace-command.ts`、`apps/cli/src/main.ts`、`packages/shared/src/i18n/locales/en-us.ts`、`packages/shared/src/i18n/locales/zh-cn.ts`
   - 验证：`pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-catalog.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-explainer.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-skill-registry.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts apps/cli/test/runtime/session-slash-command-registry.test.ts apps/cli/test/commands/workspace-command.test.ts apps/cli/test/cli-governance-runtime.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）；`pnpm run build`（通过）
   - 说明：branch-switch 帮助文案、错误信息与 `detached HEAD` 展示路径已经统一接入 i18n / bilingual bridge。

## 处置结果与剩余风险（2026-04-08）

1. `CR-002` 的 accepted findings 已全部修复并完成同窗口重验。
2. 当前边界剩余工作仅为按 scoped CR loop 发起 fresh reviewer recheck，确认没有新增 actionable findings。
