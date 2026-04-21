# checklist

- [x] TK-1010 converge overview status and doctor cta mapping with provider-onboarding snapshot
  - 2026-04-20：任务创建，状态初始化为 `planned`。
  - 2026-04-20：`sprint-002-plugin-native-direct-api-key-entry` 已完成 closeout write-back，当前任务切换为 `in_progress`，作为 `project-116 / sprint-003-readiness-cta-and-provider-lifecycle` 的首个 active execution boundary。
  - 2026-04-20：已将 provider lifecycle 投影接入 workbench overview、workflow studio 与 chat status surface，并把 `Connect Provider / Update API Key / Reconnect Provider / Run Doctor` 统一收敛为 host-level CTA 映射。
- [x] TK-1011 land update-api-key reconnect-provider and degraded-state guidance
  - 2026-04-20：任务创建，状态初始化为 `planned`。
  - 2026-04-20：已将 `Update API Key` / `Reconnect Provider` / degraded `Run Doctor` 收敛为 provider lifecycle CTA，并保持所有动作继续落在现有 `runConnect` / `setManagedSecret` / `runDoctor` command seam 上。
- [x] TK-1012 verify provider lifecycle readiness parity and sprint handoff
  - 2026-04-20：任务创建，状态初始化为 `planned`。
  - 2026-04-20：已补齐 sprint-003 的 provider lifecycle parity evidence，覆盖 targeted extension tests、`pnpm run build` 与 `pnpm run test:packages`，并新增 readiness parity handoff 摘要供 sprint-004 继续消费。
- [x] CR-001 sprint-003-readiness-cta-and-provider-lifecycle delegated review loop round 1
  - 2026-04-21：任务创建，状态初始化为 `review_pending`。
  - 2026-04-21：delegated reviewer findings 已由主 agent 复核；`F-001`（connect payload 透传）与 `F-003`（provider lifecycle i18n）被接受进入修复，`F-002` 作为 fail-open 设计取舍记录保留，当前任务状态推进为 `verified`。
  - 2026-04-21：accepted findings 已完成修复并通过 targeted VS Code tests、`pnpm run build` 与 `pnpm run test:packages` 复核；`CR-001` 收口为 `resolved`。
- [x] TK-1021 close sprint-003 boundary and activate sprint-004 execution surface
  - 2026-04-21：任务创建，用于承接 sprint-003 reviewer-clean 之后的 closeout、boundary gate 与 sprint-004 activation truth 切换。
  - 2026-04-21：`CR-001` 已 resolved；sprint-003 的 review/task truth、project plan、sprint plans、completed history 与 `current-context.md` 已统一切换到 closeout-ready / sprint-004 activation truth。
  - 2026-04-21：`TK-1013` 已在同窗口切换为 `in_progress`，作为 sprint-004 的首个 active execution boundary；下一步只保留 sprint-003 boundary gate 与 local commit。
