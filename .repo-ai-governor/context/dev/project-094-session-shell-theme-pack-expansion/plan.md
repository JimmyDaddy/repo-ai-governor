# project-094-session-shell-theme-pack-expansion 计划

- Status: completed
- Date: 2026-04-13
- Stage Mapping: session shell theme preset expansion
- Phase Mapping: web-inspired palette research + preset implementation + CLI/docs synchronization
- Upstream:
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/contracts/cli-session-shell-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/module-overview.md`

## 1. 目标

1. 为 session shell 新增多组风格差异明确、可读性可控的主题预设，避免当前只有 `governor / catppuccin / calm` 三个选择。
2. 结合官方 palette 一手资料选择新增主题方向，并把这些预设接入共享枚举、独立的 theme preset/factory 模块、CLI help、slash discoverability 与 selector。
3. 在同一窗口内完成代码、i18n、文档、测试与 closeout 同步，保持当前 worktree 的治理面一致。

## 2. Sprint 细化

## 2.1 sprint-001-web-inspired-theme-presets

- Status: completed
- Sprint Goal: 落地 3 个新增 session shell 主题预设，并完成 preset catalog 拆分、help/i18n/docs 同步与验证证据收口。
- Task Package: `TK-813`、`TK-814`。

## 3. 任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | status |
| --- | --- | --- | --- | --- | --- |
| TK-813 | sprint-001 | expand session-shell theme presets with web-inspired palettes | cli/theme/i18n/docs/tests | project-083、project-084 theme baseline | completed |
| TK-814 | sprint-001 | finalize project-094 closeout after theme pack expansion | closeout/final-audit | TK-813 | completed |

## 4. 依赖产物策略

1. 本项目只扩展既有 theme preset 体系，不引入新的配置层、主题下载机制或宿主级字体/背景控制。
2. palette 来源以官方/一手主题资料为参考，但最终 token 仍需按当前 session shell 的可读性与 Ink 组件语义落地，不机械搬运整套编辑器主题。
3. 文档同步只覆盖用户可见的 preset 真值、discoverability 与 formal contract，不扩张到新的 runtime capability family。

## 5. DoD（project-094）

1. session shell、selector、`set-ui-theme` 和 `/workspace set-ui-theme` 已支持 3 个新增预设。
2. CLI help、i18n、README/CLI README 与 formal session-shell docs 已同步到新的 preset 真值。
3. 相关聚焦测试与 `pnpm run build` 已通过，task ledger / checklist / tasks.csv / current-context 同步完成。

## 6. 里程碑记录

1. 2026-04-13：基于“结合互联网，为会话壳层新增几个主题”的请求创建 `project-094`。
2. 2026-04-13：范围冻结为既有 session shell theme system 的增量扩展，不引入新的 shell capability、宿主级主题集成或字体控制。
3. 2026-04-13：`TK-813` 已完成 `tokyo-night / kanagawa / flexoki` 三组新增 preset，并将主题定义从 `react-cli-theme-registry.ts` 抽离到 `react-cli-theme-presets.ts` 与 `react-cli-theme-factory.ts`。
4. 2026-04-13：`TK-814` 已完成 closeout，并在此里程碑回链 [project-094 completion audit summary](./project-094-session-shell-theme-pack-expansion-completion-audit-summary.md)。
