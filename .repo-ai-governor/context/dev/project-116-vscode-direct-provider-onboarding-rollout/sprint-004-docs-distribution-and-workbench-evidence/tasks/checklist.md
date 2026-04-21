# checklist

- [x] TK-1013 refresh vscode direct-onboarding docs and copy against runtime evidence
  - 2026-04-20：任务创建，状态初始化为 `planned`。
  - 2026-04-21：`sprint-003-readiness-cta-and-provider-lifecycle` 已完成 closeout，当前任务切换为 `in_progress`，作为 `project-116 / sprint-004-docs-distribution-and-workbench-evidence` 的首个 active execution boundary。
  - 2026-04-21：先完成 built-source / local-VSIX 证据窗口，再按同窗口 snapshot 回写 README、VS Code README、adoption/maintainer playbook 与 support matrix 的保守 direct-onboarding wording，不提前宣称 sprint-005 才能证明的 zero-env-var clean-room 结论。
- [x] TK-1014 capture built-source and local-vsix direct-onboarding evidence
  - 2026-04-20：任务创建，状态初始化为 `planned`。
  - 2026-04-21：记录 built-source checkout 与 local VSIX 的 pack/distribution snapshot，并把 packaged root / extracted VSIX 的 module smoke、sidecar smoke、CLI-backed secure-authoring 与 scratch-isolated `doctor` 事实收敛到同一份 sprint-local immutable evidence bundle。
- [x] TK-1015 prepare support-truth boundary recommendation and sprint handoff
  - 2026-04-20：任务创建，状态初始化为 `planned`。
  - 2026-04-21：收敛 direct-provider-onboarding 支持边界建议，明确当前可以公开宣称“插件人类路径不再要求手工 `credentialEnvVar` authoring、raw API key 留在 managed secret backend、public docs 已对齐 built-source/local-VSIX 证据”，同时把 zero-env-var clean-room 证明与项目 closeout 保留给 sprint-005。
- [x] CR-001 sprint-004-docs-distribution-and-workbench-evidence delegated review loop round 1
  - 2026-04-21：任务创建，状态初始化为 `review_pending`。
  - 2026-04-21：delegated reviewer findings 已由主 agent 复核；唯一 actionable finding 是 `TK-1013 ~ TK-1015` completed ledger row 的 `recorded_at` 仍停留在 `2026-04-20`，该项已被接受并推进为同窗口 ledger 真值修复。
  - 2026-04-21：已把 `TK-1013 ~ TK-1015` 的 canonical task-card `Date` 校正为真实的 `2026-04-21` write-back 窗口，并重放 sprint ledger sync / review sync 校验；`CR-001` 收口为 `resolved`。
- [x] TK-1022 close sprint-004 boundary and activate sprint-005 execution surface
  - 2026-04-21：任务创建，用于承接 sprint-004 reviewer-clean 之后的 closeout、boundary gate 与 sprint-005 activation truth 切换。
  - 2026-04-21：`CR-001` 已 resolved；sprint-004 的 review/task truth、project plan、sprint plans、completed history 与 `current-context.md` 已统一切换到 closeout-ready / sprint-005 activation truth。
  - 2026-04-21：`TK-1016` 已在同窗口切换为 `in_progress`，作为 sprint-005 的首个 active execution boundary；下一步只保留 sprint-004 boundary gate 与 local commit。
