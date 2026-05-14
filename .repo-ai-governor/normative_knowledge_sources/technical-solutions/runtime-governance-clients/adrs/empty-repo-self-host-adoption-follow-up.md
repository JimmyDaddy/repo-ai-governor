# ADR: Empty Repo Self-Host Adoption Follow-Up

- Status: active
- Date: 2026-05-13
- Module: `runtime.governance-clients`

## 1. Context

当前 `runtime.governance-clients` 已 formalize installer-layer `adoption pack`、`self-host-complete` template bootstrap、built-in pack parity 与 self-host readiness applicability，但把工具真实应用到空仓库 `/Users/jimmydaddy/study/deepseekian` 的 `self-host-complete + repo_local` path 后，仍暴露出一组会持续破坏 first-run adoption truth 的正式缺口：

1. `adopt bootstrap` 在 empty repo self-host path 下无法完成同一事务内的 config seed/apply 收口；`init` 先写出的 `.repo-ai-governor/governor.yaml` 会被后续 `adopt apply` 视为未受管冲突文件。
2. self-host template 缺少最小 `adapters` baseline 与对齐后的 storage default，导致 `connect`、`doctor` 与 `run --dry-run --trace` 的 first-run path 仍然更像异常绕路，而不是受支持的 onboarding story。
3. install receipt 仍倾向把 starter docs、repo-local canonical truth 与运行期生成物一起记为同类 managed asset，这会把 adopter-owned authoring、runtime canonical writes 与 generated diagnostics 继续误判为 install drift。
4. `adopt verify`、`doctor` 与 `check` 在 self-host activation/readiness 上还没有一个单一 canonical truth owner，operator 仍然需要从零散 warning 与 noisy diagnostics 自己推断“现在到底卡在哪一步”。

这些问题说明，empty-repo self-host adoption 不再只是已有 self-host / parity 方向的实现细节，而是需要一份独立正式 ADR 来固定“bootstrap correctness + ownership taxonomy + generated artifact policy + activation truth owner split”的 follow-up boundary。

## 2. Decision

正式采用以下收口决策：

1. empty-repo `self-host-complete + repo_local` adopter path 固定为 `runtime.governance-clients` 的独立 active follow-up boundary，不再只作为 installer contract 或 parity ADR 里的附带说明。
2. `adopt bootstrap` 在该 path 下必须保证 bootstrap transaction 内的 `.repo-ai-governor/governor.yaml` seed/apply 一致性；不得继续把同事务写出的 config seed 暴露成 adopter 需要手工 `--force` 绕过的冲突。
3. self-host template 必须自带 minimum first-run baseline：
   - 最小 `adapters` scaffold
   - 对齐后的 storage default
   - 不再让 `connect`、`doctor` 与 `run --dry-run --trace` 把默认 first-run path 投影成“支持但像异常”的 noisy surface
4. self-host surface 正式区分四类 ownership / lifecycle class：
   - `managed_locked`
   - `starter_editable`
   - `canonical_runtime_writable`
   - `generated_ephemeral`
5. 上述四类 surface 必须绑定明确 lifecycle 语义：
   - `managed_locked` 继续走 `adopt diff/upgrade/remove`
   - `starter_editable` 只保留 seed provenance 与 placeholder readiness，不再把正常 authoring 记成 managed drift
   - `canonical_runtime_writable` 允许 runtime / repo-local truth 演进，不再要求与 seed checksum 保持一致
   - `generated_ephemeral` 不进入 install drift 主链，并受显式 `.gitignore` opt-in recommendation 约束
6. self-host activation/readiness phase 只允许由 `adopt verify` 产出 canonical verdict；`doctor` 只补 additive local env / adapter readiness fact，`check` 只做 broader governance audit，不得各自重算并覆盖 activation truth。
7. 真实 implementation / clean-room / docs truthfulness rollout 固定由 `project-123-empty-repo-self-host-adoption-rollout` 承接，且 phase 顺序固定为：
   - sprint-001 bootstrap transaction 与 minimum baseline
   - sprint-002 ownership / generated artifact policy
   - sprint-003 activation / readiness UX
   - sprint-004 clean-room evidence / docs truthfulness

## 3. Rationale

1. 这次问题不是单纯“文档少写一步”，而是 public support truth、runtime onboarding truth 与 install ownership truth 同时未闭合；用独立 ADR 固定边界，能避免后续再退回到 scattered note / hotfix。
2. bootstrap correctness 若不作为正式决策固定，就会继续把 first-run adoption failure 表现成 operator 自己需要猜的事务异常，而不是产品应承担的 installer consistency。
3. ownership taxonomy 只有和 `diff/upgrade/remove`、receipt provenance、migration/backfill 与 `.gitignore` policy 一起 formalize，才能真正阻止 adopter-owned / runtime-writable surface 再次被误记成 drift。
4. activation/readiness 若没有 canonical owner split，后续无论诊断文案还是 presenter surface 都会继续出现 `verify / doctor / check` 各说一套的 truth drift。
5. 通过把 follow-up rollout 固定为真实 `project-123`，formal direction 与 implementation sequencing 可以继续 evidence-gated，不会因为 promotion 成功就误报“代码已交付完成”。

## 4. Consequences

1. `runtime.governance-clients` module overview 需补充 empty-repo self-host adoption follow-up 的 active formal direction 与 rollout ownership。
2. `contract.runtime.adoption-pack-install.v1` 需要保留 additive clarifications，明确 bootstrap transaction consistency、ownership class、generated artifact policy 与 activation truth owner split。
3. lifecycle / module registry / normative-loading-manifest 必须为本 ADR 提供独立唯一注册路径，不得复用旧 solution 的 `final_paths`。
4. delivery registry 必须继续保持 `followup_required`，并把 `project-123 / sprint-001` 保持为 planned follow-up stream，而不是在 promotion 窗口直接激活实现。
5. public docs、README、playbook、support matrix 与 runtime surfaces 仍由 `project-123` evidence-gated rollout 承接；本 ADR 不把这些 consumer surface 提前升格为已完成真值。

## 5. Follow-Up

1. `project-123` sprint-001：修复 bootstrap transaction consistency，并补齐 minimum self-host adapters / storage baseline
2. `project-123` sprint-002：实现 ownership class、receipt provenance、drift semantics 与 generated artifact ignore policy
3. `project-123` sprint-003：落 canonical activation phase、verification summary 与 doctor/check additive diagnostics owner split
4. `project-123` sprint-004：完成 empty-repo clean-room rehearsal、README/playbook/support matrix truthfulness refresh 与 rollout closeout
