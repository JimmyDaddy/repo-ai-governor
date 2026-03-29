# TK-328 `workspace` React shell 主题持久化入口

- Status: completed
- Date: 2026-03-30
- Owner: AI-Agent
- Priority: P1
- Project: `project-027-cli-interactive-shell-implementation`
- Sprint: `sprint-003-react-cli-shell-default-cutover`

## 1. 任务目标

为 React shell 默认主题补齐正式的工作区级配置入口，让用户无需在每次执行时重复传入 `--ui-theme`。

## 2. Depends On

1. `TK-315`
2. `TK-327`

## 3. 预期产物

1. `workspace --workspace-action set-ui-theme --ui-theme <preset>` 命令入口
2. `ui.react.theme` 配置 schema、默认值与 profile merge 支持
3. adopter-facing README / playbook 入口说明与定向验证证据

## 4. Required Inputs

1. `.repo-ai-governor/context/current-context.md`
2. `.repo-ai-governor/context/dev/project-027-cli-interactive-shell-implementation/plan.md`
3. `.repo-ai-governor/context/dev/project-027-cli-interactive-shell-implementation/sprint-003-react-cli-shell-default-cutover/plan.md`
4. `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
5. `apps/cli/src/commands/workspace-command.ts`
6. `apps/cli/src/main.ts`
7. `packages/config/src/schema-validator.ts`
8. `packages/config/src/profile-resolver.ts`
9. `README.md`
10. `docs/local-adoption-playbook.md`

## 5. Traceback References

1. `.repo-ai-governor/draft/interactive-cli-react-style-technical-solution.md`
2. `.repo-ai-governor/context/dev/project-027-cli-interactive-shell-implementation/project-027-completion-audit-summary.md`

## 6. 实施计划

1. 统一 React shell 主题预设常量，让 CLI runtime、config schema 与测试共享同一事实来源。
2. 在 `workspace` 命令中新增显式持久化入口，把默认主题写回当前活动工作区配置，并在 repo-local selector config 存在时同步。
3. 更新 adopter-facing 文档，明确 `ui.react.theme` 是默认值、`set-ui-theme` 是正式入口、`--ui-theme` 只是一次性 override。

## 7. Development Verification

1. `pnpm -s tsc -p tsconfig.json --noEmit`
2. `pnpm -s vitest run --config vitest.packages.config.ts packages/config/test/config.unit.test.ts packages/config/test/upgrade-schema-diff-service.contract.test.ts`
3. `pnpm -s vitest run --config vitest.packages.config.ts apps/cli/test/commands/workspace-command.test.ts apps/cli/test/commands/connect-command.test.ts apps/cli/test/commands/workflow-command.test.ts apps/cli/test/commands/init-command.test.ts apps/cli/test/commands/review-verify-command.test.ts apps/cli/test/cli-output-contract.integration.test.ts apps/cli/test/cli-governance-runtime.integration.test.ts`

## 8. Delivery Verification

1. `node ./scripts/governance/check-i18n-parity-fallback.js`
2. `node ./scripts/governance/check-task-ledger-sync.js`
3. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 9. 执行记录

1. 2026-03-30：任务创建，状态初始化为 `planned`。
2. 2026-03-30：根据用户“主题应可配置且要有正式入口”的反馈，决定新增 `workspace --workspace-action set-ui-theme`，而不是继续把 `--ui-theme` 当作唯一入口。
3. 2026-03-30：实现完成，shared theme 常量、config schema/profile merge、默认 `governor.yaml`、workspace action/runtime/i18n/JSON 输出契约与定向测试已同步收口。
4. 2026-03-30：README / README.zh-CN / local adoption playbook 中英双语已补齐入口说明，明确 `set-ui-theme` 负责持久化默认值，`--ui-theme` 仅作为单次命令 override。
5. 2026-03-30：定向与治理验证通过：`pnpm -s tsc -p tsconfig.json --noEmit`、两组 vitest、`node ./scripts/governance/check-i18n-parity-fallback.js`、`node ./scripts/governance/check-task-ledger-sync.js`、`node ./scripts/governance/check-sprint-plan-status-sync.js`。

## 10. 产出

1. 已完成：`workspace --workspace-action set-ui-theme --ui-theme <preset>`，用于持久化 React shell 默认主题。
2. 已完成：`ui.react.theme` 配置路径、默认值与 profile merge 支持，可作为工作区级主题事实来源。
3. 已完成：README / playbook 入口说明更新，用户可区分“持久化默认值”和“单次命令 override”两种主题切换方式。
