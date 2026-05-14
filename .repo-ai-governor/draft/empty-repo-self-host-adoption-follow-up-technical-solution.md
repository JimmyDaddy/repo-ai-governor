# Empty Repo Self-Host Adoption Follow-Up Technical Solution (Draft)

- Status: draft
- Date: 2026-05-13
- Owner: AI-Agent
- Scope: `runtime.governance-clients` empty-repo `self-host-complete + repo_local` real-world adoption follow-up covering bootstrap correctness, template completeness, writable-surface ownership, generated-artifact policy, and operator-readiness UX
- Target Modules:
  - `runtime.governance-clients`
- Related Inputs:
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/governance-adoption-pack-install-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/adoption-pack-installer-and-self-host-template-bootstrap.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/adopter-quickstart-bootstrap-command-and-install-convenience-surface.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/built-in-adoption-pack-parity-and-self-host-readiness-sync.md`
  - `.repo-ai-governor/draft/built-in-adoption-pack-parity-and-self-host-readiness-sync-technical-solution.md`
  - `README.md`
  - `docs/local-adoption-playbook.zh-CN.md`
  - `docs/support-matrix.md`
  - `apps/cli/src/runtime/adoption-pack-bootstrap-runtime.ts`
  - `apps/cli/src/runtime/adoption-pack-runtime.ts`
  - `apps/cli/src/runtime/agent-onboarding-runtime.ts`
  - `/Users/jimmydaddy/study/deepseekian/.repo-ai-governor/context/diagnostics/adoption-bootstrap/bootstrap-1778681061746.json`
  - `/Users/jimmydaddy/study/deepseekian/.repo-ai-governor/context/diagnostics/doctor/doctor-1778681637932.json`
  - `/Users/jimmydaddy/study/deepseekian/.repo-ai-governor/context/reports/cli-run-1778681524203.report.json`
  - `/Users/jimmydaddy/study/deepseekian/.repo-ai-governor/adoption/installations/repo-ai-governor-adoption-pack/adoption-install.receipt.json`

## 1. 背景与问题

这次没有停留在 clean-room rehearsal 或文档 walkthrough，而是把 `repo-ai-governor` 真实应用到了一个全新的空仓库：

- 目标仓库：`/Users/jimmydaddy/study/deepseekian`
- 目标路径：`self-host-complete + repo_local`

实地结果说明，当前正式 contract、support truth 与文档虽然已经把 `self-host-complete` 表述为受支持的 repo-local template bootstrap 路径，但“空仓库 first-run 自托管接入”仍存在一组会持续影响首装与后续演进的问题。

最关键的证据是：

1. 公开 quickstart 语义指向 `adopt bootstrap`，但 fresh empty repo 上它会在 `apply` 阶段失败，因为 `init` 先创建了 `.repo-ai-governor/governor.yaml`，后续 `adopt apply` 又把它视作“未受管文件”，直接拒绝覆盖。
2. 成功落地并继续跑通 `connect -> doctor --adapters -> run --dry-run --trace`，实际依赖了一条比公开引导更复杂的路径：
   - `adopt apply adopter-complete --adoption-profile self-host-complete --repo . --workspace-mode repo_local --hosts codex --force`
   - `adopt verify`
   - `check`
   - 手工补齐 `governor.yaml` 的 `adapters` baseline
   - `connect`
   - `connect apply --latest`
   - `doctor --adapters`
   - `run --dry-run --trace`
3. install receipt 当前不仅追踪 host assets 和 install metadata，还把后续必然要被 adopter 和 runtime 持续修改的 canonical writable surfaces 也登记成 `managed`，这会把“自托管开始真正写自己的仓库治理真值”误判成 drift 风险。

因此，这次 follow-up 不是要推翻现有 adoption/self-host 正式方向，而是要补上一个更窄但更关键的边界：

1. 空仓库 `self-host-complete + repo_local` 到底怎样才能成为真实可执行的受支持路径。
2. 哪些 surface 应继续受 installer 严格托管。
3. 哪些 surface 只能 seed 一次，之后必须交给 adopter 自己维护。
4. 哪些 surface 是运行期/诊断期产物，应该默认 ignore，而不是让用户一开始就分不清该不该提交。

## 2. 目标

1. 修复 empty repo 自托管首装时的 bootstrap/apply 交易边界，让公开路径真实可跑。
2. 补齐 self-host template 的最小可执行 baseline，避免继续依赖手工补配置。
3. 为 self-host 场景定义清晰的 ownership class、drift policy 与 `.gitignore` 建议。
4. 把“模板已 seed”与“仓库已经 ready 可以真实执行”显式分开，而不是只靠零散 warning 让操作者自己猜。
5. 把 README、adoption playbook、connect guide、support matrix 与真实命令路径重新对齐。

## 3. 非目标

1. 不重写默认 `adopter-complete` 的安装故事；本方案只聚焦 empty repo 的 self-host 路径。
2. 不把 self-host 变成源仓库 live-state clone；template bootstrap 与 live-state clone 的边界保持不变。
3. 不重新设计整个 adapter onboarding 或 remote provider product strategy。
4. 不把 `check` 吞并进 install result；它仍然是更广义的治理审计 surface。
5. 不在本方案里顺手解决所有 host distribution 或 packaged installation 的独立问题。

## 4. 现状与约束

1. 现有正式 contract 已经明确：
   - `self-host-complete` 只能在 `workspace_mode=repo_local` 下使用。
   - installer 只允许 seed template-backed canonical surface。
   - 不允许复制源仓库 live execution state。
2. 现有正式 support truth 已把 `adopt bootstrap` 表述为 `init -> bootstrap doctor preflight -> adopt apply -> adopt verify` 的 quickstart surface。
3. `adoption-pack-bootstrap-runtime.ts` 目前会在 bootstrap 事务前半段生成 repo-local `governor.yaml`，而 `adoption-pack-runtime.ts` 的写入保护又会拒绝覆盖不在 receipt 里的同路径文件。
4. `agent-onboarding-runtime.ts` 当前要求 source config 中已经存在 `adapters` baseline，否则 `connect` 会直接报 `connect requires adapters baseline in source config.`。
5. `support-matrix` 与 playbook 已 formalize self-host placeholder warning / `execution_preflight_signal=blocked`，但它们没有覆盖“如何从 seeded template 走到真正 ready 的 repo-local authoring workspace”这条操作链。
6. 当前 `doctor` 和 `check` 的部分提示虽然不算错误，但对 fresh empty repo operator 仍然过于抽象，例如：
   - `baseline_docs missing=5/5`
   - `script_not_found`
   - `state=legacy_store_engine expected_store_engine=sqlite_fs configured_store_engine=fs_csv`
7. 首次 `run --dry-run --trace` 命中了 `policy.risk.lockfile_delta -> confirm`，这本身合理，但对首次 adopter 是高概率情境，应该被提前解释。

### 4.1 实地应用暴露出的具体问题

| 问题 | 实证 | 影响 |
| --- | --- | --- |
| `adopt bootstrap` 在 empty repo 的 self-host 路径上事务不闭合 | bootstrap summary 记录 `apply` 因现有未受管 `.repo-ai-governor/governor.yaml` 失败 | 公开 quickstart 对该场景不可直接使用 |
| self-host template 缺少 `adapters` baseline | `connect` 直接抛 `connect requires adapters baseline in source config.` | 必须手工补配置才能继续 onboarding |
| `connect` 指南缺失 `connect apply --latest` | guide 只写 `connect` + `doctor --adapters` | 用户容易误以为 candidate config 已自动生效 |
| install receipt 过度追踪 adopter-owned / runtime-writable surfaces | receipt 将 `current-context.md`、技术方案 registries、`task-ledger.sqlite`、starter plan/task docs、`AGENTS.md`、`governor.yaml` 等都标成 `managed=true` | 后续真实 authoring / runtime 演进会被误读成 drift |
| 缺少明确的 generated/ignore policy | 诊断、报告、compiled IR、replay、sqlite wal/shm 未被明确区分 | 空仓库首次接入后无法快速判断哪些应提交、哪些应忽略 |
| 缺少“template seeded -> self-host activated”显式阶段 | 当前只有 placeholder warning 与 blocked signal | 用户不知道下一步是补文档、接工具、还是可以直接执行 |
| storage 默认不一致 | fresh repo self-host 配成 `fs_csv`，诊断却期待 `sqlite_fs` | 产生“支持但像异常”的噪声 |
| `baseline_docs` / `script_not_found` 可读性不足 | playbook 也只把它们解释成 expected warning | 用户知道“会 warn”，但不知道具体缺什么、怎么补 |
| 首次 dry-run 的 `lockfile_delta` 未提前提示 | `cli-run-1778681524203.report.json` 直接进入 `confirm` | 新仓库 operator 容易把 policy gate 误会成运行链路损坏 |
| remote_api candidate 默认值解释不足 | `doctor`/candidate config 暴露 `remote_api + gpt-5.4 + secret://openai/api-key + http://localhost:8899/responses` | 容易让用户误解为这些值已经被正式选中或是“推荐唯一正确值” |

## 5. 方案选项与对比

### 5.1 方案 A：只修文档，不动 runtime / ownership

1. 方案描述：
   - 仅在 README、playbook、support matrix 中解释空仓库 self-host 需要更长路径。
2. 优点：
   - 交付快。
   - 不改 contract、receipt 或 runtime 逻辑。
3. 缺点：
   - 无法修复 bootstrap 事务失败。
   - 无法消除“可写真值被误判为 managed drift”的长期问题。
   - 只是把“不好用”解释清楚，没有把路径变成真实可用。

### 5.2 方案 B：只做最小 runtime hotfix

1. 方案描述：
   - 仅修复 `bootstrap` 覆盖冲突，并为 self-host 模板补齐最小 `adapters` baseline。
2. 优点：
   - 能快速解除首装 blocker。
   - 对现有 public support truth 改动小。
3. 缺点：
   - ownership class 仍然混乱。
   - generated/ignore policy 仍未定义。
   - 后续 self-host 真正写入自己的 canonical truth 时，仍会继续撞到 drift/提交边界问题。

### 5.3 方案 C：补齐“交易正确性 + starter ownership + activation/readiness”整套 follow-up

1. 方案描述：
   - 修复 bootstrap 事务与模板缺口。
   - 为 receipt / verify 正式引入 self-host writable-surface ownership class。
   - 定义 generated artifact ignore policy。
   - 显式区分 `template_seeded`、`authoring_started`、`execution_ready` 等阶段，并同步更新文档与 diagnostics。
2. 优点：
   - 同时解决 first-run blocker 与后续长期可用性问题。
   - 更符合“治理目标仓库中的 AI 开发工作流”这条产品主线。
   - 能把 support truth、operator 心智与 runtime 真值重新对齐。
3. 缺点：
   - 需要同时改 runtime、receipt/verify contract、diagnostics 文案与 docs。
   - 实现面比单纯 hotfix 更大。

### 5.4 对比结论

推荐方案 C。

原因：

1. 这次暴露的不只是“少一步命令”或“少一段文档”，而是 self-host 产品化边界还没闭合。
2. 如果只修 bootstrap，empty repo 首装能过，但一旦 adopter 开始真的写自己的治理真值，managed drift 与 ignore 混乱会立刻出现。
3. 只有把 starter ownership、activation/readiness 与 docs truth 一起纳入，self-host 才能从“概念上支持”变成“现实里稳定可用”。

## 6. 推荐方案

### 6.1 Workstream A：修复 bootstrap 事务正确性

1. `adopt bootstrap` 对 `self-host-complete + repo_local` 必须保证同一事务内的 config seed 与 `adopt apply` 不互相打架。
2. 两种可接受实现：
   - `init` 阶段不要提前写出会被 `adopt apply` 接管的 `governor.yaml`。
   - 或者把 `init` 写出的 self-host `governor.yaml` 纳入同一 bootstrap transaction 的受管初始状态，使后续 `apply` 识别为同事务可覆盖，而不是未受管文件。
3. 若短期内 runtime 还未修复，则 public docs 与 support truth 不应继续把这条路径表述为“空仓库即插即用已支持”；要么降级表述，要么同窗口修正实现。

### 6.2 Workstream B：补齐 self-host 最小可执行 baseline

1. self-host repo-local template 必须自带最小 `adapters` baseline，至少足以让 `connect` 进入“写 candidate config”路径，而不是直接 fail-closed。
2. `connect` 若面对 self-host template 且确实缺少 baseline，可选择：
   - 自动 synthesize 一个最小 `adapters` scaffold。
   - 或返回结构化 next-actions，明确告诉用户缺哪一段和如何补。
3. storage 默认必须统一：
   - 若产品方向已经默认 `sqlite_fs`，self-host template 应直接对齐。
   - 若短期仍允许 `fs_csv`，则 `doctor` 不应把 fresh self-host 默认值投影成类似异常的 `legacy_store_engine`。
4. `normative-loading-manifest`、`current-context`、starter registries 与 task-ledger seed 应保持与当前治理模型的最小可执行一致性，但不能复制源仓库 live authoring truth。

### 6.3 Workstream C：定义 ownership class、drift policy 与 ignore policy

建议把 self-host 安装产物分成四类，而不是继续统一视作 `managed=true`：

| ownership class | 典型 surface | drift 策略 | Git 策略 |
| --- | --- | --- | --- |
| `managed_locked` | `.agents/**`、`.mcp.json`、adoption guides、install receipt / verification summary、host handoff metadata | 继续严格受管，drift 需显式 `diff/upgrade/remove` | 默认保留 |
| `starter_editable` | `AGENTS.md`、`code_standards.md`、`long-term-maintenance-guide.md`、`product-requirements-brief.md`、starter plan/task docs、draft/technical-solutions README | 允许 adopter 编辑，不应再被视作 managed drift；只保留“是否仍是 untouched placeholder”检查 | 默认保留 |
| `canonical_runtime_writable` | `governor.yaml`、`current-context.md`、技术方案 registries、`task-ledger.sqlite`、artifact registry canonical store | installer 只负责 seed，后续写入属于目标仓库 canonical truth，不应再按 install drift 处理 | 默认保留 |
| `generated_ephemeral` | `.repo-ai-governor/context/diagnostics/**`、`.repo-ai-governor/context/reports/**`、`.repo-ai-governor/context/replay/**`、`.repo-ai-governor/context/compiled-ir/**`、`*.sqlite-wal`、`*.sqlite-shm` | 不进入 install drift 主链 | 默认 ignore |

其中应明确：

1. receipt 仍可记录 seed provenance，但不能继续把 `starter_editable` 与 `canonical_runtime_writable` 视作“后续必须与 seed checksum 保持一致”的 managed file。
2. bootstrap 应在 self-host 路径下自动生成一段最小 `.gitignore` 建议，至少覆盖：
   - `.repo-ai-governor/context/diagnostics/`
   - `.repo-ai-governor/context/reports/`
   - `.repo-ai-governor/context/replay/`
   - `.repo-ai-governor/context/compiled-ir/`
   - `*.sqlite-wal`
   - `*.sqlite-shm`
   - `node_modules/`
3. install provenance 是否保留在版本库，可以继续作为 repo policy 决策，但不能再和 generated diagnostics 混为一谈。
4. 每个 ownership class 还必须绑定清晰的 lifecycle 语义，而不是只定义 drift copy：
   - `managed_locked`
     - `adopt diff/upgrade/remove` 继续沿用现有严格 managed lifecycle。
   - `starter_editable`
     - receipt 只保留 `seeded_at / seed_checksum / placeholder_policy` 这类 provenance 字段。
     - `adopt diff` 可以报告“仍是 untouched placeholder”或“已进入 adopter-owned authoring”，但不得把正常编辑报成 managed drift。
     - `adopt upgrade` 默认不得覆盖用户已编辑内容；若要重新下发新版 starter，只能走显式 `reseed` 或等价 opt-in。
     - `adopt remove` 只有在文件仍与 seed 内容一致时才允许 auto-delete；一旦进入 adopter-owned 内容，必须 fail-closed。
   - `canonical_runtime_writable`
     - receipt 只记录 ownership class 与 seed provenance，不再要求和 seed checksum 保持一致。
     - `adopt upgrade` 可以做 schema/checkpoint migration 或 next-action 提示，但不得把 runtime / authoring 演进误报为 pack drift。
     - `adopt remove` 不得静默删除当前 canonical truth；若需要回收，只能走显式 migration/archival flow。
   - `generated_ephemeral`
     - 不进入 install drift / remove 主链；清理、轮转与归档属于 runtime housekeeping，而不是 installer ownership。
5. 对已经安装过的 self-host 仓库，需要有一条 receipt migration/backfill 路径，把旧的 `managed=true` 记录回填成新的 ownership taxonomy；否则已落地仓库会继续保留错误 drift 行为。
6. `.gitignore` 策略默认应是“输出推荐块或显式 opt-in append”，而不是静默改写 adopter 根 `.gitignore`；否则会把治理初始化再次变成超出预期的 repo 级副作用。

### 6.4 Workstream D：引入显式 self-host activation / readiness 阶段

当前“self-host template 已 seed”与“仓库已经 ready 可以受管执行”之间缺少显式阶段面，导致 operator 只能从零散 warning 猜状态。

建议补一层 machine-readable phase：

1. `template_seeded`
   - install 已完成，但 starter docs/registries 仍主要是 placeholder。
2. `authoring_started`
   - 必填 governance/product/execution surfaces 已开始由 adopter 自己写入。
3. `adapter_connected`
   - `connect` candidate 已生成并已 `connect apply --latest`，基础 adapter readiness 可读。
4. `execution_ready`
   - 关键 placeholder 已替换、必要 adapters ready、policy gate 可解释，才允许把 self-host 当作真实执行仓库使用。

`adopt verify`、`doctor`、`check` 至少应显式投影：

1. 当前 phase
2. 阻断原因
3. 缺失/占位的具体路径，而不是只给 `baseline_docs missing=x/y`
4. operator next actions
5. 但 phase truth 必须只有一个 canonical producer，避免 `verify`、`doctor`、`check` 各自算出一份不同结论：
   - `adopt verify` 负责 install/self-host activation phase 的正式 verdict，并把结果写入 verification summary。
   - `doctor` 只负责补充本机环境、adapter readiness 与 safe-local 事实；若需要展示 phase，只能投影最近一次 canonical verify 结论或明确标记为 additive reflection。
   - `check` 继续承担 broader governance audit；它可以消费 phase truth 并扩展更广的规则结果，但不得重算并覆盖 install/self-host activation 的 canonical phase。
6. `execution_preflight_signal=blocked` 这类 installer/self-host signal 也应跟随上述 canonical owner split 收敛：
   - install/self-host placeholder 阻断归 `adopt verify`
   - adapter / local env / secret backend 等运行前置归 `doctor`
   - broader policy / governance audit 归 `check`
   这样 operator 才能从命令名本身推断“这是谁的真值”。

### 6.5 Workstream E：同步 public docs 与 operator guide

1. README 必须把“普通 adopter path”和“repo-local self-host path”明确分开。
2. self-host path 必须显式包含：
   - 哪条命令是 seed template
   - 哪一步会让 candidate config 真正生效（`connect apply --latest`）
   - 哪些 warning 是 expected
   - 哪些 signal 应视为硬阻断
3. `connect` guide 不应只停留在“跑 connect + doctor”；它至少要解释 candidate/apply 的两段式语义。
4. playbook 要提前说明首次 `run --dry-run --trace` 可能因为 `lockfile_delta` 命中 `confirm`，这是 policy surface，不是执行链路损坏。
5. remote_api candidate defaults 必须被清晰标成“candidate/suggested/default authoring scaffold”，而不是像已选中的正式 runtime truth。

## 7. 核心设计与契约影响

1. `contract.runtime.adoption-pack-install.v1` 需要补充的不是“允许 live-state clone”，而是：
   - bootstrap 事务内的 config seed / apply 一致性约束
   - self-host writable-surface ownership class
   - generated artifact ignore policy
   - activation/readiness phase 的最小投影要求
2. install receipt 建议增加 additive 元数据：
   - `ownershipClass`
   - `driftPolicy`
   - `gitPolicy`
   - `placeholderPolicy`
3. `adopt verify` / `doctor` 的 self-host 检查需要从“只给 warn 文本”升级为结构化 phase + actionable next actions。
4. `connect` 的 source-config baseline 不能再默认假设 self-host template 已有完整 `adapters`。
5. 该 follow-up 主要会影响：
   - `runtime.governance-clients` runtime / diagnostics / docs contract
   - install receipt 语义
   - self-host operator guide

## 8. 风险与权衡

1. 若把 writable surfaces 从严格 managed drift 中剥离，installer 完整性保护会变弱。
   - 缓解：只对 `managed_locked` 继续严格校验；其余 surface 记录 provenance 但不做同等 drift 阻断。
2. 引入 activation/readiness phase 会增加概念层级。
   - 缓解：这比让 operator 从零散 warning 猜“现在能不能跑”更低成本。
3. storage 默认对齐可能触发现有 self-host 安装的迁移问题。
   - 缓解：允许 migration hint 或 temporary compatibility mode，但 public docs 不能继续模糊表述。
4. 若 docs 提前更新而 runtime 没同步，support truth 会再次失真。
   - 缓解：把 runtime + docs + clean-room rehearsal 视作同一 closeout 窗口，不接受单边完成。

## 9. 分阶段落地建议

1. Phase A：解除首装 blocker
   - 修复 `bootstrap`/`apply` 事务冲突
   - 为 self-host seed 最小 `adapters` baseline
   - 在 docs 中显式补上 `connect apply --latest`
2. Phase B：ownership / ignore 基线
   - receipt 增加 ownershipClass/driftPolicy/gitPolicy
   - verify/drift 逻辑按四类 surface 重构
   - 生成最小 `.gitignore` 建议
3. Phase C：activation / readiness UX
   - 引入 self-host phase 投影
   - `baseline_docs`、`script_not_found`、storage mismatch、lockfile confirm 提示结构化化
   - remote_api candidate/apply 语义明确化
4. Phase D：empty repo clean-room 回归
   - 针对全新空仓库重复演练 `self-host-complete + repo_local`
   - 验证从 install 到 first dry-run 的公开文档链路可独立走通

## 10. Review / Promotion Handoff

1. 建议 `solution_id`：`technical-solution.empty-repo-self-host-adoption-follow-up`
2. 建议 `target_module_ids`：`runtime.governance-clients`
3. 进入 `technical-solution-review` 前需要重点复核的边界：
   - `starter_editable` 与 `canonical_runtime_writable` 的切分是否足够清晰
   - `governor.yaml`、registries、sqlite stores 应归入哪类 ownership
   - activation/readiness phase 是走 `verify`/`doctor` 扩展，还是单独命令更合适
   - public support truth 是否应在 runtime 修复前临时降级
4. 若后续进入 `technical-solution-promotion`，预期 formal docs 落点：
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/governance-adoption-pack-install-contract.md`
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/adoption-pack-installer-and-self-host-template-bootstrap.md`
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/built-in-adoption-pack-parity-and-self-host-readiness-sync.md`
   - `README.md`
   - `docs/local-adoption-playbook.md`
   - `docs/local-adoption-playbook.zh-CN.md`
   - `docs/support-matrix.md`
