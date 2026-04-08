# project-061-adoption-pack-installer-and-self-host-bootstrap-rollout 计划

- Status: planned
- Date: 2026-04-09
- Stage Mapping: adoption pack installer and self-host bootstrap rollout
- Phase Mapping: manifest/resolver / adopt apply / complete pack materialization / lifecycle and verify / self-host template bootstrap / clean-room docs truthfulness
- Upstream:
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/module-overview.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/governance-adoption-pack-install-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/adoption-pack-installer-and-self-host-template-bootstrap.md`
  - `.repo-ai-governor/context/dev/project-060-adoption-pack-promotion-and-decomposition/sprint-001-promotion-and-followup-decomposition/tasks/DA-654-adoption-pack-promotion-and-rollout-decomposition-handoff.md`

## 1. 目标

1. 将 `technical-solution.host-skill-distribution-and-discovery-followup` 从 formal direction 推进到真实 adopter installer rollout。
2. 先补 adoption-pack manifest / resolver / installer / managed ownership，再补 complete pack content、installer lifecycle、self-host bootstrap 与 clean-room rehearsal。
3. 保持“governor 持有 canonical truth，host assets、installer metadata 与 self-host template 都只是受控 install / bootstrap surface”的长期边界。

## 2. Sprint 细化

## 2.1 sprint-001-manifest-resolver-and-installer-contract

- Status: planned
- Sprint Goal: 冻结 adoption-pack manifest v1、installer contract boundary 与 layered resolver baseline。
- Task Package: `TK-656`、`TK-657`。

## 2.2 sprint-002-adopt-apply-and-managed-metadata

- Status: planned
- Sprint Goal: 打通 `adopt apply` materialization pipeline，并补齐 managed ownership 与 install receipt。
- Task Package: `TK-658`、`TK-659`。

## 2.3 sprint-003-complete-pack-content-and-host-materialization

- Status: planned
- Sprint Goal: 发布 `adopter-complete` 完整 pack 内容，并通过 installer 物化 shared/bootstrap/host-specific assets。
- Task Package: `TK-660`、`TK-661`。

## 2.4 sprint-004-diff-upgrade-remove-and-adoption-verify

- Status: planned
- Sprint Goal: 补齐 installer lifecycle 的 `diff/upgrade/remove` 与 adoption-level verify / managed bundle support。
- Task Package: `TK-662`、`TK-663`。

## 2.5 sprint-005-self-host-template-bootstrap-and-governance-authoring-surfaces

- Status: planned
- Sprint Goal: 发布 `self-host-complete` profile，并补齐 repo-local execution workspace、sqlite registries 与治理 authoring surface bootstrap。
- Task Package: `TK-664`、`TK-665`。

## 2.6 sprint-006-clean-room-rehearsals-and-docs-truthfulness

- Status: planned
- Sprint Goal: 通过 clean-room adopter / self-host rehearsal 收口 README、playbook、support matrix 与 rollout audit。
- Task Package: `TK-666`、`TK-667`。

## 3. 任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | status |
|---|---|---|---|---|---|
| TK-656 | sprint-001 | freeze adoption-pack manifest v1 and installer contract boundary | contract/foundation | formal module docs | planned |
| TK-657 | sprint-001 | implement layered adoption-pack resolver and source provenance baseline | resolver/foundation | TK-656 | planned |
| TK-658 | sprint-002 | implement adopt apply installer and materialization pipeline | installer/implementation | TK-657 | planned |
| TK-659 | sprint-002 | write managed ownership install receipt and adoption metadata baseline | installer/metadata | TK-658 | planned |
| TK-660 | sprint-003 | publish built-in adopter-complete pack and capability coverage map | pack/content | TK-659 | planned |
| TK-661 | sprint-003 | materialize shared bootstrap assets and host-specific assets through installer | installer/materialization | TK-660 | planned |
| TK-662 | sprint-004 | implement adopt diff upgrade remove lifecycle and drift-safe update policy | installer/lifecycle | TK-661 | planned |
| TK-663 | sprint-004 | extend adoption verify and managed bundle artifact support | verification/bundles | TK-662 | planned |
| TK-664 | sprint-005 | publish self-host-complete profile and template contract | self-host/contract | TK-663 | planned |
| TK-665 | sprint-005 | bootstrap repo-local execution workspace sqlite registries and governance authoring surfaces | self-host/bootstrap | TK-664 | planned |
| TK-666 | sprint-006 | run clean-room adopter and self-host rehearsals plus truthfulness evidence refresh | rehearsal/verification | TK-665 | planned |
| TK-667 | sprint-006 | close docs alignment rollout audit and delivery evidence | rollout/closeout | TK-666 | planned |

## 4. 依赖产物策略

1. sprint-001 必须优先完成，因为后续 `adopt apply`、complete pack materialization、self-host bootstrap 与 rehearsal 都依赖 manifest / installer contract / resolver truth。
2. sprint-002 只在 sprint-001 稳定后启动，避免 receipt、managed ownership 与 materialization pipeline 建在漂移中的 schema 上。
3. sprint-003 负责完整 adopter-facing content coverage，不提前将 docs truthfulness 误报为已支持路径。
4. sprint-004 负责 install lifecycle 与 adoption verify；在此之前不应对外承诺 `upgrade/remove`。
5. sprint-005 最后承接 `self-host-complete` 这条高级路径，确保 template bootstrap 与 live-state clone 的边界先在前四个 sprint 固定。
6. sprint-006 只在实现与 self-host bootstrap 都闭环后再执行 clean-room rehearsal 与 docs truthfulness closeout。

## 5. DoD（project-061）

1. adopter 可在无 `.codex/skills/**` 前置目录的目标仓库里安装完整 `adopter-complete` pack。
2. `adopt apply/diff/upgrade/remove` 与 adoption verify 能稳定表达 provenance、managed ownership、drift 与 receipt。
3. `self-host-complete` 能在 `repo_local` 模式下生成模板化 canonical surface，而不是 live-state clone。
4. README / playbook / support matrix 与真实 installer / rehearsal 能力保持 truthfulness。
5. clean-room adopter 与 self-host rehearsal 至少各有一条正式证据。

## 6. 里程碑记录

1. 2026-04-09：基于 `technical-solution.host-skill-distribution-and-discovery-followup` promotion cutover 创建 `project-061`，作为新的 planned follow-up stream。
2. 2026-04-09：已将 `sprint-001 ~ sprint-006` 与 `TK-656 ~ TK-667` 全量拆解写入 project / sprint / task surface，待后续窗口按顺序激活。
