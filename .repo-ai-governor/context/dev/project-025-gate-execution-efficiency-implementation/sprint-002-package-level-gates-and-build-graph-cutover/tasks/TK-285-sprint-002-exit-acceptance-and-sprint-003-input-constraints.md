# TK-285 sprint-002 出口验收与 sprint-003 输入约束

- Status: completed
- Date: 2026-03-28
- Owner: AI-Agent
- Priority: P1
- Project: `project-025-gate-execution-efficiency-implementation`
- Sprint: `sprint-002-package-level-gates-and-build-graph-cutover`

## 1. 任务目标

完成 sprint-002 出口验收，并冻结 sprint-003 的 TS project references、affected planner 与 CI matrix 输入约束。

## 2. Depends On

1. `TK-283`
2. `TK-284`

## 3. 预期产物

1. sprint-002 验收记录。
2. sprint-003 输入约束清单。
3. 与 project plan 对齐的后续执行边界。

## 4. 实施计划

1. 校验 sprint-002 exit criteria。
2. 整理 sprint-003 需要继承的技术与执行约束。
3. 同步 project / sprint ledger 与 plan 状态。

## 5. 待验证

```bash
node ./scripts/governance/check-task-ledger-sync.js
node ./scripts/governance/check-sprint-plan-status-sync.js
```

## 6. 执行记录

1. 2026-03-27：任务创建，状态初始化为 `planned`。
2. 2026-03-28：状态切换为 `in_progress`，开始基于 `TK-283/TK-284` 的完成态整理 sprint-002 exit criteria，并冻结 sprint-003 的 TS project references、affected planner 与 CI matrix 输入约束。
3. 2026-03-28：sprint-002 exit criteria 全部满足，CR 已收口为 `resolved`，状态切换为 `completed`。

## 7. Sprint-002 Exit Criteria 验收

1. ✅ 至少一个核心 package pilot 已具备 package-level `build / typecheck / test` 真正执行入口。
   - 已完成：`shared`、`memory-store-adapter`、`core-memory`、`core-memory-semantics` 四个包。
2. ✅ Turbo 开始消费 workspace package graph 与 cache policy，而不是继续依赖根级单体 gate 编排。
   - 已完成：`check:package-local:pilot` 第二次运行获得 `12/12 cached`。
3. ✅ `check` 完整语义保持兼容，`fast` profile 不被回退成伪 full gate。
   - 已完成：`pnpm run check` / `pnpm run check:fast` / `pnpm run check:full` 均通过。
4. ✅ sprint-003 的 TS project references 与 affected planner 输入约束已被冻结为显式 follow-up。
   - 已冻结：`TK-286`（ts project references）、`TK-287`（affected gate planner + ci matrix）、`TK-288`（closeout）。

## 8. Sprint-003 输入约束清单

1. `TK-286` ts project references 与 incremental build baseline：
   - 前提：package-level `tsconfig.build.json` 已为 4 个核心包建立（sprint-002 产物）。
   - 约束：引入 `references` 时需保持现有 `rootDir: "../.."` + `outDir: "../../dist"` 的 dist-mirroring 模式兼容。
   - 约束：incremental build 的 `.tsbuildinfo` 输出路径必须被 `.gitignore` 或 turbo cache 正确覆盖。
2. `TK-287` affected gate planner 与 ci matrix rollout：
   - 前提：`run-gate-check.js --profile affected` 已预留显式 deferred 提示（sprint-001 / TK-282 产物）。
   - 约束：首版 affected planner 采用粗粒度 diff routing，不追求理论最优。
   - 约束：CI matrix 必须保持 full gate 仍可作为最终权威入口。
3. `TK-288` sprint-003 出口验收与 project-025 completion closeout：
   - 约束：closeout 需同时更新 delivery registry、completed-streams-history、current-context。
