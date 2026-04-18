# project-114-vscode-plugin-full-ownership-and-zero-cli-user-path 计划

- Status: active
- Date: 2026-04-18
- Stage Mapping: technical solution rollout follow-up
- Phase Mapping: plugin-full-ownership contract / zero-cli bootstrap / service-native adopt-host / plugin-primary authoring / support-truth migration
- Upstream:
  - `.repo-ai-governor/context/dev/project-111-vscode-workbench-solution-promotion-and-decomposition/sprint-001-promotion-and-rollout-handoff/tasks/DA-934-vscode-workbench-promotion-and-rollout-decomposition-handoff.md`
  - `.repo-ai-governor/context/dev/project-108-adopter-quickstart-bootstrap-rollout/sprint-001-quickstart-contract-and-bootstrap-runtime-baseline/tasks/DA-900-adopter-quickstart-bootstrap-promotion-and-rollout-handoff.md`
  - `.repo-ai-governor/context/dev/project-101-cli-exec-followup-solution-review-and-promotion/sprint-003-onboarding-adoption-readiness/tasks/DA-852-cli-exec-onboarding-and-adoption-readiness-promotion-cutover.md`
  - `.repo-ai-governor/context/dev/project-101-cli-exec-followup-solution-review-and-promotion/sprint-004-acp-host-facing-transport-formalization/tasks/DA-855-acp-host-facing-transport-formalization-promotion-cutover.md`
  - `.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/project-113-vscode-primary-workbench-full-cutover-completion-audit-summary.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/vscode-governance-workbench-surface-contract.md`
  - `apps/vscode-extension/README.md`

## 1. 目标

1. Move the remaining user-facing governance entry flows into the VS Code plugin so built-source and local-VSIX users can manage repository development without a required CLI path.
2. Retire temporary user-visible CLI bridges while keeping local_orchestration_service as the only truth owner and preserving trust-sensitive editor guardrails.
3. Close support truth, migration guidance, and CLI deprecation posture only after plugin-first evidence proves the zero-CLI user path.

## 2. Sprint 细化

## 2.1 sprint-001-contract-bootstrap-and-readiness-cutover

- Status: completed
- Sprint Goal: Freeze the plugin full-ownership and zero-CLI bootstrap boundary, and establish the editor-native readiness cutover baseline.
- Task Package: `TK-963、TK-964、TK-965、TK-966、TK-983`

## 2.2 sprint-002-doctor-check-and-workspace-bootstrap-cutover

- Status: completed
- Sprint Goal: Complete plugin-primary doctor, check, and workspace bootstrap flows so users no longer need a visible CLI bootstrap path.
- Task Package: `TK-967、TK-968、TK-969、TK-970、TK-984`

## 2.3 sprint-003-adopt-host-verify-upgrade-service-native-cutover

- Status: active
- Sprint Goal: Complete service-native adopt, host, verify, and upgrade flows in VS Code and exit the temporary CLI bridge for user-facing execution.
- Task Package: `TK-971、TK-972、TK-973、TK-974、TK-985`

## 2.4 sprint-004-workflow-authoring-run-review-and-automation-primaryization

- Status: planned
- Sprint Goal: Make workflow authoring, run-control, review, and automation a plugin-primary user path with continuity-safe UX.
- Task Package: `TK-975、TK-976、TK-977、TK-978、TK-986`

## 2.5 sprint-005-support-truth-migration-and-cli-deprecation-closeout

- Status: planned
- Sprint Goal: Use plugin-first evidence to close support truth, migration guidance, and CLI deprecation posture for the zero-CLI user path.
- Task Package: `TK-979、TK-980、TK-981、TK-982、TK-987、TK-988`

## 3. 任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | status |
| --- | --- | --- | --- | --- | --- |
| TK-963 | sprint-001-contract-bootstrap-and-readiness-cutover | freeze plugin full-ownership and zero-cli bootstrap contract | contract baseline | DA-934;project-113 completion audit | completed |
| TK-964 | sprint-001-contract-bootstrap-and-readiness-cutover | implement plugin-native bootstrap and readiness service seams | service seam | freeze plugin full-ownership and zero-cli bootstrap contract | completed |
| TK-965 | sprint-001-contract-bootstrap-and-readiness-cutover | land editor-native bootstrap readiness and migration surfaces | workbench surface | implement plugin-native bootstrap and readiness service seams | completed |
| TK-966 | sprint-001-contract-bootstrap-and-readiness-cutover | prepare sprint-001 exit acceptance and sprint-002 handoff | governance handoff | land editor-native bootstrap readiness and migration surfaces | completed |
| TK-983 | sprint-001-contract-bootstrap-and-readiness-cutover | close sprint-001 boundary and activate sprint-002 execution surface | sprint closeout | prepare sprint-001 exit acceptance and sprint-002 handoff | completed |
| TK-967 | sprint-002-doctor-check-and-workspace-bootstrap-cutover | freeze doctor-check and workspace bootstrap cutover contract | cutover contract | prepare sprint-001 exit acceptance and sprint-002 handoff | completed |
| TK-968 | sprint-002-doctor-check-and-workspace-bootstrap-cutover | implement service-native doctor-check and workspace bootstrap seams | service seam | freeze doctor-check and workspace bootstrap cutover contract | completed |
| TK-969 | sprint-002-doctor-check-and-workspace-bootstrap-cutover | land workbench-native doctor-check and workspace bootstrap surfaces | workbench surface | implement service-native doctor-check and workspace bootstrap seams | completed |
| TK-970 | sprint-002-doctor-check-and-workspace-bootstrap-cutover | prepare sprint-002 exit acceptance and sprint-003 handoff | governance handoff | land workbench-native doctor-check and workspace bootstrap surfaces | completed |
| TK-984 | sprint-002-doctor-check-and-workspace-bootstrap-cutover | close sprint-002 boundary and activate sprint-003 execution surface | sprint closeout | prepare sprint-002 exit acceptance and sprint-003 handoff | completed |
| TK-971 | sprint-003-adopt-host-verify-upgrade-service-native-cutover | freeze adopt-host-verify-upgrade bridge-exit contract | bridge-exit contract | prepare sprint-002 exit acceptance and sprint-003 handoff | active |
| TK-972 | sprint-003-adopt-host-verify-upgrade-service-native-cutover | implement service-native adopt-host-verify-upgrade orchestration seams | service seam | freeze adopt-host-verify-upgrade bridge-exit contract | planned |
| TK-973 | sprint-003-adopt-host-verify-upgrade-service-native-cutover | land workbench-native adopt-host-verify-upgrade trust-sensitive surfaces | workbench surface | implement service-native adopt-host-verify-upgrade orchestration seams | planned |
| TK-974 | sprint-003-adopt-host-verify-upgrade-service-native-cutover | prepare sprint-003 exit acceptance and sprint-004 handoff | governance handoff | land workbench-native adopt-host-verify-upgrade trust-sensitive surfaces | planned |
| TK-985 | sprint-003-adopt-host-verify-upgrade-service-native-cutover | close sprint-003 boundary and activate sprint-004 execution surface | sprint closeout | prepare sprint-003 exit acceptance and sprint-004 handoff | planned |
| TK-975 | sprint-004-workflow-authoring-run-review-and-automation-primaryization | freeze plugin-primary workflow and automation contract | workflow contract | prepare sprint-003 exit acceptance and sprint-004 handoff | planned |
| TK-976 | sprint-004-workflow-authoring-run-review-and-automation-primaryization | implement workflow authoring run-control review and automation seams | service seam | freeze plugin-primary workflow and automation contract | planned |
| TK-977 | sprint-004-workflow-authoring-run-review-and-automation-primaryization | land workflow studio review and automation primary surfaces | workbench surface | implement workflow authoring run-control review and automation seams | planned |
| TK-978 | sprint-004-workflow-authoring-run-review-and-automation-primaryization | prepare sprint-004 exit acceptance and sprint-005 handoff | governance handoff | land workflow studio review and automation primary surfaces | planned |
| TK-986 | sprint-004-workflow-authoring-run-review-and-automation-primaryization | close sprint-004 boundary and activate sprint-005 execution surface | sprint closeout | prepare sprint-004 exit acceptance and sprint-005 handoff | planned |
| TK-979 | sprint-005-support-truth-migration-and-cli-deprecation-closeout | freeze support-truth migration and cli deprecation contract | support contract | prepare sprint-004 exit acceptance and sprint-005 handoff | planned |
| TK-980 | sprint-005-support-truth-migration-and-cli-deprecation-closeout | execute plugin-first evidence and migration rehearsal bundle | evidence bundle | freeze support-truth migration and cli deprecation contract | planned |
| TK-981 | sprint-005-support-truth-migration-and-cli-deprecation-closeout | refresh support docs deprecation posture and adoption guidance | support truth package | execute plugin-first evidence and migration rehearsal bundle | planned |
| TK-982 | sprint-005-support-truth-migration-and-cli-deprecation-closeout | prepare project-final closeout and zero-cli delivery recommendation | project closeout handoff | refresh support docs deprecation posture and adoption guidance | planned |
| TK-987 | sprint-005-support-truth-migration-and-cli-deprecation-closeout | close sprint-005 boundary and activate project-final reviewer loop | sprint closeout | prepare project-final closeout and zero-cli delivery recommendation | planned |
| TK-988 | sprint-005-support-truth-migration-and-cli-deprecation-closeout | finalize project-114 closeout and restore idle context | project final closeout | close sprint-005 boundary and activate project-final reviewer loop | planned |

## 4. 依赖产物策略

1. task decomposition 产物优先回链到 project/sprint plan 与 canonical task cards。
2. review lifecycle 产物只在真正进入 review 窗口后生成，不在 bootstrap 阶段预写。
3. closeout / completion audit summary 只在终态窗口创建并回链。

## 5. DoD（project-114-vscode-plugin-full-ownership-and-zero-cli-user-path）

1. 5 个 sprint 的 plan、task cards、checklist、tasks.csv 与 review scaffold 已标准化落盘。
2. 任务编号、目录结构与命名规则符合 AGENTS 与 governance template 约束。
3. 在正式激活前已有明确的 task-ledger canonicalization 路径，且只需要按顺序激活执行面。

## 6. 里程碑记录

1. 2026-04-18：创建 project-114-vscode-plugin-full-ownership-and-zero-cli-user-path 全量执行流骨架，覆盖 sprint-001-contract-bootstrap-and-readiness-cutover、sprint-002-doctor-check-and-workspace-bootstrap-cutover、sprint-003-adopt-host-verify-upgrade-service-native-cutover、sprint-004-workflow-authoring-run-review-and-automation-primaryization、sprint-005-support-truth-migration-and-cli-deprecation-closeout。
2. 2026-04-18：sprint-001 implementation gate 已完成首轮收敛，zero-cli bootstrap/readiness contract、service seam、editor-native surfaces、manifest parity 与 extension tests/build 证据已经落盘；随后进入多轮 fresh reviewer loop。
3. 2026-04-18：sprint-001 已完成 closeout 并写回 completed truth；current-context 已切换到 sprint-002-doctor-check-and-workspace-bootstrap-cutover 作为新的 active execution surface。
4. 2026-04-18：sprint-002 已完成 closeout 并写回 completed truth；current-context 已切换到 sprint-003-adopt-host-verify-upgrade-service-native-cutover 作为新的 active execution surface。

## 7. 里程碑记录入口

1. 待 closeout 后补齐 completion audit summary。
