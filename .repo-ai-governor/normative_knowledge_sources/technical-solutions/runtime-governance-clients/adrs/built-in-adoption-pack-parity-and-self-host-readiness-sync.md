# ADR: Built-In Adoption Pack Parity And Self-Host Readiness Sync

- Status: active
- Date: 2026-04-15
- Module: `runtime.governance-clients`

## 1. Context

当前 `runtime.governance-clients` 已 formalize installer-layer `adoption pack`、managed ownership、install receipt 与 `self-host-complete` template bootstrap boundary，但 built-in pack 的内容维护仍主要依赖 `packages/standards` 中的大段字符串字面量。

这带来三类持续风险：

1. 当前仓库治理模型继续演进时，built-in pack 的 `current-context`、`normative-loading-manifest`、workflow projection 与 self-host template surface 很容易发生内容漂移。
2. `self-host-complete` 写出的 repo-specific governance / product / execution starter docs 本来就应该是 adopter-owned placeholder；若没有显式边界，后续实现很容易误回退成“从源仓库整文件镜像”。
3. readiness interlock 若不显式限制适用域，很容易误伤默认 `adopter-complete` 安装路径，把 self-host authoring 要求外溢到普通 adopter。

## 2. Decision

正式采用以下收口决策：

1. built-in adoption pack 的 source surface 按四类治理：
   - `exact_sync`
   - `generated_projection`
   - `template_seed`
   - `adopter_owned_placeholder`
2. built-in pack 后续应从 machine-readable source catalog 组装，而不是继续把最终 pack 内容长期手写在 `built-in-adoption-pack-catalog.ts` 中。
3. `current-context.md` 与 `normative-loading-manifest.yaml` 这类“结构必须对齐、实例值必须是 starter placeholder”的 surface，必须采用 `structured_template_projection`；禁止回退成 unconditional whole-file sync。
4. `code_standards.md`、`long-term-maintenance-guide.md`、`product-requirements-brief.md`、repo-level 技术方案 / 架构文档，以及 project / sprint / task starter docs 都属于 adopter-owned placeholder；installer 只能 seed starter/template 内容，不得镜像源仓库的 live authoring truth。
5. repo-specific placeholder readiness interlock 只属于 self-host authoring / execution path：
   - `self-host-complete + repo_local`
   - 或等价的 detected self-host surface
   - 默认 `adopter-complete` 不得因为缺少 repo-local governance / product / execution docs 而被 `warn` 或 `fail_closed`
6. empty-repo self-host path 还必须显式区分四类 writable / generated surface：
   - `managed_locked`
   - `starter_editable`
   - `canonical_runtime_writable`
   - `generated_ephemeral`
7. activation/readiness phase 只允许由 `adopt verify` 产出 canonical verdict；`doctor` 与 `check` 只能消费并扩展该 truth，不得各自重算 readiness phase。
8. follow-up implementation 由新的 `project-123-empty-repo-self-host-adoption-rollout` 承接。

## 3. Rationale

1. 这让“需要跟随当前仓库治理模型同步的内容”和“必须由 adopter 自己补齐的内容”获得了稳定、可检的分层。
2. 将 `current-context` / manifest 收敛为“结构同步 + starter instance”可避免把源仓库当前 live state 误写进 self-host bootstrap。
3. 将 readiness applicability 限定在 self-host path，能继续保持当前 installer contract 对默认 adopter path 的 fail-closed 边界。
4. 如果不把 writable / generated surface taxonomy 与 activation truth owner 一起 formalize，后续实现很容易重新回到“placeholder 分类有了，但 drift 和 readiness 还是各算一份”的半收口状态。
5. source catalog + parity tests 比继续依赖手工字符串更符合 built-in pack 的长期维护需求。

## 4. Consequences

1. `runtime.governance-clients` 的 module overview 需补充 built-in pack parity 与 self-host readiness applicability 边界。
2. `contract.runtime.adoption-pack-install.v1` 需要做 additive clarifications，明确 adopter-owned placeholder、self-host-only readiness applicability、ownership taxonomy、generated artifact ignore policy 与 structure-vs-instance projection boundary。
3. `packages/standards` 与 `apps/cli` 后续需要承接：
   - built-in pack source catalog
   - parity / applicability tests
   - readiness diagnostics integration
4. `README.md`、`docs/local-adoption-playbook.md` 与 `docs/support-matrix.md` 仍属于 rollout follow-up consumer surface，不在本轮 `final_paths` 中宣称已同步。

## 5. Follow-Up

1. `project-123` sprint-001：freeze empty-repo bootstrap transaction fix 与 minimum self-host baseline
2. `project-123` sprint-002：落 ownership taxonomy、receipt/drift semantics 与 generated artifact policy
3. `project-123` sprint-003：落 activation/readiness phase、verify canonical verdict 与 doctor/check additive diagnostics
4. `project-123` sprint-004：补齐 clean-room evidence 与 docs truthfulness refresh
