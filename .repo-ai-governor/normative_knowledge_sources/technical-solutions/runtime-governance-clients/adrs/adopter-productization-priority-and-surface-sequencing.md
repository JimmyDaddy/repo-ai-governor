# ADR: Adopter Productization Priority And Surface Sequencing

- Status: active
- Date: 2026-04-08
- Module: `runtime.governance-clients`

## 1. Context

`project-052 ~ project-057` 已经收掉上一轮 adopter truthfulness、real adapter invocation、secondary surface 与 standards productization 主线，因此当前优先级问题不再是继续复用旧 rollout 顺序，而是重新判断历史收口之后还剩下哪些真正影响 adopter 的能力缺口。

新的 current-surface validation 说明，当前剩余主要风险集中在：

1. CLI primary surface 仍缺少真正 provider-native continuity 与更稳定的 adapter probe / verify truthfulness。
2. packaged install 与 host-native plugin / skill / agent lifecycle 还没有组成新的 adopter-facing distribution truth lane。
3. VS Code 与 desktop 仍需继续区分先后顺序，避免 secondary surface 同时发散。
4. `local-model` 高阶能力与 `github-com-agent` reserved target 仍应保持 deferred。

## 2. Decision

正式采用以下 follow-up sequencing：

1. 第一优先级固定为 `project-062-cli-continuity-and-adapter-truthfulness-hardening`。
2. 第二优先级固定为 adopter-facing distribution truth lane：
   - `project-063-packaged-distribution-and-install-surface-closeout`
   - `project-067-host-plugin-skill-agent-lifecycle-and-adopter-consumption`
3. 当前 secondary surface 固定采取 `VS Code packaged rollout first / desktop productization decision second`：
   - `project-064-vscode-packaged-secondary-surface-rollout`
   - `project-065-desktop-secondary-surface-productization-decision`
4. ecosystem expansion 固定由 `project-066-standards-and-language-pack-ecosystem-expansion` 承接，不抢在上述 adopter-facing 主线之前。
5. `project-068-p2-fallback-and-reserved-target-followups` 保持 deferred，只承接 `local-model` 与 `github-com-agent` follow-up。
6. 具体 surface classification、WBS 与 task number allocation 由 `current-surface-baseline-classification-and-followup-decomposition` ADR 进一步 formalize。

## 3. Rationale

1. CLI 仍是当前最成熟的主产品面，用户最近反馈也直接落在 continuity 与 truthfulness，所以 `project-062` 必须先行。
2. packaged install 与 host-native asset lifecycle 共同决定 adopter 是否真正理解“如何安装、如何消费 host-native assets、哪些资产只属于 baseline”，因此必须串成一条连续 lane。
3. 新 triad 已明确给 host-native plugin / skill / agent / hooks / MCP 资产留出正式 carry slot，所以 `project-067` 必须上提到 `P1`，而不是继续塞进 reserved target。
4. VS Code 与 desktop 都有非 demo 基线，但 adopter distribution truth 不先收口时，secondary surface 的 public support narrative 仍会不稳。
5. `local-model` 与 `github-com-agent` 都不是当前 adopter 主链，保持 deferred 更符合产品节奏。

## 4. Consequences

1. 新的 planning-side lifecycle-managed solution 固定落到 `runtime.governance-clients`，不新增并行 module。
2. delivery handoff 固定切换到新的 planned primary stream `project-062-cli-continuity-and-adapter-truthfulness-hardening`。
3. `project-063 ~ project-068` 作为新的 planned follow-up streams 登记到 `current-context.md`。
4. `project-052 ~ project-057` 保留为历史完成流，不再作为当前 delivery registry 的直接 handoff owner。
5. 本 ADR formalize 的是新的优先级顺序，不自动宣称 `project-062 ~ project-068` 已经实现。

## 5. Follow-Up

1. `project-062`: CLI continuity and adapter truthfulness hardening
2. `project-063`: packaged distribution and install-surface closeout
3. `project-067`: host plugin / skill / agent lifecycle and adopter consumption
4. `project-064`: VS Code packaged secondary surface rollout
5. `project-065`: desktop secondary-surface productization decision
6. `project-066`: standards and language-pack ecosystem expansion
6. Deferred:
   - `project-068-p2-fallback-and-reserved-target-followups`
