# sprint-001-local-model-adapter-baseline 计划

- Status: in_progress
- Date: 2026-03-24
- Project: `project-010-local-model-and-ide-expansion`

## 1. Sprint Goal

完成本地模型适配路径最小可执行闭环：覆盖 adapter 契约、配置扩展、受限网络回退、诊断校验，并冻结自动主链优先的 sprint-002 输入约束。

## 2. In-Scope Tasks

1. TK-095 本地模型适配契约与配置扩展基线（completed）
2. TK-096 Ollama 类 adapter 与 route fallback 基线（completed）
3. TK-097 本地模型诊断校验与受限网络演练基线（completed）
4. TK-098 sprint-001 出口验收与 sprint-002 输入约束（planned）
5. TK-103 全自动研发 gap 清单与 draft 收敛（completed）
6. TK-104 主执行计划全自动研发 gap register 上收（completed）
7. TK-105 主执行计划结构重梳与执行导航重构（completed）
8. TK-106 triad 文档 Stage 9 overlay 补强同步（completed）
9. TK-113 project-010 Stage 9 执行重排与 sprint rebaseline（completed）
10. TK-114 cli-governance-runtime 拆分方案与 anti-God-object 规范基线（completed）

## 2.1 当前执行焦点

1. `TK-095`：已完成本地模型 surface 契约与 `governor.yaml` 配置/schema 扩展，并产出 `DA-099` 作为 `TK-096/TK-097` 唯一输入基线。
2. `TK-096`：已完成真实调用与 route fallback，当前产出 `DA-100` 作为 `TK-097/TK-098` 的唯一实现输入之一。
3. `TK-097`：已完成 deep probe、failure attribution、safe_local boundary 与 restricted network 演练，产出 `DA-101` 与可复跑门禁证据。
4. `TK-103`：已完成 draft gap checklist，为 `TK-096/TK-097/TK-098` 提供统一问题清单与闭环顺序。
5. `TK-104`：将 draft 级 gap checklist 正式上收到 master plan，确保 Stage 9 follow-up 与 project-010 的问题清单保持同源。
6. `TK-105`：已完成 master plan 结构重梳，后续 task 拆解应优先遵循新的“当前执行摘要 -> Stage 9 主线 -> project 映射”阅读路径。
7. `TK-106`：已完成 triad 补强同步，将 Stage 9 follow-up 的技术收口重点明确回锚到总技术方案与架构蓝图，并保持 PRD/brief 同步门禁通过。
8. `TK-098`：当前应产出 `sprint-002-autonomous-mainchain-foundation` 的输入约束，而不是继续沿用 IDE-first 顺序。
9. `TK-113`：已完成 `project-010` 执行重排，将原 `sprint-002` 顺延为 `sprint-003`，并为自动主链收口创建新的 `sprint-002` 骨架。
10. `TK-114`：已完成 `cli-governance-runtime.ts` 拆分方案 draft 与 anti-God-object 规范基线，为后续 runtime 重构建立唯一分析输入与治理约束。

## 3. Entry Criteria

1. `DA-098`（project-009 出口验收与运营反馈）可检索并作为唯一输入约束之一。
2. Stage 9 已完成的 adapters/routing 语义保持可复跑，不得回退。
3. 质量门禁可执行：`pnpm run check`、`pnpm run release:ga-check`。

## 4. Exit Criteria

1. 本地模型 adapter 协议与配置契约可通过校验，并支持能力矩阵声明。
2. restricted network 场景下具备远端失败 -> 本地回退的可审计路径。
3. `doctor --adapters` 与 `verify --adapters` 对本地模型路径输出稳定 `pass/warn/fail`。
4. 形成 `DA-099`~`DA-102` 并通过台账同步门禁，同时冻结 `sprint-002-autonomous-mainchain-foundation` 的输入约束。
