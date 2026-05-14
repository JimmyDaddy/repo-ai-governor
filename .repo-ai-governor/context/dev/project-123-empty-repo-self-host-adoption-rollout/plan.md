# project-123-empty-repo-self-host-adoption-rollout 计划

- Status: in_progress
- Date: 2026-05-13
- Stage Mapping: technical solution rollout
- Phase Mapping: bootstrap transaction and self-host baseline / ownership and generated-artifact policy / activation and readiness UX / clean-room evidence and docs truthfulness
- Upstream:
  - `.repo-ai-governor/draft/approved_solution_review_empty-repo-self-host-adoption-follow-up.md`
  - `.repo-ai-governor/context/dev/project-122-empty-repo-self-host-adoption-promotion-and-decomposition/sprint-001-promotion-and-followup-decomposition/tasks/DA-1052-empty-repo-self-host-adoption-promotion-and-rollout-decomposition-handoff.md`
  - `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`
  - `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/governance-adoption-pack-install-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/empty-repo-self-host-adoption-follow-up.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/adoption-pack-installer-and-self-host-template-bootstrap.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/built-in-adoption-pack-parity-and-self-host-readiness-sync.md`

## 1. 目标

1. 将 technical-solution.empty-repo-self-host-adoption-follow-up 拆解为可直接映射到 adoption-pack runtime、receipt/drift semantics、doctor/verify diagnostics 与 docs truthfulness 的 implementation-ready rollout queue。
2. 按 Phase A -> Phase B -> Phase C -> Phase D 依次推进 empty-repo self-host first-run 修复、ownership/ignore taxonomy、activation/readiness UX 与 clean-room 回归。
3. 为 delivery registry 与 current-context.md 提供真实可激活的 planned follow-up stream，而不是悬空 follow-up 叙述。

## 2. Sprint 细化

## 2.1 sprint-001-bootstrap-transaction-and-self-host-baseline

- Status: completed
- Sprint Goal: 修复 empty-repo self-host first-run bootstrap/apply 冲突并补齐最小 self-host baseline
- Task Package: `TK-1054、TK-1055、TK-1056`

## 2.2 sprint-002-ownership-and-generated-artifact-policy

- Status: completed
- Sprint Goal: 引入 ownership class、drift policy、receipt metadata 与 generated artifact ignore policy
- Task Package: `TK-1057、TK-1058、TK-1059`

## 2.3 sprint-003-activation-and-readiness-ux

- Status: active
- Sprint Goal: 引入 canonical self-host activation/readiness phase，并收敛 verify/doctor/check 的职责分层与提示面
- Task Package: `TK-1060、TK-1061、TK-1062`

## 2.4 sprint-004-clean-room-evidence-and-docs-truthfulness

- Status: planned
- Sprint Goal: 完成 empty-repo self-host clean-room rehearsal、support truth 对齐与 project closeout
- Task Package: `TK-1063、TK-1064`

## 3. 任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | status |
| --- | --- | --- | --- | --- | --- |
| TK-1054 | sprint-001-bootstrap-transaction-and-self-host-baseline | fix empty-repo self-host bootstrap transaction and managed apply boundary | runtime/bootstrap | approved solution review | planned |
| TK-1055 | sprint-001-bootstrap-transaction-and-self-host-baseline | seed minimal self-host adapters and storage baseline | runtime/template-baseline | fix empty-repo self-host bootstrap transaction and managed apply boundary | planned |
| TK-1056 | sprint-001-bootstrap-transaction-and-self-host-baseline | close sprint-001 and hand off ownership policy implementation | governance/handoff | seed minimal self-host adapters and storage baseline | completed |
| TK-1057 | sprint-002-ownership-and-generated-artifact-policy | implement self-host ownership classes and receipt metadata baseline | receipt/ownership | close sprint-001 and hand off ownership policy implementation | completed |
| TK-1058 | sprint-002-ownership-and-generated-artifact-policy | align drift upgrade remove and gitignore recommendation semantics | drift/git-policy | implement self-host ownership classes and receipt metadata baseline | completed |
| TK-1059 | sprint-002-ownership-and-generated-artifact-policy | close sprint-002 and hand off activation readiness work | governance/handoff | align drift upgrade remove and gitignore recommendation semantics | completed |
| TK-1060 | sprint-003-activation-and-readiness-ux | implement canonical self-host activation phase and verification summary | verify/readiness | close sprint-002 and hand off activation readiness work | completed |
| TK-1061 | sprint-003-activation-and-readiness-ux | align doctor and check additive readiness diagnostics and next actions | doctor/check-diagnostics | implement canonical self-host activation phase and verification summary | completed |
| TK-1062 | sprint-003-activation-and-readiness-ux | close sprint-003 and hand off clean-room truthfulness follow-through | governance/handoff | align doctor and check additive readiness diagnostics and next actions | completed |
| TK-1063 | sprint-004-clean-room-evidence-and-docs-truthfulness | run empty-repo self-host clean-room rehearsal and capture rollout evidence | clean-room/evidence | close sprint-003 and hand off clean-room truthfulness follow-through | active |
| TK-1064 | sprint-004-clean-room-evidence-and-docs-truthfulness | refresh self-host docs truth and finalize rollout closeout | docs/closeout | run empty-repo self-host clean-room rehearsal and capture rollout evidence | planned |

## 4. 依赖产物策略

1. task decomposition 产物优先回链到 project/sprint plan 与 canonical task cards。
2. review lifecycle 产物只在真正进入 review 窗口后生成，不在 bootstrap 阶段预写。
3. `DA-1052` 作为首跳 promotion/decomposition handoff 固定保留在执行输入面；其余历史 promotion 证据与旧 ADR 进入 traceback references。
4. closeout / completion audit summary 只在终态窗口创建并回链。

## 5. DoD（project-123-empty-repo-self-host-adoption-rollout）

1. 4 个 sprint 的 plan、task cards、checklist、tasks.csv 与 review scaffold 已标准化落盘。
2. 任务编号、目录结构与命名规则符合 AGENTS 与 governance template 约束。
3. 各 sprint 的 task card `Required Inputs` 已收敛到首跳 handoff + 当前 sprint context + 直接 formal truth，不再把大批历史资料塞入默认执行输入面。
4. 在正式激活前已有明确的 task-ledger canonicalization 路径，且只需要按顺序激活执行面。

## 6. 里程碑记录

1. 2026-05-13：创建 project-123-empty-repo-self-host-adoption-rollout 全量执行流骨架，覆盖 sprint-001-bootstrap-transaction-and-self-host-baseline、sprint-002-ownership-and-generated-artifact-policy、sprint-003-activation-and-readiness-ux、sprint-004-clean-room-evidence-and-docs-truthfulness。
2. 2026-05-14：按 `workspace-task-decomposition` 协议完成 planned scaffold canonicalization，将 direct upstream 收敛到 `DA-1052 + active ADR/contract`，并保持 current-context 为 idle + planned follow-up。
3. 2026-05-14：按 `workspace-scoped-cr-loop` 完成 sprint-001 bootstrap baseline 的 fresh CR clean closeout，`TK-1056 / DA-1056` 已将 primary execution surface 切换到 `sprint-002`，后续 sprint 保持顺序推进。
4. 2026-05-14：按 `workspace-scoped-cr-loop` 完成 sprint-002 ownership/drift semantics 的 fresh CR clean closeout，`TK-1059 / DA-1059` 已将 primary execution surface 切换到 `sprint-003`，`sprint-004` 继续保持 planned follow-up。
5. 2026-05-14：sprint-003 的 `TK-1060 / TK-1061` 已完成并收口首轮 delegated CR 修复；随后 `CR-002 ~ CR-004` 继续完成 self-host readiness 与 `check` locale-aware output clean recheck，`DA-1062` 已将 primary execution surface 切换到 sprint-004 clean-room evidence boundary。

## 7. 里程碑记录入口

1. 待 closeout 后补齐 completion audit summary。
