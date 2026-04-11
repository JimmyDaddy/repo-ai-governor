# TK-763 add actionable session-shell recovery guidance for structured connect errors

- Status: completed
- Date: 2026-04-11
- Owner: `AI-Agent`
- Priority: `P1`
- Project: `project-081-session-shell-actionable-error-guidance`
- Sprint: `sprint-001-connect-config-recovery-guidance`

## 1. 任务目标

修复 session shell 在 nested governed command 错误场景下的 presenter 退化问题：即使 stdout 出现重复 JSON 行，也要恢复结构化错误，并把 `connect` 缺少 adapters baseline 的场景转换成用户可执行的恢复提示。

## 2. Depends On

1. `apps/cli/src/runtime/interactive-shell/session-shell-entrypoint-runtime.ts`
2. `packages/shared/src/i18n/locales/en-us.ts`
3. `packages/shared/src/i18n/locales/zh-cn.ts`

## 3. 预期产物

1. session shell 的结构化错误恢复与 next_action 人类化逻辑
2. `connect` 缺 adapters baseline 的恢复建议文案
3. 覆盖该行为的回归测试与相关规范/用户文档同步

## 4. Required Inputs

1. `.repo-ai-governor/context/current-context.md`
2. `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
3. `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
4. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/contracts/cli-session-shell-contract.md`
5. `docs/local-adoption-playbook.zh-CN.md`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-081-session-shell-actionable-error-guidance/plan.md`
2. `.repo-ai-governor/context/dev/project-081-session-shell-actionable-error-guidance/sprint-001-connect-config-recovery-guidance/plan.md`
3. `apps/cli/src/runtime/agent-onboarding-runtime.ts`

## 6. 实施计划

1. 先修 session shell 对 nested CLI stdout 的结构化错误恢复，确保重复 JSON 行不再退化成原样回显。
2. 将 machine `next_action` 翻译成用户可读步骤，并为 `connect requires adapters baseline` 提供 `/init` / `/workspace clear-config` 恢复建议。
3. 同步 i18n、entrypoint 测试、shell contract/module docs 与 adoption playbook。

## 7. Development Verification

1. `pnpm exec vitest run apps/cli/test/runtime/session-shell-entrypoint-runtime.test.ts --maxWorkers=1 --maxConcurrency=1`
2. `node ./scripts/governance/check-i18n-parity-fallback.js`

## 8. Delivery Verification

1. `pnpm exec vitest run apps/cli/test/runtime/session-shell-entrypoint-runtime.test.ts --maxWorkers=1 --maxConcurrency=1`
2. `node ./scripts/governance/check-i18n-parity-fallback.js`
3. `pnpm run build`
4. `node ./scripts/governance/sync-task-ledger.js --task-id TK-763 --tasks-dir ".repo-ai-governor/context/dev/project-081-session-shell-actionable-error-guidance/sprint-001-connect-config-recovery-guidance/tasks"`
5. `node ./scripts/governance/check-task-ledger-sync.js`
6. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 9. 执行记录

1. 2026-04-11：任务创建并直接进入 `in_progress`，范围锁定为“结构化错误恢复 + connect 缺 adapters baseline 的可执行恢复提示”。
2. 2026-04-11：已确认症状由两层叠加造成：session shell 只会整段 `JSON.parse(stdout)`，重复 JSON 行会导致退回原样回显；同时 `next_action` 仍以 machine enum 直接展示。
3. 2026-04-11：已为 nested CLI 错误输出补齐“整段 JSON -> 逐行 JSON fallback”恢复逻辑，把 `inspect_governor_config` 等 next_action 翻译成用户可读提示，并为 `connect requires adapters baseline in source config` 增加 `/init` 与 `/workspace clear-config` 恢复建议。
4. 2026-04-11：已同步 session shell i18n、entrypoint runtime 回归测试、shell contract/module overview 与 adoption playbook，并通过 targeted vitest、i18n parity 与 `pnpm run build`；当前任务状态切换为 `completed`。

## 10. 产出

1. `apps/cli/src/runtime/interactive-shell/session-shell-entrypoint-runtime.ts`
2. `packages/shared/src/i18n/locales/en-us.ts`
3. `packages/shared/src/i18n/locales/zh-cn.ts`
4. `apps/cli/test/runtime/session-shell-entrypoint-runtime.test.ts`
5. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/contracts/cli-session-shell-contract.md`
6. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/module-overview.md`
7. `docs/local-adoption-playbook.md`
8. `docs/local-adoption-playbook.zh-CN.md`
