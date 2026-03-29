# TK-331 `set-ui-theme` tool-managed selector 意外创建回归修复

- Status: completed
- Date: 2026-03-30
- Owner: AI-Agent
- Priority: P1
- Project: `project-027-cli-interactive-shell-implementation`
- Sprint: `sprint-003-react-cli-shell-default-cutover`

## 1. 任务目标

修复 `tool_managed` 模式下执行 `workspace set-ui-theme` 会错误在仓库内新建 `.repo-ai-governor/governor.yaml` 的回归。

## 2. Depends On

1. `TK-328`
2. `TK-330`

## 3. 预期产物

1. `set-ui-theme` 仅写 active workspace config 的持久化逻辑
2. repo-local selector 仅在原本已存在时才同步的安全策略
3. 覆盖 `tool_managed + 无 repo-local selector` 的回归测试

## 4. Required Inputs

1. `.repo-ai-governor/context/current-context.md`
2. `.repo-ai-governor/context/dev/project-027-cli-interactive-shell-implementation/plan.md`
3. `.repo-ai-governor/context/dev/project-027-cli-interactive-shell-implementation/sprint-003-react-cli-shell-default-cutover/plan.md`
4. `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
5. `apps/cli/src/commands/workspace-command.ts`
6. `apps/cli/test/commands/workspace-command.test.ts`
7. `apps/cli/test/cli-output-contract.integration.test.ts`

## 5. Traceback References

1. `apps/cli/src/main.ts`
2. `.repo-ai-governor/context/dev/project-027-cli-interactive-shell-implementation/project-027-completion-audit-summary.md`

## 6. 实施计划

1. 将 `set-ui-theme` 的持久化路径解析与 `clear-config` 拆开，避免复用“总是检查 repo-local + active config”带来的副作用。
2. 固化规则：始终写 active workspace config；repo-local selector 只有在原本已存在时才同步。
3. 增加 `tool_managed` 场景回归测试，防止再次错误创建仓库内 selector config。

## 7. Development Verification

1. `pnpm -s tsc -p tsconfig.json --noEmit`
2. `pnpm -s vitest run --config vitest.packages.config.ts apps/cli/test/commands/workspace-command.test.ts apps/cli/test/cli-output-contract.integration.test.ts apps/cli/test/cli-skeleton.integration.test.ts`

## 8. Delivery Verification

1. `node ./scripts/governance/check-i18n-parity-fallback.js`
2. `node ./scripts/governance/check-task-ledger-sync.js`
3. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 9. 执行记录

1. 2026-03-30：任务创建，状态初始化为 `planned`。
2. 2026-03-30：根据用户反馈确认，在工作区模式为 `tool_managed` 时执行 `workspace set-ui-theme calm --output pretty` 会错误在仓库内生成 `.repo-ai-governor/governor.yaml`。
3. 2026-03-30：实现完成，`set-ui-theme` 已改为只写 active workspace config；repo-local selector config 仅在原本已存在时才同步，不再主动新建。
4. 2026-03-30：定向与治理验证通过：`pnpm -s tsc -p tsconfig.json --noEmit`、`pnpm -s vitest run --config vitest.packages.config.ts apps/cli/test/commands/workspace-command.test.ts apps/cli/test/cli-output-contract.integration.test.ts apps/cli/test/cli-skeleton.integration.test.ts`、`node ./scripts/governance/check-i18n-parity-fallback.js`、`node ./scripts/governance/check-task-ledger-sync.js`、`node ./scripts/governance/check-sprint-plan-status-sync.js`。

## 10. 产出

1. 已完成：`set-ui-theme` 的持久化路径修复，不再在 `tool_managed` 场景下无端创建 repo-local selector config。
2. 已完成：repo-local selector 仅在已存在时才同步的安全策略。
3. 已完成：覆盖 `tool_managed + 无 repo-local selector` 的回归测试。
