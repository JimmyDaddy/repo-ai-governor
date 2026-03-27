# TK-236 `react-native-image-marker-1.1.x` 复杂仓库 adopter pilot

- Status: completed
- Date: 2026-03-27
- Owner: AI-Agent
- Priority: P0
- Project: `project-020-adoption-productization-and-upgrade-ux`
- Sprint: `sprint-004-adopter-pilot-and-documentation-closure`

## 1. 任务目标

在复杂仓库 `/Users/jimmydaddy/study/react-native-image-marker-1.1.x` 上验证 `upgrade` 与 `workspace lifecycle` 的复杂场景真值，并形成复杂仓库 known limitations / troubleshooting 输入。

## 2. Depends On

1. `TK-234`
2. `TK-235`

## 3. 预期产物

1. 复杂仓库 pilot 运行记录。
2. 复杂仓库 truthfulness / failure taxonomy gap register。
3. 对 troubleshooting / known limitations 的回灌建议。

## 4. 实施计划

1. 盘点目标仓库的现有结构与接入前置条件。
2. 执行 `upgrade`、`workspace dry-run`、`workspace execute` 与 `rollback` rehearsal。
3. 把复杂仓库特有问题沉淀成 docs/gates 输入，而不是一次性笔记。

## 5. 验证

1. 目标仓库内的 rehearsal 记录。
2. `repo-ai-governor` 侧 task/artifact ledger 同步。

## 6. 执行记录

1. 2026-03-27：任务创建，状态初始化为 `planned`。
2. 2026-03-27：在 `/Users/jimmydaddy/study/react-native-image-marker-1.1.x` 上以 `dist/bin/repo-ai-governor.js` 作为最小扰动入口完成 `init / doctor / check / upgrade / workspace dry-run / execute / rollback`，确认复杂仓库的 dirty worktree 不会被 cutover/rollback 破坏。
3. 2026-03-27：已形成复杂仓库 gap register，包括 Yarn/non-pnpm adopter 的无侵入演练路径、default `tool_managed` 首次接入、workspace artifact locality，以及 rollback 后 migration scratch 残留；结果已沉淀到 `DA-236`。
