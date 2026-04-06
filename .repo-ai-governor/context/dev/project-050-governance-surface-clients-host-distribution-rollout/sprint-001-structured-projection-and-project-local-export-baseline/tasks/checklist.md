# checklist

- [x] TK-574 freeze structured projection registry and host export manifest contract
  - 2026-04-06：任务创建，状态初始化为 `planned`。
  - 2026-04-06：随 `sprint-001` 激活切换为 `active`，开始冻结 structured projection registry、host-export manifest 与 staged/apply baseline。
  - 2026-04-06：已完成 shared host distribution contract、registry 与 module docs 同步冻结。
- [x] TK-575 implement codex and claude-code project-local renderer plus staged export baseline
  - 2026-04-06：任务创建，状态初始化为 `planned`。
  - 2026-04-06：已完成 Codex / Claude Code project-local renderer、staged export、apply report 与 verification summary 落地。
- [x] TK-576 close structured projection and project-local export baseline with Codex and Claude Code smoke acceptance
  - 2026-04-06：任务创建，状态初始化为 `planned`。
  - 2026-04-06：已完成 Codex / Claude Code export/apply/verify smoke acceptance，并通过 sprint review 与 host-command blocking CR loop 收口。
- [x] CR-001 host command blocking verification
  - 2026-04-06：delegated reviewer 发现 reserved target verify false success、missing receipt fail-open 与 host runtime i18n bridge 缺口。
  - 2026-04-06：主 agent 已完成复核、修复、build/test 重跑，并将对应 review artifact 收口为 `resolved`。
- [x] CR-002 host command clean recheck
  - 2026-04-06：fresh reviewer 子 agent `Dalton` 执行 post-fix recheck。
  - 2026-04-06：reviewer 明确返回当前 host-distribution 修复边界无 actionable findings。
