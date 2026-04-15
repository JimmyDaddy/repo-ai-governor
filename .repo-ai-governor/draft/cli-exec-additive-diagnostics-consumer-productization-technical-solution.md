# CLI Exec Additive Diagnostics Consumer Productization Technical Solution (Draft)

- Status: draft
- Date: 2026-04-13
- Owner: AI-Agent
- Scope: `runtime.agent-projection / additive launch diagnostics projection to connect doctor report and execution diagnostics consumers`
- Target Modules:
  - `runtime.agent-projection`
- Related Inputs:
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`
  - `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`
  - `.repo-ai-governor/draft/cli-exec-runtime-hardening-and-explicit-acp-extension-seam-technical-solution.md`
  - `.repo-ai-governor/draft/cli-exec-five-direction-dependency-and-sequencing-analysis-technical-solution.md`
  - `.repo-ai-governor/draft/layered-adapter-health-check-and-route-probe-technical-solution.md`
  - `.repo-ai-governor/draft/transport-selection-authority-and-strict-routing-follow-up-technical-solution.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/module-overview.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-onboarding-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/adapter-health-and-route-probe-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/adapter-authored-launch-plan-ownership-and-contract-tests.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/native-cli-exec-compatibility-and-stability-productization.md`
  - `packages/adapter-sdk/src/native-cli-exec-process-runtime.ts`
  - `packages/adapters/claude-code/src/claude-code-agent-adapter.ts`
  - `packages/adapters/github-copilot/src/github-copilot-agent-adapter.ts`

## 1. 背景与问题

当前 shared native `cli_exec` runtime 已经能较稳定地产出 launch-aware diagnostics，例如：

1. implementation carrier 中的 camelCase launch facts：
   - `selectedEntrypoint`
   - `shellWrapped`
   - `processTreePolicy`
   - `spawnErrorCode`
2. formal contract 已经拥有的 snake_case preserved facts 与 additive evidence：
   - `selected_entrypoint`
   - `request_cancellation_mode`
   - `shell_wrapped`
   - `process_tree_policy`
   - `spawn_error_code`

但这些事实目前仍偏实现内使用，并没有在 `connect / doctor / report / execution diagnostics` 之间形成一致的 consumer projection。结果是：

1. 某些 failure-path 上已经保住了 launch truth，但 consumer 侧解释仍不够直接。
2. probe 与 invoke surface 的 preserved facts 原本就不同，若直接压成一套统一 consumer shape，容易把边界重新压扁。
3. implementation 层 camelCase carrier 与 formal contract 的 snake_case vocabulary 之间，还没有被显式写成单向映射规则。
4. 如果 consumer 继续从 stderr 文案或 error message 逆向推断，就会再次制造解释漂移。

因此，本方案关注的不是“把 diagnostics 变成 minimum fields”，而是“如何在不改变 truth 边界的前提下，让 consumer 更稳定地读到它们”。

## 2. 目标

1. 为 launch-aware additive diagnostics 定义统一的 consumer projection 方式。
2. 让 `connect / doctor / report / execution diagnostics` 可以使用同一组 additive launch facts 解释失败或降级原因。
3. 保持这些字段是 additive / optional truth，而不是新的 minimum contract。

## 3. 非目标

1. 不在本方案中新增 transport truth、support wording 或 adopter-facing正式支持声明。
2. 不把 runtime stability baseline、authoring contract tests 或 ACP host-facing formalization 混入本方案。
3. 不把 additive diagnostics 缺失解释为失败，也不把它们升级为 hard minimum fields。

## 4. 现状与约束

1. `adapter-health-and-route-probe-contract` 已明确允许 additive launch diagnostics，但这些字段仍保持 optional。
2. shared runtime 目前已经能在 success / failure path 上保住关键 launch facts。
3. `agent-onboarding-contract` 当前已有 `probe_truth` consumer carrier，但 additive launch evidence 还没有被 formalize 为稳定读取路径。
4. `agent-invoke-liveness-contract` 已单独 formalize invoke-visible preserved facts：`terminate_phase`、`partial_output_preserved` 与 `cancel_mechanism`；本 sprint 不能反向把 invoke contract 改写成新的 launch-diagnostics minimum field surface。
5. consumer 若继续解析自由文本，仍会回到 brittle diagnostics 路径。

## 5. 方案选项与对比

### 5.1 方案 A：继续让 diagnostics 主要停留在 runtime / adapter 内部

1. 优点：实现最省事。
2. 缺点：用户与 adopter 依然很难看懂 failure layer 与 next action。

### 5.2 方案 B：让各 consumer 各自做 presenter 级映射

1. 优点：改动分散，单点风险小。
2. 缺点：很容易再次形成 `connect / doctor / report` 三套解释口径。

### 5.3 方案 C：定义单一 additive launch diagnostics projection

1. 做法：统一 formal canonical projection 与 consumer mapping，先定 probe-side canonical carrier，再让 onboarding / report / execution diagnostics 只读消费同一份 evidence。
2. 优点：保持 truth source 单一，consumer 口径更容易统一。
3. 缺点：需要补一层正式 contract 与 presenter migration。

### 5.4 对比结论

推荐方案 C。  
当前 launch diagnostics 已经存在，最需要的是统一消费，而不是继续放任多个 consumer 分别推断。

## 6. 推荐方案

1. formal canonical truth 继续沿用现有 snake_case contract vocabulary，不把 implementation carrier 的 camelCase 名字直接提升为新的 formal truth：
   - implementation carrier：`AgentCliLaunchDiagnostics`
     - `selectedEntrypoint`
     - `shellWrapped`
     - `processTreePolicy`
     - `spawnErrorCode`
   - formal canonical projection：
     - probe top-level preserved facts：`selected_entrypoint`、`request_cancellation_mode`
     - additive launch evidence：`shell_wrapped`、`process_tree_policy`、`spawn_error_code`
2. `adapter-health-and-route-probe-contract` 继续作为 probe-side launch diagnostics 的 producer truth：
   - `selected_entrypoint` 与 `request_cancellation_mode` 保持 top-level preserved facts
   - `shell_wrapped`、`process_tree_policy`、`spawn_error_code` 继续通过 additive diagnostics/evidence 暴露
3. `agent-onboarding-contract` 只 formalize onboarding/readiness consumer 如何机械消费 probe truth 与 additive launch evidence：
   - `connect / doctor / verify` 不得重新生成第二份 launch truth
   - onboarding payload 只能消费 shared runtime / probe 已经产出的 diagnostics projection
4. invoke / execution diagnostics 在本 sprint 只被描述为 downstream consumer guidance，而不是新的 contract rewrite：
   - `agent-invoke-liveness-contract` 继续拥有 invoke-visible preserved facts
   - 本 sprint 不新增 invoke 侧 minimum fields
   - `report / execution diagnostics` 只能复用已存在的 launch evidence 或 liveness evidence，不得反向定义新的 producer truth
5. 为了避免 consumer 漂移，scenario-to-consumer matrix 固定与 active compatibility baseline 对齐：
   - `spawn_failed`、`probe_protocol_parse_failed`：
     - 必须可读 `selected_entrypoint`、`request_cancellation_mode`
     - 若 shared runtime 已有 evidence，可 additive 暴露 `shell_wrapped`、`process_tree_policy`、`spawn_error_code`
   - `invoke_protocol_parse_failed`、`non_zero_exit`、`signal_exit`：
     - 可作为 downstream diagnostics consumer 读取 additive launch evidence
     - 但不因此新增 invoke minimum field
   - `timeout_soft_terminated`、`timeout_hard_terminated`、`abort_soft_terminated`、`abort_hard_terminated`：
     - 继续以 `terminate_phase` 与 `partial_output_preserved_when_available` 为正式 invoke truth
     - additive launch evidence 只作 explain/diagnostics 补强
6. 字段缺失保持 additive 语义：
   - 缺失不等于失败
   - 缺失不等于 contract violation
   - consumer 只能降级展示，不能据此改写 availability / transport truth

## 7. 核心设计与契约影响

1. `adapter-health-and-route-probe-contract`
   - 明确 probe-side canonical projection 仍使用 snake_case preserved facts + additive diagnostics/evidence
   - 保持 `selected_entrypoint`、`request_cancellation_mode` 为 probe top-level truth
   - 保持 `shell_wrapped`、`process_tree_policy`、`spawn_error_code` additive / optional，不新增 hard minimum
2. `agent-onboarding-contract`
   - 若 `connect` 或 related readiness surfaces 消费 launch diagnostics，应显式声明它们来自 shared runtime / probe truth，而不是 onboarding 自己生成
   - formal consumer carrier 只新增/澄清 onboarding 对 probe truth 与 additive launch evidence 的读取边界
3. reporting / execution diagnostics
   - 统一作为 downstream consumer guidance 存在
   - 本 sprint 不把它们提升为新的 contract producer，也不改写 `agent-invoke-liveness-contract`
   - 不再从 stderr/error message 反推 `selected_entrypoint` 或 `process_tree_policy`
4. 不新增新的 public API、transport config schema 或 support wording。

## 8. 风险与权衡

1. 若 formal canonical naming 没有先钉死，camelCase implementation carrier 与 snake_case contract vocabulary 会并存成两套 truth。
2. 若 launch diagnostics projection 设计过重，会让 additive 字段反向膨胀成隐式 minimum contract。
3. 若 consumer 迁移不完整，短期内可能同时存在老旧字符串推断和新 projection。
4. 若 presenter 写死字段解释，未来新增 additive launch facts 时会再次产生耦合。

## 9. 分阶段落地建议

1. Phase A：定版 implementation carrier -> formal snake_case projection 的单向映射。
2. Phase B：让 `connect / doctor / verify` 通过 `agent-onboarding` + `adapter-health-and-route-probe` 优先消费该 projection。
3. Phase C：让 `report / execution diagnostics` 作为 downstream consumer 复用同一份 evidence，同时继续维持 invoke contract 不扩 scope。
4. Phase D：回收旧的字符串推断路径，保留兼容窗口与 additive 边界。

## 10. Review / Promotion Handoff

1. 建议 `solution_id`：`technical-solution.cli-exec-additive-diagnostics-consumer-productization`
2. 建议 `target_module_ids`：`runtime.agent-projection`
3. 进入 `technical-solution-review` 前需要重点复核的边界：
   - launch diagnostics projection 是否足够统一，而不是只是在多个 consumer 之间复制
   - implementation carrier 与 formal canonical naming 是否被明确拆开
   - 是否严格保持 additive / optional truth
   - 是否避免把 invoke contract、consumer-facing explanation 与 transport / availability truth 混在一起
4. 若后续进入 `technical-solution-promotion`，预期 formal docs 落点：
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/module-overview.md`
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-onboarding-contract.md`
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/adapter-health-and-route-probe-contract.md`
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/shared-launch-diagnostics-projection-and-consumer-surfaces.md`
