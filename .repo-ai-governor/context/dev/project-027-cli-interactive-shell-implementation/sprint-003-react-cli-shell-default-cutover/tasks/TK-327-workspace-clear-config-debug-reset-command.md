# TK-327 `workspace` clear-config 调试清理命令

- Status: completed
- Date: 2026-03-29
- Owner: AI-Agent
- Priority: P1
- Project: `project-027-cli-interactive-shell-implementation`
- Sprint: `sprint-003-react-cli-shell-default-cutover`

## 1. 任务目标

为真实仓库调试补齐一个可显式触发的工作区配置清理动作，避免 repo-local selector config 与 active workspace config 残留影响重复验收。

## 2. Depends On

1. `TK-309`
2. `TK-315`

## 3. 预期产物

1. `workspace --workspace-action clear-config` 命令动作
2. `pretty/json` 输出契约与 React shell 摘要更新
3. 定向测试与 i18n 校验通过

## 4. Required Inputs

1. `.repo-ai-governor/context/current-context.md`
2. `.repo-ai-governor/context/dev/project-027-cli-interactive-shell-implementation/plan.md`
3. `.repo-ai-governor/context/dev/project-027-cli-interactive-shell-implementation/sprint-003-react-cli-shell-default-cutover/plan.md`
4. `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
5. `apps/cli/src/commands/workspace-command.ts`
6. `apps/cli/test/commands/workspace-command.test.ts`
7. `apps/cli/test/cli-output-contract.integration.test.ts`

## 5. Traceback References

1. `.repo-ai-governor/draft/interactive-cli-react-style-technical-solution.md`
2. `.repo-ai-governor/context/dev/project-027-cli-interactive-shell-implementation/project-027-completion-audit-summary.md`

## 6. 实施计划

1. 扩展 `workspace` 命令动作枚举、runtime operation 与 React shell descriptor，使 `clear-config` 能被 Commander/React shell 正常发现。
2. 在 `workspace-command` 中实现当前配置清理逻辑，同时覆盖 repo-local selector config 与当前 active workspace config。
3. 补齐 i18n、JSON 输出契约与定向测试，确保该动作适合真实仓库重复调试。

## 7. Development Verification

1. `pnpm -s tsc -p tsconfig.json --noEmit`
2. `pnpm -s vitest run --config vitest.packages.config.ts apps/cli/test/commands/workspace-command.test.ts apps/cli/test/cli-output-contract.integration.test.ts`

## 8. Delivery Verification

1. `node ./scripts/governance/check-i18n-parity-fallback.js`
2. `node ./scripts/governance/check-task-ledger-sync.js`
3. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 9. 执行记录

1. 2026-03-29：任务创建，状态初始化为 `planned`。
2. 2026-03-29：根据真实仓库调试反馈，决定新增 `workspace --workspace-action clear-config`，用于一键清理当前 repo-local selector config 与 active workspace config，而不是删除整个 workspace 目录。
3. 2026-03-29：实现完成，`clear-config` 已接入 workspace action 解析、React shell 摘要、输出契约与中英文文案，并复用 repo-local config path 解析逻辑避免重复分支。
4. 2026-03-29：定向验证通过：`pnpm -s tsc -p tsconfig.json --noEmit`、`pnpm -s vitest run --config vitest.packages.config.ts apps/cli/test/commands/workspace-command.test.ts apps/cli/test/cli-output-contract.integration.test.ts`、`node ./scripts/governance/check-i18n-parity-fallback.js`。
5. 2026-03-29：治理台账校验通过：`node ./scripts/governance/check-task-ledger-sync.js`、`node ./scripts/governance/check-sprint-plan-status-sync.js`。

## 10. 产出

1. 已完成：`workspace --workspace-action clear-config`，用于清理当前 repo-local selector config 与 active workspace config。
2. 已完成：workspace React shell / pretty / json 输出对新动作的稳定呈现。
3. 已完成：定向类型、测试与 i18n 校验通过，可直接用于真实仓库调试回放。
