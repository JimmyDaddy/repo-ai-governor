# TK-333 顶层 `set-ui-theme` 快捷入口默认全局语义

- Status: completed
- Date: 2026-03-30
- Owner: AI-Agent
- Priority: P1
- Project: `project-027-cli-interactive-shell-implementation`
- Sprint: `sprint-003-react-cli-shell-default-cutover`

## 1. 任务目标

将顶层快捷入口 `set-ui-theme <preset>` 收敛为“默认设置全局 CLI 主题”的正式语义，避免用户继续显式书写 `--theme-scope global`。

## 2. Depends On

1. `TK-330`
2. `TK-332`

## 3. 预期产物

1. 顶层 `set-ui-theme <preset>` 正式命令入口
2. 顶层入口默认 global scope 的解析规则
3. `workspace set-ui-theme` 继续默认 workspace 的兼容语义
4. help / docs / tests 同步更新

## 4. Required Inputs

1. `.repo-ai-governor/context/current-context.md`
2. `.repo-ai-governor/context/dev/project-027-cli-interactive-shell-implementation/plan.md`
3. `.repo-ai-governor/context/dev/project-027-cli-interactive-shell-implementation/sprint-003-react-cli-shell-default-cutover/plan.md`
4. `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
5. `apps/cli/src/main.ts`
6. `packages/shared/src/i18n/locales/en-us.ts`
7. `packages/shared/src/i18n/locales/zh-cn.ts`
8. `apps/cli/test/cli-output-contract.integration.test.ts`
9. `apps/cli/test/cli-skeleton.integration.test.ts`

## 5. Traceback References

1. `README.md`
2. `README.zh-CN.md`
3. `docs/local-adoption-playbook.md`
4. `docs/local-adoption-playbook.zh-CN.md`

## 6. 实施计划

1. 新增顶层 `set-ui-theme` 命令，但复用既有 workspace 主题持久化实现，避免重复维护两套逻辑。
2. 将顶层快捷入口默认 scope 收敛为 global，同时保留 `--theme-scope workspace` 作为显式覆盖。
3. 保持 `workspace set-ui-theme` 的 workspace 默认语义不变，避免破坏已有脚本和认知。
4. 同步更新 help、README、playbook 与定向测试。

## 7. Development Verification

1. `pnpm -s tsc -p tsconfig.json --noEmit`
2. `pnpm -s vitest run --config vitest.packages.config.ts apps/cli/test/cli-output-contract.integration.test.ts apps/cli/test/cli-skeleton.integration.test.ts apps/cli/test/commands/workspace-command.test.ts`

## 8. Delivery Verification

1. `node ./scripts/governance/check-i18n-parity-fallback.js`
2. `node ./scripts/governance/check-task-ledger-sync.js`
3. `node ./scripts/governance/check-sprint-plan-status-sync.js`
4. `pnpm run build`

## 9. 执行记录

1. 2026-03-30：任务创建，状态初始化为 `planned`。
2. 2026-03-30：根据用户反馈，`pnpm exec repo-ai-governor set-ui-theme calm` 应默认设置全局主题，而不是继续要求额外传 `--theme-scope global`。
3. 2026-03-30：实现完成，顶层 `set-ui-theme <preset>` 已默认落到 global；若确实要让该快捷入口只改当前 workspace，可显式传 `--theme-scope workspace`。
4. 2026-03-30：help、README / README.zh-CN、local adoption playbook 与输出契约测试已同步更新为“顶层默认 global”的语义。

## 10. 产出

1. 已完成：顶层 `set-ui-theme <preset>` 正式命令入口。
2. 已完成：顶层入口默认 global scope 的解析规则。
3. 已完成：`workspace set-ui-theme` 保持 workspace 默认语义不变。
4. 已完成：help / docs / tests 同步收口。
