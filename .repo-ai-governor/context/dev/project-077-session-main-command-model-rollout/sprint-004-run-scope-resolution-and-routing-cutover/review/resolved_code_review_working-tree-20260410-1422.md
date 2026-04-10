# Code Review: sprint-004 run scope resolution and routing cutover

- Status: resolved
- Date: 2026-04-10
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
  - `.repo-ai-governor/normative_knowledge_sources/governance/task-ledger-single-write-source-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/execution-gate-layering-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`

## 1. Review Scope

1. `packages/core-orchestration-service/src/local-orchestration-service-session-main-capability-catalog.ts`
2. `packages/core-orchestration-service/src/local-orchestration-service-session-main-skill-registry.ts`
3. `packages/core-orchestration-service/src/local-orchestration-service-session-main-capability-explainer.ts`
4. `packages/core-orchestration-service/src/local-orchestration-service-session-main-agent-dispatcher.ts`
5. `packages/shared/src/i18n/locales/en-us.ts`
6. `packages/shared/src/i18n/locales/zh-cn.ts`
7. `apps/cli/README.md`
8. `.repo-ai-governor/normative_knowledge_sources/product-requirements.md`
9. `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
10. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`
11. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md`
12. `packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-catalog.unit.test.ts`
13. `packages/core-orchestration-service/test/local-orchestration-service-session-main-skill-registry.unit.test.ts`
14. `packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts`
15. `apps/cli/test/runtime/session-slash-command-registry.test.ts`
16. `apps/cli/test/runtime/session-shell-runner.test.ts`

## 2. Findings

### 2.1 [P2] Bare `validate` / `验证` keywords still hijacked generic asks into doctor

- 位置: `packages/core-orchestration-service/src/local-orchestration-service-session-main-skill-registry.ts:62`, `packages/core-orchestration-service/src/local-orchestration-service-session-main-skill-registry.ts:240`
- 问题描述: 初始 reviewer round 发现 verify migration fallback 仍接受裸 `validation` / `validate` / `验证` / `校验` 关键词，并将其无条件桥接到 `/doctor`。这会把普通“校验 API shape / 迁移方案”的请求错误地拉进 readiness 诊断链路。
- 影响: 与 `TK-736` 的目标冲突，generic asks 无法稳定回落到 direct answer、planner workflow 或 workflow guidance。
- 建议: 仅在请求同时包含 verify action 与 readiness / adapter 语境时才迁移到 `/doctor`；为 generic validation ask 与 explicit readiness validation ask 补回归测试。

## 3. Notes

1. 本轮 delegated reviewer 只返回 1 条 actionable finding；主 agent 认可并在当前 change window 内完成修复与重验。
2. 修复后未发现新的 sprint-004 run-scope routing regression。

## 4. Verification

1. `pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-session-main-skill-registry.unit.test.ts`（通过）
2. `pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-catalog.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-skill-registry.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts apps/cli/test/runtime/session-slash-command-registry.test.ts apps/cli/test/runtime/session-shell-runner.test.ts`（通过）
3. `pnpm run build`（通过）

## 复核结论（2026-04-10）

- 整体结论：**认可**

### 逐条复核

1. `2.1`
   - 判定：**认可**
   - 证据：`skill-registry` 现改为 `verify action + readiness context` 双条件匹配；generic validation ask 会回落到普通路径，`adapter/readiness` 明确语境仍可迁移到 `/doctor`。
   - 处理：接受修复并继续推进 resolved 核验。

### 验证命令

1. `pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-session-main-skill-registry.unit.test.ts`（通过）
2. `pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-catalog.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-skill-registry.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts apps/cli/test/runtime/session-slash-command-registry.test.ts apps/cli/test/runtime/session-shell-runner.test.ts`（通过）
3. `pnpm run build`（通过）

## 修复执行记录（2026-04-10）

1. `2.1`：已完成
   - 变更文件：`packages/core-orchestration-service/src/local-orchestration-service-session-main-skill-registry.ts`
   - 验证：`pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-session-main-skill-registry.unit.test.ts`、`pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-catalog.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-skill-registry.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts apps/cli/test/runtime/session-slash-command-registry.test.ts apps/cli/test/runtime/session-shell-runner.test.ts`、`pnpm run build`
   - 说明：移除裸 verify 词命中，改为 verify action + readiness context 双条件，并补充 generic / explicit readiness 两侧回归测试。
2. `2.1`：已完成
   - 变更文件：`packages/core-orchestration-service/test/local-orchestration-service-session-main-skill-registry.unit.test.ts`
   - 验证：`pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-session-main-skill-registry.unit.test.ts`
   - 说明：新增“不劫持普通 validation ask”和“保留 readiness validation -> doctor”回归覆盖。

## 处置结果与剩余风险

1. `/doctor` 的 migrated verify fallback 已收窄，不再因为裸 `validate/验证/校验` 抢走普通请求。
2. mixed-language readiness ask（例如“验证 adapter 状态”）已保留在 `/doctor` 路径，避免回退到 capability explainer。
3. 当前 round 未发现新的 blocker；下一轮 fresh reviewer 仍需对 sprint-004 全边界做 clean recheck，作为 closeout 前最终确认。
