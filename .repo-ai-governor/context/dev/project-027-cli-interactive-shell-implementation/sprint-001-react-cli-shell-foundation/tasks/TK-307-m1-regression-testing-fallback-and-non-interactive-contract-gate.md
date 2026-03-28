# TK-307 M1 回归测试、fallback 与 non-interactive contract gate

- Status: completed
- Date: 2026-03-28
- Owner: AI-Agent
- Priority: P0
- Project: `project-027-cli-interactive-shell-implementation`
- Sprint: `sprint-001-react-cli-shell-foundation`

## 1. 任务目标

为 M1 基线补齐测试和门禁，确保 shell foundation 不破坏现有 automation contract。

## 2. Depends On

1. `TK-305`
2. `TK-306`

## 3. 预期产物

1. 单元测试基线
2. 组件/集成测试基线
3. non-interactive / fallback gate

## 4. Required Inputs

1. `.repo-ai-governor/context/dev/project-027-cli-interactive-shell-implementation/sprint-001-react-cli-shell-foundation/tasks/TK-305-shell-runner-ui-mode-resolver-and-stderr-sigint-baseline.md`
2. `.repo-ai-governor/context/dev/project-027-cli-interactive-shell-implementation/sprint-001-react-cli-shell-foundation/tasks/TK-306-init-react-shell-minimal-wizard-and-descriptor-state-baseline.md`
3. `apps/cli/test/runtime/interactive-shell-ui-mode-resolver.test.ts`
4. `apps/cli/test/runtime/init-react-shell-runner.test.ts`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-027-cli-interactive-shell-implementation/plan.md`
2. `.repo-ai-governor/context/dev/project-027-cli-interactive-shell-implementation/sprint-001-react-cli-shell-foundation/plan.md`

## 6. 实施计划

1. 为 `ui_mode` resolver 与 `init` shell runner 补齐单测与失败路径覆盖。
2. 在集成测试中锁定 `--ui react`、`--no-interactive`、非法 `--ui` 与 machine output contract。
3. 将 SIGINT、restart-loop 与 fallback 语义升级为显式门禁要求。

## 7. Development Verification

1. `pnpm -s tsc -p tsconfig.json --noEmit`
2. `pnpm vitest run --config vitest.packages.config.ts apps/cli/test/runtime/interactive-shell-ui-mode-resolver.test.ts apps/cli/test/runtime/init-react-shell-runner.test.ts apps/cli/test/cli-output-contract.integration.test.ts`

## 8. Delivery Verification

1. `node ./scripts/governance/check-standardized-error-usage.js`
2. `--no-interactive`、machine output 与 fallback contract 在集成测试中保持稳定，不允许静默退化。

## 9. 执行记录

1. 2026-03-28：任务创建，状态切换为 `in_progress`，开始补齐回归测试与门禁。
2. 2026-03-28：新增 `apps/cli/test/runtime/interactive-shell-ui-mode-resolver.test.ts`，覆盖 default classic、explicit react、`no-interactive`、`plain/json`、非 TTY 与 `tui -> classic` fallback。
3. 2026-03-28：新增 `apps/cli/test/runtime/init-react-shell-runner.test.ts`，覆盖 descriptor/state 驱动的字段收集、validation feedback、confirmation 与 stderr unmount 边界。
4. 2026-03-28：扩展 `apps/cli/test/cli-output-contract.integration.test.ts`，验证 `--ui react` + `--no-interactive` fallback 以及非法 `--ui` 在 JSON 模式下仍保持稳定错误契约。
5. 2026-03-28：根据更严格的 CR 标准，追加 confirmation reject 后 restart-loop 测试，并把 SIGINT / teardown 双保险路径提升为需显式注释说明的 lifecycle-sensitive 实现。

## 10. 产出

1. `apps/cli/test/runtime/interactive-shell-ui-mode-resolver.test.ts`
2. `apps/cli/test/runtime/init-react-shell-runner.test.ts`
3. `apps/cli/test/cli-output-contract.integration.test.ts`
