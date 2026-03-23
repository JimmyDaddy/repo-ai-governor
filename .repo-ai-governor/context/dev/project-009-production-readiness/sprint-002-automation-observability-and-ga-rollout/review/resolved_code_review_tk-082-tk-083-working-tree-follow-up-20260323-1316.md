# Code Review: TK-082 / TK-083 working tree follow-up

- Status: resolved
- Date: 2026-03-23
- Reviewer: AI-Agent
- Task: `TK-082/TK-083`
- Review Type: working tree review
- Normative References:
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements.md`
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`

## 1. Review Scope

1. `apps/cli/src/cli-governance-runtime.ts`
2. `apps/cli/src/main.ts`
3. `apps/cli/src/cli-output-presenter.ts`
4. `apps/cli/src/types/interfaces/cli-output.interface.ts`
5. `packages/config/src/profile-resolver.ts`
6. `packages/config/src/schema-validator.ts`
7. `packages/config/src/types/interfaces/governor.interface.ts`
8. `apps/cli/test/cli-governance-runtime.integration.test.ts`
9. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-002-automation-observability-and-ga-rollout/tasks/TK-082-multi-tool-model-real-invocation-and-unattended-flow.md`
10. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-002-automation-observability-and-ga-rollout/tasks/DA-094-multi-tool-model-real-invocation-and-unattended-flow.md`
11. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-002-automation-observability-and-ga-rollout/tasks/TK-083-role-level-progress-log-and-human-friendly-interaction.md`
12. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-002-automation-observability-and-ga-rollout/tasks/checklist.md`
13. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-002-automation-observability-and-ga-rollout/tasks/tasks.csv`

## 2. Findings

### 2.1 [P1] `run` 主执行链仍未进入 adapter 执行面

- 位置: `apps/cli/src/cli-governance-runtime.ts:872`
- 问题描述: `executeRunCommand()` 仍把每个 stage 直接交给内联回调处理，并固定输出 `handledBy: "cli-governance-runtime"`；整条 `run` 链没有消费 `adapters/routing`，也没有调用任何 adapter 的 `invokeStage()`。这意味着当前实现虽然新增了 `connect/doctor/verify` 的探测与诊断能力，但 `plan -> run -> review -> review-verify -> report -> ledger backfill` 的主执行链仍没有切到 `codex/github-copilot/claude-code` 的真实路由执行面。
- 影响: `TK-082` 当前被标记为 `completed`，且任务目标仍写着“完成多工具/多模型真实调用与自动执行链路收敛，满足无人值守运行要求”；但目标仓库实际运行时仍只会命中内部占位处理器，无法验证也无法交付真正的多工具无人值守执行闭环。
- 建议: 在任务/台账保持真实范围之前，不要把 `TK-082` 视为“真实调用已完成”；要么继续把 `run` 链接到 adapter registry / `invokeStage()`，要么把任务目标、DA 与台账结论下调为“adapter onboarding/probe baseline”。

### 2.2 [P1] profile 级 `adapters` 覆盖会抹掉 CLI 默认路由基线

- 位置: `packages/config/src/profile-resolver.ts:79`
- 问题描述: `mergeAdapters()` 在 `baseConfig.adapters` 缺省、但 profile 只提供 `adapters.tools` 之类局部覆盖时，仍会返回一个显式的 adapters 对象，其中 `roles` 退化为 `[]`、`routing.roleBindings` 退化为 `{}`。随后 `apps/cli/src/main.ts` 的 `resolveAdaptersRuntimeConfig()` 只要看到 `adaptersConfig` 已定义，就不会再回退到 `DEFAULT_ADAPTERS_CONFIG`。结果是“仓库依赖 CLI 默认 adapters 基线，只想用 profile 调整某个工具可用性”这一常见场景，会在启用 profile 后丢失全部默认角色/路由，并让 `verify/doctor --adapters` 进入 `requiredRoleCount=0` 的失败路径。
- 影响: 目标仓库无法安全地用 profile 做环境级 adapters 覆盖，最容易在试点接入、CI profile、开发者本地 profile 这些场景把原本可工作的默认路由打坏，直接违背“快速接入、按 profile 复用配置”的主线目标。
- 建议: 让 profile adapters merge 基于 CLI 默认基线做合成，而不是仅基于 `baseConfig.adapters`；或者在缺少 base adapters 时拒绝 profile-only adapters 覆盖，避免生成空 `roles/routing` 的“伪完整”配置对象。

## 3. Notes

1. `DA-094` 自身已经把实现范围收窄到 `connect -> doctor --adapters -> verify --adapters`；真正和代码不一致的是 `TK-082` 的任务标题/目标与台账完成语义，后续复核时需要一起校正。
2. `TK-083` 当前仍是 `in_progress`，这轮 review 主要发现的是它依赖的 `TK-082` 基线仍有未闭环项，而不是 `experience` 输出模型本身的局部展示问题。

## 4. Verification

1. `git status --short`（通过）
2. `git diff --stat`（通过）
3. `git diff --cached --stat`（通过）
4. `git diff HEAD -- apps/cli/src/main.ts apps/cli/src/cli-output-presenter.ts apps/cli/src/types/interfaces/cli-output.interface.ts apps/cli/src/types/index.ts apps/cli/src/types/interfaces/index.ts packages/shared/src/constants/index.ts packages/shared/src/index.ts`（通过）
5. `git diff HEAD -- apps/cli/src/cli-governance-runtime.ts packages/config/src/schema-validator.ts packages/config/src/profile-resolver.ts packages/config/src/types/interfaces/governor.interface.ts apps/cli/test/cli-governance-runtime.integration.test.ts packages/config/test/config.unit.test.ts scripts/build/copy-runtime-assets.js apps/cli/package.json`（通过）
6. `rg -n 'invokeStage\\(|new CodexAgentAdapter|new GithubCopilotAgentAdapter|new ClaudeCodeAgentAdapter|handledBy|adapterSurface|routeKey' apps/cli/src/cli-governance-runtime.ts apps/cli/src/main.ts apps/cli/test/cli-governance-runtime.integration.test.ts -S`（通过）
7. `pnpm run check`（未执行）

## 复核结论（2026-03-23）

- 整体结论：**认可**

### 逐条复核

1. `2.1 [P1] run 主执行链仍未进入 adapter 执行面`
   - 判定：**认可**
   - 证据：`apps/cli/src/cli-governance-runtime.ts:868-877` 的 `executeRunCommand()` 仍通过 `processRuntimeEngine.execute(..., async (stageContext) => ({ handledBy: "cli-governance-runtime", ... }))` 直接返回内联 stage 输出；当前文件不存在 `invokeStage(` 调用，`run` 主链也未消费 `adapters/routing` 路由决策。`TK-082` 当前任务目标仍写明“完成多工具/多模型真实调用与自动执行链路收敛”，与代码执行面存在语义差距。
   - 处理：保持该发现为后续修复项。若短期不接入 adapter `invokeStage()`，需先把 `TK-082` 目标与台账语义收敛为“接入与探测基线”以避免完成态失真。

2. `2.2 [P1] profile 级 adapters 覆盖会抹掉 CLI 默认路由基线`
   - 判定：**认可**
   - 证据：`packages/config/src/profile-resolver.ts:84-140` 的 `mergeAdapters()` 在 `baseAdapters` 缺省且 profile 仅提供局部字段时，`roles` 会退化为 `[]`、`routing.roleBindings` 退化为 `{}` 并返回显式 adapters 对象；`apps/cli/src/main.ts:423-458` 的 `resolveAdaptersRuntimeConfig()` 一旦收到该对象即不再回退 `DEFAULT_ADAPTERS_CONFIG`，从而触发 `requiredRoleCount=0` 的失败路径。
   - 处理：保持该发现为后续修复项。建议将 profile adapters 合成逻辑改为“默认基线 + profile 增量覆盖”，或在缺少完整 adapters 基线时拒绝 profile-only 覆盖。

### 验证命令

1. `git status --short`（通过）
2. `git diff --name-only --diff-filter=ACMR`（通过）
3. `git diff --cached --name-only --diff-filter=ACMR`（通过）
4. `sed -n '720,930p' apps/cli/src/cli-governance-runtime.ts`（通过）
5. `rg -n "invokeStage\\(|handledBy|resolveAdaptersRuntimeConfig|DEFAULT_ADAPTERS_CONFIG|mergeAdapters\\(|requiredRoleCount" apps/cli/src/cli-governance-runtime.ts apps/cli/src/main.ts packages/config/src/profile-resolver.ts -S`（通过）
6. `sed -n '1,220p' packages/config/src/profile-resolver.ts`（通过）
7. `sed -n '360,560p' apps/cli/src/main.ts`（通过）

## 修复执行记录（2026-03-23）

1. `2.1 [P1] run 主执行链仍未进入 adapter 执行面`：已完成
   - 变更文件：`apps/cli/src/cli-governance-runtime.ts`、`apps/cli/test/cli-governance-runtime.integration.test.ts`
   - 验证：`pnpm -s vitest run apps/cli/test/cli-governance-runtime.integration.test.ts`（通过）
   - 说明：`executeRunCommand()` 已改为通过 `AgentRouteRunner.dispatchStage()` 执行 stage；stage output 现在包含 `handledBy=adapter-route-runner` 与 `adapterSurface`，并新增集成断言验证审计记录中的 adapter 执行证据。

2. `2.2 [P1] profile 级 adapters 覆盖会抹掉 CLI 默认路由基线`：已完成
   - 变更文件：`packages/config/src/profile-resolver.ts`、`apps/cli/src/main.ts`、`packages/config/test/config.unit.test.ts`、`apps/cli/test/cli-output-contract.integration.test.ts`
   - 验证：`pnpm -s vitest run packages/config/test/config.unit.test.ts apps/cli/test/cli-output-contract.integration.test.ts`（通过）
   - 说明：profile merge 不再注入伪完整 `roles=[]/routing={}`；CLI 运行时 adapters 解析改为“默认基线 + 增量覆盖”，并新增 profile-only tools 覆盖回归测试，确保 `required_roles` 不会退化为 0。

3. 门禁回归：已完成
   - 变更文件：`apps/cli/src/cli-governance-runtime.ts`、`apps/cli/src/main.ts`、`packages/config/src/profile-resolver.ts` 及对应测试文件
   - 验证：`pnpm -s tsc -p tsconfig.json --noEmit`、`pnpm -s vitest run packages/config/test/config.unit.test.ts apps/cli/test/cli-governance-runtime.integration.test.ts apps/cli/test/cli-output-contract.integration.test.ts apps/cli/test/cli-skeleton.integration.test.ts`、`pnpm run check`（通过）
   - 说明：两条认可项已完成修复，当前报告满足 `resolved` 关闭条件。
