# checklist

- [x] TK-495 establish session.main capability descriptor seed-view contract and canonical catalog baseline
  - 2026-04-02：任务创建，状态初始化为 `planned`；承接 capability seed/view contract、single-source catalog owner seam 与 shared 常量冻结。
  - 2026-04-03：状态切换为 `active`；主执行流切换到 `project-038 / sprint-001`，开始冻结 service-owned capability catalog baseline 与 localized descriptor view contract。
  - 2026-04-03：完成 `SESSION_MAIN_CAPABILITY_ID / ANSWER_KIND` 常量、descriptor seed/view 契约、canonical catalog class 与 skill registry metadata cutover。
  - 2026-04-03：验证通过 package tests、session-main parity integration、i18n parity、ledger gates、`pnpm run check` 与 `pnpm run build`；任务收口为 `completed`。

- [x] TK-496 cut over CLI help appendix and governed command discoverability to single-source capability catalog
  - 2026-04-02：任务创建，状态初始化为 `planned`；承接 CLI help appendix、governed slash discoverability 与 catalog truth 的首轮收敛。
  - 2026-04-03：状态切换为 `active`；开始实现 CLI help appendix 对 governed capability card 的 catalog 驱动渲染，以及 builtin/local bridge 与 governed discoverability metadata 的分层收敛。
  - 2026-04-03：完成 top-level/command help appendix 的 catalog cutover、governed slash discoverability metadata 分层与 `/review verify` discoverability 补齐；验证通过 `vitest apps/cli/test`、`check-i18n-parity-fallback`、`check-task-ledger-sync`、`check-sprint-plan-status-sync`、`pnpm run build` 与 `pnpm run check`。

- [x] TK-497 add session.main capability intent routing and explanation answer generation
  - 2026-04-02：任务创建，状态初始化为 `planned`；承接 capability overview/detail/examples/comparison routing 与 structured answer generation。
  - 2026-04-03：状态切换为 `active`；开始实现 capability explainer classifier、dispatcher precedence 与 `SessionMainCapabilityAnswer` baseline。
  - 2026-04-03：完成 overview/detail/examples/comparison explainer answer、dispatcher answer route 优先级与 shared turn outcome structured answer baseline。
  - 2026-04-03：验证通过 `vitest(core-orchestration-service/test)`、`pnpm run build` 与 `pnpm run check`；任务收口为 `completed`。

- [x] TK-498 project capability explanation metadata into shared session truth and transcript affordances
  - 2026-04-02：任务创建，状态初始化为 `planned`；承接 shared session DTO、turn outcome payload、CLI transcript affordance 与 suggested action contract。
  - 2026-04-03：状态切换为 `active`；开始把 capability explanation metadata 写入 canonical `TURN_COMPLETED` payload，并让 transcript markdown answer 消费 suggested action affordance。
  - 2026-04-03：完成 canonical `TURN_COMPLETED` metadata projection、transcript markdown suggested-action affordance 与 capability answer resume parity；验证通过 targeted vitest、`pnpm run build` 与 `pnpm run check`。
  - 2026-04-03：CR 复核认可并修复 availability explanation 泄露 internal routing marker 的问题；现已改为本地化的人类可读标签，验证通过 targeted vitest 与 `pnpm run build`，对应 CR 已收口为 `resolved_code_review_working-tree-20260403-2349.md`。

- [x] TK-499 add capability availability overlay governed execution bridge and sprint-001 exit acceptance
  - 2026-04-02：任务创建，状态初始化为 `planned`；承接 availability overlay、explainer-to-skill governed bridge 与 sprint-001 验收收口。
  - 2026-04-03：状态切换为 `active`；开始将 capability explanation 与动态 availability overlay、同轮 governed execution bridge 和 sprint-001 exit acceptance 结论一起收口。
  - 2026-04-03：完成 capability availability overlay、same-turn governed bridge、command recap explanation markdown continuity 与 sprint-001 exit acceptance summary；验证通过 package/app tests、`pnpm run build`、`pnpm run check` 与治理门禁。
  - 2026-04-03：CR 复核认可并修复 local-only `plan` / `review_verify` 被错误纳入 surface gating 的问题；未接入 workspace 下这两个能力现保持 `available`，验证通过 targeted vitest 与 `pnpm run build`，对应 CR 已收口为 `resolved_code_review_working-tree-20260403-2349.md`。
