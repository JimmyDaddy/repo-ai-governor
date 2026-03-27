# sprint-003-project-references-affected-check-and-ci-matrix 计划

- Status: completed
- Date: 2026-03-28
- Project: `project-025-gate-execution-efficiency-implementation`

## 1. Sprint Goal

落地 TS project references、affected gate planner 与 CI matrix，完成 project-025 closeout。

## 2. Task Package

1. `TK-286` ts project references 与 incremental build baseline（completed）
2. `TK-287` affected gate planner 与 ci matrix rollout（completed）
3. `TK-288` sprint-003 出口验收与 project-025 completion closeout（completed）

## 3. Exit Criteria

1. 核心 package 的 `tsconfig.build.json` 已引入 project references，增量编译可用。
2. `affected` gate planner 已实装，`--profile affected` 从 deferred 提示切换到真实执行。
3. CI matrix 保持 full gate 仍可作为最终权威入口。
4. project-025 完成 closeout，delivery registry 与 completed-streams-history 全部同步。

## 4. Input Constraints（从 TK-285 继承）

1. `TK-286`：package-level `tsconfig.build.json` 已为 4 个核心包建立（sprint-002 产物）；引入 `references` 时需保持 `rootDir: "../.."` + `outDir: "../../dist"` 兼容；`.tsbuildinfo` 输出路径必须被 `.gitignore` 或 turbo cache 正确覆盖。
2. `TK-287`：`run-gate-check.js --profile affected` 已预留显式 deferred 提示（sprint-001 / TK-282 产物）；首版 affected planner 采用粗粒度 diff routing；CI matrix 必须保持 full gate 仍可作为最终权威入口。
3. `TK-288`：closeout 需同时更新 delivery registry、completed-streams-history、current-context。

## 5. Execution Notes

1. 本 sprint 由 `sprint-002-package-level-gates-and-build-graph-cutover` 完成态激活。
2. 本 sprint 是 project-025 的最后一个 sprint，完成后需执行 project-level closeout。
3. 2026-03-28：`TK-286` 已完成 4 个核心 package 的 TS project references 与 `tsc -b` incremental pilot baseline。
4. 2026-03-28：`TK-287` 已完成 `affected` planner 真执行路径、CI matrix 分层与 integration coverage。
5. 2026-03-28：`sprint-003` 已完成验收；`project-025` 已切换为 `completed`，`current-context` 暂保留本 sprint 作为 active closeout surface，等待下一条主执行流显式激活。
