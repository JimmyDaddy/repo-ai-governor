# Repo AI Governor 标准原生代码评审引擎后续技术方案（Draft）

- Status: draft
- Date: 2026-04-06
- Scope: 标准原生评审规则投影、`deterministic + delegated` 混合评审流水线、finding 来源溯源、`review / review-verify` 契约增强
- Target Module IDs（目标模块）:
  - `runtime.orchestration`
  - `runtime.durable-storage`
  - `runtime.agent-projection`
  - `runtime.cli-interactive-shell`
- Implementation Surfaces（落地表面）:
  - `apps/cli`
  - `packages/standards`
  - `packages/shared`
  - `packages/core-orchestration-service`
- Related（相关输入）:
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/draft/session-main-review-generation-verification-and-ledger-backfill-contract.md`
  - `.repo-ai-governor/draft/scoped-delegated-cr-loop-productization-technical-solution.md`
  - `packages/standards/src/examples/workflow-review-governance-pack.ts`
  - `apps/cli/src/runtime/review/cli-review-finding-generator.ts`
  - `apps/cli/src/constants/cli-review.constant.ts`
  - `.codex/skills/workspace-scoped-cr-loop/SKILL.md`
  - `.codex/skills/workspace-scoped-cr-loop/references/reviewer-subagent-prompt-template.md`

## 1. 目的

这份后续 draft 只聚焦一个明确的产品缺口：

当前 Repo AI Governor 的 code review surface 已经具备 `standards-aware` 能力，但还不是一个真正的 `standards-native code review engine`。

本文件要回答的是：在不推翻现有 review lifecycle baseline 的前提下，如何把这层缺口正式补齐，并沉淀成正式产品能力。

## 2. 当前判断

当前系统实际上已经具备两类不同的 review 能力：

1. 原生 `review / review-verify`
   - 已拥有 canonical `CR-xxx` task-card 生命周期
   - 已能持久化 canonical review artifacts
   - 已能基于一小组 heuristic/risk baseline 生成 deterministic findings
2. `workspace-scoped-cr-loop`
   - 已会强制 delegated reviewer 读取 `code_standards.md`
   - 已会要求 reviewer 在 finding 属于规则命中时引用 repository rules
   - 已在 prompt guidance 中要求 reviewer 把 rule-based findings 与较弱的 risk-based inference 区分开

这意味着当前产品其实已经可以做 standards-aware review，但依赖的是一种混合状态：

1. 原生 deterministic review 只覆盖一小部分 curated heuristic subset
2. delegated review 仍主要依赖 reviewer 按 repository standards 做提示驱动审查

真正缺失的，是一层正式的 review engine，能明确回答：

1. 哪些 repository rules 是可审查的
2. 哪些规则是可 deterministic 执行的
3. 哪些规则必须依赖 model-guided review
4. 当前 finding 到底来自硬规则，还是较软的推断

## 3. 问题定义

缺少这层正式引擎，会让当前 review 体验持续存在 4 个问题：

1. `code_standards.md` 仍然是人类可读的治理文档，但尚未被投影成一份 machine-readable 的 review-rule catalog。
2. 原生 review findings 虽然 deterministic 且可 replay，但覆盖面仍然只是内置的窄子集，而不是更广泛的 repository standards surface。
3. delegated reviewer 的 findings 虽然可以是 standards-guided 的，但还没有被归一到一个共享的 provenance model。
4. `review-verify` 现在可以做 `accepted / rejected / resolved` 决策，但还无法清晰区分：
   - deterministic rule violation
   - standards-guided model finding
   - pure risk observation

## 4. 目标

### 4.1 必须达成

1. 引入一层正式的 review-rule projection layer，把 repository governance inputs 映射成 machine-readable review rules。
2. 保持 review execution 采用混合模式：
   - deterministic rule engine first
   - delegated standards-guided reviewer second
   而不是强行把所有 review 都塞进同一种机制。
3. 扩展 finding contract，让每条 finding 都显式声明自己的来源。
4. 让 `review-verify` 与未来 delegated CR loop 消费同一套 provenance-aware finding model。
5. 保留现有 canonical review artifact 与 `CR-xxx` lifecycle，不额外发明一套平行 review truth surface。

### 4.2 明确非目标

1. 第一阶段不尝试把任意治理 Markdown 自动解析成可执行规则。
2. 第一阶段不要求 `code_standards.md` 中每一条规则都变成 deterministic 可执行检查。
3. 不移除 delegated reviewer inference；目标是把它结构化，而不是禁用它。
4. 不让 `packages/standards` 成为 review execution 的 runtime owner。

## 5. 决策摘要

### 5.1 增加一层评审规则注册表

产品应当引入一层 machine-readable 的 review-rule registry，位于 governance sources 与 review execution 之间。

它的职责不是替代 `code_standards.md`，而是把其中与 review 相关的子集投影成一份结构化 catalog。

推荐输入来源：

1. 从 `code_standards.md` 派生出的 curated rules
2. official standards packs，例如 workflow review governance packs
3. 未来 adopter-local 的 standards bundles

### 5.2 采用混合型评审引擎

review engine 应拆成两段执行：

1. deterministic rule pass
   - 可 replay
   - 速度快
   - 明确锚定显式 rule contracts
2. delegated standards-guided pass
   - 使用 reviewer sub-agent 或 model reviewer
   - 接收 projected rule bundle 与当前 boundary
   - 只负责产出 deterministic checks 尚未完全覆盖的结构化 findings

这样做能保证产品语义是诚实的：

1. 硬规则仍然是硬规则
2. model inference 仍然保留价值
3. 较弱的推断不会被伪装成 deterministic governance failure

### 5.3 让 finding provenance 成为一等字段

每一条 finding 都必须显式声明自己的 source type。

建议最小集合：

1. `deterministic_rule`
2. `standards_guided_inference`
3. `risk_inference`

这是最关键的一条接缝，因为它直接决定：

1. `review-verify` 能否针对不同类型的 findings 采用不同 closure 语义
2. delegated CR loops 能否决定哪些 finding 应走 same-round verify，哪些需要 fresh reviewer recheck
3. reporting 能否展示真实治理覆盖率，而不是一份来源混杂的 finding 列表

### 5.4 保持 canonical truth 不变

canonical truth 仍保持在现有位置：

1. `review/code_review_*`
2. `review/verified_code_review_*`
3. `review/resolved_code_review_*`
4. 配对的 `CR-xxx` task cards

这次 follow-up 改变的是 finding 的生产与分类方式，不改变 review 真值落点。

## 6. 详细设计

### 6.1 有限集合治理

按 `CS-009` 与 `CS-032`，新增的 review-engine 闭集值必须统一沉淀为 enum/constants，而不是以内联 string union 形式散落。

建议最小集合如下：

```ts
enum ReviewRuleExecutionMode {
  DETERMINISTIC = 'deterministic',
  STANDARDS_GUIDED = 'standards_guided',
  MANUAL_ONLY = 'manual_only',
}

enum ReviewFindingSourceType {
  DETERMINISTIC_RULE = 'deterministic_rule',
  STANDARDS_GUIDED_INFERENCE = 'standards_guided_inference',
  RISK_INFERENCE = 'risk_inference',
}

enum ReviewRuleSeverity {
  P0 = 'P0',
  P1 = 'P1',
  P2 = 'P2',
  P3 = 'P3',
}

enum ReviewRuleApplicability {
  ALWAYS = 'always',
  TASK_SCOPE_ONLY = 'task_scope_only',
  WORKING_TREE_ONLY = 'working_tree_only',
  REVIEW_LOOP_ONLY = 'review_loop_only',
}
```

交付约束：

1. shared 或 runtime package constants 负责 machine-readable values
2. CLI/shell/output 层负责本地化映射
3. review artifacts 中持久化 machine-readable values，而不是 UI copy

### 6.2 评审规则注册表

建议引入如下 registry model：

```ts
interface ReviewRuleDefinition {
  ruleId: string;
  semanticKey: string;
  title: string;
  description: string;
  severity: ReviewRuleSeverity;
  executionMode: ReviewRuleExecutionMode;
  applicability: ReviewRuleApplicability[];
  deterministicCheckId?: string;
  standardsSourceRefs: string[];
  enabled: boolean;
}
```

这里的边界必须明确：

1. `code_standards.md` 继续作为 repository-level normative source
2. review-rule registry 只是 projected execution asset
3. registry 必须可以从 normative sources 与 curated mappings 重新构建

这样可以避免 reviewer prompt 继续成为“规范如何落成可执行 review”的唯一载体。

### 6.3 投影策略

第一阶段不适合做通用 Markdown parsing。

更合适的方式是 curated projection：

1. 维护一份显式 mapping file 或 builder
2. 把选中的 `code_standards.md` 规则投影成 `ReviewRuleDefinition`
3. 必要时再补充 official standards-pack rules

推荐第一阶段优先投影的规则：

1. `CS-003` TODO/FIXME/HACK 收口
2. `CS-015` triad sync 约束，适用于评审范围触及 normative docs 的场景
3. `CS-021` task/checklist/CSV 同步约束
4. `CS-026` review lifecycle filename/status sync
5. `CS-033` user-facing i18n 基线
6. `CS-034` 代码变更场景下的 build evidence 要求

这个范围已经足够有产品价值，但又不会大到难以安全落地。

### 6.4 混合型评审执行流水线

建议 runtime pipeline 采用以下顺序：

1. resolve scope
2. load 当前仓库或 profile 对应的 projected review-rule bundle
3. 对 `executionMode=DETERMINISTIC` 的规则执行 deterministic checks
4. 收集尚未覆盖或仅部分覆盖的 standards-guided rules
5. 如果开启 delegated review：
   - 将未覆盖的 rule bundle 传给 reviewer sub-agent
   - 要求返回结构化 finding output
6. 将所有 findings 归一合并
7. 持久化 canonical review artifact

也就是说，delegated reviewer 以后不应只收到一句“去读 `code_standards.md`”。

它应收到：

1. 显式 projected rule bundle
2. 当前 review boundary
3. 已经由 deterministic engine 找到的 findings
4. 仍未覆盖的 rule coverage gaps

### 6.5 finding 契约

建议把当前 finding shape 扩成带 provenance 的结构：

```ts
interface GovernedReviewFinding {
  findingId: string;
  ruleId?: string;
  sourceType: ReviewFindingSourceType;
  executionMode?: ReviewRuleExecutionMode;
  severity: ReviewRuleSeverity;
  title: string;
  file: string;
  line?: number;
  summary: string;
  impact: string;
  suggestedAction: string;
  evidence: string[];
  confidence?: number;
}
```

契约要求：

1. `deterministic_rule`
   - 应包含 `ruleId`
   - 应包含 deterministic evidence
   - 默认不需要 confidence
2. `standards_guided_inference`
   - 应包含 `ruleId`
   - 应包含 evidence 与 confidence
3. `risk_inference`
   - 可以没有 `ruleId`
   - 但必须明确它不是直接规则命中

### 6.6 评审产物渲染

canonical markdown artifact 应显式按 finding 类别分段。

建议至少包含以下三个章节标题：

1. `## Deterministic Rule Findings`
2. `## Standards-Guided Findings`
3. `## Residual Risk Observations`

这样用户立刻能看清：

哪些问题是真正的 governance failure，哪些只是 reviewer 的判断性意见。

### 6.7 `review-verify` 语义

`review-verify` 不应再把所有 findings 视为完全同类。

建议行为：

1. deterministic rule findings
   - 默认要求显式 closure，或显式拒绝并给出理由
2. standards-guided findings
   - 可以 `accepted` 或 `rejected`，但应保留 reviewer rationale
3. risk inference findings
   - 可以更自由地被拒绝，但仍必须保持审计可追踪

这样产品才能在显式治理规则面前保持严格，同时又给 model-based review 保留合理弹性。

### 6.8 delegated reviewer 契约升级

当前 skill prompt 已经要求 reviewer：

1. 引用 standards
2. 把硬 finding 与较弱推断分开

产品化之后，应把这层 prompt guidance 升级成结构化 request contract：

```ts
interface StandardsGuidedReviewRequest {
  scopeSummary: string;
  reviewSurface: string[];
  projectedRules: ReviewRuleDefinition[];
  deterministicFindings: GovernedReviewFinding[];
  uncoveredRuleIds: string[];
}
```

reviewer 输出面应被约束为：

1. 只针对 uncovered rule ids 产出 findings
2. 显式输出较弱 risk observations
3. 不重复转述 deterministic findings

### 6.9 指标与覆盖率

一旦 finding provenance 存在，产品就可以开始输出真实治理覆盖率指标。

建议最小指标：

1. active review rules 总数
2. deterministic coverage count
3. standards-guided coverage count
4. manual-only count
5. findings by source type
6. accepted/rejected by source type

这很重要，因为如果没有这层指标，产品实际上无法诚实回答“当前 code review 到底覆盖了多少 repository governance”。

## 7. 分阶段推进

### Phase A: 规则注册表基线

交付内容：

1. review-rule registry model
2. 第一批可审查 standards subset 的 curated projection
3. 对现有已支持检查项的 deterministic execution hooks

预期结果：

1. 原生 `review` 对一批明确 standards 开始变成显式 standards-backed
2. 当前 built-in heuristics 获得正式 rule identity，而不再只是匿名 heuristic

### Phase B: 溯源感知 finding 模型

交付内容：

1. review findings 中新增 `sourceType` 与 provenance 字段
2. markdown / JSON artifact 更新
3. `review-verify` 按 source type 处理

预期结果：

1. findings 变得 audit-safe
2. 用户能明确分辨硬治理失败与较软的 reviewer judgment

### Phase C: standards-guided delegated review

交付内容：

1. 带 projected rule bundle 的结构化 reviewer request
2. delegated reviewer output normalization
3. deterministic findings 与 delegated findings 的 merge layer

预期结果：

1. `workspace-scoped-cr-loop` 与未来 product-native delegated CR loops 不再依赖 raw markdown-only standards prompts
2. delegated reviewer 成为 review engine 的正式扩展接缝

### Phase D: 覆盖率报告与采用策略

交付内容：

1. coverage metrics
2. adopter-facing 的 standards-backed review coverage reporting
3. 可选 policy：当 deterministic coverage 对当前 scope 不完整时，强制要求 delegated review

## 8. 风险与对策

### 8.1 风险：试图把所有 Markdown 规则都变成自动执行

对策：

1. 明确采用 curated projected rules
2. 保持 projection 可追溯到 normative sources
3. 对尚不支持的规则明确标记为 `standards_guided` 或 `manual_only`

### 8.2 风险：reviewer inference 继续被误当成硬治理失败

对策：

1. 强制 `sourceType`
2. standards-guided finding 强制 `ruleId`
3. artifact 分区展示

### 8.3 风险：deterministic 与 delegated 两段产出重复 findings

对策：

1. 把 deterministic findings 传给 delegated reviewer
2. 要求 delegated output 聚焦 uncovered rules
3. 按 `ruleId + file + line` 去重

### 8.4 风险：standards pack 与 review rule registry 发生漂移

对策：

1. 把 review-rule registry 明确为 projected asset
2. 保留对 standards sources 的 provenance 回链
3. 将这类漂移视为治理债务，而不是继续让 ad-hoc prompts 隐式承载语义

## 9. 验收标准

当以下条件满足时，可认为这份 follow-up 已具备进入 implementation planning 的质量：

1. 后续 implementation stream 可以把本 draft 作为 standards-native CR 演进的设计源。
2. draft 已清楚区分：
   - 当前的 standards-aware review
   - 目标态的 standards-native review engine
3. 提议的 engine 保持现有 canonical CR lifecycle 不变。
4. draft 明确定义了：
   - 一层 rule registry
   - 一条 hybrid review pipeline
   - 一套 provenance-aware finding contract
5. delegated reviewer integration 被产品化为 runtime seam，而不是继续停留在 skill-only 约定。

## 10. 结论

正确的产品方向，不是“把当前 review 全部替换成 AI 去读 standards”，也不是“停留在一小组 heuristic rules 不再前进”。

正确方向应当是：

1. 先把 governance standards 投影成正式 review-rule layer
2. 能 deterministic 的先走 deterministic review
3. 不能完全 deterministic 覆盖的部分，再交给 delegated reviewers 做 standards-guided review
4. 最终把 provenance-aware findings 落回现有 CR lifecycle

这条路，才是从当前 `standards-aware CR` baseline 走向真正 `standards-native code review engine` 的正确演进方向。
