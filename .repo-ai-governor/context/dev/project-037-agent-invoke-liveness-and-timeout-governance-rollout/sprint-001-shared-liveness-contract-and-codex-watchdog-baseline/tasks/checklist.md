# checklist

- [x] TK-486 implement shared invoke liveness runtime telemetry and watchdog baseline
  - 2026-04-02：任务创建，状态初始化为 `planned`；承接 shared invoke-liveness state machine、reason code、timeout budget 与 telemetry baseline。
  - 2026-04-03：治理纠偏回填为 `completed`；shared invoke-liveness runtime、telemetry hook、timeout budget 与 execution/session projection seam 已由 `TK-488`、`TK-501`、`TK-502` 的后续 rollout 实质吸收交付，残余 Codex-specific graceful interrupt closeout 已迁移到 `sprint-003 / TK-487`。

- [x] TK-492 prepare api-key remote adapter invocation technical solution promotion readiness and follow-up mapping
  - 2026-04-02：任务创建并直接执行；范围限定为 draft promotion-readiness，不执行 formal cutover。
  - 2026-04-02：已生成 `code_review_tk-492-api-key-remote-adapter-invocation-promotion-readiness.md`，沉淀 review path 与 promotion notes。
  - 2026-04-02：已在 `technical-solution-lifecycle-registry.yaml` 中登记 `technical-solution.api-key-remote-adapter-invocation` 为 `review_pending`，并锚定 `runtime.agent-projection` 与 follow-up delivery mapping。
  - 2026-04-02：已通过 targeted governance checks：`check-technical-solution-lifecycle-registry`、`check-task-ledger-sync`、`check-sprint-plan-status-sync`、`check-code-review-status-sync`。
  - 2026-04-03：已复核并将 review artifact 推进为 `verified_code_review_tk-492-api-key-remote-adapter-invocation-promotion-readiness.md`；当前证据确认当时的 readiness 判断成立，formal promotion 已由 `TK-500` 与后续 sprint-002 交付闭环承接。

- [x] TK-493 align active invoke liveness formal solution with amended orchestration projection and diagnostics boundaries
  - 2026-04-02：任务创建并直接执行；范围限定为 active formal solution amendment，不重新做 draft -> formal 首次 promotion。
  - 2026-04-02：已同步 active formal contract/ADR，明确 execution summary / event stream 投影要求，以及 `doctor/verify` 与 runtime diagnostics 的职责边界。
  - 2026-04-02：已生成 `DA-493-active-invoke-liveness-formal-solution-amendment-alignment.md`，承接本次 amendment 的 outputs 与验证命令。
  - 2026-04-02：已通过 targeted governance checks：`check-technical-solution-lifecycle-registry`、`check-technical-solution-delivery-registry`、`check-technical-solution-module-graph`、`check-normative-loading-manifest --mode block`、`check-docs-triad-sync`、`check-task-ledger-sync`、`check-sprint-plan-status-sync`、`check-code-review-status-sync`、`check-artifact-registry-lifecycle`。

- [x] TK-494 promote session-main capability explainer and contextual guidance draft into active interactive-cli formal docs
  - 2026-04-02：任务创建并直接执行；范围限定为 approved draft -> active interactive-cli formal solution amendment，不新建并列 active solution id。
  - 2026-04-02：已同步 `runtime.cli-interactive-shell` 与 `runtime.orchestration` formal docs，正式接受 capability explainer、governed capability catalog 与 shared-session capability metadata 投影边界。
  - 2026-04-02：已生成 `resolved_code_review_tk-494-session-main-capability-explainer-and-contextual-guidance-promotion-cutover.md` 与 `DA-494-session-main-capability-explainer-and-contextual-guidance-promotion-cutover.md`。
  - 2026-04-02：已同步 interactive-cli active solution 的 lifecycle version bump、delivery rollout evidence 与 artifact registry。

- [x] TK-500 promote api-key remote adapter invocation draft into active runtime-agent-projection formal docs
  - 2026-04-02：任务创建并直接执行；范围限定为 approved draft -> active `runtime.agent-projection` formal solution cutover。
  - 2026-04-02：已同步 `runtime.agent-projection` module overview、onboarding/projection/probe/liveness contracts 与新的 `remote-api transport and provider binding seam` ADR。
  - 2026-04-02：已生成 `resolved_code_review_tk-500-api-key-remote-adapter-invocation-promotion-cutover.md` 与 `DA-500-api-key-remote-adapter-invocation-technical-solution-promotion.md`。
  - 2026-04-02：已同步 lifecycle status=`active`、delivery handoff=`followup_required`、planned `TK-501` 承接任务与 artifact registry。
