# ADR: Adoption Pack Installer And Self-Host Template Bootstrap

- Status: active
- Date: 2026-04-09
- Module: `runtime.governance-clients`

## 1. Context

现有 `runtime.governance-clients` 已 formalize `host export/apply/pack/verify` 的 host-native projection boundary，但 adopter 仍存在两类正式缺口：

1. 用户想要的是“给目标仓库安装一整套治理能力”，而不是手工拼接 `init/connect/host export/pack/verify`。
2. `host export/pack` 仍偏向 maintainer baseline，并直接受 `.codex/skills/**` authoring 资产影响，不够 adopter-friendly。
3. 更重治理模型的团队还希望目标仓库具备 repo-local governance workspace、norm-source template、registry sqlite 与 authoring surface，而不是手工模仿本仓库目录结构。

## 2. Decision

正式采用以下收口决策：

1. 在 `runtime.governance-clients` 下新增 installer-layer contract：`contract.runtime.adoption-pack-install.v1`。
2. `host export/apply/pack/verify` 保持为 lower-level host projection substrate；更高层 adopter installation story 由 `adoption pack` installer 承担。
3. adopter-facing 正式入口演进为 `adopt list/apply/diff/upgrade/remove` 一类高层 surface，而不是要求用户先理解 maintainer 内部目录与 staged export 细节。
4. source resolution 正式分层为 `built_in / global / repo_local`，但 `repo_local` 只作为 override/authoring input，不再是 adopter install 的硬前置条件。
5. `self-host-complete` 正式作为高级 profile 引入：
   - 显式 opt-in
   - 仅在 `workspace.mode=repo_local` 下可用
   - 只允许 template bootstrap，不允许 live-state snapshot clone
6. norm-source、execution workspace、sqlite registries 与 governance authoring surface 可以被 seed 到目标仓库，但只能以空白或模板化 canonical surface 形式出现。
7. empty-repo `self-host-complete + repo_local` 不再只以“概念支持”收口；bootstrap transaction、self-host 最小 baseline、ownership/drift taxonomy、generated artifact ignore policy 与 activation/readiness phase 必须一起进入正式边界。
8. 后续真实实现与 clean-room rollout 由 `project-123-empty-repo-self-host-adoption-rollout` 承接。

## 3. Rationale

1. 这保住了既有长期边界：governor runtime 持有 canonical workflow truth，host assets 与 installer metadata 都只是受控 projection。
2. 把 installer 抽到独立 contract，可以避免继续把 host target matrix、managed ownership、receipt 与 self-host template 语义挤进同一个 lower-level host contract。
3. `self-host-complete` 若不显式声明“template bootstrap != live-state clone”，会直接制造错误心智，并把源仓库 execution trace 污染到目标仓库。
4. 真实 empty-repo self-host 采用暴露出的问题并不只是一条命令少一步，而是 bootstrap 事务、template baseline、ownership 边界与 readiness truth 尚未闭合；把这些边界一起 formalize 比继续靠 docs workaround 更符合 adopter truth。
5. layered resolution 保留了 repo-local override 的扩展能力，同时让官方内置 pack 可以成为默认 adopter story。

## 4. Consequences

1. `runtime.governance-clients` 增加第三份正式 contract：`contract.runtime.adoption-pack-install.v1`。
2. module overview 正式从“surface split + host distribution boundary”扩展为“surface split + host distribution boundary + installer-layer adoption-pack boundary”。
3. `self-host-complete` 成为正式高级 profile，但其落地不再只是“能 seed template”；它还需要 bootstrap/apply transaction consistency、minimum baseline、ownership/drift split 与 activation/readiness phase 的 follow-up implementation。
4. delivery handoff 切换到新的 planned follow-up stream `project-123-empty-repo-self-host-adoption-rollout`。

## 5. Follow-Up

1. `project-123` sprint-001：bootstrap transaction consistency 与 self-host minimum adapters/storage baseline
2. `project-123` sprint-002：ownership classes、receipt provenance、drift lifecycle 与 generated artifact ignore policy
3. `project-123` sprint-003：activation/readiness phase、verification summary 与 doctor/check additive diagnostics owner split
4. `project-123` sprint-004：empty-repo clean-room rehearsal、README/playbook/support matrix truthfulness closeout
