# Technical Solution Review

- Status: approved
- Date: 2026-04-15
- Solution ID: `technical-solution.built-in-adoption-pack-parity-and-self-host-readiness-sync`
- Draft Path: `.repo-ai-governor/draft/built-in-adoption-pack-parity-and-self-host-readiness-sync-technical-solution.md`
- Reviewer: `AI-Agent`
- Verdict: `approved`
- Related Lifecycle Entry: `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`

## Review Scope

1. Review mode: `approve-reviewed-solution`
2. Target module:
   - `runtime.governance-clients`
3. Primary comparison surfaces:
   - `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`
   - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
   - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`
   - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md`
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/module-overview.md`
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/governance-adoption-pack-install-contract.md`
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/adoption-pack-installer-and-self-host-template-bootstrap.md`
4. Canonical artifact path evolved from:
   - `.repo-ai-governor/draft/solution_review_built-in-adoption-pack-parity-and-self-host-readiness-sync.md`
   - to `.repo-ai-governor/draft/verified_solution_review_built-in-adoption-pack-parity-and-self-host-readiness-sync.md`
   - to `.repo-ai-governor/draft/approved_solution_review_built-in-adoption-pack-parity-and-self-host-readiness-sync.md`
5. Review path decision:
   - `current-context.md` 当前为 `idle`，没有 active primary stream 可承载新的 review artifact，因此本轮继续使用 draft 邻接的单一 canonical artifact，并在用户显式批准后升级为 `approved`，避免留下并行 review truth。
6. Approval focus:
   - self-host readiness interlock 是否已严格限定在 `self-host-complete + repo_local` 及等价 detected surface
   - `current-context.md` / `normative-loading-manifest.yaml` 是否已经从 whole-file sync 语义收敛到“结构同步 + starter instance”模型
   - widened adopter-owned placeholder scope 是否已经覆盖 repo-specific governance、product/architecture 与 execution starter docs

## Reviewer Round

1. Local approval round: `round-1-approval`
2. Delegated review: not requested; review and approval were completed locally under the `technical-solution-review` workflow.

## Blocking Findings

1. None. 本轮批准前复核未发现阻断性问题；上一轮 blocking finding 已全部收口。

## Disposition Of Prior Blocking Findings

1. `[resolved 2026-04-15]` self-host readiness interlock 已被明确收敛到 `self-host-complete + repo_local` 及等价 detected surface。
   - Updated draft evidence:
     - `.repo-ai-governor/draft/built-in-adoption-pack-parity-and-self-host-readiness-sync-technical-solution.md:36`
     - `.repo-ai-governor/draft/built-in-adoption-pack-parity-and-self-host-readiness-sync-technical-solution.md:43`
     - `.repo-ai-governor/draft/built-in-adoption-pack-parity-and-self-host-readiness-sync-technical-solution.md:50`
     - `.repo-ai-governor/draft/built-in-adoption-pack-parity-and-self-host-readiness-sync-technical-solution.md:96`
     - `.repo-ai-governor/draft/built-in-adoption-pack-parity-and-self-host-readiness-sync-technical-solution.md:97`
     - `.repo-ai-governor/draft/built-in-adoption-pack-parity-and-self-host-readiness-sync-technical-solution.md:264`
     - `.repo-ai-governor/draft/built-in-adoption-pack-parity-and-self-host-readiness-sync-technical-solution.md:268`
     - `.repo-ai-governor/draft/built-in-adoption-pack-parity-and-self-host-readiness-sync-technical-solution.md:269`
     - `.repo-ai-governor/draft/built-in-adoption-pack-parity-and-self-host-readiness-sync-technical-solution.md:275`
     - `.repo-ai-governor/draft/built-in-adoption-pack-parity-and-self-host-readiness-sync-technical-solution.md:276`
     - `.repo-ai-governor/draft/built-in-adoption-pack-parity-and-self-host-readiness-sync-technical-solution.md:277`
     - `.repo-ai-governor/draft/built-in-adoption-pack-parity-and-self-host-readiness-sync-technical-solution.md:319`
     - `.repo-ai-governor/draft/built-in-adoption-pack-parity-and-self-host-readiness-sync-technical-solution.md:320`
   - Normative evidence:
     - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/governance-adoption-pack-install-contract.md:99`
     - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/governance-adoption-pack-install-contract.md:100`
     - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/governance-adoption-pack-install-contract.md:101`
     - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/governance-adoption-pack-install-contract.md:102`
     - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/governance-adoption-pack-install-contract.md:103`
     - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/governance-adoption-pack-install-contract.md:104`
     - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/governance-adoption-pack-install-contract.md:105`
     - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md:24`
     - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md:25`
     - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md:26`
     - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md:57`
     - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md:58`
   - Approval note:
     - draft 已把 `governance_rules_ready`、`product_direction_ready`、`execution_surface_ready` 三组 interlock 明确绑定到 self-host path，并显式排除了默认 `adopter-complete` 路径。

2. `[resolved 2026-04-15]` `current-context.md` / `normative-loading-manifest.yaml` 的 source-mode 歧义已经被收敛为“结构同步 + starter instance”模型。
   - Updated draft evidence:
     - `.repo-ai-governor/draft/built-in-adoption-pack-parity-and-self-host-readiness-sync-technical-solution.md:173`
     - `.repo-ai-governor/draft/built-in-adoption-pack-parity-and-self-host-readiness-sync-technical-solution.md:176`
     - `.repo-ai-governor/draft/built-in-adoption-pack-parity-and-self-host-readiness-sync-technical-solution.md:190`
     - `.repo-ai-governor/draft/built-in-adoption-pack-parity-and-self-host-readiness-sync-technical-solution.md:191`
     - `.repo-ai-governor/draft/built-in-adoption-pack-parity-and-self-host-readiness-sync-technical-solution.md:192`
     - `.repo-ai-governor/draft/built-in-adoption-pack-parity-and-self-host-readiness-sync-technical-solution.md:196`
     - `.repo-ai-governor/draft/built-in-adoption-pack-parity-and-self-host-readiness-sync-technical-solution.md:200`
     - `.repo-ai-governor/draft/built-in-adoption-pack-parity-and-self-host-readiness-sync-technical-solution.md:201`
     - `.repo-ai-governor/draft/built-in-adoption-pack-parity-and-self-host-readiness-sync-technical-solution.md:202`
     - `.repo-ai-governor/draft/built-in-adoption-pack-parity-and-self-host-readiness-sync-technical-solution.md:203`
     - `.repo-ai-governor/draft/built-in-adoption-pack-parity-and-self-host-readiness-sync-technical-solution.md:218`
     - `.repo-ai-governor/draft/built-in-adoption-pack-parity-and-self-host-readiness-sync-technical-solution.md:219`
     - `.repo-ai-governor/draft/built-in-adoption-pack-parity-and-self-host-readiness-sync-technical-solution.md:281`
     - `.repo-ai-governor/draft/built-in-adoption-pack-parity-and-self-host-readiness-sync-technical-solution.md:282`
     - `.repo-ai-governor/draft/built-in-adoption-pack-parity-and-self-host-readiness-sync-technical-solution.md:283`
     - `.repo-ai-governor/draft/built-in-adoption-pack-parity-and-self-host-readiness-sync-technical-solution.md:284`
     - `.repo-ai-governor/draft/built-in-adoption-pack-parity-and-self-host-readiness-sync-technical-solution.md:285`
     - `.repo-ai-governor/draft/built-in-adoption-pack-parity-and-self-host-readiness-sync-technical-solution.md:286`
     - `.repo-ai-governor/draft/built-in-adoption-pack-parity-and-self-host-readiness-sync-technical-solution.md:287`
     - `.repo-ai-governor/draft/built-in-adoption-pack-parity-and-self-host-readiness-sync-technical-solution.md:288`
   - Normative evidence:
     - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/governance-adoption-pack-install-contract.md:98`
     - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/governance-adoption-pack-install-contract.md:99`
     - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/governance-adoption-pack-install-contract.md:100`
     - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/governance-adoption-pack-install-contract.md:101`
     - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/governance-adoption-pack-install-contract.md:102`
     - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/governance-adoption-pack-install-contract.md:103`
     - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/governance-adoption-pack-install-contract.md:104`
     - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/governance-adoption-pack-install-contract.md:105`
   - Approval note:
     - `repo_file_sync` 现在只保留给 template-safe whole-file source；`current-context.md` 与 `normative-loading-manifest.yaml` 改由 `structured_template_projection` 建模，并允许同一路径拆分 `structure_source_ref` / `instance_source_mode` / `instance_placeholder_policy`。

## Non-Blocking Suggestions

1. 建议把 `4.1 当前差异清单` 里 `repo-specific authoring docs` 那一行再改写一下，去掉“目前 draft 对 placeholder 讨论过窄”这类历史性措辞，改成直接描述 built-in pack / runtime 现状本身，避免 review 通过后这一行仍像是在描述旧版本 draft。
2. 建议 promotion 前补一张 “readiness group -> 首个稳定输出面” 映射表，明确每组结果会先进入 `doctor diagnostics`、`adopt verify`、`bootstrap summary` 还是 execution preflight，降低后续实现时的结果落点漂移。

## Promotion Interlocks

1. 如果 promotion 要把 `parity_class`、`source_mode`、`applicability_scope`、`adopter_owned_placeholder` 做成正式公共语义，不能只落 ADR；至少需要同步 `governance-adoption-pack-install-contract.md`。
2. 如果 readiness 结果要进入 `verify / bootstrap summary / execution preflight`，promotion 时需要一起决定哪些 check ids、result states 与 artifact fields 是稳定对外契约。
3. `current-context.md` 与 `normative-loading-manifest.yaml` 的 formal wording 需要继续保持“结构同步 + starter instance”术语，避免实现窗口再次回到 whole-file sync。

## Main-Agent Recheck

1. `[resolved]` 上一轮 blocking finding 1 不再成立。
   - self-host applicability 现在已经出现在背景、目标、现状约束、readiness table、tests、风险与 handoff 复核点中，不再只是零散 mention。
2. `[resolved]` 上一轮 blocking finding 2 不再成立。
   - source catalog 现在已经显式区分 `repo_file_sync` 与 `structured_template_projection`，并补上 structure/instance split 所需的字段。
3. `[accepted]` 用户额外提出的范围扩展已经落实。
   - repo-specific product / architecture docs 与 execution starter docs 现在都被明确纳入 adopter-owned placeholder，而不是继续只围绕两个 governance 文件讨论。

## Verification

1. Review baseline built from:
   - target draft
   - lifecycle registry entry
   - PRD brief
   - overall technical solution
   - architecture blueprint
   - `runtime.governance-clients` module overview
   - adoption-pack install contract
   - active self-host bootstrap ADR
2. Verification commands:
   - `node ./scripts/governance/check-technical-solution-lifecycle-registry.js`
   - Result: `pass`
3. Docs-only review window:
   - no executable code changed
   - build not required

## Decision

1. Review outcome: `approved`
2. Approval verdict:
   - no blocking findings remain
   - the draft is approved for later promotion cutover
3. Lifecycle recommendation:
   - update solution to `approved`
   - update `review_paths` to the canonical approved artifact path
   - fill `approved_at` / `approved_by`
   - keep `final_paths` empty
   - hand off to formal promotion cutover for later `active` wiring
