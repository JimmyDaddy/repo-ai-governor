# CLI Exec Adapter Launch Authoring Contract Tests Technical Solution (Draft)

- Status: draft
- Date: 2026-04-13
- Owner: AI-Agent
- Scope: `runtime.agent-projection / adapter-authored launch-plan ownership guardrail / shared contract tests for native cli_exec`
- Target Modules:
  - `runtime.agent-projection`
- Related Inputs:
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`
  - `.repo-ai-governor/draft/cli-exec-runtime-hardening-and-explicit-acp-extension-seam-technical-solution.md`
  - `.repo-ai-governor/draft/cli-exec-five-direction-dependency-and-sequencing-analysis-technical-solution.md`
  - `.repo-ai-governor/draft/cli-exec-compatibility-and-stability-productization-technical-solution.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/module-overview.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-invoke-liveness-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/adapter-health-and-route-probe-contract.md`
  - `packages/adapter-sdk/src/native-cli-exec-process-runtime.ts`
  - `packages/adapters/codex/src/codex-agent-adapter.ts`
  - `packages/adapters/claude-code/src/claude-code-agent-adapter.ts`
  - `packages/adapters/github-copilot/src/github-copilot-agent-adapter.ts`

## 1. 背景与问题

shared native `cli_exec` runtime 的一个核心前提是：

`adapter 继续拥有 launch authoring truth，shared runtime 只消费 adapter-authored resolved launch plan。`

当前这一边界已经在 formal docs 中被声明，但保护它的测试仍然比较分散。尤其在 parse failure、spawn failure、probe fallback 等路径上，最容易出现的问题不是 shared runtime 完全坏掉，而是：

1. `resolved_entrypoint`
2. `shell_strategy`
3. `process_tree_policy`
4. `request_cancellation_mode`

这些 adapter-owned truth 在某些路径上不再被机械投影，而是被 shared runtime 或 consumer 侧的逻辑隐式吞并、覆盖或丢失。

因此，本方案关注的是 ownership guardrail，而不是更广义的 adapter test overhaul。

## 2. 目标

1. 为 adapter-authored launch plan 建立统一的 contract tests。
2. 证明 shared runtime 不会反向拥有或篡改 adapter 的 launch authoring truth。
3. 让 probe 与 invoke 两类 surface 对同一 authoring truth 保持一致投影。

## 3. 非目标

1. 不把本方案扩大为所有 adapter 的通用测试重构。
2. 不在本方案中重新定义 runtime contract minimum fields。
3. 不处理 diagnostics consumer productization、ACP host-facing formalization 或 adoption UX。

## 4. 现状与约束

1. formal docs 已明确：
   - adapter 产出 `resolved launch plan`
   - shared runtime 只负责 lifecycle / process ownership / additive launch diagnostics
2. 当前已有 smoke tests 能覆盖部分 launch truth preservation，但它们尚未形成统一的 contract-test harness。
3. 当前最容易回归的路径不是 happy path，而是 malformed output、spawn failure、probe parse failure 与 termination path。

## 5. 方案选项与对比

### 5.1 方案 A：继续依赖现有 smoke tests

1. 优点：改动最少。
2. 缺点：ownership guardrail 仍然是隐式存在，回归信号不够集中。

### 5.2 方案 B：每个 adapter 自己补零散 unit tests

1. 优点：贴近 adapter 本地上下文。
2. 缺点：很难保证 3 个 adapter 覆盖的是同一组 ownership invariants。

### 5.3 方案 C：建立 shared launch-authoring contract-test harness

1. 做法：定义统一 invariants，再由每个 adapter 提供最小 fixture / scenario 对接。
2. 优点：能让 ownership guardrail 变成显式的 shared rule。
3. 缺点：需要先明确 contract-test taxonomy。

### 5.4 对比结论

推荐方案 C。  
当前真正需要 formalize 的不是“再加更多测试”，而是“把哪些 authoring truth 必须被保住”变成共享 contract。

## 6. 推荐方案

1. 定义 shared launch-authoring invariants，但明确拆成两层 truth：
   - adapter authoring truth：
     - `resolved_entrypoint`
     - `shell_strategy`
     - `process_tree_policy`
     - `request_cancellation_mode`
   - surface-visible preserved facts：
     - probe surface：`selected_entrypoint`、`request_cancellation_mode`
     - invoke surface：`terminate_phase`、`partial_output_preserved_when_available`、`cancel_mechanism`
2. shared harness 必须验证两条边界同时成立：
   - shared runtime 只消费 adapter-authored launch plan，不反向重写 authoring truth
   - probe / invoke 只机械投影各自 contract 已声明的 preserved facts，而不是假设两条 surface 拥有完全相同的断言集合
3. 统一 scenario taxonomy 必须同时覆盖 compatibility baseline 已存在的核心 failure-path 与本方案独有的 ownership 场景：
   - `probe_protocol_parse_failed`
   - `invoke_protocol_parse_failed`
   - `spawn_failed`
   - `non_zero_exit`
   - `signal_exit`
   - `timeout_soft_terminated`
   - `timeout_hard_terminated`
   - `abort_soft_terminated`
   - `abort_hard_terminated`
   - `fallback_resolved_entrypoint_projected`
4. 对 probe / invoke 的 harness 断言分别固定为：
   - probe：`resolved_entrypoint -> selected_entrypoint`、`request_cancellation_mode` 保持 mechanical projection；若 shared runtime 同时带出 `shell_wrapped / process_tree_policy / spawn_error_code`，这些仍只作为 additive evidence
   - invoke：`terminate_phase` 与 `partial_output_preserved_when_available` 按 invoke contract 保持真实；`cancel_mechanism` 只能描述 Governor 侧动作；shared runtime 仍不得借 invoke path 改写 adapter-owned `process_tree_policy / request_cancellation_mode`
5. 让 contract tests 成为 shared runtime 演进时的反腐 guardrail，而不是新的 runtime behavior truth source。

## 7. 核心设计与契约影响

1. 建立统一的 contract-test taxonomy，而不是按 adapter 自由发挥：
   - `probe_launch_truth_projected`
   - `invoke_launch_truth_projected`
   - `probe_parse_failure_launch_truth_preserved`
   - `invoke_parse_failure_launch_truth_preserved`
   - `spawn_failure_launch_truth_preserved`
   - `non_zero_exit_launch_truth_preserved`
   - `signal_exit_launch_truth_preserved`
   - `termination_phase_projected`
   - `fallback_entrypoint_projection_preserved`
2. 每个 adapter 只需要提供最小 fixture / scenario 输入，不再自己定义 ownership invariant。最小 I/O 形状固定为：
   - authoring input：adapter-authored `resolved launch plan`
   - scenario selector：probe / invoke + failure-path kind
   - expected projection：probe-visible preserved facts、invoke-visible preserved facts、以及 additive launch evidence expectation
3. terminology bridge 必须固定写清：
   - authoring truth terms：`resolved_entrypoint`、`shell_strategy`、`process_tree_policy`
   - projected fact terms：`selected_entrypoint`、`request_cancellation_mode`、`terminate_phase`、`partial_output_preserved`
   - additive launch evidence：`shell_wrapped`、`process_tree_policy`、`spawn_error_code`
4. `adapter-health-and-route-probe-contract` 与 `agent-invoke-liveness-contract` 仅需 additive clarification：
   - probe contract 负责 launch-authoring truth 在 preflight surface 的 preserved-fact projection
   - invoke contract 负责 terminate / partial-output / cancel-mechanism 在 runtime surface 的 preserved-fact projection
   - `non_zero_exit`、`signal_exit` 与 `fallback_resolved_entrypoint_projected` 必须进入 shared harness，而不是只留在 adapter-local smoke coverage
5. 不新增新的 runtime behavior，只 formalize test governance。

## 8. 风险与权衡

1. 若 contract-test harness 设计过重，会让 adapter 测试维护成本明显上升。
2. 若 invariants 定义过窄，仍可能漏掉最常见的 launch truth 漂移。
3. 若 invariants 定义过宽，容易把 consumer-side presentation 差异误当成 ownership failure。

## 9. 分阶段落地建议

1. Phase A：定版 launch-authoring invariants 与 test taxonomy。
2. Phase B：为 `Codex`、`Claude Code`、`GitHub Copilot` 接入 shared harness。
3. Phase C：将 parse-failure / spawn-failure / termination paths 纳入强制检查。
4. Phase D：把 contract-test evidence 纳入 runtime-sensitive closeout baseline。

## 10. Review / Promotion Handoff

1. 建议 `solution_id`：`technical-solution.cli-exec-adapter-launch-authoring-contract-tests`
2. 建议 `target_module_ids`：`runtime.agent-projection`
3. 进入 `technical-solution-review` 前需要重点复核的边界：
   - invariants 是否真的刻画了 adapter-owned truth，而不是泛化成普通 smoke assertions
   - harness 是否足够 shared，而不是退回每个 adapter 各自维护
   - failure-path coverage 是否覆盖最常见的 launch truth drift
4. 若后续进入 `technical-solution-promotion`，预期 formal docs 落点：
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/module-overview.md`
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-invoke-liveness-contract.md`
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/adapter-health-and-route-probe-contract.md`
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/adapter-authored-launch-plan-ownership-and-contract-tests.md`
