# CLI Exec Compatibility And Stability Productization Technical Solution (Draft)

- Status: draft
- Date: 2026-04-13
- Owner: AI-Agent
- Scope: `runtime.agent-projection / shared native cli_exec compatibility baseline / failure-path regression and release-grade verification`
- Target Modules:
  - `runtime.agent-projection`
- Related Inputs:
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md`
  - `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`
  - `.repo-ai-governor/draft/cli-exec-runtime-hardening-and-explicit-acp-extension-seam-technical-solution.md`
  - `.repo-ai-governor/draft/cli-exec-adapter-launch-authoring-contract-tests-technical-solution.md`
  - `.repo-ai-governor/draft/cli-exec-five-direction-dependency-and-sequencing-analysis-technical-solution.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/module-overview.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-invoke-liveness-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/adapter-health-and-route-probe-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/native-cli-exec-runtime-hardening-and-explicit-acp-extension-seam.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/governance-execution-gates/module-overview.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/governance-execution-gates/contracts/gate-execution-profile-contract.md`
  - `.repo-ai-governor/context/dev/project-098-cli-exec-runtime-rollout/project-098-cli-exec-runtime-rollout-completion-audit-summary.md`
  - `packages/adapter-sdk/src/native-cli-exec-process-runtime.ts`
  - `packages/adapters/codex/src/codex-agent-adapter.ts`
  - `packages/adapters/claude-code/src/claude-code-agent-adapter.ts`
  - `packages/adapters/github-copilot/src/github-copilot-agent-adapter.ts`

## 1. 背景与问题

`project-098-cli-exec-runtime-rollout` 已经完成 shared native `cli_exec` runtime 收敛，并把 `Codex`、`Claude Code`、`GitHub Copilot` 的核心 runtime 路径对齐到了统一的 process owner 上。当前真正剩余的问题，不再是“有没有 shared runtime”，而是：

1. shared runtime 如何进入长期稳定演进，而不是停留在一次 rollout 证据窗口。
2. upstream CLI 的 JSON/text event contract 漂移时，failure path 是否还能稳定保住 launch-aware diagnostics、partial snapshot 与 terminate-phase 语义。
3. 当前 smoke/unit coverage 虽然已经覆盖关键点，但仍偏“按 adapter 文件分散存在”，还没有形成一条 release-grade 的 native `cli_exec` compatibility baseline。

因此，本 draft 聚焦的不是新增 transport，也不是 adopter-facing UX，而是把当前 runtime 收敛成果进一步产品化成长期可维护的稳定性基线。

## 2. 目标

1. 为 shared native `cli_exec` runtime 建立明确的 compatibility case taxonomy。
2. 把现有 failure-path regressions、adapter smoke tests 与 focused verification 收敛成可重复执行的稳定性基线。
3. 让涉及 native `cli_exec` runtime 的后续改动具备更明确的 release-grade 验证门槛。

## 3. 非目标

1. 不在本方案中新增 public transport、support wording 或 adopter-facing onboarding UX。
2. 不把 additive diagnostics consumer productization 与 runtime stability baseline 混成一个方案。
3. 不在本方案中 formalize ACP host-facing transport；ACP 继续留给独立 solution。

## 4. 现状与约束

1. `runtime.agent-projection` 已正式拥有 shared native `cli_exec` process runtime convergence boundary。
2. `agent-invoke-liveness-contract` 与 `adapter-health-and-route-probe-contract` 已明确 shared runtime 只能补共享 lifecycle / launch evidence，不能改写 adapter-owned truth。
3. 当前最真实的残余风险是 malformed output、parse failure、spawn failure、timeout/abort phase transition 等 failure-path regression，而不是 transport truth 缺口。
4. 当前已经存在 targeted tests，但还没有统一命名的 compatibility baseline、scenario/invariant matrix 或 focused verification profile。
5. `project-098` 已经给出可复用的命令级证据，但它们仍停留在 rollout / closeout 证据层，还没有被提升为长期治理真值。

## 5. 方案选项与对比

### 5.1 方案 A：维持当前分散的 smoke / unit coverage

1. 做法：继续依赖各 adapter 与 shared runtime 现有测试，不再单独 formalize stability baseline。
2. 优点：实施成本最低。
3. 缺点：无法把“哪些 failure-path 必须稳定”收敛成长期规则，后续演进容易继续分散。

### 5.2 方案 B：只在发布前加更重的全链路验证

1. 做法：把稳定性问题主要交给 build/check 或更重的 end-to-end verification。
2. 优点：对日常测试结构改动较少。
3. 缺点：问题暴露更晚，且很难把 failure-path owner 显式落到 shared runtime 与各 adapter。

### 5.3 方案 C：建立显式 native `cli_exec` compatibility baseline

1. 做法：为 shared runtime 与 3 个 adapter 建立统一 compatibility taxonomy、failure-path regression pack 和 focused verification profile。
2. 优点：能把当前 rollout 中已经证明重要的稳定性事实长期化。
3. 缺点：需要新增一层测试/验证组织与术语治理。

### 5.4 对比结论

推荐方案 C。  
native `cli_exec` runtime 已经成为正式 shared seam，后续若没有显式的 stability baseline，很容易再次退回“局部修一个 adapter、另一个 adapter 漂移”的状态。

## 6. 推荐方案

1. 建立统一的 native `cli_exec` compatibility case taxonomy，至少覆盖：
   - scenario class:
     - `spawn_failed`
     - `probe_protocol_parse_failed`
     - `invoke_protocol_parse_failed`
     - `non_zero_exit`
     - `signal_exit`
     - `timeout_soft_terminated`
     - `timeout_hard_terminated`
     - `abort_soft_terminated`
     - `abort_hard_terminated`
   - required preserved facts:
     - `launch_diagnostics_preserved`
     - `adapter_launch_truth_projected`
     - `terminate_phase_preserved`
     - `partial_output_preserved_when_available`
2. compatibility taxonomy 不再用单一平铺列表表达，而是固定为 `scenario class x required preserved facts` 的二维矩阵。
3. 把 shared runtime 的 unit tests、adapter smoke tests、probe/invoke focused tests 组织成具名 verification profile，而不是仅按文件自然分散。
4. 对触及 shared runtime、adapter parser failure branch 或 launch-diagnostics projection 的改动，默认按 trigger matrix 执行对应的 focused compatibility verification。
4. 继续保持 additive / non-breaking 边界：本方案只强化稳定性与证据，不提升新的 minimum runtime contract。

## 7. 核心设计与契约影响

1. Shared runtime 需要被视为 stability-sensitive surface；一旦改动 `native-cli-exec-process-runtime` 或对应 adapter failure branches，就应触发 focused compatibility baseline。
2. Compatibility baseline 由 3 层组成：
   - shared runtime lifecycle correctness
   - adapter parse / normalize correctness
   - cross-adapter launch diagnostics preservation correctness
3. Compatibility taxonomy 必须显式区分 `scenario class` 与 `required preserved facts`，避免把 scenario、终态和 invariant 混成一个扁平枚举。

| scenario class | surface | primary owner | required preserved facts | canonical evidence focus |
| --- | --- | --- | --- | --- |
| `spawn_failed` | `probe + invoke` | shared runtime launch path | `launch_diagnostics_preserved`, `adapter_launch_truth_projected` | shared runtime unit tests + adapter smoke tests |
| `probe_protocol_parse_failed` | `probe` | adapter parser + probe normalization | `launch_diagnostics_preserved`, `adapter_launch_truth_projected` | adapter smoke tests for malformed/noisy probe output |
| `invoke_protocol_parse_failed` | `invoke` | adapter parser + liveness projection | `launch_diagnostics_preserved`, `partial_output_preserved_when_available` | invoke smoke tests for malformed runtime output |
| `timeout_* / abort_*` | `invoke` | shared lifecycle observer + adapter semantic-progress callback | `terminate_phase_preserved`, `partial_output_preserved_when_available` | liveness/termination smoke tests |
| `non_zero_exit / signal_exit` | `invoke` | shared runtime exit handling | `launch_diagnostics_preserved`, `adapter_launch_truth_projected` | runtime unit tests + adapter invoke failure smoke tests |

4. `required preserved facts` 的语义固定为：
   - `launch_diagnostics_preserved`：当前 scenario 下仍能保住 `selected_entrypoint`、`request_cancellation_mode` 以及 additive launch diagnostics（如 `shell_wrapped`、`process_tree_policy`、`spawn_error_code`）中本应可见的部分。
   - `adapter_launch_truth_projected`：shared runtime 不得吞并 adapter authored 的 `resolved_entrypoint`、`shell_strategy`、`process_tree_policy`、`request_cancellation_mode`。
   - `terminate_phase_preserved`：timeout / abort 路径必须还能机械投影 `soft / hard` terminate 语义，而不是只剩抽象失败文案。
   - `partial_output_preserved_when_available`：仅在已有 assistant draft / semantic progress 时要求保住 partial snapshot，不把“没有文本可保留”的场景伪装成 regression。
5. `agent-invoke-liveness-contract` 与 `adapter-health-and-route-probe-contract` 本阶段只需要 additive clarification：
   - 哪些 scenario class 必须保住 `terminate_phase`
   - 哪些 scenario class 必须保住 launch-aware diagnostics
   - 哪些 preserved facts 属于 adapter-owned truth 的机械投影，而不是 shared runtime 新生成的 owner truth
6. Focused compatibility verification profile 必须具名、可执行并带 trigger matrix，而不是只保留“跑一些 targeted tests”的口头共识。

### 7.1 Canonical Verification Profiles

1. `cli_exec_compatibility_full`
   - 用途：shared runtime、cross-adapter diagnostics preservation、current consumer projection 的完整基线。
   - Canonical command:
```bash
pnpm exec vitest run \
  packages/adapter-sdk/test/native-cli-exec-process-runtime.unit.test.ts \
  packages/adapter-sdk/test/agent-cli-exec-operations-runtime.unit.test.ts \
  packages/adapters/codex/test/codex-agent-adapter.smoke.test.ts \
  packages/adapters/claude-code/test/claude-code-agent-adapter.smoke.test.ts \
  packages/adapters/github-copilot/test/github-copilot-agent-adapter.smoke.test.ts \
  apps/cli/test/runtime/agent-onboarding-runtime.test.ts \
  apps/cli/test/runtime/adapter-verification-runtime.test.ts \
  apps/cli/test/runtime/adapter-routing-runtime.test.ts \
  apps/cli/test/connect-phase2.integration.test.ts
```
2. `cli_exec_compatibility_runtime_foundation`
   - 用途：只验证 shared runtime 与 3 个 adapter 的核心 failure-path / launch-diagnostics preservation，不要求当前 consumer projection 全量重跑。
   - Canonical command:
```bash
pnpm exec vitest run \
  packages/adapter-sdk/test/native-cli-exec-process-runtime.unit.test.ts \
  packages/adapter-sdk/test/agent-cli-exec-operations-runtime.unit.test.ts \
  packages/adapters/codex/test/codex-agent-adapter.smoke.test.ts \
  packages/adapters/claude-code/test/claude-code-agent-adapter.smoke.test.ts \
  packages/adapters/github-copilot/test/github-copilot-agent-adapter.smoke.test.ts
```
3. `cli_exec_compatibility_adapter_slice`
   - 用途：单 adapter parser / normalization / malformed-output failure branch 变更，且 shared runtime 与 cross-adapter consumer projection 未改动时的最小 profile。
   - Canonical command shape:
```bash
pnpm exec vitest run \
  packages/adapters/<touched-adapter>/test/<touched-adapter>-agent-adapter.smoke.test.ts
```
   - 约束：只有在 `native-cli-exec-process-runtime`、shared launch-diagnostics shaping、`apps/cli` onboarding/verification/routing consumer 均未改动时，才允许降级到该 profile。

### 7.2 Trigger Matrix

| change slice | minimum required profile | why |
| --- | --- | --- |
| `packages/adapter-sdk/src/native-cli-exec-process-runtime.ts` or shared lifecycle/termination logic | `cli_exec_compatibility_full` | shared runtime owner 改动会同时影响 lifecycle truth、launch diagnostics preservation 与 current consumer projection |
| shared launch-diagnostics shaping or `apps/cli` onboarding/verification/routing consumers | `cli_exec_compatibility_full` | 需要确认 preserved facts 没有在当前 consumer surface 上丢失 |
| adapter-owned parser / malformed-output / invoke failure branch for one adapter only | `cli_exec_compatibility_adapter_slice` | 在 shared runtime 与 cross-adapter projection 未变时，只需重跑受影响 adapter 的 canonical failure-path smoke |
| cross-adapter adapter updates in the same window | `cli_exec_compatibility_runtime_foundation` | 需要重跑 shared runtime + 3 adapters 的共同基线，防止跨 adapter drift |
| promotion / closeout claiming native `cli_exec` baseline stayed green | `cli_exec_compatibility_full` | closeout 需要能回链完整 canonical evidence，而不是只保留局部口头结论 |

### 7.3 Evidence Recording Contract

1. 每次执行 compatibility profile，都应把 `profile_id + exact command` 写入当前 sprint 的 `tasks/tasks.csv -> verify`。
2. 当该 profile 被用作 review / closeout / completion 结论依据时，同一条 evidence 还必须出现在 canonical review artifact 或 completion audit 的 `Verification` 段落。
3. 若只执行 `cli_exec_compatibility_adapter_slice`，closeout 文案必须显式说明为什么允许不跑更高 profile，避免把局部 adapter smoke 误写成全基线成功。
4. 若未来要把这些 profile 升格为正式 gate execution truth，而不是 runtime-side guidance，则 promotion 窗口必须同步 `governance.execution-gates` formal docs。

7. 不新增新的 public API、config schema 或 transport truth。

## 8. 风险与权衡

1. 若 compatibility case taxonomy 过细，可能导致测试组织过重。
2. 若 focused verification 触发条件过宽，可能拖慢 adapter 高频迭代。
3. 若 `cli_exec_compatibility_adapter_slice` 被滥用，容易把单 adapter 绿灯误写成全基线健康。
4. 若只 formalize taxonomy、不补 focused verification，仍会停留在“文档知道重要、门禁不知道重要”。

## 9. 分阶段落地建议

1. Phase A：梳理并定名 `scenario class` 与 `required preserved facts`。
2. Phase B：把现有 smoke/unit/focused tests 收敛成 `cli_exec_compatibility_full / runtime_foundation / adapter_slice` 三档 profile。
3. Phase C：定版 trigger matrix，并明确哪些 change slice 允许降级到较小 profile。
4. Phase D：在 closeout / CR evidence 中稳定记录 `profile_id + exact command + result`，让 compatibility baseline 成为可审计真值。

## 10. Review / Promotion Handoff

1. 建议 `solution_id`：`technical-solution.cli-exec-compatibility-and-stability-productization`
2. 建议 `target_module_ids`：`runtime.agent-projection`
3. 进入 `technical-solution-review` 前需要重点复核的边界：
   - compatibility taxonomy 是否真正以 `scenario class x required preserved facts` 覆盖最常见的 failure-path regression
   - focused verification profile 与 trigger matrix 是否足够具体，但不会演变成过重 gate
   - 本方案是否保持 additive，而不是偷偷升级 runtime contract minimum fields
4. 若后续进入 `technical-solution-promotion`，预期 formal docs 落点：
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/module-overview.md`
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-invoke-liveness-contract.md`
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/adapter-health-and-route-probe-contract.md`
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/native-cli-exec-compatibility-and-stability-productization.md`
