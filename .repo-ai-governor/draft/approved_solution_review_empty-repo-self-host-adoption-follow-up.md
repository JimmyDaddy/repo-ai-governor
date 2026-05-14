# Technical Solution Review

- Status: approved
- Date: 2026-05-13
- Solution ID: `technical-solution.empty-repo-self-host-adoption-follow-up`
- Draft Path: `.repo-ai-governor/draft/empty-repo-self-host-adoption-follow-up-technical-solution.md`
- Reviewer: `AI-Agent`
- Verdict: `approved`
- Related Lifecycle Entry: `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`

## Review Scope

1. Review mode: `review-draft-solution`
   - same-turn local main-agent revisions were applied before final approval
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
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/adopter-quickstart-bootstrap-command-and-install-convenience-surface.md`
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/built-in-adoption-pack-parity-and-self-host-readiness-sync.md`
   - `README.md`
   - `docs/local-adoption-playbook.zh-CN.md`
   - `/Users/jimmydaddy/study/deepseekian/.repo-ai-governor/context/diagnostics/adoption-bootstrap/bootstrap-1778681061746.json`
   - `/Users/jimmydaddy/study/deepseekian/.repo-ai-governor/context/diagnostics/doctor/doctor-1778681637932.json`
   - `/Users/jimmydaddy/study/deepseekian/.repo-ai-governor/context/reports/cli-run-1778681524203.report.json`
   - `/Users/jimmydaddy/study/deepseekian/.repo-ai-governor/adoption/installations/repo-ai-governor-adoption-pack/adoption-install.receipt.json`
4. Canonical artifact path:
   - `.repo-ai-governor/draft/approved_solution_review_empty-repo-self-host-adoption-follow-up.md`
5. Review path decision:
   - `current-context.md` 当前为 `idle`，没有 active primary stream 可承载新的 review artifact，因此本轮继续使用 draft 邻接的单一 canonical artifact，并在同一轮本地修订后直接收口为 `approved`
6. Approval focus:
   - empty repo `self-host-complete + repo_local` 的 first-run blocker 是否被真实问题驱动，而不是泛化抱怨
   - ownership taxonomy 是否足以避免把 adopter-owned authoring 与 runtime canonical writes 继续误判成 install drift
   - activation/readiness phase 是否拥有单一 canonical truth owner，而不是在 `verify / doctor / check` 之间分裂
   - follow-up 是否保持为现有 adoption/self-host 正式方向的补洞，而不是另起一套并行方案

## Reviewer Round

1. Local review round: `round-1-review-and-fix`
2. Delegated review: not requested; review and same-turn draft revisions were completed locally under the `technical-solution-review` workflow.
3. Main-agent action:
   - accepted and revised `2` blocking issues in the draft
   - rechecked the updated draft against current contracts, module boundaries, public support wording, and the real empty-repo adoption evidence before approving

## Blocking Findings

1. None. 本轮批准前复核未发现剩余阻断性问题；初始 blocking finding 已在同一轮修订后全部收口。

## Disposition Of Prior Blocking Findings

1. `[resolved 2026-05-13]` draft 原先提出了新的 ownership class，但没有把它们和 `adopt diff/upgrade/remove`、receipt migration、`.gitignore` mutation boundary 的正式语义绑死，promotion 后很容易再次回到“只换名词、不改 lifecycle”的状态。
   - Updated draft evidence:
     - `.repo-ai-governor/draft/empty-repo-self-host-adoption-follow-up-technical-solution.md:177`
     - `.repo-ai-governor/draft/empty-repo-self-host-adoption-follow-up-technical-solution.md:181`
     - `.repo-ai-governor/draft/empty-repo-self-host-adoption-follow-up-technical-solution.md:190`
     - `.repo-ai-governor/draft/empty-repo-self-host-adoption-follow-up-technical-solution.md:200`
     - `.repo-ai-governor/draft/empty-repo-self-host-adoption-follow-up-technical-solution.md:203`
     - `.repo-ai-governor/draft/empty-repo-self-host-adoption-follow-up-technical-solution.md:208`
     - `.repo-ai-governor/draft/empty-repo-self-host-adoption-follow-up-technical-solution.md:212`
     - `.repo-ai-governor/draft/empty-repo-self-host-adoption-follow-up-technical-solution.md:214`
     - `.repo-ai-governor/draft/empty-repo-self-host-adoption-follow-up-technical-solution.md:215`
   - Normative evidence:
     - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/governance-adoption-pack-install-contract.md:106`
     - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/governance-adoption-pack-install-contract.md:112`
     - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/governance-adoption-pack-install-contract.md:115`
     - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/module-overview.md:22`
     - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/module-overview.md:23`
     - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/module-overview.md:24`
     - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/module-overview.md:25`
     - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/module-overview.md:33`
   - Approval note:
     - draft 现在不仅定义了四类 surface，还把 `upgrade/remove`、receipt migration/backfill 与 `.gitignore` opt-in 边界一起写清
     - 这让 follow-up 真正具备 contract 收口价值，而不只是问题盘点

2. `[resolved 2026-05-13]` draft 原先引入了 `template_seeded / authoring_started / adapter_connected / execution_ready` phase，但没有指定唯一 canonical producer，容易让 `adopt verify`、`doctor`、`check` 各自算出不同 readiness verdict。
   - Updated draft evidence:
     - `.repo-ai-governor/draft/empty-repo-self-host-adoption-follow-up-technical-solution.md:217`
     - `.repo-ai-governor/draft/empty-repo-self-host-adoption-follow-up-technical-solution.md:221`
     - `.repo-ai-governor/draft/empty-repo-self-host-adoption-follow-up-technical-solution.md:232`
     - `.repo-ai-governor/draft/empty-repo-self-host-adoption-follow-up-technical-solution.md:238`
     - `.repo-ai-governor/draft/empty-repo-self-host-adoption-follow-up-technical-solution.md:239`
     - `.repo-ai-governor/draft/empty-repo-self-host-adoption-follow-up-technical-solution.md:240`
     - `.repo-ai-governor/draft/empty-repo-self-host-adoption-follow-up-technical-solution.md:241`
     - `.repo-ai-governor/draft/empty-repo-self-host-adoption-follow-up-technical-solution.md:242`
     - `.repo-ai-governor/draft/empty-repo-self-host-adoption-follow-up-technical-solution.md:243`
     - `.repo-ai-governor/draft/empty-repo-self-host-adoption-follow-up-technical-solution.md:244`
     - `.repo-ai-governor/draft/empty-repo-self-host-adoption-follow-up-technical-solution.md:245`
     - `.repo-ai-governor/draft/empty-repo-self-host-adoption-follow-up-technical-solution.md:246`
   - Normative evidence:
     - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/module-overview.md:22`
     - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/module-overview.md:24`
     - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/module-overview.md:25`
     - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/module-overview.md:33`
     - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/governance-adoption-pack-install-contract.md:109`
     - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/governance-adoption-pack-install-contract.md:110`
     - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/governance-adoption-pack-install-contract.md:111`
     - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/governance-adoption-pack-install-contract.md:113`
   - Approval note:
     - draft 现在把 `adopt verify` 固定为 self-host activation phase 的 canonical verdict owner
     - `doctor` 与 `check` 保留 additive / broader audit 职责，不再像是并行 readiness truth source

## Non-Blocking Suggestions

1. 建议 promotion 前补一张简短 operator matrix，把 `template_seeded -> authoring_started -> adapter_connected -> execution_ready` 映射到推荐命令、canonical artifact 与 expected signal，进一步降低 adopter 上手成本。
2. 建议 promotion 时一并决定 `.gitignore` 推荐块的最终交付形态，是 installer summary snippet、playbook copy，还是显式 opt-in file patch，避免 rollout 阶段再次出现 docs/runtime 表述分叉。

## Promotion Interlocks

1. 如果 `ownershipClass / driftPolicy / gitPolicy / placeholderPolicy` 要进入 install receipt 的稳定对外字段，不能只落 ADR；至少需要同步 `governance-adoption-pack-install-contract.md`。
2. 如果 activation phase 与 `execution_preflight_signal=blocked` 的 owner split 要成为稳定公共语义，promotion 时需要一起决定 verification summary、doctor diagnostics 与 broader audit output 的 schema/field boundary。
3. 如果 `.gitignore` recommendation 要成为真实 installer behavior，而不是单纯文档建议，必须在同一变更窗口同步 runtime、playbook 与 support truth。
4. 该 follow-up 的 public support wording 不应先于 runtime 修复单边升级；仍需保持 evidence-gated closeout discipline。

## Main-Agent Recheck

1. `[resolved]` empty repo self-host first-run blocker 已被准确锚定。
   - 草案没有把问题泛化成“adoption 全面不可用”，而是明确限定在 `self-host-complete + repo_local` 的 empty-repo path
   - 这与当前 active adoption/self-host 正式方向没有冲突，属于 follow-up gap closure
2. `[resolved]` ownership / drift taxonomy 现在足够可执行。
   - 不再只是把 surface 分四类
   - 已补齐 `diff/upgrade/remove`、receipt migration 与 `.gitignore` 副作用边界
3. `[resolved]` activation/readiness truth owner 已经收口。
   - `adopt verify`、`doctor`、`check` 的职责不再重叠
   - 这减少了后续 promotion 时 schema 与 presenter drift 的风险
4. `[accepted]` 用户特别关心的“还缺哪些问题”已经被纳入正式问题表。
   - 除了 ignore、缺失步骤、错误引导，还补上了 bootstrap transaction、ownership boundary、storage default mismatch、policy gate explainability、remote_api candidate wording 等更深层问题

## Verification

1. Review baseline built from:
   - target draft
   - lifecycle registry entry
   - PRD brief
   - overall technical solution
   - architecture blueprint
   - `runtime.governance-clients` module overview
   - adoption-pack install contract
   - active adoption/self-host ADRs
   - current public docs and the real empty-repo adoption evidence from `/Users/jimmydaddy/study/deepseekian`
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
   - hand off to `technical-solution-promotion` for later formal cutover
