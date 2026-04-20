# project-116-vscode-direct-provider-onboarding-rollout 计划

- Status: active
- Date: 2026-04-20
- Stage Mapping: runtime governance-clients rollout
- Phase Mapping: VS Code provider onboarding / direct API key entry / secret-backed credentialRef / readiness and support truth
- Upstream:
  - `.repo-ai-governor/draft/approved_solution_review_vscode-plugin-direct-api-key-and-secret-backed-provider-onboarding.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/provider-onboarding-and-direct-api-key-entry-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/vscode-plugin-direct-api-key-and-secret-backed-provider-onboarding.md`

## 1. 目标

1. 将 VS Code 插件的人类默认 provider onboarding 路径切换为 direct API key entry，而不是 env-var-first authoring。
2. 保持 Governor managed secret backend 与 credentialRef canonical boundary，不让 connect/doctor/verify 失去 analyze-first 语义。
3. 在 built-source checkout 与 local VSIX 两条路径上收口 direct-onboarding runtime evidence、docs truth 与 clean-room validation。

## 2. Sprint 细化

## 2.1 sprint-001-contract-and-provider-onboarding-facade

- Status: active
- Sprint Goal: Freeze the provider-onboarding contract, explicit mutation seam, and owner split baseline.
- Task Package: `TK-1004、TK-1005、TK-1006`

## 2.2 sprint-002-plugin-native-direct-api-key-entry

- Status: planned
- Sprint Goal: Land plugin-native direct API key entry, managed secret write, and non-secret provider config persistence.
- Task Package: `TK-1007、TK-1008、TK-1009`

## 2.3 sprint-003-readiness-cta-and-provider-lifecycle

- Status: planned
- Sprint Goal: Converge readiness surfaces, CTA mapping, and provider lifecycle flows around the onboarding facade.
- Task Package: `TK-1010、TK-1011、TK-1012`

## 2.4 sprint-004-docs-distribution-and-workbench-evidence

- Status: planned
- Sprint Goal: Collect built-source and local-VSIX evidence and prepare docs/support truth refresh for direct onboarding.
- Task Package: `TK-1013、TK-1014、TK-1015`

## 2.5 sprint-005-clean-room-validation-and-rollout-closeout

- Status: planned
- Sprint Goal: Complete zero-env-var clean-room validation, claim-parity review, and rollout closeout.
- Task Package: `TK-1016、TK-1017、TK-1018`

## 3. 任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | status |
| --- | --- | --- | --- | --- | --- |
| TK-1004 | sprint-001-contract-and-provider-onboarding-facade | freeze direct-api-key onboarding contract and owner split | contract baseline | scaffold baseline | in_progress |
| TK-1005 | sprint-001-contract-and-provider-onboarding-facade | decompose service-native provider-onboarding snapshot apply and receipt facade | service seam | freeze direct-api-key onboarding contract and owner split | planned |
| TK-1006 | sprint-001-contract-and-provider-onboarding-facade | prepare sprint-001 handoff and activation recommendation | governance handoff | decompose service-native provider-onboarding snapshot apply and receipt facade | planned |
| TK-1007 | sprint-002-plugin-native-direct-api-key-entry | implement plugin-native direct api key entry and secure capture | workbench surface | prepare sprint-001 handoff and activation recommendation | planned |
| TK-1008 | sprint-002-plugin-native-direct-api-key-entry | persist managed secret credentialRef and provider config through explicit mutation seam | mutation seam | implement plugin-native direct api key entry and secure capture | planned |
| TK-1009 | sprint-002-plugin-native-direct-api-key-entry | verify plugin human path exits env-var-first onboarding | verification handoff | persist managed secret credentialRef and provider config through explicit mutation seam | planned |
| TK-1010 | sprint-003-readiness-cta-and-provider-lifecycle | converge overview status and doctor cta mapping with provider-onboarding snapshot | readiness surface | verify plugin human path exits env-var-first onboarding | planned |
| TK-1011 | sprint-003-readiness-cta-and-provider-lifecycle | land update-api-key reconnect-provider and degraded-state guidance | lifecycle UX | converge overview status and doctor cta mapping with provider-onboarding snapshot | planned |
| TK-1012 | sprint-003-readiness-cta-and-provider-lifecycle | verify provider lifecycle readiness parity and sprint handoff | verification handoff | land update-api-key reconnect-provider and degraded-state guidance | planned |
| TK-1013 | sprint-004-docs-distribution-and-workbench-evidence | refresh vscode direct-onboarding docs and copy against runtime evidence | docs package | verify provider lifecycle readiness parity and sprint handoff | planned |
| TK-1014 | sprint-004-docs-distribution-and-workbench-evidence | capture built-source and local-vsix direct-onboarding evidence | evidence bundle | refresh vscode direct-onboarding docs and copy against runtime evidence | planned |
| TK-1015 | sprint-004-docs-distribution-and-workbench-evidence | prepare support-truth boundary recommendation and sprint handoff | support truth handoff | capture built-source and local-vsix direct-onboarding evidence | planned |
| TK-1016 | sprint-005-clean-room-validation-and-rollout-closeout | run zero-env-var clean-room rehearsal and failure-path validation | clean-room evidence | prepare support-truth boundary recommendation and sprint handoff | planned |
| TK-1017 | sprint-005-clean-room-validation-and-rollout-closeout | review rollout claim parity and remaining cli compatibility wording | support truth review | run zero-env-var clean-room rehearsal and failure-path validation | planned |
| TK-1018 | sprint-005-clean-room-validation-and-rollout-closeout | close rollout project and publish completion audit | project closeout | review rollout claim parity and remaining cli compatibility wording | planned |

## 4. 依赖产物策略

1. task decomposition 产物优先回链到 project/sprint plan 与 canonical task cards。
2. review lifecycle 产物只在真正进入 review 窗口后生成，不在 bootstrap 阶段预写。
3. closeout / completion audit summary 只在终态窗口创建并回链。

## 5. DoD（project-116-vscode-direct-provider-onboarding-rollout）

1. 5 个 sprint 的 plan、task cards、checklist、tasks.csv 与 review scaffold 已标准化落盘。
2. 任务编号、目录结构与命名规则符合 AGENTS 与 governance template 约束。
3. 在正式激活前已有明确的 task-ledger canonicalization 路径，且只需要按顺序激活执行面。

## 6. 里程碑记录

1. 2026-04-20：创建 project-116-vscode-direct-provider-onboarding-rollout 全量执行流骨架，覆盖 sprint-001-contract-and-provider-onboarding-facade、sprint-002-plugin-native-direct-api-key-entry、sprint-003-readiness-cta-and-provider-lifecycle、sprint-004-docs-distribution-and-workbench-evidence、sprint-005-clean-room-validation-and-rollout-closeout。
2. 2026-04-20：`project-115` 完成 final closeout 后，当前 project 已切换为 active，并将 `sprint-001-contract-and-provider-onboarding-facade` 激活为新的 primary execution surface；`TK-1004` 进入 `in_progress`。

## 7. 里程碑记录入口

1. 待 closeout 后补齐 completion audit summary。
