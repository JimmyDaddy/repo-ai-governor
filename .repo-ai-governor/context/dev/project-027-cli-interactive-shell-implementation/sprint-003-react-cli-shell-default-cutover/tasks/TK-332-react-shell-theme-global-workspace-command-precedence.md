# TK-332 React shell 主题全局/workspace/命令三层优先级

- Status: completed
- Date: 2026-03-30
- Owner: AI-Agent
- Priority: P1
- Project: `project-027-cli-interactive-shell-implementation`
- Sprint: `sprint-003-react-cli-shell-default-cutover`

## 1. 任务目标

为 React shell 主题解析建立稳定的三层优先级：命令 `--ui-theme` 强制覆盖 > workspace 持久化默认值 > 全局 CLI 默认值，并提供正式的全局配置入口。

## 2. Depends On

1. `TK-328`
2. `TK-330`
3. `TK-331`

## 3. 预期产物

1. 全局 CLI 主题偏好文件与加载服务
2. `workspace set-ui-theme <preset> --theme-scope global` 正式入口
3. React shell 主题三层优先级解析与回归测试
4. 对外帮助面与 adopter-facing 文档同步更新

## 4. Required Inputs

1. `.repo-ai-governor/context/current-context.md`
2. `.repo-ai-governor/context/dev/project-027-cli-interactive-shell-implementation/plan.md`
3. `.repo-ai-governor/context/dev/project-027-cli-interactive-shell-implementation/sprint-003-react-cli-shell-default-cutover/plan.md`
4. `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
5. `apps/cli/src/main.ts`
6. `apps/cli/src/commands/workspace-command.ts`
7. `apps/cli/test/commands/workspace-command.test.ts`
8. `apps/cli/test/cli-output-contract.integration.test.ts`
9. `README.md`
10. `docs/local-adoption-playbook.md`

## 5. Traceback References

1. `apps/cli/src/cli-governance-runtime.ts`
2. `packages/shared/src/i18n/locales/en-us.ts`
3. `packages/shared/src/i18n/locales/zh-cn.ts`

## 6. 实施计划

1. 为 CLI 新增轻量全局主题偏好文件，而不是扩张成第二份完整 governor config。
2. 扩展 `workspace set-ui-theme` 的 scope 概念，默认 workspace，显式支持 global。
3. 在运行时把主题解析固定为 `--ui-theme` > workspace config > global CLI preference。
4. 补齐帮助面、README / playbook 与回归测试，避免入口和行为再次漂移。

## 7. Development Verification

1. `pnpm -s tsc -p tsconfig.json --noEmit`
2. `pnpm -s vitest run --config vitest.packages.config.ts apps/cli/test/commands/workspace-command.test.ts apps/cli/test/cli-output-contract.integration.test.ts apps/cli/test/cli-skeleton.integration.test.ts`

## 8. Delivery Verification

1. `node ./scripts/governance/check-i18n-parity-fallback.js`
2. `node ./scripts/governance/check-task-ledger-sync.js`
3. `node ./scripts/governance/check-sprint-plan-status-sync.js`
4. `pnpm run build`

## 9. 执行记录

1. 2026-03-30：任务创建，状态初始化为 `planned`。
2. 2026-03-30：根据用户反馈，主题设置需要支持“全局默认值 + workspace 默认值 + 命令 `--ui-theme` 强制覆盖”三层优先级。
3. 2026-03-30：实现完成，新增 `GlobalCliThemePreferenceService`、`workspace set-ui-theme <preset> --theme-scope global` 入口、运行时三层优先级解析，以及 global scope 下不误建 workspace config 的保护。
4. 2026-03-30：帮助面、README / README.zh-CN / local adoption playbook 中英双语已同步更新，明确命令覆盖 > workspace 默认值 > 全局默认值。
5. 2026-03-30：定向与治理验证通过：`pnpm -s tsc -p tsconfig.json --noEmit`、`pnpm -s vitest run --config vitest.packages.config.ts apps/cli/test/commands/workspace-command.test.ts apps/cli/test/cli-output-contract.integration.test.ts apps/cli/test/cli-skeleton.integration.test.ts`、`node ./scripts/governance/check-i18n-parity-fallback.js`、`node ./scripts/governance/check-task-ledger-sync.js`、`node ./scripts/governance/check-sprint-plan-status-sync.js`、`pnpm run build`。

## 10. 产出

1. 已完成：全局 CLI 主题偏好文件 `~/.repo-ai-governor/cli-preferences.yaml` 与对应加载/写入服务。
2. 已完成：`workspace set-ui-theme <preset> --theme-scope global` 正式入口。
3. 已完成：React shell 主题三层优先级解析与回归测试。
4. 已完成：帮助面与 adopter-facing 文档同步更新。
