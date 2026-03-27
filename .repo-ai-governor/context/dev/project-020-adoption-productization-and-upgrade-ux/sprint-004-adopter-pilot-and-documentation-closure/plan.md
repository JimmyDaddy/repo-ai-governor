# sprint-004-adopter-pilot-and-documentation-closure 计划

- Status: completed
- Date: 2026-03-27
- Project: `project-020-adoption-productization-and-upgrade-ux`

## 1. Sprint Goal

用两个真实本地仓库验证 `repo-ai-governor` 的接入、升级与 workspace 生命周期用户路径，并把试点结果回灌到 support matrix、playbook、troubleshooting 与 gate truthfulness。

## 2. Task Package

1. `TK-234` sprint-004 激活与 adopter pilot 仓库冻结（completed）
2. `TK-235` 简单仓库 pilot：`/Users/jimmydaddy/study/playground`（completed）
3. `TK-236` 复杂仓库 pilot：`/Users/jimmydaddy/study/react-native-image-marker-1.1.x`（completed）
4. `TK-237` sprint-004 出口验收与文档闭环（completed）

## 3. Exit Criteria

1. `playground` 至少完成一次 clean-room install / init / upgrade / workspace rehearsal，并形成 gap register。
2. `react-native-image-marker-1.1.x` 至少完成一次 upgrade / workspace dry-run / execute / rollback rehearsal，并形成复杂仓库 truthfulness 证据。
3. support matrix、playbook、troubleshooting 与 known limitations 基于真实 pilot evidence 完成收口。

## 4. Execution Notes

1. 本 sprint 冻结的 pilot 仓库为：
   - `/Users/jimmydaddy/study/playground`
   - `/Users/jimmydaddy/study/react-native-image-marker-1.1.x`
2. 第一条实质任务优先验证简单仓库，先收敛首次接入路径与低复杂度 upgrade/workspace UX。
3. 复杂仓库 pilot 必须把发现沉淀成 docs/gates truthfulness 输入，而不是停留在一次性试点记录。
4. `TK-235` 已确认 simple adopter 路径可闭环，但也暴露了 default `tool_managed` 首次接入、`doctor/check` external baseline warning、workspace help surface、artifact locality 与 migration scratch cleanup 等 follow-up gap。
5. `TK-236` 已确认复杂仓库上的 dirty worktree 不会被 workspace lifecycle rehearsal 破坏，但也补充暴露了 non-pnpm rehearsal guidance 缺口，以及大型历史仓库下同样存在 external baseline warning、artifact locality 与 scratch cleanup gap。
6. `TK-237` 已将上述 pilot truthfulness 回灌到 README 与 local adoption playbook，并确认 `sprint-004` exit criteria 已全部满足。
