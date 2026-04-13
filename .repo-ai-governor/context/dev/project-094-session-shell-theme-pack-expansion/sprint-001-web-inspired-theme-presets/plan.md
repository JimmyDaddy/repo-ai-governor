# sprint-001-web-inspired-theme-presets 计划

- Status: completed
- Date: 2026-04-13
- Sprint Goal: 为 session shell 落地 3 个结合官方 palette 参考的新增主题预设，并完成 preset catalog 拆分、CLI/help/docs 真值同步与 closeout。
- Task Package: `TK-813`、`TK-814`
- Upstream:
  - `.repo-ai-governor/context/dev/project-094-session-shell-theme-pack-expansion/plan.md`
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/contracts/cli-session-shell-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/module-overview.md`

## 1. Sprint Deliverables

1. 共享主题枚举、独立 preset/factory 模块与 resolver-only registry 更新
2. selector / slash discoverability / CLI validation 对新增 preset 的完整接入
3. README / CLI README / formal session-shell docs 同步
4. 聚焦测试与 build 验证证据

## 2. 执行顺序

1. 盘点现有主题注册、help、selector 与 slash palette 的共享真值入口。
2. 选择新增 palette 方向并落地到 `react-cli-theme-presets.ts`、`react-cli-theme-factory.ts` 与 shared preset constants。
3. 同步更新 i18n、help、测试与用户文档。
4. 跑聚焦验证与 build，完成 closeout write-back。

## 3. 风险与约束

1. 现有 worktree 存在未提交的并行变更；本 sprint 只能在与主题扩展直接相关的文件上增量编辑。
2. 现有 `governor` 已覆盖偏 Nord 风格，新增预设必须避免和既有主题仅作轻微重复。
3. 主题扩展不能牺牲现有 session shell 可读性，也不能破坏 `set-ui-theme` 的 workspace/global 持久化语义。

## 4. 里程碑记录

1. 2026-04-13：sprint 创建并进入 active primary stream，范围锁定为 session shell 现有 theme system 的增量扩展。
2. 2026-04-13：完成 `tokyo-night / kanagawa / flexoki` 三组新增 preset，并将主题定义拆分为 `react-cli-theme-presets.ts` + `react-cli-theme-factory.ts`，`react-cli-theme-registry.ts` 仅保留 resolver 逻辑。
3. 2026-04-13：完成聚焦 vitest、`pnpm run build`、task ledger、completion audit、completed history 与 idle context 收口。
