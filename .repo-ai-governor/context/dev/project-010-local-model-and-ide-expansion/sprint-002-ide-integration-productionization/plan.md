# sprint-002-ide-integration-productionization 计划

- Status: planned
- Date: 2026-03-23
- Project: `project-010-local-model-and-ide-expansion`

## 1. Sprint Goal

将 IDE 集成从 baseline 骨架升级为可运营模板与入口门禁，实现多入口一致注入与稳定执行。

## 2. In-Scope Tasks

1. TK-099 多 IDE surface registry 与 wrapper 契约强化（planned）
2. TK-100 VS Code/JetBrains 官方模板与 smoke 门禁（planned）
3. TK-101 Cursor/Claude Code 接入模板与文档一致性（planned）
4. TK-102 project-010 出口验收与后续 rollout 输入约束（planned）

## 3. Entry Criteria

1. `DA-102`（sprint-001 出口验收与 sprint-002 输入约束）可检索。
2. 本地模型路径与受限网络回退基线保持可复跑。
3. IDE baseline 契约（`integrations/ide/*`）可作为升级输入，不重新造轮子。

## 4. Exit Criteria

1. 至少两类 IDE 入口（VS Code、JetBrains）具备官方模板与稳定命令包装。
2. Cursor/Claude Code 接入模板完成并与 CLI wrapper 契约对齐。
3. IDE 入口 smoke 门禁可复跑，且 standards 注入顺序在多入口一致。
4. 形成 `DA-103`~`DA-106` 并完成 project-010 出口验收。
