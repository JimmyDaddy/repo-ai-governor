# CLI Exec Five-Direction Dependency And Sequencing Analysis Technical Solution (Draft)

- Status: draft
- Date: 2026-04-13
- Owner: AI-Agent
- Scope: `runtime.agent-projection / dependency analysis and recommended sequencing across five cli_exec follow-up drafts`
- Target Modules:
  - `runtime.agent-projection`
- Related Inputs:
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`
  - `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`
  - `.repo-ai-governor/draft/cli-exec-runtime-hardening-and-explicit-acp-extension-seam-technical-solution.md`
  - `.repo-ai-governor/draft/cli-exec-compatibility-and-stability-productization-technical-solution.md`
  - `.repo-ai-governor/draft/cli-exec-additive-diagnostics-consumer-productization-technical-solution.md`
  - `.repo-ai-governor/draft/cli-exec-adapter-launch-authoring-contract-tests-technical-solution.md`
  - `.repo-ai-governor/draft/acp-host-facing-transport-formalization-technical-solution.md`
  - `.repo-ai-governor/draft/cli-exec-onboarding-and-adoption-readiness-productization-technical-solution.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/module-overview.md`

## 1. 背景与问题

当前 `cli_exec` follow-up 已被拆成 5 份独立 draft：

1. native `cli_exec` compatibility and stability productization
2. additive diagnostics consumer productization
3. adapter launch authoring contract tests
4. ACP host-facing transport formalization
5. onboarding and adoption readiness productization

拆分之后，边界更清楚了，但也引入了一个新的协作问题：

1. 这 5 份 draft 是否存在前置依赖。
2. 哪些是“强阻塞依赖”，哪些只是“推荐顺序依赖”。
3. review / promotion 时若不先对齐顺序，容易把 adoption-facing 或 host-facing proposal 推到 runtime baseline 之前，导致 scope 失衡。

因此，需要一份独立 draft 把这 5 个方向之间的依赖关系与建议推进顺序固定下来，供后续 review / promotion 共用。

## 2. 目标

1. 明确 5 份 `cli_exec` follow-up draft 之间的依赖类型。
2. 给出一条可执行的推荐推进顺序，降低 review / promotion 时的优先级歧义。
3. 保证各 draft 保持独立边界，同时共享同一份 sequencing truth。

## 3. 非目标

1. 不把这份分析稿提升为新的 formal runtime contract。
2. 不替代 5 份 draft 各自的独立推荐方案。
3. 不要求 5 份 draft 必须在同一窗口同时 review 或 promote。

## 4. 现状与约束

1. 当前 active solution `technical-solution.cli-exec-runtime-hardening-and-explicit-acp-extension-seam` 已完成 shared native runtime 与 internal-only ACP seam 的 formalization。
2. 5 份 follow-up draft 中，只有一部分面向 runtime foundation，另一部分已经扩展到 consumer-facing adoption 或 host-facing ACP。
3. 若先推进 consumer-facing 或 host-facing方向，而底层 runtime baseline 还未稳定，容易让 external-facing truth 放大实现噪音。
4. 若把 5 份 draft 都视为完全独立，则优先级会失真；但若把它们都视为强阻塞链，又会过度耦合。

## 5. 方案选项与对比

### 5.1 方案 A：把 5 份 draft 视为完全独立

1. 优点：排期灵活。
2. 缺点：会忽略 runtime baseline 与 consumer/adoption 之间的自然先后关系。

### 5.2 方案 B：把 5 份 draft 视为严格串行链

1. 优点：顺序最清楚。
2. 缺点：会把本来可以并行推进的方向也变成不必要的阻塞。

### 5.3 方案 C：区分“主链依赖”“伴随依赖”“独立分支”

1. 做法：把 5 个方向按依赖强度拆成主链、伴随线和独立线。
2. 优点：既能保留关键顺序，也不会人为制造全部串行。
3. 缺点：需要明确哪些依赖是强依赖、哪些是推荐顺序依赖。

### 5.4 对比结论

推荐方案 C。  
当前最合理的依赖表达不是“完全独立”，也不是“全部串行”，而是主链 + 伴随线 + 独立分支。

## 6. 推荐方案

1. `cli-exec-compatibility-and-stability-productization`
   - 作为基础层和主链起点。
   - 先解决 shared runtime compatibility baseline、failure-path regression pack、focused verification profile。
2. `cli-exec-adapter-launch-authoring-contract-tests`
   - 作为 `compatibility/stability` 的 companion guardrail。
   - 与主链起点存在弱依赖或并行关系，但更适合作为其后续或并行配套。
3. `cli-exec-additive-diagnostics-consumer-productization`
   - 对 `compatibility/stability` 存在明显顺序依赖。
   - 因为它消费的是 shared runtime 已经稳定保住的 launch diagnostics。
4. `cli-exec-onboarding-and-adoption-readiness-productization`
   - 对 `additive-diagnostics-consumer` 存在最强依赖。
   - 因为它要在 `connect / doctor / verify / local adoption` 层消费统一 readiness evidence 与 next actions。
5. `acp-host-facing-transport-formalization`
   - 作为独立战略分支。
   - 与前 4 条没有实现上的强阻塞依赖，但共享同一个公共边界前提：ACP 不能伪装成 `cli_exec`。

推荐推进顺序固定为：

1. `compatibility/stability`
2. `adapter launch authoring contract tests`（紧跟或并行）
3. `additive diagnostics consumer`
4. `onboarding/adoption readiness`
5. `ACP host-facing transport formalization`（独立排期）

## 7. 核心设计与契约影响

1. 这份分析稿不新增 runtime contract，只定义 draft 之间的 sequencing truth。
2. 依赖类型固定为 3 类：
   - `foundation`
   - `companion`
   - `independent`
3. 对应映射：
   - `compatibility/stability` = foundation
   - `adapter launch authoring contract tests` = companion to foundation
   - `additive diagnostics consumer` = downstream of foundation
   - `onboarding/adoption readiness` = downstream of diagnostics consumer
   - `ACP host-facing formalization` = independent branch
4. 后续各 draft 的 review / promotion 应引用本分析稿，避免每次重新争论顺序。

## 8. 风险与权衡

1. 若把 `adapter launch authoring contract tests` 错当成完全独立，可能导致 ownership guardrail 晚于 runtime 演进太多。
2. 若把 `additive diagnostics consumer` 推到 `compatibility/stability` 之前，consumer 面会放大底层未收敛噪音。
3. 若把 `ACP host-facing formalization` 误绑定到主链，会让独立 transport proposal 被不必要地延后。
4. 若没有统一 sequencing truth，review 时会不断重复讨论优先级，而不是讨论方案本身。

## 9. 分阶段落地建议

1. Phase A：先 review `compatibility/stability` 与 `adapter launch authoring contract tests`。
2. Phase B：在 runtime baseline 与 ownership guardrail 明确后，再 review `additive diagnostics consumer`。
3. Phase C：在 diagnostics consumer truth 清晰后，再 review `onboarding/adoption readiness`。
4. Phase D：按独立节奏单独推进 `ACP host-facing transport formalization`。

## 10. Review / Promotion Handoff

1. 建议 `solution_id`：`technical-solution.cli-exec-five-direction-dependency-and-sequencing-analysis`
2. 建议 `target_module_ids`：`runtime.agent-projection`
3. 进入 `technical-solution-review` 前需要重点复核的边界：
   - 依赖类型划分是否清晰且没有过度耦合
   - 推荐顺序是否真实反映 foundation 与 consumer-facing 关系
   - ACP 分支是否被正确保持为独立 transport proposal
4. 若后续进入 `technical-solution-promotion`，预期 formal docs 落点：
   - 不直接 promotion 为 formal runtime contract
   - 仅作为后续各 `cli_exec` follow-up solution 的 sequencing reference，在 module overview / ADR planning notes 中被引用
