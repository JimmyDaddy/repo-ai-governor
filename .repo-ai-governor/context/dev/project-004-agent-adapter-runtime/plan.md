# project-004-agent-adapter-runtime 计划

- Status: active
- Date: 2026-03-21
- Stage Mapping: Stage 5
- Phase Mapping: Phase C

## 1. 目标

1. 落地 Role Registry 与 `role_profile` 生命周期治理基线。
2. 落地统一 Agent 协议与 capability matrix，确保跨工具契约一致。
3. 落地 Adapter SDK、`routeKey` 主备路由与首批适配器（Codex/Copilot/Claude Code）。
4. 落地受限网络模式与 `integrations/ide` 骨架，确保外网受限时本地治理链路可运行。

## 2. 工作流分解（Workstreams）

1. WS-01 Role Registry
   - 默认角色与用户自定义角色注册。
   - `role_profile_id` 生命周期字段、版本与别名替代关系。
2. WS-02 Agent Protocol
   - 统一 `probe/invokeStage/streamEvents/requestConfirmation` 协议。
   - capability matrix 与超时取消语义。
3. WS-03 Adapter SDK
   - 适配器开发基线、错误码与审计字段接线。
   - `routeKey` 主备路由和降级回退策略。
4. WS-04 Multi-Tool Adapters
   - `codex`、`github-copilot`、`claude-code` 首批适配器。
5. WS-05 Restricted Network + IDE Integration
   - 外网受限时本地治理与台账回写可运行。
   - `integrations/ide` 多入口规范注入与命令包装骨架。

## 3. Sprint 细化

## 3.1 sprint-001-agent-protocol-and-adapter-sdk

- Sprint Goal: 完成 Stage 5 前半段基础契约（Role Registry、Agent 协议、Adapter SDK 与路由降级基线）。
- 任务包：`TK-032`、`TK-033`、`TK-034`、`TK-035`。
- Exit Criteria:
  1. `Role Registry` 契约稳定，支持默认角色与自定义角色生命周期字段。
  2. Agent 协议与 capability matrix 可被 Adapter SDK 消费。
  3. `routeKey` 主备路由与降级回退语义具备可验证基线。
  4. 形成 sprint-001 验收基线与 sprint-002 输入约束清单。

## 3.2 sprint-002-adapters-and-restricted-network

- Sprint Goal: 完成首批多工具适配器、受限网络降级与 IDE 集成骨架。
- 任务包：`TK-036`、`TK-037`、`TK-038`、`TK-039`。
- Exit Criteria:
  1. Codex/Copilot/Claude Code 在统一协议与策略下可运行。
  2. Restricted Network Mode 下本地规则检查、流程编排与台账回写保持可用。
  3. `integrations/ide` 提供统一规范注入与命令包装骨架。
  4. 形成 project-004 出口验收与 project-005 输入约束清单。

## 4. 任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | status |
|---|---|---|---|---|---|
| TK-032 | sprint-001 | Role Registry 与 Role Profile 生命周期基线 | baseline/contract | DA-039,DA-040 | completed |
| TK-033 | sprint-001 | Agent 协议与 Capability Matrix 基线 | baseline/contract | TK-032,DA-040 | completed |
| TK-034 | sprint-001 | Adapter SDK 与 routeKey 主备路由基线 | baseline/integration | TK-032,TK-033 | completed |
| TK-035 | sprint-001 | sprint-001 出口验收与 sprint-002 输入约束 | acceptance baseline | TK-032,TK-033,TK-034 | completed |
| TK-036 | sprint-002 | 首批 Adapters（Codex Copilot Claude Code）基线 | baseline/adapter | TK-035 | in_progress |
| TK-037 | sprint-002 | Restricted Network Mode 降级执行基线 | baseline/resilience | TK-034,TK-036 | planned |
| TK-038 | sprint-002 | integrations/ide 骨架与多入口命令包装基线 | baseline/integration | TK-034,TK-036 | planned |
| TK-039 | sprint-002 | project-004 出口验收与 project-005 输入约束 | acceptance baseline | TK-036,TK-037,TK-038 | planned |

## 5. 依赖产物策略

1. project-004 启动入口默认消费 `DA-039`（project-003 出口验收基线）与 `DA-040`（project-004 输入约束清单）。
2. sprint-001 产物目标：`DA-041`~`DA-045`；sprint-002 产物目标：`DA-046`~`DA-050`。
3. 任务执行时使用 `artifact_id + artifact_path` 双键回链，并同步 `tasks.csv/checklist/dependency-artifact-registry`。

## 6. DoD（project-004）

1. Role Registry、Agent 协议、Adapter SDK 三项契约形成可测试基线并保持一致语义。
2. Codex/Copilot/Claude Code 在统一流程、权限、策略门禁下可执行。
3. 受限网络模式可独立维持本地治理检查、流程状态机与台账写入。
4. `integrations/ide` 具备统一规范注入和命令包装入口，不复制核心治理语义。
5. 项目任务台账与评审生命周期路径满足 `CS-021`，无 `task card/checklist/tasks.csv` 漂移。

## 7. 里程碑记录

1. 待补充：project-004 完成态审计摘要（项目收尾时回填）。
