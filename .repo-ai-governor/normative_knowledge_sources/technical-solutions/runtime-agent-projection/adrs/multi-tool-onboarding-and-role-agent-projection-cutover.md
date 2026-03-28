# Multi Tool Onboarding And Role-Agent Projection Cutover ADR

- Status: active
- Date: 2026-03-28
- Module ID: `runtime.agent-projection`
- ADR ID: `adr.runtime.agent-projection.multi-tool-onboarding-and-role-agent-projection.v1`

## 1. Context

仓库已经具备多工具 adapter、角色注册、graph-first execution 与审计回放能力，但用户仍需要把 `connect / doctor / verify` 与 role-agent 语义收敛到一条可理解的产品路径。没有投影层时，role 语义、surface 语义和 agent 视图容易彼此混淆。

## 2. Decision

1. `connect / doctor / verify` 作为 onboarding seam 保留，并复用现有 adapter routing 与 verification 语义。
2. `AgentProjectionService` 作为独立投影层输出 `AgentDescriptor`，供 CLI / report / diagnostics 共用。
3. `AgentSessionRegistry` 只做 session 投影，不创建新的会话事实源。
4. `LangGraph supervisor` 仅消费 agent descriptor 作为执行输入，不替代 `runtime.orchestration` 的 graph execution contract。

## 3. Consequences

1. onboarding 与 projection 可以并行演进，互不阻塞。
2. CLI 入口可以更清晰地表达“接入”“诊断”“验证”“执行”四类动作。
3. 投影层若改变 descriptor 结构，必须同步更新 producer contract 与下游 presenter 语义。
4. projection 不得反向污染 execution_session、audit 或 ledger 的 canonical facts。
