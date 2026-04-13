# ACP Host-Facing Transport Formalization Technical Solution (Draft)

- Status: draft
- Date: 2026-04-13
- Owner: AI-Agent
- Scope: `runtime.agent-projection / ACP as explicit host-facing transport and support contract / packaging verification and public-boundary governance`
- Target Modules:
  - `runtime.agent-projection`
- Related Inputs:
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`
  - `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`
  - `.repo-ai-governor/draft/cli-exec-runtime-hardening-and-explicit-acp-extension-seam-technical-solution.md`
  - `.repo-ai-governor/draft/cli-exec-five-direction-dependency-and-sequencing-analysis-technical-solution.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/module-overview.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-onboarding-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-projection-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/native-cli-exec-runtime-hardening-and-explicit-acp-extension-seam.md`
  - `packages/adapter-sdk/src/native-cli-exec-internal-acp-extension-seam.ts`
  - `packages/adapter-sdk/src/native-cli-exec-process-runtime.ts`

## 1. 背景与问题

当前仓库已经显式保留了 ACP internal seam，但 formal docs 也同样明确了一条硬边界：

1. ACP 目前只是 internal-only、non-default、non-public seam。
2. 不能把 ACP path 伪装成当前 `cli_exec` canonical truth。
3. 一旦 ACP 要变成 host-facing ability，必须新起独立 technical solution。

这说明 ACP 方向并不是“继续在现有 `cli_exec` runtime 上顺手扩一点”，而是一个需要正式回答以下问题的独立能力：

1. ACP 是不是新的 transport truth？
2. 如果是，它如何与 `cli_exec` 明确区分？
3. 它的 session / permission / terminal truth 与现有 continuation / shared-session truth 怎么隔离？
4. 它何时才算进入 adopter-facing support wording 与 distribution contract？

## 2. 目标

1. 把 ACP formalize 为一个显式、独立的 host-facing transport / support / packaging proposal。
2. 明确 ACP 与现有 `cli_exec`、continuation truth、shared-session truth 的边界。
3. 为未来 ACP promotion 建立必要的 verify evidence、packaging boundary 与 support gating。

## 3. 非目标

1. 不把 ACP path 继续伪装成现有 `cli_exec` 成功路径。
2. 不在本方案中直接实施 ACP runtime cutover。
3. 不把 provider continuation、shared session truth 或 transport-selection authority 重新发明为 ACP 私有事实源。
4. 不把 `packages/adapter-sdk` 中现有 internal ACP seam 文件当成 host-facing contract proof、distribution evidence 或 rollout-ready 结论。

## 4. 现状与约束

1. 当前 active solution 已明确：ACP 只能作为 internal seam 保留。
2. `runtime.agent-projection` 已要求 future ACP-like protocol expansion 必须保持 explicit additive seam。
3. 当前 transport selection truth 已经趋于严格，不能接受“同一 surface 内的隐式 transport 假成功”。
4. ACP 一旦 host-facing，就必然涉及 transport truth、support wording、packaging verify 与 public docs，同步成本显著高于普通 runtime follow-up。

## 5. 方案选项与对比

### 5.1 方案 A：继续保持 internal seam，不 formalize host-facing contract

1. 优点：风险最低。
2. 缺点：ACP 永远停留在实现预留点，无法形成可评审的正式推进路径。

### 5.2 方案 B：把 ACP 隐式包进 `cli_exec`

1. 优点：表面上实施最直接。
2. 缺点：直接破坏现有 `cli_exec` truth、support wording 与 strict transport semantics。

### 5.3 方案 C：把 ACP formalize 为显式独立 transport / host-facing contract

1. 做法：ACP 进入独立 truth slot、独立 packaging / verify / support boundary。
2. 优点：truthfulness 最强，也最符合当前 formal docs。
3. 缺点：需要同步处理 transport contract、host distribution、verify evidence 与 adopter-facing wording。

### 5.4 对比结论

推荐方案 C。  
如果 ACP 未来真要 host-facing，就必须以独立 transport / support contract 的身份进入，而不是继续借用 `cli_exec` 名义。

## 6. 推荐方案

1. ACP promotion 的正式语义应是：
   - 新增显式 transport kind，例如 `acp_exec`
   - 绝不复用 `cli_exec` truth slot
2. ACP 必须采用显式选择，不允许：
   - 从 `cli_exec` 自动 failover 到 ACP
   - 从 ACP 自动假装回到 `cli_exec`
3. ACP 的 session id、permission queue、terminal channel 只能是 ACP-local truth：
   - 不能覆盖 provider continuation
   - 不能覆盖 shared-session canonical truth
4. ACP support wording 只有在 verify / packaging / clean-room evidence 通过后才能 uplift 到 adopter-facing docs。

### 6.1 ACP Truth And Companion Matrix

| surface | owner | canonical carrier | emitted ACP facts | forbidden rewrites |
| --- | --- | --- | --- | --- |
| `connect / doctor / verify` | `agent-onboarding-contract` | explicit tool row with `transport_kind=acp_exec` plus onboarding companion fields | ACP transport selection, host-facing readiness posture, packaging/verify gating facts, adopter follow-up boundary | 不得把 ACP success 写成 `cli_exec`；不得把 packaged distribution / clean-room verify execution 写成本 sprint 已完成 |
| `AgentDescriptor` | `agent-projection-contract` | additive transport-scoped companion，例如 `acp_host_companion`，仅在 `selected_transport=acp_exec` 时存在 | `acp_session_id`、`permission_queue_id`、`terminal_channel_id`、host companion metadata | 不得把这些 ACP-local ids 塞进 shared `session_id`、`AgentSessionRegistry` truth 或 `ProviderContinuationHandle` |
| provider continuation seam | existing continuation contract | `ProviderContinuationHandle` / continuation request-result | provider-native continuation reuse truth only | 不得承载 ACP-local session / permission / terminal ids，不得反向成为 ACP host session truth |
| rollout docs / support consumer | `project-105` rollout-owned adopter surfaces | planned rollout artifacts and evidence packs | packaged distribution evidence、runtime-service enablement evidence、clean-room verify packet、support wording uplift | 不得在 `project-101 / sprint-004` promotion sprint 内宣称这些 consumer-facing outputs已完成 |

## 7. 核心设计与契约影响

1. `agent-onboarding-contract`
   - promotion 后需要 additive 扩展新的 `transport_kind`
   - ACP config / readiness / capability truth 走独立 slot
2. `agent-projection-contract`
   - `selected_transport=acp_exec` 时，应与 `cli_exec` 明确区分
   - replay / diagnostics 不得把 ACP 成功结果写成 `cli_exec`
   - ACP-local companion state 应挂在 projection-owned additive structure，例如 `acp_host_companion`
3. Session / continuation boundary
   - ACP session ids、permission ids、terminal ids 只能是 transport-scoped host protocol companion state
   - 这些 ids 不得复用 `session_id`、不得进入 `AgentSessionRegistry` canonical truth，也不得塞进 `ProviderContinuationHandle`
   - provider continuation 与 shared session truth 继续由现有 runtime contract 负责
4. Packaging / support boundary
   - ACP adapter / host distribution / clean-room verify 需要独立 evidence pack
   - packaged distribution、runtime-service enablement 与 clean-room verify execution 统一后置到 `project-105-acp-host-facing-transport-rollout`
   - support matrix / local adoption playbook 的 uplift 只能在 `project-105` gate clean 后进行

## 8. 风险与权衡

1. ACP 一旦 host-facing，truth slot、support wording、packaging 验证的同步面会明显扩大。
2. 若 transport naming 或 session boundary 不清晰，很容易污染现有 `cli_exec` 与 continuation truth。
3. 若过早 uplift adopter-facing docs，而 verify evidence 还不够，会制造支持口径失真。
4. 若 ACP-local ids 没有被绑定到明确的 transport-scoped companion carrier，promotion 很容易把它们误塞进 shared session 或 provider continuation seam。

## 9. 分阶段落地建议

1. Phase A：定版 ACP transport truth、selection semantics、transport-scoped companion carrier 与 session boundary。
2. Phase B：定版 packaging / clean-room / verify evidence 要求，并明确这些都是 `project-105` rollout 输入而不是 promotion sprint 产物。
3. Phase C：在 `project-105-acp-host-facing-transport-rollout` 中实现 host-facing ACP transport、packaged distribution、runtime-service enablement 与 clean-room verify execution。
4. Phase D：仅在 `project-105` 证据 clean 后 uplift support wording 与 local adoption docs。

## 10. Review / Promotion Handoff

1. 建议 `solution_id`：`technical-solution.acp-host-facing-transport-formalization`
2. 建议 `target_module_ids`：`runtime.agent-projection`
3. 进入 `technical-solution-review` 前需要重点复核的边界：
   - ACP 是否被真正建模为独立 truth，而不是 `cli_exec` 的别名
   - session / continuation / shared-session 边界是否清晰
   - ACP-local ids 是否被绑定到明确的 transport-scoped companion carrier，而不是误落到 shared session / continuation
   - packaging、verify、runtime-service enablement 与 support wording uplift 是否被正确拆到 `project-105` rollout
4. 若后续进入 `technical-solution-promotion`，预期 formal docs 落点：
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/module-overview.md`
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-onboarding-contract.md`
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-projection-contract.md`
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/acp-host-facing-transport-formalization-and-distribution-boundary.md`
   - packaged distribution、runtime-service enablement、clean-room verify execution、`docs/support-matrix.md` 与 `docs/local-adoption-playbook.md` uplift 均只作为 `project-105` rollout input，不进入本轮 `final_paths`
