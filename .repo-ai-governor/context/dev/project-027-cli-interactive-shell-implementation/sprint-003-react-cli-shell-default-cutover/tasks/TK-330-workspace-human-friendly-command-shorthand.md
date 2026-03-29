# TK-330 `workspace <action> [value]` 人类友好短写入口

- Status: completed
- Date: 2026-03-30
- Owner: AI-Agent
- Priority: P1
- Project: `project-027-cli-interactive-shell-implementation`
- Sprint: `sprint-003-react-cli-shell-default-cutover`

## 1. 任务目标

为 `workspace` 命令补齐更短的人类友好短写入口，减少 `--workspace-action` 带来的重复输入，同时保持脚本兼容。

## 2. Depends On

1. `TK-327`
2. `TK-328`
3. `TK-329`

## 3. 预期产物

1. `workspace <action> [value]` 位置参数短写入口
2. `clear-config` / `set-ui-theme calm` / `rollback <plan-path>` 等常用短写能力
3. 对外文档、帮助面与回归测试同步更新

## 4. Required Inputs

1. `.repo-ai-governor/context/current-context.md`
2. `.repo-ai-governor/context/dev/project-027-cli-interactive-shell-implementation/plan.md`
3. `.repo-ai-governor/context/dev/project-027-cli-interactive-shell-implementation/sprint-003-react-cli-shell-default-cutover/plan.md`
4. `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
5. `apps/cli/src/main.ts`
6. `apps/cli/src/types/interfaces/cli-workspace-command.interface.ts`
7. `apps/cli/test/cli-output-contract.integration.test.ts`
8. `apps/cli/test/cli-skeleton.integration.test.ts`
9. `README.md`
10. `docs/local-adoption-playbook.md`

## 5. Traceback References

1. `apps/cli/src/commands/workspace-command.ts`
2. `.repo-ai-governor/context/dev/project-027-cli-interactive-shell-implementation/project-027-completion-audit-summary.md`

## 6. 实施计划

1. 在保留 `--workspace-action` 兼容语法的前提下，为 `workspace` 新增位置参数短写解析。
2. 覆盖高频用户路径：`workspace clear-config`、`workspace set-ui-theme calm`、`workspace rollback <plan-path>`。
3. 同步更新 help surface、README / playbook 示例与定向测试，确保短写成为默认推荐写法。

## 7. Development Verification

1. `pnpm -s tsc -p tsconfig.json --noEmit`
2. `pnpm -s vitest run --config vitest.packages.config.ts apps/cli/test/cli-output-contract.integration.test.ts apps/cli/test/cli-skeleton.integration.test.ts`

## 8. Delivery Verification

1. `node ./scripts/governance/check-i18n-parity-fallback.js`
2. `node ./scripts/governance/check-task-ledger-sync.js`
3. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 9. 执行记录

1. 2026-03-30：任务创建，状态初始化为 `planned`。
2. 2026-03-30：根据用户“workspace 命令执行太繁琐”的反馈，决定新增 `workspace <action> [value]` 位置参数短写，而不是强制用户继续书写 `--workspace-action`。
3. 2026-03-30：实现完成，`workspace clear-config`、`workspace set-ui-theme calm`、`workspace rollback <plan-path>` 已可直接执行；旧的 `--workspace-action` / `--workspace-plan` / `--ui-theme` 语法继续兼容脚本。
4. 2026-03-30：README / README.zh-CN / local adoption playbook / help surface 已同步切换为短写示例，并明确旧长写法仍兼容。
5. 2026-03-30：定向与治理验证通过：`pnpm -s tsc -p tsconfig.json --noEmit`、`pnpm -s vitest run --config vitest.packages.config.ts apps/cli/test/cli-output-contract.integration.test.ts apps/cli/test/cli-skeleton.integration.test.ts`、`node ./scripts/governance/check-i18n-parity-fallback.js`、`node ./scripts/governance/check-task-ledger-sync.js`、`node ./scripts/governance/check-sprint-plan-status-sync.js`。

## 10. 产出

1. 已完成：`workspace <action> [value]` 短写入口，可直接替代大部分人工执行场景中的 `--workspace-action`。
2. 已完成：高频路径 `clear-config`、`set-ui-theme calm`、`rollback <plan-path>` 的短写能力。
3. 已完成：对外文档、帮助面与测试同步收口，短写已成为默认推荐写法，旧长写法仍保留兼容。
