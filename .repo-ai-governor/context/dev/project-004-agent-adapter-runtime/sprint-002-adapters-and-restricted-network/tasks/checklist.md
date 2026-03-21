# checklist

- [ ] TK-036 首批 Adapters（Codex Copilot Claude Code）基线
  - 2026-03-21: 任务启动，状态切换为 `in_progress`，开始落地 `codex/github-copilot/claude-code` 首批 adapters 基线实现。
  - 2026-03-21: 完成三类 adapter 包骨架与 smoke 测试接线，`pnpm run typecheck` 与定向 `test:packages` 均通过。
  - 2026-03-21: 新增跨包集成测试覆盖 `AgentRouteRunner + 首批 adapters` 路由/降级链路，定向 `test:integration` 通过。
- [ ] TK-037 Restricted Network Mode 降级执行基线
- [ ] TK-038 integrations/ide 骨架与多入口命令包装基线
- [ ] TK-039 project-004 出口验收与 project-005 输入约束
