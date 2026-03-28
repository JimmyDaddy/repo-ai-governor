# Repo AI Governor 多 AI 工具协同编程能力现状与达到可用状态路径（Draft）

- Status: draft
- Date: 2026-03-28
- Scope: adapter real-invocation / multi-tool collaboration / GA production readiness
- Related:
  - `.repo-ai-governor/draft/multi-ai-tools-fast-onboarding-technical-solution.md`
  - `.repo-ai-governor/draft/role-to-agent-projection-technical-solution.md`
  - `.repo-ai-governor/draft/comprehensive-requirements-gap-analysis.md`
  - `packages/adapter-sdk/src/agent-route-runner.ts`
  - `packages/adapters/codex/src/codex-agent-adapter.ts`
  - `packages/adapters/claude-code/src/claude-code-agent-adapter.ts`
  - `packages/adapters/github-copilot/src/github-copilot-agent-adapter.ts`
  - `apps/cli/src/cli-governance-runtime.ts`

## 1. 核心结论

当前系统已具备多 AI 工具协同编程的**完整架构骨架**，但尚未达到**真实可用**状态。

差距不在框架设计，而在适配器的"最后一公里"：从 fixture-backed 模式切换到 real-invocation 模式。

## 2. 已经完成的能力（架构层 — 全部就绪）

| 层次 | 能力 | 完成度 |
|------|------|--------|
| Adapter SDK | `AgentProtocol` 抽象协议：`probe / invokeStage / streamEvents / requestConfirmation / cancel` | 100% |
| 路由引擎 | `AgentRouteRunner`：routeKey + primary/fallback 选择 + 受限网络降级 | 100% |
| 能力评估 | `AgentCapabilityEvaluator`：10 项能力矩阵（tool_calling / streaming / structured_output 等） | 100% |
| 角色绑定 | `governor.yaml` `adapters.routing.roleBindings`：角色→surface→candidateSurfaces | 100% |
| 流程编排 | 8 阶段 task-driven run：prepare → artifact-context → execute → verify → review → review-verify → delivery-rehearsal → report | 100% |
| 接入链路 | `connect → doctor → verify` 三段式接入 + 可用性矩阵 | 100% |
| 编排服务 | `core-orchestration-service`：embedded + sidecar IPC 双模式，完整 execution lifecycle | 100% |
| LangGraph 运行时 | 编排图编译 + checkpoint / recovery / HITL 中断恢复 | 100% |
| 审计 / HITL | 事件审计、通知渠道 provider (webhook + chat-im)、HITL 决策回执 | 100% |

## 3. 当前缺口（适配器真实调用层）

### 3.1 三个适配器的代码级现状

#### Codex 适配器 (`packages/adapters/codex/`)

- 有 `BASELINE` (fixture) 和 `REAL` (真实) 两种 `executionMode`
- `invokeStage()` 在 `REAL` 模式下会 `spawn('codex', ['exec', '--json', '-'])` 执行真实 CLI 调用
- `probe()` 在 `REAL` 模式下会执行健康检查（发送 "Respond with exactly OK."）
- 能力矩阵区分了 baseline vs real（real 模式下 parallel_task=DEGRADED, confirmation_gate=UNSUPPORTED）
- **缺口**：默认仍为 `BASELINE` 模式，未在生产链路中启用 `REAL`

#### Claude Code 适配器 (`packages/adapters/claude-code/`)

- 有 `BASELINE` (fixture) 和 `CLI_EXEC` (真实) 两种 `executionMode`
- `invokeStage()` 在 `CLI_EXEC` 模式下会调用 `executeClaudeCodeCli()` → `spawn` 真实 CLI
- `probe()` 在 `CLI_EXEC` 模式下会执行真实健康探测
- **缺口**：默认仍为 `BASELINE` 模式

#### GitHub Copilot 适配器 (`packages/adapters/github-copilot/`)

- 有 `BASELINE` (fixture) 和 `CLI_EXEC` (真实) 两种 `executionMode`
- 结构与 Claude Code 适配器对称
- **缺口**：默认仍为 `BASELINE` 模式；且 Copilot 的 CLI 调用路径（`gh copilot`）生态成熟度较低

#### Local Model 适配器 (`packages/adapters/local-model/`)

- 作为受限网络 fallback 候选
- 当前仅有 baseline 行为

### 3.2 差距汇总

| 缺口 | 影响面 | 工作量估算 | 优先级 |
|------|--------|-----------|--------|
| 适配器 executionMode 从 BASELINE → REAL/CLI_EXEC 的生产启用路径 | 所有真实调用 | S | P0 |
| 真实调用模式下的 prompt 工程（将 stage context 转换为有效 prompt） | 执行质量 | M | P0 |
| 真实调用模式下的输出解析与结构化提取 | 结果可用性 | M | P0 |
| 真实调用的错误处理、超时、重试与降级策略 | 稳定性 | M | P1 |
| 多工具协同的端到端集成测试 | 质量保障 | M | P1 |
| Agent Projection（role → agent 投影可视化） | 可观测性 | L | P2 |

## 4. 达到可用状态的推荐路径

### Phase 1: 单工具真实调用闭环（建议首选 Claude Code）

**目标**：让单个适配器在 `run` 命令中走通真实调用链路。

**为什么建议首选 Claude Code**：
1. Claude Code CLI (`claude`) 支持 `--print` 非交互模式，输出可解析
2. Claude Code 适配器已有 `CLI_EXEC` 模式的完整代码骨架（spawn + 输出解析 + 健康检查）
3. 作为本仓库的开发工具，环境最容易满足

**具体步骤**：

1. **启用 executionMode 切换**
   - 在 `governor.yaml` 的 `adapters.tools` 配置中增加 `executionMode` 字段
   - `connect` 命令在生成配置时根据 probe 结果自动设置为 `cli_exec`（如果工具可用）
   - 或暴露为 CLI flag：`repo-ai-governor run --adapter-mode real`

2. **完善 prompt 工程**
   - `invokeStage` 中的 `renderInvokePrompt()` 需要把 stage context（stageId / routeKey / input / 治理规则）转换为结构化 prompt
   - 建议采用分层 prompt 模板：系统角色 + 治理规则 + 任务上下文 + 输出格式要求

3. **完善输出解析**
   - `parseClaudeCodeCliOutput()` 需要从 CLI stdout 提取结构化结果
   - 建议定义统一的 adapter output schema：`{ responseText, structuredOutput?, artifacts?, warnings? }`

4. **端到端验证**
   - 新增集成测试：真实 `claude --print` 调用 + 输出解析 + stage result 写回
   - 可先用 `doctor --adapters` + `verify --adapters` 验证基线

### Phase 2: 多工具协同 — 不同 stage 用不同 AI 工具

**目标**：一次 `run` 中 planner 阶段用 Claude Code，coder 阶段用 Codex，reviewer 阶段用 Copilot。

**具体步骤**：

1. **配置多工具 roleBinding**
   ```yaml
   adapters:
     routing:
       roleBindings:
         planner:
           candidateSurfaces: [claude-code, codex]
         coder:
           candidateSurfaces: [codex, claude-code]
         reviewer:
           candidateSurfaces: [github-copilot, claude-code]
   ```

2. **启用各适配器的 real mode**
   - Codex：确认本机 `codex` CLI 可用 + `OPENAI_API_KEY` 已设置
   - Claude Code：确认 `claude` CLI 可用 + 已登录
   - GitHub Copilot：确认 `gh copilot` 可用 + 已授权

3. **完善跨工具上下文传递**
   - 前一个 stage 的输出需要作为下一个 stage 的输入
   - 当前 `RuntimeStageInputMap` 已支持，但需要验证跨适配器时的 schema 兼容性

4. **完善降级路径**
   - 当 primary surface 不可用时，fallback 到 candidateSurfaces 中的备选
   - 当所有 surface 不可用时，降级到 local-model 或 HITL 人工介入

### Phase 3: Agent Projection — 可视化与可审计

**目标**：把 role → adapter → stage 的调度结果投影为可视、可审计的 agent 实体。

**参考方案**：`.repo-ai-governor/draft/role-to-agent-projection-technical-solution.md`

## 5. 最小可行方案（Quick Win）

如果只想以最低成本验证"多工具协同"真实可用：

1. 在 `governor.yaml` 中配置 Claude Code adapter 的 executionMode 为 `cli_exec`
2. 只对 `execute` 阶段启用真实调用（其余阶段保持 fixture-backed）
3. 跑一次 `run` 命令观察真实 Claude Code CLI 调用是否走通
4. 成功后逐步扩展到其他阶段和其他适配器

具体操作路径：

```bash
# 1. 确认 Claude Code CLI 可用
claude --version

# 2. 用 connect 生成配置
pnpm exec repo-ai-governor connect --tools claude-code --preset single-tool-all-roles

# 3. 验证适配器可用性
pnpm exec repo-ai-governor verify --adapters --output pretty

# 4. 手动在 governor.yaml 中把 claude-code 的 executionMode 改为 cli_exec
# 5. 执行 run 观察真实调用
pnpm exec repo-ai-governor run --output pretty --trace
```

## 6. 工作量评估

| Phase | 预计工作量 | 产出 |
|-------|-----------|------|
| Phase 1: 单工具真实调用闭环 | 2-3 个 sprint | Claude Code 全阶段真实可用 |
| Phase 2: 多工具协同 | 2 个 sprint | 3 个适配器跨阶段协同可用 |
| Phase 3: Agent Projection | 1-2 个 sprint | agent 投影 + 审计增强 |

## 7. 风险与约束

1. **API Key / 登录态依赖**：真实调用需要各 AI 工具的 API Key 或登录态，增加用户门槛
2. **成本控制**：多工具多阶段调用会消耗大量 token，需要 budget policy 实际生效
3. **输出非确定性**：AI 工具输出不确定，需要 verify 和 review 阶段的质量门禁
4. **Copilot CLI 生态**：`gh copilot` CLI 的能力和稳定性相对较弱，可能需要降级策略
5. **并发与超时**：真实调用耗时远大于 fixture，需要调整 stage 和 flow 级超时
