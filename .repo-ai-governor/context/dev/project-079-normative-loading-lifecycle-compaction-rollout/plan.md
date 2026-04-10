# project-079-normative-loading-lifecycle-compaction-rollout 计划

- Status: active
- Date: 2026-04-11
- Stage Mapping: normative loading manifest lifecycle compaction rollout
- Phase Mapping: archive split / deprecated compact / parser-gate closeout
- Upstream:
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/governance-normative-loading/module-overview.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/governance-normative-loading/contracts/normative-loading-lifecycle-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/governance-normative-loading/adrs/root-bootstrap-truth-and-archive-sidecar-boundary.md`
  - `.repo-ai-governor/context/dev/project-078-normative-loading-promotion-and-decomposition/sprint-001-promotion-and-followup-decomposition/tasks/DA-749-normative-loading-promotion-and-rollout-decomposition-handoff.md`

## 1. 目标

1. 将 `technical-solution.normative-loading-manifest-lifecycle-compaction-and-staged-sharding` 从 formal direction 推进到真实的 archive split / deprecated compact 治理交付。
2. 先补 archive manifest schema、root bootstrap truth preservation 与 archived-entry zero-baseline，再补 compact automation、archive integrity gate 与 monthly audit enforcement。
3. 保持“root manifest 继续是唯一 bootstrap truth，archive manifest 只是 historical sidecar，active sharding 继续 deferred”的长期边界。

## 2. Sprint 细化

## 2.1 sprint-001-archive-split-and-bootstrap-truth-preservation

- Status: completed
- Sprint Goal: 冻结 archive manifest schema、manifest lifecycle governance doc 与 root bootstrap truth preservation baseline。
- Task Package: `TK-751`、`TK-752`、`TK-757`。

## 2.2 sprint-002-deprecated-compact-and-archive-integrity-automation

- Status: active
- Sprint Goal: 打通 deprecated grace-window compaction、archive integrity gate 与 monthly audit enforcement。
- Task Package: `TK-753`、`TK-754`、`TK-758`。

## 2.3 sprint-003-parser-compatibility-and-project-closeout

- Status: planned
- Sprint Goal: 收口 parser/gate compatibility、rollback guidance、migration evidence 与 project-final closeout。
- Task Package: `TK-755`、`TK-756`、`TK-759`、`TK-760`。

## 3. 任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | status |
|---|---|---|---|---|---|
| TK-751 | sprint-001 | freeze archive manifest schema and lifecycle governance surface | contract/foundation | formal module docs | completed |
| TK-752 | sprint-001 | implement archive split and root manifest archived-entry compaction baseline | governance/implementation | TK-751 | completed |
| TK-753 | sprint-002 | implement deprecated grace-window compaction command and dry-run report | automation/implementation | TK-752 | active |
| TK-754 | sprint-002 | add archive integrity gate and monthly audit enforcement | gate/automation | TK-753 | planned |
| TK-755 | sprint-003 | finalize parser and gate compatibility plus rollback guidance | compatibility/governance | TK-754 | planned |
| TK-756 | sprint-003 | run governance closeout and migration evidence refresh | verification/closeout | TK-755 | planned |
| TK-757 | sprint-001 | sprint-001 exit acceptance and sprint-002 handoff readiness | closeout/handoff | TK-751、TK-752 | completed |
| TK-758 | sprint-002 | sprint-002 exit acceptance and sprint-003 handoff readiness | closeout/handoff | TK-753、TK-754 | planned |
| TK-759 | sprint-003 | sprint-003 exit acceptance and project-final closeout readiness | closeout/handoff | TK-755、TK-756 | planned |
| TK-760 | sprint-003 | finalize project-079 closeout and completion audit | closeout/final-audit | TK-759 | planned |

## 4. 依赖产物策略

1. sprint-001 必须优先完成，因为后续 compact automation、archive integrity gate 与 closeout evidence 都依赖 archive manifest schema 与 root bootstrap truth boundary先稳定。
2. sprint-002 只在 sprint-001 稳定后启动，避免 compact / archive-check 建在漂移中的 schema 上。
3. sprint-003 只在 archive split 与 compact automation 都闭环后再执行 parser/gate compatibility 与最终 closeout。
4. active sharding、`manifest_refs` 与 sqlite projection 不属于 `project-079` scope。

## 5. DoD（project-079）

1. root manifest 中 `archived` backlog 已收缩到受控零基线。
2. archive manifest 与 root manifest 的 `doc_id/path/status` 边界可通过 gate 稳定校验。
3. `deprecated -> archived` 的 grace-window compaction 支持 `dry-run`，并纳入 monthly audit。
4. parser/gate compatibility、rollback guidance 与 governance docs 保持 truthfulness。
5. project closeout 时保留至少一条正式 migration / audit evidence。

## 6. 里程碑记录

1. 2026-04-11：基于 `technical-solution.normative-loading-manifest-lifecycle-compaction-and-staged-sharding` promotion cutover 创建 `project-079`，作为新的 planned follow-up stream。
2. 2026-04-11：已将 `sprint-001 ~ sprint-003` 与 `TK-751 ~ TK-760` 全量拆解写入 project / sprint / task surface，待后续窗口按顺序激活。
3. 2026-04-11：`project-079 / sprint-001` 已切换为 active primary stream，开始执行 archive split + bootstrap truth preservation baseline。
4. 2026-04-11：sprint-001 已完成 archive split baseline、双轮 delegated CR 与 exit acceptance，下一步进入 sprint-002 implementation。
5. 2026-04-11：`TK-757 / DA-757` 已完成 sprint-001 closeout handoff，`sprint-002` 接管为新的 primary implementation stream。
