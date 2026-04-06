# Standards-Native Review Engine And Provenance-Aware Governed CR ADR

- Status: active
- Date: 2026-04-06
- Module ID: `runtime.orchestration`
- ADR ID: `adr.runtime.orchestration.standards-native-review-engine.v1`

## 1. Context

当前 Repo AI Governor 的 `review / review-verify` 已经具备 canonical `CR-xxx` 生命周期、review artifact 持久化与一小组 deterministic heuristic findings 生成能力；`workspace-scoped-cr-loop` 也已经验证了“强制 reviewer 阅读 repository standards，并要求区分 hard rule finding 与较弱 risk inference”的高价值路径。

但在产品层，当前 review surface 仍停留在 `standards-aware`，而不是正式的 `standards-native review engine`。主要缺口包括：

1. `code_standards.md` 尚未被投影成 machine-readable review-rule catalog。
2. 原生 deterministic review 只覆盖少量内置 heuristic，无法表达更广泛的 repository governance surface。
3. delegated reviewer findings 还没有统一的 provenance model。
4. `review-verify` 还无法按 finding 来源类型决定不同的 closure 语义。

如果不把这层差距正式化，后续 `scoped delegated CR loop`、`review / review-verify` 与 adopter-facing review reporting 会继续停留在“规则、提示词、启发式检查各说各话”的状态。

## 2. Decision

### 2.1 接受 standards-native review engine 作为正式产品方向

`runtime.orchestration` 正式接受：

1. review engine 不是单一 deterministic checker，也不是纯 prompt-driven reviewer，而是一个受治理的混合评审流水线。
2. 该流水线必须先消费 repository governance inputs 的 projected review-rule bundle，再决定 deterministic pass、delegated pass 与 closure semantics。
3. `review / review-verify`、未来 delegated CR loops 与 report surfaces 应共享同一套 provenance-aware finding model。

### 2.2 固定混合评审流水线

正式顺序固定为：

1. resolve scope
2. load projected review rules
3. execute deterministic checks for explicitly executable rules
4. identify uncovered or partially covered standards-guided rules
5. when delegated review is enabled, dispatch one structured reviewer request
6. normalize and deduplicate findings
7. persist canonical review artifact
8. let `review-verify` apply source-aware closure semantics

其中：

1. deterministic findings 不得被 delegated reviewer 重复转述
2. delegated review 只负责 uncovered standards-guided surface 与显式 risk observations
3. same-round verify 与 fresh reviewer recheck 必须继续区分为两条不同 closure path

### 2.3 固定模块边界

这条方向在跨模块上的正式边界如下：

1. `runtime.orchestration`
   - 拥有 review-rule bundle 的执行顺序、hybrid pipeline、finding dedupe 与 recheck 分叉语义
2. `runtime.durable-storage`
   - 拥有 provenance-aware finding fields、round diagnostics 与 review artifact durable projection 边界
   - 但不得替代 canonical `review/code_review_*`、`verified_code_review_*`、`resolved_code_review_*` 与 `CR-xxx`
3. `runtime.agent-projection`
   - 拥有 standards-guided delegated reviewer request 的 adapter-neutral projection 语义
   - prompt 只是 transport view，不是正式事实源
4. `runtime.cli-interactive-shell`
   - 拥有 provenance-aware review presentation
   - 但不得在本地重新判断 rule coverage、risk tier 或 closure truth

### 2.4 固定 provenance-aware finding taxonomy

每一条 finding 必须显式声明来源类型。

当前正式接受的最小集合为：

1. `deterministic_rule`
2. `standards_guided_inference`
3. `risk_inference`

同时，来源类型属于受 `CS-009` 与 `CS-032` 约束的闭集业务值，必须统一收口到 enum/constants。

### 2.5 固定 canonical truth 不变

本 ADR 不新建平行 review truth surface。

canonical truth 继续保持在：

1. `review/code_review_*`
2. `review/verified_code_review_*`
3. `review/resolved_code_review_*`
4. 配对的 `CR-xxx` task cards

新增的 rule registry、finding provenance 与 round diagnostics 只改变执行和分类方式，不改变治理真值落点。

## 3. Consequences

1. `code_standards.md` 与 official standards packs 需要有一层 curated projection，转成 machine-readable review rules。
2. native `review` 不再只被理解为一组匿名 heuristic checks；后续需要让现有 deterministic findings 获得正式 `ruleId` 与 `sourceType`。
3. delegated reviewer 不再只收到“去读 standards”这类松散提示，而要收到结构化 request，包括：
   - `projectedRules`
   - `deterministicFindings`
   - `uncoveredRuleIds`
   - 当前 review boundary
4. `review-verify` 后续必须按来源类型处理 closure：
   - deterministic rule findings 默认更严格
   - standards-guided findings 保留 reviewer rationale
   - risk findings 保持可审计但允许更自由 reject
5. reporting 与 future clients 后续可以输出真实治理覆盖率，而不是一份来源混杂的 finding 列表。
6. 这是一条 active formal direction，不等于实现已经完成；实际产品化仍由 follow-up stream 承接。

## 4. Boundary Clarifications

### 4.1 这不是“全部改成 AI reviewer”

正确方向不是用 delegated reviewer 替代 deterministic review，而是：

1. 能 deterministic 的先 deterministic
2. deterministic 覆盖不到的，再交给 standards-guided reviewer
3. 较弱 inference 必须显式标识，不能伪装成硬规则失败

### 4.2 这不是“把 standards markdown 自动执行到底”

第一阶段只接受 curated projection。

也就是说：

1. `code_standards.md` 继续是 normative source
2. projected registry 是 execution asset
3. registry 必须能从 normative sources 与 curated mappings 重建

### 4.3 review lifecycle 仍是一条链，而不是两套系统

`review / review-verify` 与未来 delegated CR loop 必须继续被视为同一治理闭环。

因此：

1. same-round verify 继续推进同一轮 artifact 的状态
2. 需要 fresh reviewer recheck 时，必须进入新一轮 review round
3. provenance-aware finding model 只增强闭环语义，不拆出第二套 lifecycle

## 5. Implementation Handoff

本 ADR 对应的正式 follow-up delivery 为：

1. review-rule registry baseline
2. provenance-aware governed findings
3. standards-guided reviewer handoff normalization

具体实施由 `project-057-standards-native-review-engine-productization` 承接。

## 6. Source Anchors

1. `.repo-ai-governor/draft/standards-native-code-review-engine-follow-up-technical-solution.md`
2. `.repo-ai-governor/draft/session-main-review-generation-verification-and-ledger-backfill-contract.md`
3. `.repo-ai-governor/draft/scoped-delegated-cr-loop-productization-technical-solution.md`
4. `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
5. `.codex/skills/workspace-scoped-cr-loop/references/reviewer-subagent-prompt-template.md`
