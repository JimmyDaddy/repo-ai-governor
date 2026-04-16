# DA-907 adopt bootstrap clean-room and truthfulness evidence

- Status: completed
- Date: 2026-04-16
- Owner: AI-Agent
- Task: `TK-907`
- Project: `project-108-adopter-quickstart-bootstrap-rollout`
- Sprint: `sprint-003-cleanroom-evidence-and-rollout-closeout`

## 1. Summary

1. 已使用构建后的 `dist/bin/repo-ai-governor.js` 在 `.tmp/` 下执行 `adopt bootstrap` clean-room rehearsal，覆盖 omitted selector、explicit selector、ambiguity fail-closed、clean rerun、multiple receipts blocker、drift redirect 与 pack/profile mismatch redirect 共 `7` 条合同分支。
2. 真实运行结果与 `project-108` 合同保持一致：omitted selector 回落到官方 built-in pack，explicit selector 复用 unique profile-alias，ambiguity 进入 `blocked_by_selection`，clean rerun 进入 `reuse_existing_installation`，multiple receipts / drift / mismatch 均 fail-closed 并重定向到 `adopt diff/upgrade/remove`。
3. `adopt --help`、`README.md`、`docs/local-adoption-playbook.md` 与 `docs/support-matrix.md` 继续把 `check` 固定为 explicit broader governance follow-up，没有把 install success 误报成 broader governance audit completed。

## 2. Evidence Packet

1. `.tmp/project-108-adopt-bootstrap-cleanroom-summary.json`
2. `.tmp/project-108-adopt-bootstrap-help.txt`
3. `apps/cli/test/adopt-command.integration.test.ts`

## 3. Clean-Room Results

| scenario | exit | selector / reentry | result |
| --- | --- | --- | --- |
| `default-selector-fresh-install` | `0` | `default_built_in` / `fresh_install` | omitted selector 默认命中官方 built-in，summary 明确保留 `check` follow-up。 |
| `explicit-selector-unique-profile-alias` | `0` | `explicit_profile_alias` / `fresh_install` | explicit selector 沿用唯一 profile-alias 解析，不引入新的 selector 语义。 |
| `explicit-selector-ambiguity-fails-closed` | `1` | `null` / `blocked_by_selection` | ambiguity 不猜测 pack/profile，直接要求显式 pack id。 |
| `clean-rerun-reuses-one-matching-install` | `0` | `default_built_in` / `reuse_existing_installation` | clean 现有安装允许 convenience rerun，并保留 additive diff/bootstrap diagnostics。 |
| `multiple-receipts-block-bootstrap` | `1` | `default_built_in` / `blocked_by_existing_receipts` | 多份 receipt 直接阻断 bootstrap，并给出 `adopt diff/upgrade/remove` redirect。 |
| `drifted-rerun-redirects-to-lifecycle` | `1` | `default_built_in` / `redirect_to_lifecycle` | managed drift 命中 fail-closed redirect，生成 diff report。 |
| `mismatched-install-redirects-to-lifecycle` | `1` | `default_built_in` / `redirect_to_lifecycle` | 现有安装 profile 为 `self-host-complete` 时，默认 bootstrap 不复用，要求回到 lifecycle commands。 |

## 4. Support-Surface Truthfulness

1. `adopt --help` 已继续声明 fixed-order quickstart 与 `check` broader follow-up：见 `.tmp/project-108-adopt-bootstrap-help.txt` 第 `10-23` 行。
2. `README.md` 第 `84-88` 行与 clean-room 结果一致：明确 omitted selector 默认 built-in、ambiguity fail-closed、rerun/mismatch redirect 与 `check` follow-up。
3. `docs/local-adoption-playbook.md` 第 `86-90` 行与 clean-room 结果一致：继续把 bootstrap summary 约束为 additive diagnostics，并保持 `check` 的 broader-follow-up 位置。
4. `docs/support-matrix.md` 第 `69` 行与第 `170` 行仍保持正式 support truth：quickstart 固定顺序、selector fail-closed、rerun redirect 和 `check` follow-up 都没有漂移。

## 5. Notes

1. clean-room 证据包中的 install receipt、verification summary 与 diff report 仍写入目标 repo 的 `.repo-ai-governor/adoption/installations/**`，符合“install receipt + verify summary 为 canonical install truth”的合同。
2. bootstrap summary 继续只作为 additive diagnostics 使用；它记录 selector resolution、reentry mode、redirect commands 与 stage detail，但不替代 canonical install truth。
