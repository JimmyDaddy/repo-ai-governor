# checklist

- [x] TK-036 首批 Adapters（Codex Copilot Claude Code）基线
  - 2026-03-21: 任务启动，状态切换为 `in_progress`，开始落地 `codex/github-copilot/claude-code` 首批 adapters 基线实现。
  - 2026-03-21: 完成三类 adapter 包骨架与 smoke 测试接线，`pnpm run typecheck` 与定向 `test:packages` 均通过。
  - 2026-03-21: 新增跨包集成测试覆盖 `AgentRouteRunner + 首批 adapters` 路由/降级链路，定向 `test:integration` 通过。
  - 2026-03-21: 完成复核修复并收尾交付，任务状态切换为 `completed`，台账与产物注册待同步至 sprint-002 最新记录。
- [x] TK-037 Restricted Network Mode 降级执行基线
  - 2026-03-21: 任务启动，状态切换为 `in_progress`，进入受限网络降级语义与本地 fallback 可运行基线实现。
  - 2026-03-21: 完成 restricted network 模式的路由阻断与本地 fallback 实现，`test:packages` 与定向 `test:integration` 通过，任务状态切换为 `completed`。
- [x] TK-038 integrations/ide 骨架与多入口命令包装基线
  - 2026-03-21: 任务启动，状态切换为 `in_progress`，开始落地 IDE 命令包装器、规范注入契约与 integrations/ide 骨架目录。
  - 2026-03-21: 完成 IDE wrapper 代码与集成骨架契约文档，`pnpm run typecheck`、定向 `test:packages` 与 `test:integration` 通过，任务状态切换为 `completed`。
- [ ] TK-039 project-004 出口验收与 project-005 输入约束
