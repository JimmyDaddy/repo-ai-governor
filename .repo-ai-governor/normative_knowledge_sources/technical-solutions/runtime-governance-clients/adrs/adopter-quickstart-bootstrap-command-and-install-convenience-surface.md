# ADR: Adopter Quickstart Bootstrap Command And Install Convenience Surface

- Status: active
- Date: 2026-04-15
- Module: `runtime.governance-clients`

## 1. Context

当前 `runtime.governance-clients` 已 formalize 两层公开 adopter surface：

1. baseline bootstrap / audit：
   - `init`
   - `doctor`
   - `check`
2. managed install lifecycle：
   - `adopt apply`
   - `adopt verify`
   - `adopt diff/upgrade/remove`

这条路径已经受支持，但仍存在三类 adopter friction：

1. 新 adopter 需要先理解 “baseline bootstrap” 与 “managed install lifecycle” 是两层不同 surface，才能拼出最短 install path。
2. 当前缺的是 installer truth 上方的一层 convenience entry，而不是新的 install mode 或新的 canonical receipt truth。
3. 若 convenience surface 不显式约束 selector、rerun 与 `check` 边界，很容易重新制造第二套 resolver、第二套 upgrade path 或把 broader governance audit 误吞进 install result。

## 2. Decision

正式采用以下收口决策：

1. public installer convenience surface 固定为 `adopt bootstrap`，而不是新增顶层 `bootstrap` command family。
2. `adopt bootstrap` 只可按固定顺序编排：
   - `init`
   - `doctor --fix`
   - `adopt apply`
   - `adopt verify`
3. `baseline bootstrap` 与 `installer quickstart` 必须显式分层：
   - `baseline bootstrap = init + doctor + check`
   - `adopt bootstrap = install-affecting convenience surface`
   - `check` 继续作为 explicit broader governance audit follow-up，不并入 install success gate
4. selector 语义固定为：
   - omitted selector 只允许落官方 built-in pack
   - explicit selector 复用当前 `adopt apply` 的 `pack-id -> profile-id` fallback semantics
   - 目标不唯一时继续 fail-closed，不猜测 pack/profile
5. rerun 语义固定为：
   - clean matching installation 允许通过 convenience rerun 复用
   - managed drift、pack mismatch 或 profile mismatch 必须回到 `adopt diff/upgrade/remove`
   - `adopt bootstrap` 不得隐式变成 upgrade 或 cross-pack migration lifecycle owner
6. bootstrap summary 允许作为 additive handoff artifact 记录 stage result、selector resolution 与 reentry mode，但 install receipt / verification summary 继续是 canonical truth。
7. follow-up implementation 与 consumer truthfulness refresh 由新的 `project-108-adopter-quickstart-bootstrap-rollout` 承接。

## 3. Rationale

1. 将 convenience surface 保持在 `adopt` family 下，可以最大化继承现有 installer contract、receipt、managed ownership 与 fail-closed semantics。
2. 明确保留 `check` 为 explicit follow-up audit，可以避免 public docs/help 再次把 broader governance fact surface 与 install lifecycle 混在一起。
3. selector 与 rerun 都显式继承现有 installer behavior，比重新发明更小的 blast radius 更符合长期维护边界。
4. additive bootstrap summary 既能保留 stage-level diagnostics，又不会制造新的 canonical install truth。

## 4. Consequences

1. `runtime.governance-clients` module overview 需补充 quickstart convenience boundary、`check` follow-up 与 rerun redirect semantics。
2. `contract.runtime.adoption-pack-install.v1` 需要做 additive clarification，formalize convenience orchestration、explicit `check` follow-up、default built-in selector 与 clean rerun boundary。
3. `README.md`、`docs/local-adoption-playbook.md` 与 `docs/support-matrix.md` 仍属于 rollout follow-up consumer surface，不在本轮 `final_paths` 内宣称已同步。
4. `apps/cli`、presenter copy、bootstrap summary artifact 与 clean-room evidence 仍由后续 rollout stream 承接，不在本 ADR 中谎报为已交付。

## 5. Follow-Up

1. `project-108` sprint-001：freeze quickstart contract、bootstrap summary boundary、selector/reentry semantics 与 rollout plan
2. `project-108` sprint-002：实现 `adopt bootstrap` orchestrator、summary artifact、help/copy 与 consumer docs baseline
3. `project-108` sprint-003：补齐 tests、clean-room evidence、consumer truthfulness refresh 与 project closeout
