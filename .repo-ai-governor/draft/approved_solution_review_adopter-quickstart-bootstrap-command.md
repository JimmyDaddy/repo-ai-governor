# Technical Solution Review

- Status: approved
- Date: 2026-04-15
- Solution ID: `technical-solution.adopter-quickstart-bootstrap-command`
- Draft Path: `.repo-ai-governor/draft/adopter-quickstart-bootstrap-command-technical-solution.md`
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
   - `README.md`
   - `docs/local-adoption-playbook.md`
   - `docs/support-matrix.md`
   - `apps/cli/src/runtime/adoption-pack-runtime.ts`
4. Canonical artifact path:
   - `.repo-ai-governor/draft/approved_solution_review_adopter-quickstart-bootstrap-command.md`
5. Review path decision:
   - `current-context.md` 当前为 `idle`，没有 active primary stream 可承载新的 review artifact，因此本轮继续使用 draft 邻接的单一 canonical artifact，并在同一轮本地修订后直接收口为 `approved`
6. Approval focus:
   - baseline bootstrap / audit 与 installer quickstart 是否保持了清晰边界
   - `check` 是否继续保留为 broader governance audit follow-up
   - selector 缺省 built-in、显式 selector 复用现有 resolver、歧义 fail-closed 是否足够明确
   - existing receipt / drift / upgrade boundary 是否没有被 convenience surface 冲掉

## Reviewer Round

1. Local review round: `round-1-review-and-fix`
2. Delegated review: not requested; review and same-turn draft revisions were completed locally under the `technical-solution-review` workflow.
3. Main-agent action:
   - accepted and revised `3` blocking issues in the draft
   - rechecked the updated draft against public docs, module boundaries, runtime behavior, and installer contract before approving

## Blocking Findings

1. None. 本轮批准前复核未发现剩余阻断性问题；初始 blocking finding 已在同一轮修订后全部收口。

## Disposition Of Prior Blocking Findings

1. `[resolved 2026-04-15]` draft 先前没有把当前公开的 `check` baseline 与新的 install quickstart boundary 对齐，容易让 public truth 看起来像是 `check` 被新命令吞掉了。
   - Updated draft evidence:
     - `.repo-ai-governor/draft/adopter-quickstart-bootstrap-command-technical-solution.md:26`
     - `.repo-ai-governor/draft/adopter-quickstart-bootstrap-command-technical-solution.md:47`
     - `.repo-ai-governor/draft/adopter-quickstart-bootstrap-command-technical-solution.md:58`
     - `.repo-ai-governor/draft/adopter-quickstart-bootstrap-command-technical-solution.md:65`
     - `.repo-ai-governor/draft/adopter-quickstart-bootstrap-command-technical-solution.md:72`
     - `.repo-ai-governor/draft/adopter-quickstart-bootstrap-command-technical-solution.md:109`
     - `.repo-ai-governor/draft/adopter-quickstart-bootstrap-command-technical-solution.md:205`
     - `.repo-ai-governor/draft/adopter-quickstart-bootstrap-command-technical-solution.md:230`
     - `.repo-ai-governor/draft/adopter-quickstart-bootstrap-command-technical-solution.md:250`
     - `.repo-ai-governor/draft/adopter-quickstart-bootstrap-command-technical-solution.md:319`
     - `.repo-ai-governor/draft/adopter-quickstart-bootstrap-command-technical-solution.md:354`
     - `.repo-ai-governor/draft/adopter-quickstart-bootstrap-command-technical-solution.md:369`
   - Public truth evidence:
     - `README.md:67`
     - `README.md:74`
     - `README.md:85`
     - `docs/local-adoption-playbook.md:76`
     - `docs/local-adoption-playbook.md:86`
     - `docs/support-matrix.md:68`
     - `docs/support-matrix.md:69`
   - Approval note:
     - draft 现在明确区分了 `baseline bootstrap = init + doctor + check` 与 `adopt bootstrap = installer quickstart convenience surface`
     - `check` 被保留为 broader governance audit follow-up，而不是 install success gate 的隐式一部分

2. `[resolved 2026-04-15]` draft 原先没有把 selector/default built-in 的便利语义与现有 `adopt apply` resolver 关系写清楚，promotion 后容易演化出第二套 pack 解析规则。
   - Updated draft evidence:
     - `.repo-ai-governor/draft/adopter-quickstart-bootstrap-command-technical-solution.md:196`
     - `.repo-ai-governor/draft/adopter-quickstart-bootstrap-command-technical-solution.md:202`
     - `.repo-ai-governor/draft/adopter-quickstart-bootstrap-command-technical-solution.md:207`
     - `.repo-ai-governor/draft/adopter-quickstart-bootstrap-command-technical-solution.md:208`
     - `.repo-ai-governor/draft/adopter-quickstart-bootstrap-command-technical-solution.md:211`
     - `.repo-ai-governor/draft/adopter-quickstart-bootstrap-command-technical-solution.md:262`
     - `.repo-ai-governor/draft/adopter-quickstart-bootstrap-command-technical-solution.md:315`
     - `.repo-ai-governor/draft/adopter-quickstart-bootstrap-command-technical-solution.md:328`
     - `.repo-ai-governor/draft/adopter-quickstart-bootstrap-command-technical-solution.md:371`
   - Runtime / contract evidence:
     - `apps/cli/src/runtime/adoption-pack-runtime.ts:159`
     - `apps/cli/src/runtime/adoption-pack-runtime.ts:545`
     - `apps/cli/src/runtime/adoption-pack-runtime.ts:555`
     - `apps/cli/src/runtime/adoption-pack-runtime.ts:562`
     - `apps/cli/src/runtime/adoption-pack-runtime.ts:570`
     - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/governance-adoption-pack-install-contract.md:62`
     - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/governance-adoption-pack-install-contract.md:97`
     - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/module-overview.md:22`
   - Approval note:
     - draft 现在把“缺省 selector 只落官方 built-in pack”和“显式 selector 复用现有 `adopt apply` resolver”两条分开写清楚
     - 同时补上了 profile-name 不再唯一时必须 fail-closed 的边界，避免 convenience surface 猜测解析结果

3. `[resolved 2026-04-15]` draft 原先没有定义 existing receipt / managed drift 下的 rerun contract，容易把 `adopt bootstrap` 误读成 `upgrade` 或 cross-pack migration 的别名。
   - Updated draft evidence:
     - `.repo-ai-governor/draft/adopter-quickstart-bootstrap-command-technical-solution.md:237`
     - `.repo-ai-governor/draft/adopter-quickstart-bootstrap-command-technical-solution.md:249`
     - `.repo-ai-governor/draft/adopter-quickstart-bootstrap-command-technical-solution.md:251`
     - `.repo-ai-governor/draft/adopter-quickstart-bootstrap-command-technical-solution.md:252`
     - `.repo-ai-governor/draft/adopter-quickstart-bootstrap-command-technical-solution.md:263`
     - `.repo-ai-governor/draft/adopter-quickstart-bootstrap-command-technical-solution.md:315`
     - `.repo-ai-governor/draft/adopter-quickstart-bootstrap-command-technical-solution.md:345`
     - `.repo-ai-governor/draft/adopter-quickstart-bootstrap-command-technical-solution.md:372`
   - Runtime / contract evidence:
     - `apps/cli/src/runtime/adoption-pack-runtime.ts:157`
     - `apps/cli/src/runtime/adoption-pack-runtime.ts:160`
     - `apps/cli/src/runtime/adoption-pack-runtime.ts:454`
     - `apps/cli/src/runtime/adoption-pack-runtime.ts:457`
     - `apps/cli/src/runtime/adoption-pack-runtime.ts:471`
     - `apps/cli/src/runtime/adoption-pack-runtime.ts:489`
     - `apps/cli/src/runtime/adoption-pack-runtime.ts:492`
     - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/governance-adoption-pack-install-contract.md:106`
   - Approval note:
     - draft 现在明确要求 clean rerun 只作为 convenience wrapper reuse existing installation
     - receipt mismatch 或 managed drift 必须 fail-closed 并回到 `adopt diff/upgrade/remove`

## Non-Blocking Suggestions

1. 建议 promotion 前补一张简短的 outcome matrix，把 `fresh_install`、`reuse_existing_installation`、`drift_redirect` 三种情况映射到 CLI summary copy、bootstrap summary fields 与推荐下一步，进一步降低实现窗口中的 presenter drift。

## Promotion Interlocks

1. 如果 promotion 想把 `selector_resolution` 与 `reentry_mode` 作为稳定对外 artifact 字段，只写 ADR 还不够；需要同步 `governance-adoption-pack-install-contract.md`。
2. 如果 `baseline bootstrap` / `installer quickstart` / `check follow-up` 三层术语要成为稳定 public wording，`README.md`、`docs/local-adoption-playbook.md` 与 `docs/support-matrix.md` 需要在同一变更窗口一起收口。
3. 如果 `check` follow-up guidance 需要进入 CLI 结构化输出，而不只是帮助文案或 playbook copy，promotion 时应一并决定 command result / presenter schema 是否需要新增稳定字段。

## Main-Agent Recheck

1. `[resolved]` `check` baseline 与 quickstart boundary 已收口。
   - draft 不再把当前 public truth 简化成只有 `init/doctor/apply/verify`
   - `check` 的角色已经从“被遗漏”收敛为“显式 follow-up audit”
2. `[resolved]` selector/default built-in boundary 已收口。
   - quickstart 不再像是另起一套 resolution order
   - draft 现在明确继承现有 `adopt apply` resolver，并要求歧义 fail-closed
3. `[resolved]` rerun / drift / upgrade boundary 已收口。
   - quickstart 现在不会模糊 `apply`、`upgrade` 与 `remove` 的生命周期职责

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
   - current public docs and runtime behavior references
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
