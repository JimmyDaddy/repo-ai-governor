# checklist

- [x] TK-662 implement adopt diff upgrade remove lifecycle and drift-safe update policy
  - 2026-04-09：任务创建，状态初始化为 `planned`。
  - 2026-04-09：已实现 clean `adopt diff/upgrade/remove` lifecycle，并修正 upgrade action/result truth 与 managed-file-count 口径，确保 drift-safe update policy 保持 fail-closed。
  - 2026-04-09：project-final CR 发现 `adopt remove --force` 的 drift guard 实际退化为允许删除 drifted managed file；已修正 remove guard 并补齐 drift-remove integration regression，恢复 fail-closed contract truth。
- [x] TK-663 extend adoption verify and managed bundle artifact support
  - 2026-04-09：任务创建，状态初始化为 `planned`。
  - 2026-04-09：已扩展 adoption-level verify，使其覆盖 receipt provenance、managed-file drift、host apply artifacts 与 self-host sqlite bootstrap consistency，并补齐 regression evidence。
- [x] TK-671 sprint-004 exit acceptance and sprint-005 handoff readiness
  - 2026-04-09：在 `TK-662` 与 `TK-663` 全部完成后回补 `sprint-004` closeout task，并将下一边界固定为 `sprint-005-self-host-template-bootstrap-and-governance-authoring-surfaces`。
  - Closeout task completed: sprint-004 fixed to completed truth.
