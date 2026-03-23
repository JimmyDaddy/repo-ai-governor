# sprint-001-local-model-adapter-baseline 计划

- Status: in_progress
- Date: 2026-03-24
- Project: `project-010-local-model-and-ide-expansion`

## 1. Sprint Goal

完成本地模型适配路径最小可执行闭环：覆盖 adapter 契约、配置扩展、受限网络回退、诊断校验与验收交接。

## 2. In-Scope Tasks

1. TK-095 本地模型适配契约与配置扩展基线（completed）
2. TK-096 Ollama 类 adapter 与 route fallback 基线（planned）
3. TK-097 本地模型诊断校验与受限网络演练基线（planned）
4. TK-098 sprint-001 出口验收与 sprint-002 输入约束（planned）
5. TK-103 全自动研发 gap 清单与 draft 收敛（completed）
6. TK-104 主执行计划全自动研发 gap register 上收（completed）

## 2.1 当前执行焦点

1. `TK-095`：已完成本地模型 surface 契约与 `governor.yaml` 配置/schema 扩展，并产出 `DA-099` 作为 `TK-096/TK-097` 唯一输入基线。
2. `TK-096`：下一步接入真实调用与 route fallback，不引入契约重复定义。
3. `TK-097`：基于 `TK-095/TK-096` 验证 deep probe 与 restricted network 演练，产出可复跑门禁证据。
4. `TK-103`：已完成 draft gap checklist，为 `TK-096/TK-097/TK-098` 提供统一问题清单与闭环顺序。
5. `TK-104`：将 draft 级 gap checklist 正式上收到 master plan，确保 Stage 9 follow-up 与 project-010 的问题清单保持同源。

## 3. Entry Criteria

1. `DA-098`（project-009 出口验收与运营反馈）可检索并作为唯一输入约束之一。
2. Stage 9 已完成的 adapters/routing 语义保持可复跑，不得回退。
3. 质量门禁可执行：`pnpm run check`、`pnpm run release:ga-check`。

## 4. Exit Criteria

1. 本地模型 adapter 协议与配置契约可通过校验，并支持能力矩阵声明。
2. restricted network 场景下具备远端失败 -> 本地回退的可审计路径。
3. `doctor --adapters` 与 `verify --adapters` 对本地模型路径输出稳定 `pass/warn/fail`。
4. 形成 `DA-099`~`DA-102` 并通过台账同步门禁。
