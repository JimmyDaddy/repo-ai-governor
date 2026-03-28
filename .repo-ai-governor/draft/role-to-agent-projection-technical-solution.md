# Repo AI Governor Role 到 Agent 投影层技术方案（Draft）

- Status: draft
- Date: 2026-03-28
- Scope: runtime semantics / orchestration projection / multi-tool collaboration
- Related:
  - `.repo-ai-governor/draft/multi-ai-tools-fast-onboarding-technical-solution.md`
  - `apps/cli/src/cli-governance-runtime.ts`
  - `apps/cli/src/runtime/task-driven-run-runtime.ts`
  - `packages/core-role-registry/src/role-registry.ts`
  - `packages/adapter-sdk/src/agent-route-runner.ts`
  - `packages/core-runtime-langgraph/src/compiled-ir-graph-adapter.ts`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-orchestration/module-overview.md`

## 1. 背景

当前仓库已经具备多工具适配、角色治理、流程编排和审计回放能力，但 `role` 目前主要是一个调度语义，不是一个会自动生成的长期 `agent` 实体。

具体表现是：

1. `RoleRegistry` 负责解析与治理 `roleProfileId`。
2. `task-driven-run-runtime` 负责为 stage 选择合适的 `roleProfileId`。
3. `CompiledIrGraphAdapter` 负责把 `roleProfileId` 带入编排图节点。
4. 真正执行时，仍然是 `AgentProtocolContract` 和 `AgentRouteRunner` 在按照 `routeKey`、`surface` 和 capability 进行分发。

所以，当前系统已经能“让多个工具在同一流程里工作”，但还没有一层显式的 `agent projection`，把 role 进一步变成可视、可审计、可展示的 agent 实体。

## 2. 现状判断

### 2.1 已经具备的能力

1. 多工具适配已存在，Codex / Claude Code / GitHub Copilot / Local Model 都有统一协议入口。
2. 多角色治理已存在，默认角色集和 fallback 路由已进入 CLI 默认配置。
3. 多阶段编排已存在，`Sequential / Parallel / Loop / Condition` 都已经可执行。
4. 审计、HITL、report、artifact 等执行后护栏已存在。

### 2.2 当前缺口

1. `role` 没有被显式投影为 `agent instance`。
2. UI 和 report 只能主要按 `role` 和 `stage` 看执行情况，缺少更直观的 agent 视角。
3. 角色、工具、surface、预算、状态之间的关系还分散在多个 runtime 和配置对象里。
4. 团队在理解系统时，容易把“role 配置”误解成“已生成 agent”，导致产品语义和实现语义不一致。

## 3. 设计目标

1. 不推翻现有 `role -> route -> adapter` 主链路。
2. 增加一层显式的 `agent projection`，把 role 变成可执行、可展示、可追踪的 agent 描述。
3. 让 UI、审计、report、diagnostics 都能复用同一份 agent 投影结果。
4. 保持 `AgentProtocolContract` 和现有 orchestration service 不变，避免重写运行时。

## 4. 推荐方案

推荐引入 `AgentProjectionService`，它的职责不是“创建新运行时”，而是把现有角色配置和路由决策投影成 agent 视图。

### 4.1 输入

1. `roleProfileId`
2. `routeKey`
3. `stageId`
4. `adaptersConfig`
5. `runtimeDebugOptions`
6. `executionContext`

### 4.2 输出

1. `agentId`
2. `agentRole`
3. `roleProfileId`
4. `primarySurface`
5. `fallbackSurfaces`
6. `capabilities`
7. `status`
8. `selectedBy`
9. `executionId`
10. `sessionId`
11. `budget` / `timeout` / `constraint` 摘要

### 4.3 核心原则

1. Agent 是投影出来的，不是手工在命令层临时拼出来的。
2. role 仍然是治理主语，agent 是展示和执行语义上的投影结果。
3. route 仍然决定实际调用哪个 surface，agent 只是把这条决策线条标准化。

## 5. 推荐结构

```text
runtime/
  agent-projection/
    agent-projection.service.ts
    agent-descriptor-registry.ts
    agent-session-registry.ts
    agent-projection.types.ts
    agent-projection.mapper.ts
    agent-projection.presenter.ts
```

### 5.1 `AgentProjectionService`

负责把 `roleProfileId + routeKey + adaptersConfig` 归一成 agent 描述。

### 5.2 `AgentDescriptorRegistry`

负责声明默认 agent descriptor 模板，例如：

1. `planner-agent`
2. `architect-agent`
3. `coder-agent`
4. `tester-agent`
5. `reviewer-agent`
6. `verifier-agent`

### 5.3 `AgentSessionRegistry`

负责把单次 execution 中生成的 agent 投影结果持久化为会话级记录，供 report、diagnostics 和 UI 使用。

## 6. 工作流

1. 编排节点创建时，先解析 `roleProfileId`。
2. `AgentProjectionService` 基于当前 role 和 route 生成 `agent descriptor`。
3. `AgentRouteRunner` 继续负责选择实际 surface 并执行 stage。
4. 执行结果与审计事件回写到 `agent_session`。
5. UI 和 report 读取 `agent_session`，以 agent 视角展示进度、状态和 fallback。

这样做的好处是：

1. 不改变底层执行路径。
2. 但能把“role 配置”升级为“agent 可视化实体”。
3. 用户会更容易理解多个工具是如何协作的。

## 7. 四栏对照

| 维度 | 当前已支持 | 还缺什么 |
|---|---|---|
| 技术底座 | role registry、route runner、adapter protocol、LangGraph runtime、audit/report 都已存在。 | 缺少统一的 agent projection 层来把 role 映射成可展示、可追踪的 agent descriptor。 |
| 工作流 | `roleProfileId -> stage -> routeKey -> surface` 的执行链路已经跑通。 | 缺少 `agent_session` 维度的登记、查询和回放能力。 |
| UI 入口 | CLI 现在已经能看见角色级和执行级结果。 | 缺少 agent 级视图，用户很难直观看到“哪个 agent 代表哪个 role，在用哪个工具执行”。 |
| 外部可用性 | 现有能力足够支撑多工具协作的内部治理闭环。 | 缺少更强的产品语义包装，让外部 adopter 直接理解和使用多 agent 协同。 |

## 8. 实施顺序

1. 先做 `AgentProjectionService`，只输出 descriptor，不改执行逻辑。
2. 再做 `AgentSessionRegistry`，把投影结果和执行结果绑定。
3. 然后让 CLI `connect / verify / run / review` 输出 agent 视图。
4. 最后再考虑是否要把 agent 视图升级为 React 式交互壳层的主展示单元。

## 9. 风险

1. 不要把 agent projection 误做成第二套 runtime。
2. 不要让 UI 直接持有业务真相，agent descriptor 只是投影，不是 canonical source。
3. 不要让 role、agent、surface 三套概念互相覆盖，必须明确职责边界。

## 10. 结论

当前最合理的优化方向，不是让 `role` 直接“生成 agent 并接管执行”，而是补一层显式的 `role -> agent projection`。

这层投影能让系统同时满足两件事：

1. 底层继续保持现有的治理执行链路不变。
2. 上层增加更清晰的 agent 视图，方便 UI、report 和多工具协作理解。

换句话说：

1. `role` 负责“谁来做”。
2. `route` 负责“去哪个工具做”。
3. `agent projection` 负责“把这件事对人讲清楚，并可审计、可回放”。
