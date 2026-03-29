# TK-329 `workspace --help` 帮助面可发现性修复

- Status: completed
- Date: 2026-03-30
- Owner: AI-Agent
- Priority: P1
- Project: `project-027-cli-interactive-shell-implementation`
- Sprint: `sprint-003-react-cli-shell-default-cutover`

## 1. 任务目标

修复 `workspace --help` 只显示空壳描述的问题，让用户能直接从帮助面看到可用参数、动作语义与可复制示例。

## 2. Depends On

1. `TK-327`
2. `TK-328`

## 3. 预期产物

1. `workspace` 子命令自身可见的帮助选项列表
2. 动作说明与示例命令帮助附录
3. 定向帮助输出回归测试

## 4. Required Inputs

1. `.repo-ai-governor/context/current-context.md`
2. `.repo-ai-governor/context/dev/project-027-cli-interactive-shell-implementation/plan.md`
3. `.repo-ai-governor/context/dev/project-027-cli-interactive-shell-implementation/sprint-003-react-cli-shell-default-cutover/plan.md`
4. `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
5. `apps/cli/src/main.ts`
6. `packages/shared/src/i18n/locales/en-us.ts`
7. `packages/shared/src/i18n/locales/zh-cn.ts`
8. `apps/cli/test/cli-output-contract.integration.test.ts`

## 5. Traceback References

1. `apps/cli/src/commands/workspace-command.ts`
2. `.repo-ai-governor/context/dev/project-027-cli-interactive-shell-implementation/project-027-completion-audit-summary.md`

## 6. 实施计划

1. 将 `workspace` 从通用的“只有描述无专属参数”的 Commander 注册路径中拆出来，补齐子命令级帮助选项。
2. 在帮助页中补充 `dry-run/execute/rollback/clear-config/set-ui-theme` 的动作说明与可复制示例。
3. 增加定向测试，锁定 `workspace --help` 必须输出关键选项与示例。

## 7. Development Verification

1. `pnpm -s tsc -p tsconfig.json --noEmit`
2. `pnpm -s vitest run --config vitest.packages.config.ts apps/cli/test/cli-output-contract.integration.test.ts`

## 8. Delivery Verification

1. `node ./scripts/governance/check-i18n-parity-fallback.js`
2. `node ./scripts/governance/check-task-ledger-sync.js`
3. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 9. 执行记录

1. 2026-03-30：任务创建，状态初始化为 `planned`。
2. 2026-03-30：根据真实用户反馈确认 `workspace --help` 只显示描述和 `-h`，缺少关键参数、动作说明与示例，帮助面不可用。
3. 2026-03-30：实现完成，`workspace` 已改为单独注册 Commander 帮助选项，并新增动作说明与示例附录；中英文文案同步更新。
4. 2026-03-30：定向验证通过：`pnpm -s tsc -p tsconfig.json --noEmit`、`pnpm -s vitest run --config vitest.packages.config.ts apps/cli/test/cli-output-contract.integration.test.ts`、`node ./scripts/governance/check-i18n-parity-fallback.js`、`node ./scripts/governance/check-task-ledger-sync.js`、`node ./scripts/governance/check-sprint-plan-status-sync.js`。

## 10. 产出

1. 已完成：`workspace --help` 现在会显示 `--workspace-action/--workspace-mode/--workspace-root/--workspace-plan/--output/--ui/--ui-theme`。
2. 已完成：帮助页附带动作说明和可复制示例，能直接指导 `clear-config`、`set-ui-theme`、迁移与回滚的正确用法。
3. 已完成：帮助输出回归测试，避免再次退回成只剩空壳说明。
