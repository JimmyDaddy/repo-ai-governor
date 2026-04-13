# TK-813 expand session-shell theme presets with web-inspired palettes

- Status: completed
- Date: 2026-04-13
- Owner: `AI-Agent`
- Priority: `P1`
- Project: `project-094-session-shell-theme-pack-expansion`
- Sprint: `sprint-001-web-inspired-theme-presets`

## 1. 任务目标

为既有 session shell theme system 新增一组来自官方 palette 参考的主题预设，并把这些预设接入共享枚举、CLI 校验、selector、slash discoverability、help 文本与对应测试。

## 2. Depends On

1. `.repo-ai-governor/context/dev/project-083-session-shell-theme-choice-and-readability-followup/plan.md`
2. `.repo-ai-governor/context/dev/project-084-session-shell-theme-apply-followup/plan.md`
3. `.repo-ai-governor/normative_knowledge_sources/governance/task-card-template.md`

## 3. 预期产物

1. 新增的 session shell theme preset definitions
2. 对应的 CLI/i18n/help/discoverability 更新
3. 主题相关聚焦测试与文档同步

## 4. Required Inputs

1. `.repo-ai-governor/context/current-context.md`
2. `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
3. `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
4. `packages/shared/src/constants/react-cli-theme.constant.ts`
5. `apps/cli/src/react-cli/theme/react-cli-theme-registry.ts`
6. `apps/cli/src/react-cli/theme/react-cli-theme-presets.ts`
7. `apps/cli/src/react-cli/theme/react-cli-theme-factory.ts`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-083-session-shell-theme-choice-and-readability-followup/project-083-session-shell-theme-choice-and-readability-followup-completion-audit-summary.md`
2. `.repo-ai-governor/context/dev/project-084-session-shell-theme-apply-followup/project-084-session-shell-theme-apply-followup-completion-audit-summary.md`
3. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/contracts/cli-session-shell-contract.md`
4. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/module-overview.md`

## 6. 实施计划

1. 扩展共享 theme preset 枚举，并把 palette 定义抽离到独立的 theme preset/factory 模块中，新增 3 个风格明确的 palette。
2. 同步更新 CLI validation、selector、slash palette、help appendix 与 i18n 文案，确保新增 preset 在所有入口一致可见。
3. 更新 README / CLI README 与 formal session-shell docs，补齐用户可见真值。
4. 运行聚焦测试与 `pnpm run build`，再同步 task ledger。

## 7. Development Verification

1. `pnpm exec vitest run apps/cli/test/runtime/react-cli-theme-registry.test.ts apps/cli/test/runtime/session-slash-command-registry.test.ts apps/cli/test/runtime/session-shell-ink-controller.test.ts apps/cli/test/commands/workspace-command.test.ts apps/cli/test/cli-output-contract.integration.test.ts apps/cli/test/runtime/session-shell-live-app.test.ts --maxWorkers=1 --maxConcurrency=1`

## 8. Delivery Verification

1. `pnpm exec vitest run apps/cli/test/runtime/react-cli-theme-registry.test.ts apps/cli/test/runtime/session-slash-command-registry.test.ts apps/cli/test/runtime/session-shell-ink-controller.test.ts apps/cli/test/commands/workspace-command.test.ts apps/cli/test/cli-output-contract.integration.test.ts apps/cli/test/runtime/session-shell-live-app.test.ts --maxWorkers=1 --maxConcurrency=1`
2. `pnpm run build`
3. `node ./scripts/governance/sync-task-ledger.js --task-id TK-813 --tasks-dir ".repo-ai-governor/context/dev/project-094-session-shell-theme-pack-expansion/sprint-001-web-inspired-theme-presets/tasks"`
4. `node ./scripts/governance/check-task-ledger-sync.js`
5. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 9. 执行记录

1. 2026-04-13：任务创建并直接进入 `in_progress`，范围锁定为 session shell 现有 theme preset system 的增量扩展。
2. 2026-04-13：已确认当前公开真值仍只有 `governor / catppuccin / calm`，需要同步更新 shared preset enum、theme registry、selector、slash discoverability、help 文本与 docs。
3. 2026-04-13：参考 Tokyo Night、Kanagawa 与 Flexoki 官方 palette 资料，确定新增 `tokyo-night`、`kanagawa`、`flexoki` 三组差异化 preset，并明确不重复引入与既有 `governor` 近似的 Nord 风格。
4. 2026-04-13：已将具体主题定义从 `react-cli-theme-registry.ts` 抽离到 `react-cli-theme-presets.ts` 与 `react-cli-theme-factory.ts`，使 registry 仅负责 preset resolution。
5. 2026-04-13：已同步 shared constants、CLI validation、i18n、README/CLI README、formal session-shell docs 与 slash discoverability。
6. 2026-04-13：已执行 6-file vitest 回归集与 `pnpm run build`，验证通过。

## 10. 产出

1. 已完成：新增 `tokyo-night`、`kanagawa`、`flexoki` preset，并落地 `react-cli-theme-presets.ts` / `react-cli-theme-factory.ts` / resolver-only `react-cli-theme-registry.ts`
2. 已完成：CLI/i18n/help/discoverability 真值同步，覆盖 constants、selector、slash palette、README 与 formal contract 文档
3. 已完成：主题相关聚焦测试与 `pnpm run build` 验证
