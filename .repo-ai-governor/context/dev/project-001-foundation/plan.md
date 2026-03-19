# project-001-foundation 计划

- Status: active
- Date: 2026-03-19
- Stage Mapping: Stage 0-1
- Phase Mapping: Phase A

## 1. 目标

1. 在 `pnpm workspace`（`apps/ + packages/`）结构下完成 Stage 0-1 基础能力落地。
2. 建立可安装可初始化的 CLI 与 `packages/config` 基线。
3. 建立 `tool_managed/repo_local` workspace 生命周期与 upgrade 骨架。
4. 建立基础 CI 治理与可回归的工程基线（TypeScript/Biome/i18n/Vitest）。

## 2. 工作流分解（Workstreams）

1. WS-01 边界与门禁
   - Monorepo 分层边界与依赖方向治理。
   - `integrations/ci` 骨架与门禁命令接线。
2. WS-02 配置与入口
   - `packages/config`（Loader/Schema/Profile）。
   - `apps/cli` 命令骨架与 smoke 基线。
   - 前置 `packages/shared/src/i18n` 的 `i18next` runtime 基线，作为 CLI 文案渲染依赖。
3. WS-03 工程基础设施
   - TypeScript/Biome/i18n 工程基线（i18n runtime 基线优先级前置到 TK-006 实施窗口）。
   - 依赖边界检查 warning 模式接入。
4. WS-04 Workspace 与升级
   - `tool_managed/repo_local` 解析与切换。
   - `copy/verify/switch/rollback` 迁移链路。
   - `schema diff -> 迁移建议 -> 人工确认` upgrade 骨架。

## 3. Sprint 细化

## 3.1 sprint-001-foundation-bootstrap

- Sprint Goal: 建立边界、入口、配置与基础工程门禁。
- 任务包：`TK-004` ~ `TK-008`。
- Exit Criteria:
  1. `apps/cli` 与 `packages/config` 基线可运行。
  2. `packages/shared/src/i18n` 的 `i18next` runtime 基线已落地并可被 CLI 调用。
  3. `integrations/ci` 可触发基础门禁。
  4. 依赖边界检查以 warning 模式可稳定执行。

## 3.2 sprint-002-workspace-and-upgrade

- Sprint Goal: 完成 workspace 生命周期和 upgrade 骨架闭环。
- 任务包：`TK-009` ~ `TK-012`。
- Exit Criteria:
  1. workspace 双模式可解析、切换、回滚。
  2. upgrade 可输出 schema diff 与迁移建议，并具备确认入口。
  3. 形成 sprint-002 闭环验收基线文档。

## 4. 任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | status |
|---|---|---|---|---|---|
| TK-003 | sprint-001 | 项目细化与基线约束文档 | baseline/constraints | TK-001,TK-002 | completed |
| TK-004 | sprint-001 | Monorepo 边界与 CI 骨架 | baseline/constraints | TK-003 | completed |
| TK-005 | sprint-001 | Config 包基线实现方案 | baseline/contract | TK-003 | completed |
| TK-006 | sprint-001 | CLI 命令骨架与 smoke 基线 | baseline/constraints | TK-005 | completed |
| TK-007 | sprint-001 | 依赖边界 warning gate 基线 | baseline/policy | TK-004 | completed |
| TK-008 | sprint-001 | sprint-001 出口验收基线 | acceptance baseline | TK-004,TK-005,TK-006,TK-007 | completed |
| TK-009 | sprint-002 | Workspace Resolver 双模式基线 | baseline/contract | TK-008 | completed |
| TK-010 | sprint-002 | workspace 迁移链路基线 | baseline/constraints | TK-009 | completed |
| TK-011 | sprint-002 | upgrade schema diff 与建议基线 | baseline/policy | TK-010 | planned |
| TK-012 | sprint-002 | sprint-002 出口验收与回滚基线 | acceptance baseline | TK-009,TK-010,TK-011 | planned |

## 5. 依赖产物登记策略

1. 仅登记“规范/基线/约束”类产物，不登记编排过程文档。
2. 每个 sprint 至少形成一个可复用基线产物并登记为 `DA-*`。
3. 后续任务卡中的 `Depends On` 与 `Input References` 优先引用 `DA-* + path` 双键。

## 6. DoD（project-001）

1. 新仓库 15 分钟内完成接入。
2. `tool_managed` 默认可用，`repo_local` 可切换并可回滚。
3. CI 可稳定执行基础门禁并定位失败原因。
4. Stage 0-1 关键基线产物可通过 artifact registry 检索与消费。
