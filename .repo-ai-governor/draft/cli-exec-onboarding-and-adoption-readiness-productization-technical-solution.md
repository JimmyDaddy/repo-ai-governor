# CLI Exec Onboarding And Adoption Readiness Productization Technical Solution (Draft)

- Status: draft
- Date: 2026-04-13
- Owner: AI-Agent
- Scope: `runtime.agent-projection / cli_exec readiness evidence and adoption troubleshooting loop across connect doctor verify and local adoption`
- Target Modules:
  - `runtime.agent-projection`
- Related Inputs:
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`
  - `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`
  - `.repo-ai-governor/draft/cli-exec-five-direction-dependency-and-sequencing-analysis-technical-solution.md`
  - `.repo-ai-governor/draft/multi-ai-tools-fast-onboarding-technical-solution.md`
  - `.repo-ai-governor/draft/layered-adapter-health-check-and-route-probe-technical-solution.md`
  - `.repo-ai-governor/draft/transport-selection-authority-and-strict-routing-follow-up-technical-solution.md`
  - `.repo-ai-governor/draft/cli-exec-additive-diagnostics-consumer-productization-technical-solution.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/module-overview.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-onboarding-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/adapter-health-and-route-probe-contract.md`
  - `docs/local-adoption-playbook.md`
  - `docs/support-matrix.md`

## 1. 背景与问题

当前 `project-098` 已把 native `cli_exec` runtime 做到更稳定、更 truthful，但“runtime 已收敛”并不自动等于“adopter 已经容易接入”。在接入侧仍然存在一段没有完全闭环的空白：

1. `connect / doctor / verify` 之间的 readiness evidence 还不够统一。
2. 用户即使拿到了更稳定的 diagnostics，也不一定能看到明确、顺序化的 next actions。
3. local adoption 与 support wording 仍需要依赖更清晰的 readiness 证明，而不是只依赖实现层面的绿灯。

因此，本方案关注的是 adoption readiness 闭环，而不是 runtime 本体正确性。

## 2. 目标

1. 为 native `cli_exec` 构建更完整的 readiness evidence chain。
2. 让 `connect / doctor / verify / local adoption` 共享同一套 next-action 与 failure-layer 解释。
3. 把“实现已成熟”进一步转化为“adopter 更容易完成接入与排障”。

## 3. 非目标

1. 不在本方案中 formalize ACP host-facing transport。
2. 不把 docs/support wording uplift 与 runtime correctness 基线混成一个阶段。
3. 不替代 layered health check 或 transport truth 本身；它们仍是前置输入。

## 4. 现状与约束

1. `runtime.agent-projection` 已经拥有 onboarding、route probe、strict transport truth 与 shared native `cli_exec` runtime convergence boundary。
2. `layered-adapter-health-check-and-route-probe` 已经为 install/auth/protocol/route 能力分层诊断提供方向。
3. transport selection truth 正在趋于严格，不能再用隐式 fallback 伪造 adoption success。
4. adoption-facing 闭环如果推进过早，很容易把实现噪音直接暴露给用户。

## 5. 方案选项与对比

### 5.1 方案 A：只补文档与 playbook

1. 优点：文档层推进最快。
2. 缺点：若底层 readiness evidence 还不统一，文档很快会重新漂移。

### 5.2 方案 B：建立 `connect / doctor / verify` 一致的 readiness evidence chain

1. 做法：先让 runtime truth、probe truth、next actions 在接入链路上闭环，再考虑 docs uplift。
2. 优点：更符合先 truth、后 wording 的治理顺序。
3. 缺点：需要同时梳理 connect/doctor/verify 的 consumer responsibilities。

### 5.3 方案 C：立即同步 public adoption docs 与 support wording

1. 优点：adopter 看起来推进更快。
2. 缺点：若 readiness evidence 还不稳，会把文档变成新的噪音源。

### 5.4 对比结论

推荐方案 B。  
adoption readiness 应先建立统一的 evidence chain，再决定哪些内容值得 uplift 到 public adoption docs。

## 6. 推荐方案

1. `connect`
   - 负责表达当前推荐的 tool / transport / route 选择
   - 以 `agent-onboarding-contract` 为 carrier，输出 `enabled_tools[]`、baseline `verification_status`、`diagnostic_summary` 与 `next_action(s)`
   - 不负责伪造“已经 ready”，只提供 baseline config truth、已有 canonical probe evidence 的投影与下一步入口
2. `doctor`
   - 负责 install/auth/protocol/route-capability 分层诊断
   - 以 `adapter-health-and-route-probe-contract` 产出 canonical layered probe facts，再由 `agent-onboarding-contract` 组合成 `verification_status`、`diagnostic_summary` 与明确 `next_action(s)`
   - 消费 additive launch diagnostics，但不得把 additive evidence 升格为新的 minimum fields
3. `verify`
   - 负责证明 same-surface native `cli_exec` path 是否真实可用
   - 继续消费 canonical probe truth 与 additive launch evidence，并对当前显式选择的 same-surface path 产出最终 readiness evidence
   - 在失败时保留 truthful reason，不做隐式 transport rewrite，也不把失败改写成其他 transport success
4. local adoption
   - 只消费 `connect / doctor / verify` 已输出的 canonical onboarding/probe/readiness truth
   - `docs/local-adoption-playbook.md` 只在前面 3 层 evidence 足够稳定后承接 operator runbook uplift
   - `docs/support-matrix.md` 作为 formal support truth，继续后置到独立 rollout/evidence 窗口

### 6.1 Readiness Evidence Chain Matrix

| surface | owner | canonical inputs | emitted readiness facts | allowed next-action behavior | forbidden rewrites |
| --- | --- | --- | --- | --- | --- |
| `connect` | `agent-onboarding-contract` | normalized repo/workspace/user-config truth, explicit tool/transport selection, optional last-known probe snapshot | `enabled_tools[]`, baseline `verification_status`, `diagnostic_summary`, `next_action(s)` | 只组合现有 onboarding truth 与 canonical probe/projection truth，给出 config/auth/install 类入口动作 | 不得把 candidate config 说成 verified readiness；不得静默写入 config/secret；不得把 missing probe evidence 写成 pass |
| `doctor` | probe truth by `adapter-health-and-route-probe-contract`, surface composition by `agent-onboarding-contract` | explicit selected surface/transport, layered probe output, additive `launch_diagnostics` companion | layered `install/auth/protocol/semantic/route_capability` facts, composed `verification_status`, `diagnostic_summary`, `next_action(s)` | 允许 `safe_local` 修复；其余修复动作必须通过显式 `next_action(s)` 输出 | 不得重写 selected transport truth；不得根据 presenter convenience 合成新的 probe truth；不得把 additive launch evidence 升格为 minimum field |
| `verify` | same split as `doctor`, but scoped to same-surface execution proof | explicit selected surface/transport, probe truth, additive launch evidence, same-surface execution result | final same-surface readiness evidence, truthful failure reason, `next_action(s)` | 只对当前显式 path 做可用性证明，并把 remediation action 收口到现有 onboarding action taxonomy | 不得把失败改写为其他 transport/surface success；不得静默 fallback；不得把 docs wording 当成 runtime proof |
| local adoption | adopter-facing consumer only | canonical `verification_status`, `diagnostic_summary`, `next_action(s)`, probe truth, additive launch evidence | operator guidance, troubleshooting order, rollout prerequisites | 只把已有 machine-readable truth 投影为 runbook guidance，并保持与 action taxonomy 对齐 | 不得自行重算 success/support truth；不得新增未经过 contract formalization 的 readiness 字段 |

## 7. 核心设计与契约影响

1. `agent-onboarding-contract`
   - 需要更清晰地区分 baseline config、readiness evidence 与 next actions
   - `verification_status`、`diagnostic_summary` 与 `next_action(s)` 由 onboarding surface 组合输出，但只能消费 canonical onboarding / probe / launch-diagnostics truth
   - 当 `connect / doctor / verify` 需要给出 remediation guidance 时，必须复用现有 action taxonomy，而不是在 adopter docs 中另造第二套动作语义
2. `adapter-health-and-route-probe-contract`
   - 继续作为 `doctor` 与 `verify` 的基础事实源
   - 继续拥有 layered probe truth、reason codes、selected transport truth 与 probe-visible preserved facts
   - 不应被 presenter、自定义 docs consumer 或 support wording 自己替代
3. adoption-facing consumer
   - 必须只消费 canonical onboarding / probe / launch diagnostics truth
   - `docs/local-adoption-playbook.md` 只作为 operator runbook，消费既有 truth 与 `next_action(s)`，不新建 runtime truth
   - 不得根据“看起来能跑”自行构造 success wording
4. docs uplift
   - `docs/local-adoption-playbook.md` uplift 必须放到 readiness evidence 稳定之后
   - `docs/support-matrix.md` uplift 必须进一步后置到 evidence-backed rollout 窗口
   - 不得与 ACP formalization 或 transport uplift 混到同一窗口

## 8. 风险与权衡

1. 若 adoption readiness 与 support wording 提升绑得太紧，会导致 docs 过早前置。
2. 若只加强 diagnostics，不整理 next actions，用户仍然难以完成真实接入。
3. 若 connect/doctor/verify 三者责任边界不清晰，仍会造成 readiness 解释冲突。
4. 若 `verification_status / next_action(s)` 的 ownership 不清晰，promotion 容易把 probe truth、onboarding composition 与 adopter guidance 混成一个模糊层。

## 9. 分阶段落地建议

1. Phase A：明确 `connect / doctor / verify` 的 readiness responsibilities。
2. Phase B：让 `doctor / verify` 消费统一 truth，并以 onboarding contract 组合输出稳定 `verification_status` 与 `next_action(s)`。
3. Phase C：把 `docs/local-adoption-playbook.md` 作为 operator runbook 对齐到 readiness evidence chain。
4. Phase D：在证据稳定后，再评估 `docs/support-matrix.md` 的 support wording uplift。

## 10. Review / Promotion Handoff

1. 建议 `solution_id`：`technical-solution.cli-exec-onboarding-and-adoption-readiness-productization`
2. 建议 `target_module_ids`：`runtime.agent-projection`
3. 进入 `technical-solution-review` 前需要重点复核的边界：
   - readiness evidence 与 next actions 是否真正闭环
   - connect/doctor/verify 的责任边界是否清晰
   - `verification_status / next_action(s)` 是否明确保持为 onboarding-owned composition，而不是 probe 或 docs consumer 自己重算
   - docs uplift 是否被正确后置，而不是抢跑到 truth 之前
4. 若后续进入 `technical-solution-promotion`，预期 formal docs 落点：
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/module-overview.md`
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-onboarding-contract.md`
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/adapter-health-and-route-probe-contract.md`
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/cli-exec-onboarding-and-adoption-readiness-productization.md`
   - `docs/local-adoption-playbook.md` 与 `docs/support-matrix.md` 只作为 rollout follow-up input，不进入本轮 `final_paths`
