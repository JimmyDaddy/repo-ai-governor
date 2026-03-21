# checklist

- [x] TK-032 Role Registry 与 Role Profile 生命周期基线
  - 2026-03-21: 任务启动，状态切换为 `in_progress`，开始实现 role registry 契约、config roles 校验与 runtime 角色消费接线。
  - 2026-03-21: 完成 `packages/core-role-registry` 基线、`config roles` 校验与 `core-runtime` 角色解析接线，并补齐包级测试覆盖。
  - 2026-03-21: 通过 `pnpm run typecheck`、`pnpm run test:packages -- packages/config/test/config.unit.test.ts packages/core-role-registry/test/role-registry.unit.test.ts packages/core-runtime/test/process-runtime-engine.integration.test.ts --maxWorkers=1 --maxConcurrency=1`、`pnpm run check`，任务状态切换为 `completed`。
- [ ] TK-033 Agent 协议与 Capability Matrix 基线
- [ ] TK-034 Adapter SDK 与 routeKey 主备路由基线
- [ ] TK-035 sprint-001 出口验收与 sprint-002 输入约束
