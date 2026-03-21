# checklist

- [x] TK-056 跨包契约测试矩阵基线
  - 2026-03-22：任务创建，状态初始化为 `planned`。
  - 2026-03-22：任务启动，状态切换为 `in_progress`，开始建立 Stage 7 跨包契约测试矩阵、`test:contract` 执行入口与矩阵守卫测试。
  - 2026-03-22：完成 `DA-067` 基线矩阵清单与守卫测试落盘，并通过 `test:contract`、定向 `test:integration`、ledger/artifact 生命周期脚本与 `pnpm run check`，状态切换为 `completed`。
- [x] TK-057 分层测试（contract/integration/e2e）稳定基线
  - 2026-03-22：任务创建，状态初始化为 `planned`。
  - 2026-03-22：任务启动，状态切换为 `in_progress`，开始落地 contract/integration/e2e 分层入口与 Turbo 门禁接线。
  - 2026-03-22：完成 `DA-068` 分层基线、`test:e2e` 样例与 gate 链路更新，并通过 `test:contract`、`test:integration`、`test:e2e` 与 `pnpm run check`，状态切换为 `completed`。
- [x] TK-058 发布治理策略与 canary-rc-ga 通道基线
  - 2026-03-22：任务创建，状态初始化为 `planned`。
  - 2026-03-22：任务启动，状态切换为 `in_progress`，开始补齐 release governance policy、release scripts 与 GA 候选验证链路。
  - 2026-03-22：完成 `DA-069` 发布治理基线文档与脚本闭环，并通过 `release:check`、`release:ga-check`、`check` 与 ledger/artifact 治理脚本验证，状态切换为 `completed`。
- [x] TK-059 sprint-001 出口验收与 sprint-002 输入约束
  - 2026-03-22：任务创建，状态初始化为 `planned`。
  - 2026-03-22：任务启动，状态切换为 `in_progress`，开始汇总 TK-056/TK-057/TK-058 交付证据并整理 sprint-002 输入约束清单。
  - 2026-03-22：完成 `DA-070` 出口验收与 `DA-071` 输入约束清单，完成台账与 artifact 回链并通过治理脚本与门禁复核，状态切换为 `completed`。
