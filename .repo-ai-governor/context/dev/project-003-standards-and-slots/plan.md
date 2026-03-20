# project-003-standards-and-slots 计划

- Status: active
- Date: 2026-03-20
- Stage Mapping: Stage 4
- Phase Mapping: Phase B/C

## 1. 目标

1. 完成 Standards Pack 渲染投影闭环（human/ai/agents 同源）。
2. 完成 Spec Sync Guard 的可阻断门禁接线与稳定输出契约。
3. 完成 Slot 双轨（声明式 + 脚本）与安全模型六项基线。
4. 完成升级 UX 闭环（冲突清单、失败回滚、版本 pin）。

## 2. 工作流分解（Workstreams）

1. WS-01 Standards Pack Rendering
   - `pack registry`、`rule renderer`、多语言语义键渲染一致性。
   - `agents projector` 投影稳定性与回链元数据。
2. WS-02 Spec Sync Guard
   - triad + brief 同步校验、机器可读失败模型、门禁接线。
3. WS-03 Slot Engine Security
   - 声明式 slot 主路径。
   - 脚本 slot 安全六项：沙箱、审批、资源限制、I/O 契约、失败隔离、审计字段。
4. WS-04 Upgrade UX
   - 冲突清单分级、自动修复建议、失败回滚、规范包版本 pin 策略。

## 3. Sprint 细化

## 3.1 sprint-001-standards-pack-and-spec-sync

- Sprint Goal: 完成 Standards 渲染投影基线与 Spec Sync Guard 门禁接线。
- 任务包：`TK-024`、`TK-025`、`TK-026`、`TK-029`。
- Exit Criteria:
  1. `rule renderer` + `agents projector` 形成可验证基线。
  2. human/ai/agents 三视图可回链同一语义键与 pack 版本。
  3. Spec Sync Guard 纳入门禁链路并输出稳定失败结构。
  4. 形成 sprint-001 验收基线与 sprint-002 输入约束清单。

## 3.2 sprint-002-slot-security-and-upgrade-ux

- Sprint Goal: 完成 Slot 双轨安全基线与升级 UX 闭环。
- 任务包：`TK-027`、`TK-028`、`TK-030`。
- Exit Criteria:
  1. 声明式 slot 与脚本 slot 可在统一策略下执行。
  2. 脚本 slot 安全六项全部可验证。
  3. 升级冲突可分类、可建议、可回滚并支持版本 pin。
  4. 形成 project-003 统一验收与 project-004 输入约束清单。

## 4. 任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | status |
|---|---|---|---|---|---|
| TK-024 | sprint-001 | Standards Pack Registry 与 Rule Renderer 基线 | baseline/contract | TK-020,DA-030,DA-031 | planned |
| TK-025 | sprint-001 | Agents Projector 与 Projection Parity 基线 | baseline/constraints | TK-024 | planned |
| TK-026 | sprint-001 | Spec Sync Guard 门禁接线基线 | baseline/policy | TK-024,TK-025 | planned |
| TK-029 | sprint-001 | sprint-001 出口验收与 sprint-002 输入约束 | acceptance baseline | TK-024,TK-025,TK-026 | planned |
| TK-027 | sprint-002 | Slot Engine 双轨与脚本安全六项基线 | baseline/security | TK-029 | planned |
| TK-028 | sprint-002 | Standards 升级 UX 与版本 pin 策略基线 | baseline/upgrade | TK-027 | planned |
| TK-030 | sprint-002 | project-003 出口验收与 project-004 输入约束 | acceptance baseline | TK-027,TK-028 | planned |

## 5. 依赖产物策略

1. project-003 启动入口默认消费 `DA-030`（project-002 出口验收基线）与 `DA-031`（project-003 输入约束清单）。
2. sprint-001 产物目标：`DA-032`~`DA-036`；sprint-002 产物目标：`DA-037`~`DA-040`。
3. 任务执行时使用 `artifact_id + artifact_path` 双键回链，并同步 `tasks.csv/checklist/dependency-artifact-registry`。

## 6. DoD（project-003）

1. Standards 资产可同源渲染 human/ai/agents 三视图且语义一致。
2. `AGENTS.md` 投影稳定，具备 `source_pack_refs/projected_at/projection_target` 回链字段。
3. Spec Sync Guard 可对 triad + brief 漂移执行阻断，并提供机器可读失败明细。
4. Slot 脚本默认最小权限，安全六项与审计字段全部可验证。
5. 升级冲突清单、失败回滚、版本 pin 三项能力可稳定复现并通过门禁。
