# sprint-003-delivery-ide-and-ga-hardening 计划

- Status: in_progress
- Date: 2026-03-24
- Project: `project-010-local-model-and-ide-expansion`

## 1. Sprint Goal

完成 `delivery rehearsal + 黑盒/GA + IDE official surfaces` 的收口，并为 project-010 提供最终出口验收证据。

## 2. In-Scope Tasks

1. TK-107 受控 delivery rehearsal 与 audit/replay 集成（completed）
2. TK-108 黑盒 E2E、CI/release gate 与 GA 指标收口（completed）
3. TK-109 多 IDE surface registry 与 wrapper 契约强化（planned）
4. TK-110 VS Code/JetBrains 官方模板与 smoke 门禁（planned）
5. TK-111 Cursor/Claude Code 接入模板与文档一致性（planned）
6. TK-112 project-010 出口验收与后续 rollout 输入约束（planned）

## 3. Entry Criteria

1. `DA-106`（sprint-002 出口验收与 sprint-003 输入约束）可检索。
2. 自动主链、review 子链与 HITL 决策回灌基线保持可复跑。
3. IDE baseline 契约（`integrations/ide/*`）、delivery/release gate 与黑盒 runner 可作为升级输入，不重复造轮子。

## 4. Exit Criteria

1. 至少 1 条受控 `commit` 或 `PR draft` rehearsal 可回放、可审计、可人工接管。
2. 黑盒 E2E、CI、release gate 覆盖主路径与降级路径，并沉淀 GA 指标。
3. 至少两类 IDE 入口（VS Code、JetBrains）具备官方模板与稳定命令包装，Cursor/Claude Code 文档与 contracts/examples 一致。
4. 形成 `DA-107`~`DA-112` 并完成 project-010 出口验收。
