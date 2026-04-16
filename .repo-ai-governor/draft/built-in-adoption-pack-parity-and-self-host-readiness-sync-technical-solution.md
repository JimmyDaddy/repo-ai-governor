# Built-In Adoption Pack Parity And Self-Host Readiness Sync Technical Solution (Draft)

- Status: draft
- Date: 2026-04-15
- Owner: AI-Agent
- Scope: `runtime.governance-clients / packages/standards built-in adoption pack parity model, generated sync path, and self-host placeholder readiness guidance`
- Target Modules:
  - `runtime.governance-clients`
- Related Inputs:
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/module-overview.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/governance-adoption-pack-install-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/adoption-pack-installer-and-self-host-template-bootstrap.md`
  - `AGENTS.md`
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
  - `packages/standards/src/built-in-adoption-pack-catalog.ts`
  - `packages/standards/src/adoption-pack-registry.ts`
  - `packages/standards/src/agents-projector.ts`
  - `packages/standards/src/rule-renderer.ts`
  - `packages/standards/src/standards-runtime-loader.ts`
  - `apps/cli/src/runtime/adoption-pack-runtime.ts`

## 1. 背景与问题

当前仓库已经具备把治理能力安装到其他仓库的正式 installer 能力，built-in adoption pack 的 canonical 定义位于 `packages/standards/src/built-in-adoption-pack-catalog.ts`，pack id 是 `repo-ai-governor-adoption-pack`。`adopt list/apply/diff/verify/upgrade/remove` 这条安装链路仍然可用，相关集成测试也仍然通过。

但这次用户提出的问题不是“installer 能不能跑”，而是更关键的一层：`packages/standards` 下面内置的 pack 内容、self-host 模板面、workflow 投影，是否还和当前仓库真实在执行的治理模型保持一致。

结论是：

1. 安装机制本身仍然健康。
2. 内置 pack 的内容层已经出现明显漂移。
3. 漂移主要不是 contract 错了，而是 pack 内容主要靠手写字符串维护，只要仓库治理模型继续演进，就很容易落后。
4. 同时还要明确一个边界：`self-host-complete` 写出的 repo-specific authoring docs 本来就不该照搬源仓库内容。除了 `code_standards.md` 和 `long-term-maintenance-guide.md`，还包括产品需求、技术方案、项目/迭代计划等面向目标仓库自身的治理文档；这些 surface 应由 adopter 仓库自己补齐，而不是复制当前源仓库的真实内容。

因此，本方案解决的不是“把源仓库一比一镜像到 adopter 仓库”，而是：

1. 哪些 surface 必须和当前仓库治理真值保持同步。
2. 哪些 surface 只能保持结构同步但内容应为空白模板。
3. 哪些 surface 应故意保留为 adopter-owned placeholder。
4. 系统如何在 `self-host-complete + repo_local` 这类已 seed repo-local authoring surface 的场景下，识别“你还没把占位文档换成目标仓库自己的真实内容”，并给出合适提示或阻断。

## 2. 目标

1. 给出当前 built-in adoption pack 与本仓库治理模型之间的清单式差异盘点。
2. 定义一套长期可维护的“pack 与仓库治理模型对齐”机制，避免继续依赖手工拷贝字符串追版本。
3. 明确区分 `exact sync`、`template seed`、`adopter-owned placeholder` 等不同对齐等级，避免过度同步。
4. 保持 `self-host-complete` 的正确边界：允许写出 repo-specific governance/product/plan starter docs，但只在 `self-host-complete + repo_local` 或已检测到 self-host authoring surface 的场景下检查这些文档是否仍停留在占位态。
5. 保持现有 installer contract、receipt、managed ownership 与 `template bootstrap != live-state clone` 的正式边界不变。

## 3. 非目标

1. 不把当前源仓库的 live execution state、project/sprint/task/review 历史直接复制到 adopter 仓库。
2. 不把当前源仓库正在执行的完整 `code_standards.md`、`long-term-maintenance-guide.md`、产品需求、技术方案或执行计划强行同步到其他仓库。
3. 不替换现有 `adopt apply` / `adopt verify` installer lifecycle，也不发明第二套安装真值。
4. 不要求 adopter 仓库必须预先存在 `.codex/skills/**` 或与本仓库完全一致的 repo layout。
5. 不在本方案里顺手解决所有 installer convenience UX；例如一键 `adopt bootstrap` 仍由独立 draft 承接。

## 4. 现状与约束

1. `contract.runtime.adoption-pack-install.v1` 已明确：
   - `self-host-complete` 只能在显式 `workspace_mode=repo_local` 下使用。
   - installer 只能 seed template-backed canonical surface。
   - 不允许复制 live-state snapshot。
2. 当前仓库默认启动基线已经变化，`L0 + default_load=true` 现在至少包括：
   - `current-context.md`
   - `normative-loading-manifest.yaml`
   - `product-requirements-brief.md`
   - `code_standards.md`
   - `long-term-maintenance-guide.md`
3. 当前仓库的 repo-local workflow catalog 已经显式依赖：
   - `technical-solution-drafting`
   - `technical-solution-review`
   - `technical-solution-promotion`
   - `workspace-task-decomposition`
   - `workspace-code-review-workflow`
   - `workspace-scoped-cr-loop`
   - `workspace-delivery-finisher`
4. 当前 self-host runtime / built-in pack 实际已经会写出多类 starter surface：
   - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
   - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`
   - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
   - `.repo-ai-governor/context/dev/project-template/plan.md`
   - `.repo-ai-governor/context/dev/project-template/sprint-template/plan.md`
   - `.repo-ai-governor/context/dev/project-template/sprint-template/tasks/checklist.md`
   - `.repo-ai-governor/context/dev/project-template/sprint-template/tasks/tasks.csv`
   - `.repo-ai-governor/context/dev/project-template/sprint-template/tasks/TK-001-template-task.md`
   其中前两类规范文档与后面的产品/执行计划 starter docs 都是正确的 placeholder 行为，不应被当成 drift bug。
5. `packages/standards` 已经存在可复用的 projection / render primitive，例如：
   - `AgentsProjector`
   - `RuleRenderer`
   - `StandardsRuntimeLoader`
   它们说明“从 canonical source 生成 projection”在仓库里已有实现方向，不必继续靠手工维护大段字符串。
6. 这些 repo-specific starter docs 的 readiness interlock 只应属于 `self-host-complete + repo_local` 路径。
   - 默认 `adopter-complete` 仍是 adopter-facing install path，不应因为缺少 repo-local governance/product/plan docs 而被 `warn` 或 `fail_closed`。

### 4.1 当前差异清单

| 检查项 | 当前仓库真值 | built-in pack 现状 | 结论 |
| --- | --- | --- | --- |
| installer 链路 | `adopt list/apply/diff/verify/upgrade/remove` 已 formalize 且测试通过 | registry + runtime + CLI 集成测试仍可用 | 机制仍健康 |
| `self-host` `current-context.md` 模板 | 当前 schema 已包含 `Stream / Docs / Plan / Tasks / Checklist / CSV / Review` | 仍使用旧字段 `Project / Sprint / Docs root / Task records / Review records` | 明显漂移 |
| `self-host` `normative-loading-manifest.yaml` 模板 | 当前默认 `L0` 已加载 5 个基线输入 | 仅种下极简 manifest，基本只含 `current_context` 与 manifest 自身 | 明显漂移 |
| repo-local workflow catalog | `AGENTS.md` 已纳入 `technical-solution-drafting`、`workspace-task-decomposition` 等新技能 | built-in workflow records 仍只有 6 条，缺少上述两个技能 | 明显漂移 |
| self-host governance template 集 | 当前治理流已依赖 draft、execution-stream、project-plan、sprint-plan、task-card、task-ledger contract 等模板 | built-in self-host 仅提供少量 README / plan / task 占位文件，未覆盖上述模板集合 | 明显漂移 |
| repo-specific authoring docs | 产品需求、技术方案、长期治理规则、项目/迭代计划都应由 adopter 仓库自己定义 | 目前 draft 对 placeholder 讨论过窄，只强调了 `code_standards` 与 `long-term-maintenance-guide` | 需要扩大为一整类 adopter-owned placeholder |
| `code_standards.md` / `long-term-maintenance-guide.md` | 应为 adopter 仓库自行定义的 repo-specific 规范 | runtime 写出占位版 draft 文本 | 这是正确的有意差异，不是 bug |
| pack authoring 模式 | 当前 pack 内容主要定义在 `built-in-adoption-pack-catalog.ts` 大量字符串字面量中 | 与源仓库治理模型的同步只能靠人工维护 | 结构性漂移风险高 |

## 5. 方案选项与对比

### 5.1 方案 A：继续手工维护内置 pack

1. 方案描述：
   - 继续在 `built-in-adoption-pack-catalog.ts` 中手写 workflow records、template records 与 self-host 模板。
   - 每次仓库治理模型变化时，再人工回补 pack。
2. 优点：
   - 改动最小。
   - 不需要定义新的 parity model。
3. 缺点：
   - 当前漂移已经证明这种方式会持续失效。
   - 很难明确“哪些该同步、哪些不该同步”。
   - review 时也缺少机器可检的 drift gate。

### 5.2 方案 B：把当前仓库治理面完整镜像到 self-host pack

1. 方案描述：
   - 尽量把当前仓库里的治理文档、模板、技能、规范全文完整复制进 built-in pack。
2. 优点：
   - 概念上最简单，看起来“最一致”。
   - 一次性补齐内容较快。
3. 缺点：
   - 违反 `self-host-complete` 的真实边界：template bootstrap 不等于 live-state clone。
   - 会错误地把当前仓库自己的 repo-specific governance/product/plan docs 强行投到 adopter 仓库。
   - adopter 仓库和源仓库治理模型并不总是应完全一致。

### 5.3 方案 C：建立“显式对齐分层 + 生成式 pack source catalog + readiness 检查”

1. 方案描述：
   - 为 built-in pack 定义显式 parity class。
   - 将必须同步的 surface 从 canonical source 生成，或至少建立 source-ref + drift 检查。
   - 将 repo-specific governance docs、product/technical-direction docs 与 execution starter docs 明确定义为 adopter-owned placeholder。
   - 在 init / verify / governed execution 前检查这些占位内容是否仍未被替换，并给出 warn 或 fail-closed 提示。
2. 优点：
   - 能同时解决“该同步的漂移”和“不该同步的越权镜像”。
   - 更符合现有 installer contract 的正式边界。
   - 为后续 CI drift gate、clean-room rollout 和 docs truthfulness 提供可验证模型。
3. 缺点：
   - 实现复杂度高于继续手工维护。
   - 需要定义新的分类、检查规则和测试矩阵。

### 5.4 对比结论

推荐方案 C。

原因：

1. 这次问题的本质不是“某几个文件忘了更新”，而是缺少一个长期可维护的对齐模型。
2. 方案 A 只会重复今天的漂移问题。
3. 方案 B 会把 repo-specific governance 误同步到 adopter 仓库，尤其会破坏 placeholder 标准文档的正确边界。
4. 方案 C 同时满足“需要同步的要同步”和“用户自己应该填的不能替他填”这两个目标。

## 6. 推荐方案

### 6.1 总体结论

本方案建议把 built-in adoption pack 的内容分成四类，并分别治理：

| parity class | 说人话 | 典型例子 | 对齐策略 |
| --- | --- | --- | --- |
| `exact_sync` | 结构必须跟当前仓库治理模型保持一致 | `current-context` schema contract、`normative-loading-manifest` startup baseline contract | 直接从 canonical source 派生或建立严格 drift gate；必要时把实例值与结构同步拆开 |
| `generated_projection` | 内容可以投影，但不该长期手写 | workflow skill records、部分安装说明与 host-facing projection 文案 | 由 source metadata / skill source 自动生成 |
| `template_seed` | 结构要跟当前治理流一致，但内容应为空白或模板 | `task-card-template.md`、`project-plan-template.md`、空白 registry、README index | 保持结构同步，但仍输出空白/模板化 surface |
| `adopter_owned_placeholder` | 可以先给 starter 内容，但真实内容必须由 adopter 自己写 | `code_standards.md`、`long-term-maintenance-guide.md`、`product-requirements-brief.md`、未来的 `product-requirements.md`、repo-level 技术方案、`project-template/plan.md`、`sprint-template/plan.md`、seeded `TK-001`/`tasks.csv`/`checklist.md` | 保持占位行为，靠 readiness 检查提醒或阻断 |

### 6.2 为 built-in pack 增加 machine-readable source catalog

推荐在 `packages/standards` 中新增一层 source catalog，作为 `built-in-adoption-pack-catalog.ts` 的上游输入，而不是继续把 pack 本体当成大号字符串仓库。

建议该 source catalog 至少表达：

1. `relative_path`
2. `profile_ids`
3. `asset_group`
4. `parity_class`
5. `source_mode`
6. `source_ref`
7. `readiness_policy`
8. `applicability_scope`
9. `composition_policy`

其中 `source_mode` 可先从以下几类开始：

1. `repo_file_sync`
   - 适用于 `exact_sync`
   - 仅适用于“整文件本身就是 template-safe source”的面
   - 例如 `technical-solution-draft-template.md`、`execution-stream-scaffold-template.md`、`task-card-template.md`
2. `structured_template_projection`
   - 适用于“结构必须对齐，但实例值必须是 starter placeholder”的面
   - 例如 `current-context.md`、`normative-loading-manifest.yaml`
   - 这类面必须把 `schema/sections/default keys` 与 `starter instance values` 分开生成，禁止 whole-file sync
3. `generated_projection`
   - 适用于 workflow assets、skill summary、AGENTS-facing 投影等
   - 可复用 `AgentsProjector`、`RuleRenderer`、`StandardsRuntimeLoader` 的既有思路
4. `template_seed`
   - 适用于 project/sprint/task/technical-solution authoring 模板
   - 输出 blank/template surface，而不是复制真实执行痕迹
5. `adopter_placeholder`
   - 适用于 repo-specific governance/product/plan authoring docs
   - 显式声明“允许占位，但需要后续 readiness 检查”

这样 `built-in-adoption-pack-catalog.ts` 将退化为“装配 manifest + 解析 source catalog + 输出 pack definition”，而不是继续手工维护所有最终文本。

其中有两个实现约束需要直接写死：

1. `current-context.md` 不得作为 `repo_file_sync` 处理。
2. `normative-loading-manifest.yaml` 即便来自当前仓库，也只能以“筛选后的 startup-baseline projection”进入 self-host template，而不能把当前仓库整份 manifest 无条件原样同步进去。

### 6.3 需要先补齐的首批对齐面

建议 Phase A 至少先补齐下面这批高优先级 surface：

1. `self-host` `current-context.md`
   - 跟随当前 repo schema 更新到 `Stream / Docs / Plan / Tasks / Checklist / CSV / Review` 结构
2. `self-host` `normative-loading-manifest.yaml`
   - 对齐当前默认 `L0 + default_load=true` 基线
3. repo-local workflow / skill projection
   - 至少补齐 `technical-solution-drafting`
   - 至少补齐 `workspace-task-decomposition`
4. self-host governance template 集
   - 补齐当前 repo workflow 已显式依赖的模板入口
   - 包括 `technical-solution-draft-template`
   - 包括 `execution-stream-scaffold-template`
   - 包括 `project-plan-template`
   - 包括 `sprint-plan-template`
   - 包括 `task-card-template`
   - 包括 task-ledger single-write-source contract 入口

### 6.4 repo-specific authoring docs 的正确处理方式

这里需要明确把范围扩大，不只限于 `code_standards.md` 与 `long-term-maintenance-guide.md`。

当前 self-host 语义里，至少有三类内容不应照搬源仓库：

| 类别 | 典型文件 | 为什么不能照搬 |
| --- | --- | --- |
| repo-specific governance rules | `code_standards.md`、`long-term-maintenance-guide.md` | 每个 adopter 仓库的工程规范、维护策略都不同 |
| repo-specific product / architecture authoring docs | 已有的 `product-requirements-brief.md`，以及未来可能 seed 的 `product-requirements.md`、repo-level overall technical solution、architecture/layering docs、技术方案草稿 | 这些文档描述的是目标仓库自己的产品目标和技术方向，不应复制当前源仓库的 north star |
| repo-specific execution starter docs | `project-template/plan.md`、`sprint-template/plan.md`、`checklist.md`、`tasks.csv`、`TK-001-template-task.md` | 这些只是起步脚手架，真实项目、迭代、任务计划必须由 adopter 自己建立 |

因此需要明确写死边界：

1. `self-host-complete` 继续写出这类 repo-specific starter docs 的占位版，是正确行为。
2. `product-requirements`、技术方案、项目/迭代计划等 repo-specific authoring docs 同样不应与当前源仓库做全文精确同步。
3. 不同 adopter 仓库应自己定义适合自己的规范、产品目标、技术方向与执行计划。
4. `self-host` 允许 seed 这些文件的 starter 版本，但这些 starter 只能承担“提示你该自己补什么”的作用，不能冒充目标仓库的正式真值。

但系统必须补上“你还没填真实值”的 readiness 感知能力。

先把适用域写死：

1. 下述 readiness 检查只在以下任一条件成立时启用：
   - install receipt 显示当前仓库采用 `self-host-complete`
   - `workspace_mode=repo_local` 且 bootstrap action 已 seed self-host authoring surface
   - 仓库内已检测到 self-host template bootstrap surface，且调用的是 self-host authoring / execution path
2. 默认 `adopter-complete` 不启用 `governance_rules_ready`、`product_direction_ready`、`execution_surface_ready` 这三组 interlock。
3. 普通 adopter path 最多只接受 installer parity / managed ownership / host verify 这类通用检查，不得因为缺少 repo-local governance docs 而进入 `fail_closed`。

建议把 readiness 检查拆成三组，而不是只盯两个文件：

| readiness group | 适用域 | 检查对象 | 建议行为 |
| --- | --- | --- | --- |
| `governance_rules_ready` | 仅 `self-host-complete + repo_local` 或已检测到 self-host governance surface | `code_standards.md`、`long-term-maintenance-guide.md` | `adopt apply/init/doctor/verify` 阶段 `warn`；高风险 unattended execution `fail_closed` |
| `product_direction_ready` | 仅 `self-host-complete + repo_local` 或已进入 self-host authoring path | `product-requirements-brief.md`，以及未来的 `product-requirements.md`、repo-level technical solution / architecture starter docs | 初期 `warn`；进入持续 self-host authoring / promotion 流程前至少应显式确认 |
| `execution_surface_ready` | 仅 `self-host-complete + repo_local` 或已进入 self-host execution path | `current-context` 中的 template 值、`project-template/plan.md`、`sprint-template/plan.md`、seeded `checklist/tasks.csv/TK-001` | 进入真实 plan/run/review 前 `warn`；若仍停留在 template 标识，则对自动执行 `fail_closed` |

这里还要补一个关键细节：

1. 有些 surface 是“文件结构要精确同步，但文件内容里的 starter 值是 placeholder”。
2. 最典型的例子就是 `current-context.md`。
3. 它的字段 schema 应属于 `exact_sync`，但其中的 `project-template`、`sprint-template`、空路径或 starter note 又应被视为 adopter-owned placeholder。
4. 因此 readiness 判断不能只按“文件路径分类”，还要允许“同一文件，结构与实例内容分开判断”。
5. source catalog 需要允许同一路径同时声明：
   - `structure_source_ref`
   - `instance_source_mode`
   - `instance_placeholder_policy`

placeholder 检测不应追求“自动判断你写得够不够好”，而应先解决“默认占位版是否还没被替换”这个问题。

建议检测顺序：

1. 先做 exact fingerprint 匹配
   - 若文件内容仍与 built-in placeholder 完全相同，则直接判定为 `placeholder_exact_match`
2. 再做轻量启发式匹配
   - 例如仍保留 `1970-01-01`、默认 Purpose 文案等强信号
3. 最终输出 readiness state
   - `placeholder_exact_match`
   - `template_like`
   - `customized`

### 6.5 增加 parity tests 与 drift gate

为避免这个问题再次回归，建议把下列检查做成自动化：

1. `current-context` schema parity test
2. `normative-loading-manifest` startup baseline parity test
3. skill catalog parity test
4. self-host governance template coverage test
5. placeholder policy test
   - 验证 `code_standards.md` / `long-term-maintenance-guide.md` 仍然是 placeholder seed
   - 验证 `product-requirements-brief.md`、starter plan/task docs 也被归类为 adopter-owned placeholder，而不是 source mirror
   - 验证它们没有被错误替换成当前源仓库的完整规则、真实计划或真实技术方案
6. readiness detection test
   - 验证 placeholder 会触发 `warn`
   - 验证 customized 内容不会被误判
7. applicability-scope test
   - 验证默认 `adopter-complete` 不会触发 self-host readiness warnings
   - 验证只有 `self-host-complete + repo_local` 或已检测到 self-host surface 时，才启用三组 readiness interlock

## 7. 核心设计与契约影响

1. `packages/standards`
   - 新增 built-in pack source catalog 与 parity class model
   - `built-in-adoption-pack-catalog.ts` 改为基于 source catalog 装配 manifest / workflow / templates
2. `apps/cli`
   - 在 `adoption-pack-runtime` 与相关 workflow 入口增加 readiness 检查
   - 检查结果应进入 verify / bootstrap summary / execution preflight，而不是散落在临时 console copy 中
   - readiness check 必须先判定 `applicability_scope`，避免把 self-host interlock 外溢到普通 adopter path
3. `runtime.governance-clients`
   - 继续拥有 adoption-pack installer 与 self-host bootstrap 的正式边界
   - 新增的是“parity + readiness policy”，不是新的 installer truth
   - 该 policy 需要覆盖 repo-specific governance docs、product/technical-direction docs 与 execution starter docs，而不只覆盖两个规范文件
4. `contract.runtime.adoption-pack-install.v1`
   - 原则上可先不升版本
   - promotion 时若要正式化 parity class 或 `adopter_owned_placeholder` 语义，可在现有 contract 中做 additive 约束扩写
5. docs / consumer surfaces
   - `README.md`、`docs/local-adoption-playbook.md`、`docs/support-matrix.md` 需要补充说明：
     - self-host 会 seed placeholder governance docs、product/technical-direction docs 与 execution starter docs
     - 这些 placeholder 都需要 adopter 自行补齐
     - 未补齐时某些工作流只会 warn，某些高风险执行会 fail-closed

## 8. 风险与权衡

1. 若把过多 surface 定义成 `exact_sync`，会把 pack 变成源仓库的镜像分发器。
   - 缓解：只对结构性、生命周期关键的 surface 做 `exact_sync`。
2. 若 placeholder 检查过于严格，可能误伤刚开始初始化的 adopter 仓库。
   - 缓解：先区分 `warn` 与 `fail_closed`，仅在 unattended 或高风险执行时阻断。
   - 额外边界：默认 `adopter-complete` 不进入 self-host readiness interlock。
3. 若 source catalog 设计过重，会让 pack 维护复杂度短期上升。
   - 缓解：Phase A 先覆盖最容易漂移、对使用影响最大的几类 source。
4. 若仍允许部分内容继续手工写在 catalog 里，drift 仍可能反复出现。
   - 缓解：review 中明确哪些 surface 允许暂时手工维护，哪些必须迁移到 generated/source-ref 模式。
5. 若 readiness 只做“是否还是默认占位”检查，不能保证用户已经写出高质量规范、产品方向或执行计划。
   - 缓解：本方案只解决最低限度就绪感知，不声称自动评估内容质量。

## 9. 分阶段落地建议

1. Phase A
   - 建立 drift inventory 与 parity class
   - 补齐 `current-context`、`normative-loading-manifest`、skill catalog 的第一批高优先级对齐
   - 增加 placeholder readiness warn
   - 增加对应 tests
2. Phase B
   - 引入 machine-readable source catalog
   - 把主要 built-in workflow/template surfaces 迁移为 generated/source-ref 驱动
   - 补齐 self-host governance template coverage
3. Phase C
   - 增加 CI drift gate
   - 将 readiness 检查接入更多 governed execution 入口
   - 评估是否对 unattended execution 默认提升为 fail-closed

## 10. Review / Promotion Handoff

1. 建议 `solution_id`：`technical-solution.built-in-adoption-pack-parity-and-self-host-readiness-sync`
2. 建议 `target_module_ids`：`runtime.governance-clients`
3. 进入 `technical-solution-review` 前需要重点复核的边界：
   - 哪些 surface 属于 `exact_sync`，哪些只能是 `template_seed`
   - repo-specific governance docs、product/technical-direction docs 与 execution starter docs 是否已经被明确保留为 adopter-owned placeholder
   - self-host readiness interlock 是否已严格限定在 `self-host-complete + repo_local` 及其等价 detected surface 内
   - readiness 检查在哪些命令只 `warn`，在哪些命令需要 `fail_closed`
   - `current-context` / `normative-loading-manifest` 是否已经从 whole-file sync 语义收敛到结构与实例分离的 template projection
   - source catalog 是否足够轻量，且不会把 `built-in-adoption-pack-catalog.ts` 变得更难维护
4. 若后续进入 `technical-solution-promotion`，预期 formal docs 落点：
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/module-overview.md`
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/built-in-adoption-pack-parity-and-self-host-readiness-sync.md`
   - 若 review 认为 parity class / placeholder policy 需要 formalize 进 install contract，再补：
     - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/governance-adoption-pack-install-contract.md`
   - `README.md`、`docs/local-adoption-playbook.md`、`docs/support-matrix.md` 作为 rollout follow-up consumer surface 同步更新，但不进入本条 solution 的 `final_paths`
